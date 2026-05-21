import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useAdminData = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [education, setEducation] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [stories, setStories] = useState([]);
  const [pqr, setPqr] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [stats, setStats] = useState({
    usersCount: 0,
    educationCount: 0,
    podcastCount: 0,
    storiesCount: 0,
    pqrCount: 0,
    ordersCount: 0,
    productsCount: 0,
    bookingsCount: 0,
  });

  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: educationCount },
        { count: podcastCount },
        { count: storiesCount },
        { count: pqrCount },
        { count: ordersCount },
        { count: productsCount },
        { count: bookingsCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('educational_content').select('*', { count: 'exact', head: true }),
        supabase.from('podcast_episodes').select('*', { count: 'exact', head: true }),
        supabase.from('user_stories').select('*', { count: 'exact', head: true }),
        supabase.from('pqr').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        usersCount: usersCount || 0,
        educationCount: educationCount || 0,
        podcastCount: podcastCount || 0,
        storiesCount: storiesCount || 0,
        pqrCount: pqrCount || 0,
        ordersCount: ordersCount || 0,
        productsCount: productsCount || 0,
        bookingsCount: bookingsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los usuarios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (id, payload) => {
    try {
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      );
      const { error } = await supabase.from('profiles').update(cleanPayload).eq('id', id);
      if (error) throw error;
      toast({ title: 'Perfil actualizado', description: 'Los datos del usuario fueron guardados.' });
      await fetchUsers();
      return { error: null };
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el perfil', variant: 'destructive' });
      return { error };
    }
  };

  const fetchEducation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('educational_content').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setEducation(data || []);
    } catch {
      toast({ title: 'Error', description: 'Error al cargar contenido educativo', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addEducation = async (content) => {
    try {
      const { error } = await supabase.from('educational_content').insert([content]);
      if (error) throw error;
      toast({ title: 'Exito', description: 'Contenido agregado correctamente' });
      fetchEducation();
    } catch {
      toast({ title: 'Error', description: 'No se pudo agregar el contenido', variant: 'destructive' });
    }
  };

  const deleteEducation = async (id) => {
    try {
      const { error } = await supabase.from('educational_content').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Exito', description: 'Contenido eliminado' });
      fetchEducation();
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const fetchPodcastData = async () => {
    setLoading(true);
    try {
      const { data: episodesData } = await supabase.from('podcast_episodes').select('*').order('published_at', { ascending: false });
      const { data: storiesData } = await supabase.from('user_stories').select('*').order('created_at', { ascending: false });
      setEpisodes(episodesData || []);
      setStories(storiesData || []);
    } catch {
      toast({ title: 'Error', description: 'Error cargando datos del podcast', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addEpisode = async (episode) => {
    try {
      const { error } = await supabase.from('podcast_episodes').insert([episode]);
      if (error) throw error;
      toast({ title: 'Exito', description: 'Episodio publicado' });
      fetchPodcastData();
    } catch {
      toast({ title: 'Error', description: 'Error al publicar episodio', variant: 'destructive' });
    }
  };

  const deleteEpisode = async (id) => {
    try {
      const { error } = await supabase.from('podcast_episodes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Exito', description: 'Episodio eliminado' });
      fetchPodcastData();
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  const fetchPqr = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('pqr').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPqr(data || []);
    } catch {
      toast({ title: 'Error', description: 'Error cargando PQRs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updatePqrStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('pqr').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Actualizado', description: `Estado cambiado a ${status}` });
      fetchPqr();
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch {
      toast({ title: 'Error', description: 'Error cargando ordenes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Orden actualizada', description: `Estado: ${status}` });
      fetchOrders();
      return { error: null };
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la orden', variant: 'destructive' });
      return { error };
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch {
      toast({ title: 'Error', description: 'Error cargando citas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Cita actualizada', description: `Estado: ${status}` });
      fetchBookings();
      return { error: null };
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la cita', variant: 'destructive' });
      return { error };
    }
  };

  // ── Billing / Invoices ───────────────────────────────────────────────────────
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las facturas', variant: 'destructive' });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const createInvoice = async (invoiceData) => {
    try {
      // Generate invoice number via DB function or fallback
      let invoiceNumber;
      const { data: fnData, error: fnError } = await supabase.rpc('generate_invoice_number');
      if (fnError || !fnData) {
        const year = new Date().getFullYear();
        invoiceNumber = `FACT-${year}-${String((invoices.length || 0) + 1).padStart(4, '0')}`;
      } else {
        invoiceNumber = fnData;
      }

      const { data, error } = await supabase
        .from('invoices')
        .insert([{ ...invoiceData, invoice_number: invoiceNumber }])
        .select()
        .single();
      if (error) throw error;
      toast({ title: '¡Factura emitida!', description: `Número: ${invoiceNumber}` });
      fetchInvoices();
      return data;
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear la factura', variant: 'destructive' });
      throw error;
    }
  };

  const updateInvoiceStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Factura actualizada', description: `Estado: ${status}` });
      fetchInvoices();
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar la factura', variant: 'destructive' });
    }
  };

  return {
    loading,
    stats,
    users,
    education,
    episodes,
    stories,
    pqr,
    orders,
    bookings,
    invoices,
    loadingInvoices,
    fetchStats,
    fetchUsers,
    updateUserProfile,
    fetchEducation,
    addEducation,
    deleteEducation,
    fetchPodcastData,
    addEpisode,
    deleteEpisode,
    fetchPqr,
    updatePqrStatus,
    fetchOrders,
    updateOrderStatus,
    fetchBookings,
    updateBookingStatus,
    fetchInvoices,
    createInvoice,
    updateInvoiceStatus,
  };
};
