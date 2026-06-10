-- ============================================================
-- 006_save_response_rpc — camino de escritura del formulario público
-- Problema: anon no puede hacer UPDATE bajo RLS (para actualizar una fila hay
-- que poder verla vía SELECT, y abrir SELECT a anon filtraría los borradores
-- de todos). Solución: una función SECURITY DEFINER que inserta/actualiza la
-- fila por su UUID, y SOLO si aún no fue enviada (is_complete=false). Es el
-- único camino de escritura del público (guardado parcial + envío final).
-- ============================================================

create or replace function public.save_survey_response(
  p_id uuid,
  p_data jsonb,
  p_complete boolean default false
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_completed boolean;
begin
  select is_complete into v_completed
  from public.survey_responses where id = p_id;

  -- No se puede modificar una respuesta ya enviada (protege datos/edición de RH).
  if v_completed is true then
    raise exception 'La respuesta ya fue enviada y no puede modificarse.';
  end if;

  insert into public.survey_responses (
    id, is_anonymous, employee_name,
    jefatura_comunicacion, jefatura_trato, jefatura_apoyo, jefatura_comentario, jefatura_audio_url,
    companeros_equipo, companeros_respeto, companeros_ambiente, companeros_comentario, companeros_audio_url,
    seguridad_nivel, seguridad_comentario, seguridad_audio_url,
    instalaciones_estado, instalaciones_limpieza, instalaciones_comodidad, instalaciones_comentario, instalaciones_audio_url,
    propuesta_libre, propuesta_audio_url,
    importancia_top, user_agent, is_complete
  ) values (
    p_id,
    coalesce((p_data->>'is_anonymous')::boolean, true),
    p_data->>'employee_name',
    (p_data->>'jefatura_comunicacion')::smallint,
    (p_data->>'jefatura_trato')::smallint,
    (p_data->>'jefatura_apoyo')::smallint,
    p_data->>'jefatura_comentario',
    p_data->>'jefatura_audio_url',
    (p_data->>'companeros_equipo')::smallint,
    (p_data->>'companeros_respeto')::smallint,
    (p_data->>'companeros_ambiente')::smallint,
    p_data->>'companeros_comentario',
    p_data->>'companeros_audio_url',
    (p_data->>'seguridad_nivel')::smallint,
    p_data->>'seguridad_comentario',
    p_data->>'seguridad_audio_url',
    (p_data->>'instalaciones_estado')::smallint,
    (p_data->>'instalaciones_limpieza')::smallint,
    (p_data->>'instalaciones_comodidad')::smallint,
    p_data->>'instalaciones_comentario',
    p_data->>'instalaciones_audio_url',
    p_data->>'propuesta_libre',
    p_data->>'propuesta_audio_url',
    coalesce((select array(select jsonb_array_elements_text(p_data->'importancia_top'))), '{}'),
    p_data->>'user_agent',
    p_complete
  )
  on conflict (id) do update set
    is_anonymous = excluded.is_anonymous,
    employee_name = excluded.employee_name,
    jefatura_comunicacion = excluded.jefatura_comunicacion,
    jefatura_trato = excluded.jefatura_trato,
    jefatura_apoyo = excluded.jefatura_apoyo,
    jefatura_comentario = excluded.jefatura_comentario,
    jefatura_audio_url = excluded.jefatura_audio_url,
    companeros_equipo = excluded.companeros_equipo,
    companeros_respeto = excluded.companeros_respeto,
    companeros_ambiente = excluded.companeros_ambiente,
    companeros_comentario = excluded.companeros_comentario,
    companeros_audio_url = excluded.companeros_audio_url,
    seguridad_nivel = excluded.seguridad_nivel,
    seguridad_comentario = excluded.seguridad_comentario,
    seguridad_audio_url = excluded.seguridad_audio_url,
    instalaciones_estado = excluded.instalaciones_estado,
    instalaciones_limpieza = excluded.instalaciones_limpieza,
    instalaciones_comodidad = excluded.instalaciones_comodidad,
    instalaciones_comentario = excluded.instalaciones_comentario,
    instalaciones_audio_url = excluded.instalaciones_audio_url,
    propuesta_libre = excluded.propuesta_libre,
    propuesta_audio_url = excluded.propuesta_audio_url,
    importancia_top = excluded.importancia_top,
    user_agent = excluded.user_agent,
    is_complete = excluded.is_complete;
end;
$$;

revoke all on function public.save_survey_response(uuid, jsonb, boolean) from public;
grant execute on function public.save_survey_response(uuid, jsonb, boolean) to anon, authenticated;
