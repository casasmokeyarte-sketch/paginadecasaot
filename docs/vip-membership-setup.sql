-- ============================================================================
-- CASA SMOKE Y ARTE — SALA VIP
-- Ejecutar completo en Supabase > SQL Editor
-- Version: 2026-07-29
--
-- Este modulo administra la experiencia fisica de la sala VIP.
-- No almacena documentos de identidad, fechas de nacimiento ni datos bancarios.
-- La mayoria de edad se registra solo como verificacion realizada por personal.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Funciones auxiliares
-- ----------------------------------------------------------------------------

create or replace function public.vip_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and lower(trim(coalesce(role, ''))) in ('admin', 'administrador')
  );
$$;

create or replace function public.vip_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Configuracion y plan
-- ----------------------------------------------------------------------------

create table if not exists public.vip_settings (
  id smallint primary key default 1 check (id = 1),
  room_capacity integer not null default 10 check (room_capacity between 1 and 100),
  opening_time time not null default '12:00',
  closing_time time not null default '22:00',
  timezone text not null default 'America/Bogota',
  updated_at timestamptz not null default now()
);

insert into public.vip_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.vip_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  monthly_price numeric(12, 2) not null check (monthly_price >= 0),
  visit_limit integer not null default 8 check (visit_limit > 0),
  max_visit_minutes integer not null default 120 check (max_visit_minutes between 30 and 480),
  benefits jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.vip_plans (
  code,
  name,
  description,
  monthly_price,
  visit_limit,
  max_visit_minutes,
  benefits,
  is_active
)
values (
  'vip-mensual',
  'Casa VIP Mensual',
  'Acceso organizado a la sala fisica y sus experiencias.',
  79900,
  8,
  120,
  '[
    "Hasta 8 visitas mensuales",
    "Reserva prioritaria de la sala",
    "Zona Xbox, television y musica",
    "Crispetas y algodon de azucar para consumo en la sala",
    "Eventos y actividades exclusivas",
    "Sistema de puntos y beneficios seleccionados"
  ]'::jsonb,
  true
)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price = excluded.monthly_price,
  visit_limit = excluded.visit_limit,
  max_visit_minutes = excluded.max_visit_minutes,
  benefits = excluded.benefits,
  is_active = excluded.is_active,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 3. Membresias, credenciales, reservas, accesos y pagos
-- ----------------------------------------------------------------------------

