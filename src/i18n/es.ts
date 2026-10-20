import { opposite, squareName, type Color, type DrawReason, type Outcome, type PieceType } from '../engine';
import type { Ply } from '../game';

/**
 * Textos de la interfaz (español). Están todos aquí para que agregar otro idioma sea
 * cuestión de crear un archivo con la misma forma.
 */
export const es = {
  appName: 'MorphiqChess',
  tagline: 'Ajedrez para 2 jugadores',
  sides: { w: 'Blancas', b: 'Azules' } satisfies Record<Color, string>,
  sidesOf: { w: 'las Blancas', b: 'las Azules' } satisfies Record<Color, string>,
  pieceNames: {
    p: 'peón',
    n: 'caballo',
    b: 'alfil',
    r: 'torre',
    q: 'dama',
    k: 'rey',
  } satisfies Record<PieceType, string>,
  home: {
    heading: 'Dos jugadores, un mismo tablero.',
    lead: 'Juega con otra persona en el mismo dispositivo. En cada turno las piezas giran 180° para quedar derechas frente a quien juega.',
    newGame: 'Nueva partida',
    continueGame: 'Continuar partida',
    training: 'Entrenamiento',
    features: [
      'Animaciones de movimiento, captura, jaque y jaque mate',
      'Barra lateral para revisar cualquier jugada anterior',
      'Reglas completas: enroque, al paso, coronación y tablas',
      'Entrenamiento: lecciones y práctica de aperturas y defensas',
    ],
    footer: 'Un proyecto de Astral Morphiq Systems',
  },
  game: {
    turnOf: (side: string) => `Turno de ${side}`,
    check: 'Jaque',
    viewing: (n: number, total: number) => `Viendo la jugada ${n} de ${total}`,
    viewingStart: (total: number) => `Viendo la posición inicial (${total} ${total === 1 ? 'jugada' : 'jugadas'})`,
    backToGame: 'Volver a la partida',
    resumeHere: 'Retomar desde aquí',
    moves: 'Jugadas',
    noMoves: 'Aún no hay jugadas. Mueve una pieza blanca para empezar.',
    captured: 'Capturadas',
    nav: {
      first: 'Ir al inicio',
      back: 'Jugada anterior',
      forward: 'Jugada siguiente',
      last: 'Ir a la última jugada',
    },
    actions: {
      undo: 'Deshacer',
      draw: 'Tablas',
      resign: 'Rendirse',
      newGame: 'Nueva partida',
      settings: 'Ajustes',
      home: 'Inicio',
    },
  },
  menu: {
    title: 'Menú',
  },
  rail: {
    title: 'Herramientas',
    open: 'Abrir herramientas',
    close: 'Cerrar herramientas',
    scrub: 'Recorrer las jugadas',
    scrubText: (n: number, total: number) => (n === 0 ? 'Posición inicial' : `Jugada ${n} de ${total}`),
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    menu: 'Menú',
  },
  strip: {
    viewing: (n: number, total: number) => (n === 0 ? 'Posición inicial' : `Jugada ${n} de ${total}`),
    back: 'Volver',
    resume: 'Retomar aquí',
  },
  banners: {
    check: 'JAQUE',
    mate: 'JAQUE MATE',
    stalemate: 'AHOGADO',
    draw: 'TABLAS',
    resigned: 'SE RINDIÓ',
  },
  dialogs: {
    cancel: 'Cancelar',
    promotion: {
      title: 'Corona tu peón',
      pick: (name: string) => `Coronar a ${name}`,
    },
    resign: {
      title: '¿Quién se rinde?',
      body: 'La partida terminará y ganará el otro bando.',
    },
    draw: {
      title: 'Proponer tablas',
      body: 'Si los dos jugadores aceptan, la partida termina en tablas.',
      accept: 'Aceptar tablas',
      claimThreefold: 'Reclamar tablas por triple repetición',
      claimFifty: 'Reclamar tablas por la regla de 50 movimientos',
      available: 'Hay tablas disponibles',
    },
    newGame: {
      title: '¿Empezar una partida nueva?',
      body: 'Se perderá la partida actual.',
      bodySaved: 'Se perderá la partida guardada.',
      confirm: 'Sí, nueva partida',
    },
    settings: {
      title: 'Ajustes',
      rotate: 'Girar las piezas en cada turno',
      rotateHelp: 'Cada pieza gira 180° sobre su propio eje para quedar derecha frente a quien juega.',
      motion: 'Animaciones completas',
      motionHelp: 'Desactívalas para reducir el movimiento: sin giros ni efectos grandes.',
      autoFullscreen: 'Pantalla completa al jugar',
      autoFullscreenHelp: 'Al empezar o continuar una partida se oculta todo menos el tablero.',
      iphoneTip:
        'En iPhone, para jugar a pantalla completa abre el menú Compartir y elige «Añadir a pantalla de inicio».',
      close: 'Cerrar',
    },
  },
  gameOver: {
    title: 'Fin de la partida',
    newGame: 'Nueva partida',
    review: 'Revisar jugadas',
    close: 'Cerrar',
  },
  shortcuts: {
    title: 'Atajos de teclado',
    items: [
      ['← →', 'Jugada anterior / siguiente'],
      ['Inicio, Fin', 'Ir a la posición inicial / a la última jugada'],
      ['Alt + ← →', 'Lo mismo cuando el foco está dentro del tablero'],
      ['Enter, Espacio', 'Seleccionar una pieza y elegir su destino'],
      ['Esc', 'Cancelar la selección'],
    ],
  },
  training: {
    title: 'Entrenamiento',
    back: 'Volver',
    backToCourse: 'Volver a la apertura',
    loading: 'Cargando…',
    loadError: 'No se pudo cargar esta pantalla. Revisa tu conexión y vuelve a intentarlo.',
    reload: 'Recargar',
    notFound: 'No encontré esa pantalla del entrenamiento.',
    toMenu: 'Ir al entrenamiento',
    sideLong: { w: 'Juegas con blancas', b: 'Juegas con azules' } satisfies Record<Color, string>,
    sideShort: { w: 'blancas', b: 'azules' } satisfies Record<Color, string>,
    levels: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
    percent: (value: number) => `${Math.round(value * 100)} %`,
    menu: {
      lead: 'Aprende cada apertura con lecciones paso a paso y practícala contra el bot hasta dominarla.',
      stats: {
        lessons: 'Lecciones',
        lessonsValue: (done: number, total: number) => `${done} de ${total}`,
        mastery: 'Dominio',
        masteryNote: 'de lo que se practica',
        review: 'Para repasar',
        reviewNote: 'posiciones',
      },
      groups: {
        aperturas: { title: 'Aperturas', hint: 'Las juegas con blancas' },
        defensas: { title: 'Defensas', hint: 'Las juegas con azules' },
        fundamentos: { title: 'Fundamentos', hint: 'Lo básico antes de elegir una' },
      },
      lessons: (n: number) => `${n} ${n === 1 ? 'lección' : 'lecciones'}`,
      lessonsDone: (done: number, total: number) => `${done} de ${total} hechas`,
      variants: (n: number) => `${n} ${n === 1 ? 'variante' : 'variantes'}`,
      positions: (n: number) => `${n} ${n === 1 ? 'posición' : 'posiciones'}`,
      mastery: 'Dominio',
      mastered: 'Dominada',
      credits: 'Créditos y licencias',
    },
    credits: {
      title: 'Créditos y licencias',
      intro:
        'Las lecciones y las variantes del entrenamiento vienen de dos proyectos abiertos con licencia MIT. Gracias a sus autores.',
      license: (holder: string) => `Licencia MIT · © ${holder}`,
      cite: 'FreeChessTrainer Opening Dataset, GitHub repository: https://github.com/freechesstrainer/freechess-trainer-openings',
      notices: 'El texto completo de las licencias está en el archivo THIRD_PARTY_NOTICES.md del repositorio.',
      close: 'Cerrar',
    },
    course: {
      learn: 'Aprender',
      learnLead: 'Lecciones paso a paso, como en una clase.',
      lessonSteps: (n: number) => `${n} ${n === 1 ? 'paso' : 'pasos'}`,
      lessonDone: 'Hecha',
      open: 'Empezar',
      repeat: 'Repetir',
      practice: 'Practicar',
      practiceLead:
        'El bot juega el otro bando y tú respondes con la jugada de la apertura. Si fallas, la posición vuelve a salir pronto; si aciertas, tarda más en volver.',
      masteryLead: 'El dominio llega al 100 % cuando aciertas cada posición en repasos espaciados. Si dejas de repasar, baja.',
      start: 'Practicar',
      startNote: 'El repaso elige la posición que más te falta.',
      fromStart: 'Desde la primera jugada',
      masteredBanner: '¡Apertura dominada! Sigue repasando para mantenerla.',
      breakdown: {
        fresh: 'Nuevas',
        review: 'Para repasar',
        progress: 'En curso',
        mastered: 'Dominadas',
      },
      reset: 'Borrar el progreso',
      resetTitle: '¿Borrar el progreso de esta apertura?',
      resetBody: (name: string) =>
        `Se pierden el dominio y las lecciones terminadas de ${name}. No se puede deshacer.`,
      resetConfirm: 'Sí, borrar',
      cancel: 'Cancelar',
    },
    lesson: {
      step: (n: number, total: number) => `Paso ${n} de ${total}`,
      next: 'Siguiente',
      finish: 'Terminar',
      prev: 'Atrás',
      hint: 'Pista',
      moreHint: 'Más pista',
      showMove: 'Mostrar la jugada',
      yourTurn: 'Tu turno',
      hintLabel: 'Pista',
      correct: (san: string) => `¡Correcto! Jugaste ${san}.`,
      shown: (san: string) => `Esta era la jugada: ${san}.`,
      wrong: 'Esa no es. Prueba otra jugada.',
      done: {
        title: 'Lección completada',
        body: (title: string) => `Terminaste «${title}».`,
        clean: (right: number, total: number) => `${right} de ${total} jugadas a la primera`,
        nextLesson: 'Siguiente lección',
        again: 'Repetir la lección',
        practice: 'Practicar esta apertura',
      },
    },
    practice: {
      title: 'Practicar',
      setup: 'Llegando a la posición…',
      bot: 'El bot responde…',
      yourTurn: (side: string) => `Tu turno: juegas con ${side}.`,
      hint: 'Pista',
      moreHint: 'Más pista',
      showMove: 'Mostrar la jugada',
      correct: '¡Correcto!',
      wrong: 'Esa jugada no es de esta apertura. Prueba otra.',
      hint1: 'Mueve la pieza marcada.',
      hint2: 'Esa es la jugada.',
      revealed: 'Esta era la jugada. Volverá a salir pronto.',
      possible: (n: number) => `${n} ${n === 1 ? 'variante posible' : 'variantes posibles'}`,
      session: (ok: number, bad: number) => `Aciertos ${ok} · Fallos ${bad}`,
      moves: 'Jugadas',
      noMoves: 'Aún no hay jugadas.',
      mastery: 'Dominio',
      result: {
        title: '¡Variante completada!',
        more: (n: number) => `y ${n} más`,
        clean: (clean: number, asked: number) => `${clean} de ${asked} jugadas a la primera`,
        next: 'Siguiente',
        exit: 'Salir',
      },
      loadError: 'No se pudieron cargar las variantes de esta apertura.',
    },
  },
  a11y: {
    board: 'Tablero de ajedrez',
    skip: 'Saltar al tablero',
    history: 'Historial de jugadas',
    captured: (side: string) => `Piezas capturadas por ${side}`,
    nothingCaptured: 'ninguna',
    announceNew: 'Partida nueva.',
    announceViewing: (n: number, total: number) => `Jugada ${n} de ${total}.`,
    announceStart: 'Posición inicial.',
    boardHelp:
      'Usa las flechas para moverte por el tablero, Enter o espacio para seleccionar una pieza y para elegir su destino, y Escape para cancelar.',
    moveList: 'Lista de jugadas',
    empty: 'vacía',
    selected: 'seleccionada',
    legalTarget: 'destino posible',
  },
} as const;

