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

const FloatingChat = () => {
  const {
    rooms,
    activeRoom,
    setActiveRoom,
    messages,
    sendMessage,
    createPrivateChat,
    onlineUsers,
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
  const [profileTarget, setProfileTarget] = useState(null);
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
    setProfileTarget(activeRoom.otherParticipant);
    setView('profile');
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
    if (!profileTarget) return;
    await blockUser(profileTarget.id);
    setView('list');
    setActiveRoom(null);
  };

  const handleReport = async () => {
    if (!profileTarget || !reportReason.trim()) return;
    await reportUser(profileTarget.id, reportReason);
    setReportOpen(false);
    setReportReason('');
    setView('list');
    setActiveRoom(null);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="h-[520px] w-[360px] overflow-hidden rounded-[28px] border border-yellow-500/20 bg-[#0c1322] shadow-[0_24px_80px_rgba(0,0,0,0.55)] pointer-events-auto"
            >
              {view === 'list' && (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#050510] px-4 py-4">
                    <div>
                      <h3 className="flex items-center gap-2 font-black text-white uppercase tracking-wider text-sm">
                        <MessageCircle className="text-yellow-400" size={20} />
                        Chat directo
                      </h3>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#8f98bf]">Usuarios online: {onlineList.length}</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="rounded-xl p-2 text-[#a7a8c7] transition hover:bg-white/5 hover:text-white">
                      <Minimize2 size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="mb-5 space-y-1">
                      <p className="px-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#70789f]">Conversaciones</p>
                      {loadingRooms ? (
                        <div className="p-4 text-xs text-[#a7a8c7]">Cargando conversaciones...</div>
                      ) : rooms.length === 0 ? (
                        <div className="rounded-2xl border border-white/5 bg-[#080d19] p-4 text-xs text-[#a7a8c7]">
                          No tienes conversaciones activas.
                        </div>
                      ) : (
                        rooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => setActiveRoom(room)}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5"
                          >
                            {room.displayImage ? (
                              <img src={room.displayImage} alt={room.displayName} className="h-10 w-10 rounded-2xl object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1f2235] font-bold text-yellow-400">
                                {room.displayName?.charAt(0)?.toUpperCase?.() || 'C'}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">{room.displayName}</p>
                              <p className="truncate text-xs text-[#8f98bf]">{room.is_group ? 'Grupo' : 'Mensaje privado'}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {onlineList.length > 0 && (
                      <div className="border-t border-white/5 pt-3">
                        <p className="px-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#70789f]">Disponibles ahora</p>
                        <div className="mt-2 space-y-1">
                          {onlineList.map((entry) => (
                            <button
                              key={entry.id}
                              onClick={() => handleStartDM(entry.id)}
                              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/5"
                            >
                              <div className="relative">
                                {entry.avatar_url ? (
                                  <img src={entry.avatar_url} alt={entry.full_name} className="h-9 w-9 rounded-2xl object-cover" />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1f2235] text-xs font-semibold text-white">
                                    {entry.full_name?.charAt(0)?.toUpperCase?.() || 'U'}
                                  </div>
                                )}
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#111322] bg-green-500" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-white">{entry.full_name || entry.email || 'Usuario'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'chat' && activeRoom && (
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#050510] px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={handleBackToList} className="rounded-xl p-2 text-[#a7a8c7] transition hover:bg-white/5 hover:text-white">
                        <ChevronLeft size={18} />
                      </button>
                      <button onClick={handleOpenProfile} className="flex items-center gap-2 text-left">
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

              {view === 'profile' && profileTarget && (
                <div className="flex h-full flex-col bg-[#0c1322]">
                  <div className="flex items-center gap-2 border-b border-white/10 bg-[#050510] px-3 py-3">
                    <button onClick={() => setView('chat')} className="rounded-xl p-2 text-[#a7a8c7] transition hover:bg-white/5 hover:text-white">
                      <ChevronLeft size={18} />
                    </button>
                    <span className="font-bold text-white">Usuario</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                        {profileTarget.avatar_url ? (
                          <img src={profileTarget.avatar_url} alt={profileTarget.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#1f2235] text-3xl font-bold text-white">
                            {profileTarget.full_name?.charAt(0)?.toUpperCase?.() || 'U'}
                          </div>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-white">{profileTarget.full_name || 'Usuario sin nombre'}</h2>
                      <p className="mt-1 text-sm text-[#a7a8c7]">{profileTarget.email || 'Correo no disponible'}</p>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8f98bf]">Información visible</h4>
                      <p className="mt-3 text-sm text-white">{profileTarget.full_name || 'Usuario sin nombre'}</p>
                      <p className="mt-2 text-sm text-[#a7a8c7]">{profileTarget.email || 'Sin correo visible'}</p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleBlock}
                        variant="destructive"
                        className="flex items-center gap-2 border border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        <Shield size={16} />
                        Bloquear
                      </Button>
                      <Button
                        onClick={() => setReportOpen(true)}
                        className="flex items-center gap-2 border border-yellow-500/50 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                      >
                        <Flag size={16} />
                        Reportar
                      </Button>
                    </div>
                  </div>
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
            'relative z-50 flex h-14 w-14 items-center justify-center rounded-full border text-slate-950 shadow-lg transition-all pointer-events-auto',
            isOpen ? 'border-yellow-400 bg-yellow-400' : 'border-yellow-400 bg-[#0c1322] text-yellow-400 hover:bg-[#111a2f]'
          )}
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
          {!isOpen && (onlineList.length > 0 || rooms.length > 0) && (
            <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-[#050510] bg-green-500" />
          )}
        </motion.button>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="border-white/10 bg-[#141926] text-white">
          <DialogHeader>
            <DialogTitle>Reportar usuario</DialogTitle>
            <DialogDescription className="text-[#a7a8c7]">
              Cuéntanos qué sucedió para que el equipo pueda revisar el caso.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="mb-2 block text-sm font-medium text-[#a7a8c7]">Motivo del reporte</label>
            <textarea
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              className="h-32 w-full resize-none rounded-lg border border-white/10 bg-[#050510] p-3 text-white outline-none focus:border-yellow-400"
              placeholder="Describe el comportamiento inapropiado..."
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setReportOpen(false)} variant="ghost" className="text-[#a7a8c7]">
              Cancelar
            </Button>
            <Button onClick={handleReport} className="bg-yellow-400 hover:bg-yellow-300 text-slate-950">
              Enviar reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingChat;
