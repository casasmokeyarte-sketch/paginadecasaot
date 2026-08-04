-- ==========================================================================
-- CASA VIP — 3 PASES DE AMIGOS POR PERIODO MENSUAL
-- Ejecutar DESPUES de docs/vip-membership-setup.sql
-- ==========================================================================

alter table public.vip_plans
  add column if not exists guest_limit integer not null default 3
    check (guest_limit between 0 and 10);

update public.vip_plans
set
  guest_limit = 3,
  benefits = case
    when benefits @> '["3 pases para amigos por mes"]'::jsonb then benefits
    else benefits || '["3 pases para amigos por mes"]'::jsonb
  end
where code = 'vip-mensual';

create table if not exists public.vip_guest_visits (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.vip_memberships(id) on delete cascade,
  token_id uuid references public.vip_access_tokens(id) on delete set null,
  guest_full_name text not null,
  document_type text not null
    check (document_type in ('CC', 'CE', 'PPT', 'PASSPORT')),
  document_last4 text not null
    check (document_last4 ~ '^[A-Za-z0-9]{4}$'),
  adult_verified_at timestamptz not null,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  checked_in_by uuid not null references auth.users(id) on delete restrict,
  checked_out_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists vip_guest_visits_membership_idx
  on public.vip_guest_visits(membership_id, checked_in_at desc);
create index if not exists vip_guest_visits_open_idx
  on public.vip_guest_visits(membership_id)
  where checked_out_at is null;

create or replace function public.vip_guest_access_status(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.vip_access_tokens;
  v_membership public.vip_memberships;
  v_plan public.vip_plans;
  v_used bigint;
  v_open jsonb;
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  select * into v_token
  from public.vip_access_tokens
  where token = p_token and is_active = true;

  if not found then
    raise exception 'Tarjeta invalida o inactiva.';
  end if;

  select * into v_membership
  from public.vip_memberships
  where id = v_token.membership_id;

  select * into v_plan
  from public.vip_plans
  where id = v_membership.plan_id;

  select count(*) into v_used
  from public.vip_guest_visits guest_visit
  where guest_visit.membership_id = v_membership.id
    and guest_visit.checked_in_at >= public.vip_current_period_start(v_membership.id)
    and guest_visit.checked_in_at < public.vip_current_period_end(v_membership.id);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', guest_visit.id,
        'guest_full_name', guest_visit.guest_full_name,
        'document_type', guest_visit.document_type,
        'document_last4', guest_visit.document_last4,
        'checked_in_at', guest_visit.checked_in_at
      ) order by guest_visit.checked_in_at desc
    ),
    '[]'::jsonb
  ) into v_open
  from public.vip_guest_visits guest_visit
  where guest_visit.membership_id = v_membership.id
    and guest_visit.checked_out_at is null;

  return jsonb_build_object(
    'membership_id', v_membership.id,
    'guests_used', v_used,
    'guest_limit', v_plan.guest_limit,
    'guests_remaining', greatest(v_plan.guest_limit - v_used, 0),
    'open_guests', v_open
  );
end;
$$;

