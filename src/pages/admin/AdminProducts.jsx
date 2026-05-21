import React, { useState, useEffect } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { Plus, Pencil, Trash2, X, Save, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFileToBucket } from '@/lib/storageUpload';
import MediaPicker from '@/components/admin/MediaPicker';

const AdminProducts = () => {
  const { products, loadingProducts, fetchProducts, addProduct, deleteProduct, updateProduct } = useSupabaseData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    image: '',
    description: '',
    stock: 0,
    sku: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setEditingProduct(null);
    setImageFile(null);
    setFormData({ name: '', category: '', price: '', image: '', description: '', stock: 0, sku: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUploadingImage(true);

      let payload = { ...formData };
      if (imageFile) {
        const uploadedUrl = await uploadFileToBucket({
          file: imageFile,
          bucket: 'product-images',
          folder: 'products'
        });
        payload.image = uploadedUrl;
      }

      if (!payload.image) {
        window.alert('Debes cargar una imagen por URL o archivo.');
        return;
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await addProduct(payload);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'No se pudo guardar el producto.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setImageFile(null);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      description: product.description || '',
      stock: product.stock ?? 0,
      sku: product.sku || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Estas seguro de eliminar este producto?')) {
      await deleteProduct(id);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Productos</h1>
          <p className="text-[#a7a8c7]">Gestiona el catalogo de tu tienda.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-[#ff2df0] hover:bg-[#d91cb8] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a7a8c7]" size={18} />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 bg-[#111322] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-[#ff2df0]"
        />
      </div>

      <div className="bg-[#111322] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[#a7a8c7] text-sm font-medium">
              <tr>
                <th className="p-4">Imagen</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Precio</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingProducts ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#a7a8c7]">Cargando productos...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#a7a8c7]">No se encontraron productos.</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-black/20" />
                    </td>
                    <td className="p-4 font-medium text-white">{product.name}</td>
                    <td className="p-4 text-[#a7a8c7]">{product.category}</td>
                    <td className="p-4 text-[#00e5ff] font-bold">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(product.price)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        (product.stock ?? 0) === 0 ? 'bg-red-500/20 text-red-400' :
                        (product.stock ?? 0) < 5  ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-green-500/20 text-green-400'
                      }`}>
                        {product.stock ?? 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111322] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#a7a8c7] hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white focus:border-[#ff2df0] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#a7a8c7] mb-1">Categoria</label>
                    <input
                      type="text"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white focus:border-[#ff2df0] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#a7a8c7] mb-1">Precio</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white focus:border-[#ff2df0] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#a7a8c7] mb-1">Stock (unidades)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white focus:border-[#ff2df0] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#a7a8c7] mb-1">SKU (opcional)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="Ej: CSA-001"
                      className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white focus:border-[#ff2df0] outline-none placeholder:text-[#a7a8c7]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">URL de imagen (opcional)</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white focus:border-[#ff2df0] outline-none"
                  />
                </div>

                <MediaPicker
                  label="Imagen del producto"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  file={imageFile}
                  onChange={setImageFile}
                  previewUrl={!imageFile ? formData.image : ''}
                  helperText="Puedes pegar una URL o usar el boton Adjuntar para cargar la imagen desde tu equipo."
                  type="image"
                />

                <div>
                  <label className="block text-sm text-[#a7a8c7] mb-1">Descripcion (opcional)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#050510] border border-white/10 rounded-lg p-2 text-white focus:border-[#ff2df0] outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingImage || (!formData.image && !imageFile)}
                  className="w-full bg-[#ff2df0] hover:bg-[#d91cb8] text-white py-3 rounded-lg font-bold mt-4 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save size={18} /> {uploadingImage ? 'Subiendo imagen...' : 'Guardar Producto'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
