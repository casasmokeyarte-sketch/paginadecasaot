import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  Crown,
  Gamepad2,
  Music2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

const benefits = [
  {
    icon: CalendarDays,
    title: 'Hasta 8 visitas al mes',
    description: 'Reserva tu espacio y disfruta la sala sin filas ni sobrecupo.',
  },
  {
    icon: Gamepad2,
    title: 'Zona Xbox y TV',
    description: 'Turnos organizados para jugar, ver videos y compartir.',
  },
  {
    icon: Sparkles,
    title: 'Dulces para disfrutar',
    description: 'Crispetas y algodón de azúcar para consumo dentro de la sala.',
  },
  {
    icon: Music2,
    title: 'Música y ambiente',
    description: 'Un espacio cómodo para relajarte y pasar un buen momento.',
  },
  {
    icon: Star,
    title: 'Puntos y beneficios',
    description: 'Acumula puntos y recibe ventajas en actividades seleccionadas.',
  },
  {
    icon: Users,
    title: 'Eventos exclusivos',
    description: 'Acceso preferente a noches temáticas y actividades VIP.',
  },
];

const rules = [
  'Membresía personal e intransferible.',
  'Ingreso mediante reserva y sujeto a capacidad.',
  'Máximo 2 horas por visita en horarios de alta demanda.',
  'Alimentos para consumo razonable dentro de la sala.',
  'Uso responsable de controles, muebles y equipos.',
  'Verificación de identidad y cumplimiento de restricciones de edad.',
];

const Vip = () => {
  return (
    <>
      <Helmet>
        <title>Sala VIP | Casa Smoke y Arte</title>
        <meta
          name="description"
          content="Conoce la membresía mensual de la Sala VIP de Casa Smoke y Arte: entretenimiento, eventos, reservas y beneficios exclusivos."
        />
      </Helmet>

      <div className="min-h-screen bg-[#050510] text-white overflow-hidden">
        <section className="relative isolate min-h-[680px] flex items-center">
          <img
            src="/zona-vip.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050510] via-[#090517]/90 to-[#050510]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-[#050510]/30" />

          <div className="container mx-auto px-4 relative z-10 py-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-200">
                <Crown size={17} />
                50 cupos de lanzamiento
              </div>

              <h1 className="mt-6 text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
                Tu espacio.
                <span className="block bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 bg-clip-text text-transparent">
                  Tu momento VIP.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg md:text-xl leading-relaxed text-slate-200">
                Una sala física para disfrutar Xbox, TV, música, crispetas,
                algodón de azúcar y experiencias exclusivas con acceso organizado.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register?next=/vip"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 px-7 py-3.5 font-black text-[#09030d] shadow-lg shadow-pink-950/50 transition-transform hover:scale-[1.02]"
                >
                  <Crown size={20} />
                  Quiero afiliarme
                </Link>
                <a
                  href="#membresia"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 font-bold text-white backdrop-blur-sm hover:bg-white/10"
                >
                  Ver beneficios
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="membresia" className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-pink-400">
              Experiencia Casa VIP
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-black">
              Todo lo necesario para pasarla bien
            </h2>
            <p className="mt-4 text-slate-400">
              Beneficios pensados para mantener una experiencia cómoda, organizada
              y sostenible para todos los miembros.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/25 to-cyan-400/15 text-pink-300">
                  <Icon size={23} />
                </div>
                <h3 className="mt-5 text-lg font-black">{title}</h3>
                <p className="mt-2 leading-relaxed text-slate-400">{description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="grid overflow-hidden rounded-3xl border border-yellow-300/20 bg-gradient-to-br from-[#171025] to-[#080a14] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-2 text-yellow-300">
                <Crown size={22} />
                <span className="font-black uppercase tracking-widest">Plan mensual</span>
              </div>
              <div className="mt-7 flex items-end gap-2">
                <span className="text-5xl md:text-6xl font-black">$79.900</span>
                <span className="pb-2 text-slate-400">COP / mes</span>
              </div>
              <p className="mt-4 text-slate-300">
                Tarjeta NFC inicial incluida. Sin permanencia mínima y con
                cancelación para el siguiente periodo.
              </p>
              <Link
                to="/register?next=/vip"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-300 px-6 py-3.5 font-black text-[#100916] hover:bg-yellow-200"
              >
                Solicitar mi cupo
              </Link>
              <p className="mt-3 text-center text-xs text-slate-500">
                La afiliación queda sujeta a validación de identidad y disponibilidad.
              </p>
            </div>

            <div className="border-t border-white/10 bg-black/20 p-8 md:p-12 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-cyan-300" size={26} />
                <h2 className="text-2xl font-black">Reglas claras</h2>
              </div>
              <ul className="mt-7 space-y-4">
                {rules.map((rule) => (
                  <li key={rule} className="flex items-start gap-3 text-slate-300">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Vip;
