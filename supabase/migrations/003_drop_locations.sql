-- ============================================================
-- 003_drop_locations — simplificación a un solo QR
-- Decisión: hay un único QR, no se captura ubicación/área por respuesta.
-- Se elimina la columna `location` (arrastra su FK e índice idx_survey_location)
-- y la tabla `locations` (con sus políticas RLS).
-- ============================================================

alter table public.survey_responses drop column location;
drop table public.locations;
