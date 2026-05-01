import React, { useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Package, DollarSign, Clock, CheckCircle, Truck } from 'lucide-react';

const AdminOrders = () => {
  const { orders, loading, fetchOrders, updateOrderStatus } = useAdminData();

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'paid': return 'text-blue-400 bg-blue-400/10';
      case 'shipped': return 'text-purple-400 bg-purple-400/10';
      case 'delivered': return 'text-green-400 bg-green-400/10';
      default: return 'text-white bg-white/10';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Órdenes de Compra</h1>
        <p className="text-[#a7a8c7]">Gestión de pedidos de la tienda online.</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-[#a7a8c7]">Cargando órdenes...</p>
        ) : orders.length === 0 ? (
          <p className="text-[#a7a8c7]">No hay órdenes registradas.</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-[#111322] border border-white/5 rounded-xl p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Package className="text-[#ff2df0]" size={20} /> 
                    Orden #{order.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-sm text-[#a7a8c7] mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                    {order.status || 'pending'}
                  </span>
                  <p className="text-xl font-bold text-[#00e5ff]">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(order.total_amount)}
                  </p>
                </div>
              </div>

              <div className="bg-[#050510] rounded-lg p-4 mb-6">
                <h4 className="text-sm font-bold text-[#a7a8c7] mb-3 uppercase tracking-wider">Items del Pedido</h4>
                <div className="space-y-2">
                  {/* Assuming order.items is a JSON array */}
                  {Array.isArray(order.items) ? order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-white">{item.name} x {item.quantity}</span>
                      <span className="text-[#a7a8c7]">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.price)}
                      </span>
                    </div>
                  )) : (
                    <p className="text-sm text-[#a7a8c7]">Detalles no disponibles en formato estándar.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => updateOrderStatus(order.id, 'paid')}
                  className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-sm font-bold flex items-center gap-2"
                >
                  <DollarSign size={16} /> Marcar Pagado
                </button>
                <button 
                  onClick={() => updateOrderStatus(order.id, 'shipped')}
                  className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-sm font-bold flex items-center gap-2"
                >
                  <Truck size={16} /> Marcar Enviado
                </button>
                <button 
                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                  className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-bold flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Marcar Entregado
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminOrders;