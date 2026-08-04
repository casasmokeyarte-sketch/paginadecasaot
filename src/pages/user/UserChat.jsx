import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, Users, MessageSquare, Plus, Hash, User, 
  MoreVertical, Search, Circle, Smile, Paperclip,
  Mic, Square, Shield, Flag, X, ShieldAlert, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { uploadFileToBucket } from '@/lib/storageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UserProfileViewModal from '@/components/UserProfileViewModal';
import { PresenceDot, PresenceLabel } from '@/components/chat/PresenceIndicator';

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

const UserChat = () => {
  const { 
    rooms, 
    activeRoom, 
    setActiveRoom, 
    messages, 
    sendMessage, 
    createPrivateChat, 
    createGroupChat,
    blockUser,
    unblockUser,
    reportUser,
    onlineUsers, 
    communityUsers = [],
    loadingRooms,
    loadingMessages,
    user,
    unreadRooms,
    blockedUsers,
    blockedByUsers
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  
  // Group Creation State
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Profile Modal State
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  // Search parameters for redirect DMs
  const [searchParams, setSearchParams] = useSearchParams();
  const dmParam = searchParams.get('dm');

  // Voice Note Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Emoji Popover state
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Report dialog in UserChat
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Lightbox Avatar State
  const [lightboxUser, setLightboxUser] = useState(null);

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

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle URL redirect query parameter (?dm=user_id)
  useEffect(() => {
    if (dmParam && rooms.length > 0) {
      handleStartDM(dmParam);
      setSearchParams({}, { replace: true });
    }
  }, [dmParam, rooms]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    playClickSound();
    sendMessage(messageInput);
    setMessageInput('');
  };

  const isImageUrl = (value) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(value || '');
  const isAudioUrl = (value) => /\.(ogg|webm|mp3|wav|m4a)$/i.test(value || '') || (value || '').includes('voice_note_');
  const isUrl = (value) => /^https?:\/\/\S+$/i.test((value || '').trim());

  const handleAttachClick = () => {
    playClickSound();
    attachmentInputRef.current?.click();
  };

  const handleAttachFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeRoom) return;

    try {
      setUploadingAttachment(true);
      const uploadedUrl = await uploadFileToBucket({
        file,
        bucket: 'chat-attachments',
        folder: `rooms/${activeRoom.id}`
      });
      await sendMessage(uploadedUrl);
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'No se pudo adjuntar el archivo.');
    } finally {
      setUploadingAttachment(false);
    }
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;
    playClickSound();
    const roomId = await createGroupChat(newGroupName, selectedUsers);
    setNewGroupOpen(false);
    setNewGroupName('');
    setSelectedUsers([]);
  };

  const handleStartDM = async (targetUserId) => {
    playClickSound();
    const existingRoom = rooms.find(r => 
      !r.is_group && r.participants.some(p => p.id === targetUserId)
    );

    if (existingRoom) {
      setActiveRoom(existingRoom);
    } else {
      const roomId = await createPrivateChat(targetUserId);
      if (roomId) {
        const createdRoom = rooms.find(r => r.id === roomId);
        setActiveRoom(
          createdRoom || {
            id: roomId,
            is_group: false,
            displayName: 'Chat Privado',
            participants: []
          }
        );
      }
    }
  };

  const handleBlock = async () => {
    if (!activeRoom || activeRoom.is_group || !activeRoom.otherParticipant) return;
    playClickSound();
    await blockUser(activeRoom.otherParticipant.id);
  };

  const handleUnblock = async () => {
    if (!activeRoom || activeRoom.is_group || !activeRoom.otherParticipant) return;
    playClickSound();
    await unblockUser(activeRoom.otherParticipant.id);
  };

  const handleReport = async () => {
    if (!activeRoom || !activeRoom.otherParticipant || !reportReason.trim()) return;
    playClickSound();
    await reportUser(activeRoom.otherParticipant.id, reportReason);
    setReportReason('');
    setReportOpen(false);
  };

  const toggleUserSelection = (userId) => {
    playClickSound();
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  const onlineList = Object.values(onlineUsers).filter(u => u.id !== user?.id);

  // Check if room communication is blocked by either user
  const isRoomBlocked = activeRoom && !activeRoom.is_group && activeRoom.otherParticipant && (
    blockedUsers.includes(activeRoom.otherParticipant.id) ||
    blockedByUsers.includes(activeRoom.otherParticipant.id)
  );

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] flex flex-col md:flex-row bg-[#111322] border border-white/10 rounded-2xl overflow-hidden relative">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-[#0b0c15]">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-[#ff2df0]" /> Chats
          </h2>
          
          <Dialog open={newGroupOpen} onOpenChange={(open) => { playClickSound(); setNewGroupOpen(open); }}>
            <DialogTrigger asChild>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#a7a8c7] hover:text-white" title="Crear Grupo">
                <Plus size={20} />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1c2e] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                <DialogDescription className="text-[#a7a8c7]">
                  Define un nombre e invita usuarios conectados para abrir un chat grupal.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a7a8c7]">Nombre del Grupo</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-[#050510] border border-white/10 rounded-lg p-3 text-white focus:border-[#ff2df0] outline-none"
                    placeholder="Ej. Artistas Tattoo"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a7a8c7]">Invitar Otros Usuarios Online</label>
                  <div className="max-h-40 overflow-y-auto space-y-2 border border-white/10 rounded-lg p-2 bg-[#050510]">
                    {onlineList.length === 0 ? (
                      <p className="text-xs text-center text-[#a7a8c7] py-2">No hay otros usuarios online para invitar.</p>
                    ) : (
                      onlineList.map(u => (
                        <div 
                          key={u.id}
                          onClick={() => toggleUserSelection(u.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedUsers.includes(u.id) ? 'bg-[#ff2df0]/20 border border-[#ff2df0]/50' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border ${selectedUsers.includes(u.id) ? 'bg-[#ff2df0] border-[#ff2df0]' : 'border-[#a7a8c7]'}`}></div>
                          <span className="text-sm">{u.username ? `@${u.username}` : (u.full_name || u.email?.split('@')[0])}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGroup} disabled={!newGroupName || selectedUsers.length === 0} className="bg-[#ff2df0] hover:bg-[#d91cb8]">
                  Crear Grupo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto">
           {/* Section: Rooms */}
           <div className="p-2">
             <h3 className="text-xs font-bold text-[#a7a8c7] uppercase px-2 mb-2">Conversaciones</h3>
             {loadingRooms ? (
               <div className="px-4 py-2 text-sm text-[#a7a8c7]">Cargando chats...</div>
             ) : rooms.length === 0 ? (
               <div className="px-4 py-8 text-center text-sm text-[#a7a8c7]">No tienes chats activos.</div>
             ) : (
               <div className="space-y-1">
                 {rooms.map(room => {
                   const isUnread = unreadRooms.includes(room.id);
                   const otherParticipant = room.participants.find(p => p.id !== user?.id);
                   const otherPresenceStatus = onlineUsers[otherParticipant?.id]?.status || 'offline';
                   
                   return (
                     <button
                       key={room.id}
                       onClick={() => { playClickSound(); setActiveRoom(room); }}
                       className={cn(
                         "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group",
                         activeRoom?.id === room.id ? "bg-[#ff2df0]/10 border border-[#ff2df0]/20" : "hover:bg-white/5 border border-transparent"
                       )}
                     >
                       {/* Click avatar to open lightbox preview */}
                       <div 
                         onClick={(e) => {
                           if (otherParticipant) {
                             e.stopPropagation();
                             playClickSound();
                             setLightboxUser(otherParticipant);
                           }
                         }}
                         className={cn(
                           "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden cursor-zoom-in",
                           room.is_group ? "bg-[#00e5ff]/20 text-[#00e5ff]" : ""
                         )}
                       >
                         {room.is_group ? (
                           <Hash size={18} />
                         ) : (
                           <img src={otherParticipant?.avatar_url || '/default-avatar.png'} alt="Avatar" className="w-full h-full object-cover" />
                         )}
                       </div>
                       
                       <div className="flex-1 overflow-hidden">
                         <div className="flex justify-between items-center gap-2">
                           <p className={cn("font-medium truncate", 
                             isUnread 
                               ? "text-green-400 font-bold" 
                               : (activeRoom?.id === room.id ? "text-white" : "text-[#a7a8c7] group-hover:text-white")
                           )}>
                             {room.displayName}
                           </p>
                           {isUnread && (
                             <span className="w-2.5 h-2.5 bg-pink-500 rounded-full flex-shrink-0 animate-pulse" />
                           )}
                         </div>
                         {room.is_group ? (
                           <p className="text-xs text-[#a7a8c7] truncate">
                             {room.participants.length} participantes
                           </p>
                         ) : (
                           <PresenceLabel status={otherPresenceStatus} className="mt-1" />
                         )}
                       </div>
                     </button>
                   );
                 })}
               </div>
             )}
           </div>

           {/* Section: Community & Members */}
           <div className="p-2 border-t border-white/5 mt-2">
              <h3 className="text-xs font-bold text-[#a7a8c7] uppercase px-2 mb-2 flex items-center justify-between">
                <span>Comunidad y Miembros</span>
                <span className="bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded text-[10px]">
                  {communityUsers.length || onlineList.length} miembros
                </span>
              </h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {(() => {
                  const combinedList = [...communityUsers];
                  onlineList.forEach(u => {
                    if (!combinedList.some(c => c.id === u.id)) {
                      combinedList.push(u);
                    }
                  });

                  if (combinedList.length === 0) {
                    return <p className="px-2 text-xs text-[#a7a8c7] italic">No hay otros miembros registrados.</p>;
                  }

                  return combinedList.map(u => {
                    const presenceUser = onlineUsers[u.id];
                    const presenceStatusValue = presenceUser?.status || 'offline';
                    
                    return (
                      <div
                        key={u.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-left group"
                      >
                        {/* Clickable Avatar to View Lightbox */}
                        <div 
                          className="relative cursor-pointer transform hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            setLightboxUser(u);
                          }}
                          title="Ampliar foto de perfil"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500/30 to-purple-600/30 border border-pink-500/30 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                            <img src={u.avatar_url || '/default-avatar.png'} alt="Avatar" className="w-full h-full object-cover cursor-zoom-in" />
                          </div>
                          <PresenceDot
                            status={presenceStatusValue}
                            className="absolute bottom-0 right-0 ring-2 ring-[#0b0c15]"
                            size="sm"
                          />
                        </div>
                        
                        {/* Clickable Username/Status to Start DM */}
                        <div 
                          className="flex-1 overflow-hidden cursor-pointer"
                          onClick={() => handleStartDM(u.id)}
                        >
                          <p className="text-xs font-medium text-[#a7a8c7] group-hover:text-white truncate">
                            {u.username ? `@${u.username}` : (u.full_name || u.email?.split('@')[0])}
                          </p>
                          <PresenceLabel status={presenceStatusValue} className="mt-1" />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
           </div>
        </div>

        {/* Sidebar Footer Decoration */}
        <div className="p-3 border-t border-white/10 bg-[#07080e]/95 flex items-center gap-3">
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-[#ff2df0]/20 rounded-xl blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <img 
              src="/at-0.png" 
              alt="Chat-OT Icon" 
              className="relative w-12 h-12 rounded-xl object-cover border border-[#ff2df0]/40 group-hover:border-[#ff2df0] transition-colors"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff2df0]">Casa Smoke & Arte</p>
            <p className="text-[11px] font-bold text-white uppercase tracking-wider truncate">CHAT-OT ACTIVO</p>
            <span className="text-[9px] text-slate-500 block truncate">Estudio de Tatuajes & Smoke Shop</span>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#111322] relative">
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#a7a8c7] p-8 text-center">
             <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
               <MessageSquare size={40} className="opacity-50" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">¡Bienvenido al Chat!</h3>
             <p className="max-w-md mx-auto">
               Selecciona una conversación existente o inicia un chat privado con los usuarios conectados. También puedes crear grupos para debatir temas específicos.
             </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#111322]/50 backdrop-blur-sm absolute w-full top-0 z-10">
              <div className="flex items-center gap-3">
                 <div 
                   onClick={(e) => {
                     if (!activeRoom.is_group && activeRoom.otherParticipant) {
                       playClickSound();
                       setLightboxUser(activeRoom.otherParticipant);
                     }
                   }}
                   className={cn(
                     "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0",
                     !activeRoom.is_group && activeRoom.otherParticipant ? "cursor-zoom-in" : "",
                     activeRoom.is_group ? "bg-[#00e5ff]/20 text-[#00e5ff]" : ""
                   )}
                 >
                   {activeRoom.is_group ? (
                     <Users size={20} />
                   ) : (
                     <img src={activeRoom.otherParticipant?.avatar_url || '/default-avatar.png'} alt="Avatar" className="w-full h-full object-cover" />
                   )}
                 </div>
                 <div>
                   <h3 className="font-bold text-white">{activeRoom.displayName}</h3>
                   {!activeRoom.is_group && (
                     <PresenceLabel
                       status={onlineUsers[activeRoom.otherParticipant?.id]?.status || 'offline'}
                       className="mt-1"
                     />
                   )}
                   {activeRoom.is_group && (
                     <p className="text-xs text-[#a7a8c7]">
                        {activeRoom.participants.map(p => p.username ? `@${p.username}` : p.full_name?.split(' ')[0]).join(', ').slice(0, 30)}
                        {activeRoom.participants.length > 3 ? '...' : ''}
                     </p>
                   )}
                 </div>
              </div>
              
              {/* Dynamic Header Options Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-xl p-2 text-[#a7a8c7] transition hover:bg-white/5 hover:text-white">
                    <MoreVertical size={20} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mr-4 border-white/10 bg-[#141926] text-white">
                  {!activeRoom.is_group && activeRoom.otherParticipant && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => { playClickSound(); setSelectedProfileId(activeRoom.otherParticipant.id); }} 
                        className="cursor-pointer hover:bg-white/10"
                      >
                        <User className="mr-2 h-4 w-4 text-[#ff2df0]" />
                        Ver perfil
                      </DropdownMenuItem>
                      
                      {/* Dynamic Block/Unblock Option */}
                      {blockedUsers.includes(activeRoom.otherParticipant.id) ? (
                        <DropdownMenuItem 
                          onClick={handleUnblock} 
                          className="cursor-pointer hover:bg-white/10 text-green-400 font-bold"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Desbloquear usuario
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={handleBlock} 
                          className="cursor-pointer hover:bg-white/10 text-red-400"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Bloquear usuario
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem 
                        onClick={() => { playClickSound(); setReportOpen(true); }} 
                        className="cursor-pointer hover:bg-white/10 text-yellow-400"
                      >
                        <Flag className="mr-2 h-4 w-4" />
                        Reportar usuario
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => { playClickSound(); setActiveRoom(null); }} 
                    className="cursor-pointer hover:bg-white/10"
                  >
                    <X className="mr-2 h-4 w-4 text-slate-400" />
                    Cerrar chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {loadingMessages ? (
                <div className="text-center py-10 text-[#a7a8c7]">Cargando historial...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#a7a8c7]">No hay mensajes aún.</p>
                  <p className="text-xs text-[#a7a8c7] mt-1">¡Sé el primero en escribir!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  const showHeader = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
                  
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {showHeader && !isMe && activeRoom.is_group && (
                         <span 
                           className="text-xs text-[#a7a8c7] ml-2 mb-1 cursor-pointer hover:text-pink-400 transition-colors"
                           onClick={() => { playClickSound(); setSelectedProfileId(msg.sender_id); }}
                           title="Ver Perfil"
                         >
                           {msg.profiles?.username ? `@${msg.profiles.username}` : (msg.profiles?.full_name || 'Usuario')}
                         </span>
                      )}
                      
                      <div className={cn(
                        "max-w-[75%] px-4 py-2 rounded-2xl text-sm relative group flex flex-col",
                        isMe 
                          ? "bg-[#ff2df0] text-white rounded-br-none" 
                          : "bg-[#1f2235] text-[#e0e0e0] rounded-bl-none border border-white/5"
                      )}>
                        {isUrl(msg.content) ? (
                          isImageUrl(msg.content) ? (
                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="block max-w-full">
                              <img src={msg.content} alt="Adjunto" className="max-w-full rounded-lg mb-1" />
                            </a>
                          ) : isAudioUrl(msg.content) ? (
                            <audio src={msg.content} controls className="max-w-full rounded-lg mt-1 bg-transparent filter invert" />
                          ) : (
                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="underline break-all">
                              {msg.content}
                            </a>
                          )
                        ) : (
                          <span>{msg.content}</span>
                        )}
                        <span className="text-[10px] opacity-50 block text-right mt-1 font-mono">
                          {new Date(msg.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })} - {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0b0c15] border-t border-white/10">
              {isRoomBlocked && (
                <div className="mb-2 text-center text-xs text-red-400 bg-red-950/20 border border-red-500/20 py-2 rounded-xl">
                  ⚠️ El chat está bloqueado con este usuario. No puedes enviar ni recibir mensajes.
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachFile}
                />
                
                {/* Paperclip Attach Button */}
                <button
                  type="button"
                  onClick={handleAttachClick}
                  disabled={uploadingAttachment || isRoomBlocked}
                  className="text-[#a7a8c7] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <Paperclip size={20} />
                </button>
                
                {/* Microphone / Record voice note button */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={uploadingAttachment || isRoomBlocked}
                  className={cn(
                    "p-2 rounded-full transition-all flex items-center justify-center shrink-0 disabled:opacity-30",
                    isRecording 
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                      : "text-[#a7a8c7] hover:text-[#ff2df0]"
                  )}
                  title={isRecording ? "Detener y enviar nota de voz" : "Grabar nota de voz"}
                >
                  {isRecording ? <Square size={20} className="text-white" /> : <Mic size={20} />}
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={
                      isRoomBlocked 
                        ? 'Chat bloqueado' 
                        : uploadingAttachment 
                          ? 'Subiendo archivo...' 
                          : isRecording 
                            ? 'Grabando audio...' 
                            : 'Escribe un mensaje...'
                    }
                    disabled={isRecording || isRoomBlocked}
                    className="w-full bg-[#111322] border border-white/10 rounded-full py-3 pl-4 pr-10 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all disabled:opacity-50"
                  />
                  <button 
                    type="button" 
                    onClick={() => { playClickSound(); setEmojiOpen(!emojiOpen); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a8c7] hover:text-[#ff2df0] transition-colors"
                    disabled={isRecording || isRoomBlocked}
                    title="Insertar Emoji"
                  >
                    <Smile size={20} />
                  </button>
                  
                  {emojiOpen && (
                    <div className="absolute bottom-12 right-0 z-30 w-64 bg-[#0c1322] border border-white/10 rounded-2xl p-3 shadow-2xl">
                      <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1.5">
                        <span className="text-xs font-bold text-slate-300">Emojis populares</span>
                        <button 
                          type="button" 
                          onClick={() => setEmojiOpen(false)}
                          className="text-[#a7a8c7] hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto pr-1 select-none scrollbar-thin">
                        {POPULAR_EMOJIS.map((emoji, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setMessageInput(prev => prev + emoji);
                            }}
                            className="text-lg hover:scale-125 transition-transform duration-100 flex items-center justify-center p-1"
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
                  disabled={!messageInput.trim() || uploadingAttachment || isRecording || isRoomBlocked}
                  className="bg-[#ff2df0] hover:bg-[#d91cb8] text-white p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,45,240,0.3)] hover:shadow-[0_0_15px_rgba(255,45,240,0.5)] shrink-0"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Reusable Public Profile View Dialog */}
      <UserProfileViewModal 
        userId={selectedProfileId}
        isOpen={selectedProfileId !== null}
        onClose={() => setSelectedProfileId(null)}
      />

      {/* Report User Dialog */}
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

      {/* Lightbox Profile Avatar Modal */}
      <AnimatePresence>
        {lightboxUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setLightboxUser(null)}
          >
            <button 
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all"
              onClick={() => setLightboxUser(null)}
            >
              <X size={20} />
            </button>
            
            <motion.img 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={lightboxUser.avatar_url || '/default-avatar.png'}
              alt={lightboxUser.username || lightboxUser.full_name}
              className="max-h-[60vh] max-w-full rounded-2xl object-contain border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div 
              className="mt-6 text-center space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white">
                {lightboxUser.username ? `@${lightboxUser.username}` : lightboxUser.full_name}
              </h3>
              
              <button
                onClick={() => {
                  playClickSound();
                  setSelectedProfileId(lightboxUser.id);
                  setLightboxUser(null);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-pink-500/20 uppercase tracking-wider flex items-center gap-1.5 justify-center mx-auto"
              >
                <Eye size={14} /> Ver Información de Perfil
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserChat;
