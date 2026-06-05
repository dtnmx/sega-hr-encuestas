-- ============================================================
-- 001_initial_schema — Encuesta de Satisfacción SEGA
-- Schema completo: tablas, índices, Storage, RLS y función de reporte.
-- Tomado del documento de arquitectura (§3-5, §8C).
-- NOTA: versionado en git, aún NO aplicado a Supabase (decisión proyecto pendiente).
-- ============================================================

-- ── locations — ubicaciones físicas de los QR ───────────────
create table public.locations (
  code text primary key,  -- 'planta1', 'oficinas', 'taller', 'comedor'
  name text not null,     -- 'Planta 1', 'Oficinas Principales', etc.
  active boolean default true,
  created_at timestamptz default now()
);

-- ── survey_responses — una fila por encuesta enviada ────────
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz default now(),

  -- Contexto
  location text references public.locations(code),
  is_anonymous boolean default true,
  employee_name text,  -- null si is_anonymous = true

  -- 1. Jefatura inmediata
  jefatura_comunicacion smallint check (jefatura_comunicacion between 1 and 5),
  jefatura_trato smallint check (jefatura_trato between 1 and 5),
  jefatura_apoyo smallint check (jefatura_apoyo between 1 and 5),
  jefatura_comentario text,
  jefatura_audio_url text,

  -- 2. Compañeros de trabajo
  companeros_equipo smallint check (companeros_equipo between 1 and 5),
  companeros_respeto smallint check (companeros_respeto between 1 and 5),
  companeros_ambiente smallint check (companeros_ambiente between 1 and 5),
  companeros_comentario text,
  companeros_audio_url text,

  -- 3. Seguridad
  seguridad_nivel smallint check (seguridad_nivel between 1 and 5),
  seguridad_comentario text,
  seguridad_audio_url text,

  -- 4. Instalaciones
  instalaciones_estado smallint check (instalaciones_estado between 1 and 5),
  instalaciones_limpieza smallint check (instalaciones_limpieza between 1 and 5),
  instalaciones_comodidad smallint check (instalaciones_comodidad between 1 and 5),
  instalaciones_comentario text,
  instalaciones_audio_url text,

  -- 5. Propuesta libre
  propuesta_libre text,
  propuesta_audio_url text,

  -- 6. Importancia relativa (top 2 áreas)
  importancia_top text[] default '{}',
  -- Valores válidos: 'jefatura', 'companeros', 'seguridad', 'instalaciones'

  -- Estado de seguimiento (lo edita Cecilia)
  status text check (status in ('nuevo', 'revisado', 'atendido')) default 'nuevo',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  internal_notes text,

  -- Anti-spam metadata
  fingerprint text,
  user_agent text,
  ip_hash text
);

create index idx_survey_submitted_at on public.survey_responses(submitted_at desc);
create index idx_survey_location on public.survey_responses(location);
create index idx_survey_status on public.survey_responses(status);

-- ── improvement_plans — plan de mejora MEMECS ───────────────
create table public.improvement_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  area text not null check (area in ('jefatura', 'companeros', 'seguridad', 'instalaciones', 'otro')),
  objetivo text,
  acciones text,
  indicador text,
  meta text,
  responsable text,  -- texto libre, no FK a auth.users
  status text check (status in ('abierto', 'en_progreso', 'cerrado')) default 'abierto',
  due_date date,
  notes text,
  created_by uuid references auth.users(id)
);

create index idx_plans_status on public.improvement_plans(status);
create index idx_plans_due_date on public.improvement_plans(due_date);

-- Trigger para mantener updated_at
create or replace function public.update_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger plans_updated_at before update on public.improvement_plans
  for each row execute function public.update_updated_at();

-- ── Storage: bucket privado para audios ─────────────────────
insert into storage.buckets (id, name, public)
values ('survey-audios', 'survey-audios', false);

-- Anon puede subir (durante la encuesta)
create policy "anon can upload survey audio"
  on storage.objects for insert
  with check (bucket_id = 'survey-audios');

-- Sólo usuarios autenticados pueden leer (Cecilia y admins)
create policy "auth can read survey audio"
  on storage.objects for select
  using (bucket_id = 'survey-audios' and auth.role() = 'authenticated');

-- Sólo auth puede borrar (limpieza)
create policy "auth can delete survey audio"
  on storage.objects for delete
  using (bucket_id = 'survey-audios' and auth.role() = 'authenticated');

-- ── Row Level Security ──────────────────────────────────────
alter table public.survey_responses enable row level security;
alter table public.improvement_plans enable row level security;
alter table public.locations enable row level security;

-- survey_responses
create policy "anon puede insertar encuestas"
  on public.survey_responses for insert
  with check (true);

create policy "auth puede leer todas las encuestas"
  on public.survey_responses for select
  using (auth.role() = 'authenticated');

create policy "auth puede actualizar (revisado, notas)"
  on public.survey_responses for update
  using (auth.role() = 'authenticated');

-- improvement_plans (todo requiere auth)
create policy "auth acceso total a plan de mejora"
  on public.improvement_plans for all
  using (auth.role() = 'authenticated');

-- locations (anon puede leer activas para el form)
create policy "todos pueden leer locations activas"
  on public.locations for select
  using (active = true);

create policy "auth puede modificar locations"
  on public.locations for all
  using (auth.role() = 'authenticated');

-- ── Función de reporte (esqueleto, §8C) ─────────────────────
-- MVP: calcular en el frontend con .select(). Migrar aquí si crece el dataset.
create or replace function public.get_satisfaction_report(
  start_date timestamptz default '1900-01-01',
  end_date timestamptz default '2999-12-31',
  filter_location text default null
) returns json language plpgsql security definer as $$
declare
  result json;
begin
  -- TODO (Fase 2+): avg por área, % satisfacción, importancia, matriz.
  return result;
end;
$$;
