import React from 'react';
import { useUserPanel } from '@/hooks/useUserPanel';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/use-toast';

const UserWishlist = () => {
  const { wishlist, loadingWishlist, removeFromWishlist } = useUserPanel();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product) => {
    // Basic add to cart for wishlist items - assumes default variant/single item for simplicity in this view
    // In a full app, you might want to redirect to product detail to choose options
    toast({
        title: "Nota",
        description: "Por favor visita la página del producto para seleccionar opciones.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Lista de Deseos</h1>
        <p className="text-[#a7a8c7]">Tus productos favoritos guardados para después.</p>
      </div>

      <div className="space-y-4">
        {loadingWishlist ? (
          <p className="text-[#a7a8c7]">Cargando tus deseos...</p>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-20 bg-[#111322] border border-white/10 rounded-2xl">
            <Heart className="mx-auto h-16 w-16 text-[#2a2d45] mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">Tu lista está vacía</h3>
            <p className="text-[#a7a8c7] mb-6">Guarda lo que amas para no perderlo de vista.</p>
            <Link to="/store">
              <button className="bg-[#ff2df0] text-white px-6 py-3 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(255,45,240,0.4)] transition-all">
                Explorar Tienda
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="bg-[#111322] border border-white/10 rounded-xl overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-[#050510]">
                    {item.product?.image && (
                        <img 
                            src={item.product.image} 
                            alt={item.product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                    )}
                    <button 
                        onClick={() => removeFromWishlist(item.id)}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                <div className="p-4">
                    <p className="text-[#a7a8c7] text-xs uppercase font-bold mb-1">{item.product?.category}</p>
                    <h3 className="text-white font-bold text-lg mb-2 truncate">{item.product?.name}</h3>
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-[#00e5ff] font-bold">
                             {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.product?.price || 0)}
                        </span>
                        <Link to={`/product/${item.product?.id}`}>
                             <button className="p-2 bg-white/10 text-white rounded-lg hover:bg-[#ff2df0] transition-colors">
                                 <ShoppingCart size={18} />
                             </button>
                        </Link>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWishlist;