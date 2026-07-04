import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import HomeGallery from '@/components/HomeGallery';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award, Zap, Shield, Sparkles, User, Download,
  RefreshCw, HelpCircle, Check, X, ArrowRight, Play,
  DollarSign, Gift, Trophy, Clock, ChevronRight
} from 'lucide-react';

const MASCOT_PROFILES = [
  {
    id: 'mingo',
    name: 'Mingo',
    country: 'Colombia 🇨🇴',
    animal: 'Flamenco',
    color: '#FCD116',
    image: '/fifa_flamingo_1.jpg',
    bio: 'Mingo es un flamenco alegre y dinámico que representa la biodiversidad de Colombia. Con sus alas coloridas, vuela alto para llevar el ritmo del trópico a Norteamérica.',
    stats: { velocidad: 95, potencia: 82, estilo: 99 }
  },
  {
    id: 'stark',
    name: 'Stark',
    country: 'Estados Unidos 🇺🇸',
    animal: 'Águila',
    color: '#002868',
    image: '/fifa_mascots.jpg', // we will use fallback offsets or show mascot card
    bio: 'Stark es un águila audaz y determinada que representa el liderazgo. Domina los cielos con su agilidad aérea y su visión táctica impecable.',
    stats: { velocidad: 92, potencia: 88, estilo: 85 }
  },
  {
    id: 'balam',
    name: 'Balam',
    country: 'México 🇲🇽',
    animal: 'Jaguar',
    color: '#006847',
    image: '/fifa_mascots.jpg',
    bio: 'Balam es un jaguar inteligente y veloz que representa la fuerza ancestral y la agilidad en la cancha. Su control del balón es legendario.',
    stats: { velocidad: 96, potencia: 92, estilo: 90 }
  },
  {
    id: 'chilli',
    name: 'Chilli',
    country: 'Canadá 🇨🇦',
    color: '#DA291C',
    animal: 'Alce',
    image: '/fifa_mascots.jpg',
    bio: 'Chilli es un alce amigable pero imponente que representa la fuerza y el espíritu de resistencia del norte. Su potencia física y defensa son insuperables.',
    stats: { velocidad: 80, potencia: 96, estilo: 88 }
  }
];


