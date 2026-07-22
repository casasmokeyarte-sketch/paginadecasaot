import React from 'react';
import { Heart, ArrowUp, Flame, Shield, MapPin, Phone, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#07040e]/95 text-slate-300 pt-12 pb-8 border-t border-pink-500/20 overflow-hidden select-none">
      {/* Ambient Smoke Glow background effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 bg-gradient-to-b from-pink-500/10 to-transparent blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Top Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Casa Smoke y Arte Logo" className="h-12 w-auto filter drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]" />
              <div className="flex flex-col border-l border-white/20 pl-3">
                <span className="text-xs font-black text-white tracking-widest uppercase">CASA SMOKE OT</span>
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">ESTUDIO & SMOKE SHOP</span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4 font-medium">
              Estudio profesional de tatuajes, shop con vapes y accesorios originales, y espacio de arte urbano en Colombia. Tu lugar de estilo y expresión.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/573023007193"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-pink-500/10 border border-pink-500/30 hover:border-pink-400 flex items-center justify-center text-pink-400 hover:text-white transition-all shadow-sm hover:scale-105"
                title="WhatsApp Directo"
              >
                <Phone size={16} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-pink-500/10 border border-pink-500/30 hover:border-pink-400 flex items-center justify-center text-pink-400 hover:text-white transition-all shadow-sm hover:scale-105"
                title="Instagram"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Navigation Links Col */}
          <div className="col-span-1 md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Flame size={14} className="text-pink-400" /> NAVEGACIÓN RÁPIDA
            </h4>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              <Link to="/" className="text-slate-400 hover:text-pink-400 transition-colors">Inicio</Link>
              <Link to="/store" className="text-slate-400 hover:text-pink-400 transition-colors">Smoke Shop</Link>
              <Link to="/booking" className="text-slate-400 hover:text-pink-400 transition-colors">Reservar Cita</Link>
              <Link to="/about" className="text-slate-400 hover:text-pink-400 transition-colors">Nosotros</Link>
              <Link to="/photos" className="text-slate-400 hover:text-pink-400 transition-colors">Fotos & Galería</Link>
              <Link to="/policies" className="text-slate-400 hover:text-pink-400 transition-colors">Políticas del Sitio</Link>
              <Link to="/pqr" className="text-slate-400 hover:text-pink-400 transition-colors">Atención PQR</Link>
              <Link to="/contact" className="text-slate-400 hover:text-pink-400 transition-colors">Contacto</Link>
            </div>
          </div>

          {/* Scroll to top & location */}
          <div className="col-span-1 md:col-span-3 flex flex-col items-center md:items-end justify-between">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-900/40 transition-all hover:scale-105 mb-4"
            >
              Volver Arriba <ArrowUp size={14} />
            </button>

            <div className="text-center md:text-right">
              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block mb-1">
                Ubicación Principal
              </span>
              <p className="text-xs text-slate-300 font-semibold flex items-center justify-center md:justify-end gap-1">
                <MapPin size={13} className="text-pink-400" /> Bogotá, OT - Colombia
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Rights Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p className="font-medium text-center sm:text-left">
            © {currentYear} <strong className="text-white font-bold">Casa Smoke y Arte OT SSOT S.A.S</strong>. Todos los derechos reservados.
          </p>

          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold">
            <span>Hecho con</span>
            <Heart className="text-pink-500 fill-pink-500 animate-pulse" size={15} />
            <span className="text-white font-bold">Cultura & Arte</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;