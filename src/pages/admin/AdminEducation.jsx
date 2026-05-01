import React, { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Plus, Trash2, Video, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileToBucket } from '@/lib/storageUpload';
import MediaPicker from '@/components/admin/MediaPicker';

const AdminEducation = () => {
  const { education, loading, fetchEducation, addEducation, deleteEducation } = useAdminData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    media_type: 'image',
    media_url: ''
  });

  useEffect(() => {
    fetchEducation();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUploadingMedia(true);

      let payload = { ...newItem };
      if (mediaFile) {
        const uploadedUrl = await uploadFileToBucket({
          file: mediaFile,
          bucket: 'education-media',
          folder: payload.media_type === 'video' ? 'videos' : 'images'
        });
        payload.media_url = uploadedUrl;
      }

      if (!payload.media_url) {
        window.alert('Debes cargar un media por URL o archivo.');
        return;
      }

      await addEducation({
        ...payload,
        created_at: new Date()
      });

      setIsModalOpen(false);
      setMediaFile(null);
      setNewItem({ title: '', description: '', media_type: 'image', media_url: '' });
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'No se pudo guardar el contenido.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Eliminar este contenido?')) {
      deleteEducation(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Educacion y Curiosidades</h1>
          <p className="text-[#a7a8c7]">Gestiona la seccion "Sabias Que".</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00e5ff] hover:bg-[#00b8cc] text-[#050510] px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Nuevo Dato
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-[#a7a8c7] col-span-full text-center">Cargando contenido...</p>
        ) : education.length === 0 ? (
          <p className="text-[#a7a8c7] col-span-full text-center">No hay contenido educativo aun.</p>
        ) : (
          education.map((item) => (
            <div key={item.id} className="bg-[#111322] border border-white/5 rounded-xl overflow-hidden group hover:border-[#00e5ff]/30 transition-all">
              <div className="aspect-video bg-black/40 relative">
                {item.media_type === 'video' ? (
                  <video src={item.media_url} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white uppercase font-bold">
                  {item.media_type === 'video' ? <Video size={12} className="inline mr-1" /> : <ImageIcon size={12} className="inline mr-1" />}
                  {item.media_type}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-[#a7a8c7] text-sm line-clamp-3 mb-4">{item.description}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-full py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
                <h2 className="text-xl font-bold text-white">Nuevo "Sabias Que"</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-[#a7a8c7] hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">Titulo</label>
                  <input required type="text" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">Tipo de media</label>
                  <select value={newItem.media_type} onChange={(e) => setNewItem({ ...newItem, media_type: e.target.value })} className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white">
                    <option value="image">Imagen</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">URL del media (opcional)</label>
                  <input type="url" value={newItem.media_url} onChange={(e) => setNewItem({ ...newItem, media_url: e.target.value })} className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white" />
                </div>
                <MediaPicker
                  label={newItem.media_type === 'video' ? 'Adjuntar video' : 'Adjuntar imagen'}
                  accept={newItem.media_type === 'video' ? 'video/*' : 'image/*'}
                  file={mediaFile}
                  onChange={setMediaFile}
                  previewUrl={!mediaFile ? newItem.media_url : ''}
                  helperText="Puedes usar un enlace directo o cargar el archivo localmente."
                  type={newItem.media_type}
                />
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">Descripcion</label>
                  <textarea required rows={3} value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white" />
                </div>
                <button disabled={uploadingMedia || (!newItem.media_url && !mediaFile)} type="submit" className="w-full bg-[#00e5ff] text-[#050510] font-bold py-3 rounded-lg hover:bg-[#00b8cc] disabled:opacity-60 disabled:cursor-not-allowed">
                  {uploadingMedia ? 'Subiendo...' : 'Guardar'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminEducation;
