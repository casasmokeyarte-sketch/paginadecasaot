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
  UserPlus,
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
  const [guestStatus, setGuestStatus] = useState(null);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestForm, setGuestForm] = useState({
    fullName: '',
    documentType: 'CC',
    documentLast4: '',
    adultVerified: false,
  });

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
      setGuestStatus(null);
    } else {
      const accessData = data?.[0] || null;
      setAccess(accessData);
      if (!accessData) {
        setError('La tarjeta no existe o fue reemplazada.');
        setGuestStatus(null);
      } else {
        const { data: guestData } = await supabase.rpc('vip_guest_access_status', {
          p_token: token,
        });
        setGuestStatus(guestData || null);
      }
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

  const updateGuestForm = (field, value) => {
    setGuestForm((current) => ({ ...current, [field]: value }));
  };

  const registerGuest = async (event) => {
    event.preventDefault();
    if (!guestForm.adultVerified) {
      toast({
        variant: 'destructive',
        title: 'Verificación obligatoria',
        description: 'Revisa el documento físico y confirma que el invitado es mayor de 18 años.',
      });
      return;
    }

    setWorking(true);
    const { error: guestError } = await supabase.rpc('vip_register_guest', {
      p_token: token,
      p_guest_full_name: guestForm.fullName,
      p_document_type: guestForm.documentType,
      p_document_last4: guestForm.documentLast4,
      p_adult_verified: guestForm.adultVerified,
      p_notes: null,
    });
    setWorking(false);

    if (guestError) {
      toast({ variant: 'destructive', title: 'Invitado no registrado', description: guestError.message });
      return;
    }

    setGuestForm({ fullName: '', documentType: 'CC', documentLast4: '', adultVerified: false });
    setShowGuestForm(false);
    toast({ title: 'Amigo registrado', description: 'El pase mensual fue descontado correctamente.' });
    validate();
  };

  const checkOutGuest = async (guestVisitId) => {
    setWorking(true);
    const { error: guestError } = await supabase.rpc('vip_check_out_guest', {
      p_guest_visit_id: guestVisitId,
    });
    setWorking(false);
    if (guestError) {
      toast({ variant: 'destructive', title: 'Salida no registrada', description: guestError.message });
      return;
    }
    toast({ title: 'Salida del invitado registrada' });
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

          <section className="mt-7 rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black">
                  <UserPlus className="text-purple-300" /> Pases para amigos
                </h2>
                <p className="mt-1 text-sm text-[#c7c9dd]">
                  Usados: {guestStatus?.guests_used ?? 0} / {guestStatus?.guest_limit ?? 3}
                  {' '}· Disponibles: {guestStatus?.guests_remaining ?? 3}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuestForm((current) => !current)}
                disabled={
                  working
                  || !access.access_allowed
                  || !access.currently_inside
                  || Number(guestStatus?.guests_remaining ?? 0) <= 0
                }
                className="rounded-xl bg-purple-500 px-4 py-3 text-sm font-black text-white disabled:opacity-40"
              >
                {showGuestForm ? 'Cerrar formulario' : 'Registrar amigo'}
              </button>
            </div>

            {!access.currently_inside && (
              <p className="mt-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-sm text-yellow-100">
                Primero registra el ingreso del titular. Los invitados deben entrar acompañados.
              </p>
            )}

            {showGuestForm && (
              <form onSubmit={registerGuest} className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-[#c7c9dd]">Nombre completo</span>
                  <input
                    required
                    minLength={4}
                    value={guestForm.fullName}
                    onChange={(event) => updateGuestForm('fullName', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
                  />
                </label>
                <label>
                  <span className="text-sm font-semibold text-[#c7c9dd]">Tipo de documento</span>
                  <select
                    value={guestForm.documentType}
                    onChange={(event) => updateGuestForm('documentType', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
                  >
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="CE">Cédula de extranjería</option>
                    <option value="PPT">PPT</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </select>
                </label>
                <label>
                  <span className="text-sm font-semibold text-[#c7c9dd]">Últimos 4 caracteres</span>
                  <input
                    required
                    minLength={4}
                    maxLength={4}
                    value={guestForm.documentLast4}
                    onChange={(event) => updateGuestForm(
                      'documentLast4',
                      event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                    )}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 uppercase text-white"
                  />
                </label>
                <label className="flex items-start gap-3 text-sm text-[#d7d8ea] sm:col-span-2">
                  <input
                    required
                    type="checkbox"
                    checked={guestForm.adultVerified}
                    onChange={(event) => updateGuestForm('adultVerified', event.target.checked)}
                    className="mt-1"
                  />
                  Confirmo que revisé el documento físico y que el invitado es mayor de 18 años.
                </label>
                <button
                  type="submit"
                  disabled={working}
                  className="rounded-xl bg-green-400 px-5 py-3 font-black text-[#07100a] disabled:opacity-40 sm:col-span-2"
                >
                  {working ? 'Registrando...' : 'Confirmar ingreso del amigo'}
                </button>
              </form>
            )}

            {(guestStatus?.open_guests || []).length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-purple-200">
                  Invitados dentro de la sala
                </p>
                {guestStatus.open_guests.map((guest) => (
                  <div key={guest.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-white">{guest.guest_full_name}</p>
                      <p className="mt-1 text-xs text-[#a7a8c7]">
                        {guest.document_type} ••••{guest.document_last4} · ingreso {formatDate(guest.checked_in_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => checkOutGuest(guest.id)}
                      disabled={working}
                      className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-bold text-orange-200"
                    >
                      Registrar salida
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default VipAccess;
