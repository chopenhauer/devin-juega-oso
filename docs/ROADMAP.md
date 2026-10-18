# Roadmap

El hilo de por dónde puede crecer OSO. Aquí solo van las fases y los grupos de ideas, con el dato
que nos diría que toca invertir en cada uno; el detalle de cada idea (datos, propuesta, decisiones
tomadas y por tomar) está en su propio documento en [`ideas/`](ideas/README.md). Nada de esto está
comprometido: cada punto se decide, se hace en una rama con preview de Vercel y se publica en `main`
cuando se aprueba. Julia decide el orden final.

Lo ya publicado, versión a versión y con sus decisiones, está en el [CHANGELOG](../CHANGELOG.md).

## Ahora (orden del 17-10-2026)

1. **[Fácil más fácil](ideas/niveles-maquina.md) (19):** en Fácil la máquina gana el 74 % de las
   partidas. Espera unos días más de datos (JoseLuis, 17-10-2026).
2. **[Que la gente llegue a jugar](ideas/llegar-a-jugar.md) (30):** medir cada paso de la
   bienvenida (en la 3.17.0) y, según los datos, probar «Jugar ya».
3. **[Reto del día](ideas/reto-del-dia.md) (23):** un motivo para volver cada día y para compartir.
4. **[Decidir el reloj](ideas/reloj.md) (24):** bajar el objetivo del 50 % a un 20-25 % o bajar el
   5×5.
5. **[Barra de juego en línea](ideas/barra-en-linea.md) (1):** pasa a «Siguiente», porque el modo en
   línea lo usan pocos.

**Por qué este orden:** Fácil más fácil es barato y lo que más se nota con niños. La bienvenida
pierde a casi la mitad antes de jugar. El reto del día da un motivo para volver cuando el uso está
bajando. El reloj es solo una decisión.

## Datos de hoy

GA4, 28 días hasta el 17-10-2026, solo de quien acepta las cookies: 52 usuarios, 115 sesiones y 73
partidas terminadas. Son pocos datos y algunos de pruebas de casa: sirven para orientar, no para
decidir.

| Tipo de partida          | Partidas terminadas | Personas |
| ------------------------ | ------------------- | -------- |
| Contra la máquina        | 39 (53 %)           | 19       |
| En línea                 | 23 (32 %)           | 4        |
| Juntos en un dispositivo | 10 (14 %)           | 5        |
| 4 jugadores              | 0                   | 0        |

- 30 de los 52 usuarios (58 %) empiezan una partida.
- 7 de 73 partidas (10 %) acaban por tiempo.
- El uso baja: de 8 usuarios al día (11 y 13 de octubre) a entre 1 y 5 desde el 14.
- Lo de la 3.13–3.15 (reto, «Ver la partida», instalable) aún no tiene eventos.

## Grupos de ideas

Cada grupo dice qué **señal** de los datos lo activa: si un tipo de partida o un problema crece, tiene
sentido desarrollar por ahí. Las señales y umbrales son propuestas de Devin hasta que JoseLuis las
confirme. Los números entre paréntesis son los de siempre de cada idea.

### 1. Contra la máquina

- **Señal:** es el modo más jugado; se invierte aquí mientras pase del 40 % de las partidas. Calidad:
  que en Fácil la persona gane la mitad de las veces.
- **Hoy:** 53 % de las partidas; en Fácil la persona gana 8 de 31 (26 %).

| #   | Idea                                                          | Estado          |
| --- | ------------------------------------------------------------- | --------------- |
| 19  | [Fácil más fácil y revisar Difícil](ideas/niveles-maquina.md) | Esperando datos |
| 25  | [Laboratorio de Julia](ideas/lab-de-julia.md)                 | Hecho en 3.18.0 |
| 13  | [Nivel Extremo](ideas/niveles-maquina.md)                     | Hecho en 3.11.0 |

### 2. Juntos en un dispositivo (2 y 4 jugadores)

- **Señal:** que «Juntos» y 4 jugadores pasen del 25 % de las partidas, o que alguien pida equipos.
- **Hoy:** 14 % de las partidas y ninguna de 4 jugadores en 28 días.

| #   | Idea                                            | Estado         |
| --- | ----------------------------------------------- | -------------- |
| 10  | [Equipos 2 contra 2](ideas/cuatro-jugadores.md) | Si se pide     |
| —   | [Modo 4 jugadores](ideas/cuatro-jugadores.md)   | Hecho en 2.0.0 |

