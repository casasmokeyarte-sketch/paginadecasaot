import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  Loader2,
  LogIn,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(value));
};

const VipAccess = () => {
  const { token } = useParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const validate = useCallback(async () => {
    if (!isAdmin || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc('vip_validate_access', {
      p_token: token,
    });
    if (rpcError) {
      setError(rpcError.message);
      setAccess(null);
    } else {
      setAccess(data?.[0] || null);
      if (!data?.[0]) setError('La tarjeta no existe o fue reemplazada.');
    }
    setLoading(false);
  }, [isAdmin, token]);

  useEffect(() => {
    if (!authLoading) validate();
  }, [authLoading, validate]);

  const registerAccess = async (mode) => {
    setWorking(true);
    const functionName = mode === 'in' ? 'vip_check_in' : 'vip_check_out';
    const args = mode === 'in'
      ? { p_token: token, p_access_method: 'nfc' }
      : { p_token: token };
    const { error: rpcError } = await supabase.rpc(functionName, args);
    setWorking(false);

    if (rpcError) {
      toast({ variant: 'destructive', title: 'Acceso no registrado', description: rpcError.message });
      return;
    }

    toast({
      title: mode === 'in' ? 'Ingreso registrado' : 'Salida registrada',
      description: mode === 'in' ? 'El miembro puede ingresar a la sala.' : 'La visita quedó cerrada.',
    });
    validate();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050510] pt-32 text-white">
        <div className="mx-auto flex max-w-lg items-center justify-center px-4 py-20 text-[#a7a8c7]">
          <Loader2 className="mr-3 animate-spin" /> Validando tarjeta...
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#050510] px-4 pt-32 text-white">
        <div className="mx-auto max-w-lg rounded-3xl border border-yellow-400/20 bg-[#111322] p-8 text-center">
          <ShieldAlert className="mx-auto text-yellow-300" size={46} />
          <h1 className="mt-5 text-2xl font-black">Validación exclusiva para recepción</h1>
          <p className="mt-3 text-[#a7a8c7]">
            La tarjeta solo puede validarse con una cuenta administrativa autorizada.
          </p>
          <Link
            to={`/admin/login?next=/vip/access/${token}`}
            className="mt-7 inline-flex rounded-xl bg-yellow-300 px-6 py-3 font-black text-[#08060d]"
          >
            Iniciar sesión administrativa
          </Link>
        </div>
      </div>
    );
  }

  if (error || !access) {
    return (
      <div className="min-h-screen bg-[#050510] px-4 pt-32 text-white">
        <div className="mx-auto max-w-lg rounded-3xl border border-red-400/20 bg-[#111322] p-8 text-center">
          <ShieldAlert className="mx-auto text-red-300" size={46} />
          <h1 className="mt-5 text-2xl font-black">Tarjeta no válida</h1>
          <p className="mt-3 text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] px-4 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-2xl">
        <div className={`rounded-3xl border p-7 ${
          access.access_allowed
            ? 'border-green-400/30 bg-gradient-to-br from-green-400/15 to-[#111322]'
            : 'border-red-400/30 bg-gradient-to-br from-red-400/15 to-[#111322]'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#b7b9cf]">
                Control de acceso
              </p>
              <h1 className="mt-2 text-3xl font-black">{access.member_name}</h1>
              <p className="mt-1 font-mono text-[#a7a8c7]">{access.member_number}</p>
            </div>
            {access.access_allowed
              ? <ShieldCheck className="text-green-300" size={42} />
              : <ShieldAlert className="text-red-300" size={42} />}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-[#8b8faa]">Estado</p>
              <p className="mt-2 font-black">{access.status}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-[#8b8faa]">Visitas</p>
              <p className="mt-2 font-black">{access.visits_used} / {access.visit_limit}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-[#8b8faa]">Identidad +18</p>
              <p className="mt-2 flex items-center gap-2 font-black">
                {access.adult_verified ? <CheckCircle2 className="text-green-300" size={18} /> : <ShieldAlert className="text-red-300" size={18} />}
                {access.adult_verified ? 'Verificada' : 'Pendiente'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-widest text-[#8b8faa]">Vigencia</p>
              <p className="mt-2 flex items-center gap-2 font-black">
                <Clock3 size={18} /> {formatDate(access.ends_at)}
              </p>
            </div>
          </div>

          <div className={`mt-6 rounded-2xl border p-4 ${
            access.access_allowed
              ? 'border-green-400/20 bg-green-400/10 text-green-100'
              : 'border-red-400/20 bg-red-400/10 text-red-100'
          }`}>
            <p className="flex items-center gap-2 font-bold">
              <UserCheck size={19} /> {access.reason}
            </p>
          </div>

          <button
            onClick={() => registerAccess(access.currently_inside ? 'out' : 'in')}
            disabled={working || (!access.access_allowed && !access.currently_inside)}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black disabled:cursor-not-allowed disabled:opacity-40 ${
              access.currently_inside
                ? 'bg-orange-500 text-white'
                : 'bg-green-400 text-[#07100a]'
            }`}
          >
            {working
              ? <Loader2 className="animate-spin" />
              : access.currently_inside ? <LogOut /> : <LogIn />}
            {access.currently_inside ? 'Registrar salida' : 'Registrar ingreso'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VipAccess;
