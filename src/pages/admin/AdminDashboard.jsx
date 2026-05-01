import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '@/hooks/useAdminData';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Boxes,
  CalendarDays,
  Clock3,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Package,
  FileText,
  Siren,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString();
};

const StatCard = ({ title, value, hint, icon: Icon, tone, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#121525] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
  >
    <div className={`absolute inset-x-0 top-0 h-1 ${tone}`} />
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8f98bf]">{title}</p>
        <p className="mt-3 text-3xl font-black text-white">{value}</p>
        <p className="mt-2 text-sm text-[#9ea6c9]">{hint}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const {
    stats,
    users,
    pqr,
    orders,
    bookings,
    fetchStats,
    fetchUsers,
    fetchPqr,
    fetchOrders,
    fetchBookings,
  } = useAdminData();

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchPqr();
    fetchOrders();
    fetchBookings();
  }, []);

  const urgentPqr = useMemo(
    () => pqr.filter((item) => !['closed', 'replied'].includes(item.status || 'open')).slice(0, 4),
    [pqr]
  );

  const recentOrders = useMemo(() => orders.slice(0, 4), [orders]);
  const recentUsers = useMemo(() => users.slice(0, 4), [users]);
  const recentBookings = useMemo(() => bookings.slice(0, 4), [bookings]);

  const openOrders = useMemo(
    () => orders.filter((order) => ['pending', 'paid', 'shipped'].includes(order.status || 'pending')).length,
    [orders]
  );

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => ['pending', 'confirmed'].includes(booking.status || 'pending')).length,
    [bookings]
  );

  const unresolvedLoad = urgentPqr.length + openOrders + pendingBookings;

  const commandStatus = useMemo(() => {
    if (unresolvedLoad >= 8) {
      return {
        label: 'Operacion exigida',
        detail: 'Hay acumulacion de frentes abiertos. Conviene priorizar PQR, pedidos y agenda hoy.',
        tone: 'border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fecaca]',
      };
    }

    if (unresolvedLoad >= 3) {
      return {
        label: 'Operacion vigilada',
        detail: 'El backoffice tiene carga activa moderada y requiere seguimiento continuo.',
        tone: 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fde68a]',
      };
    }

    return {
      label: 'Operacion estable',
      detail: 'No hay saturacion visible en incidencias, pedidos ni agenda.',
      tone: 'border-[#22c55e]/30 bg-[#22c55e]/10 text-[#bbf7d0]',
    };
  }, [unresolvedLoad]);

  const pendingRevenue = useMemo(
    () =>
      orders
        .filter((order) => ['pending', 'paid'].includes(order.status || 'pending'))
        .reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    [orders]
  );

  const pendingRevenueLabel = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(pendingRevenue);

  const quickActions = [
    {
      title: 'Gestionar perfiles',
      description: 'Revisa usuarios, datos de contacto y actividad reciente.',
      icon: Users,
      path: '/admin/users',
      accent: 'from-[#0ea5e9] to-[#22d3ee]',
    },
    {
      title: 'Actualizar inventario',
      description: 'Agrega productos, ajusta stock y destaca novedades.',
      icon: Boxes,
      path: '/admin/products',
      accent: 'from-[#f97316] to-[#facc15]',
    },
    {
      title: 'Atender PQR',
      description: 'Responde incidencias y cierra casos pendientes.',
      icon: MessageSquare,
      path: '/admin/pqr',
      accent: 'from-[#ef4444] to-[#f97316]',
    },
    {
      title: 'Programación y citas',
      description: 'Controla reservas activas y cambios de agenda.',
      icon: CalendarDays,
      path: '/admin/bookings',
      accent: 'from-[#22c55e] to-[#14b8a6]',
    },
    {
      title: 'Publicidad y galería',
      description: 'Actualiza imágenes, campañas y material visual.',
      icon: ImageIcon,
      path: '/admin/gallery',
      accent: 'from-[#a855f7] to-[#ec4899]',
    },
    {
      title: 'Podcast y contenido',
      description: 'Publica episodios, historias y contenido educativo.',
      icon: Mic,
      path: '/admin/podcast',
      accent: 'from-[#8b5cf6] to-[#6366f1]',
    },
  ];

  const commandMetrics = [
    {
      title: 'Usuarios registrados',
      value: stats.usersCount,
      hint: 'Base de clientes y perfiles activos.',
      icon: Users,
      tone: 'bg-[#22d3ee]',
    },
    {
      title: 'Inventario visible',
      value: stats.productsCount,
      hint: 'Productos listados en la tienda.',
      icon: ShoppingBag,
      tone: 'bg-[#facc15]',
    },
    {
      title: 'Ordenes en flujo',
      value: openOrders,
      hint: 'Pedidos pendientes, pagos o en envio.',
      icon: Package,
      tone: 'bg-[#4ade80]',
    },
    {
      title: 'PQR pendientes',
      value: urgentPqr.length,
      hint: 'Casos que necesitan revision o respuesta.',
      icon: AlertCircle,
      tone: 'bg-[#fb7185]',
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_85%_20%,_rgba(249,115,22,0.18),_transparent_26%),linear-gradient(145deg,_#121429,_#090b15_70%)] p-7 md:p-9">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-[#22d3ee]/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-[#f97316]/10 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#b8c0e3]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Centro de control administrativo
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Panel para operar perfiles, inventario, pedidos, citas y publicidad.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#c1c8e8] md:text-base">
              Este espacio ya no se comporta como el panel de usuario. Ahora resume lo urgente,
              muestra actividad real y te da entrada directa a los modulos de gestion.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 rounded-[28px] border border-white/10 bg-[#0c0f1c]/80 p-4 backdrop-blur">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8f98bf]">Ingresos por confirmar</p>
                <p className="mt-1 text-xl font-bold text-white">{pendingRevenueLabel}</p>
              </div>
              <FileText className="h-5 w-5 text-[#22d3ee]" />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#8f98bf]">Contenido publicado</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {stats.educationCount + stats.podcastCount + stats.storiesCount}
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-[#f97316]" />
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${commandStatus.tone}`}>
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.2em]">Estado de operacion</p>
              </div>
              <p className="mt-2 text-base font-bold">{commandStatus.label}</p>
              <p className="mt-1 text-sm opacity-90">{commandStatus.detail}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {commandMetrics.map((item, index) => (
          <StatCard key={item.title} {...item} delay={0.08 * (index + 1)} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.95fr]">
        <div className="rounded-[30px] border border-white/10 bg-[#111322] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f98bf]">Prioridades</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Acciones rapidas de administracion</h2>
            </div>
            <Activity className="h-5 w-5 text-[#22d3ee]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group rounded-[24px] border border-white/10 bg-[#0c0f1c] p-4 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#14182b]"
              >
                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${item.accent} p-3 text-white shadow-lg`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#9ea6c9]">{item.description}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Abrir modulo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[#111322] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f98bf]">Alertas</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Lo que requiere tu atencion</h2>
            </div>
            <Clock3 className="h-5 w-5 text-[#f97316]" />
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[#fb7185]/20 bg-[#fb7185]/10 p-4">
              <p className="text-sm font-semibold text-white">PQR abiertas</p>
              <p className="mt-1 text-sm text-[#fbc7d4]">
                {urgentPqr.length > 0
                  ? `Tienes ${urgentPqr.length} casos esperando respuesta o cierre.`
                  : 'No hay casos urgentes en el buzon.'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/10 p-4">
              <p className="text-sm font-semibold text-white">Ordenes activas</p>
              <p className="mt-1 text-sm text-[#b4edf7]">
                {openOrders > 0
                  ? `${openOrders} pedidos siguen en proceso de pago, envio o entrega.`
                  : 'No hay pedidos operativos pendientes.'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#a855f7]/20 bg-[#a855f7]/10 p-4">
              <p className="text-sm font-semibold text-white">Agenda operativa</p>
              <p className="mt-1 text-sm text-[#e9d5ff]">
                {pendingBookings > 0
                  ? `${pendingBookings} citas siguen pendientes o confirmadas y requieren seguimiento.`
                  : 'La agenda no tiene citas activas por atender.'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#facc15]/20 bg-[#facc15]/10 p-4">
              <p className="text-sm font-semibold text-white">Base de contenido</p>
              <p className="mt-1 text-sm text-[#fef0b2]">
                {stats.educationCount} piezas educativas, {stats.podcastCount} episodios y {stats.storiesCount} historias publicadas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#111322] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8f98bf]">Radar operativo</p>
              <h3 className="mt-2 text-xl font-bold text-white">Puntos calientes del dia</h3>
            </div>
            <Zap className="h-5 w-5 text-[#facc15]" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#fda4af]">Incidencias</p>
              <p className="mt-2 text-3xl font-black text-white">{urgentPqr.length}</p>
              <p className="mt-2 text-sm text-[#fecdd3]">Mensajes y casos sin cierre.</p>
            </div>
            <div className="rounded-2xl border border-[#22d3ee]/20 bg-[#22d3ee]/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#a5f3fc]">Pedidos</p>
              <p className="mt-2 text-3xl font-black text-white">{openOrders}</p>
              <p className="mt-2 text-sm text-[#cffafe]">Ordenes en pago, envio o entrega.</p>
            </div>
            <div className="rounded-2xl border border-[#a855f7]/20 bg-[#a855f7]/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#e9d5ff]">Agenda</p>
              <p className="mt-2 text-3xl font-black text-white">{pendingBookings}</p>
              <p className="mt-2 text-sm text-[#f3e8ff]">Reservas activas o por confirmar.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#111322] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Citas recientes</h3>
            <Link to="/admin/bookings" className="text-sm font-semibold text-[#22d3ee]">
              Ver agenda
            </Link>
          </div>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-[#0c0f1c] p-4 text-sm text-[#9ea6c9]">
                Aun no hay citas registradas.
              </p>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-white/10 bg-[#0c0f1c] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{booking.client_name || booking.style || 'Cita'}</p>
                      <p className="mt-1 text-sm text-[#9ea6c9]">
                        {booking.appointment_date || 'Sin fecha'} {booking.appointment_time ? `• ${booking.appointment_time}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[#aeb6da]">
                      {booking.status || 'pending'}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[#6f789f]">Artista: {booking.artist || 'No asignado'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-[#111322] p-6 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">PQR recientes</h3>
            <Link to="/admin/pqr" className="text-sm font-semibold text-[#22d3ee]">
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {urgentPqr.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-[#0c0f1c] p-4 text-sm text-[#9ea6c9]">
                No hay mensajes urgentes por revisar.
              </p>
            ) : (
              urgentPqr.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-[#0c0f1c] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.subject || 'Sin asunto'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8f98bf]">{item.status || 'open'}</p>
                    </div>
                    <MessageSquare className="h-4 w-4 text-[#fb7185]" />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-[#9ea6c9]">{item.message || 'Sin mensaje'}</p>
                  <p className="mt-3 text-xs text-[#6f789f]">{formatDate(item.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#111322] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Pedidos recientes</h3>
            <Link to="/admin/orders" className="text-sm font-semibold text-[#22d3ee]">
              Ver pedidos
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-[#0c0f1c] p-4 text-sm text-[#9ea6c9]">
                Aun no hay pedidos registrados.
              </p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-[#0c0f1c] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">#{order.id?.slice(0, 8)?.toUpperCase?.() || 'ORDEN'}</p>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[#aeb6da]">
                      {order.status || 'pending'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#9ea6c9]">{formatDate(order.created_at)}</p>
                  <p className="mt-3 text-lg font-bold text-[#22d3ee]">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(order.total_amount || 0))}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#111322] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Perfiles recientes</h3>
            <Link to="/admin/users" className="text-sm font-semibold text-[#22d3ee]">
              Ver usuarios
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-[#0c0f1c] p-4 text-sm text-[#9ea6c9]">
                No hay perfiles disponibles.
              </p>
            ) : (
              recentUsers.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0c0f1c] p-4">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white">
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt={item.full_name || 'Usuario'} className="h-full w-full object-cover" />
                    ) : (
                      (item.full_name || item.email || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{item.full_name || 'Perfil sin nombre'}</p>
                    <p className="truncate text-sm text-[#9ea6c9]">{item.email || item.phone || 'Sin contacto visible'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Link to="/admin/education" className="rounded-[24px] border border-white/10 bg-[#111322] p-5 transition-all hover:border-white/20 hover:bg-[#15192c]">
          <BookOpen className="mb-4 h-6 w-6 text-[#facc15]" />
          <p className="text-lg font-semibold text-white">Educacion</p>
          <p className="mt-1 text-sm text-[#9ea6c9]">Gestiona guias, tutoriales y contenido formativo.</p>
        </Link>
        <Link to="/admin/podcast" className="rounded-[24px] border border-white/10 bg-[#111322] p-5 transition-all hover:border-white/20 hover:bg-[#15192c]">
          <Mic className="mb-4 h-6 w-6 text-[#a855f7]" />
          <p className="text-lg font-semibold text-white">Podcast</p>
          <p className="mt-1 text-sm text-[#9ea6c9]">Publica episodios e historias para la comunidad.</p>
        </Link>
        <Link to="/admin/gallery" className="rounded-[24px] border border-white/10 bg-[#111322] p-5 transition-all hover:border-white/20 hover:bg-[#15192c]">
          <ImageIcon className="mb-4 h-6 w-6 text-[#ec4899]" />
          <p className="text-lg font-semibold text-white">Publicidad visual</p>
          <p className="mt-1 text-sm text-[#9ea6c9]">Actualiza galerias, banners y recursos comerciales.</p>
        </Link>
        <Link to="/admin/activity" className="rounded-[24px] border border-white/10 bg-[#111322] p-5 transition-all hover:border-white/20 hover:bg-[#15192c]">
          <Activity className="mb-4 h-6 w-6 text-[#22d3ee]" />
          <p className="text-lg font-semibold text-white">Actividad live</p>
          <p className="mt-1 text-sm text-[#9ea6c9]">Monitorea eventos y acciones recientes del sitio.</p>
        </Link>
      </section>
    </div>
  );
};

export default AdminDashboard;
