import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const USER_PANEL_PROFILE_SELECT = 'id, full_name, avatar_url, phone, address, role, updated_at';

export const useUserPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [myBookings, setMyBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  const [myPqrs, setMyPqrs] = useState([]);
  const [loadingPqrs, setLoadingPqrs] = useState(true);

  // Fetch Profile
  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoadingProfile(true);
      const { data: rows, error } = await supabase
        .from('profiles')
        .select(USER_PANEL_PROFILE_SELECT)
        .eq('id', user.id)
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }
      
      setProfile(rows?.[0] || { full_name: '', phone: '', address: '' });
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Update Profile
  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          updated_at: new Date(),
          ...updates,
        });

      if (error) throw error;
      
      toast({ title: 'Perfil actualizado', description: 'Tus datos se han guardado correctamente.' });
      fetchProfile();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el perfil.', variant: 'destructive' });
      console.error(error);
    }
  };

  // Fetch User Bookings
  const fetchMyBookings = async () => {
    if (!user) return;
    try {
      setLoadingBookings(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false });

      if (error) throw error;
      setMyBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Cancel/Update Booking
  const cancelBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({ title: 'Cita cancelada', description: 'La cita ha sido cancelada exitosamente.' });
      fetchMyBookings();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cancelar la cita.', variant: 'destructive' });
    }
  };

  // Fetch Orders
  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Wishlist
  const fetchWishlist = async () => {
    if (!user) return;
    try {
      setLoadingWishlist(true);
      // Join with products table
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          created_at,
          product:products (
            id,
            name,
            price,
            image,
            category
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setWishlist(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const removeFromWishlist = async (wishlistId) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);
      
      if (error) throw error;
      toast({ title: 'Eliminado', description: 'Producto eliminado de tu lista de deseos.' });
      fetchWishlist();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  // Fetch PQR
  const fetchPqrs = async () => {
    if (!user) return;
    try {
      setLoadingPqrs(true);
      const { data, error } = await supabase
        .from('pqr')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPqrs(data || []);
    } catch (error) {
      console.error('Error fetching PQR:', error);
    } finally {
      setLoadingPqrs(false);
    }
  };

  const submitPqr = async (subject, message) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('pqr')
        .insert([{
          user_id: user.id,
          subject,
          message,
          status: 'pending'
        }]);

      if (error) throw error;
      toast({ title: 'PQR Enviado', description: 'Tu solicitud ha sido registrada.' });
      fetchPqrs();
      return true;
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo enviar el PQR.', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMyBookings();
      fetchMyOrders();
      fetchWishlist();
      fetchPqrs();
    }
  }, [user]);

  return {
    profile,
    loadingProfile,
    updateProfile,
    myBookings,
    loadingBookings,
    cancelBooking,
    myOrders,
    loadingOrders,
    wishlist,
    loadingWishlist,
    removeFromWishlist,
    myPqrs,
    loadingPqrs,
    submitPqr,
    fetchMyBookings, 
    fetchMyOrders
  };
};
