# Elegir la hora del aviso (32)

- **Estado:** Idea · Siguiente (cuando haya datos de `push_optin`)
- **Grupo:** [Llegar, volver y compartir](../ROADMAP.md#4-llegar-volver-y-compartir)
- **Valor / esfuerzo** (estimados por Devin): Medio / Medio

## Qué problema resuelve

El aviso del [reto del día](reto-del-dia.md) (4.5.0) sale para todo el mundo a la misma hora, las
7:00 de Madrid (`push.hour`, desde la 4.5.2; antes, las 18:00). A cada persona le va bien una hora distinta: antes del cole, al salir
del trabajo, después de cenar… Idea de JoseLuis (24-10-2026): que cada persona pueda elegir a qué hora
quiere que le avisen.

## Datos que la apoyan

Todavía ninguno: los avisos salieron el 24-10-2026 y la tarea aún no ha enviado ninguno. Antes de hacerla
conviene ver cuántas personas aceptan el aviso (`push_optin`, `action=granted`) y cuántas lo tocan
(contador `push_click`).

## Propuesta

- **Dónde se elige:** al aceptar el aviso («🔔 ¿Te aviso cuando haya reto nuevo?») y después en el
  menú, en «🔔 Avisos del reto». Por defecto, las 7:00.
- **Pocas horas, no un reloj:** 3 o 4 opciones fijas (por ejemplo, 7:00, 13:00, 18:00 y 21:00), para
  que sea un toque y para que el servidor solo tenga que mandar avisos a esas horas.
- **Servidor:** la suscripción guarda también la hora elegida (`api/_push.js`) y `/api/push-cron`
  manda, en cada ejecución, solo a quien eligió esa hora de Madrid y aún no ha jugado el reto.
- **Cuándo se ejecuta:** en el plan gratuito de Vercel cada tarea programada se ejecuta como mucho una
  vez al día y con hasta 59 minutos de retraso. Hacen falta dos entradas en `vercel.json` por cada
  hora (verano e invierno). Hay que comprobar cuántas tareas admite el plan; si no llega, una tarea
  programada de GitHub Actions puede llamar a `/api/push-cron` cada hora.
- **Nunca antes del reto:** ninguna hora antes de que empiece el reto de ese día (`daily.startHour`,
  hoy las 2:00).

## Decidido

- La idea, apuntada por JoseLuis el 24-10-2026.

## Por decidir

- Qué horas se ofrecen y cuántas.
- Si se puede elegir «sin aviso» los fines de semana.

## Cómo se mide

- Un parámetro nuevo `push_hour` en `push_optin` (apuntarlo en `ANALYTICS.md` y `DATALAYER.md`).
- Los contadores `push_sent` y `push_click` por hora, para ver a qué hora se vuelve más a jugar.
