import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  Loader2,
  Nfc,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const statuses = {
  requested: ['Solicitud', 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200'],
  active: ['Activa', 'border-green-400/30 bg-green-400/10 text-green-200'],
  past_due: ['Pago pendiente', 'border-orange-400/30 bg-orange-400/10 text-orange-200'],
  suspended: ['Suspendida', 'border-red-400/30 bg-red-400/10 text-red-200'],
  cancelled: ['Cancelada', 'border-slate-400/30 bg-slate-400/10 text-slate-300'],
  expired: ['Vencida', 'border-slate-400/30 bg-slate-400/10 text-slate-300'],
};

const formatDate = (value, withTime = false) => {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
    timeZone: 'America/Bogota',
  }).format(new Date(value));
};

const AdminVip = () => {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [tokens, setTokens] = useState({});
  const [todayReservations, setTodayReservations] = useState([]);
  const [todayAccesses, setTodayAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [membersResult, reservationsResult, accessResult] = await Promise.all([
      supabase
        .from('vip_memberships')
        .select('*, vip_plans(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('vip_reservations')
        .select('*')
        .gte('starts_at', start.toISOString())
        .lt('starts_at', end.toISOString())
        .order('starts_at'),
      supabase
        .from('vip_access_logs')
        .select('*')
        .gte('checked_in_at', start.toISOString())
        .lt('checked_in_at', end.toISOString())
        .order('checked_in_at', { ascending: false }),
    ]);

    if (membersResult.error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo abrir Sala VIP',
        description: 'Ejecuta primero el SQL de membresías en Supabase.',
      });
      setLoading(false);
      return;
    }

    const memberRows = membersResult.data || [];
    setMemberships(memberRows);
    setTodayReservations(reservationsResult.data || []);
    setTodayAccesses(accessResult.data || []);

    if (memberRows.length) {
      const userIds = [...new Set(memberRows.map((item) => item.user_id))];
      const membershipIds = memberRows.map((item) => item.id);
      const [profilesResult, tokensResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, phone, role')
          .in('id', userIds),
        supabase
          .from('vip_access_tokens')
          .select('*')
          .in('membership_id', membershipIds)
          .eq('is_active', true),
      ]);

      setProfiles(
        Object.fromEntries((profilesResult.data || []).map((profile) => [profile.id, profile]))
      );
      setTokens(
        Object.fromEntries((tokensResult.data || []).map((token) => [token.membership_id, token]))
      );
    } else {
      setProfiles({});
      setTokens({});
    }

    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => ({
    active: memberships.filter((item) => item.status === 'active').length,
    pending: memberships.filter((item) => item.status === 'requested').length,
    reservations: todayReservations.filter((item) => !['cancelled', 'no_show'].includes(item.status)).length,
    inside: todayAccesses.filter((item) => !item.checked_out_at).length,
  }), [memberships, todayAccesses, todayReservations]);

  const runAction = async (membershipId, action, successMessage) => {
    setWorkingId(membershipId);
    const { error } = await action();
    setWorkingId(null);
    if (error) {
      toast({ variant: 'destructive', title: 'Operación rechazada', description: error.message });
      return false;
    }
    toast({ title: successMessage });
    await loadData();
    return true;
  };

  const verifyAdult = async (membership) => {
    if (!membership.adult_verified && !window.confirm(
      'Confirma que el personal revisó físicamente un documento válido y comprobó la mayoría de edad.'
    )) return;

    await runAction(
      membership.id,
      () => supabase.rpc('vip_admin_verify_adult', {
        p_membership_id: membership.id,
        p_verified: !membership.adult_verified,
      }),
      membership.adult_verified ? 'Verificación retirada' : 'Identidad y mayoría de edad verificadas'
    );
  };

  const updateStatus = async (membership, status) => {
    const actionLabel = status === 'active' ? 'activar' : status === 'suspended' ? 'suspender' : 'cancelar';
    if (!window.confirm(`¿Confirmas que deseas ${actionLabel} esta membresía?`)) return;
    await runAction(
      membership.id,
      () => supabase.rpc('vip_admin_update_membership', {
        p_membership_id: membership.id,
        p_status: status,
        p_days: 30,
      }),
      'Estado actualizado'
    );
  };

  const recordPayment = async (membership) => {
    const amountText = window.prompt(
      'Valor recibido en pesos colombianos:',
      String(Math.round(Number(membership.vip_plans?.monthly_price || 79900)))
    );
    if (amountText === null) return;
    const amount = Number(amountText.replace(/[^\d]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Valor inválido' });
      return;
    }

    const method = window.prompt(
      'Método: cash, nequi, daviplata, wompi, mercadopago, card, pse o bank_transfer',
      membership.preferred_payment_method === 'pending' ? 'cash' : membership.preferred_payment_method
    );
    if (!method) return;
    const reference = window.prompt('Referencia o número de comprobante (opcional):', '') || '';

    await runAction(
      membership.id,
      () => supabase.rpc('vip_admin_record_payment', {
        p_membership_id: membership.id,
        p_amount: amount,
        p_payment_method: method.trim().toLowerCase(),
        p_external_reference: reference,
        p_notes: 'Pago registrado desde el panel VIP.',
      }),
      'Pago registrado y vigencia actualizada'
    );
  };

  const getOrCreateToken = async (membershipId) => {
    if (tokens[membershipId]?.token) return tokens[membershipId].token;
    const { data, error } = await supabase.rpc('vip_admin_rotate_access_token', {
      p_membership_id: membershipId,
    });
    if (error) throw error;
    return data;
  };

  const copyNfcUrl = async (membershipId) => {
    try {
      const token = await getOrCreateToken(membershipId);
      const url = `${window.location.origin}/vip/access/${token}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Enlace NFC copiado' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'No se pudo crear la credencial', description: error.message });
    }
  };

  const writeNfc = async (membershipId) => {
    setWorkingId(membershipId);
    try {
      const token = await getOrCreateToken(membershipId);
      const url = `${window.location.origin}/vip/access/${token}`;

      if (!('NDEFReader' in window)) {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'El navegador no permite grabar NFC',
          description: 'El enlace quedó copiado. Usa Chrome en Android con NFC activo.',
        });
        return;
      }

      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: url }],
      });
      toast({ title: 'Tarjeta NFC programada correctamente' });
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo programar la tarjeta',
        description: error.message || 'Acerca una tarjeta NFC vacía e intenta nuevamente.',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const rotateToken = async (membershipId) => {
    if (!window.confirm('La tarjeta anterior dejará de funcionar. ¿Deseas continuar?')) return;
    await runAction(
      membershipId,
      () => supabase.rpc('vip_admin_rotate_access_token', {
        p_membership_id: membershipId,
      }),
      'Credencial anterior bloqueada y código nuevo generado'
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-[#aeb6da]">
        <Loader2 className="mr-3 animate-spin" /> Cargando operación VIP...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[34px] border border-yellow-300/20 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.16),_transparent_30%),linear-gradient(145deg,_#151428,_#090b15)] p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">Sala física</p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">Control Casa VIP</h1>
            <p className="mt-3 max-w-2xl text-[#b9c2e3]">
              Activa membresías, registra pagos, verifica identidad, programa tarjetas NFC
              y controla los ingresos.
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white"
          >
            <RefreshCw size={18} /> Actualizar
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Crown, 'Membresías activas', stats.active, 'text-yellow-300'],
          [Users, 'Solicitudes pendientes', stats.pending, 'text-pink-300'],
          [CalendarDays, 'Reservas de hoy', stats.reservations, 'text-cyan-300'],
          [BadgeCheck, 'Personas dentro', stats.inside, 'text-green-300'],
        ].map(([Icon, label, value, tone]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-[#121525] p-5">
            <Icon className={tone} />
            <p className="mt-4 text-xs uppercase tracking-widest text-[#8f98bf]">{label}</p>
            <p className="mt-2 text-3xl font-black text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[30px] border border-white/10 bg-[#101321] p-5 md:p-7">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-cyan-300" />
          <div>
            <h2 className="text-2xl font-black text-white">Miembros y solicitudes</h2>
            <p className="text-sm text-[#8f98bf]">La tarjeta no reemplaza la revisión de identidad.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {memberships.length === 0 ? (
            <p className="rounded-2xl border border-white/10 p-8 text-center text-[#8f98bf]">
              Aún no existen solicitudes VIP.
            </p>
          ) : memberships.map((membership) => {
            const profile = profiles[membership.user_id];
            const [statusLabel, statusClass] = statuses[membership.status] || [membership.status, ''];
            const working = workingId === membership.id;

            return (
              <article key={membership.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-black text-white">
                        {profile?.full_name || 'Cliente VIP'}
                      </h3>
                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass}`}>
                        {statusLabel}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-bold ${membership.adult_verified ? 'text-green-300' : 'text-yellow-300'}`}>
                        {membership.adult_verified ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {membership.adult_verified ? 'Identidad verificada' : 'Verificación pendiente'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#929abc]">
                      {membership.member_number} · {profile?.phone || 'Sin teléfono'} · vence {formatDate(membership.ends_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => verifyAdult(membership)}
                      disabled={working}
                      className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200"
                    >
                      {membership.adult_verified ? 'Retirar verificación' : 'Verificar +18'}
                    </button>
                    <button
                      onClick={() => recordPayment(membership)}
                      disabled={working}
                      className="flex items-center gap-1 rounded-xl border border-green-400/20 bg-green-400/10 px-3 py-2 text-xs font-bold text-green-200"
                    >
                      <CreditCard size={14} /> Registrar pago
                    </button>
                    {membership.status !== 'active' && (
                      <button
                        onClick={() => updateStatus(membership, 'active')}
                        disabled={working}
                        className="rounded-xl bg-green-500 px-3 py-2 text-xs font-black text-white"
                      >
                        Activar 30 días
                      </button>
                    )}
                    {membership.status === 'active' && (
                      <button
                        onClick={() => updateStatus(membership, 'suspended')}
                        disabled={working}
                        className="rounded-xl border border-orange-400/20 bg-orange-400/10 px-3 py-2 text-xs font-bold text-orange-200"
                      >
                        Suspender
                      </button>
                    )}
                    <button
                      onClick={() => copyNfcUrl(membership.id)}
                      disabled={working}
                      className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white"
                    >
                      <Copy size={14} /> Copiar NFC
                    </button>
                    <button
                      onClick={() => writeNfc(membership.id)}
                      disabled={working}
                      className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2 text-xs font-black text-white"
                    >
                      {working ? <Loader2 className="animate-spin" size={14} /> : <Nfc size={14} />}
                      Programar tarjeta
                    </button>
                    {tokens[membership.id] && (
                      <button
                        onClick={() => rotateToken(membership.id)}
                        disabled={working}
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-200"
                      >
                        Reemplazar tarjeta
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AdminVip;
