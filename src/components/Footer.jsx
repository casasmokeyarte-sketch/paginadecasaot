import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return <footer className="bg-[#111322] text-[#f5f5f5] py-8 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src="/logo.png" alt="Casa Smoke y Arte Logo" className="h-12 w-auto" />
          </div>

          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-[#a7a8c7] text-sm">
              © {currentYear} Casa Smoke y Arte SSOT S.A.S
            </p>
            <div className="flex justify-center md:justify-start items-center space-x-4 mt-2">
                <Link to="/policies" className="text-xs text-[#a7a8c7] hover:text-[#00e5ff] transition-colors">
                  Nuestras Políticas
                </Link>
                <p className="text-[#00e5ff] text-xs drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]">
                  Cultura, Tattoo y Experiencia
                </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-sm text-[#a7a8c7]">
            <span>Hecho con</span>
            <Heart className="text-[#ff2df0] fill-[#ff2df0]" size={16} />
            <span>Bogota , OT</span>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;