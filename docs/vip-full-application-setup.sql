-- ============================================================================
-- CASA VIP — PLANILLA COMPLETA, REFERENCIAS Y REVISION DE CREDITO
-- Ejecutar DESPUES de docs/vip-application-payment-setup.sql
-- ============================================================================

alter table public.vip_applications
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists birth_date date,
  add column if not exists document_number text,
  add column if not exists customer_notes text,
  add column if not exists reference_1_name text,
  add column if not exists reference_1_phone text,
  add column if not exists reference_1_relationship text,
  add column if not exists reference_2_name text,
  add column if not exists reference_2_phone text,
  add column if not exists reference_2_relationship text,
  add column if not exists account_statement_path text,
  add column if not exists credit_eligible boolean not null default false,
  add column if not exists credit_approved boolean not null default false;

create unique index if not exists vip_applications_document_unique
  on public.vip_applications(document_type, lower(document_number))
  where document_number is not null;

create or replace function public.vip_create_full_application(
  p_full_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_birth_date date,
  p_document_type text,
  p_document_number text,
  p_city text,
  p_customer_notes text,
  p_reference_1_name text,
  p_reference_1_phone text,
  p_reference_1_relationship text,
  p_reference_2_name text,
  p_reference_2_phone text,
  p_reference_2_relationship text,
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
  v_document_number text := upper(regexp_replace(trim(coalesce(p_document_number, '')), '\s+', '', 'g'));
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

  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 7 then
    raise exception 'Ingresa un telefono valido.';
  end if;

  if trim(coalesce(p_email, '')) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Ingresa un correo valido.';
  end if;

  if length(trim(coalesce(p_address, ''))) < 5 then
    raise exception 'Ingresa la direccion.';
  end if;

  if p_birth_date is null or p_birth_date > (current_date - interval '18 years')::date then
    raise exception 'La membresia VIP solo puede solicitarse siendo mayor de edad.';
  end if;

  if upper(trim(coalesce(p_document_type, ''))) not in ('CC', 'CE', 'PPT', 'PASSPORT') then
    raise exception 'Tipo de documento no valido.';
  end if;

  if v_document_number !~ '^[A-Z0-9.-]{5,30}$' then
    raise exception 'Ingresa un numero de documento valido.';
  end if;

  if length(trim(coalesce(p_reference_1_name, ''))) < 4
     or length(regexp_replace(coalesce(p_reference_1_phone, ''), '\D', '', 'g')) < 7
     or length(trim(coalesce(p_reference_1_relationship, ''))) < 2 then
    raise exception 'Completa todos los datos de la referencia 1.';
  end if;

  if length(trim(coalesce(p_reference_2_name, ''))) < 4
     or length(regexp_replace(coalesce(p_reference_2_phone, ''), '\D', '', 'g')) < 7
     or length(trim(coalesce(p_reference_2_relationship, ''))) < 2 then
    raise exception 'Completa todos los datos de la referencia 2.';
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
      email,
      address,
      birth_date,
      document_type,
      document_number,
      document_last4,
      city,
      customer_notes,
      reference_1_name,
      reference_1_phone,
      reference_1_relationship,
      reference_2_name,
      reference_2_phone,
      reference_2_relationship,
      terms_accepted_at,
      privacy_accepted_at
    )
    values (
      v_user_id,
      v_plan_id,
      trim(p_full_name),
      trim(p_phone),
      lower(trim(p_email)),
      trim(p_address),
      p_birth_date,
      upper(trim(p_document_type)),
      v_document_number,
      right(v_document_number, 4),
      nullif(trim(p_city), ''),
      nullif(trim(p_customer_notes), ''),
      trim(p_reference_1_name),
      trim(p_reference_1_phone),
      trim(p_reference_1_relationship),
      trim(p_reference_2_name),
      trim(p_reference_2_phone),
      trim(p_reference_2_relationship),
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
      email = lower(trim(p_email)),
      address = trim(p_address),
      birth_date = p_birth_date,
      document_type = upper(trim(p_document_type)),
      document_number = v_document_number,
      document_last4 = right(v_document_number, 4),
      city = nullif(trim(p_city), ''),
      customer_notes = nullif(trim(p_customer_notes), ''),
      reference_1_name = trim(p_reference_1_name),
      reference_1_phone = trim(p_reference_1_phone),
      reference_1_relationship = trim(p_reference_1_relationship),
      reference_2_name = trim(p_reference_2_name),
      reference_2_phone = trim(p_reference_2_phone),
      reference_2_relationship = trim(p_reference_2_relationship),
      terms_accepted_at = now(),
      privacy_accepted_at = now()
    where id = v_application_id;
  end if;

  return v_application_id;
exception
  when unique_violation then
    raise exception 'Ya existe una solicitud asociada a este documento.';
end;
$$;

create or replace function public.vip_attach_full_application_documents(
  p_application_id uuid,
  p_front_path text,
  p_back_path text,
  p_account_statement_path text default null
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
     or p_back_path not like v_prefix || '%'
     or (
       p_account_statement_path is not null
       and p_account_statement_path not like v_prefix || '%'
     ) then
    raise exception 'Las rutas de los documentos no son validas.';
  end if;

  update public.vip_applications
  set
    document_front_path = p_front_path,
    document_back_path = p_back_path,
    account_statement_path = p_account_statement_path
  where id = p_application_id
    and user_id = auth.uid()
    and status = 'draft';

  if not found then
    raise exception 'Solicitud no encontrada o no modificable.';
  end if;
end;
$$;

create or replace function public.vip_admin_update_credit_review(
  p_application_id uuid,
  p_credit_eligible boolean,
  p_credit_approved boolean,
  p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  if p_credit_approved and not p_credit_eligible then
    raise exception 'No se puede aprobar credito sin marcar primero al cliente como elegible.';
  end if;

  update public.vip_applications
  set
    credit_eligible = p_credit_eligible,
    credit_approved = p_credit_approved,
    review_notes = nullif(trim(p_review_notes), ''),
    reviewed_at = now(),
    reviewed_by = auth.uid()
  where id = p_application_id;

  if not found then
    raise exception 'Solicitud no encontrada.';
  end if;
end;
$$;

revoke all on function public.vip_create_full_application(
  text, text, text, text, date, text, text, text, text,
  text, text, text, text, text, text, boolean, boolean
) from public, anon;
grant execute on function public.vip_create_full_application(
  text, text, text, text, date, text, text, text, text,
  text, text, text, text, text, text, boolean, boolean
) to authenticated;

revoke all on function public.vip_attach_full_application_documents(uuid, text, text, text)
  from public, anon;
grant execute on function public.vip_attach_full_application_documents(uuid, text, text, text)
  to authenticated;

revoke all on function public.vip_admin_update_credit_review(uuid, boolean, boolean, text)
  from public, anon;
grant execute on function public.vip_admin_update_credit_review(uuid, boolean, boolean, text)
  to authenticated;

comment on column public.vip_applications.document_number is
  'Dato personal privado. Visible unicamente para el titular autenticado y administradores.';
comment on column public.vip_applications.account_statement_path is
  'Documento opcional que puede cargarse en linea o entregarse presencialmente.';

-- Verificacion:
-- select id, full_name, email, birth_date, status, credit_eligible, credit_approved
-- from public.vip_applications order by created_at desc;
