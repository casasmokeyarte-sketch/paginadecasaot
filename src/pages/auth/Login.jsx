import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);

    const { error, profile } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setLoginError({
          title: "Verificacion requerida",
          message: "Por favor revisa tu correo electronico para confirmar tu cuenta antes de iniciar sesion."
        });
      } else if (error.message.includes("Invalid login credentials")) {
        setLoginError({
          title: "Credenciales incorrectas",
          message: "El correo o la contrasena no son correctos. Intentalo de nuevo."
        });
      } else {
        setLoginError({
          title: "Error de inicio de sesion",
          message: error.message || "Ocurrio un error inesperado."
        });
      }
      return;
    }

    const normalizedRole = profile?.role?.trim?.().toLowerCase?.() ?? '';
    navigate(normalizedRole === 'admin' || normalizedRole === 'administrador' ? '/admin' : '/user', { replace: true });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#050510] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111322] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff2df0]/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenido de nuevo</h1>
          <p className="text-[#a7a8c7]">Ingresa a tu cuenta de Casa Smoke y Arte</p>
        </div>

        {loginError && (
          <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-900/50 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{loginError.title}</AlertTitle>
            <AlertDescription>
              {loginError.message}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#a7a8c7] ml-1">Correo Electronico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#a7a8c7] ml-1">Contrasena</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                placeholder="********"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] text-[#050510] font-bold py-6 rounded-xl hover:shadow-[0_0_20px_rgba(255,45,240,0.3)] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Iniciando...' : 'Iniciar sesion'} <ArrowRight size={20} />
          </Button>

          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-sm font-semibold text-[#00e5ff] hover:underline">
              Olvido su contrasena?
            </Link>
          </div>

          <div className="text-center mt-6">
            <p className="text-[#a7a8c7]">
              No tienes cuenta?{' '}
              <Link to="/register" className="text-[#00e5ff] font-bold hover:underline">
                Registrate aqui
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
