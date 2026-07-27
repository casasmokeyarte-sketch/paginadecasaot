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
        status: trackedUser.status || 'online',
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
  const activityTimeoutRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState({});
  const [presenceStatus, setPresenceStatus] = useState('CLOSED');
  const [userStatus, setUserStatus] = useState('online');

  const syncPresenceState = () => {
    const nextState = channelRef.current?.presenceState?.() || {};
    const extractedUsers = extractPresenceUsers(nextState);
    setOnlineUsers(extractedUsers);
  };

  // Activity timer helper to detect idle
  const resetIdleTimer = () => {
    setUserStatus('online');
    
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // Set to idle after 1 minute (60,000 ms) of inactivity
    activityTimeoutRef.current = setTimeout(() => {
      setUserStatus('idle');
    }, 60000);
  };

  // Monitor tab visibility and user activity
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setUserStatus('idle');
      } else {
        resetIdleTimer();
      }
    };

    const handleActivity = () => {
      if (document.visibilityState !== 'hidden') {
        resetIdleTimer();
      }
    };

    resetIdleTimer();

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleActivity);
    window.addEventListener('blur', () => setUserStatus('idle'));
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('blur', () => setUserStatus('idle'));
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [userId]);

  // Sync state with Supabase Presence
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
              status: trackedUser.status || 'online',
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

  // Track status updates on Supabase when user details or activity state changes
  useEffect(() => {
    if (presenceStatus !== 'SUBSCRIBED' || !userId || !channelRef.current) return;

    const userInfo = {
      id: userId,
      email: userEmail,
      full_name: profileName || userEmail?.split('@')?.[0] || 'Usuario',
      avatar_url: profileAvatar,
      online_at: new Date().toISOString(),
      status: userStatus,
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
  }, [presenceStatus, userId, userEmail, profileName, profileAvatar, userStatus]);

  return (
    <ChatPresenceContext.Provider value={{ onlineUsers, presenceStatus }}>
      {children}
    </ChatPresenceContext.Provider>
  );
};

export const useChatPresence = () => useContext(ChatPresenceContext);

export default ChatPresenceProvider;