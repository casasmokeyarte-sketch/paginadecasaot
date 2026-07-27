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
import { cn } from '@/lib/utils';
import UserProfileViewModal from '@/components/UserProfileViewModal';

const COUNTRIES = [
  "Colombia", "México", "Venezuela", "España", "Argentina", "Chile", "Perú",
  "Ecuador", "Guatemala", "Cuba", "Bolivia", "República Dominicana",
  "Honduras", "Paraguay", "El Salvador", "Nicaragua", "Costa Rica",
  "Panamá", "Uruguay", "Puerto Rico", "Estados Unidos"
];

const CITIES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta",
  "Bucaramanga", "Pereira", "Ibagué", "Santa Marta", "Manizales",
  "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana",
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza",
  "Buenos Aires", "Córdoba", "Rosario", "Santiago", "Valparaíso",
  "Concepción", "Lima", "Arequipa", "Trujillo", "Caracas", "Maracaibo",
  "Valencia (Venezuela)", "Quito", "Guayaquil", "Cuenca"
];

const ADDRESSES = [
  "Calle 85 # 11-53, Bogotá, Colombia",
  "Carrera 7 # 72-13, Bogotá, Colombia",
  "Calle 10 # 36-24, Medellín, Colombia",
  "Avenida Reforma 234, Ciudad de México, México",
  "Gran Vía 45, Madrid, España",
  "Avenida Libertador 1250, Buenos Aires, Argentina",
  "Paseo de la Castellana 112, Madrid, España",
  "Avenida Apoquindo 3400, Las Condes, Santiago, Chile"
];

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
  
  // Custom Autocomplete States
  const [countrySelected, setCountrySelected] = useState(false);
  const [citySelected, setCitySelected] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);

  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

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
    is_profile_public: true,
    is_data_authorized: false
  });

  // Micro-interaction Audio synthesizer click cue helper
  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // high pitch click
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (err) {}
  };

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
        is_profile_public: profile.is_profile_public ?? true,
        is_data_authorized: profile.is_data_authorized ?? false
      });
      // Initialize selection flags as true if data already exists
      setCountrySelected(!!profile.country);
      setCitySelected(!!profile.city);
      setAddressSelected(!!profile.address);
    }
  }, [profile]);

  // Fetch reactions notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifications(true);
      const { data, error } = await supabase
        .from('profile_notifications')
        .select('*, from_user_id:profiles!profile_notifications_from_user_id_fkey(id, full_name, username, avatar_url)')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.log('Error fetching notifications:', err);
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
    playClickSound();

    if (!formData.username.trim()) {
      toast({
        title: 'Campo obligatorio',
        description: 'Debes definir un nombre de usuario.',
        variant: 'destructive'
      });
      return;
    }

    // Autocomplete option validation
    if (formData.country && !countrySelected) {
      toast({
        title: 'Selección requerida',
        description: 'Debes seleccionar un país válido de las opciones de la bandeja.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.city && !citySelected) {
      toast({
        title: 'Selección requerida',
        description: 'Debes seleccionar una ciudad válida de las opciones de la bandeja.',
        variant: 'destructive'
      });
      return;
    }

    if (formData.address && !addressSelected) {
      toast({
        title: 'Selección requerida',
        description: 'Debes seleccionar una dirección válida de las sugerencias.',
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

  const generateInvoicePDF = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Bloqueador de ventanas emergentes activo',
        description: 'Por favor permite las ventanas emergentes (popups) para descargar la factura.',
        variant: 'destructive',
      });
      return;
    }

    const itemsHTML = (invoice.items || []).map(item => `
      <tr class="item">
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name || 'Producto'}
          ${item.variant_name ? `<br><small style="color: #666; font-size: 10px;">${item.variant_name}</small>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${new Intl.NumberFormat('es-CO').format(item.price || item.unit_price || 0)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${new Intl.NumberFormat('es-CO').format((item.price || item.unit_price || 0) * (item.quantity || 1))}</td>
      </tr>
    `).join('');

    const formattedDate = new Date(invoice.created_at).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const subtotalVal = invoice.subtotal || (invoice.total_amount / 1.19);
    const taxVal = invoice.tax_amount || (invoice.total_amount - subtotalVal);

    const formattedSubtotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(subtotalVal);
    const formattedTax = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(taxVal);
    const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoice.total_amount);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Factura ${invoice.invoice_number}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #333;
              margin: 40px;
              font-size: 14px;
              line-height: 1.6;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              padding: 30px;
              border: 1px solid #eee;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
              border-radius: 10px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #ff2df0;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #ff2df0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details h2 {
              margin: 0;
              color: #111;
              font-size: 22px;
            }
            .info-grid {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              gap: 20px;
            }
            .info-col {
              flex: 1;
              background: #fbfbfb;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #f0f0f0;
            }
            .info-col h3 {
              margin-top: 0;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
              color: #ff2df0;
              font-size: 13px;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #f7f7f7;
              border-bottom: 2px solid #eee;
              padding: 10px;
              font-weight: bold;
              text-align: left;
              text-transform: uppercase;
              font-size: 11px;
            }
            .totals {
              width: 45%;
              margin-left: auto;
              margin-bottom: 30px;
            }
            .totals table {
              margin-bottom: 0;
            }
            .totals table td {
              padding: 6px 10px;
              border: none;
            }
            .totals table tr.grand-total td {
              border-top: 2px solid #ff2df0;
              font-weight: bold;
              font-size: 15px;
              color: #ff2df0;
            }
            .footer {
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 20px;
              color: #999;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .invoice-box {
                border: none;
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="logo">Casa Smoke & Arte</div>
              <div class="invoice-details">
                <h2>FACTURA</h2>
                <div>Nº: <strong>${invoice.invoice_number}</strong></div>
                <div>Fecha: ${formattedDate}</div>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-col">
                <h3>Emisor</h3>
                <strong>Casa Smoke y Arte OT SSOT S.A.S</strong><br>
                NIT: 901.234.567-8<br>
                Estudio de Tatuajes & Smoke Shop<br>
                Colombia
              </div>
              <div class="info-col">
                <h3>Cliente</h3>
                <strong>${invoice.client_name}</strong><br>
                Email: ${invoice.client_email || 'No registrado'}<br>
                Teléfono: ${invoice.client_phone || 'No registrado'}<br>
                Dirección: ${invoice.client_address || 'No registrado'}
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style="text-align: center; width: 80px;">Cant.</th>
                  <th style="text-align: right; width: 120px;">Precio Unit.</th>
                  <th style="text-align: right; width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <div class="totals">
              <table>
                <tr>
                  <td style="padding: 6px 10px;">Subtotal:</td>
                  <td style="text-align: right; padding: 6px 10px;">${formattedSubtotal}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px;">IVA (19%):</td>
                  <td style="text-align: right; padding: 6px 10px;">${formattedTax}</td>
                </tr>
                <tr class="grand-total">
                  <td style="padding: 6px 10px; border-top: 2px solid #ff2df0;">Total:</td>
                  <td style="text-align: right; padding: 6px 10px; border-top: 2px solid #ff2df0;">${formattedTotal}</td>
                </tr>
              </table>
            </div>
            
            <div class="footer">
              ¡Gracias por tu compra!<br>
              Casa Smoke y Arte OT SSOT S.A.S — El arte en tu piel, el estilo en tu vida.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadInvoice = async (orderId) => {
    playClickSound();
    
    toast({
      title: "Generando Factura",
      description: "Buscando información de tu compra...",
    });

    try {
      // 1. Intentar obtener factura de la tabla `invoices`
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', orderId)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        generateInvoicePDF(data[0]);
      } else {
        // 2. Si no se encuentra fila en `invoices` aún, la generamos
        // de forma dinámica con los datos del pedido en `myOrders`
        const order = myOrders.find(o => o.id === orderId);
        if (!order) {
          toast({
            title: "Error",
            description: "No se encontró el detalle del pedido en el historial.",
            variant: "destructive"
          });
          return;
        }

        const mappedItems = (order.items || []).map(item => ({
          name: item.name || 'Compra en Casa Smoke & Arte',
          variant_name: item.variant_name || null,
          quantity: item.quantity || 1,
          price: item.price || (order.total_amount / (item.quantity || 1))
        }));

        const tempInvoice = {
          invoice_number: `FACT-TEMP-${orderId.slice(0, 8).toUpperCase()}`,
          client_name: profile?.full_name || user?.email?.split('@')[0] || 'Cliente Casa Smoke',
          client_email: user?.email || '',
          client_phone: profile?.phone || '',
          client_address: profile?.address || '',
          items: mappedItems,
          total_amount: order.total_amount,
          created_at: order.created_at
        };

        generateInvoicePDF(tempInvoice);
      }
      
      toast({
        title: "Factura Generada",
        description: "La factura ha sido generada correctamente.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo recuperar la factura de la base de datos.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return;
    playClickSound();
    setIsDeletingAccount(true);
    const { error } = await deleteAccount();
    setIsDeletingAccount(false);
    if (!error) {
      navigate('/', { replace: true });
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Autocomplete suggestions filters
  const filteredCountries = COUNTRIES.filter(c => 
    c.toLowerCase().includes((formData.country || '').toLowerCase()) && 
    (formData.country || '').toLowerCase() !== c.toLowerCase()
  );

  const filteredCities = CITIES.filter(c => 
    c.toLowerCase().includes((formData.city || '').toLowerCase()) && 
    (formData.city || '').toLowerCase() !== c.toLowerCase()
  );

  const filteredAddresses = ADDRESSES.filter(a => 
    a.toLowerCase().includes((formData.address || '').toLowerCase()) && 
    (formData.address || '').toLowerCase() !== a.toLowerCase()
  );

  if (loadingProfile) return <div className="text-[#a7a8c7]">Cargando perfil...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Cuenta</h1>
        <p className="text-[#a7a8c7]">Gestiona tu información personal, privacidad e autorizaciones de la empresa.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 bg-[#111322] p-1 border border-white/10 w-full sm:w-auto flex flex-wrap h-auto">
          <TabsTrigger value="profile" className="flex-grow sm:flex-none" onClick={playClickSound}>
            <User className="mr-2 h-4 w-4" /> Datos Personales
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-grow sm:flex-none relative" onClick={() => { playClickSound(); fetchNotifications(); }}>
            <Bell className="mr-2 h-4 w-4" /> Notificaciones
            {unreadNotifications > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-pink-500 text-white text-[9px] font-bold rounded-full animate-pulse">
                {unreadNotifications}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-grow sm:flex-none" onClick={playClickSound}>
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
                  <img 
                    src={profile?.avatar_url || '/default-avatar.png'} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
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
                  Sube una foto de perfil. Se reflejará en tus comentarios y mensajes de chat.
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
                      placeholder="ej. pedro_smoke"
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

              {/* City & Country Location with strict Autocomplete */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* City field */}
                <div className="space-y-2 relative">
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
                      onChange={(e) => {
                        setFormData({...formData, city: e.target.value});
                        setCitySelected(false);
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => setShowCitySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                      className={cn(
                        "w-full bg-[#050510] border rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all",
                        formData.city && !citySelected ? "border-yellow-500/50" : "border-white/10"
                      )}
                      placeholder="Bogotá, Medellín, etc."
                    />
                  </div>
                  {/* Suggestions dropdown */}
                  {showCitySuggestions && filteredCities.length > 0 && (
                    <div className="absolute z-20 w-full bg-[#0c1322] border border-white/10 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                      {filteredCities.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, city: c});
                            setCitySelected(true);
                            setShowCitySuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#ff2df0]/20 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.city && !citySelected && (
                    <p className="text-[10px] text-yellow-400 ml-1">⚠️ Debes marcar la ciudad de la bandeja para que sea aceptada.</p>
                  )}
                </div>

                {/* Country field */}
                <div className="space-y-2 relative">
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
                      onChange={(e) => {
                        setFormData({...formData, country: e.target.value});
                        setCountrySelected(false);
                        setShowCountrySuggestions(true);
                      }}
                      onFocus={() => setShowCountrySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 200)}
                      className={cn(
                        "w-full bg-[#050510] border rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all",
                        formData.country && !countrySelected ? "border-yellow-500/50" : "border-white/10"
                      )}
                      placeholder="Colombia, México, etc."
                    />
                  </div>
                  {/* Suggestions dropdown */}
                  {showCountrySuggestions && filteredCountries.length > 0 && (
                    <div className="absolute z-20 w-full bg-[#0c1322] border border-white/10 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                      {filteredCountries.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, country: c});
                            setCountrySelected(true);
                            setShowCountrySuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#ff2df0]/20 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.country && !countrySelected && (
                    <p className="text-[10px] text-yellow-400 ml-1">⚠️ Debes marcar el país de la bandeja para que sea aceptado.</p>
                  )}
                </div>

              </div>

              {/* Interests & Shipping Address with strict Autocomplete */}
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

                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-[#a7a8c7] ml-1">Dirección de Despacho (Solo Privado)</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3 text-[#a7a8c7]" size={20} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({...formData, address: e.target.value});
                        setAddressSelected(false);
                        setShowAddressSuggestions(true);
                      }}
                      onFocus={() => setShowAddressSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                      rows={3}
                      className={cn(
                        "w-full bg-[#050510] border rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all resize-none text-xs",
                        formData.address && !addressSelected ? "border-yellow-500/50" : "border-white/10"
                      )}
                      placeholder="Dirección para tus envíos físicos..."
                    />
                  </div>
                  {/* Suggestions dropdown */}
                  {showAddressSuggestions && filteredAddresses.length > 0 && (
                    <div className="absolute z-20 w-full bg-[#0c1322] border border-white/10 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                      {filteredAddresses.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, address: a});
                            setAddressSelected(true);
                            setShowAddressSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#ff2df0]/20 transition-colors"
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  )}
                  {formData.address && !addressSelected && (
                    <p className="text-[10px] text-yellow-400 ml-1">⚠️ Debes marcar una dirección válida de las sugerencias para ser aceptada.</p>
                  )}
                </div>
              </div>

              {/* Data Authorization Checkbox Requirement */}
              <div className="bg-[#050510] border border-pink-500/10 p-5 rounded-2xl flex items-start gap-4">
                <input 
                  type="checkbox"
                  checked={formData.is_data_authorized}
                  onChange={(e) => setFormData({...formData, is_data_authorized: e.target.checked})}
                  className="w-5 h-5 rounded accent-[#ff2df0] cursor-pointer mt-1 flex-shrink-0"
                  required
                />
                <div>
                  <label className="text-sm font-bold text-white block">
                    Autorización de Uso de Datos y Consulta de Historial Crediticio *
                  </label>
                  <span className="text-xs text-[#a7a8c7] block mt-1 leading-relaxed">
                    Autorizo a Casa Smoke & Arte para recopilar, almacenar y tratar mis datos personales con fines de envío de información publicitaria, promociones comerciales, y verificación de historial y comportamiento crediticio en centrales de riesgo con el fin de evaluar y ofrecer cupos de crédito y financiamiento directo en compras de la tienda.
                  </span>
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
                          onClick={() => { playClickSound(); setSelectedProfileId(sender?.id); }}
                          disabled={!sender?.id}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-pink-500/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                        >
                          Ver Perfil
                        </button>
                        <button
                          onClick={() => { playClickSound(); sender?.id && navigate(`/user/chat?dm=${sender.id}`); }}
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
          onClick={() => { playClickSound(); setShowDeleteZone((v) => !v); }}
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
              Esta acción es <strong className="text-white">permanente e irreversible</strong>.
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