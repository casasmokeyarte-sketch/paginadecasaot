-- ============================================================================
-- CASA VIP — SOLICITUD, DOCUMENTOS PRIVADOS Y PAGO PREVIO
-- Ejecutar DESPUES de docs/vip-membership-setup.sql
-- ============================================================================

create table if not exists public.vip_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.vip_plans(id),
  full_name text not null,
  phone text not null,
  document_type text not null
    check (document_type in ('CC', 'CE', 'PPT', 'PASSPORT')),
  document_last4 text not null
    check (document_last4 ~ '^[A-Za-z0-9]{4}$'),
  city text,
  document_front_path text,
  document_back_path text,
  terms_accepted_at timestamptz not null,
  privacy_accepted_at timestamptz not null,
  payment_order_id text unique,
  payment_transaction_id text,
  payment_status text not null default 'not_started'
    check (payment_status in ('not_started', 'pending', 'approved', 'rejected')),
  status text not null default 'draft'
    check (status in ('draft', 'payment_pending', 'under_review', 'approved', 'rejected', 'cancelled')),
  paid_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vip_applications_user_idx
  on public.vip_applications(user_id, created_at desc);
create index if not exists vip_applications_status_idx
  on public.vip_applications(status, created_at desc);
create index if not exists vip_applications_payment_order_idx
  on public.vip_applications(payment_order_id);
create unique index if not exists vip_payments_external_reference_unique
  on public.vip_payments(external_reference)
  where external_reference is not null;

drop trigger if exists vip_applications_set_updated_at on public.vip_applications;
create trigger vip_applications_set_updated_at
before update on public.vip_applications
for each row execute function public.vip_set_updated_at();

