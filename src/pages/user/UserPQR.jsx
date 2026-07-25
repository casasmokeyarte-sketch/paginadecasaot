import React, { useState } from 'react';
import { useUserPanel } from '@/hooks/useUserPanel';
import { 
  MessageSquare as MessageSquareWarning, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Info 
} from 'lucide-react';

const FAQS = [
  {
    question: '¿Cómo puedo hacer seguimiento a mis compras o pedidos?',
    answer: 'Puedes ver el estado en tiempo real y el historial de tus pedidos ingresando a la sección "Mis Pedidos" en tu menú de usuario. Allí se actualiza si está en preparación, despachado o entregado.'
  },
  {
    question: '¿Cómo cancelo una cita agendada?',
    answer: 'Ve a la sección "Mis Citas" en tu panel, selecciona la cita correspondiente y haz clic en "Cancelar Cita". Ten en cuenta que actualmente nuestra sala física se encuentra en construcción y no estamos agendando citas nuevas por el momento.'
  },
  {
    question: '¿La tienda virtual está disponible para envíos a domicilio?',
    answer: '¡Sí! Nuestra Smoke Shop virtual funciona al 100%. Puedes agregar productos al carrito, realizar compras y calcular el costo de tu envío a domicilio usando la "Calculadora" en el menú principal.'
  },
  {
    question: '¿Dónde puedo ver las fotos de los trabajos de los tatuadores?',
    answer: 'Puedes ir a la pestaña "Fotos" o "Galería" en el menú de inicio para explorar los diseños más recientes, las salas del estudio y el portafolio de nuestros artistas.'
  },
  {
    question: '¿Qué hago si mi PQR no recibe respuesta?',
    answer: 'Todos los PQRs radicados en esta sección se cargan automáticamente en el panel de control administrativo. El equipo de Casa Smoke dará respuesta a tu solicitud en un plazo máximo de 15 días hábiles a través de tu correo electrónico y podrás ver el estado en tu historial.'
  },
  {
    question: '¿Cómo puedo actualizar los datos de mi perfil?',
    answer: 'Dirígete a la sección "Mi Perfil" en el menú lateral de tu cuenta. Allí podrás actualizar tu nombre, teléfono de contacto y dirección de entrega de manera segura.'
  }
];

const UserPQR = () => {
  const { myPqrs, loadingPqrs, submitPqr } = useUserPanel();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pqr');
  const [openFaq, setOpenFaq] = useState(null);

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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('pqr')}
          className={`pb-4 px-6 font-bold text-sm transition-all relative ${
            activeTab === 'pqr' ? 'text-[#ff2df0]' : 'text-[#a7a8c7] hover:text-white'
          }`}
        >
          Radicar & Historial PQR
          {activeTab === 'pqr' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff2df0]"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`pb-4 px-6 font-bold text-sm transition-all relative ${
            activeTab === 'faq' ? 'text-[#ff2df0]' : 'text-[#a7a8c7] hover:text-white'
          }`}
        >
          Centro de Ayuda / Preguntas Frecuentes
          {activeTab === 'faq' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff2df0]"></span>
          )}
        </button>
      </div>

      {activeTab === 'pqr' ? (
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
                    <p className="text-white bg-[#050510] p-4 rounded-lg border border-white/5 text-sm mb-3">
                      {pqr.message}
                    </p>
                    
                    {pqr.reply_text && (
                      <div className="bg-pink-500/5 border border-pink-500/20 p-4 rounded-lg">
                        <p className="text-xs text-pink-400 font-bold uppercase mb-1 flex items-center gap-1">
                          <Info size={12} /> Respuesta de la Administración:
                        </p>
                        <p className="text-slate-300 text-sm italic">
                          "{pqr.reply_text}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Preguntas Frecuentes (FAQs)</h2>
            <p className="text-[#a7a8c7]">Encuentra respuestas rápidas sobre el uso del sitio, tus pedidos y citas.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div 
                key={index} 
                onClick={() => toggleFaq(index)}
                className="bg-[#111322] border border-white/10 hover:border-pink-500/30 rounded-2xl p-5 cursor-pointer transition-all duration-300 select-none group"
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle size={20} className="text-pink-400 group-hover:text-pink-300 transition-colors flex-shrink-0" />
                    <h3 className="text-white font-bold text-base md:text-lg tracking-wide group-hover:text-pink-300/90 transition-colors">
                      {faq.question}
                    </h3>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp size={20} className="text-pink-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={20} className="text-[#a7a8c7] group-hover:text-white flex-shrink-0" />
                  )}
                </div>
                
                {openFaq === index && (
                  <div className="mt-4 pt-4 border-t border-white/5 text-slate-300 text-sm leading-relaxed animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPQR;