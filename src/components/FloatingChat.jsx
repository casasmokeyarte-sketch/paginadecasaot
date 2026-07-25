import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageCircle, X, Minimize2, MoreVertical, Send, ChevronLeft, Shield, Flag, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list');
  const [messageInput, setMessageInput] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setView(activeRoom ? 'chat' : 'list');
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  if (!user) return null;

  const onlineList = Object.values(onlineUsers).filter((entry) => entry.id !== user.id && !blockedUsers.includes(entry.id));

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleBackToList = () => {
    setActiveRoom(null);
    setView('list');
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  const handleOpenProfile = () => {
    if (!activeRoom || activeRoom.is_group || !activeRoom.otherParticipant) return;
    setSelectedProfileId(activeRoom.otherParticipant.id);
  };

  const handleStartDM = async (targetId) => {
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
    await blockUser(selectedProfileId);
    setSelectedProfileId(null);
    setView('list');
    setActiveRoom(null);
  };

  const handleReport = async () => {
    if (!selectedProfileId || !reportReason.trim()) return;
    await reportUser(selectedProfileId, reportReason);
    setReportReason('');
    setReportOpen(false);
    setSelectedProfileId(null);
  };

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
                          {rooms.map((room) => (
                            <button
                              key={room.id}
                              onClick={() => setActiveRoom(room)}
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
                                <p className="truncate text-xs font-semibold text-white">{room.displayName}</p>
                                <p className="truncate text-[10px] text-slate-400">{room.is_group ? 'Grupo' : 'Mensaje privado'}</p>
                              </div>
                            </button>
                          ))}
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
                            const isOnline = !!onlineUsers[entry.id];
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
                                  {isOnline && (
                                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0c0814] bg-green-500 animate-pulse" />
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
                                    {isOnline ? '🟢 En línea' : 'Enviar mensaje'}
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
                          <User className="mr-2 h-4 w-4" />
                          Ver usuario
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
                                  'max-w-[82%] rounded-2xl px-3.5 py-2 text-sm break-words',
                                  isMe
                                    ? 'bg-yellow-400 text-slate-950 rounded-br-md font-medium'
                                    : 'border border-white/5 bg-[#1f2235] text-[#e0e0e0] rounded-bl-md'
                                )}
                              >
                                {message.content}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/10 bg-[#050510] p-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      placeholder="Escribe un mensaje..."
                      className="flex-1 rounded-full border border-white/10 bg-[#0c1322] px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-yellow-400"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="rounded-full bg-yellow-400 p-2 text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
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
              : 'border-pink-500/50 bg-[#0c0814]/95 text-pink-400 hover:bg-[#150d26] shadow-[0_0_25px_rgba(236,72,153,0.35)]'
          )}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
          {!isOpen && (onlineList.length > 0 || rooms.length > 0) && (
            <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-[#050510] bg-pink-500 animate-pulse" />
          )}
        </motion.button>
      </div>

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
