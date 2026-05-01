import React, { useState } from 'react';
import { useUserPanel } from '@/hooks/useUserPanel';
import { MessageSquare as MessageSquareWarning, Send, AlertTriangle, CheckCircle } from 'lucide-react';

const UserPQR = () => {
  const { myPqrs, loadingPqrs, submitPqr } = useUserPanel();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await submitPqr(subject, message);
    setIsSubmitting(false);
    if (success) {
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       {/* New PQR Form */}
       <div className="lg:col-span-1">
          <div className="sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-6">Radicar PQR</h2>
              <div className="bg-[#111322] border border-white/10 rounded-2xl p-6">
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-[#a7a8c7] mb-1 block">Asunto</label>
                        <select 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            required
                            className="w-full bg-[#050510] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff2df0] outline-none"
                        >
                            <option value="">Selecciona un tipo</option>
                            <option value="Petición">Petición</option>
                            <option value="Queja">Queja</option>
                            <option value="Reclamo">Reclamo</option>
                            <option value="Sugerencia">Sugerencia</option>
                            <option value="Felicitación">Felicitación</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-[#a7a8c7] mb-1 block">Mensaje</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows={5}
                            className="w-full bg-[#050510] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ff2df0] outline-none resize-none"
                            placeholder="Describe detalladamente tu solicitud..."
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#ff2df0] text-white font-bold py-3 rounded-xl hover:bg-[#d91cb8] transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'} <Send size={18} />
                    </button>
                 </form>
              </div>
          </div>
       </div>

       {/* History List */}
       <div className="lg:col-span-2 space-y-6">
           <div>
               <h2 className="text-2xl font-bold text-white mb-2">Historial de Solicitudes</h2>
               <p className="text-[#a7a8c7]">Seguimiento a tus PQRs anteriores.</p>
           </div>

           {loadingPqrs ? (
               <p className="text-[#a7a8c7]">Cargando historial...</p>
           ) : myPqrs.length === 0 ? (
               <div className="text-center py-12 bg-[#111322] border border-white/10 rounded-2xl">
                   <MessageSquareWarning className="mx-auto h-12 w-12 text-[#2a2d45] mb-3" />
                   <p className="text-[#a7a8c7]">No has radicado ninguna solicitud.</p>
               </div>
           ) : (
               <div className="space-y-4">
                   {myPqrs.map((pqr) => (
                       <div key={pqr.id} className="bg-[#111322] border border-white/10 rounded-xl p-6">
                           <div className="flex justify-between items-start mb-3">
                               <div>
                                   <span className="inline-block px-2 py-1 bg-white/5 rounded text-xs text-[#a7a8c7] font-bold uppercase mb-2">
                                       {pqr.subject}
                                   </span>
                                   <p className="text-white text-sm opacity-80">{new Date(pqr.created_at).toLocaleDateString()} - {new Date(pqr.created_at).toLocaleTimeString()}</p>
                               </div>
                               <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
                                   pqr.status === 'resolved' 
                                   ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                   : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                               }`}>
                                   {pqr.status === 'resolved' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                   {pqr.status === 'resolved' ? 'Resuelto' : 'En Trámite'}
                               </div>
                           </div>
                           <p className="text-white bg-[#050510] p-4 rounded-lg border border-white/5 text-sm">
                               {pqr.message}
                           </p>
                       </div>
                   ))}
               </div>
           )}
       </div>
    </div>
  );
};

export default UserPQR;