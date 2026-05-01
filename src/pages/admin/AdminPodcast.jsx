import React, { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Mic, BookOpen, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { uploadFileToBucket } from '@/lib/storageUpload';
import MediaPicker from '@/components/admin/MediaPicker';

const AdminPodcast = () => {
  const { episodes, stories, loading, fetchPodcastData, addEpisode, deleteEpisode } = useAdminData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [newEpisode, setNewEpisode] = useState({
    title: '',
    description: '',
    duration: '',
    audio_url: '',
    is_featured: false
  });

  useEffect(() => {
    fetchPodcastData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploadingMedia(true);

      let payload = { ...newEpisode };
      if (mediaFile) {
        const uploadedUrl = await uploadFileToBucket({
          file: mediaFile,
          bucket: 'podcast-media',
          folder: 'episodes'
        });
        payload.audio_url = uploadedUrl;
      }

      if (!payload.audio_url) {
        window.alert('Debes cargar un audio/video por URL o archivo.');
        return;
      }

      await addEpisode({
        ...payload,
        published_at: new Date()
      });

      setIsModalOpen(false);
      setMediaFile(null);
      setNewEpisode({ title: '', description: '', duration: '', audio_url: '', is_featured: false });
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'No se pudo publicar el episodio.');
    } finally {
      setUploadingMedia(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">OT Te Escucha</h1>
        <p className="text-[#a7a8c7]">Gestiona episodios del podcast e historias de usuarios.</p>
      </div>

      <Tabs defaultValue="episodes" className="w-full">
        <TabsList className="bg-[#111322] border border-white/10 p-1 mb-6">
          <TabsTrigger value="episodes" className="data-[state=active]:bg-[#ff2df0] data-[state=active]:text-white">Episodios</TabsTrigger>
          <TabsTrigger value="stories" className="data-[state=active]:bg-[#00e5ff] data-[state=active]:text-[#050510]">Historias de Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="episodes" className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#ff2df0] hover:bg-[#d91cb8] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
            >
              <Plus size={18} /> Nuevo Episodio
            </button>
          </div>

          <div className="grid gap-4">
            {episodes.map((ep) => (
              <div key={ep.id} className="bg-[#111322] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-12 h-12 rounded-full bg-[#ff2df0]/20 flex items-center justify-center text-[#ff2df0]">
                  <Mic size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{ep.title}</h3>
                  <p className="text-[#a7a8c7] text-sm">{ep.description}</p>
                  <p className="text-xs text-[#a7a8c7] mt-2 font-mono">
                    Duracion: {ep.duration} | Publicado: {new Date(ep.published_at).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => deleteEpisode(ep.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <div key={story.id} className="bg-[#111322] border border-white/5 p-6 rounded-xl relative">
                <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded uppercase ${
                  story.mood === 'sad' ? 'bg-blue-500/20 text-blue-400' :
                  story.mood === 'happy' ? 'bg-yellow-500/20 text-yellow-400' :
                  story.mood === 'angry' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {story.mood}
                </div>
                <h4 className="text-white font-bold mb-4 flex items-center gap-2"><BookOpen size={16} /> Historia Anonima</h4>
                <div className="bg-[#050510] p-4 rounded-lg border border-white/5 text-[#a7a8c7] text-sm italic mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                  "{story.content}"
                </div>
                <p className="text-xs text-[#a7a8c7] text-right">
                  {new Date(story.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111322] border border-white/10 rounded-2xl w-full max-w-lg p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Nuevo Episodio</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#a7a8c7] hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">Titulo</label>
                  <input required type="text" value={newEpisode.title} onChange={(e) => setNewEpisode({ ...newEpisode, title: e.target.value })} className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">Duracion (ej. 15:30)</label>
                  <input required type="text" value={newEpisode.duration} onChange={(e) => setNewEpisode({ ...newEpisode, duration: e.target.value })} className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">URL de audio/video (opcional)</label>
                  <input type="url" value={newEpisode.audio_url} onChange={(e) => setNewEpisode({ ...newEpisode, audio_url: e.target.value })} className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white" />
                </div>
                <MediaPicker
                  label="Adjuntar audio o video del episodio"
                  accept="audio/*,video/*"
                  file={mediaFile}
                  onChange={setMediaFile}
                  previewUrl={!mediaFile ? newEpisode.audio_url : ''}
                  helperText="Soporta archivos locales o un enlace directo al episodio."
                  type="audio"
                />
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">Descripcion</label>
                  <textarea required rows={3} value={newEpisode.description} onChange={(e) => setNewEpisode({ ...newEpisode, description: e.target.value })} className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white" />
                </div>
                <button disabled={uploadingMedia || (!newEpisode.audio_url && !mediaFile)} type="submit" className="w-full bg-[#ff2df0] text-white font-bold py-3 rounded-lg hover:bg-[#d91cb8] disabled:opacity-60 disabled:cursor-not-allowed">
                  {uploadingMedia ? 'Subiendo...' : 'Publicar Episodio'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPodcast;
