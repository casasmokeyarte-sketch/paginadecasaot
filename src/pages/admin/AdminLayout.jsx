import React, { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BookOpen,
  Boxes,
  CalendarDays,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  Package,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const navGroups = [
  {
    label: 'Control',
    items: [
      { icon: LayoutDashboard, label: 'Centro de mando', path: '/admin' },
      { icon: Activity, label: 'Actividad live', path: '/admin/activity' },
      { icon: MessageSquare, label: 'PQR y mensajes', path: '/admin/pqr' },
    ],
  },
  {
    label: 'Operacion',
    items: [
      { icon: Users, label: 'Perfiles', path: '/admin/users' },
      { icon: ShoppingBag, label: 'Inventario', path: '/admin/products' },
      { icon: Package, label: 'Ordenes', path: '/admin/orders' },
      { icon: CalendarDays, label: 'Citas', path: '/admin/bookings' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { icon: BookOpen, label: 'Educacion', path: '/admin/education' },
      { icon: Mic, label: 'Podcast e historias', path: '/admin/podcast' },
      { icon: ImageIcon, label: 'Publicidad visual', path: '/admin/gallery' },
    ],
  },
];

const quickSignals = [
  {
    icon: ShieldCheck,
    title: 'Modo administrador',
    description: 'Acceso a modulos criticos y configuracion operativa.',
  },
  {
    icon: Boxes,
    title: 'Gestion centralizada',
    description: 'Perfiles, inventario, ventas, agenda y contenido.',
  },
];

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading, signOut } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }

    if (!isAdmin) {
      navigate('/user', { replace: true });
      return;
    }

    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [user, isAdmin, loading, navigate]);

  const activeSection = useMemo(() => {
    for (const group of navGroups) {
      const match = group.items.find((item) =>
        item.path === '/admin'
          ? location.pathname === '/admin'
          : location.pathname.startsWith(item.path)
      );
      if (match) return match.label;
    }
    return 'Centro de mando';
  }, [location.pathname]);

  if (loading || !user || !isAdmin) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  const displayName = profile?.full_name?.trim() || user.email;

  const sidebar = (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex h-full w-[320px] max-w-[86vw] flex-col border-r border-white/10 bg-[linear-gradient(180deg,_rgba(15,18,32,0.98),_rgba(7,9,17,0.98))] text-[#f5f5f5] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
    >
      <div className="border-b border-white/10 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <img
                src="https://horizons-cdn.hostinger.com/9c34d6a0-7f3d-4ce5-a2cd-77bc39639101/5042524decaeef7dde8cc84509a7f9d8.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#8f98bf]">Backoffice</p>
              <h1 className="text-lg font-black text-white">Casa Smoke y Arte</h1>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#aeb6da] transition hover:bg-white/10 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,_rgba(34,211,238,0.12),_rgba(249,115,22,0.08),_rgba(255,255,255,0.04))] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-black text-white">
              {(displayName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-xs text-[#b9c2e3]">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0b0e1a]/70 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8f98bf]">Sesion activa</p>
            <p className="mt-1 text-sm font-semibold text-white">Administrador principal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#70789f]">
                {group.label}
              </p>
              <div className="mt-3 space-y-1.5">
                {group.items.map((item) => {
                  const isActive =
                    item.path === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.path);

                  return (
                    <Link key={item.path} to={item.path} onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}>
                      <div
                        className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                          isActive
                            ? 'border-[#22d3ee]/40 bg-[linear-gradient(90deg,_rgba(34,211,238,0.16),_rgba(255,255,255,0.04))] text-white shadow-[0_16px_40px_rgba(34,211,238,0.08)]'
                            : 'border-transparent text-[#a7aecd] hover:border-white/10 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className={`rounded-xl p-2 ${isActive ? 'bg-white/10' : 'bg-white/5 group-hover:bg-white/10'}`}>
                          <item.icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.label}</p>
                          <p className="truncate text-xs text-[#7f88af]">
                            {item.path === '/admin' ? 'Resumen general' : 'Gestion del modulo'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3 rounded-[26px] border border-white/10 bg-[#0c0f1c] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#70789f]">Capacidades</p>
          {quickSignals.map((signal) => (
            <div key={signal.title} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 inline-flex rounded-xl border border-white/10 bg-white/5 p-2">
                <signal.icon size={16} className="text-white" />
              </div>
              <p className="text-sm font-semibold text-white">{signal.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#9ea6c9]">{signal.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/10 px-4 py-3 text-[#fecaca] transition hover:bg-[#ef4444]/15"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Cerrar sesion administrativa</span>
        </button>
      </div>
    </motion.aside>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.08),_transparent_18%),radial-gradient(circle_at_85%_0%,_rgba(249,115,22,0.08),_transparent_20%),linear-gradient(180deg,_#06070d,_#090b14_55%,_#06070d)] text-[#f5f5f5]">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">{sidebar}</div>

        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
              />
              <div className="fixed inset-y-0 left-0 z-50 lg:hidden">{sidebar}</div>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0e18]/80 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-white transition hover:bg-white/10"
                >
                  <Menu size={18} />
                </button>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#7c86ad]">Seccion activa</p>
                  <h2 className="text-lg font-bold text-white">{activeSection}</h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 md:block">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#7c86ad]">Rol</p>
                  <p className="text-sm font-semibold text-white">Administrador</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#22d3ee,_#f97316)] text-sm font-black text-[#050510]">
                    {(displayName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden text-right md:block">
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                    <p className="text-xs text-[#8f98bf]">Control total de la plataforma</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto px-4 py-5 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
