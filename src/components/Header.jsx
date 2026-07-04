import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, LogOut, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ShoppingCart from '@/components/ShoppingCart';

const Header = ({ isNight, toggleNight }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [particles, setParticles] = useState([]);

  const triggerClickAnimation = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.parentElement;
    const containerRect = container.getBoundingClientRect();
    
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top + rect.height / 2;
    
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Math.random() + '-' + Date.now(),
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 4,
      char: i % 2 === 0 ? '⚽' : '⭐',
      scale: 0.6 + Math.random() * 0.6
    }));
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => {
        setParticles(prev => prev.filter(p => (Date.now() - parseFloat(p.id.split('-')[1])) < 800));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [particles]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Inicio', path: '/' },
    { label: 'Nosotros', path: '/about' },
    { label: 'Tienda', path: '/store' },
    { label: 'Fotos', path: '/photos' },
    { label: 'Servicios', path: '/services' },
    { label: 'Calculadora', path: '/delivery-calculator' },
    { label: 'PQR', path: '/pqr' },
    { label: 'Contacto', path: '/contact' }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const handleMobileNav = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? 'bg-[#050510]/95 backdrop-blur-md shadow-md border-b border-yellow-500/10' : 'bg-transparent'
          }`}
      >
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand Title next to it */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-2 cursor-pointer relative z-50 flex-shrink-0"
            >
              <Link to="/" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Casa Smoke y Arte Logo"
                  className="h-10 w-auto md:h-12"
                />
                <div className="flex flex-col border-l border-white/20 pl-3 ml-2.5">
                  <div className="text-[11px] md:text-[12px] font-black leading-none text-white tracking-widest uppercase">
                    FIFA 2026 <span className="text-[#CE1126]">//</span>
                  </div>
                  <div className="text-[14px] md:text-[15px] font-black leading-none text-white tracking-wider uppercase mt-0.5">
                    COLOMBIA
                  </div>
                  <div className="text-[7.5px] md:text-[8px] font-semibold text-yellow-400 tracking-widest uppercase mt-0.5 whitespace-nowrap">

                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation Column Container */}
            <div className="hidden lg:flex flex-col items-center gap-2">
              {/* Main Soccer Menu Pill */}
              <div className="flex items-center bg-[#090d16]/80 backdrop-blur-md border border-white/10 rounded-full px-5 py-1.5 shadow-lg shadow-[#020617]/50 gap-4 xl:gap-6">
                {[
                  { label: 'MASCOTAS FIFA', path: '#mascotas' },
                  { label: 'RESULTADOS EN VIVO', path: '#resultados' },
                  { label: 'CENTRO DE APUESTAS', path: '#apuestas' }
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      if (location.pathname !== '/') {
                        navigate('/');
                        setTimeout(() => {
                          document.querySelector(item.path)?.scrollIntoView({ behavior: 'smooth' });
                        }, 200);
                      } else {
                        document.querySelector(item.path)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="text-[11px] font-black tracking-widest text-slate-300 hover:text-yellow-400 transition-colors py-1.5 px-3 uppercase"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Sub-menu (Original Menu) Pill - Interactive & Fun */}
              <div className="flex items-center bg-[#050914]/60 backdrop-blur-md border border-white/5 rounded-full px-4 py-1 shadow-md gap-1 xl:gap-2 relative overflow-visible">
                {particles.map(p => (
                  <motion.span
                    key={p.id}
                    initial={{ x: p.x, y: p.y, scale: p.scale, opacity: 1 }}
                    animate={{ 
                      x: p.x + p.vx * 15, 
                      y: p.y + p.vy * 15, 
                      scale: 0,
                      opacity: 0 
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute pointer-events-none select-none text-sm z-20"
                  >
                    {p.char}
                  </motion.span>
                ))}
                
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <motion.button
                      key={item.path}
                      onClick={(e) => {
                        triggerClickAnimation(e);
                        navigate(item.path);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative px-3 py-1 text-[9px] font-black uppercase tracking-wider transition-colors z-10 ${
                        active ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="activeSubMenu"
                          className="absolute inset-0 bg-yellow-500/10 border border-yellow-500/30 rounded-full z-[-1]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Right Buttons Container */}
            <div className="flex items-center gap-3 md:gap-4 relative z-50 flex-shrink-0">

              {/* ESTADIO NOCTURNO / DE DIA */}
              <button
                onClick={toggleNight}
                className={`hidden xl:flex items-center gap-1.5 text-[9px] font-black border rounded-full px-3 py-1.5 transition-all duration-300 uppercase tracking-wider shadow-sm hover:scale-105 active:scale-95 ${
                  isNight 
                    ? 'text-slate-300 hover:text-yellow-400 border-white/10 hover:border-yellow-400/50 bg-[#090d16]/40' 
                    : 'text-slate-800 hover:text-slate-950 border-yellow-400/40 hover:border-yellow-400 bg-yellow-400'
                }`}
              >
                {isNight ? (
                  <>
                    <span className="text-yellow-400 animate-pulse">🌙</span> ESTADIO NOCTURNO
                  </>
                ) : (
                  <>
                    <span className="text-amber-600 animate-bounce">☀️</span> ESTADIO DE DÍA
                  </>
                )}
              </button>

              {/* APUESTAS DEPORTIVAS */}
              <button
                onClick={() => {
                  if (location.pathname !== '/') {
                    navigate('/');
                    setTimeout(() => {
                      document.querySelector('#apuestas')?.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  } else {
                    document.querySelector('#apuestas')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="hidden sm:block text-[10px] font-black text-slate-900 bg-yellow-400 hover:bg-yellow-300 rounded-full px-4 py-2 transition-colors uppercase tracking-widest"
              >
                APOSTAR AHORA
              </button>

              {/* Trophy icon */}
              <button
                onClick={() => {
                  if (location.pathname !== '/') {
                    navigate('/');
                    setTimeout(() => {
                      document.querySelector('#resultados')?.scrollIntoView({ behavior: 'smooth' });
                    }, 200);
                  } else {
                    document.querySelector('#resultados')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="p-2 text-yellow-400 border border-yellow-400/30 rounded-full hover:bg-yellow-400/10 transition-colors flex items-center justify-center"
                title="Tablero de Resultados"
              >
                {/* SVG Trophy Cup */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 4H17.5C17.5 2.9 16.6 2 15.5 2H8.5C7.4 2 6.5 2.9 6.5 4H5C3.3 4 2 5.3 2 7V9C2 11.2 3.5 13.1 5.6 13.7C6.3 15.6 7.9 17 9.8 17.3C10 18.9 11.3 20.1 13 20.2V22H9V24H15V22H11V20.2C12.7 20.1 14 18.9 14.2 17.3C16.1 17 17.7 15.6 18.4 13.7C20.5 13.1 22 11.2 22 9V7C22 5.3 20.7 4 19 4ZM4 9V7C4 6.4 4.4 6 5 6H6.5V11.2C5.1 10.9 4 10.1 4 9ZM20 9C20 10.1 18.9 10.9 17.5 11.2V6H19C19.6 6 20 6.4 20 7V9Z" />
                </svg>
              </button>

              {/* User Account Button */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1 bg-yellow-400/10 hover:bg-yellow-400/20 rounded-full border border-yellow-400/20 transition-all text-yellow-400"
                  >
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900 flex-shrink-0">
                      {(profile?.full_name || user.email || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-yellow-400 text-xs font-semibold hidden md:block max-w-[80px] truncate">
                      {profile?.full_name ? profile.full_name.split(' ')[0] : user.email?.split('@')[0]}
                    </span>
                    <ChevronDown size={12} className={`text-yellow-400/60 hidden md:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#090d16]/95 backdrop-blur-md border border-yellow-500/20 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-200"
                      >
                        <Link to="/user" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors">
                          <User size={15} className="text-yellow-400" /> Mi Perfil
                        </Link>
                        <button
                          onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors border-t border-yellow-500/10"
                        >
                          <LogOut size={15} /> Cerrar Sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login">
                  <button className="p-2 text-slate-300 hover:text-yellow-400 transition-colors bg-white/5 hover:bg-white/10 rounded-full">
                    <User size={18} />
                  </button>
                </Link>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-300 hover:text-yellow-400 transition-colors"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-yellow-400 text-slate-950 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#090d16]"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden text-slate-300 hover:text-yellow-400"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden overflow-hidden bg-[#090d16]/95 backdrop-blur-md rounded-b-2xl border-t border-yellow-500/20 mt-4 shadow-lg text-slate-200"
              >
                <div className="flex flex-col p-4 space-y-2">
                  {/* Soccer Menu anchor buttons first */}
                  {[
                    { label: 'MASCOTAS FIFA', path: '#mascotas' },
                    { label: 'RESULTADOS EN VIVO', path: '#resultados' },
                    { label: 'CENTRO DE APUESTAS', path: '#apuestas' }
                  ].map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (location.pathname !== '/') {
                          navigate('/');
                          setTimeout(() => {
                            document.querySelector(item.path)?.scrollIntoView({ behavior: 'smooth' });
                          }, 200);
                        } else {
                          document.querySelector(item.path)?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="block w-full text-left py-3 px-4 rounded-xl text-yellow-400 bg-yellow-500/5 font-black tracking-widest text-[11px] uppercase border border-yellow-500/10"
                    >
                      {item.label}
                    </button>
                  ))}

                  {/* Divider */}
                  <div className="border-t border-white/10 my-3"></div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-4 mb-1">Secciones del Sitio</span>

                  {/* Original nav items */}
                  {navItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleMobileNav(item.path)}
                      className={`block w-full text-left py-2.5 px-4 rounded-xl text-xs transition-colors ${isActive(item.path)
                        ? 'text-yellow-400 bg-yellow-500/10 font-bold'
                        : 'text-slate-300 hover:text-yellow-400 hover:bg-white/5'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}

                  {user ? (
                    <>
                      <Link to="/user" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                        <button className="w-full text-left py-2.5 px-4 rounded-xl text-yellow-400 hover:bg-white/5 flex items-center gap-2 text-xs">
                          <User size={14} />
                          {profile?.full_name ? profile.full_name.split(' ')[0] : 'Mi Cuenta'}
                        </button>
                      </Link>
                      <button
                        onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left py-2.5 px-4 rounded-xl text-red-400 hover:bg-white/5 flex items-center gap-2 text-xs"
                      >
                        <LogOut size={14} /> Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="w-full">
                      <button className="w-full text-left py-2.5 px-4 rounded-xl text-yellow-400 hover:bg-white/5 text-xs">
                        Iniciar Sesión
                      </button>
                    </Link>
                  )}

                  <Link to="/booking" className="w-full mt-4">
                    <button className="w-full py-3 bg-yellow-400 text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider">
                      Agendar Cita
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </motion.header>

      {/* Shopping Cart Sidebar */}
      <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
    </>
  );
};

export default Header;