-- Bucket estrictamente privado para documentos.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'vip-documents',
  'vip-documents',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.vip_create_application(
  p_full_name text,
  p_phone text,
  p_document_type text,
  p_document_last4 text,
  p_city text,
  p_terms_accepted boolean,
  p_privacy_accepted boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
  v_application_id uuid;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  if not p_terms_accepted or not p_privacy_accepted then
    raise exception 'Debes aceptar el reglamento y el tratamiento de datos.';
  end if;

  if length(trim(coalesce(p_full_name, ''))) < 4 then
    raise exception 'Ingresa el nombre completo.';
  end if;

  if length(trim(coalesce(p_phone, ''))) < 7 then
    raise exception 'Ingresa un telefono valido.';
  end if;

  if upper(trim(coalesce(p_document_type, ''))) not in ('CC', 'CE', 'PPT', 'PASSPORT') then
    raise exception 'Tipo de documento no valido.';
  end if;

  if trim(coalesce(p_document_last4, '')) !~ '^[A-Za-z0-9]{4}$' then
    raise exception 'Ingresa solamente los ultimos cuatro caracteres del documento.';
  end if;

  select id into v_plan_id
  from public.vip_plans
  where code = 'vip-mensual' and is_active = true;

  if v_plan_id is null then
    raise exception 'El plan VIP no esta disponible.';
  end if;

  select id into v_application_id
  from public.vip_applications
  where user_id = v_user_id
    and status in ('draft', 'payment_pending')
  order by created_at desc
  limit 1
  for update;

  if v_application_id is null then
    insert into public.vip_applications (
      user_id,
      plan_id,
      full_name,
      phone,
      document_type,
      document_last4,
      city,
      terms_accepted_at,
      privacy_accepted_at
    )
    values (
      v_user_id,
      v_plan_id,
      trim(p_full_name),
      trim(p_phone),
      upper(trim(p_document_type)),
      upper(trim(p_document_last4)),
      nullif(trim(p_city), ''),
      now(),
      now()
    )
    returning id into v_application_id;
  else
    update public.vip_applications
    set
      plan_id = v_plan_id,
      full_name = trim(p_full_name),
      phone = trim(p_phone),
      document_type = upper(trim(p_document_type)),
      document_last4 = upper(trim(p_document_last4)),
      city = nullif(trim(p_city), ''),
      terms_accepted_at = now(),
      privacy_accepted_at = now()
    where id = v_application_id;
  end if;

  return v_application_id;
end;
$$;

create or replace function public.vip_attach_application_documents(
  p_application_id uuid,
  p_front_path text,
  p_back_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text := auth.uid()::text || '/' || p_application_id::text || '/';
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  if p_front_path not like v_prefix || '%'
     or p_back_path not like v_prefix || '%' then
    raise exception 'Las rutas de los documentos no son validas.';
  end if;

  update public.vip_applications
  set
    document_front_path = p_front_path,
    document_back_path = p_back_path
  where id = p_application_id
    and user_id = auth.uid()
    and status = 'draft';

  if not found then
    raise exception 'Solicitud no encontrada o no modificable.';
  end if;
end;
$$;

create or replace function public.vip_admin_approve_application(
  p_application_id uuid,
  p_days integer default 30
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application public.vip_applications;
  v_membership public.vip_memberships;
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  if p_days < 1 or p_days > 366 then
    raise exception 'La vigencia indicada no es valida.';
  end if;

  select * into v_application
  from public.vip_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Solicitud no encontrada.';
  end if;

  if v_application.payment_status <> 'approved'
     or v_application.status <> 'under_review' then
    raise exception 'La solicitud no tiene un pago aprobado pendiente de revision.';
  end if;

  select * into v_membership
  from public.vip_memberships
  where user_id = v_application.user_id
  for update;

  if not found then
    raise exception 'No existe la membresia asociada.';
  end if;

  if not v_membership.adult_verified then
    raise exception 'Primero verifica fisicamente la identidad y mayoria de edad.';
  end if;

  update public.vip_memberships
  set
    status = 'active',
    starts_at = now(),
    ends_at = now() + make_interval(days => p_days),
    cancellation_requested_at = null
  where id = v_membership.id;

  update public.vip_payments
  set
    period_start = coalesce(period_start, now()),
    period_end = coalesce(period_end, now() + make_interval(days => p_days))
  where membership_id = v_membership.id
    and external_reference = v_application.payment_order_id
    and status = 'approved';

  update public.vip_applications
  set
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    review_notes = 'Aprobada desde el panel Casa VIP.'
  where id = v_application.id;

  if not exists (
    select 1 from public.vip_access_tokens
    where membership_id = v_membership.id and is_active = true
  ) then
    insert into public.vip_access_tokens (membership_id, created_by)
    values (v_membership.id, auth.uid());
  end if;

  return v_membership.id;
end;
$$;

alter table public.vip_applications enable row level security;

drop policy if exists "vip_applications_owner_read" on public.vip_applications;
create policy "vip_applications_owner_read"
  on public.vip_applications for select
  to authenticated
  using (user_id = auth.uid() or public.vip_is_admin());

drop policy if exists "vip_applications_admin" on public.vip_applications;
create policy "vip_applications_admin"
  on public.vip_applications for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

revoke insert, update, delete on public.vip_applications from anon, authenticated;
grant select on public.vip_applications to authenticated;
grant execute on function public.vip_create_application(text, text, text, text, text, boolean, boolean)
  to authenticated;
grant execute on function public.vip_attach_application_documents(uuid, text, text)
  to authenticated;
grant execute on function public.vip_admin_approve_application(uuid, integer)
  to authenticated;

-- El usuario autenticado solo puede cargar dentro de:
-- vip-documents/{su-user-id}/{application-id}/archivo
drop policy if exists "vip_documents_owner_insert" on storage.objects;
create policy "vip_documents_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vip-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "vip_documents_owner_read" on storage.objects;
create policy "vip_documents_owner_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'vip-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.vip_is_admin()
  )
);

drop policy if exists "vip_documents_owner_delete_draft" on storage.objects;
create policy "vip_documents_owner_delete_draft"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'vip-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.vip_applications application
    where application.user_id = auth.uid()
      and application.id::text = (storage.foldername(name))[2]
      and application.status = 'draft'
  )
);

drop policy if exists "vip_documents_admin" on storage.objects;
create policy "vip_documents_admin"
on storage.objects for all
to authenticated
using (bucket_id = 'vip-documents' and public.vip_is_admin())
with check (bucket_id = 'vip-documents' and public.vip_is_admin());

comment on table public.vip_applications is
  'Solicitudes VIP pagadas o en proceso. Los documentos se guardan en Storage privado.';
comment on column public.vip_applications.document_last4 is
  'Solo ultimos cuatro caracteres; el numero completo no se replica en la base.';

-- Verificacion:
-- select id, name, public, file_size_limit from storage.buckets where id = 'vip-documents';
-- select * from public.vip_applications order by created_at desc;
