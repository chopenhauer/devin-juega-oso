# Roadmap

El hilo de por dónde puede crecer OSO. Aquí solo van las fases y los grupos de ideas, con el dato
que nos diría que toca invertir en cada uno; el detalle de cada idea (datos, propuesta, decisiones
tomadas y por tomar) está en su propio documento en [`ideas/`](ideas/README.md). Nada de esto está
comprometido: cada punto se decide, se hace en una rama con preview de Vercel y se publica en `main`
cuando se aprueba. Julia decide el orden final.

Lo ya publicado, versión a versión y con sus decisiones, está en el [CHANGELOG](../CHANGELOG.md).

## Ahora (orden del 24-10-2026)

1. **[Que la gente llegue a jugar](ideas/llegar-a-jugar.md) (30):** probar «Jugar ya» en la
   bienvenida. Sigue siendo donde más gente se pierde: en octubre, de 96 primeras bienvenidas solo 22
   llegan a empezar una partida (23 %). Ya hay las ~100 visitas que se propusieron para decidir.
2. **[Medir el reto del día y los avisos](ideas/reto-del-dia.md) (23):** el reto (4.4.0), los avisos
   (4.5.0) y el reto en un toque (4.5.1) salieron el 24-10-2026. Una semana sin tocarlos y mirar
   cuántos juegan el reto, cuántos vuelven al día siguiente, cuántos aceptan el aviso y si llega de
   verdad a un móvil: todavía no se ha visto ninguno.
3. **[Decidir el reloj](ideas/reloj.md) (24):** desde la 4.3.0 (5 s por OSO), 5 de 31 partidas
   acaban por tiempo (16 %), frente al 11 % de antes. Falta que JoseLuis decida el objetivo; la
   propuesta de Devin es el 20-25 %.
4. **[Elegir la hora del aviso](ideas/hora-del-aviso.md) (32):** idea nueva de JoseLuis: que cada
   persona elija a qué hora quiere que le avisen (desde la 4.5.2, las 7:00 para todo el mundo). Va después de
   medir los avisos, porque solo vale la pena si la gente los acepta.
5. **[Hall of fame local](ideas/hall-of-fame.md) (3):** sube desde «Siguiente». 18 de los 28 toques en
   la pantalla final son «Revancha»: se encadenan partidas, y un récord en el móvil da algo que batir.

**Salen del «Ahora»:**

- **[Fácil más fácil](ideas/niveles-maquina.md) (19):** en 28 días la persona gana 28 de 57 partidas
  en Fácil (49 %), así que ya se cumple el objetivo propuesto de la mitad sin tocar nada. Queda
  revisar Difícil, donde la persona gana 1 de 12, cuando haya unas 30 partidas.
- **[Barra de juego en línea](ideas/barra-en-linea.md) (1):** sigue en «Siguiente»; el modo en línea
  lo usan 5 personas y no ha tenido partidas en las últimas 72 h.

**Por qué este orden:** la bienvenida es donde más gente se pierde y ya hay datos para decidir. El uso
baja (7 usuarios en las últimas 72 h, frente a 10 en las 72 h anteriores y 16 del 17 al 19 de
octubre), y el reto con sus avisos es la apuesta para que la gente vuelva: primero hay que ver si
funciona antes de invertir más en él (la hora del aviso). Decidir el reloj es poco trabajo. El hall
of fame local aprovecha que la gente ya pide la revancha.

## Datos de hoy

GA4, 28 días hasta el 24-10-2026, solo de quien acepta las cookies: 70 usuarios, 170 sesiones y 128
partidas terminadas. Son pocos datos y algunos de pruebas de casa: sirven para orientar, no para
decidir.

| Tipo de partida          | Partidas terminadas | Personas |
| ------------------------ | ------------------- | -------- |
| Contra la máquina        | 75 (59 %)           | 33       |
| En línea                 | 26 (20 %)           | 5        |
| Juntos en un dispositivo | 23 (18 %)           | 8        |
| 4 jugadores              | 0                   | 0        |

- 47 de los 70 usuarios (67 %) empiezan una partida.
- 16 de 128 partidas (12,5 %) acaban por tiempo; desde la 4.3.0 (20-10), 5 de 31 (16 %).
- **Contra la máquina:** en Fácil la persona gana 28 de 57 (49 %), 13 de 18 desde el 20-10; en
  Difícil, 1 de 12 (9 gana la máquina y 2 empates); en Extremo, 1 de 5.
- **El uso baja:** 7 usuarios y 11 sesiones en las últimas 72 h (22-24 de octubre), frente a 10 y 17
  en las 72 h anteriores y 16 y 31 del 17 al 19.
- 70 de 170 sesiones llegaron por un enlace compartido: 35 con el botón de compartir del móvil, 32
  por WhatsApp y 3 copiando el enlace.
- **Pantalla final** (`end_action`, 4.2.0): de 28 toques, 18 «Revancha», 4 inicio, 3 otro tablero,
  2 `replay` y 1 cambiar jugadores.
