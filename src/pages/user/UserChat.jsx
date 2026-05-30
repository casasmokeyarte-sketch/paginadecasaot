import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { 
  Send, Users, MessageSquare, Plus, Hash, User, 
  MoreVertical, Search, Circle, Smile, Paperclip
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

const UserChat = () => {
  const { 
    rooms, 
    activeRoom, 
    setActiveRoom, 
    messages, 
    sendMessage, 
    createPrivateChat, 
    createGroupChat,
    onlineUsers, 
    loadingRooms,
    loadingMessages,
    user
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  
  // Group Creation State
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  const isImageUrl = (value) => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(value || '');
  const isUrl = (value) => /^https?:\/\/\S+$/i.test((value || '').trim());

  const handleAttachClick = () => {
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;
    const roomId = await createGroupChat(newGroupName, selectedUsers);
    setNewGroupOpen(false);
    setNewGroupName('');
    setSelectedUsers([]);
    if(roomId) {
       const room = rooms.find(r => r.id === roomId); // Might need a refetch logic delay in hook but hook handles it
       // setActiveRoom(room); // Optimistic selection can be added later
    }
  };

  const handleStartDM = async (targetUserId) => {
    // Check if we already have a DM room (client-side filter of loaded rooms)
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

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  
  // Prepare online users list (excluding the current account)
  const onlineList = Object.values(onlineUsers).filter(u => u.id !== user?.id);

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] flex flex-col md:flex-row bg-[#111322] border border-white/10 rounded-2xl overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-80 border-r border-white/10 flex flex-col bg-[#0b0c15]">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-[#ff2df0]" /> Chats
          </h2>
          
          <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
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
                          <span className="text-sm">{u.full_name}</span>
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
                 {rooms.map(room => (
                   <button
                     key={room.id}
                     onClick={() => setActiveRoom(room)}
                     className={cn(
                       "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group",
                       activeRoom?.id === room.id ? "bg-[#ff2df0]/10 border border-[#ff2df0]/20" : "hover:bg-white/5 border border-transparent"
                     )}
                   >
                     <div className={cn(
                       "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0",
                       room.is_group ? "bg-[#00e5ff]/20 text-[#00e5ff]" : "bg-[#f4c542]/20 text-[#f4c542]"
                     )}>
                       {room.is_group ? <Hash size={18} /> : <User size={18} />}
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <p className={cn("font-medium truncate", activeRoom?.id === room.id ? "text-white" : "text-[#a7a8c7] group-hover:text-white")}>
                         {room.displayName}
                       </p>
                       <p className="text-xs text-[#a7a8c7] truncate">
                         {room.is_group ? `${room.participants.length} participantes` : 'Mensaje privado'}
                       </p>
                     </div>
                   </button>
                 ))}
               </div>
             )}
           </div>

           {/* Section: Online Users */}
           <div className="p-2 border-t border-white/5 mt-2">
              <h3 className="text-xs font-bold text-[#a7a8c7] uppercase px-2 mb-2 flex items-center justify-between">
                <span>Otros Usuarios Online</span>
                <span className="bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded text-[10px]">{onlineList.length}</span>
              </h3>
              <div className="space-y-1">
                {onlineList.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleStartDM(u.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all text-left"
                  >
                    <div className="relative">
                       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                         {u.full_name?.charAt(0).toUpperCase()}
                       </div>
                       <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0b0c15] rounded-full"></span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                       <p className="text-sm font-medium text-[#a7a8c7] truncate">{u.full_name}</p>
                    </div>
                  </button>
                ))}
                {onlineList.length === 0 && (
                  <p className="px-2 text-xs text-[#a7a8c7] italic">Nadie más está conectado.</p>
                )}
              </div>
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
                 <div className={cn(
                   "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                   activeRoom.is_group ? "bg-[#00e5ff]/20 text-[#00e5ff]" : "bg-[#f4c542]/20 text-[#f4c542]"
                 )}>
                   {activeRoom.is_group ? <Users size={20} /> : <User size={20} />}
                 </div>
                 <div>
                   <h3 className="font-bold text-white">{activeRoom.displayName}</h3>
                   {activeRoom.is_group && (
                     <p className="text-xs text-[#a7a8c7]">
                        {activeRoom.participants.map(p => p.full_name?.split(' ')[0]).join(', ').slice(0, 30)}
                        {activeRoom.participants.length > 3 ? '...' : ''}
                     </p>
                   )}
                 </div>
              </div>
              <button className="text-[#a7a8c7] hover:text-white">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Messages */}
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
                         <span className="text-xs text-[#a7a8c7] ml-2 mb-1">{msg.profiles?.full_name}</span>
                      )}
                      
                      <div className={cn(
                        "max-w-[75%] px-4 py-2 rounded-2xl text-sm relative group",
                        isMe 
                          ? "bg-[#ff2df0] text-white rounded-br-none" 
                          : "bg-[#1f2235] text-[#e0e0e0] rounded-bl-none border border-white/5"
                      )}>
                        {isUrl(msg.content) ? (
                          isImageUrl(msg.content) ? (
                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="block">
                              <img src={msg.content} alt="Adjunto" className="max-w-full rounded-lg mb-1" />
                            </a>
                          ) : (
                            <a href={msg.content} target="_blank" rel="noopener noreferrer" className="underline break-all">
                              {msg.content}
                            </a>
                          )
                        ) : (
                          msg.content
                        )}
                        <span className="text-[10px] opacity-50 block text-right mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachFile}
                />
                <button
                  type="button"
                  onClick={handleAttachClick}
                  disabled={uploadingAttachment}
                  className="text-[#a7a8c7] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Paperclip size={20} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={uploadingAttachment ? 'Subiendo archivo...' : 'Escribe un mensaje...'}
                    className="w-full bg-[#111322] border border-white/10 rounded-full py-3 pl-4 pr-10 text-white focus:border-[#ff2df0] focus:ring-1 focus:ring-[#ff2df0] outline-none transition-all"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a7a8c7] hover:text-[#ff2df0] transition-colors">
                    <Smile size={20} />
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={!messageInput.trim() || uploadingAttachment}
                  className="bg-[#ff2df0] hover:bg-[#d91cb8] text-white p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,45,240,0.3)] hover:shadow-[0_0_15px_rgba(255,45,240,0.5)]"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserChat;
