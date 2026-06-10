import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white/40 backdrop-blur-md text-[#4a248c] py-8 border-t border-[#ff66cc]/20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <img src="/logo.png" alt="Casa Smoke y Arte Logo" className="h-12 w-auto" />
          </div>

          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-[#4a248c]/80 text-sm">
              © {currentYear} Casa Smoke y Arte SSOT S.A.S
            </p>
            <div className="flex justify-center md:justify-start items-center space-x-4 mt-2">
              <Link to="/policies" className="text-xs text-[#4a248c]/70 hover:text-[#ff007f] transition-colors">
                Nuestras Políticas
              </Link>
              <p className="text-[#ff007f] text-xs font-semibold">
                Cultura, Tattoo y Experiencia
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 text-sm text-[#4a248c]/80">
            <span>Hecho con</span>
            <Heart className="text-[#ff007f] fill-[#ff007f]" size={16} />
            <span>Bogota , OT</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;