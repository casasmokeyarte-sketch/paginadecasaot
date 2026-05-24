import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, LogOut, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ShoppingCart from '@/components/ShoppingCart';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen ? 'bg-[#050510]/95 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 cursor-pointer relative z-50 flex-shrink-0"
            >
              <Link to="/">
                <img 
                  src="/logo.png" 
                  alt="Casa Smoke y Arte Logo" 
                  className="h-10 w-auto md:h-12"
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                >
                  <motion.span
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-sm font-medium transition-colors relative px-2 py-1 whitespace-nowrap ${
                      isActive(item.path) ? 'text-[#ff2df0]' : 'text-[#f5f5f5] hover:text-[#ff2df0]'
                    }`}
                  >
                    {item.label}
                    {isActive(item.path) && (
                      <motion.div
                        layoutId="underline"
                        className="absolute left-0 right-0 -bottom-1 h-0.5 bg-[#ff2df0]"
                      />
                    )}
                  </motion.span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 relative z-50 flex-shrink-0">
              {/* User Account Button */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 hover:border-[#00e5ff]/40 transition-all"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-[#ff2df0] to-[#00e5ff] rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(profile?.full_name || user.email || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium hidden md:block max-w-[80px] truncate">
                      {profile?.full_name ? profile.full_name.split(' ')[0] : user.email?.split('@')[0]}
                    </span>
                    <ChevronDown size={14} className={`text-white/60 hidden md:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#111322] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                      >
                        <Link to="/user" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors">
                          <User size={15} className="text-[#00e5ff]" /> Mi Perfil
                        </Link>
                        <button
                          onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5"
                        >
                          <LogOut size={15} /> Cerrar Sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="relative flex items-center">
                  <div className="absolute inset-0 -m-1 pointer-events-none">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#ff2df0] border-r-[#ff2df0]/50"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-transparent border-b-[#00e5ff] border-l-[#00e5ff]/50"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <motion.div
                    className="absolute right-full top-1/2 -translate-y-1/2 mr-3 pointer-events-none hidden md:block"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], x: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative"
                    >
                      <div className="bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] text-white text-[10px] font-bold px-3 py-1.5 rounded-l-full rounded-tr-full shadow-[0_0_15px_rgba(255,45,240,0.5)] whitespace-nowrap flex items-center border border-white/20">
                        <span>¡Inscríbete aquí!</span>
                        <span className="ml-1 text-xs">✨</span>
                      </div>
                      <div className="absolute top-1/2 -right-1 w-2 h-0.5 bg-[#ff2df0] translate-y-[-50%]"></div>
                    </motion.div>
                  </motion.div>
                  <Link to="/login" className="relative z-10">
                    <button className="relative p-2 text-white hover:text-[#00e5ff] transition-colors bg-white/5 rounded-full hover:bg-white/10">
                      <User size={20} />
                    </button>
                  </Link>
                </div>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-white hover:text-[#ff2df0] transition-colors"
              >
                <ShoppingBag size={24} />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-[#ff2df0] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050510]"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="text-white" size={24} />
                ) : (
                  <Menu className="text-white" size={24} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden overflow-hidden bg-[#111322] rounded-b-2xl border-t border-white/10 mt-4"
              >
                <div className="flex flex-col p-4 space-y-2">
                  {navItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleMobileNav(item.path)}
                      className={`block w-full text-left py-3 px-4 rounded-xl transition-colors ${
                        isActive(item.path) 
                          ? 'text-[#ff2df0] bg-[#15162a] font-semibold' 
                          : 'text-[#f5f5f5] hover:text-[#ff2df0] hover:bg-[#15162a]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  {user ? (
                    <>
                      <Link to="/user" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                        <button className="w-full text-left py-3 px-4 rounded-xl text-[#00e5ff] hover:bg-[#15162a] flex items-center gap-2">
                          <User size={16} />
                          {profile?.full_name ? profile.full_name.split(' ')[0] : 'Mi Cuenta'}
                        </button>
                      </Link>
                      <button
                        onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left py-3 px-4 rounded-xl text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <LogOut size={16} /> Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="w-full">
                      <button className="w-full text-left py-3 px-4 rounded-xl text-[#00e5ff] hover:bg-[#15162a]">
                        Iniciar Sesión / Inscríbete
                      </button>
                    </Link>
                  )}
                  <Link to="/booking" className="w-full mt-4">
                    <button className="w-full py-3 bg-[#ff2df0] text-white rounded-xl font-bold">
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