- **Pausa** (`game_pause`, 4.1.0): nadie la ha usado en 28 días.
- **Contadores del servidor** (sin cookies, octubre): 209 visitas; 69 con las cookies aceptadas, 4
  rechazadas y 136 sin contestar, así que GA4 ve una de cada tres. De 96 primeras bienvenidas, 26
  eligen modo y 22 empiezan una partida (23 %).
- **Reto y avisos (salieron el 24-10):** 6 visitas a `/reto` en los contadores del servidor; en GA4
  aún no hay `daily_*` ni `push_optin` (tardan 24-48 h). La tarea de los avisos todavía no ha enviado
  ninguno.

## Grupos de ideas

Cada grupo dice qué **señal** de los datos lo activa: si un tipo de partida o un problema crece, tiene
sentido desarrollar por ahí. Las señales y umbrales son propuestas de Devin hasta que JoseLuis las
confirme. Los números entre paréntesis son los de siempre de cada idea.

### 1. Contra la máquina

- **Señal:** es el modo más jugado; se invierte aquí mientras pase del 40 % de las partidas. Calidad:
  que en Fácil la persona gane la mitad de las veces.
- **Hoy:** 59 % de las partidas; en Fácil la persona gana 28 de 57 (49 %), así que el objetivo se
  cumple. En Difícil gana 1 de 12.

| #   | Idea                                                          | Estado                                               |
| --- | ------------------------------------------------------------- | ---------------------------------------------------- |
| 19  | [Fácil más fácil y revisar Difícil](ideas/niveles-maquina.md) | Fácil: objetivo cumplido · Difícil: con ~30 partidas |
| 25  | [Laboratorio de Julia](ideas/laboratorio-de-julia.md)         | Hecho en 3.18.0                                      |
| 13  | [Nivel Extremo](ideas/niveles-maquina.md)                     | Hecho en 3.11.0                                      |

### 2. Juntos en un dispositivo (2 y 4 jugadores)

- **Señal:** que «Juntos» y 4 jugadores pasen del 25 % de las partidas, o que alguien pida equipos.
- **Hoy:** 18 % de las partidas y ninguna de 4 jugadores en 28 días.

| #   | Idea                                            | Estado         |
| --- | ----------------------------------------------- | -------------- |
| 10  | [Equipos 2 contra 2](ideas/cuatro-jugadores.md) | Si se pide     |
| —   | [Modo 4 jugadores](ideas/cuatro-jugadores.md)   | Hecho en 2.0.0 |

### 3. En línea

- **Señal:** los umbrales de [`ONLINE.md`](ONLINE.md) (50 partidas o 2 meses) y que lo usen al menos
  10 personas al mes.
- **Hoy:** 26 partidas en 28 días, pero de solo 5 personas, y ninguna en las últimas 72 h.

| #   | Idea                                                                         | Estado      |
| --- | ---------------------------------------------------------------------------- | ----------- |
| 1   | [Barra de juego en línea: reacciones y 🍅 tomatada](ideas/barra-en-linea.md) | Siguiente   |
| 6   | [Revisar la decisión del modo en línea](ideas/en-linea.md)                   | 50 partidas |
| 4   | [Volver a jugar con la misma persona otro día](ideas/en-linea.md)            | Decidir     |
| 11  | [En línea con 4 jugadores o espectadores](ideas/en-linea.md)                 | Reserva     |

### 4. Llegar, volver y compartir

Sirve para todos los tipos de partida.

- **Señal:** el porcentaje de usuarios que empiezan una partida, los que vuelven y las visitas que
  llegan por un enlace compartido.
- **Hoy:** en GA4 el 67 % empieza una partida, pero según el servidor solo el 23 % de las primeras
  bienvenidas llega a jugar. 70 de 170 sesiones llegaron por un enlace compartido. Del reto y de los
  avisos aún no hay datos.

| #   | Idea                                                              | Estado                                        |
| --- | ----------------------------------------------------------------- | --------------------------------------------- |
| 30  | [Que la gente llegue a jugar](ideas/llegar-a-jugar.md)            | **Ahora (1.º)**                               |
| 23  | [Reto del día y avisos](ideas/reto-del-dia.md)                    | Hecho en 4.4.0–4.5.1 · medir: **Ahora (2.º)** |
| 32  | [Elegir la hora del aviso](ideas/hora-del-aviso.md)               | **Ahora (4.º)**, después de medir             |
| 3   | [Hall of fame local](ideas/hall-of-fame.md)                       | **Ahora (5.º)**                               |
| 14  | [Hall of fame global](ideas/hall-of-fame.md)                      | Reserva                                       |
| 33  | [Clasificación del reto del día](ideas/clasificacion-reto.md)     | Siguiente, después de medir el reto           |
| 2   | [Secreto n.º 3, inventado por Julia](ideas/secretos-y-regalos.md) | Cuando Julia quiera                           |
| 17  | [Regalos desbloqueables](ideas/secretos-y-regalos.md)             | Sin plan                                      |
| 26  | [Otros idiomas](ideas/idiomas.md)                                 | Cuando lo diga JoseLuis                       |
| 29  | [Icono de la app dibujado por Julia](ideas/instalable.md)         | Cuando quiera                                 |
| 20  | [Compartir y enlace de reto](ideas/compartir.md)                  | Hecho en 2.6.0–3.13.0                         |
| 21  | [Ver la partida](ideas/ver-la-partida.md)                         | Hecho en 3.14.0                               |
| 22  | [Instalable y sin conexión](ideas/instalable.md)                  | Hecho en 3.15.0–3.16.0                        |

