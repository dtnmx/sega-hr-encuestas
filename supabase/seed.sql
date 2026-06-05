-- Seed inicial — ubicaciones de los QR (§3).
-- Ajustar según las ubicaciones reales de SEGA (decisión pendiente #2).
insert into public.locations (code, name) values
  ('planta1', 'Planta 1'),
  ('oficinas', 'Oficinas Principales'),
  ('taller', 'Taller'),
  ('comedor', 'Comedor')
on conflict (code) do nothing;
