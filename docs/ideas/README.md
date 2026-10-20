# Ideas

Un documento por idea o funcionalidad, con todo su detalle. El hilo que las ordena, por grupos y con
la señal de datos que activa cada grupo, está en el [roadmap](../ROADMAP.md).

| Números   | Idea                                                                   | Grupo                       | Estado                                                                                             |
| --------- | ---------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------- |
| 1         | [Barra de juego en línea: reacciones y 🍅 tomatada](barra-en-linea.md) | En línea                    | Idea · Siguiente                                                                                   |
| 2, 17     | [Secretos y regalos desbloqueables](secretos-y-regalos.md)             | Llegar, volver y compartir  | Secretos hechos en 3.3.0 y 3.4.0 · Secreto n.º 3 (2): cuando Julia quiera · Regalos (17): sin plan |
| 3, 14     | [Hall of fame](hall-of-fame.md)                                        | Llegar, volver y compartir  | Local (3): siguiente · Global (14): reserva                                                        |
| 4, 6, 11  | [Más allá del 1 contra 1 en línea](en-linea.md)                        | En línea                    | Ideas por decidir                                                                                  |
| 5, 16, 24 | [El reloj de cada tablero](reloj.md)                                   | Reglas y reloj              | Decidir el objetivo (24): **ahora (3.º)** · ajuste por tablero (5): con ~100 partidas por tablero  |
| 7         | [Feedback e ideas de los jugadores](feedback.md)                       | Escuchar y medir            | 👍/👎 e «💡 Ideas» hechos en 2.4.0 · texto libre (7): siguiente                                    |
| 8         | [Accesibilidad extra](accesibilidad.md)                                | Temas, sonido y celebración | En reserva                                                                                         |
| 10        | [Modo 4 jugadores y equipos](cuatro-jugadores.md)                      | Juntos en un dispositivo    | Modo 4 hecho en 2.0.0 · Equipos 2 contra 2 (10): si se pide                                        |
| 12, 15    | [Oso bailando y vibración](celebraciones.md)                           | Temas, sonido y celebración | En reserva                                                                                         |
| 13, 19    | [Niveles de la máquina](niveles-maquina.md)                            | Contra la máquina           | Extremo hecho en 3.11.0 · Fácil más fácil (19): esperando datos (4.º)                              |
| 18        | [Edición papel](edicion-papel.md)                                      | Reglas y reloj              | Idea loca · Futuro                                                                                 |
| 20        | [Compartir, boca-oreja y enlace de reto](compartir.md)                 | Llegar, volver y compartir  | Hecho en 2.6.0, 3.12.0 (imagen del marcador) y 3.13.0 (enlace de reto)                             |
| 21        | [Ver la partida jugada a jugada](ver-la-partida.md)                    | Llegar, volver y compartir  | Hecho en 3.14.0                                                                                    |
| 22, 29    | [Instalable en la pantalla de inicio](instalable.md)                   | Llegar, volver y compartir  | Hecho en 3.15.0–3.16.0 · Icono de Julia (29): cuando quiera                                        |
| 23        | [Reto del día](reto-del-dia.md)                                        | Llegar, volver y compartir  | Idea · **ahora (2.º)**                                                                             |
| 25        | [Laboratorio de Julia](laboratorio-de-julia.md)                        | Contra la máquina           | Hecho en 3.18.0                                                                                    |
| 26        | [Otros idiomas](idiomas.md)                                            | Llegar, volver y compartir  | Textos listos desde 3.9.0 · traducir: cuando lo diga JoseLuis                                      |
| 27        | [Rachas: desempate y puntos extra](rachas.md)                          | Reglas y reloj              | Desempate hecho en 4.0.0 · puntos extra (27): futuro                                               |
| 28        | [Hándicap y categorías](handicap.md)                                   | Reglas y reloj              | Idea · Futuro                                                                                      |
| 30        | [Que la gente llegue a jugar](llegar-a-jugar.md)                       | Llegar, volver y compartir  | Paso 1, medir: hecho en 3.17.0 · «Jugar ya»: **ahora (1.º)**                                       |
| 31        | [Pantalla del 🛟 al volver a OSO](pantalla-sos.md)                     | Temas, sonido y celebración | Hecho en 4.3.0                                                                                     |
| —         | [Sonidos](sonidos.md)                                                  | Temas, sonido y celebración | Hecho en 2.2.0                                                                                     |
| —         | [Temas de temporada](temas.md)                                         | Temas, sonido y celebración | Hecho en 1.7.0, 2.1.0 y 2.5.0 · afinar cada tema cuando se acerque su fecha                        |
| —         | [Tienda secreta y Modo Mercado](tienda-y-mercado.md)                   | Reglas y reloj              | Versión sencilla hecha en 3.4.0 (tienda secreta) · Modo Mercado completo: idea                     |

## Plantilla

Para una idea nueva, copia esto en `docs/ideas/<nombre>.md`:

```md
# Nombre de la idea (n.º)

- **Estado:** idea · ahora / siguiente / futuro / reserva · hecho en x.y
- **Grupo:** [Nombre del grupo](../ROADMAP.md#ancla-del-grupo)
- **Valor / esfuerzo** (estimados por Devin): medio / bajo

## Qué problema resuelve

## Datos que la apoyan

Con fecha y fuente (GA4, Clarity, contadores del servidor o feedback).

## Propuesta

## Decidido

## Por decidir

## Cómo se mide

Eventos o contadores nuevos (y apuntarlos en `ANALYTICS.md` y `DATALAYER.md`).
```
