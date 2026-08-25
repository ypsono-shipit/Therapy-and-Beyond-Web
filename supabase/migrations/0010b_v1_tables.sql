-- Unlimited check-ins (drop once-per-day unique index). Adaptive frequency is client-side.
drop index if exists idx_checkins_one_per_day;

alter table check_ins add column if not exists appetite smallint check (appetite is null or appetite between 1 and 10);
alter table check_ins add column if not exists functioning smallint check (functioning is null or functioning between 1 and 10);
alter table check_ins add column if not exists coping_used text[];
alter table check_ins add column if not exists wins text;
alter table check_ins add column if not exists stressors text;
alter table check_ins add column if not exists cycle_phase text;

alter table clinicians add column if not exists office_hours text;
alter table clinicians add column if not exists office_hours_tz text not null default 'Asia/Singapore';
alter table clinicians add column if not exists office_hours_note text;

alter table patients add column if not exists checkin_cadence text not null default 'adaptive';
alter table patients add column if not exists cycle_tracking_opt_in boolean not null default false;

alter table alerts add column if not exists clinician_rating smallint check (clinician_rating is null or clinician_rating between 1 and 5);
alter table alerts add column if not exists clinician_feedback text;
alter table alerts add column if not exists dismissed_as_noise boolean not null default false;
alter table alerts add column if not exists rated_at timestamptz;

-- Emergency contacts on the user account
create table if not exists emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  name text not null,
  relationship text,
  phone text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_emergency_contacts_patient on emergency_contacts(patient_id);

-- Safety plan (one current plan per patient)
create table if not exists safety_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references patients(id) on delete cascade,
  warning_signs text[] not null default '{}',
  internal_coping text[] not null default '{}',
  people_and_places text[] not null default '{}',
  professional_help text[] not null default '{}',
  make_environment_safe text[] not null default '{}',
  reasons_for_living text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Coping toolkit items (presets copied per patient + custom)
create table if not exists coping_items (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  kind text not null check (kind in ('grounding','breathing','crisis_plan','playlist','affirmation','distraction','custom')),
  title text not null,
  body text,
  url text,
  is_preset boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_coping_items_patient on coping_items(patient_id, kind);

-- "What worked for me"
create table if not exists helpful_strategies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  strategy text not null,
  source text not null default 'patient',
  times_used int not null default 1,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_helpful_strategies_patient on helpful_strategies(patient_id, last_used_at desc);

-- Grounding reminder cadence (weekly default)
create table if not exists reminder_prefs (
  patient_id uuid primary key references patients(id) on delete cascade,
  grounding_cadence text not null default 'weekly' check (grounding_cadence in ('daily','weekly','biweekly','off')),
  set_by text not null default 'patient' check (set_by in ('patient','clinician')),
  updated_at timestamptz not null default now()
);

-- Named life events for the pre-session timeline
create table if not exists life_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  label text not null,
  occurred_on date not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_life_events_patient on life_events(patient_id, occurred_on desc);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table emergency_contacts enable row level security;
alter table safety_plans enable row level security;
alter table coping_items enable row level security;
alter table helpful_strategies enable row level security;
alter table reminder_prefs enable row level security;
alter table life_events enable row level security;

create policy "patient or clinician reads emergency contacts" on emergency_contacts for select
  using (is_self(patient_id) or is_clinician_for_patient(patient_id));
create policy "patient writes emergency contacts" on emergency_contacts for insert
  with check (is_self(patient_id));
create policy "patient updates emergency contacts" on emergency_contacts for update
  using (is_self(patient_id)) with check (is_self(patient_id));
create policy "patient deletes emergency contacts" on emergency_contacts for delete
  using (is_self(patient_id));

create policy "patient or clinician reads safety plan" on safety_plans for select
  using (is_self(patient_id) or is_clinician_for_patient(patient_id));
create policy "patient upserts safety plan" on safety_plans for insert
  with check (is_self(patient_id));
create policy "patient updates safety plan" on safety_plans for update
  using (is_self(patient_id)) with check (is_self(patient_id));

create policy "patient or clinician reads coping" on coping_items for select
  using (is_self(patient_id) or is_clinician_for_patient(patient_id));
create policy "patient writes coping" on coping_items for insert
  with check (is_self(patient_id));
create policy "patient updates coping" on coping_items for update
  using (is_self(patient_id)) with check (is_self(patient_id));
create policy "patient deletes coping" on coping_items for delete
  using (is_self(patient_id));

create policy "patient or clinician reads strategies" on helpful_strategies for select
  using (is_self(patient_id) or is_clinician_for_patient(patient_id));
create policy "patient writes strategies" on helpful_strategies for insert
  with check (is_self(patient_id));
create policy "patient updates strategies" on helpful_strategies for update
  using (is_self(patient_id)) with check (is_self(patient_id));
create policy "patient deletes strategies" on helpful_strategies for delete
  using (is_self(patient_id));

create policy "patient or clinician reads reminders" on reminder_prefs for select
  using (is_self(patient_id) or is_clinician_for_patient(patient_id));
create policy "patient writes reminders" on reminder_prefs for insert
  with check (is_self(patient_id));
create policy "patient or clinician updates reminders" on reminder_prefs for update
  using (is_self(patient_id) or is_clinician_for_patient(patient_id))
  with check (is_self(patient_id) or is_clinician_for_patient(patient_id));

create policy "patient or clinician reads life events" on life_events for select
  using (is_self(patient_id) or is_clinician_for_patient(patient_id));
create policy "patient writes life events" on life_events for insert
  with check (is_self(patient_id));
create policy "clinician writes life events" on life_events for insert
  with check (is_clinician_for_patient(patient_id));
create policy "patient or clinician updates life events" on life_events for update
  using (is_self(patient_id) or is_clinician_for_patient(patient_id));
create policy "patient or clinician deletes life events" on life_events for delete
  using (is_self(patient_id) or is_clinician_for_patient(patient_id));

-- Clinicians may rate / dismiss alerts (existing resolve_alert RPC stays).
create or replace function public.rate_alert(p_alert_id uuid, p_rating smallint, p_feedback text, p_noise boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_patient_id uuid;
begin
  select patient_id into v_patient_id from alerts where id = p_alert_id;
  if not is_clinician_for_patient(v_patient_id) then
    raise exception 'not authorized';
  end if;
  update alerts set
    clinician_rating = p_rating,
    clinician_feedback = p_feedback,
    dismissed_as_noise = coalesce(p_noise, false),
    rated_at = now(),
    resolved = true,
    resolved_at = coalesce(resolved_at, now()),
    resolved_by = auth.uid()
  where id = p_alert_id;
end;
$$;
grant execute on function public.rate_alert(uuid, smallint, text, boolean) to authenticated;
