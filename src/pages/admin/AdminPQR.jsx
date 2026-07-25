import React, { useEffect, useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { 
  Mail, Phone, CheckCircle, Send, User, ChevronDown, RefreshCw, 
  ShieldAlert, Flag, MessageSquare, AlertOctagon, Trash, XCircle, Clock
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const STATUS_CONFIG = {
  pending:  { label: 'Pendiente',   color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  open:     { label: 'Abierto',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  replied:  { label: 'Respondido',  color: 'bg-blue-500/20  text-blue-400  border-blue-500/30'  },
  closed:   { label: 'Cerrado',     color: 'bg-green-500/20 text-green-400 border-green-500/30'  },
};

const REPORT_STATUS_CONFIG = {
  pending:       { label: 'Pendiente',      color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  investigating: { label: 'Investigando',   color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  resolved:      { label: 'Sancionado / Resuelto', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  dismissed:     { label: 'Descartado',     color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
};

const FILTERS = ['todos', 'pending', 'open', 'replied', 'closed'];
const FILTER_LABELS = { todos: 'Todos', pending: 'Pendientes', open: 'Abiertos', replied: 'Respondidos', closed: 'Cerrados' };

const AdminPQR = () => {
  const { pqr, loading: loadingPqr, fetchPqr, updatePqrStatus, savePqrReply } = useAdminData();
  const { toast } = useToast();
  
  // Dashboard Tabs State
  const [activeTab, setActiveTab] = useState('pqr'); // 'pqr' or 'reports'
  
  // PQR Filters
  const [activeFilter, setActiveFilter] = useState('todos');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  // Moderation Reports State
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState(null);

  // Chat Audit State
  const [chatLogs, setChatLogs] = useState([]);
  const [loadingChatLogs, setLoadingChatLogs] = useState(false);
  const [auditedUserId, setAuditedUserId] = useState(null);

  useEffect(() => { 
    fetchPqr(); 
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const { data, error } = await supabase
        .from('user_reports')
        .select(`
          *,
          reporter:profiles!user_reports_reporter_id_fkey(id, full_name, username, avatar_url),
          reported:profiles!user_reports_reported_id_fkey(id, full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('user_reports')
        .update({ status: newStatus })
        .eq('id', reportId);
      
      if (error) throw error;
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      toast({
        title: 'Reporte actualizado',
        description: `El estado del reporte ha cambiado a "${REPORT_STATUS_CONFIG[newStatus].label}".`
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del reporte.',
        variant: 'destructive'
      });
    }
  };

  const fetchChatLogs = async (reportedId) => {
    try {
      setLoadingChatLogs(true);
      setAuditedUserId(reportedId);
      
      // Fetch the 30 most recent messages sent by this reported user
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          room_id,
          sender_id,
          profiles:sender_id(id, full_name, username)
        `)
        .eq('sender_id', reportedId)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      setChatLogs(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error de auditoría',
        description: 'No se pudo auditar el historial de chat del usuario.',
        variant: 'destructive'
      });
    } finally {
      setLoadingChatLogs(false);
    }
  };

  const counts = pqr.reduce((acc, p) => {
    const s = p.status || 'pending';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const filteredPqr = activeFilter === 'todos' ? pqr : pqr.filter(p => (p.status || 'pending') === activeFilter);

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
          <h1 className="text-3xl font-bold text-white">Centro de Atención y Moderación</h1>
          <p className="text-[#a7a8c7]">Gestión de peticiones PQR y reportes de comportamiento de la comunidad</p>
        </div>
        <button
          onClick={() => {
            fetchPqr();
            fetchReports();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 text-sm transition-all"
        >
          <RefreshCw size={14} /> Sincronizar
        </button>
      </div>

      {/* Primary Dashboard Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('pqr')}
          className={`px-6 py-3 font-bold text-sm tracking-wider uppercase border-b-2 transition-all ${
            activeTab === 'pqr' 
              ? 'border-[#ff2df0] text-[#ff2df0]' 
              : 'border-transparent text-[#a7a8c7] hover:text-white'
          }`}
        >
          PQR de Clientes ({pqr.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-3 font-bold text-sm tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'reports' 
              ? 'border-[#ff2df0] text-[#ff2df0]' 
              : 'border-transparent text-[#a7a8c7] hover:text-white'
          }`}
        >
          <ShieldAlert size={16} /> Reportes de Moderación ({reports.length})
        </button>
      </div>

      {/* --- TAB CONTENT: PQRs --- */}
      {activeTab === 'pqr' && (
        <div className="space-y-6">
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
            {loadingPqr ? (
              <p className="text-[#a7a8c7]">Cargando mensajes...</p>
            ) : filteredPqr.length === 0 ? (
              <div className="text-center py-12 text-[#a7a8c7] bg-[#111322] border border-white/5 rounded-xl">
                No hay mensajes en esta categoría.
              </div>
            ) : (
              filteredPqr.map((item) => {
                const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                const isExpanded = expandedId === item.id;
                return (
                  <div key={item.id} className="bg-[#111322] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                    {/* Summary row */}
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

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-white/5 space-y-4">
                        <div className="bg-[#050510] p-4 rounded-lg border border-white/5 text-[#d1d5db] leading-relaxed mt-4">
                          {item.message}
                        </div>

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
      )}

      {/* --- TAB CONTENT: MODERATION REPORTS --- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 flex items-start gap-4">
            <AlertOctagon className="text-red-400 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-white text-sm">Protocolo de Investigación del Administrador</h3>
              <p className="text-xs text-[#a7a8c7] mt-1 leading-relaxed">
                Cada reporte enviado por un usuario debe ser investigado a la brevedad. Utiliza el botón de <strong>Auditar Mensajes</strong> para inspeccionar los mensajes enviados recientemente por el usuario acusado y corroborar las afirmaciones antes de proceder a la sanción o desestimación del reporte. Las infracciones graves pueden resultar en el destierro y expulsión permanente del usuario de la plataforma.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {loadingReports ? (
              <p className="text-[#a7a8c7]">Cargando reportes...</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-[#a7a8c7] bg-[#111322] border border-white/5 rounded-xl">
                No hay reportes de usuarios registrados.
              </div>
            ) : (
              reports.map((report) => {
                const rsc = REPORT_STATUS_CONFIG[report.status] || REPORT_STATUS_CONFIG.pending;
                const isExpanded = expandedReportId === report.id;
                
                return (
                  <div key={report.id} className="bg-[#111322] border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                    {/* Header Summary Row */}
                    <div 
                      className="p-5 flex flex-col md:flex-row justify-between gap-3 cursor-pointer select-none"
                      onClick={() => {
                        setExpandedReportId(isExpanded ? null : report.id);
                        setAuditedUserId(null);
                        setChatLogs([]);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-lg font-bold text-white truncate flex items-center gap-1.5">
                            <Flag size={16} className="text-red-400" />
                            Reporte contra {report.reported?.username ? `@${report.reported.username}` : (report.reported?.full_name || 'Usuario desconocido')}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase flex-shrink-0 ${rsc.color}`}>
                            {rsc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[#a7a8c7] flex-wrap">
                          <span><strong>Reportado por:</strong> {report.reporter?.username ? `@${report.reporter.username}` : (report.reporter?.full_name || 'Usuario')}</span>
                          <span>|</span>
                          <span><strong>ID Reportado:</strong> <code className="bg-[#050510] px-1 py-0.5 rounded text-[10px] font-mono">{report.reported_id}</code></span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-[#a7a8c7]">
                          {new Date(report.created_at).toLocaleString('es-CO', {
                            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        <ChevronDown size={16} className={`text-white/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-white/5 space-y-5">
                        
                        {/* Reported Reason Block */}
                        <div className="mt-4 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400">Motivos y Evidencia del Reporte</h4>
                          <div className="bg-[#050510] p-4 rounded-xl border border-white/5 text-[#d1d5db] text-sm leading-relaxed">
                            {report.reason}
                          </div>
                        </div>

                        {/* Audit Tool Section */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400">Herramienta de Auditoría de Conversaciones</h4>
                            <button
                              type="button"
                              onClick={() => fetchChatLogs(report.reported_id)}
                              className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-bold rounded-lg border border-yellow-500/20 transition-all flex items-center gap-1.5"
                            >
                              <MessageSquare size={13} /> Auditar Historial de Chat Reciente
                            </button>
                          </div>

                          {auditedUserId === report.reported_id && (
                            <div className="bg-[#050510] border border-white/10 rounded-xl p-4 max-h-60 overflow-y-auto space-y-3 scrollbar-thin">
                              <p className="text-[10px] text-[#a7a8c7] uppercase font-mono tracking-wider border-b border-white/5 pb-1">
                                Últimos 30 mensajes enviados por el usuario auditado
                              </p>
                              {loadingChatLogs ? (
                                <p className="text-xs text-slate-400 animate-pulse">Cargando registros de chat...</p>
                              ) : chatLogs.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">El usuario no ha enviado mensajes de chat recientemente.</p>
                              ) : (
                                <div className="space-y-2">
                                  {chatLogs.map(log => (
                                    <div key={log.id} className="text-xs border-b border-white/5 pb-2">
                                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                                        <span className="font-semibold text-[#00e5ff]">Sala ID: {log.room_id.slice(0,8)}...</span>
                                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(log.created_at).toLocaleString()}</span>
                                      </div>
                                      <p className="text-white bg-white/[0.02] p-2 rounded-lg mt-0.5 border border-white/5 font-mono">{log.content}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Status Management Bar */}
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">Acción de Moderación:</span>
                            <button
                              onClick={() => updateReportStatus(report.id, 'investigating')}
                              className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-bold rounded-lg border border-yellow-500/20"
                            >
                              Investigar Caso
                            </button>
                            <button
                              onClick={() => updateReportStatus(report.id, 'resolved')}
                              className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-bold rounded-lg border border-green-500/20"
                            >
                              Sancionar Usuario / Resolver
                            </button>
                            <button
                              onClick={() => updateReportStatus(report.id, 'dismissed')}
                              className="px-3 py-1.5 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 text-xs font-bold rounded-lg border border-slate-500/20"
                            >
                              Desestimar / Descartar
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
      )}
    </div>
  );
};

export default AdminPQR;