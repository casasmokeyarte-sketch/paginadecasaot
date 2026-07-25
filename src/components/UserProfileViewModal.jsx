import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  X, User, MapPin, Heart, ThumbsUp, MessageSquare, 
  EyeOff, HelpCircle, Loader2, Smile 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const UserProfileViewModal = ({ userId, isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myReaction, setMyReaction] = useState(null);
  const [isReacting, setIsReacting] = useState(false);

  useEffect(() => {
    if (userId && isOpen) {
      fetchProfileAndReaction();
    }
  }, [userId, isOpen]);

  const fetchProfileAndReaction = async () => {
    try {
      setLoading(true);
      // Fetch profile
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profErr) throw profErr;
      setProfile(profData);

      // Fetch my reaction to this user (if any)
      if (user) {
        const { data: reactData, error: reactErr } = await supabase
          .from('profile_reactions')
          .select('reaction_type')
          .eq('from_user_id', user.id)
          .eq('to_user_id', userId)
          .maybeSingle();
        
        if (!reactErr && reactData) {
          setMyReaction(reactData.reaction_type);
        } else {
          setMyReaction(null);
        }
      }
    } catch (err) {
      console.error('Error fetching public profile:', err);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del perfil.',
        variant: 'destructive',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (type) => {
    if (!user || !profile) return;
    if (user.id === profile.id) {
      toast({
        title: 'Acción no permitida',
        description: 'No puedes reaccionar a tu propio perfil.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsReacting(true);
      
      // If clicking the same reaction, delete it (toggle behavior)
      if (myReaction === type) {
        const { error: delErr } = await supabase
          .from('profile_reactions')
          .delete()
          .eq('from_user_id', user.id)
          .eq('to_user_id', userId);
        
        if (delErr) throw delErr;
        setMyReaction(null);
        toast({
          title: 'Reacción eliminada',
          description: 'Quitaste tu reacción del perfil.'
        });
      } else {
        // Upsert reaction
        const { error: upsertErr } = await supabase
          .from('profile_reactions')
          .upsert({
            from_user_id: user.id,
            to_user_id: userId,
            reaction_type: type,
            created_at: new Date().toISOString()
          }, { onConflict: 'from_user_id,to_user_id' });
        
        if (upsertErr) throw upsertErr;
        setMyReaction(type);

        // Insert notification
        const typeEmoji = type === 'like' ? '👍 (Me gusta)' : type === 'heart' ? '❤️ (Corazón)' : '😈 (Diablo)';
        const senderName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Un usuario';
        
        await supabase
          .from('profile_notifications')
          .insert({
            to_user_id: userId,
            from_user_id: user.id,
            message: `reaccionó a tu perfil con ${typeEmoji}`
          });

        toast({
          title: 'Reacción enviada',
          description: `Reaccionaste con ${type === 'like' ? '👍' : type === 'heart' ? '❤️' : '😈'}`
        });
      }
    } catch (err) {
      console.error('Error submitting reaction:', err);
      toast({
        title: 'Error',
        description: 'No se pudo registrar la reacción.',
        variant: 'destructive'
      });
    } finally {
      setIsReacting(false);
    }
  };

  const handleStartDM = () => {
    if (!profile) return;
    onClose();
    // Redirect to chat with search param to start DM
    navigate(`/user/chat?dm=${profile.id}`);
  };

  // Visibility checks: true if the viewer is the profile owner OR if the field is set to public
  const isMe = user?.id === userId;
  const showCity = isMe || profile?.is_city_public;
  const showCountry = isMe || profile?.is_country_public;
  const showGender = isMe || profile?.is_gender_public;
  const showInterests = isMe || profile?.is_interests_public;
  const isProfilePublic = isMe || profile?.is_profile_public;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-pink-500/30 bg-[#0c0814] text-white max-w-md rounded-2xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="text-[#ff2df0]" size={20} />
            Perfil de Usuario
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-[#ff2df0]" size={36} />
            <p className="text-sm text-[#a7a8c7]">Cargando información...</p>
          </div>
        ) : profile ? (
          <div className="p-6 pt-2 space-y-6">
            
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500/50 bg-[#050510] flex items-center justify-center shadow-lg shadow-pink-500/10 mb-4">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.username || profile.full_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-[#a7a8c7]" size={48} />
                )}
              </div>

              <h2 className="text-2xl font-bold text-white tracking-wide">
                {profile.username ? `@${profile.username}` : (profile.full_name || 'Miembro')}
              </h2>
              {profile.username && profile.full_name && (
                <p className="text-sm text-[#a7a8c7] mt-0.5">{profile.full_name}</p>
              )}
            </div>

            {/* Profile Visibility Check */}
            {!isProfilePublic ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-2">
                <EyeOff size={32} className="text-red-400 mx-auto" />
                <h3 className="font-bold text-white text-base">Perfil Privado</h3>
                <p className="text-xs text-[#a7a8c7] leading-relaxed">
                  Este usuario ha decidido mantener su perfil oculto del público general.
                </p>
              </div>
            ) : (
              <>
                {/* Details Section */}
                <div className="bg-[#111322] border border-white/10 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8f98bf] border-b border-white/5 pb-2">
                    Datos del Perfil
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Location */}
                    <div className="col-span-2 flex items-start gap-2.5">
                      <MapPin size={16} className="text-pink-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="block text-[10px] text-[#a7a8c7] uppercase font-semibold">Ubicación</span>
                        <span className="text-white font-medium">
                          {showCity && profile.city ? profile.city : ''}
                          {showCity && profile.city && showCountry && profile.country ? ', ' : ''}
                          {showCountry && profile.country ? profile.country : ''}
                          {(!showCity || !profile.city) && (!showCountry || !profile.country) && (
                            <span className="text-slate-500 italic text-xs">No visible o sin especificar</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <span className="block text-[10px] text-[#a7a8c7] uppercase font-semibold">Sexo</span>
                      <span className="text-white font-medium">
                        {showGender && profile.gender ? (
                          profile.gender
                        ) : (
                          <span className="text-slate-500 italic text-xs">No visible</span>
                        )}
                      </span>
                    </div>

                    {/* Interests */}
                    <div>
                      <span className="block text-[10px] text-[#a7a8c7] uppercase font-semibold">Intereses</span>
                      <span className="text-white font-medium truncate block">
                        {showInterests && profile.interests ? (
                          profile.interests
                        ) : (
                          <span className="text-slate-500 italic text-xs">No visible</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reactions Section */}
                {user && user.id !== profile.id && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#a7a8c7] text-center uppercase tracking-wider">
                      Reacciona a su perfil
                    </h3>
                    <div className="flex justify-center gap-4">
                      {/* Like */}
                      <button
                        onClick={() => handleReact('like')}
                        disabled={isReacting}
                        className={`p-3.5 rounded-full border transition-all duration-300 transform active:scale-95 flex items-center justify-center ${
                          myReaction === 'like'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                            : 'bg-white/5 border-white/10 hover:border-blue-500/40 text-slate-400 hover:text-blue-400'
                        }`}
                        title="Me Gusta"
                      >
                        <ThumbsUp size={20} />
                      </button>

                      {/* Heart */}
                      <button
                        onClick={() => handleReact('heart')}
                        disabled={isReacting}
                        className={`p-3.5 rounded-full border transition-all duration-300 transform active:scale-95 flex items-center justify-center ${
                          myReaction === 'heart'
                            ? 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                            : 'bg-white/5 border-white/10 hover:border-red-500/40 text-slate-400 hover:text-red-400'
                        }`}
                        title="Corazón"
                      >
                        <Heart size={20} />
                      </button>

                      {/* Devil */}
                      <button
                        onClick={() => handleReact('devil')}
                        disabled={isReacting}
                        className={`p-3.5 rounded-full border transition-all duration-300 transform active:scale-95 flex items-center justify-center ${
                          myReaction === 'devil'
                            ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'bg-white/5 border-white/10 hover:border-purple-500/40 text-slate-400 hover:text-purple-400'
                        }`}
                        title="Diablillo"
                      >
                        <Smile size={20} className="transform rotate-180" /> {/* Emoji representation */}
                      </button>
                    </div>
                  </div>
                )}

                {/* DM Action Button */}
                {user && user.id !== profile.id && (
                  <Button
                    onClick={handleStartDM}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-6 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <MessageSquare size={18} />
                    Enviar Mensaje Directo
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-[#a7a8c7]">Perfil no encontrado.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileViewModal;
