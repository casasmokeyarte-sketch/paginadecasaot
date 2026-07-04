import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ChatPresenceContext = createContext({
  onlineUsers: {},
  presenceStatus: 'CLOSED',
});

const toPresenceArray = (presenceEntry) => {
  if (Array.isArray(presenceEntry)) return presenceEntry;
  if (Array.isArray(presenceEntry?.metas)) return presenceEntry.metas;
  if (presenceEntry && typeof presenceEntry === 'object') return [presenceEntry];
  return [];
};

const extractPresenceUsers = (state) => {
  const users = {};

  Object.entries(state || {}).forEach(([key, presences]) => {
    toPresenceArray(presences).forEach((presence) => {
      const trackedUser = presence?.user_info || presence || {};
      const trackedUserId = presence?.user_id || trackedUser.id || key;

      if (!trackedUserId) return;

      users[trackedUserId] = {
        id: trackedUserId,
        email: trackedUser.email || null,
        full_name: trackedUser.full_name || trackedUser.email?.split?.('@')?.[0] || 'Usuario',
        avatar_url: trackedUser.avatar_url || null,
        online_at: trackedUser.online_at || new Date().toISOString(),
      };
    });
  });

  return users;
};

export const ChatPresenceProvider = ({ children }) => {
  const { user, profile } = useAuth();
  const userId = user?.id || null;
  const userEmail = user?.email || null;
  const profileName = profile?.full_name || null;
  const profileAvatar = profile?.avatar_url || null;
  const channelRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [presenceStatus, setPresenceStatus] = useState('CLOSED');

  const syncPresenceState = () => {
    const nextState = channelRef.current?.presenceState?.() || {};
    const extractedUsers = extractPresenceUsers(nextState);
    setOnlineUsers(extractedUsers);
  };

  useEffect(() => {
    if (!userId) {
      setOnlineUsers({});
      setPresenceStatus('CLOSED');
      return;
    }

    const channel = supabase.channel('global_presence', {
      config: {
        presence: { key: userId },
      },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        syncPresenceState();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers((prev) => {
          const updated = { ...prev };
          toPresenceArray(newPresences).forEach((presence) => {
            const trackedUser = presence?.user_info || presence || {};
            const trackedUserId = presence?.user_id || trackedUser.id || key;

            if (!trackedUserId) return;

            updated[trackedUserId] = {
              id: trackedUserId,
              email: trackedUser.email || null,
              full_name: trackedUser.full_name || trackedUser.email?.split?.('@')?.[0] || 'Usuario',
              avatar_url: trackedUser.avatar_url || null,
              online_at: trackedUser.online_at || new Date().toISOString(),
            };
          });
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers((prev) => {
          const updated = { ...prev };
          toPresenceArray(leftPresences).forEach((presence) => {
            const trackedUser = presence?.user_info || presence || {};
            const trackedUserId = presence?.user_id || trackedUser.id || key;

            if (trackedUserId) delete updated[trackedUserId];
          });
          return updated;
        });
      });

    channel.subscribe((status) => {
      setPresenceStatus(status);
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setOnlineUsers({});
    };
  }, [userId]);

  // Separate Effect to handle actual user tracking and info updates
  useEffect(() => {
    if (presenceStatus !== 'SUBSCRIBED' || !userId || !channelRef.current) return;

    const userInfo = {
      id: userId,
      email: userEmail,
      full_name: profileName || userEmail?.split('@')?.[0] || 'Usuario',
      avatar_url: profileAvatar,
      online_at: new Date().toISOString(),
    };

    const trackPresence = async () => {
      try {
        await channelRef.current.track({
          user_id: userId,
          user_info: userInfo,
          ...userInfo,
        });
        syncPresenceState();
      } catch (error) {
        console.error('Presence track error:', error);
      }
    };

    trackPresence();

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(() => {
      if (!navigator.onLine) return;
      syncPresenceState();
    }, 15000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [presenceStatus, userId, userEmail, profileName, profileAvatar]);

  return (
    <ChatPresenceContext.Provider value={{ onlineUsers, presenceStatus }}>
      {children}
    </ChatPresenceContext.Provider>
  );
};

export const useChatPresence = () => useContext(ChatPresenceContext);

export default ChatPresenceProvider;