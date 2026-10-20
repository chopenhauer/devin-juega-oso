# Roadmap

El hilo de por dónde puede crecer OSO. Aquí solo van las fases y los grupos de ideas, con el dato
que nos diría que toca invertir en cada uno; el detalle de cada idea (datos, propuesta, decisiones
tomadas y por tomar) está en su propio documento en [`ideas/`](ideas/README.md). Nada de esto está
comprometido: cada punto se decide, se hace en una rama con preview de Vercel y se publica en `main`
cuando se aprueba. Julia decide el orden final.

Lo ya publicado, versión a versión y con sus decisiones, está en el [CHANGELOG](../CHANGELOG.md).

## Ahora (orden del 19-10-2026)

1. **[Que la gente llegue a jugar](ideas/llegar-a-jugar.md) (30):** probar «Jugar ya» en la
   bienvenida. En octubre, de 67 primeras bienvenidas solo 16 llegaron a empezar una partida.
2. **[Reto del día](ideas/reto-del-dia.md) (23):** un motivo para volver cada día y para compartir.
3. **[Decidir el reloj](ideas/reloj.md) (24):** propuesta de un objetivo del 20-25 %. En la 4.3.0
   cada OSO da 5 s en vez de 10 (JoseLuis, 19-10-2026): ver cuánto sube el porcentaje de partidas
   que acaban por tiempo.
4. **[Fácil más fácil](ideas/niveles-maquina.md) (19):** una semana más de datos. En las últimas
   72 h la persona ganó 5 de 7 partidas en Fácil.
5. **[Barra de juego en línea](ideas/barra-en-linea.md) (1):** pasa a «Siguiente», porque el modo en
   línea lo usan pocos.

**Por qué este orden:** la bienvenida es donde más gente se pierde, según los contadores del
servidor. El boca-oreja por WhatsApp ya trae casi la mitad de las sesiones, y el reto del día le da
un motivo para seguir. El reloj ya está en el 21 % de las partidas de las últimas 72 h. Fácil puede
esperar porque los últimos datos ya no son tan malos.

## Datos de hoy

GA4, 28 días hasta el 19-10-2026, solo de quien acepta las cookies: 61 usuarios, 143 sesiones y 89
partidas terminadas. Son pocos datos y algunos de pruebas de casa: sirven para orientar, no para
decidir.

| Tipo de partida          | Partidas terminadas | Personas |
| ------------------------ | ------------------- | -------- |
| Contra la máquina        | 48 (54 %)           | 25       |
| En línea                 | 26 (29 %)           | 5        |
| Juntos en un dispositivo | 14 (16 %)           | 7        |
| 4 jugadores              | 0                   | 0        |

- 39 de los 61 usuarios (64 %) empiezan una partida.
- 10 de 89 partidas (11 %) acaban por tiempo; en las últimas 72 h, 4 de 19 (21 %).
- **Las últimas 72 h (17-19 de octubre) son las mejores hasta ahora:** 16 usuarios (11 nuevos), 31
  sesiones y 19 partidas, frente a 6, 15 y 8 en las 72 h anteriores. 7 de esas partidas son de un
  único móvil con la app instalada, seguramente el de casa.
- 58 de 143 sesiones llegaron por un enlace compartido: 27 por WhatsApp y 31 con el botón de
  compartir del móvil.
- **Contadores del servidor** (sin cookies, octubre): 151 visitas, pero solo 16 aceptan las cookies y
  4 las rechazan, así que GA4 ve solo una parte. De 67 primeras bienvenidas, 19 eligen modo y 16
  empiezan una partida (24 %).
- La pausa (`game_pause`, 4.1.0) y los botones de la pantalla final (`end_action`, 4.2.0) acaban de
  empezar a medirse.

## Grupos de ideas

Cada grupo dice qué **señal** de los datos lo activa: si un tipo de partida o un problema crece, tiene
sentido desarrollar por ahí. Las señales y umbrales son propuestas de Devin hasta que JoseLuis las
confirme. Los números entre paréntesis son los de siempre de cada idea.

### 1. Contra la máquina

- **Señal:** es el modo más jugado; se invierte aquí mientras pase del 40 % de las partidas. Calidad:
  que en Fácil la persona gane la mitad de las veces.
- **Hoy:** 54 % de las partidas; en Fácil la persona gana 12 de 36 (33 %), pero 5 de 7 en las
  últimas 72 h.

| #   | Idea                                                          | Estado                |
| --- | ------------------------------------------------------------- | --------------------- |
| 19  | [Fácil más fácil y revisar Difícil](ideas/niveles-maquina.md) | Esperando datos (4.º) |
| 25  | [Laboratorio de Julia](ideas/laboratorio-de-julia.md)         | Hecho en 3.18.0       |
| 13  | [Nivel Extremo](ideas/niveles-maquina.md)                     | Hecho en 3.11.0       |

