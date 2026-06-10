import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);
const ADMIN_ROLES = new Set(['admin', 'administrador']);

const normalizeRole = (role) => (typeof role === 'string' ? role.trim().toLowerCase() : '');
const PROFILE_SELECT = 'id, full_name, avatar_url, phone, address, role, updated_at';
const PROFILE_RETRY_COOLDOWN_MS = 12000;

const isTransientProfileError = (error) => {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase();
  return message.includes('failed to fetch')
    || message.includes('network')
    || message.includes('insufficient_resources')
    || message.includes('timeout');
};

const buildFallbackProfile = (userId, email) => ({
  id: userId,
  full_name: email?.split('@')?.[0] || 'Usuario',
  avatar_url: null,
  phone: null,
  address: null,
  updated_at: new Date().toISOString(),
});

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef(null);
  const lastProfileFetchUserIdRef = useRef(null);
  const profileFetchInFlightRef = useRef(false);
  const profileRetryAfterRef = useRef(0);
  const currentUserIdRef = useRef(null);
  const lastAuthErrorRef = useRef({ key: '', at: 0 });

  const logAuthErrorOnce = useCallback((scope, details) => {
    const message = details?.message || details?.error?.message || 'auth_error';
    const key = `${scope}:${message}`;
    const now = Date.now();

    if (lastAuthErrorRef.current.key === key && now - lastAuthErrorRef.current.at < 10000) {
      return;
    }

    lastAuthErrorRef.current = { key, at: now };
    console.error(scope, details);
  }, []);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = useCallback(async (userId, fallbackEmail = null) => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return null;
    }

    try {
      const { data: rows, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', userId)
        .limit(1);
      const data = rows?.[0] || null;

      if (error) {
        logAuthErrorOnce('Error loading auth profile:', { userId, error });
        setProfile(null);
        setProfileError(error.message || 'No se pudo cargar el perfil autenticado.');
        return null;
      }

      if (!data) {
        const fallbackProfile = buildFallbackProfile(userId, fallbackEmail);

        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert(fallbackProfile, { onConflict: 'id' })
          .select(PROFILE_SELECT)
          .single();

        if (insertError) {
          const message = `No se encontro fila en profiles para el usuario autenticado (${userId}).`;
          console.warn(message, insertError);
          setProfile(null);
          setProfileError(message);
          return null;
        }

        setProfile(insertedProfile || fallbackProfile);
        setProfileError(null);
        return insertedProfile || fallbackProfile;
      }

      const nextProfile = data;
      setProfile(nextProfile);
      setProfileError(null);
      return nextProfile;
    } catch (error) {
      logAuthErrorOnce('Unexpected error loading auth profile:', { userId, error });
      setProfile(null);
      setProfileError(error?.message || 'No se pudo cargar el perfil autenticado.');
      return null;
    }
  }, [logAuthErrorOnce]);

  const handleSession = useCallback(async (session) => {
    const nextUser = session?.user ?? null;
    const nextUserId = nextUser?.id || null;
    const previousUserId = currentUserIdRef.current;

    setSession((prev) => {
      const prevToken = prev?.access_token || null;
      const nextToken = session?.access_token || null;
      if (prevToken === nextToken && prev?.user?.id === nextUserId) {
        return prev;
      }
      return session;
    });

    setUser((prev) => {
      if (prev?.id === nextUser?.id && prev?.email === nextUser?.email) {
        return prev;
      }
      return nextUser;
    });

    currentUserIdRef.current = nextUserId;

    if (!nextUser?.id) {
      lastProfileFetchUserIdRef.current = null;
      profileRetryAfterRef.current = 0;
      setProfile(null);
      setProfileError(null);
      setLoading(false);
      return;
    }

    if (profileFetchInFlightRef.current) {
      return;
    }

    const now = Date.now();
    const shouldSkipForCooldown =
      lastProfileFetchUserIdRef.current === nextUser.id
      && profileRetryAfterRef.current > now;

    if (shouldSkipForCooldown) {
      setLoading(false);
      return;
    }

    const hasProfileForSameUser =
      lastProfileFetchUserIdRef.current === nextUser.id
      && !!profileRef.current
      && previousUserId === nextUser.id;

    if (hasProfileForSameUser) {
      setLoading(false);
      return;
    }

    profileFetchInFlightRef.current = true;
    setLoading(true);
    try {
      const nextProfile = await fetchProfile(nextUser?.id, nextUser?.email || null);
      if (nextProfile) {
        lastProfileFetchUserIdRef.current = nextUser.id;
        profileRetryAfterRef.current = 0;
      } else {
        profileRetryAfterRef.current = Date.now() + PROFILE_RETRY_COOLDOWN_MS;
      }
    } catch (error) {
      logAuthErrorOnce('[auth] handleSession failed', { error });
      if (isTransientProfileError(error)) {
        profileRetryAfterRef.current = Date.now() + PROFILE_RETRY_COOLDOWN_MS;
      }
    } finally {
      profileFetchInFlightRef.current = false;
      setLoading(false);
    }
  }, [fetchProfile, logAuthErrorOnce]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleSession(session);
      } catch (error) {
        logAuthErrorOnce('[auth] getSession failed', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileError(error?.message || 'No se pudo inicializar la sesion autenticada.');
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession, logAuthErrorOnce]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message || "Algo salió mal",
      });
    } else {
      // Success message for signup - informs user to check email
      toast({
        title: "¡Registro exitoso!",
        description: "Por favor revisa tu correo electrónico para confirmar tu cuenta.",
        className: "bg-green-600 text-white border-none",
      });
    }

    return { error, data };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // We handle the error in the component for more specific UI feedback, 
    // but we can keep a generic toast here if needed, or remove it to avoid double alerts.
    // For now, let's only toast if it's a system error, not a user error like wrong password.
    if (error && !error.message.includes("Email not confirmed") && !error.message.includes("Invalid login credentials")) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message || "Algo salió mal",
      });
    }

    const nextProfile = data?.user ? await fetchProfile(data.user.id, data.user.email || null) : null;

    return { error, data, profile: nextProfile };
  }, [fetchProfile, toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    lastProfileFetchUserIdRef.current = null;
    profileRetryAfterRef.current = 0;

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: error.message || "Algo salió mal",
      });
    }

    return { error };
  }, [toast]);

  const requestPasswordReset = useCallback(async (email) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al enviar recuperacion",
        description: error.message || "No se pudo enviar el correo de recuperacion.",
      });
      return { data, error };
    }

    toast({
      title: "Correo enviado",
      description: "Revisa tu correo para continuar con el cambio de contrasena.",
      className: "bg-green-600 text-white border-none",
    });

    return { data, error };
  }, [toast]);

  const updatePassword = useCallback(async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al actualizar contrasena",
        description: error.message || "No se pudo actualizar la contrasena.",
      });
      return { data, error };
    }

    toast({
      title: "Contrasena actualizada",
      description: "Ya puedes iniciar sesion con tu nueva contrasena.",
      className: "bg-green-600 text-white border-none",
    });

    return { data, error };
  }, [toast]);

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_user');

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al eliminar cuenta",
        description: error.message || "No se pudo eliminar la cuenta. Intenta de nuevo.",
      });
      return { error };
    }

    await supabase.auth.signOut();
    return { error: null };
  }, [toast]);

  const role = profile?.role ?? null;
  const isAdmin = ADMIN_ROLES.has(normalizeRole(role));

  const value = useMemo(() => ({
    user,
    session,
    profile,
    profileError,
    role,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
    deleteAccount,
    refreshProfile: () => fetchProfile(user?.id),
  }), [user, session, profile, profileError, role, isAdmin, loading, signUp, signIn, signOut, requestPasswordReset, updatePassword, deleteAccount, fetchProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
