-- ============================================================
-- 002_harden_functions — hardening de seguridad
-- Resuelve avisos del linter de Supabase tras 001 (search_path + acceso al reporte).
-- ============================================================

-- Fijar search_path (evita secuestro vía search_path mutable).
alter function public.update_updated_at() set search_path = '';
alter function public.get_satisfaction_report(timestamptz, timestamptz, text) set search_path = '';

-- El reporte es sólo para admins (flujo B del .md): quitar acceso a anon/public,
-- mantener sólo para usuarios autenticados (Cecilia y admins).
revoke execute on function public.get_satisfaction_report(timestamptz, timestamptz, text) from anon, public;
grant execute on function public.get_satisfaction_report(timestamptz, timestamptz, text) to authenticated;

-- Avisos que quedan y son INTENCIONALES (no remediar):
--  - survey_responses INSERT con with_check (true): cualquiera puede enviar la
--    encuesta sin auth; el anti-spam es físico (estar en SEGA). Ver .md §5.
--  - authenticated puede ejecutar get_satisfaction_report (SECURITY DEFINER):
--    es justo el caso de uso (admins consultan el reporte agregado).
