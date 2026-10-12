// Parámetros del juego: el panel del director del juego. Cambiar un valor aquí lo cambia en el
// juego, en el servidor de salas en línea (api/_sala.js) y en los textos que lo mencionan.
// Después: `npm run config` regenera docs/CONFIG.md, y `npm test` comprueba que todo tiene sentido
// (tests/unit/config.test.js). Cada valor está explicado en HELP, más abajo.
const freeze = (o) =>
  Object.freeze(
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v && typeof v === 'object' ? freeze(v) : v])),
  );

export const GAME = freeze({
  board: {
    seconds: { 4: 60, 5: 90, 6: 120, 7: 150, 8: 210 },
    defaultSize: 5,
    fourPlayersMinSize: 6,
  },
  clock: {
    bonusSeconds: 10,
    lowSeconds: 20,
  },
  extras: {
    hint: 1,
    last: 1,
    swap: 1,
  },
  sos: {
    flashMs: 2500,
    pauseMs: 220,
    moveMs: 260,
  },
  shop: {
    taps: 3,
    tapGapMs: 700,
    hintSeconds: 10,
    swapSeconds: 10,
    sosSeconds: 30,
  },
  machine: {
    delayMs: 650,
    easyScoreChance: 0.7,
    easyPool: 6,
  },
  online: {
    closeAfterMinutes: 30,
    countdownSeconds: 3,
    nudgeSeconds: 20,
    pollMs: 1000,
    roomsPerConnection: 20,
    roomsWindowMinutes: 10,
    roomHours: 24,
    closedRoomHours: 1,
  },
  secrets: {
    gamesPerSecret: 2,
    spotlightMs: 3000,
  },
  themes: {
    eggTaps: 6,
    eggTapGapMs: 700,
    eggWindowMs: 3000,
    eggPartyMs: 3600,
    festivalDays: 31,
    menuMax: 5,
    listMax: 10,
  },
  feedback: {
    streak: 3,
    cooldown: 5,
  },
  telemetry: {
    timeoutTarget: 0.5,
  },
  sound: {
    volume: 0.16,
  },
  screen: {
    fourMinWidth: 700,
    fourMinHeight: 600,
    swipePx: 40,
    keyboardMinPx: 100,
  },
});

export const SECTIONS = {
  board: 'Tableros y tiempos',
  clock: 'Reloj',
  extras: 'Extras (usos por jugador y partida)',
  sos: '🛟 SOS',
  shop: '🛒 Tienda secreta (comprar extras gastados)',
  machine: 'Máquina',
  online: 'En línea',
  secrets: 'Secretos',
  themes: 'Temas y easter egg del 🎨',
  feedback: 'Encuesta «¿Os está gustando OSO?»',
  telemetry: 'Medición',
  sound: 'Sonido',
  screen: 'Pantalla (técnico)',
};

