import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, X, Send, CheckCircle, MapPin, Clock, User, Phone, Users, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const FloatingAnnounce = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    arrival_time: '',
    people_count: 1,
    visit_reason: '',
    notes: '',
  });

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.arrival_time) return;
    setSaving(true);
    try {
      await supabase.from('store_visits').insert([{
        visitor_name:  form.name,
        phone:         form.phone || null,
        arrival_time:  form.arrival_time,
        people_count:  Number(form.people_count) || 1,
        visit_reason:  form.visit_reason || null,
        notes:         form.notes || null,
        status:        'pendiente',
      }]);

      // Notificar al asesor por WhatsApp
      const arrivalLabel = new Date(form.arrival_time).toLocaleString('es-CO', {
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit',
      });
      const REASONS = {
        productos: 'Comprar productos', tatuaje: 'Consulta de tatuaje',
        'dulce-farma': 'Dulce Farma', 'ver-tienda': 'Conocer la tienda', otro: 'Otro',
      };
      const waMsg = [
        '🔔 *NUEVO ANUNCIO DE VISITA - Casa OT*',
        `👤 *Nombre:* ${form.name}`,
        `🕐 *Llegada:* ${arrivalLabel}`,
        `👥 *Personas:* ${form.people_count}`,
        form.phone     ? `📞 *Teléfono:* ${form.phone}` : null,
        form.visit_reason ? `🎯 *Motivo:* ${REASONS[form.visit_reason] || form.visit_reason}` : null,
        form.notes     ? `📝 *Notas:* ${form.notes}` : null,
      ].filter(Boolean).join('\n');

      window.open(`https://wa.me/573023007193?text=${encodeURIComponent(waMsg)}`, '_blank');

      setSent(true);
      setTimeout(() => {
        setSent(false);
        setIsOpen(false);
        setForm({ name: '', phone: '', arrival_time: '', people_count: 1, visit_reason: '', notes: '' });
      }, 3000);
    } catch {
      setSent(true);
      setTimeout(() => { setSent(false); setIsOpen(false); }, 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Burbuja flotante */}
      <div className="fixed bottom-[5.5rem] right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-80 md:w-96 bg-[#0c0814]/95 backdrop-blur-xl border border-pink-500/30 rounded-3xl p-5 shadow-[0_10px_35px_rgba(236,72,153,0.25)] text-white relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-pink-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wide text-white">Anuncia tu Visita</h4>
                    <span className="text-[10px] text-pink-400 font-bold uppercase tracking-widest">Casa Smoke OT</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {sent ? (
                <div className="py-8 text-center flex flex-col items-center gap-3">
                  <CheckCircle className="text-pink-400 w-12 h-12 animate-bounce" />
                  <p className="font-black text-sm text-white uppercase tracking-wider">¡Anuncio Registrado!</p>
                  <p className="text-xs text-slate-300">Te esperamos en la tienda. Abriendo WhatsApp...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">Tu nombre *</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ej. Carlos Mendoza"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        className="w-full bg-[#05030a] border border-pink-500/20 focus:border-pink-400 rounded-xl py-2 pl-9 pr-3 text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-semibold mb-1 block">Teléfono / WhatsApp</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                        <input
                          type="tel"
                          placeholder="300 000 0000"
                          value={form.phone}
                          onChange={e => set('phone', e.target.value)}
                          className="w-full bg-[#05030a] border border-pink-500/20 focus:border-pink-400 rounded-xl py-2 pl-8 pr-2 text-white text-xs placeholder:text-slate-500 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-semibold mb-1 block">Personas</label>
                      <div className="relative">
                        <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={form.people_count}
                          onChange={e => set('people_count', e.target.value)}
                          className="w-full bg-[#05030a] border border-pink-500/20 focus:border-pink-400 rounded-xl py-2 pl-8 pr-2 text-white text-xs outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">Fecha y Hora de llegada *</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400" />
                      <input
                        type="datetime-local"
                        required
                        value={form.arrival_time}
                        onChange={e => set('arrival_time', e.target.value)}
                        className="w-full bg-[#05030a] border border-pink-500/20 focus:border-pink-400 rounded-xl py-2 pl-8 pr-2 text-white text-xs outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">Motivo de la visita</label>
                    <select
                      value={form.visit_reason}
                      onChange={e => set('visit_reason', e.target.value)}
                      className="w-full bg-[#05030a] border border-pink-500/20 focus:border-pink-400 rounded-xl py-2 px-3 text-white text-xs outline-none transition-colors"
                    >
                      <option value="">Seleccionar motivo...</option>
                      <option value="productos">Comprar vapes o accesorios</option>
                      <option value="tatuaje">Consulta de Tatuaje / Cita</option>
                      <option value="ver-tienda">Conocer la Galería</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-semibold mb-1 block">Notas adicionales</label>
                    <textarea
                      rows={2}
                      placeholder="Cuéntanos algo más..."
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      className="w-full bg-[#05030a] border border-pink-500/20 focus:border-pink-400 rounded-xl px-3 py-2 text-white text-xs placeholder:text-slate-500 outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-pink-900/40 transition-all disabled:opacity-60"
                  >
                    <Send size={15} /> {saving ? 'Enviando...' : 'Anunciarme Ahora'}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón de la burbuja */}
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(p => !p)}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white px-4 py-2.5 rounded-full shadow-lg shadow-pink-600/30 font-black text-xs uppercase tracking-widest border border-pink-400/30 pointer-events-auto"
          aria-label="Anúnciate"
        >
          <CalendarCheck size={18} />
          Anúnciate
        </motion.button>
      </div>
    </>
  );
};

export default FloatingAnnounce;
