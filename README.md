# Encuesta de Satisfacción SEGA

Aplicación de encuesta de satisfacción para empleados de SEGA, accesible por
QR físico. Frontend Vue 3 + Vite, backend Supabase (Postgres + Auth + Storage
+ Realtime), deploy en Vercel.

> Plan completo: `arquitectura-encuesta-sega.md`. Patrones de referencia:
> Operly (`C:\Operly`, componentes Vue + MEMECS) y Control de Patio
> (`C:\SEGA\sega-ctrl-patio`, convención Supabase + Vercel).

## Setup local

```bash
npm install
cp .env.local.example .env.local   # rellenar credenciales de Supabase
npm run dev
```

## Estructura

```
src/
├── lib/          # supabase.js (cliente), audio-recorder.js, memecs.js
├── stores/       # Pinia: survey.js, auth.js
├── router/       # rutas: / (pública), /admin/*
├── views/        # PublicSurveyView, ThankYouView, Admin*
├── components/   # survey/ (form) + admin/ (dashboard)
└── composables/  # useRealtimeResponses, useSatisfactionReport
supabase/
├── migrations/   # schema versionado (001_initial_schema.sql)
└── seed.sql      # ubicaciones de los QR
```

## Estado

Commit 1: scaffold + estructura + schema versionado. Sin features todavía.
Schema **aún no aplicado** a Supabase (proyecto pendiente de decidir).

## Roadmap

- **Fase 1** — MVP: formulario público (6 pantallas), login admin, dashboard básico, QRs, deploy.
- **Fase 2** — Análisis MEMECS: % satisfacción, matriz 2×2, plan de mejora.
- **Fase 3** — Realtime, animaciones, email resumen, export.
- **Fase 4** — Transcripción de audios, integraciones, PWA.
