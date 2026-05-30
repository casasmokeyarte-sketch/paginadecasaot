import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);
const ADMIN_ROLES = new Set(['admin', 'administrador']);

const normalizeRole = (role) => (typeof role === 'string' ? role.trim().toLowerCase() : '');
const PROFILE_SELECT = 'id, full_name, avatar_url, phone, address, role, updated_at';

const buildFallbackProfile = (userId, email) => ({
  id: userId,
  full_name: email?.split('@')?.[0] || 'Usuario',
  avatar_url: null,
  phone: null,
  address: null,
  role: 'user',
  updated_at: new Date().toISOString(),
});

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      console.log('[auth] fetchProfile skipped: missing userId', { userId });
      setProfile(null);
      setProfileError(null);
      return null;
    }

    console.log('[auth] fetchProfile start', { userId });

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', userId)
      .maybeSingle();

    console.log('[auth] fetchProfile result', {
      userId,
      data,
      error,
    });

    if (error) {
      console.error('Error loading auth profile:', { userId, error });
      setProfile(null);
      setProfileError(error.message || 'No se pudo cargar el perfil autenticado.');
      return null;
    }

    if (!data) {
      const sessionEmail = session?.user?.id === userId ? session.user.email : user?.id === userId ? user.email : null;
      const fallbackProfile = buildFallbackProfile(userId, sessionEmail);

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
  }, [session, user]);

  const handleSession = useCallback(async (session) => {
    setLoading(true);
    setSession(session);
    const nextUser = session?.user ?? null;
    console.log('[auth] handleSession', {
      sessionUserId: session?.user?.id ?? null,
      sessionEmail: session?.user?.email ?? null,
    });
    setUser(nextUser);
    await fetchProfile(nextUser?.id);
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

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

    const nextProfile = data?.user ? await fetchProfile(data.user.id) : null;

    return { error, data, profile: nextProfile };
  }, [fetchProfile, toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

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

  console.log('[auth] role check', {
    profileId: profile?.id ?? null,
    role,
    isAdmin,
    profileError,
  });

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
