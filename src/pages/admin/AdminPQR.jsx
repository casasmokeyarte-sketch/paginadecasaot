import React, { useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { MessageSquare, Mail, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const AdminPQR = () => {
  const { pqr, loading, fetchPqr, updatePqrStatus } = useAdminData();

  useEffect(() => {
    fetchPqr();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'closed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'replied': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">PQR y Mensajes</h1>
        <p className="text-[#a7a8c7]">Peticiones, Quejas, Reclamos y Sugerencias de usuarios.</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-[#a7a8c7]">Cargando mensajes...</p>
        ) : pqr.length === 0 ? (
          <p className="text-[#a7a8c7]">No hay mensajes en el buzón.</p>
        ) : (
          pqr.map((item) => (
            <div key={item.id} className="bg-[#111322] border border-white/5 rounded-xl p-6 transition-all hover:border-white/10">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div>
                   <h3 className="text-xl font-bold text-white mb-1">{item.subject}</h3>
                   <div className="flex items-center gap-4 text-sm text-[#a7a8c7]">
                      <span className="flex items-center gap-1"><Mail size={14} /> {item.email}</span>
                      {item.phone && <span className="flex items-center gap-1"><Phone size={14} /> {item.phone}</span>}
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase ${getStatusColor(item.status)}`}>
                    {item.status || 'open'}
                  </span>
                </div>
              </div>

              <div className="bg-[#050510] p-4 rounded-lg border border-white/5 text-[#d1d5db] mb-4">
                {item.message}
              </div>

              <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                <span className="text-xs text-[#a7a8c7]">
                  Recibido: {new Date(item.created_at).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updatePqrStatus(item.id, 'replied')}
                    className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 text-sm font-medium"
                  >
                    Marcar Respondido
                  </button>
                  <button 
                    onClick={() => updatePqrStatus(item.id, 'closed')}
                    className="px-3 py-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 text-sm font-medium"
                  >
                    Cerrar Caso
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPQR;