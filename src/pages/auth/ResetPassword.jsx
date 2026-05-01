import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { session, updatePassword } = useAuth();
  const navigate = useNavigate();

  const hasRecoveryToken = useMemo(() => window.location.hash.includes('type=recovery'), []);
  const canReset = Boolean(session) || hasRecoveryToken;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await updatePassword(password);
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message || 'No se pudo actualizar la contrasena.');
      return;
    }

    setIsDone(true);
    setTimeout(() => navigate('/login', { replace: true }), 1800);
  };

  return (
    <div className="min-h-screen bg-[#050510] px-4 pb-12 pt-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111322] p-8 shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-white">Nueva contrasena</h1>
        <p className="mt-2 text-[#a7a8c7]">
          Establece una nueva contrasena para recuperar tu cuenta.
        </p>

        {isDone ? (
          <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-green-100">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} />
              <p className="font-semibold">Contrasena actualizada</p>
            </div>
            <p className="text-sm leading-6">
              En breve te llevaremos a inicio de sesion para que ingreses con la nueva contrasena.
            </p>
          </div>
        ) : !canReset ? (
          <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5 text-yellow-100">
            <p className="text-sm leading-6">
              Este enlace de recuperacion no es valido o ya vencio. Solicita uno nuevo.
            </p>
            <Link to="/forgot-password" className="mt-4 inline-flex text-sm font-semibold text-white underline">
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-sm font-medium text-[#a7a8c7]">Nueva contrasena</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#050510] py-3 pl-12 pr-4 text-white outline-none transition-all focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0]"
                  placeholder="********"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-medium text-[#a7a8c7]">Confirmar contrasena</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#050510] py-3 pl-12 pr-4 text-white outline-none transition-all focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0]"
                  placeholder="********"
                />
              </div>
            </div>

            {error && <p className="text-sm text-[#ef4444]">{error}</p>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] py-6 font-bold text-[#050510] transition-all hover:shadow-[0_0_20px_rgba(255,45,240,0.3)]"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar nueva contrasena'} <ArrowRight size={20} />
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
