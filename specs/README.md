# FinZen — Specs de Features

Cada archivo es el plan técnico completo de una feature. Se escriben antes de codear y se archivan en `done/` al completarse.

## Convención de nombres

```
NNN_nombre-feature.md
```
- `NNN` — número de orden de ejecución (001, 002, 003…)
- Ejecutar en orden numérico salvo dependencias explícitas

## Cómo usar con Claude

```
Implementa el spec 001
Lee specs/001_nombre.md y ejecuta el plan
```

## Estado actual

### Pendientes (ejecutar en orden)
- `007_google-oauth.md` — requiere configuración manual de Google Cloud Console (ver spec)

### Completados
- `001_formato-moneda-decimales.md` — commit 40158f0
- `002_ux-loading-feedback.md` — commit 26b56ca
- `003_ux-consistencia-visual.md` — commit 0e6ba32
- `004_deudas-interes-fechas.md` — implementado, migración 007
- `005_deudas-pagos-recurrentes.md` — implementado, migración 008
- `006_performance-registro-coldstart.md` — completado en spec 002 (código); UptimeRobot pendiente (configuración manual)
