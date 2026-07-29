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
  const [accountStatementFile, setAccountStatementFile] = useState(null);
  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    email: user?.email || '',
    address: '',
    birthDate: '',
    documentType: 'CC',
    documentNumber: '',
    city: profile?.city || 'Bogotá',
    customerNotes: '',
    reference1Name: '',
    reference1Phone: '',
    reference1Relationship: '',
    reference2Name: '',
    reference2Phone: '',
    reference2Relationship: '',
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
      if (accountStatementFile) {
        validateDocument(accountStatementFile, 'los movimientos de cuenta');
      }
      if (!form.termsAccepted || !form.privacyAccepted) {
        throw new Error('Debes aceptar el reglamento y la autorización de tratamiento de datos.');
      }

      setWorking(true);
      const { data: applicationId, error: applicationError } = await supabase.rpc(
        'vip_create_full_application',
        {
          p_full_name: form.fullName,
          p_phone: form.phone,
          p_email: form.email,
          p_address: form.address,
          p_birth_date: form.birthDate,
          p_document_type: form.documentType,
          p_document_number: form.documentNumber,
          p_city: form.city,
          p_customer_notes: form.customerNotes,
          p_reference_1_name: form.reference1Name,
          p_reference_1_phone: form.reference1Phone,
          p_reference_1_relationship: form.reference1Relationship,
          p_reference_2_name: form.reference2Name,
          p_reference_2_phone: form.reference2Phone,
          p_reference_2_relationship: form.reference2Relationship,
          p_terms_accepted: form.termsAccepted,
          p_privacy_accepted: form.privacyAccepted,
        }
      );
      if (applicationError) throw applicationError;

      const frontPath = await uploadDocument(applicationId, 'front', frontFile);
      let backPath;
      let accountStatementPath = null;
      try {
        backPath = await uploadDocument(applicationId, 'back', backFile);
        if (accountStatementFile) {
          accountStatementPath = await uploadDocument(
            applicationId,
            'account-statement',
            accountStatementFile
          );
        }
      } catch (error) {
        await supabase.storage
          .from('vip-documents')
          .remove([frontPath, backPath, accountStatementPath].filter(Boolean));
        throw error;
      }

      const { error: attachError } = await supabase.rpc(
        'vip_attach_full_application_documents',
        {
          p_application_id: applicationId,
          p_front_path: frontPath,
          p_back_path: backPath,
          p_account_statement_path: accountStatementPath,
        }
      );
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
          Los documentos y datos del expediente se guardan de manera privada. No aparecen en
          la tarjeta NFC ni en enlaces públicos.
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
              <span className="text-sm font-semibold text-[#c7c9dd]">Correo</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                placeholder="cliente@correo.com"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-semibold text-[#c7c9dd]">Dirección</span>
              <input
                required
                value={form.address}
                onChange={(event) => updateForm('address', event.target.value)}
                placeholder="Calle 123 #45-67"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
              />
            </label>
            <label>
              <span className="text-sm font-semibold text-[#c7c9dd]">Fecha de nacimiento</span>
              <input
                required
                type="date"
                value={form.birthDate}
                onChange={(event) => updateForm('birthDate', event.target.value)}
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
              <span className="text-sm font-semibold text-[#c7c9dd]">Número de documento</span>
              <input
                required
                minLength={5}
                maxLength={30}
                value={form.documentNumber}
                onChange={(event) => updateForm(
                  'documentNumber',
                  event.target.value.replace(/[^a-zA-Z0-9.-]/g, '').toUpperCase()
                )}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white uppercase"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-semibold text-[#c7c9dd]">Notas / observaciones</span>
              <textarea
                rows={3}
                value={form.customerNotes}
                onChange={(event) => updateForm('customerNotes', event.target.value)}
                placeholder="Preferencias del cliente, observaciones, etc."
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
              />
            </label>
          </div>

          <h2 className="mt-8 text-xl font-black text-white">Referencias personales</h2>
          <p className="mt-1 text-sm text-[#8f98bf]">Debes registrar mínimo dos referencias.</p>
          {[1, 2].map((number) => (
            <div key={number} className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-black text-pink-300">Referencia {number}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-sm text-[#c7c9dd]">Nombre completo</span>
                  <input
                    required
                    value={form[`reference${number}Name`]}
                    onChange={(event) => updateForm(`reference${number}Name`, event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
                  />
                </label>
                <label>
                  <span className="text-sm text-[#c7c9dd]">Teléfono</span>
                  <input
                    required
                    type="tel"
                    value={form[`reference${number}Phone`]}
                    onChange={(event) => updateForm(`reference${number}Phone`, event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
                  />
                </label>
                <label>
                  <span className="text-sm text-[#c7c9dd]">Parentesco / relación</span>
                  <input
                    required
                    value={form[`reference${number}Relationship`]}
                    onChange={(event) => updateForm(
                      `reference${number}Relationship`,
                      event.target.value
                    )}
                    placeholder="Familiar, amigo, etc."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#050510] px-4 py-3 text-white"
                  />
                </label>
              </div>
            </div>
          ))}
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

            <label className="block rounded-2xl border border-dashed border-white/20 bg-black/20 p-4">
              <span className="text-sm font-bold text-white">Movimientos de cuentas</span>
              <span className="ml-2 text-xs text-yellow-300">Opcional en línea</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(event) => setAccountStatementFile(event.target.files?.[0] || null)}
                className="mt-3 block w-full text-sm text-[#a7a8c7]"
              />
              <p className="mt-2 text-xs text-[#777c9e]">
                {accountStatementFile
                  ? `${accountStatementFile.name} · ${(accountStatementFile.size / 1024 / 1024).toFixed(1)} MB`
                  : 'Estados de cuenta en PDF o imagen. También puede solicitarse presencialmente en la tienda.'}
              </p>
            </label>
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
