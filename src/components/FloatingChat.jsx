import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { 
  MessageCircle, X, Minimize2, MoreVertical, Send, ChevronLeft, 
  Shield, Flag, User, Mic, Square, Smile 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { uploadFileToBucket } from '@/lib/storageUpload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import UserProfileViewModal from '@/components/UserProfileViewModal';

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", 
  "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", 
  "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", 
  "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", 
  "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", 
  "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", 
  "🤗", "🤔", "🫣", "🤭", "🤫", "🤥", "😶", "😶‍🌫️", "😐", "😑", 
  "😬", "🫠", "🤥", "😌", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
  "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘",
  "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚",
  "👋", "🤚", "🖐️", "🖖", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
  "🔥", "✨", "🌟", "⭐", "💥", "🌀", "🌈", "☀️", "🌧️", "❄️"
];

const FloatingChat = () => {
  const {
    rooms,
    activeRoom,
    setActiveRoom,
    messages,
    sendMessage,
    createPrivateChat,
    onlineUsers,
    communityUsers,
    loadingRooms,
    loadingMessages,
    user,
    blockUser,
    reportUser,
    blockedUsers,
    unreadRooms,
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list');
  const [messageInput, setMessageInput] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  
  // Voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Emoji Popover states
  const [emojiOpen, setEmojiOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Audio synthesizer beep helper using browser Web Audio API
  const playClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // higher pitch click
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (err) {}
  };

  // Browser Autoplay Policy Unlock
  useEffect(() => {
    const resumeAudio = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      } catch (e) {}
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);
    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
  }, []);

  useEffect(() => {
    setView(activeRoom ? 'chat' : 'list');
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  if (!user) return null;

  const onlineList = Object.values(onlineUsers).filter((entry) => entry.id !== user.id && !blockedUsers.includes(entry.id));

  const handleToggle = () => {
    playClickSound();
    setIsOpen((prev) => !prev);
  };

  const handleBackToList = () => {
    playClickSound();
    setActiveRoom(null);
    setView('list');
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!messageInput.trim()) return;
    playClickSound();
    sendMessage(messageInput);
    setMessageInput('');
  };

  const handleOpenProfile = () => {
    if (!activeRoom || activeRoom.is_group || !activeRoom.otherParticipant) return;
    playClickSound();
    setSelectedProfileId(activeRoom.otherParticipant.id);
  };

  const handleStartDM = async (targetId) => {
    playClickSound();
    const existingRoom = rooms.find((room) => !room.is_group && room.participants.some((participant) => participant.id === targetId));
    if (existingRoom) {
      setActiveRoom(existingRoom);
      setIsOpen(true);
      return;
    }

    const roomId = await createPrivateChat(targetId);
    if (roomId) setIsOpen(true);
  };

  const handleBlock = async () => {
    if (!selectedProfileId) return;
    playClickSound();
    await blockUser(selectedProfileId);
    setSelectedProfileId(null);
    setView('list');
    setActiveRoom(null);
  };

  const handleReport = async () => {
    if (!selectedProfileId || !reportReason.trim()) return;
    playClickSound();
    await reportUser(selectedProfileId, reportReason);
    setReportReason('');
    setReportOpen(false);
    setSelectedProfileId(null);
  };

  // Voice note handlers
  const startRecording = async () => {
    try {
      playClickSound();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
        
        try {
          setUploadingAttachment(true);
          const uploadedUrl = await uploadFileToBucket({
            file: audioFile,
            bucket: 'chat-attachments',
            folder: `rooms/${activeRoom.id}`
          });
          await sendMessage(uploadedUrl);
        } catch (err) {
          console.error(err);
          window.alert('No se pudo enviar la nota de voz.');
        } finally {
          setUploadingAttachment(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      window.alert('No se pudo acceder al micrófono para grabar.');
    }
  };

  const stopRecording = () => {
    playClickSound();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const isImageUrl = (value) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(value || '');
  const isAudioUrl = (value) => /\.(ogg|webm|mp3|wav|m4a)$/i.test(value || '') || (value || '').includes('voice_note_');
  const isUrl = (value) => /^https?:\/\/\S+$/i.test((value || '').trim());

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="flex h-[480px] w-[350px] flex-col rounded-3xl border border-pink-500/20 bg-[#0c0814]/95 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto shadow-pink-500/5"
            >
              {view === 'list' && (
                <div className="flex h-full flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-pink-500/10 bg-[#050510] px-4 py-4">
                    <span className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2">
                      <MessageCircle size={16} className="text-pink-500" /> Sala de Chat
                    </span>
                    <button onClick={handleToggle} className="rounded-xl p-1 text-[#a7a8c7] transition hover:bg-white/5 hover:text-white">
                      <Minimize2 size={16} />
                    </button>
                  </div>

                  {/* Body List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <p className="px-2 text-[10px] font-black uppercase tracking-[0.24em] text-pink-400">Tus Chats</p>
                      {loadingRooms ? (
                        <div className="p-4 text-xs text-slate-400">Cargando conversaciones...</div>
                      ) : rooms.length === 0 ? (
                        <div className="rounded-2xl border border-pink-500/10 bg-white/5 p-4 text-xs text-slate-400 mt-2">
                          No tienes conversaciones activas aún.
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {rooms.map((room) => {
                            const isUnread = unreadRooms.includes(room.id);
                            return (
                              <button
                                key={room.id}
                                onClick={() => { playClickSound(); setActiveRoom(room); }}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5"
                              >
                                {room.displayImage ? (
                                  <img src={room.displayImage} alt={room.displayName} className="h-10 w-10 rounded-2xl object-cover" />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-600/30 to-purple-600/30 border border-pink-500/30 font-bold text-pink-400 text-sm">
                                    {room.displayName?.charAt(0)?.toUpperCase?.() || 'C'}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-center gap-2">
                                    {/* Highlight unread rooms in Green */}
                                    <p className={cn("truncate text-xs font-semibold", 
                                      isUnread ? "text-green-400 font-bold" : "text-white"
                                    )}>
                                      {room.displayName}
                                    </p>
                                    {isUnread && (
                                      <span className="h-2 w-2 rounded-full bg-pink-500 flex-shrink-0 animate-pulse" />
                                    )}
                                  </div>
                                  <p className="truncate text-[10px] text-slate-400">{room.is_group ? 'Grupo' : 'Mensaje privado'}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-pink-500/10 pt-3">
                      <p className="px-2 text-[10px] font-black uppercase tracking-[0.24em] text-pink-400">Comunidad & Miembros</p>
                      <div className="mt-2 space-y-1">
                        {(() => {
                          const combined = [...(communityUsers || [])];
                          onlineList.forEach(u => {
                            if (!combined.some(c => c.id === u.id)) combined.push(u);
                          });

                          if (combined.length === 0) {
                            return <p className="px-2 text-xs text-slate-400 italic">No hay otros miembros registrados aún.</p>;
                          }

                          return combined.map((entry) => {
                            const presenceUser = onlineUsers[entry.id];
                            const isOnline = !!presenceUser;
                            const isIdle = presenceUser?.status === 'idle';
                            
                            return (
                              <div
                                key={entry.id}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white/5"
                              >
                                {/* Avatar Click triggers Public Profile View Modal */}
                                <div 
                                  className="relative cursor-pointer transform hover:scale-105 transition-transform"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playClickSound();
                                    setSelectedProfileId(entry.id);
                                  }}
                                  title="Ver Perfil"
                                >
                                  {entry.avatar_url ? (
                                    <img src={entry.avatar_url} alt={entry.username || entry.full_name} className="h-9 w-9 rounded-2xl object-cover" />
                                  ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-pink-500/20 text-xs font-semibold text-white">
                                      {entry.full_name?.charAt(0)?.toUpperCase?.() || 'U'}
                                    </div>
                                  )}
                                  {isOnline ? (
                                    isIdle ? (
                                      <>
                                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0c0814] bg-yellow-500 animate-ping" />
                                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0c0814] bg-yellow-500" />
                                      </>
                                    ) : (
                                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0c0814] bg-green-500 animate-pulse" />
                                    )
                                  ) : (
                                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0c0814] bg-red-600" />
                                  )}
                                </div>
                                
                                {/* Info click triggers active DM chat */}
                                <div 
                                  className="min-w-0 flex-1 cursor-pointer"
                                  onClick={() => handleStartDM(entry.id)}
                                >
                                  <p className="truncate text-xs font-semibold text-white">
                                    {entry.username ? `@${entry.username}` : (entry.full_name || entry.email?.split('@')[0])}
                                  </p>
                                  <p className="truncate text-[10px] text-pink-300">
                                    {isOnline ? (isIdle ? '🟡 Ausente' : '🟢 En línea') : '🔴 Desconectado'}
                                  </p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === 'chat' && activeRoom && (
                <div className="flex h-full flex-col">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#050510] px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={handleBackToList} className="rounded-xl p-2 text-[#a7a8c7] transition hover:bg-white/5 hover:text-white">
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={handleOpenProfile} className="flex items-center gap-2 text-left" title="Ver Perfil">
                        {activeRoom.displayImage ? (
                          <img src={activeRoom.displayImage} alt={activeRoom.displayName} className="h-8 w-8 rounded-2xl object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#1f2235] text-xs font-bold text-yellow-400">
                            {activeRoom.displayName?.charAt(0)?.toUpperCase?.() || 'C'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="max-w-[170px] truncate text-sm font-bold text-white">{activeRoom.displayName}</p>
                          {!activeRoom.is_group && <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-green-500">Activo</p>}
                        </div>
                      </button>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-xl p-2 text-[#a7a8c7] transition hover:bg-white/5 hover:text-white">
                          <MoreVertical size={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="mr-4 border-white/10 bg-[#141926] text-white">
                        <DropdownMenuItem onClick={handleOpenProfile} className="cursor-pointer hover:bg-white/10">
                          <User className="mr-2 h-4 w-4 text-[#ff2df0]" />
                          Ver perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBackToList} className="cursor-pointer hover:bg-white/10">
                          <X className="mr-2 h-4 w-4" />
                          Cerrar chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto bg-[#0c1322] p-4">
                    {loadingMessages ? (
                      <div className="py-4 text-center text-xs text-[#a7a8c7]">Cargando mensajes...</div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const isMe = message.sender_id === user.id;
                          return (
                            <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={cn(
                                  'max-w-[82%] rounded-2xl px-3.5 py-2 text-sm break-words flex flex-col',
                                  isMe
                                    ? 'bg-yellow-400 text-slate-950 rounded-br-md font-medium'
                                    : 'border border-white/5 bg-[#1f2235] text-[#e0e0e0] rounded-bl-md'
                                )}
                              >
                                {isUrl(message.content) ? (
                                  isImageUrl(message.content) ? (
                                    <a href={message.content} target="_blank" rel="noopener noreferrer" className="block max-w-full">
                                      <img src={message.content} alt="Adjunto" className="max-w-full rounded-lg mb-1" />
                                    </a>
                                  ) : isAudioUrl(message.content) ? (
                                    <audio src={message.content} controls className="max-w-full rounded-lg mt-1 bg-transparent filter invert" />
                                  ) : (
                                    <a href={message.content} target="_blank" rel="noopener noreferrer" className="underline break-all">
                                      {message.content}
                                    </a>
                                  )
                                ) : (
                                  <span>{message.content}</span>
                                )}
                                <span className={cn(
                                  "text-[9px] opacity-40 self-end mt-1 block font-mono",
                                  isMe ? "text-slate-950" : "text-[#a7a8c7]"
                                )}>
                                  {new Date(message.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })} - {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/10 bg-[#050510] p-3">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={uploadingAttachment}
                      className={cn(
                        "p-1.5 rounded-full transition-all flex items-center justify-center shrink-0",
                        isRecording 
                          ? "bg-red-500 text-white animate-pulse" 
                          : "text-[#a7a8c7] hover:text-white"
                      )}
                      title={isRecording ? "Detener y enviar nota de voz" : "Grabar nota de voz"}
                    >
                      {isRecording ? <Square size={16} /> : <Mic size={16} />}
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        placeholder={isRecording ? "Grabando nota de voz..." : "Escribe un mensaje..."}
                        disabled={isRecording}
                        className="w-full rounded-full border border-white/10 bg-[#0c1322] py-2 pl-4 pr-10 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-400 disabled:opacity-50"
                      />
                      <button 
                        type="button" 
                        onClick={() => { playClickSound(); setEmojiOpen(!emojiOpen); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a8c7] hover:text-white transition-colors"
                        disabled={isRecording}
                        title="Insertar Emoji"
                      >
                        <Smile size={16} />
                      </button>
                      
                      {emojiOpen && (
                        <div className="absolute bottom-10 right-0 z-30 w-56 bg-[#0c1322] border border-white/10 rounded-2xl p-2.5 shadow-2xl">
                          <div className="flex justify-between items-center mb-1.5 border-b border-white/5 pb-1">
                            <span className="text-[10px] font-bold text-slate-300">Emojis</span>
                            <button type="button" onClick={() => setEmojiOpen(false)} className="text-[#a7a8c7] hover:text-white">
                              <X size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto pr-1 select-none scrollbar-thin">
                            {POPULAR_EMOJIS.map((emoji, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setMessageInput(prev => prev + emoji);
                                }}
                                className="text-base hover:scale-125 transition-transform duration-100 flex items-center justify-center p-0.5"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!messageInput.trim() || isRecording}
                      className="rounded-full bg-yellow-400 p-2 text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50 shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleToggle}
          className={cn(
            'relative z-50 flex h-14 w-14 items-center justify-center rounded-full border shadow-xl transition-all pointer-events-auto',
            isOpen
              ? 'border-pink-400 bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-pink-500/30'
              : 'border-pink-500/50 bg-[#0c0814]/95 text-pink-400 hover:bg-[#150d26] shadow-[0_0_25px_rgba(236,72,153,0.35)]',
            !isOpen && unreadRooms.length > 0 && 'animate-chat-shake'
          )}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
          {!isOpen && unreadRooms.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full border-2 border-[#0c0814] bg-pink-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-pink-500/30">
              {unreadRooms.length}
            </span>
          )}
        </motion.button>
      </div>

      {/* Shake animation styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes chatShake {
          0%, 100% { transform: scale(1) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: scale(1.05) rotate(-5deg); }
          20%, 40%, 60%, 80% { transform: scale(1.05) rotate(5deg); }
        }
        .animate-chat-shake {
          animation: chatShake 0.5s infinite;
        }
      `}} />

      {/* User Profile View Dialog */}
      <UserProfileViewModal 
        userId={selectedProfileId}
        isOpen={selectedProfileId !== null}
        onClose={() => setSelectedProfileId(null)}
      />

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="border-pink-500/30 bg-[#0c0814] text-white">
          <DialogHeader>
            <DialogTitle>Reportar usuario</DialogTitle>
            <DialogDescription className="text-slate-400">
              Cuéntanos qué sucedió para que el equipo pueda revisar el caso.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-2 block text-xs font-semibold text-slate-300">Motivo del reporte</label>
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              className="h-32 w-full resize-none rounded-xl border border-pink-500/20 bg-[#05030a] p-3 text-white text-xs outline-none focus:border-pink-400"
              placeholder="Describe el comportamiento inapropiado..."
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setReportOpen(false)} variant="ghost" className="text-slate-400">
              Cancelar
            </Button>
            <Button onClick={handleReport} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider">
              Enviar reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingChat;
