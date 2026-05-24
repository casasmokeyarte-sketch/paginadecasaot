import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Mic, Heart, MessageCircle, Share2, Volume2, ShieldCheck, User, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
const Podcast = () => {
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [story, setStory] = useState('');
  const [mood, setMood] = useState('reflective');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);

  // Guest Request Form State
  const [guestForm, setGuestForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    topic_summary: ''
  });
  const {
    toast
  } = useToast();

  // Mock audio player ref (in a real app, use a proper audio hook/library)
  const audioRef = React.useRef(new Audio());
  useEffect(() => {
    fetchEpisodes();

    // Audio event listeners
    const audio = audioRef.current;
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('play', () => setIsPlaying(true));
    return () => {
      audio.pause();
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.removeEventListener('pause', () => setIsPlaying(false));
      audio.removeEventListener('play', () => setIsPlaying(true));
    };
  }, []);
  const fetchEpisodes = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('podcast_episodes').select('*').order('published_at', {
        ascending: false
      });
      if (error) throw error;

      // Fallback data if DB is empty for demonstration
      if (!data || data.length === 0) {
        setEpisodes([{
          id: 'demo-1',
          title: 'Episodio 1: Rompiendo el Silencio',
          description: 'Hablamos sobre la importancia de reconocer nuestras luchas internas y cómo el primer paso es hablar.',
          duration: '15:30',
          audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' // Demo audio
        }, {
          id: 'demo-2',
          title: 'Episodio 2: Prejuicios y Realidades',
          description: 'Invitados especiales comparten sus experiencias superando la discriminación en el entorno laboral.',
          duration: '22:45',
          audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' // Demo audio
        }]);
      } else {
        setEpisodes(data);
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
    }
  };
  const handlePlay = episode => {
    const isVideoSource = /\.(mp4|webm|mov|m4v)$/i.test(episode.audio_url || '');
    if (isVideoSource) {
      window.open(episode.audio_url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (currentEpisode?.id === episode.id) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    } else {
      audioRef.current.src = episode.audio_url;
      audioRef.current.play();
      setCurrentEpisode(episode);
    }
  };
  const handleSubmitStory = async e => {
    e.preventDefault();
    if (!story.trim()) return;
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('user_stories').insert([{
        content: story,
        mood: mood,
        is_anonymous: true
      }]);
      if (error) throw error;
      toast({
        title: "Historia recibida",
        description: "Gracias por compartir. Tu voz es importante para nosotros.",
        className: "bg-[#111322] border-[#ff2df0] text-white"
      });
      setStory('');
    } catch (error) {
      console.error('Error submitting story:', error);
      toast({
        title: "Error",
        description: "No pudimos enviar tu historia. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGuestSubmit = async e => {
    e.preventDefault();
    setIsGuestSubmitting(true);
    try {
      const {
        error
      } = await supabase.from('podcast_guest_requests').insert([{
        full_name: guestForm.full_name,
        email: guestForm.email,
        phone: guestForm.phone,
        topic_summary: guestForm.topic_summary,
        status: 'pending'
      }]);
      if (error) throw error;
      toast({
        title: "Solicitud enviada",
        description: "Nos pondremos en contacto contigo pronto para coordinar tu visita.",
        className: "bg-[#111322] border-[#00e5ff] text-white"
      });
      setIsGuestDialogOpen(false);
      setGuestForm({
        full_name: '',
        email: '',
        phone: '',
        topic_summary: ''
      });
    } catch (error) {
      console.error('Error submitting guest request:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsGuestSubmitting(false);
    }
  };
  const handleGuestInputChange = e => {
    const {
      name,
      value
    } = e.target;
    setGuestForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  return <>
      <Helmet>
        <title>OT Te EscuchA - Podcast y Apoyo | Casa Smoke y Arte</title>
        <meta name="description" content="Un espacio seguro para compartir historias, escuchar podcasts sobre superación y salud mental. Tu voz importa, aquí te escuchamos sin juzgar." />
      </Helmet>

      <div className="min-h-screen bg-[#050510] pt-16 pb-20">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/espacio-seguro-bg.jpg')] bg-cover bg-center opacity-25 z-0 blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#050510]/80 via-[#050510]/90 to-[#050510] z-0"></div>
          
          <div className="container mx-auto relative z-10 text-center">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} className="max-w-4xl mx-auto">
              <span className="inline-block px-4 py-2 rounded-full bg-[#ff2df0]/10 border border-[#ff2df0]/20 text-[#ff2df0] text-sm font-bold mb-6 tracking-wider uppercase">
                Podcast & Comunidad
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                OT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#ff2df0]">Te EscuchA</span>
              </h1>
              <p className="text-xl md:text-2xl text-[#a7a8c7] mb-8 leading-relaxed font-light">"No estás solo en esos caminos. Aquí, el prejuicio se queda afuera y la empatía toma el micrófono."</p>
              
              <div className="bg-[#111322]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-3xl mx-auto text-left shadow-2xl">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="text-[#00e5ff] w-12 h-12 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">Espacio Seguro y Anónimo</h3>
                    <p className="text-[#a7a8c7]">Vivimos en una sociedad donde, lamentablemente, el prejuicio y la discriminación se han convertido en algo cotidiano. Nos hemos acostumbrado a juzgar a aquellos que son diferentes o que parecen ser una amenaza para nuestro propio sentido de valor. Irónicamente, muchas veces somos nosotros mismos, los que señalamos con el dedo, quienes poseemos defectos y temores no reconocidos. Apuntamos a los "nuevos" o "mejores" como una manera de desviar la atención de nuestras propias inseguridades. Este comportamiento no solo perpetúa un ciclo dañino de prejuicio, sino que también nos impide crecer como individuos y como sociedad. Es esencial reflexionar sobre nuestros propios prejuicios y trabajar activamente para crear un ambiente más inclusivo y comprensivo donde todos puedan prosperar sin miedo al juicio o la discriminación. "Porque todos merecemos esa oportunidad esa  mano que nos ayude salir de ese pozo y si no es la mano por lo menos antes de caer  ser escuchado"</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          
          {/* Main Content: Podcast Episodes */}
          <div className="lg:col-span-7 space-y-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Mic className="text-[#ff2df0]" /> Episodios Recientes
            </h2>

            <div className="space-y-4">
              {episodes.map(episode => <motion.div key={episode.id} initial={{
              opacity: 0,
              x: -20
            }} whileInView={{
              opacity: 1,
              x: 0
            }} viewport={{
              once: true
            }} className={`bg-[#111322] p-6 rounded-2xl border transition-all hover:border-[#ff2df0]/50 group ${currentEpisode?.id === episode.id ? 'border-[#ff2df0] shadow-[0_0_20px_rgba(255,45,240,0.1)]' : 'border-white/5'}`}>
                  <div className="flex items-center gap-6">
                    <button onClick={() => handlePlay(episode)} className="w-16 h-16 rounded-full bg-[#15162a] flex items-center justify-center text-white border border-white/10 group-hover:scale-110 transition-all hover:bg-[#ff2df0] flex-shrink-0">
                      {currentEpisode?.id === episode.id && isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>
                    
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#ff2df0] transition-colors">
                        {episode.title}
                      </h3>
                      <p className="text-[#a7a8c7] text-sm mb-3">
                        {episode.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#a7a8c7]/70 font-mono">
                        <span className="flex items-center gap-1"><Volume2 size={12} /> {episode.duration}</span>
                        <span>•</span>
                        <span>Publicado recientemente</span>
                      </div>
                    </div>
                  </div>
                </motion.div>)}
            </div>
          </div>

          {/* Sidebar: Share Story */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24">
              <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} className="bg-gradient-to-br from-[#111322] to-[#1a1c2e] rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e5ff]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[#ff2df0]/20 p-3 rounded-xl">
                    <MessageCircle className="text-[#ff2df0]" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Comparte tu Historia</h3>
                </div>

                <p className="text-[#a7a8c7] mb-6 text-sm">
                  ¿Tienes algo que decir? Tu experiencia puede ser la luz que alguien más necesita ver. 
                  Escribe anónimamente lo que sientes, tus luchas o tus victorias.
                </p>

                <form onSubmit={handleSubmitStory} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#a7a8c7] uppercase tracking-wider ml-1">¿Cómo te sientes hoy?</label>
                    <div className="flex gap-2">
                      {['reflective', 'sad', 'hopeful', 'angry'].map(m => <button key={m} type="button" onClick={() => setMood(m)} className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all border ${mood === m ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff]' : 'bg-[#050510] border-white/10 text-[#a7a8c7] hover:bg-[#1f213a]'}`}>
                          {m === 'reflective' && '🤔 Reflexivo'}
                          {m === 'sad' && '😔 Triste'}
                          {m === 'hopeful' && '✨ Esperanzado'}
                          {m === 'angry' && '😤 Molesto'}
                        </button>)}
                    </div>
                  </div>

                  <div className="relative">
                    <textarea value={story} onChange={e => setStory(e.target.value)} placeholder="Escribe aquí tu historia... (Totalmente anónimo)" rows={6} className="w-full bg-[#050510] border border-white/10 rounded-xl p-4 text-white focus:border-[#ff2df0] outline-none resize-none text-sm leading-relaxed" />
                    <User className="absolute bottom-4 right-4 text-[#a7a8c7]/30" size={16} />
                  </div>

                  <Button type="submit" disabled={isSubmitting || !story.trim()} className="w-full bg-gradient-to-r from-[#ff2df0] to-[#d91cb8] hover:shadow-[0_0_20px_rgba(255,45,240,0.3)] text-white font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-2">
                    {isSubmitting ? 'Enviando...' : <>
                        <Share2 size={18} />
                        Enviar Anónimamente
                      </>}
                  </Button>
                  
                  <p className="text-center text-[10px] text-[#a7a8c7]/50 mt-4">
                    Al enviar, aceptas que tu historia pueda ser leída o compartida en futuros episodios para ayudar a otros.
                  </p>
                </form>
              </motion.div>
            </div>
          </div>
        </div>

        {/* NEW SECTION: Studio Visit Invitation */}
        <section className="container mx-auto px-4 mt-20">
          <div className="relative rounded-3xl overflow-hidden bg-[#111322] border border-white/10">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#00e5ff]/10 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff2df0]/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid md:grid-cols-2 gap-8 items-center p-8 md:p-12 relative z-10">
              <div className="space-y-6">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] text-xs font-bold uppercase tracking-wider">
                    <MapPin size={14} />
                    <span>Visítanos en el estudio</span>
                 </div>
                 <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                    ¿Quieres contar tu historia <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#ff2df0]">en persona?</span>
                 </h2>
                 <p className="text-lg text-[#a7a8c7] leading-relaxed">
                   "Si quieres que tu historia sea escuchada por ti mismo, eres bienvenido a nuestro estudio. Envía una solicitud y con gusto te contactaremos. Porque antes de caer queremos ser escuchado."
                 </p>
                 
                 <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-white text-black hover:bg-[#00e5ff] hover:text-white font-bold py-6 px-8 rounded-full text-lg transition-all flex items-center gap-2 group shadow-xl">
                        Solicitar Visita
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111322] border-white/10 text-white sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                           <Mic className="text-[#ff2df0]" />
                           Solicitud de Visita
                        </DialogTitle>
                        <DialogDescription className="text-[#a7a8c7]">
                          Déjanos tus datos y te contactaremos para agendar un espacio en nuestro estudio.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={handleGuestSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">Nombre Completo</label>
                          <input required type="text" name="full_name" value={guestForm.full_name} onChange={handleGuestInputChange} className="w-full bg-[#050510] border border-white/20 rounded-lg p-3 text-white focus:border-[#00e5ff] outline-none transition-colors" placeholder="Tu nombre" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-white">Email</label>
                            <input required type="email" name="email" value={guestForm.email} onChange={handleGuestInputChange} className="w-full bg-[#050510] border border-white/20 rounded-lg p-3 text-white focus:border-[#00e5ff] outline-none transition-colors" placeholder="correo@ejemplo.com" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-white">Teléfono</label>
                            <input required type="tel" name="phone" value={guestForm.phone} onChange={handleGuestInputChange} className="w-full bg-[#050510] border border-white/20 rounded-lg p-3 text-white focus:border-[#00e5ff] outline-none transition-colors" placeholder="+57 300..." />
                          </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-white">Breve descripción del tema (Opcional)</label>
                           <textarea name="topic_summary" value={guestForm.topic_summary} onChange={handleGuestInputChange} rows={3} className="w-full bg-[#050510] border border-white/20 rounded-lg p-3 text-white focus:border-[#00e5ff] outline-none transition-colors resize-none" placeholder="¿De qué te gustaría hablar?" />
                        </div>
                        
                        <div className="pt-4 flex justify-end gap-3">
                          <Button type="button" variant="ghost" onClick={() => setIsGuestDialogOpen(false)} className="text-[#a7a8c7] hover:text-white hover:bg-white/10">
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isGuestSubmitting} className="bg-[#00e5ff] text-black hover:bg-[#00cce6] font-bold">
                            {isGuestSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                 </Dialog>
              </div>
              
              <div className="hidden md:block relative h-full min-h-[300px] rounded-2xl overflow-hidden group">
                 <img alt="OT Te EscuchA - Estudio de grabación podcast" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="/podcast-flamingo.png" />
                 <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                 
                 {/* Floating Badge */}
                 <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-[#ff2df0] flex items-center justify-center text-white">
                          <Calendar size={20} />
                       </div>
                       <div>
                          <p className="text-xs text-[#a7a8c7]">Horarios Flexibles</p>
                          <p className="text-white font-bold">Agenda tu espacio</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>;
};
export default Podcast;
