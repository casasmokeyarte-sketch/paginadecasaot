import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Clock3, RefreshCw, User } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleString('es-CO');
};

const shortId = (value) => {
  if (!value) return 'Anónimo';
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};

const AdminLiveActivity = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: queryError } = await supabase
        .from('user_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(80);

      if (queryError) throw queryError;
      setEvents(data || []);
    } catch (fetchError) {
      setError(fetchError?.message || 'No fue posible cargar actividad.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('admin:user-events:live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_events' },
        (payload) => {
          const event = payload?.new;
          if (!event) return;
          setEvents((prev) => [event, ...prev].slice(0, 80));
        }
      )
      .subscribe((newStatus) => {
        setStatus(newStatus);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeLast5Min = useMemo(() => {
    const threshold = Date.now() - 5 * 60 * 1000;
    return events.filter((event) => {
      const created = new Date(event.created_at).getTime();
      return Number.isFinite(created) && created >= threshold;
    }).length;
  }, [events]);

  const realtimeLabel =
    status === 'SUBSCRIBED' ? 'Conectado en tiempo real' : 'Reconectando...';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Actividad en vivo</h1>
          <p className="text-[#a7a8c7]">
            Eventos recientes de uso capturados desde la web.
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-[#a7a8c7] hover:bg-white/10 hover:text-white transition-colors"
        >
          <RefreshCw size={16} />
          Recargar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111322] border border-white/5 rounded-2xl p-5">
          <p className="text-[#a7a8c7] text-sm">Eventos cargados</p>
          <p className="text-3xl font-bold text-white mt-2">{events.length}</p>
        </div>
        <div className="bg-[#111322] border border-white/5 rounded-2xl p-5">
          <p className="text-[#a7a8c7] text-sm">Ultimos 5 minutos</p>
          <p className="text-3xl font-bold text-white mt-2">{activeLast5Min}</p>
        </div>
        <div className="bg-[#111322] border border-white/5 rounded-2xl p-5">
          <p className="text-[#a7a8c7] text-sm">Realtime</p>
          <p className="text-sm font-semibold text-white mt-2">{realtimeLabel}</p>
        </div>
      </div>

      <div className="bg-[#111322] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold">Stream de eventos</h2>
        </div>

        {loading && (
          <div className="px-5 py-8 text-[#a7a8c7] text-sm">Cargando actividad...</div>
        )}

        {!loading && error && (
          <div className="px-5 py-8 text-sm text-[#ef4444]">
            {error}. Verifica que la tabla <code>user_events</code> exista y tenga permisos.
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="px-5 py-8 text-sm text-[#a7a8c7]">
            Aun no hay eventos. Cuando naveguen usuarios en la web apareceran aqui.
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="divide-y divide-white/5">
            {events.map((event) => (
              <div key={event.id} className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#00e5ff]">
                    <Activity size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium break-words">
                      {event.action || 'evento'}
                    </p>
                    <p className="text-[#a7a8c7] text-xs break-words">
                      {event.page || '/'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#a7a8c7]">
                  <span className="inline-flex items-center gap-1">
                    <User size={14} />
                    {shortId(event.user_id)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={14} />
                    {formatDate(event.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLiveActivity;