// Qué hace cada parámetro y qué pasa al subirlo o bajarlo.
export const HELP = {
  'board.seconds':
    'Tableros que se pueden elegir y segundos de reloj de cada jugador en cada uno. Añadir o quitar un tamaño cambia el selector y lo que acepta el servidor. Más tiempo = partidas más largas y menos finales por tiempo.',
  'board.defaultSize': 'Tablero que sale elegido la primera vez (después se recuerda el último).',
  'board.fourPlayersMinSize': 'Tablero mínimo con 4 jugadores; los más pequeños se desactivan.',
  'clock.bonusSeconds':
    'Segundos que gana quien forma un OSO (por cada uno). Más = partidas más largas y premia más puntuar.',
  'clock.lowSeconds':
    'Con este tiempo o menos el reloj se pone en aviso y suena, el fondo se va tiñendo de rojo y late (tensión), y en línea se anima a quien espera.',
  'extras.hint': '💡 Pistas por jugador y partida. 0 = desactivada.',
  'extras.last': '👁️ Ver la última jugada del rival, por jugador y partida. 0 = desactivada.',
  'extras.swap': '🔄 Cambiar una O por una S (o al revés), por jugador y partida. 0 = desactivado.',
  'sos.flashMs':
    'Lo que dura la intro a pantalla completa «S🛟S» antes de repetir la partida (2-3 s). El reloj espera mientras tanto.',
  'sos.pauseMs': 'Pausa entre el aviso y la repetición.',
  'sos.moveMs': 'Lo que tarda en repetirse cada jugada. Más = repetición más lenta y fácil de seguir.',
  'shop.taps':
    'Toques seguidos en un 💡, 🔄 o 🛟 ya gastado para abrir la tienda (el texto del secreto se ajusta solo).',
  'shop.tapGapMs': 'Tiempo máximo entre dos toques para que cuenten como seguidos.',
  'shop.hintSeconds':
    'Segundos del propio reloj que cuesta otra 💡 pista. Se puede comprar mientras queden segundos.',
  'shop.swapSeconds': 'Segundos que cuesta otro 🔄 cambio de letra.',
  'shop.sosSeconds':
    'Segundos que cuesta otro 🛟 SOS. Al usarlo, la partida cambia de OSO a SOS (o vuelve) para todo el mundo.',
  'machine.delayMs': 'Lo que «piensa» la máquina antes de mover. Menos = más ágil pero menos natural.',
  'machine.easyScoreChance':
    'En fácil, probabilidad (0 a 1) de que aproveche un OSO que tiene a mano. Más = máquina fácil más difícil.',
  'machine.easyPool':
    'En fácil, entre cuántas buenas jugadas elige al azar cuando no puntúa. Más = más despistada.',
  'online.closeAfterMinutes':
    'Si la partida no empieza en estos minutos desde que se abre la sala, se cierra.',
  'online.countdownSeconds': 'Cuenta atrás «3, 2, 1…» en las dos pantallas antes de la primera jugada.',
  'online.nudgeSeconds': 'Sin mover este tiempo, sale «¿Sigues ahí?» y se anima a quien espera.',
  'online.pollMs': 'Cada cuánto pregunta el juego al servidor. Menos = más rápido pero más peticiones.',
  'online.roomsPerConnection':
    'Salas que puede abrir una misma conexión en la ventana de abajo (anti-abuso).',
  'online.roomsWindowMinutes': 'Ventana del límite anterior.',
  'online.roomHours': 'Horas que se guarda una sala con partida empezada (para revanchas y reconexión).',
  'online.closedRoomHours': 'Horas que se guarda una sala cerrada, para avisar a quien abra el enlace viejo.',
  'secrets.gamesPerSecret':
    'Partidas terminadas (cualquier modo y resultado) para cada secreto nuevo; como mucho 1 al día.',
  'secrets.spotlightMs':
    'Milisegundos que brilla lo que hay que pulsar (🎨, «¡A jugar!», extras) al ir desde el botón del secreto.',
  'themes.eggTaps':
    'Pulsaciones seguidas en 🎨 para descubrir todos los temas (el texto del secreto se ajusta solo).',
  'themes.eggTapGapMs': 'Tiempo máximo entre dos pulsaciones para que cuenten como seguidas.',
  'themes.eggWindowMs': 'Tiempo máximo para hacer todas las pulsaciones.',
  'themes.eggPartyMs': 'Lo que dura la lluvia de huevos al descubrirlo.',
  'themes.festivalDays': 'Días antes y después de una fiesta en que su tema sale en el menú 🎨.',
  'themes.menuMax': 'Temas como máximo en el menú 🎨 (contando el clásico).',
  'themes.listMax': 'Temas como máximo contando también «Ver otros».',
  'feedback.streak': 'Se pregunta cada este número de partidas seguidas en la misma sesión.',
  'feedback.cooldown': 'Partidas mínimas entre dos preguntas.',
  'telemetry.timeoutTarget':
    'Objetivo (0 a 1) de partidas que acaban por tiempo; sirve para ajustar los tiempos con datos.',
  'sound.volume': 'Volumen general de los sonidos (0 a 1).',
  'screen.fourMinWidth': 'Ancho mínimo de pantalla (px) para ofrecer 4 jugadores.',
  'screen.fourMinHeight': 'Alto mínimo de pantalla (px) para ofrecer 4 jugadores.',
  'screen.swipePx': 'Distancia (px) que hay que deslizar el dedo para pasar de regla en «Cómo se juega».',
  'screen.keyboardMinPx':
    'Altura (px) a partir de la que se considera que el teclado del móvil tapa la pantalla.',
};

// The value at a path like 'clock.bonusSeconds' (used by [data-config] texts in the HTML).
export const configValue = (path) => path.split('.').reduce((o, k) => o?.[k], GAME);

export const BOARD_SIZES = Object.keys(GAME.board.seconds).map(Number);
