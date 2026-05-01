import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, loading, signIn, signOut, profileError } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user && isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }

    if (user) {
      navigate('/user', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const { error: signInError, profile } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || 'No fue posible iniciar sesion.');
      setIsSubmitting(false);
      return;
    }

    const normalizedRole = profile?.role?.trim?.().toLowerCase?.() ?? '';
    if (normalizedRole === 'admin' || normalizedRole === 'administrador') {
      navigate('/admin', { replace: true });
      return;
    }

    await signOut();
    if (!profile) {
      setError(profileError || 'No se pudo cargar tu perfil desde Supabase. Revisa la fila en profiles, el id del usuario y las policies.');
      setIsSubmitting(false);
      return;
    }

    setError(`La cuenta inicio sesion, pero su role es "${profile.role ?? 'null'}". El panel solo acepta "admin" o "administrador".`);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111322] border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <img
            src="https://horizons-cdn.hostinger.com/9c34d6a0-7f3d-4ce5-a2cd-77bc39639101/5042524decaeef7dde8cc84509a7f9d8.png"
            alt="Logo"
            className="w-32 h-auto"
          />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">Acceso Administrativo</h2>
        <p className="text-[#a7a8c7] text-center mb-8">Inicia sesion con una cuenta que tenga rol Administrador</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
              placeholder="admin@correo.com"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
              placeholder="Contrasena"
              required
            />
          </div>

          {error && <p className="text-[#ef4444] text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="w-full bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] text-[#050510] font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(255,45,240,0.3)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Validando...' : 'Ingresar'} <ArrowRight size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
