import React, { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { User, Calendar, ShoppingBag, LogOut, LayoutDashboard, Heart, MessageSquare as MessageSquareWarning, PhoneCall, MessageCircle } from 'lucide-react';

const UserLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Resumen y Soporte', path: '/user' },
    { icon: User, label: 'Mi Perfil', path: '/user/profile' },
    { icon: MessageCircle, label: 'Chat y Comunidad', path: '/user/chat' },
    { icon: Calendar, label: 'Mis Citas', path: '/user/bookings' },
    { icon: ShoppingBag, label: 'Mis Pedidos', path: '/user/orders' },
    { icon: Heart, label: 'Lista de Deseos', path: '/user/wishlist' },
    { icon: MessageSquareWarning, label: 'PQR / Ayuda', path: '/user/pqr' },
  ];

  return (
    <div className="min-h-screen bg-[#050510] pt-20 flex flex-col md:flex-row container mx-auto px-4 gap-8 pb-12">
      
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full md:w-64 flex-shrink-0"
      >
        <div className="bg-[#111322] border border-white/10 rounded-2xl p-4 sticky top-24">
          <div className="flex items-center gap-3 p-4 mb-4 border-b border-white/5">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff2df0] to-[#00e5ff] flex items-center justify-center text-[#050510] font-bold text-lg">
                {user.email.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
                <p className="text-white font-medium truncate">Mi Cuenta</p>
                <p className="text-xs text-[#a7a8c7] truncate">{user.email}</p>
             </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                    location.pathname === item.path
                      ? 'bg-[#ff2df0] text-white font-semibold'
                      : 'text-[#a7a8c7] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
          
          <div className="px-4 pt-6 pb-2">
             <p className="text-xs font-bold text-[#a7a8c7] uppercase mb-2">Soporte Directo</p>
             <div className="flex gap-2">
                <a href="https://wa.me/573023006986" target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] py-2 rounded-lg flex items-center justify-center transition-colors">
                   <PhoneCall size={18} />
                </a>
                <a href="tel:+573023006986" className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg flex items-center justify-center transition-colors">
                   <PhoneCall size={18} />
                </a>
             </div>
          </div>

          <div className="pt-2 mt-2 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-[#ef4444] hover:bg-[#ef4444]/10 rounded-xl transition-all font-medium"
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1"
      >
        <Outlet />
      </motion.main>
    </div>
  );
};

export default UserLayout;
