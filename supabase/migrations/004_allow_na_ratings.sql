-- ============================================================
-- 004_allow_na_ratings — opción "No aplica" (N/A) en las preguntas
-- Reunión de seguimiento: cada pregunta de calificación admite N/A.
-- Se guarda como 0 (distinto de null = "no contestó / no llegó").
-- Relaja el CHECK de 1..5 a 0..5 en todas las columnas de rating.
-- ============================================================

alter table public.survey_responses
  drop constraint survey_responses_jefatura_comunicacion_check,
  drop constraint survey_responses_jefatura_trato_check,
  drop constraint survey_responses_jefatura_apoyo_check,
  drop constraint survey_responses_companeros_equipo_check,
  drop constraint survey_responses_companeros_respeto_check,
  drop constraint survey_responses_companeros_ambiente_check,
  drop constraint survey_responses_seguridad_nivel_check,
  drop constraint survey_responses_instalaciones_estado_check,
  drop constraint survey_responses_instalaciones_limpieza_check,
  drop constraint survey_responses_instalaciones_comodidad_check;

alter table public.survey_responses
  add constraint survey_responses_jefatura_comunicacion_check check (jefatura_comunicacion between 0 and 5),
  add constraint survey_responses_jefatura_trato_check check (jefatura_trato between 0 and 5),
  add constraint survey_responses_jefatura_apoyo_check check (jefatura_apoyo between 0 and 5),
  add constraint survey_responses_companeros_equipo_check check (companeros_equipo between 0 and 5),
  add constraint survey_responses_companeros_respeto_check check (companeros_respeto between 0 and 5),
  add constraint survey_responses_companeros_ambiente_check check (companeros_ambiente between 0 and 5),
  add constraint survey_responses_seguridad_nivel_check check (seguridad_nivel between 0 and 5),
  add constraint survey_responses_instalaciones_estado_check check (instalaciones_estado between 0 and 5),
  add constraint survey_responses_instalaciones_limpieza_check check (instalaciones_limpieza between 0 and 5),
  add constraint survey_responses_instalaciones_comodidad_check check (instalaciones_comodidad between 0 and 5);

-- NOTA: 0 = "No aplica" (elección explícita del empleado).
-- null = no contestó (saltó la pregunta o no terminó la encuesta).
-- En métricas/promedios MEMECS, 0 se excluye igual que null.
