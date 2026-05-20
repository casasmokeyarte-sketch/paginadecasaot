import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage as ImageIcon, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { galleryImages } from '@/data/galleryImages';

const FALLBACK_PHOTO_IMAGE = 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=1200';

const Photos = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const { toast } = useToast();
  const fileInputRef = React.useRef(null);
  
  const { gallery, loadingGallery, fetchGallery, addGalleryImage } = useSupabaseData();

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
         toast({
          title: "Archivo muy grande",
          description: "Por favor selecciona una imagen menor a 5MB.",
          variant: "destructive"
        });
        return;
      }

      // In a real app we upload to storage bucket, here we just preview or pretend
      // For this demo, we'll assume the URL is created locally for now as we don't have bucket setup code
      const imageUrl = URL.createObjectURL(file);
      
      try {
        await addGalleryImage({
           src: imageUrl, // In production this would be a Supabase Storage URL
           alt: "Foto de la comunidad",
           category: "community"
        });
        toast({
            title: "¡Foto subida!",
            description: "Tu foto se ha agregado a la galería.",
        });
      } catch (e) {
         console.error(e);
      }
    }
  };

  const categories = ['todos', 'place', 'products', 'tattoo', 'art', 'brand', 'community'];
  const [activeFilter, setActiveFilter] = useState('todos');
  const baseGallery = gallery?.length ? gallery : galleryImages;

  const filteredImages = baseGallery ? (activeFilter === 'todos' 
    ? baseGallery 
    : baseGallery.filter(img => img.category === activeFilter)) : [];

  return (
    <>
      <Helmet>
        <title>Galería de Fotos - Casa Smoke y Arte</title>
        <meta name="description" content="Explora nuestra galería de fotos: tatuajes, productos, eventos y el ambiente único de nuestra tienda." />
      </Helmet>

      <div className="min-h-screen bg-[#050510] pt-32 pb-20 px-4">
        <div className="container mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-[#f5f5f5] mb-4">
                Galería <span className="text-[#00e5ff]">Visual</span>
              </h1>
              <p className="text-[#a7a8c7] max-w-xl">
                Nuestra comunidad en imágenes. Sube tus propias fotos o explora el universo de Casa Smoke y Arte.
              </p>
            </div>

            <div className="flex gap-4">
               <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
               />
               <Button 
                  onClick={() => fileInputRef.current.click()}
                  className="bg-[#ff2df0] hover:bg-[#d91cb8] text-white font-bold px-6 py-6 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(255,45,240,0.3)] transition-all hover:scale-105"
               >
                  <Upload size={20} />
                  Subir Foto
               </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                  activeFilter === cat 
                    ? 'bg-white text-[#050510]' 
                    : 'bg-[#15162a] text-[#a7a8c7] hover:bg-[#1f213a]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {loadingGallery ? (
                <div className="text-[#a7a8c7] py-10">Cargando fotos...</div>
            ) : (
                <AnimatePresence>
                {filteredImages.map((image, index) => (
                    <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    key={image.id || index}
                    className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-zoom-in"
                    onClick={() => setSelectedImage(image)}
                    >
                    <img 
                        src={image.src} 
                        alt={image.alt} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_PHOTO_IMAGE;
                        }}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <ZoomIn className="text-white w-10 h-10 drop-shadow-lg" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-xs font-medium">{image.alt}</p>
                    </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            )}
          </div>

          {!loadingGallery && filteredImages.length === 0 && (
             <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <ImageIcon className="mx-auto h-16 w-16 text-[#2a2d45] mb-4" />
                <p className="text-[#a7a8c7]">No hay fotos en esta categoría aún.</p>
             </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X size={40} />
            </button>
            
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={selectedImage.src}
              alt={selectedImage.alt}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_PHOTO_IMAGE;
              }}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Photos;