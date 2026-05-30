import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CHAT_PROFILE_SELECT = 'id, full_name, avatar_url';

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
  const { user } = useAuth();
  const channelRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [presenceStatus, setPresenceStatus] = useState('CLOSED');

  const syncPresenceState = () => {
    const nextState = channelRef.current?.presenceState?.() || {};
    const extractedUsers = extractPresenceUsers(nextState);
    console.log('[chat-presence] sync state', extractedUsers);
    setOnlineUsers(extractedUsers);
  };

  useEffect(() => {
    if (!user?.id) {
      setOnlineUsers({});
      setPresenceStatus('CLOSED');
      return;
    }

    const channel = supabase.channel('global_presence', {
      config: {
        presence: { key: user.id },
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

    channel.subscribe(async (status) => {
      setPresenceStatus(status);
      console.log('[chat-presence] status', status, { userId: user.id });
      if (status !== 'SUBSCRIBED') return;

      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select(CHAT_PROFILE_SELECT)
        .eq('id', user.id)
        .limit(1);

      if (profileError) {
        console.warn('[chat-presence] profile lookup failed, using auth fallback', profileError);
      }

      const profile = profileRows?.[0] || null;
      const userInfo = {
        id: user.id,
        email: user.email || null,
        full_name: profile?.full_name || user.email?.split('@')?.[0] || 'Usuario',
        avatar_url: profile?.avatar_url || null,
        online_at: new Date().toISOString(),
      };

      try {
        const trackResult = await channel.track({
          user_id: user.id,
          user_info: userInfo,
          ...userInfo,
        });
        console.log('[chat-presence] track result', trackResult, userInfo);
        syncPresenceState();

        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }

        syncIntervalRef.current = setInterval(() => {
          syncPresenceState();
        }, 5000);
      } catch (error) {
        console.error('Presence track error:', error);
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      setOnlineUsers({});
    };
  }, [user]);

  return (
    <ChatPresenceContext.Provider value={{ onlineUsers, presenceStatus }}>
      {children}
    </ChatPresenceContext.Provider>
  );
};

export const useChatPresence = () => useContext(ChatPresenceContext);

export default ChatPresenceProvider;