# Temas de temporada

- **Estado:** Hecho en 1.7.0, 2.1.0 y 2.5.0 · afinar cada tema cuando se acerque su fecha
- **Grupo:** [Temas, sonido y celebración](../ROADMAP.md#6-temas-sonido-y-celebración)
- **Valor / esfuerzo** (estimados por Devin): Medio / Bajo

Que el juego cambie de skin según la época del año, para que se sienta distinto en cada fiesta.
Un tema cambia los avatares, el icono de portada, los colores, el fondo y el confeti de victoria;
las reglas no cambian. Se elige con el botón 🎨 arriba a la derecha de la pantalla de inicio y se
recuerda en el dispositivo (`oso.theme.v1`). Código: `public/js/themes.js`.

**Ya hechos (v1):**

| Tema         | Avatares                            | Fondo y decoración                                                                                            |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 🎃 Halloween | 🎃 🧛 👻 🧙 🦇 💀 🕷️ 🧟 🐈‍⬛ 🦉 🍬 🕯️ | Noche morada y naranja, telarañas en las esquinas con una 🕷️ que baja, fichas de calabaza y OSOs que brillan. |
| ⛄ Navidad   | ⛄ 🎅 🦌 🐧 🥕 ☕ 🎁 ❄️ 🎄 🍪 🧦 🐻‍❄️ | Noche azul con nieve cayendo, copos, regalos, café caliente y suelo nevado.                                   |

**Hechos en 2.1.0** (las fiestas de San Patricio a Acción de Gracias, las épocas y los lugares son ideas de los niños):

| Tema                   | Fechas (orientativas)              | Avatares e ideas                                                                           |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Año Nuevo              | 31 dic – 1 ene                     | 🎆 🥂 🍇 🕛 🎉 🥳; fuegos artificiales al ganar y las 12 uvas como cuenta atrás del reloj. |
| Reyes Magos            | 5 – 6 ene                          | 👑 🐪 🎁 ⭐ 🍰; roscón y estrella de Oriente.                                              |
| San Valentín           | 7 – 14 feb                         | 💘 🌹 💌 🧸 🍫 🦢; corazones flotando y fichas en rosa y rojo.                             |
| Carnaval               | Semana de carnaval                 | 🎭 🤡 🦸 🧚 🦹 🎊; antifaces y confeti.                                                    |
| San Patricio           | 17 mar                             | ☘️ 🍀 🌈 🪙 🎩 🧚; tréboles y arcoíris con olla de oro.                                    |
| Pascua                 | Domingo de Pascua (fecha variable) | 🐰 🐣 🥚 🧺 🍫 🌷; huevos de colores escondidos.                                           |
| Sant Jordi             | 23 abr                             | 🐉 🌹 📚 🏰 🛡️ 👸; rosas, libros y un dragón amable.                                       |
| San Juan               | 23 – 24 jun                        | 🔥 🎆 🎇 🌙 🌊 ✨; hogueras y fuegos artificiales.                                         |
| San Fermín             | 7 jul                              | 🐂 🧣 🎉 🏃 🔴 ⚪; pañuelo rojo y toros en dibujo amable.                                  |
| Acción de Gracias      | 4.º jueves de nov                  | 🦃 🥧 🌽 🍁 🍂 🥔; mesa de otoño.                                                          |
| Primavera              | 21 mar – 20 jun                    | 🌷 🦋 🐝 🌸 🐞 🌱; flores, mariposas y tonos verdes suaves.                                |
| Verano                 | 21 jun – 22 sep                    | 🏖️ 🦀 🐠 🐬 🍉 🍦 🕶️; arena, sol, sombrilla y osos con gafas.                              |
| Otoño                  | 23 sep – 20 dic                    | 🍂 🦔 🐿️ 🍄 🌰 🦉; hojas cayendo y tonos ocres.                                            |
| África                 | Todo el año                        | 🦁 🐘 🦒 🦓 🦏 🐊; sabana al atardecer.                                                    |
| Antártida              | Todo el año                        | 🐧 🦭 🐋 🧊 🏔️ 🛷; hielo, auroras y nieve.                                                 |
| Atlántida (imaginario) | Todo el año                        | 🧜 🐙 🐚 🔱 🏛️ 🐠; ciudad sumergida con burbujas.                                          |
| Espacio                | Todo el año                        | 🚀 👽 🪐 🛸 👩‍🚀 🌙; estrellas fugaces y planetas.                                           |
| Dinosaurios            | Todo el año                        | 🦖 🦕 🌋 🥚 🌿 🦴; volcán y selva prehistórica.                                            |
| Piratas                | Todo el año                        | 🏴‍☠️ 🦜 💰 🗺️ ⚓ 🦈; mapa del tesoro (ojo: no mezclar con el tema marino del SOS).           |
| Año Nuevo Chino        | Fecha lunar (ene – feb)            | 🐀 🐂 🐅 🐇 🐉 🐍 🐎 🐐 🐒 🐓 🐕 🐖; farolillos y dragón (2.5.0, idea de Julia).           |
| Cumpleaños             | Sin fecha: se elige a mano         | 🎂 🎈 🎁 🥳; tarta, globos y confeti; para el cumple de cualquiera, sin guardar fechas.    |

## Menú de temas por fechas (idea de los niños)

Con tantos temas, el menú 🎨 no puede enseñarlos todos. Hecho en 2.1.0:

- **Menú:** como máximo 5 temas: siempre el Clásico y los que tengan su fecha cerca (de un mes
  antes a un mes después; por ejemplo San Fermín del 7 de junio al 7 de agosto).
- **Por defecto:** el Clásico, salvo el mismo día de la fiesta, que se pone ese tema solo (San
  Valentín el 14 de febrero, San Fermín el 7 de julio).
- **«Ver otros»:** despliega más temas, hasta 10 en total contando los del menú. El resto del año
  los temas de fiesta quedan ahí.
- **Easter egg:** pulsar el 🎨 más de 5 veces seguidas enseña todos los temas, aunque sean más de 10.
- **Tipos de tema:** fiestas (con día), épocas del año (con periodo) y lugares (todo el año).
- **Decisiones:**
  - El tema de la fiesta solo dura ese día y después vuelve el elegido.
  - Las épocas salen en el menú mientras duran.
  - «Ver otros» empieza por Cumpleaños y alterna lugares y próximas fiestas.
  - El easter egg son 6 pulsaciones seguidas (menos de 0,7 s entre una y otra) y dura hasta recargar.

- **Pendiente:** fichas y tablero con decoración propia de cada tema, y que el tema marino del SOS
  sustituya o se mezcle con el de temporada (hoy lo sustituye mientras dura).
- **Técnica:** `data-theme` en `body` con variables CSS, dibujos SVG en línea y emoji, sin recursos
  externos para respetar la CSP. Animaciones suaves y quietas con «reducir movimiento».
