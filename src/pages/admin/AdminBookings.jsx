import React, { useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AdminBookings = () => {
  const { bookings, loadingBookings, fetchBookings, updateBookingStatus } = useSupabaseData();

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Citas y Entrevistas</h1>
        <p className="text-[#a7a8c7]">Gestiona las solicitudes de tus clientes.</p>
      </div>

      <div className="grid gap-4">
        {loadingBookings ? (
          <p className="text-[#a7a8c7]">Cargando citas...</p>
        ) : bookings.length === 0 ? (
          <div className="p-8 border border-white/10 rounded-2xl text-center">
             <Calendar className="mx-auto h-12 w-12 text-[#a7a8c7] mb-4" />
             <p className="text-[#a7a8c7]">No hay citas registradas aún.</p>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} className="bg-[#111322] border border-white/5 rounded-xl p-6 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <h3 className="text-xl font-bold text-white">{booking.client_name}</h3>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)} uppercase`}>
                     {booking.status}
                   </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-sm text-[#a7a8c7]">
                  <p className="flex items-center gap-2"><User size={14} /> {booking.client_email} | {booking.client_phone}</p>
                  <p className="flex items-center gap-2"><Calendar size={14} /> {booking.appointment_date} <Clock size={14} className="ml-2" /> {booking.appointment_time}</p>
                  <p className="text-white mt-2 md:col-span-2">
                    <span className="text-[#ff2df0] font-bold">Artista:</span> {booking.artist} &nbsp;|&nbsp; 
                    <span className="text-[#00e5ff] font-bold">Estilo:</span> {booking.style}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {booking.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Confirmar
                    </button>
                    <button 
                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <XCircle size={16} /> Cancelar
                    </button>
                  </>
                )}
                 {booking.status === 'confirmed' && (
                    <button 
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <CheckCircle size={16} /> Completar
                    </button>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBookings;