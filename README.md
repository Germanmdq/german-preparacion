# Preparación — Germán Asistente

Demo local independiente: video → introducción → 24 preguntas → análisis → resultado.

```bash
pnpm install
pnpm dev
```

Abrir http://localhost:3030. Las preguntas provisionales están únicamente en `data/questions.ts`; textos de resultado en `data/results.ts`; scoring en `lib/assessment/`.

Cada pregunta muestra tres reproductores personalizados y radios independientes; las transcripciones quedan sólo en configuración. Los 72 destinos de audio están preparados bajo `public/audio/questions/q01` a `q24`. Sólo se reproduce una opción a la vez, escuchar no selecciona y no existe autoplay. Los seis resultados incluyen su propio `audioSrc` opcional.

## Persistencia

Cada recorrido usa un `session_id` anónimo y conserva en `localStorage` fechas, las 24 respuestas individuales, scores, patrones y versión. Esto sólo persiste en ese navegador/dispositivo.

`lib/storage/assessment-storage.ts` expone la interfaz `AssessmentStorage`: es la frontera que se reemplazará por un adaptador de Cloud Firestore. Firebase Authentication se incorporará después para el acceso rápido con Google y Firebase Storage para los audios. Firestore podrá conservar usuarios, respuestas originales, scores, diagnóstico, recorrido, horarios, progreso y entregas; un backend posterior podrá programar WhatsApp.

No hay SDK, proyecto, credenciales ni conexión Firebase en esta fase. Tampoco existe ninguna dependencia o integración con Supabase.
