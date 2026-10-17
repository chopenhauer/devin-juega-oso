# Feedback e ideas de los jugadores (7)

- **Estado:** 👍/👎 e «💡 Ideas» hechos en 2.4.0 · texto libre (7): siguiente
- **Grupo:** [Escuchar y medir](../ROADMAP.md#7-escuchar-y-medir)
- **Valor / esfuerzo** (estimados por Devin): Alto / Medio

**Hecho en 2.4.0:** 👍/👎 como evento de GA en momentos elegidos (primera partida, ganar a la
máquina, cada 3 partidas seguidas; nunca tras ganar la máquina) e «💡 Ideas» por email a
hola@juegaoso.com. Queda el texto libre con la función de Vercel (2.8.0).

Que quien juega pueda mandarnos su opinión o ideas para que el juego evolucione. Antes de hacerlo
hay que decidir dos cosas:

- **Dónde ponerlo:**
  - **Menú ☰ de la partida:** una opción «💡 Ideas y opiniones», siempre a mano y sin
    interrumpir.
  - **Final de la partida:** una pregunta corta en la pantalla de resultado (por ejemplo «¿Os ha
    gustado? 👍 / 👎» y un enlace para contar más). Llega a más gente, pero conviene que salga
    pocas veces (por ejemplo tras la tercera partida y no más de una vez por dispositivo).
  - **Propuesta:** las dos; el menú siempre y la pregunta del final solo de vez en cuando.
- **Cómo recibirlo (abierto a sugerencias):**
  - **Evento de GA:** sirve para la valoración rápida 👍 / 👎 y contarla en los informes. No vale
    para texto libre (GA limita los textos y no permite datos personales) y solo llega si se
    aceptan las cookies.
  - **Evento o etiqueta de Clarity:** permite ver la grabación de la partida de quien opinó. Útil
    como complemento, pero no está pensado para leer mensajes y depende del consentimiento.
  - **Email (`mailto:`):** sin backend, pero abre la app de correo, deja visible la dirección y
    muchos no terminan de enviarlo.
  - **Formulario externo (Tally, Google Forms, Formspree):** rápido de montar y guarda las
    respuestas en una tabla; hay que abrir la CSP a ese servicio o enlazarlo en otra pestaña.
  - **Función propia en Vercel (`/api/feedback`):** formulario dentro del juego que guarda la idea
    o la manda por email (por ejemplo con Resend) o la crea como issue en GitHub para tenerla junto
    al roadmap. Es lo más integrado; necesita un token en el servidor y protección contra spam
    (límite de envíos y campo trampa).
  - **Propuesta:** 👍 / 👎 como evento de GA y el texto libre con la función de Vercel, que lo
    manda por email o como issue.
- **A tener en cuenta:** juegan niños, así que no pedir nombre ni email (o que sea opcional),
  avisar de para qué se usa y no guardar más de lo necesario.

## Consentimiento y privacidad

**Consentimiento de analítica:** hecho con un aviso Aceptar / Rechazar para GA y Clarity
(`oso.consent.v1`). Revisar si hace falta una política de privacidad si el juego se abre al
público general.
