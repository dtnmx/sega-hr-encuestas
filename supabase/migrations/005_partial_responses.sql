-- ============================================================
-- 005_partial_responses — guardar lo que el empleado alcanzó a llenar
-- Reunión de seguimiento: si alguien se sale sin terminar, su avance no se pierde.
-- El formulario hace upsert de la fila con is_complete=false mientras avanza;
-- al presionar "Enviar" la misma fila pasa a is_complete=true.
-- ============================================================

alter table public.survey_responses
  add column is_complete boolean not null default false;

-- Filtrar completas vs parciales en el dashboard.
create index idx_survey_is_complete on public.survey_responses(is_complete);

-- Anon (formulario público) puede ACTUALIZAR su borrador mientras siga
-- incompleto. with check (true) permite la transición a is_complete=true al
-- enviar. Una vez completa, using (is_complete=false) ya no la deja tocar →
-- protege las ediciones de RH (status, notas). El id es un UUID v4 no adivinable.
create policy "anon puede actualizar borrador incompleto"
  on public.survey_responses for update
  to anon
  using (is_complete = false)
  with check (true);
