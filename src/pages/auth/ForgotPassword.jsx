import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const { error } = await requestPasswordReset(email);
    setIsSubmitting(false);

    if (!error) {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] px-4 pb-12 pt-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111322] p-8 shadow-2xl"
      >
        <h1 className="text-3xl font-bold text-white">Recuperar contrasena</h1>
        <p className="mt-2 text-[#a7a8c7]">
          Te enviaremos un enlace para establecer una nueva contrasena.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-green-100">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} />
              <p className="font-semibold">Correo enviado</p>
            </div>
            <p className="text-sm leading-6">
              Revisa {email}. Si no lo ves, revisa spam o correo no deseado.
            </p>
            <Link to="/login" className="mt-5 inline-flex text-sm font-semibold text-white underline">
              Volver a inicio de sesion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-sm font-medium text-[#a7a8c7]">Correo electronico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#050510] py-3 pl-12 pr-4 text-white outline-none transition-all focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0]"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] py-6 font-bold text-[#050510] transition-all hover:shadow-[0_0_20px_rgba(255,45,240,0.3)]"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'} <ArrowRight size={20} />
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-semibold text-[#00e5ff] hover:underline">
                Volver a inicio de sesion
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