create or replace function public.vip_register_guest(
  p_token uuid,
  p_guest_full_name text,
  p_document_type text,
  p_document_last4 text,
  p_adult_verified boolean,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.vip_access_tokens;
  v_membership public.vip_memberships;
  v_plan public.vip_plans;
  v_used integer;
  v_guest_id uuid;
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  if not p_adult_verified then
    raise exception 'El invitado debe presentar un documento valido y ser mayor de edad.';
  end if;

  if length(trim(coalesce(p_guest_full_name, ''))) < 4 then
    raise exception 'Ingresa el nombre completo del invitado.';
  end if;

  if upper(trim(coalesce(p_document_type, ''))) not in ('CC', 'CE', 'PPT', 'PASSPORT') then
    raise exception 'Tipo de documento no valido.';
  end if;

  if trim(coalesce(p_document_last4, '')) !~ '^[A-Za-z0-9]{4}$' then
    raise exception 'Registra los ultimos cuatro caracteres del documento.';
  end if;

  select * into v_token
  from public.vip_access_tokens
  where token = p_token and is_active = true;

  if not found then
    raise exception 'Tarjeta invalida o inactiva.';
  end if;

  select * into v_membership
  from public.vip_memberships
  where id = v_token.membership_id
  for update;

  if v_membership.status <> 'active'
     or not v_membership.adult_verified
     or (v_membership.starts_at is not null and v_membership.starts_at > now())
     or (v_membership.ends_at is not null and v_membership.ends_at <= now()) then
    raise exception 'La membresia no tiene acceso habilitado.';
  end if;

  if not exists (
    select 1 from public.vip_access_logs
    where membership_id = v_membership.id and checked_out_at is null
  ) then
    raise exception 'Primero registra el ingreso del titular de la membresia.';
  end if;

  select * into v_plan
  from public.vip_plans
  where id = v_membership.plan_id;

  select count(*) into v_used
  from public.vip_guest_visits guest_visit
  where guest_visit.membership_id = v_membership.id
    and guest_visit.checked_in_at >= public.vip_current_period_start(v_membership.id)
    and guest_visit.checked_in_at < public.vip_current_period_end(v_membership.id);

  if v_used >= v_plan.guest_limit then
    raise exception 'El miembro ya utilizo sus pases para amigos de este periodo.';
  end if;

  insert into public.vip_guest_visits (
    membership_id,
    token_id,
    guest_full_name,
    document_type,
    document_last4,
    adult_verified_at,
    checked_in_by,
    notes
  )
  values (
    v_membership.id,
    v_token.id,
    trim(p_guest_full_name),
    upper(trim(p_document_type)),
    upper(trim(p_document_last4)),
    now(),
    auth.uid(),
    nullif(trim(p_notes), '')
  )
  returning id into v_guest_id;

  return v_guest_id;
end;
$$;

create or replace function public.vip_check_out_guest(p_guest_visit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  update public.vip_guest_visits
  set checked_out_at = now(), checked_out_by = auth.uid()
  where id = p_guest_visit_id and checked_out_at is null;

  if not found then
    raise exception 'El invitado no tiene un ingreso abierto.';
  end if;
end;
$$;

-- Al registrar la salida del titular también se cierran sus invitados abiertos.
create or replace function public.vip_check_out(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership_id uuid;
  v_reservation_id uuid;
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  select membership_id into v_membership_id
  from public.vip_access_tokens
  where token = p_token;

  update public.vip_access_logs
  set checked_out_at = now()
  where membership_id = v_membership_id
    and checked_out_at is null
  returning reservation_id into v_reservation_id;

  if not found then
    raise exception 'No existe un ingreso abierto.';
  end if;

  update public.vip_guest_visits
  set checked_out_at = now(), checked_out_by = auth.uid()
  where membership_id = v_membership_id and checked_out_at is null;

  if v_reservation_id is not null then
    update public.vip_reservations
    set status = 'completed'
    where id = v_reservation_id;
  end if;
end;
$$;

alter table public.vip_guest_visits enable row level security;

drop policy if exists "vip_guest_visits_owner_read" on public.vip_guest_visits;
create policy "vip_guest_visits_owner_read"
  on public.vip_guest_visits for select
  to authenticated
  using (
    public.vip_is_admin()
    or exists (
      select 1 from public.vip_memberships membership
      where membership.id = vip_guest_visits.membership_id
        and membership.user_id = auth.uid()
    )
  );

drop policy if exists "vip_guest_visits_admin" on public.vip_guest_visits;
create policy "vip_guest_visits_admin"
  on public.vip_guest_visits for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

revoke insert, update, delete on public.vip_guest_visits from anon, authenticated;
grant select on public.vip_guest_visits to authenticated;

revoke all on function public.vip_guest_access_status(uuid) from public, anon;
revoke all on function public.vip_register_guest(uuid, text, text, text, boolean, text) from public, anon;
revoke all on function public.vip_check_out_guest(uuid) from public, anon;
grant execute on function public.vip_guest_access_status(uuid) to authenticated;
grant execute on function public.vip_register_guest(uuid, text, text, text, boolean, text) to authenticated;
grant execute on function public.vip_check_out_guest(uuid) to authenticated;

comment on table public.vip_guest_visits is
  'Pases mensuales de amigos asociados al titular VIP. Cada registro consume un pase.';
comment on column public.vip_guest_visits.document_last4 is
  'Solo los ultimos cuatro caracteres; el documento completo no se guarda.';

-- Verificacion:
-- select code, guest_limit, benefits from public.vip_plans where code = 'vip-mensual';
-- select * from public.vip_guest_visits order by checked_in_at desc;
