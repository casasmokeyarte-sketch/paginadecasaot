import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useSupabaseData = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [stats, setStats] = useState({
    productsCount: 0,
    bookingsCount: 0,
    galleryCount: 0,
  });

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
      setStats((prev) => ({ ...prev, productsCount: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchGallery = async () => {
    try {
      setLoadingGallery(true);
      const { data, error } = await supabase.from('gallery_images').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setGallery(data || []);
      setStats((prev) => ({ ...prev, galleryCount: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoadingGallery(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data || []);
      setStats((prev) => ({ ...prev, bookingsCount: data?.length || 0 }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const addProduct = async (productData) => {
    const { data, error } = await supabase.from('products').insert([productData]).select();
    if (error) {
      toast({ title: 'Error', description: 'No se pudo crear el producto', variant: 'destructive' });
      throw error;
    }
    fetchProducts();
    toast({ title: 'Exito', description: 'Producto creado correctamente' });
    return data;
  };

  const updateProduct = async (id, updates) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el producto', variant: 'destructive' });
      throw error;
    }
    fetchProducts();
    toast({ title: 'Exito', description: 'Producto actualizado' });
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el producto', variant: 'destructive' });
      throw error;
    }
    fetchProducts();
    toast({ title: 'Eliminado', description: 'Producto eliminado correctamente' });
  };

  const addBooking = async (bookingData) => {
    const { data, error } = await supabase.from('bookings').insert([bookingData]).select();
    if (error) throw error;
    return data;
  };

  const updateBookingStatus = async (id, status) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) throw error;
    fetchBookings();
    toast({ title: 'Estado actualizado', description: `La cita ahora esta ${status}` });
  };

  const addGalleryImage = async (imgData) => {
    const { error } = await supabase.from('gallery_images').insert([imgData]);
    if (error) throw error;
    fetchGallery();
    toast({ title: 'Foto subida', description: 'La imagen se ha agregado a la galeria.' });
  };

  const updateGalleryImage = async (id, updates) => {
    const { error } = await supabase.from('gallery_images').update(updates).eq('id', id);
    if (error) throw error;
    fetchGallery();
    toast({ title: 'Imagen actualizada', description: 'La imagen fue actualizada.' });
  };

  const deleteGalleryImage = async (id) => {
    const { error } = await supabase.from('gallery_images').delete().eq('id', id);
    if (error) throw error;
    fetchGallery();
    toast({ title: 'Foto eliminada', description: 'La imagen se ha eliminado.' });
  };

  return {
    products, loadingProducts, fetchProducts, addProduct, updateProduct, deleteProduct,
    gallery, loadingGallery, fetchGallery, addGalleryImage, updateGalleryImage, deleteGalleryImage,
    bookings, loadingBookings, fetchBookings, addBooking, updateBookingStatus,
    stats,
  };
};
