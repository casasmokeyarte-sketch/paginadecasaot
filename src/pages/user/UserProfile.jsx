import React, { useState, useEffect } from 'react';
import { useUserPanel } from '@/hooks/useUserPanel';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, User, Phone, MapPin, Mail, FileText, Calendar, ShoppingBag, Download, ExternalLink, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const UserProfile = () => {
  const { 
    profile, 
    loadingProfile, 
    updateProfile, 
    myOrders, 
    loadingOrders, 
    myBookings, 
    loadingBookings 
  } = useUserPanel();
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
  };

  const handleDownloadInvoice = (orderId) => {
    toast({
      title: "Descargando Factura",
      description: `Generando factura para el pedido #${orderId.slice(0, 8)}...`,
      duration: 3000,
    });
    // Here you would typically trigger a real PDF download
  };

  if (loadingProfile) return <div className="text-[#a7a8c7]">Cargando perfil...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Cuenta</h1>
        <p className="text-[#a7a8c7]">Gestiona tu información personal y revisa tu historial.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 bg-[#111322] p-1 border border-white/10 w-full sm:w-auto flex-wrap h-auto">
          <TabsTrigger value="profile" className="flex-1 sm:flex-none">
            <User className="mr-2 h-4 w-4" /> Datos Personales
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none">
            <FileText className="mr-2 h-4 w-4" /> Historial y Facturas
          </TabsTrigger>
        </TabsList>

        {/* --- PERSONAL DATA TAB --- */}
        <TabsContent value="profile">
          <div className="bg-[#111322] border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="text-[#ff2df0]" /> Información de Contacto
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (Read Only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#a7a8c7] ml-1">Correo Electrónico</label>
                <div className="relative opacity-50">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[#a7a8c7] cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-[#a7a8c7] ml-1">* El correo no se puede cambiar.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a7a8c7] ml-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                      placeholder="Tu nombre"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a7a8c7] ml-1">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                      placeholder="+57 300..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#a7a8c7] ml-1">Dirección de Envío</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3 text-[#a7a8c7]" size={20} />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all resize-none"
                    placeholder="Calle 123 # 45-67, Bogotá..."
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-[#ff2df0] text-white font-bold py-6 rounded-xl hover:bg-[#d91cb8] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* --- HISTORY TAB --- */}
        <TabsContent value="history" className="space-y-8">
          
          {/* ORDERS & INVOICES SECTION */}
          <div className="bg-[#111322] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="text-[#00e5ff]" /> Pedidos y Facturas
              </h2>
            </div>
            
            <div className="overflow-x-auto">
               {loadingOrders ? (
                  <div className="p-8 text-center text-[#a7a8c7]">Cargando pedidos...</div>
               ) : myOrders.length === 0 ? (
                  <div className="p-8 text-center text-[#a7a8c7]">No hay historial de compras.</div>
               ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[#a7a8c7] text-sm uppercase">
                        <th className="p-4 font-medium">No. Pedido</th>
                        <th className="p-4 font-medium">Fecha</th>
                        <th className="p-4 font-medium">Total</th>
                        <th className="p-4 font-medium">Estado</th>
                        <th className="p-4 font-medium text-right">Factura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {myOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-medium text-white">#{order.id.slice(0, 8)}</td>
                          <td className="p-4 text-[#a7a8c7]">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-[#00e5ff] font-bold">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.total_amount)}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                              ${order.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                                order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}`}>
                              {order.status === 'completed' ? 'Completado' : order.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => handleDownloadInvoice(order.id)}
                              className="inline-flex items-center gap-2 text-xs font-bold text-[#a7a8c7] hover:text-white bg-white/5 hover:bg-[#ff2df0] px-3 py-1.5 rounded-lg transition-all"
                            >
                              <Download size={14} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               )}
            </div>
          </div>

          {/* APPOINTMENTS SECTION */}
          <div className="bg-[#111322] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-[#f4c542]" /> Historial de Citas
              </h2>
            </div>

            <div className="overflow-x-auto">
               {loadingBookings ? (
                  <div className="p-8 text-center text-[#a7a8c7]">Cargando citas...</div>
               ) : myBookings.length === 0 ? (
                  <div className="p-8 text-center text-[#a7a8c7]">No hay historial de citas.</div>
               ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-[#a7a8c7] text-sm uppercase">
                        <th className="p-4 font-medium">Fecha</th>
                        <th className="p-4 font-medium">Hora</th>
                        <th className="p-4 font-medium">Estilo / Servicio</th>
                        <th className="p-4 font-medium">Artista</th>
                        <th className="p-4 font-medium text-right">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {myBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white">{booking.appointment_date}</td>
                          <td className="p-4 text-[#a7a8c7] flex items-center gap-2">
                             <Clock size={14} /> {booking.appointment_time}
                          </td>
                          <td className="p-4 text-white font-medium">{booking.style}</td>
                          <td className="p-4 text-[#a7a8c7] capitalize">{booking.artist}</td>
                          <td className="p-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase
                              ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 
                                booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 
                                booking.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {booking.status === 'confirmed' ? 'Confirmada' : 
                               booking.status === 'pending' ? 'Pendiente' : 
                               booking.status === 'cancelled' ? 'Cancelada' : 'Realizada'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               )}
            </div>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;