const DRAW_TEXT: Record<DrawReason, string> = {
  stalemate: 'Rey ahogado',
  'insufficient-material': 'Material insuficiente',
  'seventy-five-move': 'Regla de 75 movimientos',
  fivefold: 'Repetición cinco veces',
  threefold: 'Triple repetición',
  'fifty-move': 'Regla de 50 movimientos',
  agreement: 'Por acuerdo',
};

export interface OutcomeText {
  /** Titular corto: «Jaque mate», «Tablas»… */
  readonly headline: string;
  /** Detalle: quién gana o por qué son tablas. */
  readonly detail: string;
}

export function describeOutcome(outcome: Outcome): OutcomeText {
  switch (outcome.type) {
    case 'checkmate':
      return { headline: 'Jaque mate', detail: `Ganan ${es.sidesOf[outcome.winner]}` };
    case 'resignation':
      return { headline: 'Rendición', detail: `Ganan ${es.sidesOf[outcome.winner]}` };
    case 'draw':
      return { headline: 'Tablas', detail: DRAW_TEXT[outcome.reason] };
  }
}

/** «peón blanco», «dama azul»: con concordancia de género. */
export function describePiece(color: Color, type: PieceType): string {
  const feminine = type === 'q' || type === 'r';
  const adjective = color === 'w' ? (feminine ? 'blanca' : 'blanco') : feminine ? 'azul' : 'azul';
  return `${es.pieceNames[type]} ${adjective}`;
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** Descripción hablada de una jugada, para el aviso de lectores de pantalla. */
export function announcePly(ply: Ply): string {
  const { move } = ply;
  let text: string;
  if (move.castle) {
    text = `${es.sides[move.color]}: enroque ${move.castle === 'k' ? 'corto' : 'largo'}`;
  } else {
    text = `${capitalize(describePiece(move.color, move.piece))} de ${squareName(move.from)} a ${squareName(move.to)}`;
    if (move.capture) text += `, captura ${describePiece(opposite(move.color), move.capture)}`;
    if (move.promotion) text += `, corona a ${es.pieceNames[move.promotion]}`;
  }
  if (ply.mate) text += '. Jaque mate';
  else if (ply.check) text += '. Jaque';
  return `${text}.`;
}
