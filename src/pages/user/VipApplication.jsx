import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  FileCheck2,
  FileImage,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const extensionForFile = (file) => {
  const fromName = file.name?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'application/pdf') return 'pdf';
  return 'jpg';
};

const validateDocument = (file, label) => {
  if (!file) throw new Error(`Adjunta ${label}.`);
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(`${label} debe ser JPG, PNG, WEBP o PDF.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${label} no puede superar 6 MB.`);
  }
};

const VipApplication = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [working, setWorking] = useState(false);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    documentType: 'CC',
    documentLast4: '',
    city: profile?.city || 'Bogotá',
    termsAccepted: false,
    privacyAccepted: false,
  });

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const uploadDocument = async (applicationId, side, file) => {
    const path = `${user.id}/${applicationId}/${side}-${Date.now()}.${extensionForFile(file)}`;
    const { error } = await supabase.storage
      .from('vip-documents')
      .upload(path, file, {
        cacheControl: '0',
        upsert: false,
        contentType: file.type,
      });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      validateDocument(frontFile, 'la foto frontal');
      validateDocument(backFile, 'la foto posterior');
      if (!form.termsAccepted || !form.privacyAccepted) {
        throw new Error('Debes aceptar el reglamento y la autorización de tratamiento de datos.');
      }

      setWorking(true);
      const { data: applicationId, error: applicationError } = await supabase.rpc(
        'vip_create_application',
        {
          p_full_name: form.fullName,
          p_phone: form.phone,
          p_document_type: form.documentType,
          p_document_last4: form.documentLast4,
          p_city: form.city,
          p_terms_accepted: form.termsAccepted,
          p_privacy_accepted: form.privacyAccepted,
        }
      );
      if (applicationError) throw applicationError;

      const frontPath = await uploadDocument(applicationId, 'front', frontFile);
      let backPath;
      try {
        backPath = await uploadDocument(applicationId, 'back', backFile);
      } catch (error) {
        await supabase.storage.from('vip-documents').remove([frontPath]);
        throw error;
      }

      const { error: attachError } = await supabase.rpc('vip_attach_application_documents', {
        p_application_id: applicationId,
        p_front_path: frontPath,
        p_back_path: backPath,
      });
      if (attachError) throw attachError;

      sessionStorage.setItem('vip_application_id', applicationId);
      navigate('/vip/checkout', { state: { applicationId } });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo preparar la solicitud',
        description: error?.message || 'Revisa los datos e intenta nuevamente.',
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">
          Afiliación Casa VIP
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">Solicitud y pago seguro</h1>
        <p className="mt-2 max-w-3xl text-[#a7a8c7]">
          Completa la información, adjunta ambos lados del documento y continúa al pago.
          El pago no habilita el ingreso hasta que administración verifique identidad y mayoría de edad.
        </p>
      </div>

      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
        <p className="flex items-start gap-2">
          <LockKeyhole className="mt-0.5 flex-none" size={18} />
          Los documentos se guardan de manera privada. No aparecen en la tarjeta NFC ni en
          enlaces públicos. En la base solo se registran los últimos cuatro caracteres.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-[#111322] p-6">
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <FileCheck2 className="text-pink-400" /> Datos del titular
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-semibold text-[#c7c9dd]">Nombre completo</span>
              <input
                required
                value={form.fullName}
                onChange={(event) => updateForm('fullName', event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-[#c7c9dd]">Teléfono</span>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(event) => updateForm('phone', event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-[#c7c9dd]">Ciudad</span>
              <input
                value={form.city}
                onChange={(event) => updateForm('city', event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-[#c7c9dd]">Tipo de documento</span>
              <select
                value={form.documentType}
                onChange={(event) => updateForm('documentType', event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
              >
                <option value="CC">Cédula de ciudadanía</option>
                <option value="CE">Cédula de extranjería</option>
                <option value="PPT">PPT</option>
                <option value="PASSPORT">Pasaporte</option>
              </select>
            </label>
            <label>
              <span className="text-sm font-semibold text-[#c7c9dd]">Últimos 4 caracteres</span>
              <input
                required
                minLength={4}
                maxLength={4}
                value={form.documentLast4}
                onChange={(event) => updateForm(
                  'documentLast4',
                  event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                )}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white uppercase"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111322] p-6">
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <FileImage className="text-yellow-300" /> Documento
          </h2>
          <div className="mt-6 space-y-4">
            {[
              ['Foto frontal', frontFile, setFrontFile],
              ['Foto posterior', backFile, setBackFile],
            ].map(([label, file, setter]) => (
              <label key={label} className="block rounded-2xl border border-dashed border-white/20 bg-black/20 p-4">
                <span className="text-sm font-bold text-white">{label}</span>
                <input
                  required
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={(event) => setter(event.target.files?.[0] || null)}
                  className="mt-3 block w-full text-sm text-[#a7a8c7]"
                />
                <p className="mt-2 text-xs text-[#777c9e]">
                  {file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB` : 'JPG, PNG, WEBP o PDF. Máximo 6 MB.'}
                </p>
              </label>
            ))}
          </div>

          <label className="mt-5 flex items-start gap-3 text-sm text-[#c7c9dd]">
            <input
              type="checkbox"
              checked={form.termsAccepted}
              onChange={(event) => updateForm('termsAccepted', event.target.checked)}
              className="mt-1"
            />
            Acepto el reglamento, precio mensual, límites de uso y condiciones de cancelación.
          </label>
          <label className="mt-4 flex items-start gap-3 text-sm text-[#c7c9dd]">
            <input
              type="checkbox"
              checked={form.privacyAccepted}
              onChange={(event) => updateForm('privacyAccepted', event.target.checked)}
              className="mt-1"
            />
            Autorizo el tratamiento privado de mis datos para validar y administrar la membresía.
          </label>

          <button
            type="submit"
            disabled={working}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 to-pink-500 px-5 py-4 font-black text-[#0b0710] disabled:opacity-50"
          >
            {working ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            Continuar al pago <ArrowRight size={18} />
          </button>
        </section>
      </form>
    </div>
  );
};

export default VipApplication;
