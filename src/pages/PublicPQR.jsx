import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare as MessageSquareWarning, CheckCircle2, User, Mail, Phone, FileText } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const PublicPQR = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Pre-fill data if user is logged in
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data: rows, error } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .limit(1);
        const data = rows?.[0] || null;

        if (data && !error) {
          setFormData(prev => ({
            ...prev,
            fullName: data.full_name || '',
            phone: data.phone || '',
            email: user.email || ''
          }));
        } else {
             setFormData(prev => ({
                ...prev,
                email: user.email || ''
              }));
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('pqr')
        .insert([{
          user_id: user ? user.id : null,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          status: 'pending'
        }]);

      if (error) throw error;
      
      setIsSuccess(true);
      setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
      toast({ title: 'PQR Recibido', description: 'Tu solicitud ha sido radicada correctamente.' });
    } catch (error) {
      console.error('Error sending PQR:', error);
      toast({ title: 'Error', description: 'No se pudo enviar el PQR. Inténtalo de nuevo.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-[#111322] border border-white/10 rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-500 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">¡Solicitud Recibida!</h2>
          <p className="text-[#a7a8c7] mb-8">
            Hemos recibido tu PQR exitosamente. Nuestro equipo revisará tu caso y te contactará a través del correo electrónico proporcionado ({formData.email || 'tu correo'}) lo antes posible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <button 
               onClick={() => setIsSuccess(false)}
               className="px-6 py-3 bg-[#111322] border border-white/20 hover:bg-white/5 text-white rounded-xl font-bold transition-all"
             >
               Enviar otro PQR
             </button>
             <Link to="/">
               <button className="px-6 py-3 bg-[#ff2df0] text-white rounded-xl font-bold hover:bg-[#d91cb8] transition-all">
                 Volver al Inicio
               </button>
             </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Centro de <span className="text-[#ff2df0]">PQR</span></h1>
          <p className="text-lg text-[#a7a8c7] max-w-2xl mx-auto">
             Peticiones, Quejas y Reclamos. Estamos aquí para escucharte y mejorar tu experiencia.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Info Sidebar */}
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
             className="md:col-span-1 space-y-6"
           >
              <div className="bg-[#111322] p-6 rounded-2xl border border-white/10">
                 <h3 className="text-xl font-bold text-white mb-4">¿Cómo funciona?</h3>
                 <ul className="space-y-4 text-[#a7a8c7] text-sm">
                    <li className="flex gap-3">
                       <MessageSquareWarning className="flex-shrink-0 text-[#ff2df0]" size={20} />
                       <span>Radica tu solicitud llenando el formulario con tus datos reales.</span>
                    </li>
                    <li className="flex gap-3">
                       <CheckCircle2 className="flex-shrink-0 text-[#00e5ff]" size={20} />
                       <span>Recibirás un número de radicado o confirmación (interno) y te contactaremos.</span>
                    </li>
                    <li className="flex gap-3">
                       <User className="flex-shrink-0 text-[#f4c542]" size={20} />
                       <span>Si tienes cuenta, puedes ver el estado de tu solicitud en tu perfil.</span>
                    </li>
                 </ul>
              </div>

              <div className="bg-gradient-to-br from-[#111322] to-[#1a1c2e] p-6 rounded-2xl border border-white/10">
                 <h3 className="text-xl font-bold text-white mb-2">Canales Directos</h3>
                 <p className="text-[#a7a8c7] text-sm mb-4">¿Prefieres hablar con alguien?</p>
                 <a href="https://wa.me/573023006986" target="_blank" rel="noopener noreferrer" className="block w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-center transition-all mb-3">
                    WhatsApp
                 </a>
                 <a href="tel:+573023006986" className="block w-full py-3 bg-[#111322] border border-white/10 hover:border-[#00e5ff] text-white rounded-xl font-bold text-center transition-all">
                    Llamar Ahora
                 </a>
              </div>
           </motion.div>

           {/* Form */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.3 }}
             className="md:col-span-2 bg-[#111322] border border-white/10 rounded-2xl p-6 md:p-8"
           >
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-[#a7a8c7] ml-1">Nombre Completo</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                          <input 
                            type="text" 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] outline-none transition-all"
                            placeholder="Tu nombre"
                          />
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-[#a7a8c7] ml-1">Teléfono (Opcional)</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                          <input 
                            type="tel" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] outline-none transition-all"
                            placeholder="+57 300..."
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-medium text-[#a7a8c7] ml-1">Correo Electrónico</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                       <input 
                         type="email" 
                         name="email"
                         value={formData.email}
                         onChange={handleChange}
                         required
                         className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] outline-none transition-all"
                         placeholder="tucorreo@ejemplo.com"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-medium text-[#a7a8c7] ml-1">Tipo de Solicitud</label>
                    <div className="relative">
                       <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                       <select 
                         name="subject"
                         value={formData.subject}
                         onChange={handleChange}
                         required
                         className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] outline-none appearance-none"
                       >
                         <option value="">Selecciona una opción</option>
                         <option value="Petición">Petición</option>
                         <option value="Queja">Queja</option>
                         <option value="Reclamo">Reclamo</option>
                         <option value="Sugerencia">Sugerencia</option>
                         <option value="Felicitación">Felicitación</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-medium text-[#a7a8c7] ml-1">Mensaje</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl p-4 text-white focus:border-[#ff2df0] outline-none resize-none"
                      placeholder="Describe tu solicitud detalladamente..."
                    />
                 </div>

                 <button 
                   type="submit"
                   disabled={isSubmitting}
                   className="w-full bg-gradient-to-r from-[#00e5ff] to-[#ff2df0] text-[#050510] font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
                 >
                   {isSubmitting ? 'Enviando...' : 'Radicar Solicitud'} <Send size={20} />
                 </button>
              </form>
           </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PublicPQR;
