import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Send, Instagram as Whatsapp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import emailjs from '@emailjs/browser';

// Custom TikTok Icon Component since it's not in this version of Lucide
const TikTokIcon = ({
  size = 24,
  className = ""
}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>;
const Contact = () => {
  const ref = useRef(null);
  const formRef = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: "-100px"
  });
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSending(true);
    try {
      await emailjs.sendForm(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        formRef.current,
        'YOUR_PUBLIC_KEY'
      );
      toast({
        title: "¡Mensaje enviado!",
        description: "Gracias por contactarnos. Te responderemos pronto."
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch {
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar el mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const contactInfo = [{
    icon: Phone,
    title: 'VENTAS',
    content: '302 300 69 86',
    link: 'tel:+573023006986'
  }, {
    icon: Phone,
    title: 'ATENCIÓN AL CLIENTE',
    content: '302 300 71 93',
    link: 'tel:+573023007193'
  }, {
    icon: Mail,
    title: 'Email',
    content: 'casasmokeyarte@casasmokeyarte.com',
    link: 'mailto:casasmokeyarte@casasmokeyarte.com'
  }, {
    icon: MapPin,
    title: 'Ubicación',
    content: 'Calle 63B #22-16 Barrio Muequeta, Bogotá, Colombia',
    link: 'https://maps.google.com/?q=Calle+63B+%2322-16+Barrio+Muequeta%2C+Bogot%C3%A1'
  }];
  const socialLinks = [{
    icon: Whatsapp,
    label: 'WhatsApp',
    href: 'https://wa.me/573023007193'
  }, {
    icon: TikTokIcon,
    label: 'TikTok',
    href: 'https://www.tiktok.com/@smokeot' // Using the same handle pattern as FB/Insta if available, or generic
  }, {
    icon: Facebook,
    label: 'Facebook',
    href: 'https://www.facebook.com/smokeot/'
  }];
  return <>
      <Helmet>
        <title>Contacto - Casa Smoke y Arte</title>
        <meta name="description" content="Contáctanos para tatuajes, productos de arte y cultura urbana. Consulta nuestros teléfonos, email, dirección y redes sociales." />
      </Helmet>
      <section id="contact" className="py-20 border-t border-white/5 relative bg-[#050510]">
        <div className="absolute inset-0 bg-[url('/contact-bg.png')] bg-cover bg-center opacity-15 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510]/80 via-[#050510]/70 to-[#050510]/90 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div ref={ref} initial={{
          opacity: 0,
          y: 50
        }} animate={isInView ? {
          opacity: 1,
          y: 0
        } : {}} transition={{
          duration: 0.8
        }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#f5f5f5] mb-4">
              Contáctanos
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#ff2df0] to-[#00e5ff] mx-auto mb-6"></div>
            <p className="text-lg text-[#a7a8c7] max-w-3xl mx-auto"> Estamos aquí para hacer historias</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div initial={{
            opacity: 0,
            x: -50
          }} animate={isInView ? {
            opacity: 1,
            x: 0
          } : {}} transition={{
            duration: 0.8
          }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-[#f5f5f5] mb-6">Información de Contacto</h3>
                <div className="space-y-4">
                  {contactInfo.map((info, index) => <motion.a key={index} href={info.link} whileHover={{
                  x: 10
                }} className="flex items-start space-x-4 p-4 bg-[#111322] rounded-lg shadow-md hover:shadow-[#ff2df0]/20 hover:border-[#ff2df0]/30 border border-white/5 transition-all group">
                      <div className="bg-gradient-to-br from-[#ff2df0] to-[#d91cb8] w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <info.icon className="text-white" size={24} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#f5f5f5]">{info.title}</p>
                        <p className="text-[#a7a8c7]">{info.content}</p>
                      </div>
                    </motion.a>)}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-[#f5f5f5] mb-6">Síguenos</h3>
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => <motion.a key={index} href={social.href} whileHover={{
                  scale: 1.1,
                  rotate: 5
                }} whileTap={{
                  scale: 0.95
                }} className="bg-gradient-to-br from-[#00e5ff] to-[#00b3cc] w-14 h-14 rounded-full flex items-center justify-center text-[#050510] hover:shadow-[0_0_15px_#00e5ff] transition-all" aria-label={social.label} target="_blank" rel="noopener noreferrer">
                      <social.icon size={24} />
                    </motion.a>)}
                </div>
              </div>

              {/* Map Section */}
              <div className="bg-[#15162a] rounded-2xl shadow-lg border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                   <h3 className="text-xl font-bold text-[#f5f5f5] flex items-center gap-2">
                     <MapPin className="text-[#ff2df0]" size={20} /> 
                     Nuestra Ubicación
                   </h3>
                </div>
                <div className="w-full h-[250px] bg-[#111322] flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <MapPin className="text-[#ff2df0]" size={40} />
                  <p className="text-[#a7a8c7] text-sm">Calle 63B #22-16, Barrio Muequeta<br/>Bogotá, Colombia</p>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Calle+63B+%2322-16+Barrio+Muequeta+Bogota+Colombia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff2df0] hover:bg-[#d91cb8] text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    <MapPin size={16} /> Abrir en Google Maps
                  </a>
                </div>
                <div className="p-4 text-xs text-[#a7a8c7] flex justify-between items-center">
                   <span>Barrio Muequeta, Bogotá</span>
                   <a href="https://maps.google.com/?q=Calle+63B+%2322-16+Barrio+Muequeta%2C+Bogot%C3%A1" target="_blank" rel="noopener noreferrer" className="text-[#00e5ff] hover:underline">
                     Ver en Google Maps
                   </a>
                </div>
              </div>

              <div className="bg-[#15162a] p-6 rounded-2xl shadow-lg border border-white/10">
                <h3 className="text-xl font-bold text-[#f5f5f5] mb-3">Horario de Atención</h3>
                <div className="space-y-2 text-[#a7a8c7]">
                  <p className="text-base text-[#f5f5f5] leading-relaxed">Somos la única tienda 24/7, donde podrá disfrutar y comprar sin limitación y restricciones de horarios. 

"Nos reservamos el derecho de admisión."</p>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div initial={{
            opacity: 0,
            x: 50
          }} animate={isInView ? {
            opacity: 1,
            x: 0
          } : {}} transition={{
            duration: 0.8
          }}>
              <form ref={formRef} onSubmit={handleSubmit} className="bg-[#111322] p-8 rounded-2xl shadow-lg border border-white/5 h-full">
                <h3 className="text-2xl font-bold text-[#f5f5f5] mb-6">Envíanos un Mensaje</h3>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-[#a7a8c7] mb-2">
                      Nombre Completo
                    </label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-[#15162a] border border-white/10 text-[#f5f5f5] rounded-lg focus:ring-2 focus:ring-[#ff2df0] focus:border-transparent transition-all placeholder-[#a7a8c7]/50" placeholder="Tu nombre" />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[#a7a8c7] mb-2">
                      Email
                    </label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-[#15162a] border border-white/10 text-[#f5f5f5] rounded-lg focus:ring-2 focus:ring-[#ff2df0] focus:border-transparent transition-all placeholder-[#a7a8c7]/50" placeholder="tu@email.com" />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-[#a7a8c7] mb-2">
                      Teléfono
                    </label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 bg-[#15162a] border border-white/10 text-[#f5f5f5] rounded-lg focus:ring-2 focus:ring-[#ff2df0] focus:border-transparent transition-all placeholder-[#a7a8c7]/50" placeholder="+57 302 300 71 93" />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-[#a7a8c7] mb-2">
                      Mensaje
                    </label>
                    <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows="5" className="w-full px-4 py-3 bg-[#15162a] border border-white/10 text-[#f5f5f5] rounded-lg focus:ring-2 focus:ring-[#ff2df0] focus:border-transparent transition-all resize-none placeholder-[#a7a8c7]/50" placeholder="Cuéntanos sobre tu idea de tatuaje..."></textarea>
                  </div>

                  <Button type="submit" disabled={sending} className="w-full bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] hover:from-[#d91cb8] hover:to-[#b31797] text-white py-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 group border-none shadow-[0_0_15px_rgba(255,45,240,0.4)] disabled:opacity-60">
                    <span>{sending ? 'Enviando...' : 'Enviar Mensaje'}</span>
                    <Send className="group-hover:translate-x-1 transition-transform" size={20} />
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>;
};
export default Contact;