### 5. Reglas y reloj

Cambian cómo se juega, así que tocan el motor, la máquina y el servidor en línea.

- **Señal:** el porcentaje de partidas que acaban por tiempo, lo reñidas que son (diferencia de
  puntos) y lo que digan las familias.
- **Hoy:** el 12,5 % acaba por tiempo en 28 días y el 16 % desde la 4.3.0, cuando cada OSO pasó a
  dar 5 s en vez de 10. El objetivo escrito es el 50 %; la propuesta es bajarlo al 20-25 %.

| #   | Idea                                                       | Estado                    |
| --- | ---------------------------------------------------------- | ------------------------- |
| 24  | [Decidir el objetivo del reloj](ideas/reloj.md)            | **Ahora (3.º)**           |
| 5   | [Ajustar cada tablero con datos](ideas/reloj.md)           | ~100 partidas por tablero |
| 16  | [Reloj con la pestaña dormida](ideas/reloj.md)             | Decidir                   |
| 27  | [Puntos extra por racha](ideas/rachas.md)                  | Futuro                    |
| —   | [Desempate por rachas](ideas/rachas.md)                    | Hecho en 4.0.0            |
| 28  | [Hándicap y categorías](ideas/handicap.md)                 | Futuro                    |
| 18  | [Edición papel](ideas/edicion-papel.md)                    | Futuro                    |
| —   | [Tienda secreta y Modo Mercado](ideas/tienda-y-mercado.md) | Versión sencilla en 3.4.0 |

### 6. Temas, sonido y celebración

- **Señal:** los cambios de tema (`theme_change`) y las fechas de cada fiesta.
- **Hoy:** 49 cambios de tema en 28 días; Halloween es el 31 de octubre.

| #   | Idea                                                     | Estado                      |
| --- | -------------------------------------------------------- | --------------------------- |
| —   | [Temas de temporada](ideas/temas.md)                     | Afinar antes de cada fiesta |
| —   | [Sonidos](ideas/sonidos.md)                              | Hecho en 2.2.0              |
| 31  | [Pantalla del 🛟 al volver a OSO](ideas/pantalla-sos.md) | Hecho en 4.3.0              |
| 12  | [Oso bailando al ganar](ideas/celebraciones.md)          | Reserva                     |
| 15  | [Vibración](ideas/celebraciones.md)                      | Reserva                     |
| 8   | [Accesibilidad extra](ideas/accesibilidad.md)            | Reserva                     |

### 7. Escuchar y medir

- **Señal:** las respuestas 👍/👎 y las ideas que lleguen por email.
- **Hoy:** 7 respuestas 👍/👎 en 28 días.

| #   | Idea                                          | Estado    |
| --- | --------------------------------------------- | --------- |
| 7   | [Feedback con texto libre](ideas/feedback.md) | Siguiente |

## De dónde venimos

Del juego en un solo HTML (v12) a un proyecto con tests y CI: arquitectura y accesibilidad (1.x), modo
4 jugadores y temas (2.0–2.1), sonidos, reglas animadas y analítica con permiso (2.2–2.4),
compartir y sistema de diseño (2.6), juego en línea (3.0–3.10), niveles de la máquina (3.11) y
compartir con imagen, enlace de reto, «Ver la partida» e instalable (3.12–3.16), medir la
bienvenida (3.17), laboratorio de Julia (3.18), la historia de OSO (3.19 y 3.21), secretos al
mantener pulsado (3.20), desempate por rachas (4.0), pausa (4.1), pantalla final nueva (4.2), 5 s por OSO y pantalla al
volver a OSO (4.3), reto del día en `/reto` (4.4) y avisos del reto (4.5). El detalle está en el
[CHANGELOG](../CHANGELOG.md).

## Cómo añadir una idea

1. Copia la plantilla de [`ideas/README.md`](ideas/README.md) en `docs/ideas/<nombre>.md` y dale el
   siguiente número libre (el 34).
2. Añádela al índice de `ideas/README.md` y a la tabla de su grupo aquí. Si no encaja en ningún
   grupo, se decide con JoseLuis si hace falta uno nuevo.
3. Cuando se publique, marca el estado como «Hecho en x.y» en los dos sitios y deja las decisiones en
   el documento de la idea y en el CHANGELOG.
