import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ChatPresenceContext = createContext({
  onlineUsers: {},
  presenceStatus: 'CLOSED',
});

const DATABASE_HEARTBEAT_MS = 25000;
const DATABASE_STALE_MS = 90000;

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

const extractDatabaseUsers = (rows) => {
  const users = {};
  const now = Date.now();

  (rows || []).forEach((row) => {
    const lastSeen = new Date(row.last_seen_at).getTime();
    if (!Number.isFinite(lastSeen) || now - lastSeen > DATABASE_STALE_MS || row.status === 'offline') {
      return;
    }

    users[row.user_id] = {
      id: row.user_id,
      email: null,
      full_name: row.display_name || 'Usuario',
      avatar_url: row.avatar_url || null,
      online_at: row.last_seen_at,
      status: row.status === 'idle' ? 'idle' : 'online',
    };
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
  const databaseIntervalRef = useRef(null);
  const databaseChannelRef = useRef(null);
  const presencePayloadRef = useRef({
    displayName: 'Usuario',
    avatarUrl: null,
    status: 'online',
  });

  const [onlineUsers, setOnlineUsers] = useState({});
  const [presenceStatus, setPresenceStatus] = useState('CLOSED');
  const [userStatus, setUserStatus] = useState('online');
  const [databaseUsers, setDatabaseUsers] = useState({});

  presencePayloadRef.current = {
    displayName: profileName || userEmail?.split('@')?.[0] || 'Usuario',
    avatarUrl: profileAvatar,
    status: userStatus,
  };

  const loadDatabasePresence = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_user_presence')
      .select('user_id, display_name, avatar_url, status, last_seen_at')
      .gte('last_seen_at', new Date(Date.now() - DATABASE_STALE_MS).toISOString());

    if (!error) setDatabaseUsers(extractDatabaseUsers(data));
  }, []);

  const publishDatabasePresence = useCallback(async (statusOverride = null) => {
    const payload = presencePayloadRef.current;
    await supabase.rpc('chat_set_presence', {
      p_status: statusOverride || payload.status,
      p_display_name: payload.displayName,
      p_avatar_url: payload.avatarUrl,
    });
  }, []);

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

    const handleBlur = () => setUserStatus('idle');

    resetIdleTimer();

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleActivity);
    window.addEventListener('blur', handleBlur);
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
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [userId]);

  // Shared database heartbeat: gives every authenticated user the same presence view
  // and survives temporary Presence channel reconnections.
  useEffect(() => {
    if (!userId) {
      setDatabaseUsers({});
      return undefined;
    }

    publishDatabasePresence();
    loadDatabasePresence();

    const databaseChannel = supabase
      .channel('chat-user-presence-table')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_user_presence' },
        () => loadDatabasePresence()
      )
      .subscribe();

    databaseChannelRef.current = databaseChannel;
    databaseIntervalRef.current = setInterval(() => {
      if (!navigator.onLine) return;
      publishDatabasePresence();
      loadDatabasePresence();
    }, DATABASE_HEARTBEAT_MS);

    const handleOnline = () => {
      publishDatabasePresence('online');
      loadDatabasePresence();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      if (databaseIntervalRef.current) {
        clearInterval(databaseIntervalRef.current);
        databaseIntervalRef.current = null;
      }
      if (databaseChannelRef.current) {
        supabase.removeChannel(databaseChannelRef.current);
        databaseChannelRef.current = null;
      }
      publishDatabasePresence('offline');
      setDatabaseUsers({});
    };
  }, [loadDatabasePresence, publishDatabasePresence, userId]);

  useEffect(() => {
    if (!userId) return;
    publishDatabasePresence(userStatus);
  }, [publishDatabasePresence, userId, userStatus, profileName, profileAvatar]);

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
      .on('presence', { event: 'join' }, () => {
        window.setTimeout(syncPresenceState, 0);
      })
      .on('presence', { event: 'leave' }, () => {
        window.setTimeout(syncPresenceState, 0);
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

  const sharedOnlineUsers = useMemo(
    () => ({ ...databaseUsers, ...onlineUsers }),
    [databaseUsers, onlineUsers]
  );

  return (
    <ChatPresenceContext.Provider value={{ onlineUsers: sharedOnlineUsers, presenceStatus }}>
      {children}
    </ChatPresenceContext.Provider>
  );
};

export const useChatPresence = () => useContext(ChatPresenceContext);

export default ChatPresenceProvider;
