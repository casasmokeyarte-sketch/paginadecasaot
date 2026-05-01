import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Trash2, Plus, PencilLine, Save, X } from 'lucide-react';
import { uploadFileToBucket } from '@/lib/storageUpload';
import MediaPicker from '@/components/admin/MediaPicker';

const CATEGORIES = ['place', 'products', 'tattoo', 'art', 'brand', 'community'];

const AdminGallery = () => {
  const { gallery, loadingGallery, fetchGallery, addGalleryImage, updateGalleryImage, deleteGalleryImage } = useSupabaseData();
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCategory, setNewImageCategory] = useState('place');
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingImageId, setEditingImageId] = useState(null);
  const [editingForm, setEditingForm] = useState({ src: '', alt: '', category: 'place' });
  const [editingFile, setEditingFile] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const resetInputs = () => {
    setNewImageUrl('');
    setImageFile(null);
  };

  const startEdit = (image) => {
    setEditingImageId(image.id);
    setEditingFile(null);
    setEditingForm({
      src: image.src || '',
      alt: image.alt || '',
      category: image.category || 'place',
    });
  };

  const cancelEdit = () => {
    setEditingImageId(null);
    setEditingFile(null);
    setEditingForm({ src: '', alt: '', category: 'place' });
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    try {
      setUploadingImage(true);
      let finalUrl = newImageUrl;

      if (imageFile) {
        finalUrl = await uploadFileToBucket({
          file: imageFile,
          bucket: 'gallery-images',
          folder: 'gallery',
        });
      }

      if (!finalUrl) {
        window.alert('Debes enviar URL o subir una imagen desde tu PC.');
        return;
      }

      await addGalleryImage({
        src: finalUrl,
        alt: 'Admin Upload',
        category: newImageCategory,
      });

      resetInputs();
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'No se pudo subir la imagen de galeria.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveImage = async (imageId) => {
    try {
      setUploadingImage(true);
      let finalUrl = editingForm.src;

      if (editingFile) {
        finalUrl = await uploadFileToBucket({
          file: editingFile,
          bucket: 'gallery-images',
          folder: 'gallery',
        });
      }

      await updateGalleryImage(imageId, {
        src: finalUrl,
        alt: editingForm.alt || 'Admin Upload',
        category: editingForm.category,
      });

      cancelEdit();
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'No se pudo actualizar la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Galeria</h1>
        <p className="text-[#a7a8c7]">Gestiona las imagenes mostradas en la web.</p>
      </div>

      <div className="bg-[#111322] border border-white/5 rounded-2xl p-6 mb-8">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Plus size={18} /> Agregar Imagen</h3>
        <form onSubmit={handleAddImage} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className="flex-1 bg-[#050510] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#ff2df0] outline-none"
            />
            <select
              value={newImageCategory}
              onChange={(e) => setNewImageCategory(e.target.value)}
              className="bg-[#050510] border border-white/10 rounded-xl px-4 py-2 text-white focus:border-[#ff2df0] outline-none"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <MediaPicker
            label="Imagen para galeria"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            file={imageFile}
            onChange={setImageFile}
            previewUrl={!imageFile ? newImageUrl : ''}
            helperText="Usa Adjuntar para escoger una foto desde tu equipo o pega una URL directa."
            type="image"
          />

          <button
            type="submit"
            disabled={uploadingImage || (!newImageUrl && !imageFile)}
            className="bg-[#ff2df0] hover:bg-[#d91cb8] text-white px-6 py-2 rounded-xl font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadingImage ? 'Subiendo...' : 'Agregar'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loadingGallery ? (
          <p className="text-[#a7a8c7] col-span-full text-center py-10">Cargando imagenes...</p>
        ) : gallery.map((img) => (
          <div key={img.id} className="relative overflow-hidden rounded-xl border border-white/5 bg-black/20">
            {editingImageId === img.id ? (
              <div className="space-y-3 p-4">
                <input
                  type="url"
                  value={editingForm.src}
                  onChange={(e) => setEditingForm((current) => ({ ...current, src: e.target.value }))}
                  placeholder="URL de la imagen"
                  className="w-full rounded-lg border border-white/10 bg-[#050510] px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  type="text"
                  value={editingForm.alt}
                  onChange={(e) => setEditingForm((current) => ({ ...current, alt: e.target.value }))}
                  placeholder="Texto alternativo"
                  className="w-full rounded-lg border border-white/10 bg-[#050510] px-3 py-2 text-sm text-white outline-none"
                />
                <select
                  value={editingForm.category}
                  onChange={(e) => setEditingForm((current) => ({ ...current, category: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-[#050510] px-3 py-2 text-sm text-white outline-none"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <MediaPicker
                  label="Reemplazar imagen"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  file={editingFile}
                  onChange={setEditingFile}
                  previewUrl={!editingFile ? editingForm.src : ''}
                  type="image"
                />
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSaveImage(img.id)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white">
                    <Save size={14} /> Guardar
                  </button>
                  <button onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#a7a8c7]">
                    <X size={14} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="aspect-square">
                  <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity hover:opacity-100">
                  <button onClick={() => startEdit(img)} className="p-3 rounded-full bg-cyan-500 text-white hover:bg-cyan-600">
                    <PencilLine size={18} />
                  </button>
                  <button onClick={() => deleteGalleryImage(img.id)} className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  {img.category}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGallery;