### 3. En línea

- **Señal:** los umbrales de [`ONLINE.md`](ONLINE.md) (50 partidas o 2 meses) y que lo usen al menos
  10 personas al mes.
- **Hoy:** 23 partidas, pero de solo 4 personas; 14 salas creadas y 4 uniones.

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
- **Hoy:** el 58 % empieza una partida y 43 de 112 sesiones llegaron por un enlace compartido.

| #   | Idea                                                              | Estado                  |
| --- | ----------------------------------------------------------------- | ----------------------- |
| 30  | [Que la gente llegue a jugar](ideas/llegar-a-jugar.md)            | Midiendo (3.17.0)       |
| 23  | [Reto del día](ideas/reto-del-dia.md)                             | **Ahora (3.º)**         |
| 3   | [Hall of fame local](ideas/hall-of-fame.md)                       | Siguiente               |
| 14  | [Hall of fame global](ideas/hall-of-fame.md)                      | Reserva                 |
| 2   | [Secreto n.º 3, inventado por Julia](ideas/secretos-y-regalos.md) | Cuando Julia quiera     |
| 17  | [Regalos desbloqueables](ideas/secretos-y-regalos.md)             | Sin plan                |
| 26  | [Otros idiomas](ideas/idiomas.md)                                 | Cuando lo diga JoseLuis |
| 29  | [Icono de la app dibujado por Julia](ideas/instalable.md)         | Cuando quiera           |
| 20  | [Compartir y enlace de reto](ideas/compartir.md)                  | Hecho en 2.6.0–3.13.0   |
| 21  | [Ver la partida](ideas/ver-la-partida.md)                         | Hecho en 3.14.0         |
| 22  | [Instalable](ideas/instalable.md)                                 | Hecho en 3.15.0         |

### 5. Reglas y reloj

Cambian cómo se juega, así que tocan el motor, la máquina y el servidor en línea.

- **Señal:** el porcentaje de partidas que acaban por tiempo, lo reñidas que son (diferencia de
  puntos) y lo que digan las familias.
- **Hoy:** el 10 % acaba por tiempo, y el objetivo es el 50 %.

| #   | Idea                                                       | Estado                    |
| --- | ---------------------------------------------------------- | ------------------------- |
| 24  | [Decidir el objetivo del reloj](ideas/reloj.md)            | **Ahora (4.º)**           |
| 5   | [Ajustar cada tablero con datos](ideas/reloj.md)           | ~100 partidas por tablero |
| 16  | [Reloj con la pestaña dormida](ideas/reloj.md)             | Decidir                   |
| 27  | [Puntos extra por racha](ideas/rachas.md)                  | Futuro                    |
| 28  | [Hándicap y categorías](ideas/handicap.md)                 | Futuro                    |
| 18  | [Edición papel](ideas/edicion-papel.md)                    | Futuro                    |
| —   | [Tienda secreta y Modo Mercado](ideas/tienda-y-mercado.md) | Versión sencilla en 3.4.0 |

### 6. Temas, sonido y celebración

- **Señal:** los cambios de tema (`theme_change`) y las fechas de cada fiesta.
- **Hoy:** 26 cambios de tema, de 4 personas.

| #   | Idea                                            | Estado                      |
| --- | ----------------------------------------------- | --------------------------- |
| —   | [Temas de temporada](ideas/temas.md)            | Afinar antes de cada fiesta |
| —   | [Sonidos](ideas/sonidos.md)                     | Hecho en 2.2.0              |
| 12  | [Oso bailando al ganar](ideas/celebraciones.md) | Reserva                     |
| 15  | [Vibración](ideas/celebraciones.md)             | Reserva                     |
| 8   | [Accesibilidad extra](ideas/accesibilidad.md)   | Reserva                     |

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
compartir con imagen, enlace de reto, «Ver la partida» e instalable (3.12–3.15). El detalle está en
el [CHANGELOG](../CHANGELOG.md).

## Cómo añadir una idea

1. Copia la plantilla de [`ideas/README.md`](ideas/README.md) en `docs/ideas/<nombre>.md` y dale el
   siguiente número libre (el 31).
2. Añádela al índice de `ideas/README.md` y a la tabla de su grupo aquí. Si no encaja en ningún
   grupo, se decide con JoseLuis si hace falta uno nuevo.
3. Cuando se publique, marca el estado como «Hecho en x.y» en los dos sitios y deja las decisiones en
   el documento de la idea y en el CHANGELOG.
