import React, { useState } from 'react';
import { useUserPanel } from '@/hooks/useUserPanel';
import { Calendar, Clock, Palette, User, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const UserBookings = () => {
  const { myBookings, loadingBookings, cancelBooking } = useUserPanel();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-xs font-bold uppercase border border-green-400/20"><CheckCircle2 size={12} /> Confirmada</span>;
      case 'cancelled': return <span className="flex items-center gap-1 text-red-400 bg-red-400/10 px-3 py-1 rounded-full text-xs font-bold uppercase border border-red-400/20"><XCircle size={12} /> Cancelada</span>;
      case 'completed': return <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full text-xs font-bold uppercase border border-blue-400/20"><CheckCircle2 size={12} /> Completada</span>;
      default: return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full text-xs font-bold uppercase border border-yellow-400/20"><AlertCircle size={12} /> Pendiente</span>;
    }
  };

  const handleCancelClick = (bookingId) => {
    setSelectedBookingId(bookingId);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBookingId) {
      cancelBooking(selectedBookingId);
      setCancelDialogOpen(false);
      setSelectedBookingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mis Citas</h1>
          <p className="text-[#a7a8c7]">Historial y seguimiento de tus sesiones.</p>
        </div>
        <Link to="/booking">
          <button className="bg-[#ff2df0] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#d91cb8] transition-colors text-sm">
            Nueva Cita
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {loadingBookings ? (
          <p className="text-[#a7a8c7]">Cargando tus citas...</p>
        ) : myBookings.length === 0 ? (
          <div className="text-center py-20 bg-[#111322] border border-white/10 rounded-2xl">
            <Calendar className="mx-auto h-16 w-16 text-[#2a2d45] mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">No tienes citas aún</h3>
            <p className="text-[#a7a8c7] mb-6">¿Listo para tu próximo tatuaje?</p>
            <Link to="/booking">
              <button className="bg-[#00e5ff] text-[#050510] px-6 py-3 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all">
                Agendar Entrevista
              </button>
            </Link>
          </div>
        ) : (
          myBookings.map((booking) => (
            <div key={booking.id} className="bg-[#111322] border border-white/10 rounded-xl p-6 transition-all hover:border-white/20">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-white">{booking.style}</h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#a7a8c7]">
                    <div className="flex items-center gap-2">
                       <Calendar size={16} className="text-[#ff2df0]" />
                       <span>{booking.appointment_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Clock size={16} className="text-[#00e5ff]" />
                       <span>{booking.appointment_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <User size={16} className="text-[#f4c542]" />
                       <span>Artista: <span className="text-white font-medium capitalize">{booking.artist}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Palette size={16} className="text-[#ff2df0]" />
                       <span>Estilo: {booking.style}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 gap-2">
                  {booking.status === 'pending' && (
                    <button 
                      onClick={() => handleCancelClick(booking.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-400/10 transition-colors"
                    >
                      <XCircle size={16} /> Cancelar Solicitud
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <p className="text-xs text-[#a7a8c7] max-w-[200px] text-center md:text-right">
                      Para reprogramar una cita confirmada, por favor contáctanos directamente por WhatsApp.
                    </p>
                  )}
                  {(booking.status === 'cancelled' || booking.status === 'completed') && (
                     <div className="text-sm text-[#a7a8c7] text-center md:text-right">
                        Historial
                     </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-[#111322] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Cancelar Cita</DialogTitle>
            <DialogDescription className="text-[#a7a8c7]">
              ¿Estás seguro de que deseas cancelar esta solicitud de cita? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              No, mantener cita
            </Button>
            <Button
              onClick={handleConfirmCancel}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Sí, cancelar cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserBookings;