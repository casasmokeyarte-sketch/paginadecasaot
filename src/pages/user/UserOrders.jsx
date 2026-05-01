import React from 'react';
import { useUserPanel } from '@/hooks/useUserPanel';
import { ShoppingBag, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserOrders = () => {
  const { myOrders, loadingOrders } = useUserPanel();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mis Pedidos</h1>
        <p className="text-[#a7a8c7]">Historial de compras en la tienda.</p>
      </div>

      <div className="space-y-4">
        {loadingOrders ? (
          <p className="text-[#a7a8c7]">Cargando pedidos...</p>
        ) : myOrders.length === 0 ? (
          <div className="text-center py-20 bg-[#111322] border border-white/10 rounded-2xl">
            <ShoppingBag className="mx-auto h-16 w-16 text-[#2a2d45] mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">Aún no has comprado nada</h3>
            <p className="text-[#a7a8c7] mb-6">Explora nuestra tienda de productos exclusivos.</p>
            <Link to="/store">
              <button className="bg-[#ff2df0] text-white px-6 py-3 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(255,45,240,0.4)] transition-all">
                Ir a la Tienda
              </button>
            </Link>
          </div>
        ) : (
          myOrders.map((order) => (
            <div key={order.id} className="bg-[#111322] border border-white/10 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <p className="text-[#a7a8c7] text-xs uppercase tracking-wider mb-1">Pedido #{order.id.slice(0, 8)}</p>
                    <p className="text-white font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                 </div>
                 <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-bold text-white uppercase">
                    {order.status}
                 </div>
              </div>
              <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-[#a7a8c7] text-sm">
                    <Package size={16} /> {order.items ? order.items.length : 0} Productos
                 </div>
                 <p className="text-[#00e5ff] font-bold text-lg">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.total_amount)}
                 </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserOrders;