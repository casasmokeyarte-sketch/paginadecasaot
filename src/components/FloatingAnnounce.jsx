import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, X, Send, CheckCircle, MapPin, Clock, User, Phone, Users } from 'lucide-react';
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
      // Aunque falle la BD, el WhatsApp ya fue abierto
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
              className="w-[340px] bg-[#0c1322] border border-yellow-400/30 rounded-[22px] shadow-[0_20px_60px_rgba(250,204,21,0.15)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MapPin className="text-yellow-400" size={18} />
                  <div>
                    <p className="font-black text-white text-sm uppercase tracking-wide">Anúnciate</p>
                    <p className="text-xs text-[#a7a8c7]">Avísanos que vas a venir</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-[#a7a8c7] hover:text-white transition-colors p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              {sent ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <CheckCircle className="text-green-400" size={48} />
                  </motion.div>
                  <p className="font-bold text-white">¡Listo, {form.name}!</p>
                  <p className="text-sm text-[#a7a8c7]">Te esperamos en la tienda. ¡Hasta pronto!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                  {/* Nombre */}
                  <div>
                    <label className="flex items-center gap-1 text-xs text-[#a7a8c7] mb-1">
                      <User size={11} /> Nombre <span className="text-yellow-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="¿Cómo te llamas?"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-[#a7a8c7]/50 outline-none focus:border-yellow-400"
                    />
                  </div>

                  {/* Hora de llegada + personas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="flex items-center gap-1 text-xs text-[#a7a8c7] mb-1">
                        <Clock size={11} /> Hora de llegada <span className="text-yellow-400">*</span>
                      </label>
                      <input
                        required
                        type="datetime-local"
                        value={form.arrival_time}
                        onChange={e => set('arrival_time', e.target.value)}
                        className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-xs text-[#a7a8c7] mb-1">
                        <Users size={11} /> Personas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={form.people_count}
                        onChange={e => set('people_count', e.target.value)}
                        className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="flex items-center gap-1 text-xs text-[#a7a8c7] mb-1">
                      <Phone size={11} /> Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      placeholder="3XX XXX XXXX"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-[#a7a8c7]/50 outline-none focus:border-yellow-400"
                    />
                  </div>

                  {/* Motivo de visita */}
                  <div>
                    <label className="text-xs text-[#a7a8c7] mb-1 block">¿Qué vas a buscar? (opcional)</label>
                    <select
                      value={form.visit_reason}
                      onChange={e => set('visit_reason', e.target.value)}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-400"
                    >
                      <option value="">— Selecciona —</option>
                      <option value="productos">Comprar productos</option>
                      <option value="tatuaje">Consulta de tatuaje</option>
                      <option value="dulce-farma">Dulce Farma</option>
                      <option value="ver-tienda">Conocer la tienda</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="text-xs text-[#a7a8c7] mb-1 block">Notas adicionales (opcional)</label>
                    <textarea
                      rows={2}
                      placeholder="Cuéntanos algo más..."
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      className="w-full bg-[#050510] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-[#a7a8c7]/50 outline-none focus:border-yellow-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:opacity-90 text-slate-950 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 uppercase tracking-widest"
                  >
                    <Send size={15} /> {saving ? 'Enviando...' : '¡Me anuncio!'}
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
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-950 px-4 py-2.5 rounded-full shadow-lg shadow-yellow-500/20 font-black text-xs uppercase tracking-widest border border-yellow-400/25 pointer-events-auto"
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
