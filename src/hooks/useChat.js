import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useChatPresence } from '@/components/ChatPresenceTracker';
import { useToast } from '@/components/ui/use-toast';

const CHAT_PROFILE_SELECT = 'id, full_name, avatar_url';
const CHAT_REQUEST_COOLDOWN_MS = 10000;

const isTransientChatError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return message.includes('failed to fetch')
    || message.includes('network')
    || message.includes('insufficient_resources')
    || message.includes('timeout');
};

const USER_PANEL_PROFILE_SELECT = 'id, full_name, username, avatar_url, phone, address, role, city, country, gender, interests, is_city_public, is_country_public, is_gender_public, is_interests_public, is_profile_public, updated_at';

const normalizeChatProfile = (profile, fallbackId = null) => ({
  id: profile?.id ?? fallbackId,
  full_name: profile?.full_name ?? null,
  avatar_url: profile?.avatar_url ?? null,
});

export const useChat = () => {
  const { user } = useAuth();
  const { onlineUsers } = useChatPresence();
  const { toast } = useToast();
  const userId = user?.id || null;
  
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const messageSubscription = useRef(null);
  const toastRef = useRef(toast);
  const roomsRetryAfterRef = useRef(0);
  const blockedRetryAfterRef = useRef(0);
  const lastErrorKeyRef = useRef({ key: '', at: 0 });

  // Local state for unread rooms, persisting in localStorage
  const [unreadRooms, setUnreadRooms] = useState(() => {
    try {
      const stored = localStorage.getItem('chat_unread_rooms');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('chat_unread_rooms', JSON.stringify(unreadRooms));
    } catch (err) {
      console.error(err);
    }
  }, [unreadRooms]);

  // Audio synthesizer beep helper using browser Web Audio API
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.18);
    } catch (err) {
      console.log('Audio context playback failed:', err);
    }
  };

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const logChatErrorOnce = useCallback((scope, error) => {
    const message = error?.message || 'chat_error';
    const key = `${scope}:${message}`;
    const now = Date.now();

    if (lastErrorKeyRef.current.key === key && now - lastErrorKeyRef.current.at < 10000) {
      return;
    }

    lastErrorKeyRef.current = { key, at: now };
    console.error(scope, error);
  }, []);

  // Fetch Blocked Users
  const fetchBlockedUsers = useCallback(async () => {
    if (!userId) return;

    const now = Date.now();
    if (blockedRetryAfterRef.current > now) {
      return;
    }

    const { data, error } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId);
    if (error) {
      logChatErrorOnce('Error fetching blocked users:', error);
      if (isTransientChatError(error)) {
        blockedRetryAfterRef.current = Date.now() + CHAT_REQUEST_COOLDOWN_MS;
      }
      return;
    }

    blockedRetryAfterRef.current = 0;
    if (data) {
      setBlockedUsers(data.map(b => b.blocked_id));
    }
  }, [userId, logChatErrorOnce]);

  const [communityUsers, setCommunityUsers] = useState([]);

  // Fetch Community Users (Registered Profiles)
  const fetchCommunityUsers = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .neq('id', userId)
        .limit(50);

      if (!error && data) {
        setCommunityUsers(data.map(p => ({
          id: p.id,
          full_name: p.full_name || 'Usuario Casa Smoke',
          avatar_url: p.avatar_url,
          role: p.role,
        })));
      }
    } catch (err) {
      console.error('Error fetching community users:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchBlockedUsers();
    fetchCommunityUsers();
  }, [fetchBlockedUsers, fetchCommunityUsers]);

  // 2. Fetch User's Rooms
  const fetchRooms = useCallback(async () => {
    if (!userId) {
      setRooms([]);
      setLoadingRooms(false);
      return;
    }

    const now = Date.now();
    if (roomsRetryAfterRef.current > now) {
      setLoadingRooms(false);
      return;
    }

    setLoadingRooms(true);
    
    try {
      const { data: participantData, error: partError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', userId);

      if (partError) throw partError;

      const roomIds = participantData.map(p => p.room_id);

      if (roomIds.length === 0) {
        setRooms([]);
        setLoadingRooms(false);
        return;
      }

      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;

      const { data: participantsData, error: participantsError } = await supabase
        .from('chat_participants')
        .select('room_id, user_id')
        .in('room_id', roomIds);

      if (participantsError) throw participantsError;

      const participantIds = [...new Set((participantsData || []).map((p) => p.user_id))];
      let profilesById = {};

      if (participantIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(CHAT_PROFILE_SELECT)
          .in('id', participantIds);

        if (profilesError) throw profilesError;

        profilesById = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }

      const participantsByRoom = (participantsData || []).reduce((acc, participant) => {
        if (!acc[participant.room_id]) acc[participant.room_id] = [];
        const profile = normalizeChatProfile(profilesById[participant.user_id], participant.user_id);
        acc[participant.room_id].push(profile);
        return acc;
      }, {});

      const formattedRooms = (roomsData || []).map((room) => {
        const parts = participantsByRoom[room.id] || [];
        let displayName = room.name;
        let displayImage = null;
        let otherParticipant = null;

        if (!room.is_group) {
          otherParticipant = parts.find((p) => p.id !== userId) || null;
          displayName = otherParticipant?.full_name || 'Chat Privado';
          displayImage = otherParticipant?.avatar_url || null;
        }

        return {
          ...room,
          displayName,
          displayImage,
          otherParticipant,
          participants: parts
        };
      });

      // Filter out conversations where the other user is blocked (optional, keeping visible but maybe disabled is better, but let's just keep them for now)
      roomsRetryAfterRef.current = 0;
      setRooms(formattedRooms);
    } catch (error) {
      logChatErrorOnce('Error fetching rooms:', error);
      if (isTransientChatError(error)) {
        roomsRetryAfterRef.current = Date.now() + CHAT_REQUEST_COOLDOWN_MS;
      }

      toastRef.current({
        title: 'Error en chat',
        description: 'No se pudieron cargar las conversaciones. Reintentando en unos segundos.',
        variant: 'destructive',
      });
      setRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }, [userId, logChatErrorOnce]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 3. Messages Logic
  const fetchMessages = async (roomId) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const senderIds = [...new Set((data || []).map((m) => m.sender_id))];
      let senderProfiles = {};

      if (senderIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', senderIds);

        if (profilesError) throw profilesError;

        senderProfiles = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }

      const messagesWithProfiles = (data || []).map((message) => ({
        ...message,
        profiles: senderProfiles[message.sender_id] || null
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      logChatErrorOnce('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!activeRoom) return;

    fetchMessages(activeRoom.id);

    messageSubscription.current = supabase.channel(`room:${activeRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${activeRoom.id}`
      }, async (payload) => {
        const { data: senderProfileRows } = await supabase
          .from('profiles')
          .select(CHAT_PROFILE_SELECT)
          .eq('id', payload.new.sender_id)
          .limit(1);
        const senderProfile = normalizeChatProfile(senderProfileRows?.[0], payload.new.sender_id);

        const newMessage = {
          ...payload.new,
          profiles: senderProfile
        };
        
        setMessages(prev => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe();

    return () => {
      if (messageSubscription.current) {
        supabase.removeChannel(messageSubscription.current);
        messageSubscription.current = null;
      }
    };
  }, [activeRoom]);

  // Clear unread room indicator when it becomes active
  useEffect(() => {
    if (activeRoom && unreadRooms.includes(activeRoom.id)) {
      setUnreadRooms(prev => prev.filter(id => id !== activeRoom.id));
    }
  }, [activeRoom, unreadRooms]);

  // Global subscription to all chat messages for real-time sound and unread count tracking
  useEffect(() => {
    if (!userId || rooms.length === 0) return;

    const globalChannel = supabase.channel('global-chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, async (payload) => {
        const msg = payload.new;
        if (msg.sender_id === userId) return;

        // Verify if the room belongs to user's conversation rooms
        const isMyRoom = rooms.some(r => r.id === msg.room_id);
        if (!isMyRoom) return;

        // If the room is not active, add to unread list
        if (!activeRoom || activeRoom.id !== msg.room_id) {
          setUnreadRooms(prev => {
            if (prev.includes(msg.room_id)) return prev;
            return [...prev, msg.room_id];
          });
        }

        // Play alert sound for any incoming chat message
        playNotificationSound();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [userId, rooms, activeRoom]);

  // Actions
  const sendMessage = async (content) => {
    if (!activeRoom || !content.trim() || !userId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: activeRoom.id,
            sender_id: userId,
          content: content.trim()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'No se pudo enviar el mensaje.', variant: 'destructive' });
    }
  };

  const createPrivateChat = async (targetUserId) => {
    try {
      if (!userId || !targetUserId || targetUserId === userId) return null;

      const [{ data: mine, error: myErr }, { data: target, error: targetErr }] = await Promise.all([
        supabase.from('chat_participants').select('room_id').eq('user_id', userId),
        supabase.from('chat_participants').select('room_id').eq('user_id', targetUserId)
      ]);

      if (myErr) throw myErr;
      if (targetErr) throw targetErr;

      const myRoomIds = new Set((mine || []).map((r) => r.room_id));
      const sharedRoomIds = (target || [])
        .map((r) => r.room_id)
        .filter((roomId) => myRoomIds.has(roomId));

      if (sharedRoomIds.length > 0) {
        const { data: existingDmRows } = await supabase
          .from('chat_rooms')
          .select('id')
          .in('id', sharedRoomIds)
          .eq('is_group', false)
          .limit(1);
        const existingDm = existingDmRows?.[0] || null;

        if (existingDm?.id) {
          await fetchRooms();
          return existingDm.id;
        }
      }

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ is_group: false, created_by: userId })
        .select()
        .single();
        
      if (roomError) throw roomError;

      const { error: partError } = await supabase
        .from('chat_participants')
        .insert([
          { room_id: room.id, user_id: userId },
          { room_id: room.id, user_id: targetUserId }
        ]);

      if (partError) throw partError;

      await fetchRooms();
      return room.id;
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo crear el chat.', variant: 'destructive' });
    }
  };

  const createGroupChat = async (name, participantIds) => {
    try {
      if (!userId) return null;

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ name, is_group: true, created_by: userId })
        .select()
        .single();
        
      if (roomError) throw roomError;

      const participants = [userId, ...participantIds].map(uid => ({
        room_id: room.id,
        user_id: uid
      }));

      const { error: partError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (partError) throw partError;

      await fetchRooms();
      toast({ title: 'Grupo creado', description: `Grupo "${name}" creado exitosamente.` });
      return room.id;
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo crear el grupo.', variant: 'destructive' });
    }
  };

  const blockUser = async (targetId) => {
    try {
      if (!userId || !targetId) return;

      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: userId, blocked_id: targetId });

      if (error) throw error;
      setBlockedUsers(prev => [...prev, targetId]);
      toast({ title: 'Usuario bloqueado', description: 'No recibirás más mensajes de este usuario.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo bloquear al usuario.', variant: 'destructive' });
    }
  };

  const reportUser = async (targetId, reason) => {
    try {
      if (!userId || !targetId) return;

      const { error } = await supabase
        .from('user_reports')
        .insert({ reporter_id: userId, reported_id: targetId, reason });

      if (error) throw error;
      toast({ title: 'Reporte enviado', description: 'El equipo de soporte revisará el caso.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo enviar el reporte.', variant: 'destructive' });
    }
  };

  return {
    rooms,
    activeRoom,
    setActiveRoom,
    messages,
    sendMessage,
    createPrivateChat,
    createGroupChat,
    blockUser,
    reportUser,
    onlineUsers,
    communityUsers,
    loadingRooms,
    loadingMessages,
    blockedUsers,
    user,
    unreadRooms,
    setUnreadRooms
  };
};
