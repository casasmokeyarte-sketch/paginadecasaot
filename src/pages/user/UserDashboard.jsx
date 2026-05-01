import React from 'react';
import { useUserPanel } from '@/hooks/useUserPanel';
import { Link } from 'react-router-dom';
import { Calendar, ShoppingBag, ArrowRight, UserCircle, Phone, MessageCircle, Heart, FileText, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const UserDashboard = () => {
  const { profile, myBookings, myOrders, wishlist, myPqrs, loadingProfile } = useUserPanel();

  const nextAppointment = myBookings.find(b => b.status === 'confirmed' || b.status === 'pending');
  const activeProcesses = myBookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Hola, {loadingProfile ? '...' : (profile?.full_name || 'Artista')}
        </h1>
        <p className="text-[#a7a8c7]">Bienvenido a tu panel de control.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/user/bookings">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#111322] border border-white/10 p-5 rounded-2xl hover:border-[#ff2df0]/50 transition-colors h-full"
          >
            <div className="w-10 h-10 rounded-xl bg-[#ff2df0]/10 flex items-center justify-center text-[#ff2df0] mb-3">
              <Calendar size={20} />
            </div>
            <h3 className="text-[#a7a8c7] text-sm font-medium">Citas</h3>
            <p className="text-2xl font-bold text-white mt-1">
              {myBookings.filter(b => b.status !== 'cancelled').length}
            </p>
          </motion.div>
        </Link>

        <Link to="/user/orders">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#111322] border border-white/10 p-5 rounded-2xl hover:border-[#00e5ff]/50 transition-colors h-full"
          >
            <div className="w-10 h-10 rounded-xl bg-[#00e5ff]/10 flex items-center justify-center text-[#00e5ff] mb-3">
              <ShoppingBag size={20} />
            </div>
            <h3 className="text-[#a7a8c7] text-sm font-medium">Pedidos</h3>
            <p className="text-2xl font-bold text-white mt-1">{myOrders.length}</p>
          </motion.div>
        </Link>

        <Link to="/user/wishlist">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#111322] border border-white/10 p-5 rounded-2xl hover:border-[#f4c542]/50 transition-colors h-full"
          >
            <div className="w-10 h-10 rounded-xl bg-[#f4c542]/10 flex items-center justify-center text-[#f4c542] mb-3">
              <Heart size={20} />
            </div>
            <h3 className="text-[#a7a8c7] text-sm font-medium">Deseos</h3>
            <p className="text-2xl font-bold text-white mt-1">{wishlist.length}</p>
          </motion.div>
        </Link>
        
        <Link to="/user/pqr">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#111322] border border-white/10 p-5 rounded-2xl hover:border-red-500/50 transition-colors h-full"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-[#a7a8c7] text-sm font-medium">PQR Abiertos</h3>
            <p className="text-2xl font-bold text-white mt-1">{myPqrs.filter(p => p.status === 'pending').length}</p>
          </motion.div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status / Processes Panel */}
          <div className="lg:col-span-2 space-y-6">
              {/* Next Appointment */}
              <div className="bg-gradient-to-r from-[#111322] to-[#1a1c2e] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">Próxima Actividad</h2>
                    {nextAppointment ? (
                      <div className="space-y-1">
                        <p className="text-[#00e5ff] font-semibold">{nextAppointment.style} con {nextAppointment.artist}</p>
                        <p className="text-[#a7a8c7]">{nextAppointment.appointment_date} a las {nextAppointment.appointment_time}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mt-2 ${
                          nextAppointment.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {nextAppointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente de Aprobación'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[#a7a8c7]">No hay actividades pendientes.</p>
                    )}
                  </div>
                  
                  {nextAppointment ? (
                    <Link to="/user/bookings">
                      <button className="px-5 py-2 bg-[#ff2df0] text-white rounded-lg font-bold hover:bg-[#d91cb8] transition-colors text-sm">
                        Ver Detalles
                      </button>
                    </Link>
                  ) : (
                    <Link to="/booking">
                      <button className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 text-white rounded-lg font-bold hover:bg-[#ff2df0] hover:border-transparent transition-all text-sm">
                        Agendar <ArrowRight size={16} />
                      </button>
                    </Link>
                  )}
                </div>
              </div>

               {/* Process Status */}
               <div className="bg-[#111322] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Estado de Procesos</h3>
                  {activeProcesses > 0 ? (
                      <div className="space-y-4">
                         {myBookings.filter(b => b.status === 'confirmed').map(process => (
                             <div key={process.id} className="flex items-center gap-4 bg-[#050510] p-4 rounded-xl border border-white/5">
                                 <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                                     <CheckCircle2 size={20} />
                                 </div>
                                 <div className="flex-1">
                                     <p className="text-white font-medium">Tatuaje: {process.style}</p>
                                     <p className="text-xs text-[#a7a8c7]">En progreso - Fecha: {process.appointment_date}</p>
                                 </div>
                                 <div className="text-xs font-bold px-2 py-1 bg-white/5 rounded text-white">
                                     ACTIVO
                                 </div>
                             </div>
                         ))}
                      </div>
                  ) : (
                      <div className="text-center py-6">
                          <Clock className="mx-auto text-[#a7a8c7] mb-2" size={32} />
                          <p className="text-[#a7a8c7]">No tienes procesos activos actualmente.</p>
                      </div>
                  )}
               </div>
          </div>

          {/* Customer Support Panel */}
          <div className="bg-[#111322] border border-white/10 rounded-2xl p-6 h-fit">
             <h3 className="text-lg font-bold text-white mb-4">Atención al Cliente</h3>
             <p className="text-[#a7a8c7] text-sm mb-6">
                ¿Necesitas ayuda con tu pedido o cita? Contáctanos directamente.
             </p>
             
             <div className="space-y-3">
                 <a 
                    href="https://wa.me/573023006986" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl transition-all group"
                 >
                    <div className="bg-[#25D366] text-white p-2 rounded-full">
                        <MessageCircle size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-white font-bold group-hover:text-[#25D366] transition-colors">WhatsApp</p>
                        <p className="text-xs text-[#a7a8c7]">Chat en vivo</p>
                    </div>
                 </a>

                 <a 
                    href="tel:+573023006986" 
                    className="flex items-center gap-3 w-full p-4 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/20 rounded-xl transition-all group"
                 >
                    <div className="bg-[#00e5ff] text-[#050510] p-2 rounded-full">
                        <Phone size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-white font-bold group-hover:text-[#00e5ff] transition-colors">Llamada</p>
                        <p className="text-xs text-[#a7a8c7]">+57 302 300 69 86</p>
                    </div>
                 </a>
             </div>
             
             <div className="mt-6 pt-6 border-t border-white/5">
                 <p className="text-xs text-[#a7a8c7] text-center mb-3">¿Tienes una queja o reclamo?</p>
                 <Link to="/user/pqr">
                    <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors">
                        Radicar PQR
                    </button>
                 </Link>
             </div>
          </div>
      </div>
    </div>
  );
};

export default UserDashboard;