create table if not exists public.vip_memberships (
  id uuid primary key default gen_random_uuid(),
  member_number text not null unique
    default ('VIP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_id uuid not null references public.vip_plans(id),
  status text not null default 'requested'
    check (status in ('requested', 'active', 'past_due', 'suspended', 'cancelled', 'expired')),
  starts_at timestamptz,
  ends_at timestamptz,
  auto_renew boolean not null default false,
  preferred_payment_method text not null default 'pending'
    check (preferred_payment_method in (
      'pending', 'cash', 'nequi', 'daviplata', 'wompi',
      'mercadopago', 'card', 'pse', 'bank_transfer'
    )),
  adult_verified boolean not null default false,
  adult_verified_at timestamptz,
  adult_verified_by uuid references auth.users(id) on delete set null,
  cancellation_requested_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.vip_access_tokens (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.vip_memberships(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  label text not null default 'Tarjeta NFC principal',
  is_active boolean not null default true,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null
);

create unique index if not exists vip_one_active_token_per_membership
  on public.vip_access_tokens(membership_id)
  where is_active = true;

create table if not exists public.vip_reservations (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.vip_memberships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
  notes text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.vip_access_logs (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.vip_memberships(id) on delete cascade,
  token_id uuid references public.vip_access_tokens(id) on delete set null,
  reservation_id uuid references public.vip_reservations(id) on delete set null,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null,
  access_method text not null default 'nfc'
    check (access_method in ('nfc', 'qr', 'manual')),
  notes text,
  check (checked_out_at is null or checked_out_at >= checked_in_at)
);

create unique index if not exists vip_one_open_access_per_membership
  on public.vip_access_logs(membership_id)
  where checked_out_at is null;

create table if not exists public.vip_payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.vip_memberships(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'COP' check (currency = 'COP'),
  payment_method text not null
    check (payment_method in (
      'cash', 'nequi', 'daviplata', 'wompi',
      'mercadopago', 'card', 'pse', 'bank_transfer'
    )),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  period_start timestamptz,
  period_end timestamptz,
  external_reference text,
  recorded_by uuid references auth.users(id) on delete set null,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end is null or period_start is null or period_end > period_start)
);

create or replace function public.vip_current_period_start(p_membership_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select max(pay.period_start)
      from public.vip_payments pay
      where pay.membership_id = p_membership_id
        and pay.status = 'approved'
        and pay.period_start <= now()
        and pay.period_end > now()
    ),
    (
      select membership.starts_at
      from public.vip_memberships membership
      where membership.id = p_membership_id
    ),
    date_trunc('month', now())
  );
$$;

create or replace function public.vip_current_period_end(p_membership_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select max(pay.period_end)
      from public.vip_payments pay
      where pay.membership_id = p_membership_id
        and pay.status = 'approved'
        and pay.period_start <= now()
        and pay.period_end > now()
    ),
    (
      select membership.ends_at
      from public.vip_memberships membership
      where membership.id = p_membership_id
    ),
    public.vip_current_period_start(p_membership_id) + interval '1 month'
  );
$$;

-- ----------------------------------------------------------------------------
-- 4. Triggers e indices
-- ----------------------------------------------------------------------------

drop trigger if exists vip_plans_set_updated_at on public.vip_plans;
create trigger vip_plans_set_updated_at
before update on public.vip_plans
for each row execute function public.vip_set_updated_at();

drop trigger if exists vip_memberships_set_updated_at on public.vip_memberships;
create trigger vip_memberships_set_updated_at
before update on public.vip_memberships
for each row execute function public.vip_set_updated_at();

drop trigger if exists vip_reservations_set_updated_at on public.vip_reservations;
create trigger vip_reservations_set_updated_at
before update on public.vip_reservations
for each row execute function public.vip_set_updated_at();

drop trigger if exists vip_payments_set_updated_at on public.vip_payments;
create trigger vip_payments_set_updated_at
before update on public.vip_payments
for each row execute function public.vip_set_updated_at();

create index if not exists vip_memberships_status_idx
  on public.vip_memberships(status);
create index if not exists vip_memberships_ends_at_idx
  on public.vip_memberships(ends_at);
create index if not exists vip_reservations_user_idx
  on public.vip_reservations(user_id, starts_at desc);
create index if not exists vip_reservations_time_idx
  on public.vip_reservations(starts_at, ends_at);
create index if not exists vip_access_logs_membership_idx
  on public.vip_access_logs(membership_id, checked_in_at desc);
create index if not exists vip_payments_membership_idx
  on public.vip_payments(membership_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 5. Funciones del cliente
-- ----------------------------------------------------------------------------

create or replace function public.vip_request_membership(
  p_plan_code text default 'vip-mensual',
  p_payment_method text default 'pending',
  p_auto_renew boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
  v_membership public.vip_memberships;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion para solicitar la membresia.';
  end if;

  if p_payment_method not in (
    'pending', 'cash', 'nequi', 'daviplata', 'wompi',
    'mercadopago', 'card', 'pse', 'bank_transfer'
  ) then
    raise exception 'Metodo de pago no valido.';
  end if;

  select id into v_plan_id
  from public.vip_plans
  where code = p_plan_code and is_active = true;

  if v_plan_id is null then
    raise exception 'El plan seleccionado no esta disponible.';
  end if;

  select * into v_membership
  from public.vip_memberships
  where user_id = v_user_id
  for update;

  if found and v_membership.status in ('requested', 'active', 'past_due', 'suspended') then
    return v_membership.id;
  end if;

  insert into public.vip_memberships (
    user_id, plan_id, status, preferred_payment_method, auto_renew
  )
  values (
    v_user_id, v_plan_id, 'requested', p_payment_method, p_auto_renew
  )
  on conflict (user_id) do update set
    plan_id = excluded.plan_id,
    status = 'requested',
    preferred_payment_method = excluded.preferred_payment_method,
    auto_renew = excluded.auto_renew,
    cancellation_requested_at = null,
    internal_notes = null
  returning id into v_membership.id;

  return v_membership.id;
end;
$$;

create or replace function public.vip_create_reservation(
  p_starts_at timestamptz,
  p_duration_minutes integer default 120
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.vip_memberships;
  v_plan public.vip_plans;
  v_settings public.vip_settings;
  v_ends_at timestamptz;
  v_period_start timestamptz;
  v_visits integer;
  v_overlaps integer;
  v_reservation_id uuid;
  v_local_start timestamp;
  v_local_end timestamp;
begin
  if v_user_id is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  select * into v_membership
  from public.vip_memberships
  where user_id = v_user_id;

  if not found or v_membership.status <> 'active' then
    raise exception 'La membresia debe estar activa para reservar.';
  end if;

  if not v_membership.adult_verified then
    raise exception 'La verificacion de identidad y mayoria de edad esta pendiente.';
  end if;

  if v_membership.ends_at is not null and v_membership.ends_at <= now() then
    raise exception 'La membresia esta vencida.';
  end if;

  select * into v_plan from public.vip_plans where id = v_membership.plan_id;
  select * into v_settings from public.vip_settings where id = 1;

  if p_duration_minutes < 30 or p_duration_minutes > v_plan.max_visit_minutes then
    raise exception 'La duracion debe estar entre 30 y % minutos.', v_plan.max_visit_minutes;
  end if;

  if p_starts_at < now() + interval '30 minutes' then
    raise exception 'La reserva debe realizarse con minimo 30 minutos de anticipacion.';
  end if;

  v_ends_at := p_starts_at + make_interval(mins => p_duration_minutes);

  if v_membership.ends_at is not null and v_ends_at > v_membership.ends_at then
    raise exception 'La reserva supera la vigencia de la membresia.';
  end if;

  v_local_start := p_starts_at at time zone v_settings.timezone;
  v_local_end := v_ends_at at time zone v_settings.timezone;

  if v_local_start::date <> v_local_end::date
     or v_local_start::time < v_settings.opening_time
     or v_local_end::time > v_settings.closing_time then
    raise exception 'La reserva esta fuera del horario de la sala.';
  end if;

  v_period_start := public.vip_current_period_start(v_membership.id);

  select count(*) into v_visits
  from public.vip_access_logs
  where membership_id = v_membership.id
    and checked_in_at >= v_period_start
    and checked_in_at < public.vip_current_period_end(v_membership.id);

  if v_visits >= v_plan.visit_limit then
    raise exception 'Ya utilizaste las visitas disponibles del periodo.';
  end if;

  if exists (
    select 1 from public.vip_reservations
    where membership_id = v_membership.id
      and status in ('confirmed', 'checked_in')
      and starts_at < v_ends_at
      and ends_at > p_starts_at
  ) then
    raise exception 'Ya tienes una reserva en ese horario.';
  end if;

  select count(*) into v_overlaps
  from public.vip_reservations
  where status in ('confirmed', 'checked_in')
    and starts_at < v_ends_at
    and ends_at > p_starts_at;

  if v_overlaps >= v_settings.room_capacity then
    raise exception 'No hay cupos disponibles para ese horario.';
  end if;

  insert into public.vip_reservations (
    membership_id, user_id, starts_at, ends_at, status
  )
  values (
    v_membership.id, v_user_id, p_starts_at, v_ends_at, 'confirmed'
  )
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

create or replace function public.vip_cancel_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vip_reservations
  set status = 'cancelled', cancelled_at = now()
  where id = p_reservation_id
    and user_id = auth.uid()
    and status = 'confirmed'
    and starts_at > now();

  if not found then
    raise exception 'No se pudo cancelar la reserva.';
  end if;
end;
$$;

create or replace function public.vip_request_cancellation()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vip_memberships
  set auto_renew = false, cancellation_requested_at = now()
  where user_id = auth.uid()
    and status in ('requested', 'active', 'past_due');

  if not found then
    raise exception 'No existe una membresia cancelable.';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. Funciones administrativas, NFC y control de ingreso
-- ----------------------------------------------------------------------------

create or replace function public.vip_admin_verify_adult(
  p_membership_id uuid,
  p_verified boolean
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

  update public.vip_memberships
  set
    adult_verified = p_verified,
    adult_verified_at = case when p_verified then now() else null end,
    adult_verified_by = case when p_verified then auth.uid() else null end
  where id = p_membership_id;

  if not found then
    raise exception 'Membresia no encontrada.';
  end if;
end;
$$;

create or replace function public.vip_admin_update_membership(
  p_membership_id uuid,
  p_status text,
  p_days integer default 30
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

  if p_status not in ('requested', 'active', 'past_due', 'suspended', 'cancelled', 'expired') then
    raise exception 'Estado no valido.';
  end if;

  if p_days < 1 or p_days > 366 then
    raise exception 'La vigencia indicada no es valida.';
  end if;

  update public.vip_memberships
  set
    status = p_status,
    starts_at = case when p_status = 'active' then now() else starts_at end,
    ends_at = case when p_status = 'active' then now() + make_interval(days => p_days) else ends_at end,
    cancellation_requested_at = case when p_status = 'cancelled' then now() else cancellation_requested_at end
  where id = p_membership_id;

  if not found then
    raise exception 'Membresia no encontrada.';
  end if;

  if p_status = 'active' and not exists (
    select 1 from public.vip_access_tokens
    where membership_id = p_membership_id and is_active = true
  ) then
    insert into public.vip_access_tokens (membership_id, created_by)
    values (p_membership_id, auth.uid());
  end if;
end;
$$;

create or replace function public.vip_admin_rotate_access_token(p_membership_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  if not exists (select 1 from public.vip_memberships where id = p_membership_id) then
    raise exception 'Membresia no encontrada.';
  end if;

  update public.vip_access_tokens
  set is_active = false, revoked_at = now()
  where membership_id = p_membership_id and is_active = true;

  insert into public.vip_access_tokens (membership_id, created_by)
  values (p_membership_id, auth.uid())
  returning token into v_token;

  return v_token;
end;
$$;

create or replace function public.vip_admin_record_payment(
  p_membership_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_external_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_period_start timestamptz;
  v_period_end timestamptz;
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  if p_amount <= 0 then
    raise exception 'El valor del pago no es valido.';
  end if;

  if p_payment_method not in (
    'cash', 'nequi', 'daviplata', 'wompi',
    'mercadopago', 'card', 'pse', 'bank_transfer'
  ) then
    raise exception 'Metodo de pago no valido.';
  end if;

  select greatest(now(), coalesce(ends_at, now()))
  into v_period_start
  from public.vip_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'Membresia no encontrada.';
  end if;

  v_period_end := v_period_start + interval '30 days';

  insert into public.vip_payments (
    membership_id,
    amount,
    payment_method,
    status,
    period_start,
    period_end,
    external_reference,
    recorded_by,
    notes,
    paid_at
  )
  values (
    p_membership_id,
    p_amount,
    p_payment_method,
    'approved',
    v_period_start,
    v_period_end,
    nullif(trim(p_external_reference), ''),
    auth.uid(),
    nullif(trim(p_notes), ''),
    now()
  )
  returning id into v_payment_id;

  update public.vip_memberships
  set
    status = 'active',
    starts_at = case when starts_at is null or ends_at is null or ends_at <= now()
      then now()
      else starts_at
    end,
    ends_at = v_period_end,
    preferred_payment_method = p_payment_method,
    cancellation_requested_at = null
  where id = p_membership_id;

  if not exists (
    select 1 from public.vip_access_tokens
    where membership_id = p_membership_id and is_active = true
  ) then
    insert into public.vip_access_tokens (membership_id, created_by)
    values (p_membership_id, auth.uid());
  end if;

  return v_payment_id;
end;
$$;

create or replace function public.vip_validate_access(p_token uuid)
returns table (
  membership_id uuid,
  member_number text,
  member_name text,
  status text,
  adult_verified boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  visits_used bigint,
  visit_limit integer,
  currently_inside boolean,
  access_allowed boolean,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.vip_is_admin() then
    raise exception 'Inicia sesion como administrador para validar el acceso.';
  end if;

  return query
  select
    m.id,
    m.member_number,
    coalesce(p.full_name, 'Cliente VIP'),
    m.status,
    m.adult_verified,
    m.starts_at,
    m.ends_at,
    (
      select count(*)
      from public.vip_access_logs l
      where l.membership_id = m.id
        and l.checked_in_at >= public.vip_current_period_start(m.id)
        and l.checked_in_at < public.vip_current_period_end(m.id)
    ) as visits_used,
    pl.visit_limit,
    exists (
      select 1 from public.vip_access_logs open_log
      where open_log.membership_id = m.id and open_log.checked_out_at is null
    ) as currently_inside,
    (
      t.is_active
      and m.status = 'active'
      and m.adult_verified
      and (m.starts_at is null or m.starts_at <= now())
      and (m.ends_at is null or m.ends_at > now())
    ) as access_allowed,
    case
      when not t.is_active then 'Tarjeta inactiva.'
      when m.status <> 'active' then 'Membresia no activa.'
      when not m.adult_verified then 'Falta verificar identidad y mayoria de edad.'
      when m.starts_at is not null and m.starts_at > now() then 'La vigencia aun no inicia.'
      when m.ends_at is not null and m.ends_at <= now() then 'La membresia esta vencida.'
      else 'Acceso habilitado.'
    end as reason
  from public.vip_access_tokens t
  join public.vip_memberships m on m.id = t.membership_id
  join public.vip_plans pl on pl.id = m.plan_id
  left join public.profiles p on p.id = m.user_id
  where t.token = p_token;
end;
$$;

create or replace function public.vip_check_in(
  p_token uuid,
  p_access_method text default 'nfc'
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
  v_visits integer;
  v_reservation_id uuid;
  v_log_id uuid;
begin
  if not public.vip_is_admin() then
    raise exception 'Acceso administrativo requerido.';
  end if;

  if p_access_method not in ('nfc', 'qr', 'manual') then
    raise exception 'Metodo de acceso no valido.';
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

  if exists (
    select 1 from public.vip_access_logs
    where membership_id = v_membership.id and checked_out_at is null
  ) then
    raise exception 'El miembro ya tiene un ingreso abierto.';
  end if;

  select * into v_plan from public.vip_plans where id = v_membership.plan_id;

  select count(*) into v_visits
  from public.vip_access_logs
  where membership_id = v_membership.id
    and checked_in_at >= public.vip_current_period_start(v_membership.id)
    and checked_in_at < public.vip_current_period_end(v_membership.id);

  if v_visits >= v_plan.visit_limit then
    raise exception 'El miembro ya utilizo las visitas disponibles.';
  end if;

  select id into v_reservation_id
  from public.vip_reservations
  where membership_id = v_membership.id
    and status = 'confirmed'
    and starts_at <= now() + interval '2 hours'
    and ends_at >= now() - interval '2 hours'
  order by abs(extract(epoch from (starts_at - now())))
  limit 1;

  insert into public.vip_access_logs (
    membership_id, token_id, reservation_id, checked_in_by, access_method
  )
  values (
    v_membership.id, v_token.id, v_reservation_id, auth.uid(), p_access_method
  )
  returning id into v_log_id;

  if v_reservation_id is not null then
    update public.vip_reservations
    set status = 'checked_in'
    where id = v_reservation_id;
  end if;

  return v_log_id;
end;
$$;

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

  if v_reservation_id is not null then
    update public.vip_reservations
    set status = 'completed'
    where id = v_reservation_id;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. Row Level Security
-- ----------------------------------------------------------------------------

alter table public.vip_settings enable row level security;
alter table public.vip_plans enable row level security;
alter table public.vip_memberships enable row level security;
alter table public.vip_access_tokens enable row level security;
alter table public.vip_reservations enable row level security;
alter table public.vip_access_logs enable row level security;
alter table public.vip_payments enable row level security;

drop policy if exists "vip_settings_read" on public.vip_settings;
create policy "vip_settings_read"
  on public.vip_settings for select
  to authenticated
  using (true);

drop policy if exists "vip_settings_admin" on public.vip_settings;
create policy "vip_settings_admin"
  on public.vip_settings for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

drop policy if exists "vip_plans_public_read" on public.vip_plans;
create policy "vip_plans_public_read"
  on public.vip_plans for select
  to anon, authenticated
  using (is_active or public.vip_is_admin());

drop policy if exists "vip_plans_admin" on public.vip_plans;
create policy "vip_plans_admin"
  on public.vip_plans for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

drop policy if exists "vip_memberships_owner_read" on public.vip_memberships;
create policy "vip_memberships_owner_read"
  on public.vip_memberships for select
  to authenticated
  using (user_id = auth.uid() or public.vip_is_admin());

drop policy if exists "vip_memberships_admin" on public.vip_memberships;
create policy "vip_memberships_admin"
  on public.vip_memberships for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

drop policy if exists "vip_tokens_owner_read" on public.vip_access_tokens;
create policy "vip_tokens_owner_read"
  on public.vip_access_tokens for select
  to authenticated
  using (
    public.vip_is_admin()
    or exists (
      select 1 from public.vip_memberships m
      where m.id = membership_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "vip_tokens_admin" on public.vip_access_tokens;
create policy "vip_tokens_admin"
  on public.vip_access_tokens for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

drop policy if exists "vip_reservations_owner_read" on public.vip_reservations;
create policy "vip_reservations_owner_read"
  on public.vip_reservations for select
  to authenticated
  using (user_id = auth.uid() or public.vip_is_admin());

drop policy if exists "vip_reservations_admin" on public.vip_reservations;
create policy "vip_reservations_admin"
  on public.vip_reservations for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

drop policy if exists "vip_access_logs_owner_read" on public.vip_access_logs;
create policy "vip_access_logs_owner_read"
  on public.vip_access_logs for select
  to authenticated
  using (
    public.vip_is_admin()
    or exists (
      select 1 from public.vip_memberships m
      where m.id = membership_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "vip_access_logs_admin" on public.vip_access_logs;
create policy "vip_access_logs_admin"
  on public.vip_access_logs for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

drop policy if exists "vip_payments_owner_read" on public.vip_payments;
create policy "vip_payments_owner_read"
  on public.vip_payments for select
  to authenticated
  using (
    public.vip_is_admin()
    or exists (
      select 1 from public.vip_memberships m
      where m.id = membership_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "vip_payments_admin" on public.vip_payments;
create policy "vip_payments_admin"
  on public.vip_payments for all
  to authenticated
  using (public.vip_is_admin())
  with check (public.vip_is_admin());

-- Las escrituras del cliente se realizan solo mediante RPC validadas.
revoke insert, update, delete on public.vip_memberships from anon, authenticated;
revoke insert, update, delete on public.vip_access_tokens from anon, authenticated;
revoke insert, update, delete on public.vip_reservations from anon, authenticated;
revoke insert, update, delete on public.vip_access_logs from anon, authenticated;
revoke insert, update, delete on public.vip_payments from anon, authenticated;

revoke execute on function public.vip_current_period_start(uuid) from public, anon, authenticated;
revoke execute on function public.vip_current_period_end(uuid) from public, anon, authenticated;

grant select on public.vip_settings to authenticated;
grant select on public.vip_plans to anon, authenticated;
grant select on public.vip_memberships to authenticated;
grant select on public.vip_access_tokens to authenticated;
grant select on public.vip_reservations to authenticated;
grant select on public.vip_access_logs to authenticated;
grant select on public.vip_payments to authenticated;

grant execute on function public.vip_request_membership(text, text, boolean) to authenticated;
grant execute on function public.vip_create_reservation(timestamptz, integer) to authenticated;
grant execute on function public.vip_cancel_reservation(uuid) to authenticated;
grant execute on function public.vip_request_cancellation() to authenticated;
grant execute on function public.vip_admin_verify_adult(uuid, boolean) to authenticated;
grant execute on function public.vip_admin_update_membership(uuid, text, integer) to authenticated;
grant execute on function public.vip_admin_rotate_access_token(uuid) to authenticated;
grant execute on function public.vip_admin_record_payment(uuid, numeric, text, text, text) to authenticated;
grant execute on function public.vip_validate_access(uuid) to authenticated;
grant execute on function public.vip_check_in(uuid, text) to authenticated;
grant execute on function public.vip_check_out(uuid) to authenticated;

comment on table public.vip_memberships is
  'Membresias de la sala fisica VIP; no contiene documentos de identidad.';
comment on column public.vip_memberships.adult_verified is
  'Confirmacion administrativa de identidad y mayoria de edad. No reemplaza la revision del documento fisico.';
comment on column public.vip_access_tokens.token is
  'Codigo opaco grabado como URL en NFC. No contiene datos personales.';

-- ============================================================================
-- FIN
-- Comprobacion rapida:
-- select code, name, monthly_price, visit_limit from public.vip_plans;
-- select * from public.vip_settings;
-- ============================================================================
