import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Palette, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const Booking = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const { addBooking } = useSupabaseData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    artist: 'miguel',
    style: '',
    clientName: '',
    clientEmail: '',
    clientPhone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addBooking({
        client_name: bookingData.clientName,
        client_email: bookingData.clientEmail,
        client_phone: bookingData.clientPhone,
        artist: bookingData.artist,
        style: bookingData.style,
        appointment_date: bookingData.date,
        appointment_time: bookingData.time,
        status: 'pending'
      });

      const whatsappMessage = encodeURIComponent(
        `Hola Miguel, vengo de Casa Smoke OT (SSOT) y acabo de solicitar una cita.
Nombre: ${bookingData.clientName}
Telefono: ${bookingData.clientPhone}
Correo: ${bookingData.clientEmail}
Fecha: ${bookingData.date}
Hora: ${bookingData.time}
Estilo: ${bookingData.style}`
      );
      window.open(`https://wa.me/573022784938?text=${whatsappMessage}`, '_blank');

      toast({
        title: "¡Entrevista Solicitada!",
        description: "Hemos recibido tu solicitud. Te contactaremos pronto para confirmar.",
        className: "bg-[#111322] border-[#00e5ff] text-[#f5f5f5]"
      });

      setBookingData({
        date: '',
        time: '',
        artist: 'miguel',
        style: '',
        clientName: '',
        clientEmail: '',
        clientPhone: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud. Intenta nuevamente.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="booking" className="py-20 bg-[#050510] border-t border-white/5 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff2df0]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
            Reserva tu Entrevista de Diseño
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#f4c542] to-[#ff2df0] mx-auto mb-6"></div>
          <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto">
            Antes de la tinta, vienen las ideas. Agenda una entrevista con nuestros artistas para discutir y planear tu diseño. 
            <span className="block mt-2 text-[#00e5ff] font-semibold">La fecha definitiva de tu tatuaje se programará después de esta sesión.</span>
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto bg-[#111322] rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Side Panel Info */}
            <div className="bg-[#15162a] p-8 md:p-10 flex flex-col justify-between border-r border-white/5">
              <div>
                <h3 className="text-xl font-bold text-[#fff] mb-6">Proceso de Reserva</h3>
                <ul className="space-y-6">
                  <li className="flex items-start space-x-3">
                    <div className="bg-[#ff2df0]/10 p-2 rounded-lg">
                      <CheckCircle2 className="text-[#ff2df0]" size={20} />
                    </div>
                    <div>
                      <span className="block text-white font-semibold text-sm">1. Entrevista</span>
                      <span className="text-[#a7a8c7] text-xs">Discute tus ideas y cotiza.</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-[#00e5ff]/10 p-2 rounded-lg">
                      <CheckCircle2 className="text-[#00e5ff]" size={20} />
                    </div>
                    <div>
                      <span className="block text-white font-semibold text-sm">2. Diseño</span>
                      <span className="text-[#a7a8c7] text-xs">El artista crea tu pieza única.</span>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="bg-[#f4c542]/10 p-2 rounded-lg">
                      <CheckCircle2 className="text-[#f4c542]" size={20} />
                    </div>
                    <div>
                      <span className="block text-white font-semibold text-sm">3. Cita de Tatuaje</span>
                      <span className="text-[#a7a8c7] text-xs">Se fija la fecha para tatuar.</span>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0 p-4 bg-[#050510] rounded-xl border border-white/5">
                <div className="flex items-start gap-2">
                    <AlertCircle className="text-[#f4c542] shrink-0" size={16} />
                    <p className="text-xs text-[#a7a8c7]">
                    Esta reserva es <strong>solo para la entrevista</strong>. No garantiza tiempo de aguja inmediato.
                    </p>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="col-span-2 p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Artist Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-[#a7a8c7]">
                      <User size={16} className="mr-2 text-[#ff2df0]" /> Artista
                    </label>
                    <select
                      name="artist"
                      value={bookingData.artist}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#050510] border border-white/10 rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                    >
                      <option value="miguel">Miguel</option>
                    </select>
                  </div>

                  {/* Style Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-[#a7a8c7]">
                      <Palette size={16} className="mr-2 text-[#00e5ff]" /> Estilo de Interés
                    </label>
                    <select
                      name="style"
                      value={bookingData.style}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#050510] border border-white/10 rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] outline-none transition-all"
                    >
                      <option value="">Seleccionar Estilo</option>
                      <option value="realismo">Realismo</option>
                      <option value="tradicional">Tradicional</option>
                      <option value="geometrico">Geométrico</option>
                      <option value="otro">Otro / Personalizado</option>
                    </select>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-[#a7a8c7]">
                      <CalendarIcon size={16} className="mr-2 text-[#f4c542]" /> Fecha para Entrevista
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={bookingData.date}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#050510] border border-white/10 rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#f4c542] focus:ring-1 focus:ring-[#f4c542] outline-none transition-all [color-scheme:dark]"
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-[#a7a8c7]">
                      <Clock size={16} className="mr-2 text-[#ff2df0]" /> Hora Preferida
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={bookingData.time}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#050510] border border-white/10 rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 mt-6 space-y-4">
                  <h4 className="text-[#f5f5f5] font-semibold">Tus Datos de Contacto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="clientName"
                      placeholder="Nombre Completo"
                      value={bookingData.clientName}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#050510] border border-white/10 rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] outline-none transition-all placeholder:text-[#a7a8c7]/50"
                    />
                     <input
                      type="tel"
                      name="clientPhone"
                      placeholder="Teléfono"
                      value={bookingData.clientPhone}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#050510] border border-white/10 rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] outline-none transition-all placeholder:text-[#a7a8c7]/50"
                    />
                  </div>
                   <input
                      type="email"
                      name="clientEmail"
                      placeholder="Correo Electrónico"
                      value={bookingData.clientEmail}
                      onChange={handleChange}
                      required
                      className="w-full bg-[#050510] border border-white/10 rounded-lg px-4 py-3 text-[#f5f5f5] focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] outline-none transition-all placeholder:text-[#a7a8c7]/50"
                    />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] text-[#050510] font-bold text-lg py-4 rounded-xl hover:shadow-[0_0_20px_rgba(255,45,240,0.4)] transition-all duration-300 mt-4 disabled:opacity-70"
                >
                  {isSubmitting ? 'Enviando...' : 'Solicitar Cita'}
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;
