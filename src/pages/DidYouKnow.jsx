import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, PlayCircle, Image as ImageIcon, Search, BookOpen, X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const DidYouKnow = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContent();
  }, []);

  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contenidos educativos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url, title, type) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.${type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Descarga iniciada",
        description: "El archivo se está descargando en tu dispositivo.",
      });
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const filteredContent = content.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Sabías Que - Casa Smoke y Arte</title>
        <meta name="description" content="Descubre curiosidades, hechos históricos y videos educativos sobre el mundo del tatuaje y el arte. Descarga contenido gratis." />
      </Helmet>

      <div className="min-h-screen bg-[#050510] pt-16 pb-20">
        {/* Hero Header */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff2df0]/10 to-[#050510] z-0"></div>
          <div className="container mx-auto relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                ¿Sabías <span className="text-[#ff2df0]">Que?</span>
              </h1>
              <p className="text-xl text-[#a7a8c7] mb-8">
                Un espacio dedicado al conocimiento. Aprende sobre la historia, técnicas y curiosidades de nuestra cultura.
                ¡Todo el contenido es gratuito y descargable!
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={20} />
                <input
                  type="text"
                  placeholder="Buscar curiosidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#111322] border border-white/20 rounded-full py-4 pl-12 pr-6 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff2df0]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredContent.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#111322] rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff2df0]/50 transition-all hover:shadow-[0_0_20px_rgba(255,45,240,0.15)] flex flex-col group"
                  >
                    {/* Media Container */}
                    <div className="relative aspect-video bg-black overflow-hidden">
                      {item.media_type === 'video' ? (
                        <video 
                          src={item.media_url} 
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img 
                          src={item.media_url} 
                          alt={item.title} 
                          onClick={() => {
                            playClickSound();
                            setExpandedItem(item);
                          }}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in" 
                        />
                      )}
                      
                      {/* Type Badge */}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 border border-white/10">
                        {item.media_type === 'video' ? <PlayCircle size={14} className="text-[#ff2df0]" /> : <ImageIcon size={14} className="text-[#00e5ff]" />}
                        <span className="uppercase">{item.media_type}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ff2df0] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[#a7a8c7] text-sm mb-6 flex-grow line-clamp-3">
                        {item.description}
                      </p>

                      <div className="flex gap-2">
                        {item.media_type === 'image' && (
                          <Button
                            onClick={() => {
                              playClickSound();
                              setExpandedItem(item);
                            }}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-3 text-xs font-semibold"
                          >
                            Ver detalle
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDownload(item.media_url, item.title, item.media_type)}
                          className="flex-1 bg-[#15162a] hover:bg-[#ff2df0] hover:text-white text-white border border-white/10 hover:border-transparent transition-all flex items-center justify-center gap-2 py-3 rounded-xl"
                        >
                          <Download size={14} />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredContent.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-[#2a2d45] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No se encontró contenido</h3>
              <p className="text-[#a7a8c7]">Intenta con otra búsqueda o regresa más tarde.</p>
            </div>
          )}
        </section>
      </div>

      {/* Lightbox Modal for Curiosities */}
      <AnimatePresence>
        {expandedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-4"
            onClick={() => setExpandedItem(null)}
          >
            <button
              onClick={() => setExpandedItem(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <motion.img
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={expandedItem.media_url}
              alt={expandedItem.title}
              className="max-h-[60vh] max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <div 
              className="mt-6 text-center max-w-2xl px-4 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl md:text-2xl font-bold text-white">
                {expandedItem.title}
              </h3>
              <p className="text-[#a7a8c7] text-sm md:text-base leading-relaxed">
                {expandedItem.description}
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => handleDownload(expandedItem.media_url, expandedItem.title, expandedItem.media_type)}
                  className="bg-[#ff2df0] hover:bg-[#d91cb8] text-white px-6 py-2 rounded-xl transition-all"
                >
                  <Download size={16} className="inline mr-2" /> Descargar Imagen
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DidYouKnow;