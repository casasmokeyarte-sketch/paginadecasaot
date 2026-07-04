import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="relative bg-[#050510]/95 text-slate-400 py-8 border-t border-yellow-500/10 overflow-hidden">
      {/* Subtle cloud/pitch lights decorative overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 100" preserveAspectRatio="none">
          <path d="M-50 90 C 20 90, 40 50, 90 50 C 140 50, 160 80, 210 80 C 260 80, 280 60, 330 60 C 380 60, 400 90, 470 90 C 540 90, 560 70, 610 70 C 660 70, 680 95, 730 95 C 780 95, 800 90, 850 90 L850 100 L-50 100 Z" fill="currentColor" />
        </svg>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src="/logo.png" alt="Casa Smoke y Arte Logo" className="h-12 w-auto" />
          </div>

          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-slate-400 text-sm font-medium">
              © {currentYear} Casa Smoke y Arte SSOT S.A.S
            </p>
            <div className="flex justify-center md:justify-start items-center space-x-4 mt-2">
              <Link to="/policies" className="text-xs text-slate-500 hover:text-yellow-400 transition-colors">
                Nuestras Políticas
              </Link>
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wider">
                Cultura, Tattoo y Experiencia ⚽
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-sm text-slate-400">
            <span>Hecho con</span>
            <Heart className="text-yellow-400 fill-yellow-400" size={16} />
            <span>Bogota , OT</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;