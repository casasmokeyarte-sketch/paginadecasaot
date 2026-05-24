import React, { useEffect, useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Mail, Phone, CheckCircle, Send, User, ChevronDown, RefreshCw, LogIn } from 'lucide-react';

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',   color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  open:     { label: 'Abierto',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  replied:  { label: 'Respondido',  color: 'bg-blue-500/20  text-blue-400  border-blue-500/30'  },
  closed:   { label: 'Cerrado',     color: 'bg-green-500/20 text-green-400 border-green-500/30'  },
};

const FILTERS = ['todos', 'pending', 'open', 'replied', 'closed'];
const FILTER_LABELS = { todos: 'Todos', pending: 'Pendientes', open: 'Abiertos', replied: 'Respondidos', closed: 'Cerrados' };

const AdminPQR = () => {
  const { pqr, loading, fetchPqr, updatePqrStatus, savePqrReply } = useAdminData();
  const [activeFilter, setActiveFilter] = useState('todos');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchPqr(); }, []);

  const counts = pqr.reduce((acc, p) => {
    const s = p.status || 'pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const filtered = activeFilter === 'todos' ? pqr : pqr.filter(p => (p.status || 'pending') === activeFilter);

  const handleReply = async (id) => {
    const text = (replyDrafts[id] || '').trim();
    if (!text) return;
    await savePqrReply(id, text);
    setReplyDrafts(prev => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">PQR y Mensajes</h1>
          <p className="text-[#a7a8c7]">Gestión de Peticiones, Quejas, Reclamos y Sugerencias</p>
        </div>
        <button
          onClick={fetchPqr}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 text-sm transition-all"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ['Total',       pqr.length,          'text-white'],
          ['Pendientes',  counts.pending || 0,  'text-yellow-300'],
          ['Abiertos',    counts.open    || 0,  'text-orange-400'],
          ['Respondidos', counts.replied || 0,  'text-blue-400'],
          ['Cerrados',    counts.closed  || 0,  'text-green-400'],
        ].map(([label, count, color]) => (
          <div key={label} className="bg-[#111322] border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-[#a7a8c7] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeFilter === f
                ? 'bg-[#ff2df0] border-[#ff2df0] text-white'
                : 'bg-white/5 border-white/10 text-[#a7a8c7] hover:bg-white/10'
            }`}
          >
            {FILTER_LABELS[f]}{f !== 'todos' && counts[f] ? ` (${counts[f]})` : ''}
          </button>
        ))}
      </div>

      {/* PQR list */}
      <div className="grid gap-4">
        {loading ? (
          <p className="text-[#a7a8c7]">Cargando mensajes...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[#a7a8c7] bg-[#111322] border border-white/5 rounded-xl">
            No hay mensajes en esta categoría.
          </div>
        ) : (
          filtered.map((item) => {
            const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="bg-[#111322] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                {/* Summary row — click to expand */}
                <div
                  className="flex flex-col md:flex-row justify-between gap-3 p-5 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-white truncate">{item.subject || 'Sin asunto'}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase flex-shrink-0 ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#a7a8c7] flex-wrap">
                      <span className="flex items-center gap-1"><User size={13} /> {item.full_name || '—'}</span>
                      <span className="flex items-center gap-1"><Mail size={13} /> {item.email}</span>
                      {item.phone && <span className="flex items-center gap-1"><Phone size={13} /> {item.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[#a7a8c7]">
                      {new Date(item.created_at).toLocaleString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    <ChevronDown size={16} className={`text-white/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded detail + reply */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-white/5 space-y-4">
                    {/* Message */}
                    <div className="bg-[#050510] p-4 rounded-lg border border-white/5 text-[#d1d5db] leading-relaxed mt-4">
                      {item.message}
                    </div>

                    {/* Previous reply */}
                    {item.reply_text && (
                      <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                        <p className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-wide">Respuesta guardada</p>
                        <p className="text-[#d1d5db] text-sm">{item.reply_text}</p>
                        {item.replied_at && (
                          <p className="text-xs text-[#a7a8c7] mt-2">
                            {new Date(item.replied_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="space-y-3">
                      <p className="text-xs text-[#a7a8c7] font-semibold uppercase tracking-wide">Respuesta / Nota interna</p>
                      <textarea
                        rows={3}
                        value={replyDrafts[item.id] || ''}
                        onChange={(e) => setReplyDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Escribe la respuesta al cliente o una nota interna..."
                        className="w-full bg-[#050510] border border-white/10 text-white placeholder-[#a7a8c7] rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#ff2df0]/50 transition-colors"
                      />
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        {/* Quick status buttons */}
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => updatePqrStatus(item.id, 'open')}
                            className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg hover:bg-orange-500/20 text-xs font-medium border border-orange-500/20"
                          >
                            Abrir caso
                          </button>
                          <button
                            onClick={() => updatePqrStatus(item.id, 'replied')}
                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-xs font-medium border border-blue-500/20"
                          >
                            Marcar respondido
                          </button>
                          <button
                            onClick={() => updatePqrStatus(item.id, 'closed')}
                            className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 text-xs font-medium border border-green-500/20"
                          >
                            <CheckCircle size={12} className="inline mr-1" />Cerrar caso
                          </button>
                        </div>

                        {/* Save reply button */}
                        <button
                          onClick={() => handleReply(item.id)}
                          disabled={!(replyDrafts[item.id] || '').trim()}
                          className="flex items-center gap-2 px-4 py-2 bg-[#ff2df0] text-white rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d91cb8] transition-colors"
                        >
                          <Send size={14} /> Guardar respuesta
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminPQR;