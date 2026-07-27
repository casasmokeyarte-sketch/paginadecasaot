import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import HomeGallery from '@/components/HomeGallery';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Calendar, ArrowRight, CheckCircle, Flame
} from 'lucide-react';

const CASA_SMOKE_PILLARS = [
  {
    id: 'tattoo',
    title: 'Estudio de Tatuajes & Piercing',
    badge: '🎨 ARTE CORPORAL EXCLUSIVO',
    icon: '🎨',
    color: '#ec4899',
    tagline: 'Expresa tu historia con tinta de alta calidad',
    image: '/nosotros.jpeg',
    description: 'En Casa Smoke OT transformamos tus ideas en obras maestras en la piel. Contamos con artistas especializados en Realismo, Blackwork, Neotradicional, Microrealismo y Fine Line.',
    highlights: [
      'Higiene y asepsia con estándares internacionales 100% certificados',
      'Atención personalizada con boceto digital antes de tatuar',
      'Especialistas en coberturas (cover-up) y pigmentación duradera'
    ],
    ctaText: 'EXPERIENCIA CASA SMOKE & ARTE',
    ctaLink: '#experiencia'
  },
  {
    id: 'smokeshop',
    title: 'Smoke Shop & Vape Lounge',
    badge: '💨 VAPES & ACCESORIOS PREMIUM',
    icon: '💨',
    color: '#a855f7',
    tagline: 'Variedad, calidad y las marcas más buscadas',
    image: '/zona-smokesex.png',
    description: 'Encuentra la mejor selección de vapes desechables, recargables, esencias importadas, bongs de pirex, moledores, sedas y accesorios para fumadores exigentes.',
    highlights: [
      'Dispositivos y vapes originales garantizados',
      'Amplia variedad de sabores, pods y líquidos',
      'Accesorios exclusivos, bongs, pipas y trituradores'
    ],
    ctaText: 'Ver Tienda Virtual',
    ctaLink: '/store'
  },
  {
    id: 'galeria',
    title: 'Galería de Arte & Moda Urbana',
    badge: '🖼️ CULTURA & ESTILO',
    icon: '🖼️',
    color: '#3b82f6',
    tagline: 'Colecciones de arte y prendas únicas',
    image: '/ot_ssot_collection.png',
    description: 'Más que un estudio, somos un espacio cultural. Exhibimos ilustraciones, cuadros originales, prendas urbanas de edición limitada y coleccionables.',
    highlights: [
      'Cuadros e ilustraciones de nuestros artistas residentes',
      'Ropa y accesorios de edición limitada Casa Smoke',
      'Eventos de arte en vivo y lanzamientos de colección'
    ],
    ctaText: 'Explorar Fotos y Galería',
    ctaLink: '/photos'
  },
  {
    id: 'vip',
    title: 'Zona VIP & Lounge Bar',
    badge: '✨ EXPERIENCIA INIGUALABLE',
    icon: '✨',
    color: '#eab308',
    tagline: 'Comodidad, ambiente climatizado y excelente trato',
    image: '/zona-vip.png',
    description: 'Disfruta de nuestras instalaciones diseñadas para tu máximo confort. Relájate mientras esperas tu turno o navegas en nuestra tienda con asesoría personalizada.',
    highlights: [
      'Ambiente privado climatizado con música envolvente',
      'Bebidas de cortesía y atención preferencial',
      'Asesoría técnica para seleccionar tu vape o tu diseño'
    ],
    ctaText: 'Calcular Envíos a Domicilio',
    ctaLink: '/delivery-calculator'
  }
];

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activePillar, setActivePillar] = useState('tattoo');

  const activeData = CASA_SMOKE_PILLARS.find(p => p.id === activePillar) || CASA_SMOKE_PILLARS[0];

  return (
    <>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&display=swap" rel="stylesheet" />
        <title>Casa Smoke y Arte OT SSOT S.A.S - Estudio de Tatuajes & Smoke Shop Premium 🔥</title>
      </Helmet>

      {/* Main Container */}
      <div className="container mx-auto px-4 pt-4 pb-16 font-sans flex flex-col items-center relative overflow-visible">

        {/* Background logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
          <img src="/logo2.png" alt="Logo Watermark" className="w-[85%] max-w-2xl h-auto object-contain" />
        </div>

        {/* 1. MAIN HERO BANNER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-6xl mx-auto rounded-3xl p-6 md:p-10 lg:p-12 overflow-hidden bg-gradient-to-br from-[#090d16]/90 via-[#110b1a]/85 to-[#090d16]/90 border border-pink-500/25 shadow-[0_12px_45px_rgba(236,72,153,0.15)] flex flex-col justify-center mb-16 z-10"
        >
          {/* Subtle sparkle backgrounds */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl opacity-30">
            <div className="absolute top-[15%] left-[25%] w-3 h-3 bg-pink-400 rounded-full blur-[1px] animate-pulse"></div>
            <div className="absolute bottom-[20%] left-[8%] w-2 h-2 bg-purple-300 rounded-full blur-[2px] animate-ping"></div>
            <div className="absolute top-[20%] right-[15%] w-4 h-4 bg-rose-400 rounded-full blur-[1px] animate-pulse"></div>
          </div>

          <div className="flex flex-col items-center w-full relative z-10">

            {/* CENTERED COLUMN: Texts & Buttons */}
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-[9.5px] md:text-[10.5px] px-4 py-1.5 rounded-full tracking-widest uppercase mb-6 shadow-md shadow-pink-900/30"
              >
                <span>🔥</span> CASASMOKE Y ARTE OT SSOT S.A.S
              </motion.div>

              {/* Huge Title */}
              <h1 className="flex flex-col font-black tracking-tight leading-[1.05] text-3xl sm:text-5xl md:text-6xl lg:text-6xl select-none mb-6 uppercase">
                <span className="text-white drop-shadow-md">ARTE EN TU PIEL,</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-rose-400 font-black">
                  ESTILO EN TU VIDA
                </span>
                <span className="text-pink-300 text-2xl sm:text-4xl md:text-5xl mt-1 drop-shadow-md">
                  & LA MEJOR EXPERIENCIA SMOKE
                </span>
              </h1>

              {/* Description */}
              <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed max-w-2xl mb-8">
                Bienvenido a <strong className="text-pink-400">Casa Smoke y Arte OT</strong>. Tu estudio profesional de tatuajes, tienda de vapes y accesorios de alta gama, y galería de arte urbano. Diseños 100% personalizados y atención de primer nivel.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
                <button
                  onClick={() => navigate('/store')}
                  className="flex items-center justify-center gap-2.5 text-xs font-black text-white bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-full px-7 py-4 shadow-lg shadow-pink-900/40 transition-all uppercase tracking-widest"
                >
                  <ShoppingBag size={16} /> SMOKE SHOP ONLINE
                </button>

                <button
                  onClick={() => navigate('/booking')}
                  className="flex items-center justify-center gap-2.5 text-xs font-black text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/40 hover:border-pink-400 rounded-full px-7 py-4 transition-all uppercase tracking-widest"
                >
                  <Calendar size={16} /> AGENDAR CITA TATTOO
                </button>
              </div>

              {/* Highlights pills */}
              <div className="mt-8 flex flex-wrap gap-4 items-center justify-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-pink-300"><CheckCircle size={14} className="text-pink-400" /> Artistas Profesionales</span>
                <span className="flex items-center gap-1.5 text-purple-300"><CheckCircle size={14} className="text-purple-400" /> Vapes & Pods 100% Originales</span>
                <span className="flex items-center gap-1.5 text-rose-300"><CheckCircle size={14} className="text-rose-400" /> Envíos Seguros</span>
              </div>
            </div>

          </div>
        </motion.div>

        {/* 2. CORE PILLARS EXPLORER SECTION (#experiencia) */}
        <div id="experiencia" className="w-full max-w-5xl mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <h3 className="text-pink-400 text-sm font-black tracking-widest uppercase mb-2">✨ CONOCE NUESTRO CONCEPTO</h3>
            <h2 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tight">EXPERIENCIA CASA SMOKE</h2>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Haz clic en cada categoría para descubrir lo que tenemos para ti</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Pillars Selectors */}
            <div className="col-span-1 lg:col-span-5 flex flex-col gap-3.5">
              {CASA_SMOKE_PILLARS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePillar(p.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                    activePillar === p.id
                      ? 'bg-gradient-to-r from-[#170e28] to-[#0f1424] border-pink-400 shadow-[0_4px_25px_rgba(236,72,153,0.2)] scale-[1.02]'
                      : 'bg-[#090d16]/50 border-white/5 hover:border-pink-500/30 hover:bg-[#090d16]/80'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-xl flex-shrink-0">
                      {p.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm tracking-wide uppercase">{p.title}</h4>
                      <span className="text-[10px] font-bold text-pink-300 uppercase tracking-widest">{p.badge}</span>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${activePillar === p.id ? 'bg-pink-400 shadow-[0_0_10px_#ec4899]' : 'bg-white/10'}`}></div>
                </button>
              ))}
            </div>

            {/* Pillar Detail Display */}
            <div className="col-span-1 lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeData.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gradient-to-br from-[#0e0a1a] via-[#120f24] to-[#090d16] border border-pink-500/25 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Decorative background glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-3xl rounded-full pointer-events-none"></div>

                  <div>
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <span className="text-xs font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
                        {activeData.badge}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {activeData.tagline}
                      </span>
                    </div>

                    <h3 className="text-white text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">
                      {activeData.title}
                    </h3>

                    <p className="text-slate-300 text-sm leading-relaxed font-medium mb-6">
                      {activeData.description}
                    </p>

                    {/* Highlights List */}
                    <div className="flex flex-col gap-3 mb-8">
                      {activeData.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200 font-semibold">
                          <CheckCircle size={16} className="text-pink-400 flex-shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={() => {
                        if (activeData.ctaLink.startsWith('#')) {
                          const target = document.getElementById(activeData.ctaLink.substring(1));
                          if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                          }
                        } else {
                          navigate(activeData.ctaLink);
                        }
                      }}
                      className="w-full sm:w-auto text-xs font-black text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-full px-6 py-3.5 transition-all shadow-md shadow-pink-900/30 uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {activeData.ctaText} <ArrowRight size={14} />
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      CASA SMOKE OT // OFFICIAL
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* 2.5. CHAT-OT PROMO BANNER */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-5xl mx-auto rounded-3xl p-8 md:p-10 mb-20 overflow-hidden bg-gradient-to-br from-[#0e0a1f] via-[#170c2a] to-[#090615] border border-pink-500/20 shadow-[0_8px_32px_rgba(236,72,153,0.1)] flex flex-col md:flex-row items-center gap-8 relative z-10"
        >
          {/* Neon background glows */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-pink-500/5 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="flex-1 flex flex-col items-start text-left">
            <span className="flex items-center gap-1.5 bg-[#ff2df0]/10 border border-[#ff2df0]/20 text-[#ff2df0] font-black text-[9.5px] px-3.5 py-1.5 rounded-full tracking-widest uppercase mb-4 shadow-sm">
              <Flame size={12} className="animate-pulse text-pink-500" /> ¡NUEVO SERVICIO! CHAT-OT
            </span>
            
            <h2 className="text-white text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">
              CONÉCTATE AL <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-[#00e5ff] font-black">CHAT-OT</span> DE LA OFICINA
            </h2>
            
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6 font-medium">
              Te presentamos el nuevo canal de comunicación interna. Diseñado para integrar a todo el equipo en tiempo real: coordina tus citas de tatuajes, revisa el inventario de la Smoke Shop, consulta dudas del estudio y chatea de forma privada o grupal. ¡Todo el equipo a un clic!
            </p>

            <button
              onClick={() => {
                if (user) {
                  navigate('/user/chat');
                } else {
                  navigate('/login?redirect=/user/chat');
                }
              }}
              className="flex items-center justify-center gap-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-[#ff2df0] via-pink-400 to-[#00e5ff] hover:brightness-110 rounded-full px-8 py-4 shadow-md shadow-pink-900/20 transition-all uppercase tracking-widest hover:scale-[1.03] duration-300"
            >
              INGRESAR AL CHAT-OT <ArrowRight size={16} />
            </button>
          </div>

          <div className="w-full md:w-2/5 shrink-0 flex justify-center relative">
            {/* Hologram/Glassmorphic frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-cyan-500/20 rounded-2xl blur-md scale-105 animate-pulse"></div>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#090d16]"
            >
              <img
                src="/image-34.jpg"
                alt="Chat-OT Promo"
                className="w-full max-w-[320px] md:max-w-none h-64 object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a1f] via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[10px] text-white/70 font-black uppercase tracking-wider">Casa Smoke & Arte</span>
                <span className="text-[10px] text-[#00e5ff] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Activo
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* 3. HOME GALLERY SECTION */}
        <div id="servicios" className="border-t border-pink-500/15 w-full pt-16 select-none relative z-10">
          <div className="text-center mb-10">
            <h3 className="text-pink-400 text-sm font-black tracking-widest uppercase mb-2">📸 GALERÍA Y DESTACADOS</h3>
            <h2 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tight">NUESTRAS ZONAS & ESTILOS</h2>
          </div>
          <HomeGallery />
        </div>

      </div>
    </>
  );
};

export default Hero;