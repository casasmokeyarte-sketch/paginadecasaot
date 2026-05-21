import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Phone, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Las contraseñas no coinciden',
        description: 'Verifica que ambas contraseñas sean iguales.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const signUpOptions = {
      data: {
        full_name: formData.fullName.trim() || null,
        phone: formData.phone.trim() || null,
      },
    };

    const { error, data } = await signUp(formData.email, formData.password, signUpOptions);

    if (error) {
      setIsSubmitting(false);
      toast({
        title: 'Error de registro',
        description: error.message || 'No se pudo crear la cuenta',
        variant: 'destructive',
      });
      return;
    }

    if (data?.user) {
      setRegistrationSuccess(true);
    }

    setIsSubmitting(false);
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#050510] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111322] p-8 text-center shadow-2xl"
        >
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#00e5ff] to-[#ff2df0]"></div>

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>

          <h2 className="mb-4 text-2xl font-bold text-white">Registro Exitoso</h2>

          <div className="mb-6 rounded-xl border border-white/5 bg-[#050510] p-4">
            <p className="text-sm text-[#a7a8c7]">Hemos enviado un enlace de confirmacion a:</p>
            <p className="mt-1 font-medium text-white">{formData.email}</p>
          </div>

          <div className="mb-8 flex items-start gap-3 rounded-xl bg-blue-500/10 p-4 text-left">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
            <p className="text-sm text-blue-200">
              Revisa tu bandeja de entrada y spam. El perfil en Supabase ahora se crea automaticamente con el trigger.
            </p>
          </div>

          <Link to="/login">
            <Button className="w-full rounded-xl bg-[#ff2df0] py-6 font-bold text-white transition-all hover:bg-[#d91cb8]">
              Ir al Inicio de Sesion
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#050510] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111322] p-8 shadow-2xl"
      >
        <div className="pointer-events-none absolute -ml-16 -mt-16 h-32 w-32 rounded-full bg-[#00e5ff]/10 blur-2xl"></div>

        <div className="relative z-10 mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Crear Cuenta</h1>
          <p className="text-[#a7a8c7]">Unete a la experiencia Casa Smoke y Arte</p>
        </div>

        <form onSubmit={handleRegister} className="relative z-10 space-y-4">
          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium text-[#a7a8c7]">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/10 bg-[#050510] py-3 pl-12 pr-4 text-white outline-none transition-all focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0]"
                placeholder="Juan Perez"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium text-[#a7a8c7]">Telefono</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#050510] py-3 pl-12 pr-4 text-white outline-none transition-all focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0]"
                placeholder="+57 300..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium text-[#a7a8c7]">Correo Electronico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/10 bg-[#050510] py-3 pl-12 pr-4 text-white outline-none transition-all focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0]"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium text-[#a7a8c7]">Contrasena</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-[#050510] py-3 pl-12 pr-12 text-white outline-none transition-all focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0]"
                placeholder="Minimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a7a8c7] hover:text-white">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-sm font-medium text-[#a7a8c7]">Confirmar Contrasena</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className={`w-full rounded-xl border py-3 pl-12 pr-12 text-white outline-none transition-all focus:ring-1 bg-[#050510] ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-white/10 focus:border-[#ff2df0] focus:ring-[#ff2df0]'
                }`}
                placeholder="Repite tu contraseña"
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a7a8c7] hover:text-white">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-400 ml-1">Las contraseñas no coinciden</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-xs text-green-400 ml-1">✓ Las contraseñas coinciden</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2df0] py-6 font-bold text-[#050510] transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
          >
            {isSubmitting ? 'Registrando...' : 'Registrarse'} <ArrowRight size={20} />
          </Button>

          <div className="mt-6 text-center">
            <p className="text-[#a7a8c7]">
              Ya tienes cuenta?{' '}
              <Link to="/login" className="font-bold text-[#ff2df0] hover:underline">
                Inicia sesion
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