const Hero = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Mascot Explorer state
  const [selectedMascot, setSelectedMascot] = useState('mingo');



  // Live Scoreboard state
  const [matchList, setMatchList] = useState([
    { id: 'col-usa', teamH: 'Colombia', flagH: '🇨🇴', teamA: 'USA', flagA: '🇺🇸', scoreH: 1, scoreA: 1, minute: 58, status: 'En Vivo', group: 'Fase de Grupos' },
    { id: 'mex-can', teamH: 'México', flagH: '🇲🇽', teamA: 'Canadá', flagA: '🇨🇦', scoreH: 0, scoreA: 0, minute: 15, status: 'En Vivo', group: 'Fase de Grupos' },
    { id: 'arg-fra', teamH: 'Argentina', flagH: '🇦🇷', teamA: 'Francia', flagA: '🇫🇷', scoreH: 3, scoreA: 2, minute: 90, status: 'Finalizado', group: 'Fase de Grupos' },
  ]);
  const [goalAlert, setGoalAlert] = useState(null);

  // Betting Center state
  const [selectedBetMatch, setSelectedBetMatch] = useState('col-usa');
  const [goalsPredictH, setGoalsPredictH] = useState('0');
  const [goalsPredictA, setGoalsPredictA] = useState('0');
  const [betMode, setBetMode] = useState('monetaria');
  const [betAmountVal, setBetAmountVal] = useState(10000);

  const [bets, setBets] = useState(() => {
    const saved = localStorage.getItem('fifa_bets');
    return saved ? JSON.parse(saved) : [];
  });

  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem('fifa_wallet');
    return saved ? parseFloat(saved) : 50000;
  });

  useEffect(() => {
    localStorage.setItem('fifa_bets', JSON.stringify(bets));
  }, [bets]);

  useEffect(() => {
    localStorage.setItem('fifa_wallet', walletBalance.toString());
  }, [walletBalance]);

  // Live Scoreboard ticking
  useEffect(() => {
    const interval = setInterval(() => {
      setMatchList(prev => prev.map(m => {
        if (m.status !== 'En Vivo') return m;

        const nextMin = m.minute + 1;
        let nextScoreH = m.scoreH;
        let nextScoreA = m.scoreA;
        let goalScored = false;
        let scoringTeam = '';

        if (Math.random() < 0.04) {
          if (Math.random() < 0.5) {
            nextScoreH += 1;
            goalScored = true;
            scoringTeam = m.teamH;
          } else {
            nextScoreA += 1;
            goalScored = true;
            scoringTeam = m.teamA;
          }
        }

        if (goalScored) {
          setGoalAlert({
            match: `${m.teamH} vs ${m.teamA}`,
            message: `¡GOOOOL DE ${scoringTeam.toUpperCase()}! ⚽ (${nextScoreH} - ${nextScoreA})`
          });
          setTimeout(() => setGoalAlert(null), 4000);
        }

        if (nextMin >= 90) {
          setTimeout(() => {
            resolveBets(m.id, nextScoreH, nextScoreA);
          }, 500);
          return { ...m, minute: 90, status: 'Finalizado', scoreH: nextScoreH, scoreA: nextScoreA };
        }

        return { ...m, minute: nextMin, scoreH: nextScoreH, scoreA: nextScoreA };
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const resolveBets = (matchId, finalH, finalA) => {
    setBets(prevBets => {
      const updated = prevBets.map(b => {
        if (b.matchId !== matchId || b.status !== 'Pendiente') return b;

        const won = parseInt(b.predH) === finalH && parseInt(b.predA) === finalA;

        if (won) {
          if (b.type === 'monetaria') {
            const payout = b.amount * 3;
            setWalletBalance(curr => curr + payout);
            alert(`🎉 ¡Acertaste el marcador en tu apuesta monetaria! Ganaste $${payout.toLocaleString('es-CO')} COP y regalos de Casa Smoke OT.`);
          } else {
            alert(`🎁 ¡Acertaste el marcador en tu apuesta gratuita! Ganaste un premio sorpresa de la empresa.`);
          }
          return { ...b, status: 'Ganada 🏆', finalH, finalA };
        } else {
          return { ...b, status: 'Perdida ❌', finalH, finalA };
        }
      });
      return updated;
    });
  };

  const handlePlaceBet = () => {
    if (!user) return;

    const match = matchList.find(m => m.id === selectedBetMatch);
    if (!match) return;

    if (match.status === 'Finalizado') {
      alert('Este partido ya ha finalizado. No se permiten apuestas.');
      return;
    }

    const gH = parseInt(goalsPredictH);
    const gA = parseInt(goalsPredictA);
    if (isNaN(gH) || isNaN(gA) || gH < 0 || gA < 0) {
      alert('Por favor ingresa marcadores válidos.');
      return;
    }

    if (betMode === 'monetaria') {
      if (walletBalance < betAmountVal) {
        alert('No tienes suficiente saldo simulado. Carga más saldo en tu billetera.');
        return;
      }
      setWalletBalance(curr => curr - betAmountVal);
    }

    const newBet = {
      id: `bet-${Date.now()}`,
      matchId: selectedBetMatch,
      matchName: `${match.teamH} vs ${match.teamA}`,
      type: betMode,
      predH: gH,
      predA: gA,
      amount: betMode === 'monetaria' ? betAmountVal : 0,
      status: 'Pendiente',
      timestamp: new Date().toISOString(),
    };

    setBets(prev => [newBet, ...prev]);
    alert(`Apuesta registrada con éxito para ${match.teamH} vs ${match.teamA}. ¡Buena suerte!`);
  };


  // 1. Background Music (Shakira ft. Burna Boy) State, Ref & Function
  const audioRef = React.useRef(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(err => {
        console.warn('Playback blocked by browser:', err);
        alert('El navegador bloqueó la reproducción automática. Presiona reproducir de nuevo.');
      });
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const activeProfile = MASCOT_PROFILES.find(m => m.id === selectedMascot);

  return (
    <>
      <Helmet>
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&family=Playball&family=Montserrat:wght@400;700;900&display=swap" rel="stylesheet" />
        <title>Casa Smoke y Arte SSOT S.A.S - Portal FIFA 2026 ⚽</title>
      </Helmet>

       {/* Main Container */}
      <div className="container mx-auto px-4 pt-8 pb-16 font-sans flex flex-col items-center relative overflow-visible">

        {/* Background logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
          <img src="/logo2.png" alt="Logo Watermark" className="w-[85%] max-w-2xl h-auto object-contain" />
        </div>

        {/* 1. MOCKUP HERO HEADER & BANNER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-6xl mx-auto rounded-3xl p-6 md:p-10 lg:p-12 overflow-visible bg-[#090d16]/80 border border-yellow-500/25 shadow-[0_12px_40px_rgba(250,204,21,0.15)] flex flex-col justify-center mb-16 relative z-10"
        >
          {/* Subtle sparkle effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl opacity-40">
            <div className="absolute top-[20%] left-[30%] w-3 h-3 bg-yellow-400 rounded-full blur-[1px] animate-pulse"></div>
            <div className="absolute bottom-[25%] left-[5%] w-2 h-2 bg-yellow-300 rounded-full blur-[2px] animate-ping"></div>
            <div className="absolute top-[15%] right-[20%] w-4 h-4 bg-yellow-400 rounded-full blur-[1px] animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full relative z-10">

            {/* LEFT COLUMN: Texts & Buttons */}
            <div className="col-span-1 lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-yellow-400 text-slate-950 font-black text-[9px] md:text-[10px] px-3.5 py-1.5 rounded-full tracking-widest uppercase mb-6"
              >
                <span>🏆</span> PORTAL OFICIAL DE LA COPA MUNDIAL FIFA 2026
              </motion.div>

              {/* Huge Bold Title */}
              <h2 className="flex flex-col font-black tracking-tight leading-[1.0] text-4xl sm:text-5xl md:text-6xl lg:text-7xl select-none mb-6 uppercase">
                <span className="text-white drop-shadow-md">LA PASIÒN Y LA EMOCIÓN</span>
                <span
                  className="text-transparent font-black my-1"
                  style={{ WebkitTextStroke: '2px #ffffff', color: 'transparent' }}
                >
                  DE LA FIFA
                </span>
                <span className="text-yellow-400 drop-shadow-md">TAMBIÉN SE VIVE EN</span>
                <span className="text-white drop-shadow-md">CASA SMOKE OT</span>
              </h2>

              {/* Description */}
              <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed max-w-xl mb-8">
                ¡Vive la Copa Mundial de la FIFA 2026 de la manera más emocionante! Consulta los marcadores en tiempo real en nuestro tablero automatizado y pon a prueba tus predicciones en el Centro de Apuestas. Juega por dinero real y regalos o participa en apuestas gratuitas de la empresa.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button
                  onClick={() => document.querySelector('#apuestas')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 text-xs font-black text-slate-950 bg-yellow-400 hover:bg-yellow-300 rounded-full px-6 py-3.5 transition-colors uppercase tracking-widest"
                >
                  APOSTAR AHORA <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => document.querySelector('#resultados')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 text-xs font-black text-white hover:bg-white/5 border-2 border-yellow-400/50 hover:border-yellow-400 rounded-full px-6 py-3.5 transition-colors uppercase tracking-widest bg-transparent"
                >
                  VER MARCADORES EN VIVO
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: New Mascot Main Image */}
            <div className="col-span-1 lg:col-span-5 flex justify-center items-center">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="relative w-full max-w-[440px] aspect-[4/3] flex items-center justify-center group"
              >
                {/* Outer glowing background ring */}
                <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-yellow-500/20 to-red-500/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700 pointer-events-none"></div>

                <img
                  src="/fifa_mascots_new.png"
                  alt="Mascotas Oficiales de la FIFA 2026 - Casa Smoke OT"
                  className="w-full h-auto object-contain relative z-10 filter drop-shadow-[0_20px_25px_rgba(234,179,8,0.25)] transition-all duration-500 group-hover:scale-[1.03] group-hover:-translate-y-2"
                />
              </motion.div>
            </div>

          </div>
        </motion.div>

        {/* 2. MASCOT EXPLORER SECTION */}
        <div id="mascotas" className="w-full max-w-5xl mb-20 scroll-mt-24">
          <div className="text-center mb-10">
            <h3 className="text-yellow-400 text-sm font-black tracking-widest uppercase mb-2">⚽ DESCUBRE LA LOGIA</h3>
            <h2 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tight">EXPLORADOR DE MASCOTAS FIFA</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Mascot Grid Selectors */}
            <div className="col-span-1 lg:col-span-5 flex flex-col gap-4">
              {MASCOT_PROFILES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMascot(m.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${selectedMascot === m.id
                    ? 'bg-[#0f172a] border-yellow-400 shadow-[0_4px_20px_rgba(250,204,21,0.15)] scale-[1.02]'
                    : 'bg-[#090d16]/40 border-white/5 hover:border-white/10 hover:bg-[#090d16]/80'
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Circle Image Thumbnail */}
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 bg-[#0f172a] flex-shrink-0">
                      <img
                        src={m.id === 'mingo' ? '/fifa_flamingo_1.jpg' : '/fifa_mascots.jpg'}
                        className={`w-full h-full object-cover ${m.id === 'stark' ? 'object-left-top' : m.id === 'balam' ? 'object-center' : m.id === 'chilli' ? 'object-right-top' : ''}`}
                        alt={m.name}
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm tracking-wide uppercase">{m.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.animal} // {m.country}</span>
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${selectedMascot === m.id ? 'bg-yellow-400' : 'bg-white/10'}`}></div>
                </button>
              ))}
            </div>

            {/* Mascot Detail Card */}
            <div className="col-span-1 lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeProfile.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full bg-[#0c1322] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                >
                  {/* Subtle color highlight corner */}
                  <div
                    className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-35"
                    style={{ backgroundColor: activeProfile.color }}
                  ></div>

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div>
                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-1">PERFIL OFICIAL</span>
                        <h3 className="text-white text-3xl md:text-4xl font-black uppercase tracking-tight">{activeProfile.name}</h3>
                      </div>
                      <span className="text-xs font-black text-slate-300 bg-white/5 border border-white/10 rounded-full px-3.5 py-1 uppercase tracking-widest">
                        {activeProfile.country}
                      </span>
                    </div>

                    {/* Bio */}
                    <p className="text-slate-300 text-sm leading-relaxed font-medium mb-8 relative z-10">
                      {activeProfile.bio}
                    </p>

                    {/* Stats meters */}
                    <div className="flex flex-col gap-4 relative z-10">
                      <h5 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Estadísticas del Torneo</h5>

                      {/* Velocidad */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-300 uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-400" /> Velocidad</span>
                          <span>{activeProfile.stats.velocidad}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeProfile.stats.velocidad}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      {/* Potencia */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-300 uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Shield size={12} className="text-green-400" /> Potencia Física</span>
                          <span>{activeProfile.stats.potencia}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeProfile.stats.potencia}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-500 to-green-300 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      {/* Estilo */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-300 uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Sparkles size={12} className="text-purple-400" /> Estilo de Juego</span>
                          <span>{activeProfile.stats.estilo}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeProfile.stats.estilo}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Decorative Footer info */}
                  <div className="border-t border-white/5 pt-4 mt-8 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>FIFA WC 2026 MASCOT IDENTIFICATION</span>
                    <span>M{activeProfile.id.toUpperCase()}-026</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* 3. TABLERO DE RESULTADOS EN VIVO */}
        <div id="resultados" className="w-full max-w-5xl mb-20 scroll-mt-24 relative z-10">
          <div className="text-center mb-10">
            <h3 className="text-yellow-400 text-sm font-black tracking-widest uppercase mb-2">⚽ MARCADORES EN VIVO</h3>
            <h2 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tight">RESULTADOS MUNDIALISTAS</h2>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Se actualiza automáticamente en tiempo real</p>
          </div>

          {/* Goal Alert Banner */}
          <AnimatePresence>
            {goalAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="w-full max-w-xl mx-auto mb-6 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 px-6 py-3 rounded-2xl shadow-xl flex items-center justify-center gap-3 border border-yellow-400"
              >
                <span className="text-xl animate-bounce">⚽</span>
                <span className="font-black text-sm uppercase tracking-wider text-center">{goalAlert.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchList.map((match) => (
              <div
                key={match.id}
                onClick={() => {
                  if (match.status !== 'Finalizado') {
                    setSelectedBetMatch(match.id);
                  }
                }}
                className={`bg-[#0c1322]/85 border rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all duration-300 ${match.status === 'Finalizado' ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                  } ${selectedBetMatch === match.id && match.status !== 'Finalizado'
                    ? 'border-yellow-400 shadow-[0_4px_25px_rgba(250,204,21,0.15)] scale-[1.02]'
                    : 'border-white/10 hover:border-white/20 hover:bg-[#0f172a]/60'
                  }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase bg-white/5 rounded px-2 py-0.5">{match.group}</span>
                  <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded uppercase flex items-center gap-1 ${match.status === 'En Vivo'
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                    }`}>
                    {match.status === 'En Vivo' && <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>}
                    {match.status === 'En Vivo' ? `Min ${match.minute}'` : match.status}
                  </span>
                </div>

                <div className="flex items-center justify-between my-4 px-2">
                  {/* Home Team */}
                  <div className="flex flex-col items-center w-5/12">
                    <span className="text-3xl mb-1 filter drop-shadow-md select-none">{match.flagH}</span>
                    <span className="text-white font-black text-xs uppercase tracking-wider text-center truncate w-full">{match.teamH}</span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-2 text-2xl font-black text-white w-2/12 justify-center">
                    <span>{match.scoreH}</span>
                    <span className="text-slate-500 text-lg font-normal">:</span>
                    <span>{match.scoreA}</span>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center w-5/12">
                    <span className="text-3xl mb-1 filter drop-shadow-md select-none">{match.flagA}</span>
                    <span className="text-white font-black text-xs uppercase tracking-wider text-center truncate w-full">{match.teamA}</span>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="text-yellow-400/80">
                    {match.status === 'Finalizado' ? 'Partido Finalizado' : 'Hacer apuesta'}
                  </span>
                  <ChevronRight size={10} className="text-slate-500" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                setMatchList([
                  { id: 'col-usa', teamH: 'Colombia', flagH: '🇨🇴', teamA: 'USA', flagA: '🇺🇸', scoreH: 1, scoreA: 1, minute: 58, status: 'En Vivo', group: 'Fase de Grupos' },
                  { id: 'mex-can', teamH: 'México', flagH: '🇲🇽', teamA: 'Canadá', flagA: '🇨🇦', scoreH: 0, scoreA: 0, minute: 15, status: 'En Vivo', group: 'Fase de Grupos' },
                  { id: 'arg-fra', teamH: 'Argentina', flagH: '🇦🇷', teamA: 'Francia', flagA: '🇫🇷', scoreH: 3, scoreA: 2, minute: 90, status: 'Finalizado', group: 'Fase de Grupos' },
                ]);
                setSelectedBetMatch('col-usa');
                alert('Marcadores y minutos reiniciados para pruebas.');
              }}
              className="text-[9px] font-black text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-full px-4 py-1.5 bg-[#090d16]/30 transition-colors uppercase tracking-widest flex items-center gap-1.5"
            >
              <RefreshCw size={10} /> REINICIAR MINUTOS Y MARCADORES
            </button>
          </div>
        </div>

        {/* 4. CENTRO DE APUESTAS REALES */}
        <div id="apuestas" className="w-full max-w-5xl mb-20 scroll-mt-24 relative z-10">
          <div className="text-center mb-10">
            <h3 className="text-yellow-400 text-sm font-black tracking-widest uppercase mb-2">🎰 JUEGO DE LA POLLA</h3>
            <h2 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tight">CENTRO DE APUESTAS</h2>
            <p className="text-slate-400 text-xs mt-2 uppercase tracking-widest">Acierta los goles del partido para participar y ganar</p>
          </div>

          {!user ? (
            /* LOCK SCREEN CARD FOR ANONYMOUS USERS */
            <div className="w-full max-w-2xl mx-auto bg-[#0c1322]/90 border border-yellow-500/25 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/5 blur-3xl rounded-full"></div>

              <div className="w-16 h-16 bg-yellow-400/10 border-2 border-yellow-400 rounded-full flex items-center justify-center text-yellow-400 mb-6 animate-pulse">
                <User size={30} />
              </div>

              <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-wide mb-3">
                REGISTRO REQUERIDO PARA PARTICIPAR
              </h3>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mb-8 font-medium">
                Para ingresar dinero a tu billetera, realizar apuestas monetarias o participar en las apuestas gratis por premios sorpresa, debes tener una cuenta activa con tus datos actualizados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link to="/register" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto text-xs font-black text-slate-950 bg-yellow-400 hover:bg-yellow-300 rounded-full px-8 py-3.5 transition-colors uppercase tracking-widest">
                    Crear Cuenta / Registrarse
                  </button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto text-xs font-black text-white hover:bg-white/5 border border-white/20 rounded-full px-8 py-3.5 transition-colors uppercase tracking-widest bg-transparent">
                    Iniciar Sesión
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            /* APUESTAS INTERFACE FOR LOGGED IN USERS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column: Form & Wallet */}
              <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">

                {/* Simulated Wallet Card */}
                <div className="bg-[#0c1322]/85 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-400 flex-shrink-0">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Billetera Virtual Simulada</span>
                      <span className="text-2xl font-black text-white tracking-tight">${walletBalance.toLocaleString('es-CO')} COP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setWalletBalance(curr => curr + 20000);
                      alert('Se han cargado $20,000 COP simulados a tu cuenta.');
                    }}
                    className="text-[10px] font-black text-slate-950 bg-green-400 hover:bg-green-300 rounded-full px-4 py-2 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                  >
                    Cargar $20.000 COP
                  </button>
                </div>

                {/* Main Betting Form */}
                <div className="bg-[#0c1322]/85 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col">

                  {/* Select Match Header */}
                  <div className="mb-6">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-2">1. Selecciona el partido a apostar</label>
                    <select
                      value={selectedBetMatch}
                      onChange={(e) => setSelectedBetMatch(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 focus:border-yellow-400 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors font-bold"
                    >
                      {matchList.filter(m => m.status !== 'Finalizado').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.flagH} {m.teamH} vs {m.teamA} {m.flagA} ({m.status === 'En Vivo' ? `En Vivo - Min ${m.minute}'` : m.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Guess goals inputs */}
                  <div className="mb-6">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-3">2. Acierta los goles del juego</label>

                    <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                      {/* Home Predict */}
                      <div className="flex flex-col items-center w-5/12 gap-1.5">
                        <span className="text-white font-bold text-xs uppercase truncate max-w-[90px]">{matchList.find(m => m.id === selectedBetMatch)?.teamH}</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={goalsPredictH}
                          onChange={(e) => setGoalsPredictH(e.target.value)}
                          className="w-16 h-12 bg-slate-950 border border-white/10 focus:border-yellow-400 text-white text-center rounded-xl font-black text-lg focus:outline-none transition-colors"
                        />
                      </div>

                      <span className="text-slate-500 font-bold text-lg select-none">vs</span>

                      {/* Away Predict */}
                      <div className="flex flex-col items-center w-5/12 gap-1.5">
                        <span className="text-white font-bold text-xs uppercase truncate max-w-[90px]">{matchList.find(m => m.id === selectedBetMatch)?.teamA}</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={goalsPredictA}
                          onChange={(e) => setGoalsPredictA(e.target.value)}
                          className="w-16 h-12 bg-slate-950 border border-white/10 focus:border-yellow-400 text-white text-center rounded-xl font-black text-lg focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabs for betting modes */}
                  <div className="mb-6">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-2">3. Selecciona tu centro de apuesta</label>

                    <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                      <button
                        onClick={() => setBetMode('monetaria')}
                        className={`py-3 px-2 rounded-xl text-center flex flex-col items-center gap-1 transition-all ${betMode === 'monetaria'
                          ? 'bg-yellow-400 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        <DollarSign size={16} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Apuesta Monetaria</span>
                      </button>

                      <button
                        onClick={() => setBetMode('gratis')}
                        className={`py-3 px-2 rounded-xl text-center flex flex-col items-center gap-1 transition-all ${betMode === 'gratis'
                          ? 'bg-yellow-400 text-slate-950 font-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        <Gift size={16} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Apuestas Gratis</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode-specific content */}
                  <div className="bg-[#090d16]/50 rounded-2xl p-4 border border-white/5 mb-6 text-xs">
                    {betMode === 'monetaria' ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-slate-300 leading-relaxed font-medium">
                          <strong className="text-yellow-400">Apuestas Monetarias y Regalos:</strong> Ingresas dinero COP. Al acertar el marcador exacto, triplicas (3x) el monto apostado y ganas un regalo físico de la empresa (bebidas, botellas o combos premium).
                        </p>

                        <div className="flex items-center justify-between gap-4 mt-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor a apostar ($):</span>
                          <select
                            value={betAmountVal}
                            onChange={(e) => setBetAmountVal(parseInt(e.target.value))}
                            className="bg-slate-950 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
                          >
                            <option value="5000">$5.000 COP</option>
                            <option value="10000">$10.000 COP</option>
                            <option value="20000">$20.000 COP</option>
                            <option value="50000">$50.000 COP</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <p className="text-slate-300 leading-relaxed font-medium">
                          <strong className="text-yellow-400">Apuestas Gratis y Regalos Sorpresa:</strong> Participación 100% gratuita. Al acertar el marcador exacto, participas para ganar regalos sorpresa variados (bebidas de cortesía, gorras de Casa Smoke, snacks o descuentos).
                        </p>
                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest block mt-1">✓ Costo: $0 COP</span>
                      </div>
                    )}
                  </div>

                  {/* Place Bet Button */}
                  <button
                    onClick={handlePlaceBet}
                    className="w-full text-center py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-colors"
                  >
                    REGISTRAR APUESTA EN EL SISTEMA
                  </button>

                </div>
              </div>

              {/* Right Column: Registered Bets */}
              <div className="col-span-1 lg:col-span-5 flex flex-col gap-6">
                <div className="bg-[#0c1322]/85 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col">
                  <h3 className="text-white font-black text-sm tracking-wide uppercase mb-4 flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-400" /> TUS APUESTAS REGISTRADAS
                  </h3>

                  {bets.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-wider text-xs border border-dashed border-white/10 rounded-2xl">
                      No tienes apuestas en juego.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
                      {bets.map((b) => (
                        <div
                          key={b.id}
                          className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between text-xs"
                        >
                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                            <span className="font-black text-white uppercase tracking-wide truncate max-w-[140px]">{b.matchName}</span>
                            <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded uppercase ${b.status === 'Pendiente'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : b.status.includes('Ganada')
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                              }`}>
                              {b.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-300 mt-1">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Predicción</span>
                              <span className="font-black text-sm text-yellow-400">{b.predH} : {b.predA}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Tipo / Costo</span>
                              <span className="font-bold text-white uppercase tracking-wider">
                                {b.type === 'monetaria' ? `Monetaria ($${b.amount.toLocaleString()})` : 'Gratis 🎁'}
                              </span>
                            </div>
                          </div>

                          {(b.status.includes('Ganada') || b.status.includes('Perdida')) && (
                            <div className="mt-2 text-[9px] text-slate-400 italic">
                              Marcador Final: {b.finalH} - {b.finalA}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {bets.length > 0 && (
                    <button
                      onClick={() => {
                        setBets([]);
                        localStorage.removeItem('fifa_bets');
                      }}
                      className="text-[9px] font-black text-slate-500 hover:text-red-400 text-center uppercase tracking-widest mt-4 transition-colors"
                    >
                      Limpiar Historial de Apuestas
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>



        {/* 6. ORIGINAL HOME GALLERY INCLUDED AT THE BOTTOM */}
        <div className="border-t border-white/5 w-full pt-16 mt-16 select-none relative z-10">
          <div className="text-center mb-10">
            <h3 className="text-yellow-400 text-sm font-black tracking-widest uppercase mb-2">📸 EXPERIENCIA</h3>
            <h2 className="text-white text-3xl md:text-5xl font-black uppercase tracking-tight">NUESTRAS ZONAS</h2>
          </div>
          <HomeGallery />
        </div>

      </div>

      {/* 2. Floating Background Music Player */}
      <div className="fixed bottom-6 left-6 z-50 bg-[#0c1322]/95 backdrop-blur-md border border-yellow-500/25 rounded-2xl p-3 shadow-2xl flex items-center gap-3 w-72 transition-all">
        <audio ref={audioRef} src="/shakira.mp3" loop />

        {/* Spinning CD/Vinyl */}
        <motion.div
          animate={isPlayingMusic ? { rotate: 360 } : { rotate: 0 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="w-12 h-12 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-full flex items-center justify-center border border-yellow-400/30 flex-shrink-0 relative overflow-hidden shadow-lg shadow-yellow-500/10 cursor-pointer"
          onClick={toggleMusic}
        >
          {/* Inner label */}
          <div className="w-4 h-4 bg-slate-950 rounded-full border border-yellow-400/50 flex items-center justify-center">
            <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
          </div>
        </motion.div>

        {/* Title & Controls */}
        <div className="flex flex-col flex-grow select-none">
          <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest block leading-none mb-1">Música de Fondo</span>
          <span className="text-[10px] font-bold text-white uppercase truncate max-w-[170px] leading-tight" title="Shakira - Waka Waka">
            Shakira - Waka Waka (FIFA Anthem)
          </span>
          
          <div className="flex items-center gap-3 mt-1.5">
            {/* Play/Pause Button */}
            <button
              onClick={toggleMusic}
              className="text-slate-300 hover:text-yellow-400 transition-colors p-1"
              title={isPlayingMusic ? "Pausar" : "Reproducir"}
            >
              {isPlayingMusic ? (
                <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Volume bar */}
            <div className="flex items-center gap-1.5 flex-grow">
              <span className="text-slate-500 text-[10px] select-none">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
              <span className="text-slate-500 text-[10px] select-none">🔊</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;