### 2. Juntos en un dispositivo (2 y 4 jugadores)

- **Señal:** que «Juntos» y 4 jugadores pasen del 25 % de las partidas, o que alguien pida equipos.
- **Hoy:** 16 % de las partidas y ninguna de 4 jugadores en 28 días.

| #   | Idea                                            | Estado         |
| --- | ----------------------------------------------- | -------------- |
| 10  | [Equipos 2 contra 2](ideas/cuatro-jugadores.md) | Si se pide     |
| —   | [Modo 4 jugadores](ideas/cuatro-jugadores.md)   | Hecho en 2.0.0 |

### 3. En línea

- **Señal:** los umbrales de [`ONLINE.md`](ONLINE.md) (50 partidas o 2 meses) y que lo usen al menos
  10 personas al mes.
- **Hoy:** 26 partidas, pero de solo 5 personas; en octubre, 12 salas creadas y 6 uniones.

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
- **Hoy:** en GA4 el 64 % empieza una partida, pero según el servidor solo el 24 % de las primeras
  bienvenidas llega a jugar. 58 de 143 sesiones llegaron por un enlace compartido.

| #   | Idea                                                              | Estado                  |
| --- | ----------------------------------------------------------------- | ----------------------- |
| 30  | [Que la gente llegue a jugar](ideas/llegar-a-jugar.md)            | **Ahora (1.º)**         |
| 23  | [Reto del día](ideas/reto-del-dia.md)                             | **Ahora (2.º)**         |
| 3   | [Hall of fame local](ideas/hall-of-fame.md)                       | Siguiente               |
| 14  | [Hall of fame global](ideas/hall-of-fame.md)                      | Reserva                 |
| 2   | [Secreto n.º 3, inventado por Julia](ideas/secretos-y-regalos.md) | Cuando Julia quiera     |
| 17  | [Regalos desbloqueables](ideas/secretos-y-regalos.md)             | Sin plan                |
| 26  | [Otros idiomas](ideas/idiomas.md)                                 | Cuando lo diga JoseLuis |
| 29  | [Icono de la app dibujado por Julia](ideas/instalable.md)         | Cuando quiera           |
| 20  | [Compartir y enlace de reto](ideas/compartir.md)                  | Hecho en 2.6.0–3.13.0   |
| 21  | [Ver la partida](ideas/ver-la-partida.md)                         | Hecho en 3.14.0         |
| 22  | [Instalable y sin conexión](ideas/instalable.md)                  | Hecho en 3.15.0–3.16.0  |

### 5. Reglas y reloj

Cambian cómo se juega, así que tocan el motor, la máquina y el servidor en línea.

- **Señal:** el porcentaje de partidas que acaban por tiempo, lo reñidas que son (diferencia de
  puntos) y lo que digan las familias.
- **Hoy:** el 11 % acaba por tiempo (el 21 % en las últimas 72 h), y el objetivo es el 50 %. Desde
  la 4.3.0 cada OSO da 5 s en vez de 10.

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
- **Hoy:** 29 cambios de tema; Halloween es el más elegido en las últimas 72 h.

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
- **Hoy:** 3 respuestas 👍/👎.

| #   | Idea                                          | Estado    |
| --- | --------------------------------------------- | --------- |
| 7   | [Feedback con texto libre](ideas/feedback.md) | Siguiente |

## De dónde venimos

Del juego en un solo HTML (v12) a un proyecto con tests y CI: arquitectura y accesibilidad (1.x), modo
4 jugadores y temas (2.0–2.1), sonidos, reglas animadas y analítica con permiso (2.2–2.4),
compartir y sistema de diseño (2.6), juego en línea (3.0–3.10), niveles de la máquina (3.11) y
compartir con imagen, enlace de reto, «Ver la partida» e instalable (3.12–3.16), medir la
bienvenida (3.17), laboratorio de Julia (3.18), la historia de OSO (3.19 y 3.21), secretos al
mantener pulsado (3.20), desempate por rachas (4.0), pausa (4.1) y pantalla final nueva (4.2). El detalle está en el
[CHANGELOG](../CHANGELOG.md).

## Cómo añadir una idea

1. Copia la plantilla de [`ideas/README.md`](ideas/README.md) en `docs/ideas/<nombre>.md` y dale el
   siguiente número libre (el 32).
2. Añádela al índice de `ideas/README.md` y a la tabla de su grupo aquí. Si no encaja en ningún
   grupo, se decide con JoseLuis si hace falta uno nuevo.
3. Cuando se publique, marca el estado como «Hecho en x.y» en los dos sitios y deja las decisiones en
   el documento de la idea y en el CHANGELOG.
