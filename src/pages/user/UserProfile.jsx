import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPanel } from '@/hooks/useUserPanel';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, User, Phone, MapPin, Mail, FileText, Calendar, 
  ShoppingBag, Download, ExternalLink, Clock, Trash2, 
  AlertTriangle, Camera, Trash, Loader2, Bell, Eye, EyeOff,
  ThumbsUp, Heart, Smile, MessageSquare, Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { uploadFileToBucket } from '@/lib/storageUpload';
import { supabase } from '@/lib/customSupabaseClient';
import UserProfileViewModal from '@/components/UserProfileViewModal';

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
  
  const { user, deleteAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // New features states
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    gender: '',
    interests: '',
    is_city_public: true,
    is_country_public: true,
    is_gender_public: true,
    is_interests_public: true,
    is_profile_public: true
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
        gender: profile.gender || '',
        interests: profile.interests || '',
        is_city_public: profile.is_city_public ?? true,
        is_country_public: profile.is_country_public ?? true,
        is_gender_public: profile.is_gender_public ?? true,
        is_interests_public: profile.is_interests_public ?? true,
        is_profile_public: profile.is_profile_public ?? true
      });
    }
  }, [profile]);

  // Fetch reactions notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from('profile_notifications')
        .select('*, from_user_id:profiles(id, full_name, username, avatar_url)')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      toast({
        title: 'Campo obligatorio',
        description: 'Debes definir un nombre de usuario.',
        variant: 'destructive'
      });
      return;
    }
    updateProfile(formData);
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const publicUrl = await uploadFileToBucket({
        file,
        bucket: 'avatars',
        folder: user.id
      });
      
      await updateProfile({
        ...formData,
        avatar_url: publicUrl
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error al subir imagen',
        description: err.message || 'No se pudo subir la foto de perfil.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setIsUploading(true);
      await updateProfile({
        ...formData,
        avatar_url: null
      });
      toast({
        title: 'Foto eliminada',
        description: 'Tu foto de perfil ha sido eliminada.'
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la foto de perfil.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('profile_notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from('profile_notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({
        title: 'Notificación eliminada',
        description: 'La notificación ha sido quitada de tu lista.'
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleDownloadInvoice = (orderId) => {
    toast({
      title: "Descargando Factura",
      description: `Generando factura para el pedido #${orderId.slice(0, 8)}...`,
      duration: 3000,
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return;
    setIsDeletingAccount(true);
    const { error } = await deleteAccount();
    setIsDeletingAccount(false);
    if (!error) {
      navigate('/', { replace: true });
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loadingProfile) return <div className="text-[#a7a8c7]">Cargando perfil...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Cuenta</h1>
        <p className="text-[#a7a8c7]">Gestiona tu información personal, privacidad e interactúa con la comunidad.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 bg-[#111322] p-1 border border-white/10 w-full sm:w-auto flex flex-wrap h-auto">
          <TabsTrigger value="profile" className="flex-grow sm:flex-none">
            <User className="mr-2 h-4 w-4" /> Datos Personales
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-grow sm:flex-none relative" onClick={fetchNotifications}>
            <Bell className="mr-2 h-4 w-4" /> Notificaciones
            {unreadNotifications > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-pink-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                {unreadNotifications}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-grow sm:flex-none">
            <FileText className="mr-2 h-4 w-4" /> Historial y Facturas
          </TabsTrigger>
        </TabsList>

        {/* --- PERSONAL DATA TAB --- */}
        <TabsContent value="profile">
          <div className="bg-[#111322] border border-white/10 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="text-[#ff2df0]" /> Información de Contacto
            </h2>

            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-pink-500/50 bg-[#050510] flex items-center justify-center relative">
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <Loader2 className="animate-spin text-[#ff2df0]" size={24} />
                    </div>
                  )}
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Foto de perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-[#a7a8c7]" size={40} />
                  )}
                </div>
                
                {/* Floating camera icon */}
                <label className="absolute bottom-0 right-0 p-2 bg-[#ff2df0] hover:bg-[#d91cb8] rounded-full cursor-pointer transition-colors shadow-lg border border-[#111322] flex items-center justify-center">
                  <Camera size={14} className="text-white" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUploadAvatar} 
                    disabled={isUploading} 
                    className="hidden" 
                  />
                </label>
              </div>

              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <h3 className="text-white font-bold text-lg">Foto de Perfil</h3>
                <p className="text-xs text-[#a7a8c7] mt-1 mb-3">
                  Sube una foto cuadrada de hasta 5MB. Se reflejará en tus comentarios y mensajes de chat.
                </p>
                <div className="flex gap-2">
                  <label className="text-xs font-bold text-white bg-white/5 hover:bg-[#ff2df0] hover:text-white px-4 py-2 rounded-xl transition-all cursor-pointer border border-white/10 flex items-center gap-1">
                    Cambiar foto
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUploadAvatar} 
                      disabled={isUploading} 
                      className="hidden" 
                    />
                  </label>
                  {profile?.avatar_url && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      disabled={isUploading}
                      className="text-xs font-bold text-red-400 hover:text-white hover:bg-red-600 bg-red-500/10 px-4 py-2 rounded-xl transition-all border border-red-500/20 flex items-center gap-1"
                    >
                      <Trash size={12} /> Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile Visibility Setting (General) */}
              <div className="bg-[#050510] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-white flex items-center gap-1.5">
                    {formData.is_profile_public ? <Eye size={16} className="text-green-400" /> : <EyeOff size={16} className="text-red-400" />}
                    Perfil Visible al Público
                  </label>
                  <span className="text-xs text-[#a7a8c7] block mt-0.5">
                    Si desactivas esta opción, los demás miembros de la comunidad no podrán ver ningún dato de tu perfil.
                  </span>
                </div>
                <input 
                  type="checkbox"
                  checked={formData.is_profile_public}
                  onChange={(e) => setFormData({...formData, is_profile_public: e.target.checked})}
                  className="w-5 h-5 rounded accent-[#ff2df0] cursor-pointer"
                />
              </div>

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

              {/* Names and Username */}
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a7a8c7] ml-1">Nombre de Usuario (Username) *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff2df0]" size={20} />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')})}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all font-mono"
                      placeholder="ej. juanito_tattoo"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-[#a7a8c7] ml-1">Este nombre identificará tu perfil y será visto por los demás usuarios en el chat.</p>
                </div>
              </div>

              {/* Phone & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-2">
                  <div className="flex justify-between items-center pr-1">
                    <label className="text-sm font-medium text-[#a7a8c7] ml-1">Sexo</label>
                    <label className="flex items-center gap-1 text-[11px] text-[#a7a8c7] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_gender_public} 
                        onChange={(e) => setFormData({...formData, is_gender_public: e.target.checked})}
                        className="accent-[#ff2df0] w-3 h-3 rounded"
                      />
                      Hacer público
                    </label>
                  </div>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                  >
                    <option value="">Selecciona género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                    <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                  </select>
                </div>
              </div>

              {/* City & Country Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center pr-1">
                    <label className="text-sm font-medium text-[#a7a8c7] ml-1">Ciudad</label>
                    <label className="flex items-center gap-1 text-[11px] text-[#a7a8c7] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_city_public} 
                        onChange={(e) => setFormData({...formData, is_city_public: e.target.checked})}
                        className="accent-[#ff2df0] w-3 h-3 rounded"
                      />
                      Hacer público
                    </label>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                      placeholder="Bogotá, Medellín, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center pr-1">
                    <label className="text-sm font-medium text-[#a7a8c7] ml-1">País</label>
                    <label className="flex items-center gap-1 text-[11px] text-[#a7a8c7] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_country_public} 
                        onChange={(e) => setFormData({...formData, is_country_public: e.target.checked})}
                        className="accent-[#ff2df0] w-3 h-3 rounded"
                      />
                      Hacer público
                    </label>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                      placeholder="Colombia, México, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Interests & Shipping Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center pr-1">
                    <label className="text-sm font-medium text-[#a7a8c7] ml-1">Interés Principal</label>
                    <label className="flex items-center gap-1 text-[11px] text-[#a7a8c7] cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_interests_public} 
                        onChange={(e) => setFormData({...formData, is_interests_public: e.target.checked})}
                        className="accent-[#ff2df0] w-3 h-3 rounded"
                      />
                      Hacer público
                    </label>
                  </div>
                  <select
                    value={formData.interests}
                    onChange={(e) => setFormData({...formData, interests: e.target.value})}
                    className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                  >
                    <option value="">Selecciona interés</option>
                    <option value="Tatuajes">Tatuajes</option>
                    <option value="Piercings">Piercings</option>
                    <option value="Smoke Shop">Smoke Shop</option>
                    <option value="Colecciones de Arte">Colecciones de Arte</option>
                    <option value="Todos">Todos los anteriores</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a7a8c7] ml-1">Dirección de Despacho (Solo Privado)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 text-[#a7a8c7]" size={20} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={3}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all resize-none text-xs"
                      placeholder="Dirección para tus envíos físicos..."
                    />
                  </div>
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

        {/* --- NOTIFICATIONS TAB --- */}
        <TabsContent value="notifications">
          <div className="bg-[#111322] border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="text-[#ff2df0]" /> Historial de Reacciones
              </h2>
              <button 
                onClick={fetchNotifications}
                className="text-xs text-pink-400 hover:text-white transition-colors"
              >
                Actualizar lista
              </button>
            </div>

            {loadingNotifications ? (
              <div className="py-12 text-center text-[#a7a8c7] flex flex-col items-center justify-center gap-2">
                <Loader2 className="animate-spin text-[#ff2df0]" size={28} />
                <p className="text-sm">Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-[#a7a8c7]">
                <Bell className="mx-auto h-12 w-12 opacity-25 mb-3" />
                <p>No tienes notificaciones en este momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((n) => {
                  const sender = n.from_user_id;
                  const isRead = n.read;
                  
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => !isRead && handleMarkAsRead(n.id)}
                      className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border transition-all ${
                        isRead 
                          ? 'bg-white/[0.02] border-white/5' 
                          : 'bg-pink-500/5 border-pink-500/20 shadow-md shadow-pink-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#050510] border border-white/10 flex-shrink-0">
                          {sender?.avatar_url ? (
                            <img src={sender.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#1e293b] flex items-center justify-center text-xs font-bold text-white">
                              {sender?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white">
                            <span className="font-bold text-pink-400">
                              {sender?.username ? `@${sender.username}` : (sender?.full_name || 'Alguien')}
                            </span>{' '}
                            {n.message}
                          </p>
                          <span className="text-[10px] text-[#a7a8c7] block mt-0.5">
                            {new Date(n.created_at).toLocaleDateString()} a las {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => setSelectedProfileId(sender?.id)}
                          disabled={!sender?.id}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-pink-500/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          Ver Perfil
                        </button>
                        <button
                          onClick={() => sender?.id && navigate(`/user/chat?dm=${sender.id}`)}
                          disabled={!sender?.id}
                          className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          <MessageSquare size={12} /> Chatear
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(n.id);
                          }}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                          title="Eliminar notificación"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* --- DANGER ZONE --- */}
      <div className="mt-10">
        <button
          onClick={() => setShowDeleteZone((v) => !v)}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          <AlertTriangle size={16} />
          {showDeleteZone ? 'Ocultar zona de peligro' : 'Zona de peligro'}
        </button>

        {showDeleteZone && (
          <div className="mt-4 bg-red-950/30 border border-red-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
              <Trash2 size={20} /> Eliminar mi cuenta
            </h3>
            <p className="text-sm text-[#a7a8c7] mb-4">
              Esta acción es <strong className="text-white">permanente e irreversible</strong>. Se eliminarán tu cuenta, perfil y todos tus datos personales.
              Escribe <span className="font-mono font-bold text-red-400">ELIMINAR</span> para confirmar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className="flex-1 bg-[#050510] border border-red-500/40 rounded-xl py-2 px-4 text-white placeholder-[#a7a8c7] focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'ELIMINAR' || isDeletingAccount}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={16} />
                {isDeletingAccount ? 'Eliminando...' : 'Eliminar cuenta'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Public Profile View Dialog */}
      <UserProfileViewModal 
        userId={selectedProfileId}
        isOpen={selectedProfileId !== null}
        onClose={() => setSelectedProfileId(null)}
      />
    </div>
  );
};

export default UserProfile;