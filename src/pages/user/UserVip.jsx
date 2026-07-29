import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Crown,
  Loader2,
  Nfc,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const statusLabels = {
  requested: 'Solicitud pendiente',
  active: 'Activa',
  past_due: 'Pago pendiente',
  suspended: 'Suspendida',
  cancelled: 'Cancelada',
  expired: 'Vencida',
};

const statusTone = {
  requested: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200',
  active: 'border-green-400/30 bg-green-400/10 text-green-200',
  past_due: 'border-orange-400/30 bg-orange-400/10 text-orange-200',
  suspended: 'border-red-400/30 bg-red-400/10 text-red-200',
  cancelled: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
  expired: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
};

const formatDate = (value, withTime = false) => {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
    timeZone: 'America/Bogota',
  }).format(new Date(value));
};

const UserVip = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [plan, setPlan] = useState(null);
  const [membership, setMembership] = useState(null);
  const [token, setToken] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [application, setApplication] = useState(null);
  const [reservationStart, setReservationStart] = useState('');

  const loadVip = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: planData } = await supabase
      .from('vip_plans')
      .select('*')
      .eq('code', 'vip-mensual')
      .maybeSingle();

    const { data: membershipData, error } = await supabase
      .from('vip_memberships')
      .select('*, vip_plans(*)')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: applicationData } = await supabase
      .from('vip_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      toast({
        variant: 'destructive',
        title: 'Falta configurar Sala VIP',
        description: 'Ejecuta primero el archivo SQL de membresías en Supabase.',
      });
    }

    setPlan(planData || membershipData?.vip_plans || null);
    setMembership(membershipData || null);
    setApplication(applicationData || null);

    if (membershipData?.id) {
      const [tokenResult, reservationResult, logsResult, paymentsResult] = await Promise.all([
        supabase
          .from('vip_access_tokens')
          .select('*')
          .eq('membership_id', membershipData.id)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('vip_reservations')
          .select('*')
          .eq('membership_id', membershipData.id)
          .order('starts_at', { ascending: false })
          .limit(20),
        supabase
          .from('vip_access_logs')
          .select('*')
          .eq('membership_id', membershipData.id)
          .order('checked_in_at', { ascending: false })
          .limit(50),
        supabase
          .from('vip_payments')
          .select('*')
          .eq('membership_id', membershipData.id)
          .eq('status', 'approved')
          .order('period_start', { ascending: false })
          .limit(20),
      ]);

      setToken(tokenResult.data || null);
      setReservations(reservationResult.data || []);
      setAccessLogs(logsResult.data || []);
      setPayments(paymentsResult.data || []);
    } else {
      setToken(null);
      setReservations([]);
      setAccessLogs([]);
      setPayments([]);
    }

    setLoading(false);
  }, [toast, user?.id]);

  useEffect(() => {
    loadVip();
  }, [loadVip]);

  const periodVisits = useMemo(() => {
    if (!membership?.starts_at) return accessLogs.length;
    const now = Date.now();
    const currentPayment = payments.find((item) => (
      item.period_start
      && item.period_end
      && new Date(item.period_start).getTime() <= now
      && new Date(item.period_end).getTime() > now
    ));
    const start = new Date(currentPayment?.period_start || membership.starts_at).getTime();
    const end = currentPayment?.period_end
      ? new Date(currentPayment.period_end).getTime()
      : membership.ends_at ? new Date(membership.ends_at).getTime() : Infinity;
    return accessLogs.filter((item) => {
      const checkIn = new Date(item.checked_in_at).getTime();
      return checkIn >= start && checkIn < end;
    }).length;
  }, [accessLogs, membership, payments]);

  const accessUrl = token?.token
    ? `${window.location.origin}/vip/access/${token.token}`
    : '';

  const createReservation = async () => {
    if (!reservationStart) return;
    setWorking(true);
    const { error } = await supabase.rpc('vip_create_reservation', {
      p_starts_at: new Date(reservationStart).toISOString(),
      p_duration_minutes: Math.min(plan?.max_visit_minutes || 120, 120),
    });
    setWorking(false);

    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo reservar', description: error.message });
      return;
    }

    setReservationStart('');
    toast({ title: 'Reserva confirmada', description: 'Tu cupo quedó separado.' });
    loadVip();
  };

  const cancelReservation = async (reservationId) => {
    setWorking(true);
    const { error } = await supabase.rpc('vip_cancel_reservation', {
      p_reservation_id: reservationId,
    });
    setWorking(false);

    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo cancelar', description: error.message });
      return;
    }
    loadVip();
  };

  const requestCancellation = async () => {
    if (!window.confirm('¿Deseas detener la renovación de la membresía?')) return;
    const { error } = await supabase.rpc('vip_request_cancellation');
    if (error) {
      toast({ variant: 'destructive', title: 'No se pudo solicitar', description: error.message });
      return;
    }
    toast({ title: 'Solicitud registrada', description: 'No se realizará una nueva renovación.' });
    loadVip();
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-[#a7a8c7]">
        <Loader2 className="mr-3 animate-spin" /> Cargando membresía VIP...
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">Casa VIP</p>
          <h1 className="mt-2 text-3xl font-black text-white">Solicita tu membresía mensual</h1>
          <p className="mt-2 text-[#a7a8c7]">
            La solicitud no activa el acceso inmediatamente. Administración debe verificar pago,
            identidad, mayoría de edad y cupo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-3xl border border-yellow-300/20 bg-[#111322] p-7">
            <div className="flex items-center gap-3">
              <Crown className="text-yellow-300" />
              <h2 className="text-xl font-black text-white">{plan?.name || 'Casa VIP Mensual'}</h2>
            </div>
            <p className="mt-5 text-4xl font-black text-white">
              ${(Number(plan?.monthly_price || 79900)).toLocaleString('es-CO')}
              <span className="text-sm font-medium text-[#a7a8c7]"> COP / mes</span>
            </p>
            <ul className="mt-6 space-y-3">
              {(plan?.benefits || []).map((benefit) => (
                <li key={benefit} className="flex gap-3 text-[#d7d8ea]">
                  <CheckCircle2 size={18} className="mt-0.5 flex-none text-green-400" />
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111322] p-7">
            <h2 className="text-xl font-black text-white">Afiliación en tres pasos</h2>
            <ol className="mt-5 space-y-4 text-sm text-[#c7c9dd]">
              <li><strong className="text-white">1.</strong> Completa la solicitud y adjunta los documentos.</li>
              <li><strong className="text-white">2.</strong> Paga el primer mes en línea con Bold.</li>
              <li><strong className="text-white">3.</strong> Administración verifica identidad y habilita el acceso.</li>
            </ol>

            {application?.status === 'payment_pending' ? (
              <Link
                to="/vip/checkout"
                onClick={() => sessionStorage.setItem('vip_application_id', application.id)}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-black text-[#0b0710]"
              >
                <CreditCard size={18} /> Continuar pago pendiente
              </Link>
            ) : (
              <Link
                to="/user/vip/apply"
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-300 px-5 py-3 font-black text-[#0b0710]"
              >
                <Crown size={18} /> Completar solicitud y pagar
              </Link>
            )}
            <p className="mt-4 text-xs leading-5 text-[#8589aa]">
              La solicitud solamente se envía después de que el servidor confirma el pago.
            </p>
          </section>
        </div>
      </div>
    );
  }

  const canReserve = membership.status === 'active' && membership.adult_verified;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">Mi Casa VIP</p>
          <h1 className="mt-2 text-3xl font-black text-white">{membership.member_number}</h1>
        </div>
        <span className={`w-fit rounded-full border px-4 py-2 text-sm font-black ${statusTone[membership.status]}`}>
          {statusLabels[membership.status] || membership.status}
        </span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#111322] p-5">
          <CreditCard className="text-pink-400" />
          <p className="mt-3 text-xs uppercase tracking-widest text-[#8589aa]">Plan</p>
          <p className="mt-1 font-black text-white">{membership.vip_plans?.name}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111322] p-5">
          <CalendarDays className="text-cyan-300" />
          <p className="mt-3 text-xs uppercase tracking-widest text-[#8589aa]">Vigencia</p>
          <p className="mt-1 font-black text-white">{formatDate(membership.ends_at)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111322] p-5">
          <CheckCircle2 className="text-green-300" />
          <p className="mt-3 text-xs uppercase tracking-widest text-[#8589aa]">Visitas utilizadas</p>
          <p className="mt-1 font-black text-white">{periodVisits} / {membership.vip_plans?.visit_limit || 8}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#111322] p-5">
          {membership.adult_verified
            ? <CheckCircle2 className="text-green-300" />
            : <ShieldAlert className="text-yellow-300" />}
          <p className="mt-3 text-xs uppercase tracking-widest text-[#8589aa]">Identidad</p>
          <p className="mt-1 font-black text-white">
            {membership.adult_verified ? 'Verificada' : 'Pendiente en recepción'}
          </p>
        </div>
      </section>

      {accessUrl && (
        <section className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 to-pink-500/10 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-200">
                <Nfc />
                <h2 className="text-xl font-black">Credencial NFC activa</h2>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-[#c7c9dd]">
                Este enlace se graba en la tarjeta. La tarjeta es personal y debe presentarse junto
                con el documento cuando el personal lo solicite.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(accessUrl);
                toast({ title: 'Enlace copiado' });
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 font-bold text-white"
            >
              <Copy size={18} /> Copiar enlace NFC
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-white/10 bg-[#111322] p-6">
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <Clock3 className="text-pink-400" /> Nueva reserva
          </h2>
          {!canReserve ? (
            <p className="mt-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
              La reserva se habilita cuando la membresía esté activa y la identidad haya sido verificada.
            </p>
          ) : (
            <>
              <label className="mt-5 block text-sm text-[#a7a8c7]">Fecha y hora</label>
              <input
                type="datetime-local"
                value={reservationStart}
                onChange={(event) => setReservationStart(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
              />
              <button
                onClick={createReservation}
                disabled={!reservationStart || working}
                className="mt-4 w-full rounded-xl bg-pink-500 px-5 py-3 font-black text-white disabled:opacity-50"
              >
                Reservar 2 horas
              </button>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111322] p-6">
          <h2 className="text-xl font-black text-white">Mis reservas</h2>
          <div className="mt-5 space-y-3">
            {reservations.length === 0 ? (
              <p className="text-[#8589aa]">Todavía no tienes reservas.</p>
            ) : reservations.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-white">{formatDate(item.starts_at, true)}</p>
                  <p className="mt-1 text-sm text-[#8f93b5]">
                    Hasta {formatDate(item.ends_at, true)} · {item.status}
                  </p>
                </div>
                {item.status === 'confirmed' && new Date(item.starts_at) > new Date() && (
                  <button
                    onClick={() => cancelReservation(item.id)}
                    disabled={working}
                    className="flex items-center gap-2 text-sm font-bold text-red-300"
                  >
                    <XCircle size={17} /> Cancelar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {['requested', 'active', 'past_due'].includes(membership.status) && (
        <div className="flex justify-end">
          <button onClick={requestCancellation} className="text-sm font-semibold text-red-300 hover:text-red-200">
            Detener renovación de membresía
          </button>
        </div>
      )}
    </div>
  );
};

export default UserVip;
