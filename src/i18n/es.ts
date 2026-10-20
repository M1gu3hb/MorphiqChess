import { opposite, squareName, type Color, type DrawReason, type Outcome, type PieceType } from '../engine';
import type { Ply } from '../game';

/**
 * Textos de la interfaz (español). Están todos aquí para que agregar otro idioma sea
 * cuestión de crear un archivo con la misma forma.
 */
export const es = {
  appName: 'MorphiqChess',
  tagline: 'Juega, aprende y practica ajedrez',
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
    heading: 'Juega, aprende y practica.',
    lead: 'Ajedrez con las piezas de Morphiq: juega de a dos en un mismo dispositivo, aprende aperturas con lecciones o practica contra doce rivales de menor a mayor Elo.',
    newGame: 'Nueva partida',
    newGameHint: 'Dos jugadores; las piezas giran en cada turno',
    continueGame: 'Continuar partida',
    continueHint: 'Dos jugadores; sigue donde la dejaste',
    training: 'Entrenamiento',
    trainingHint: 'Aprende y practica aperturas y defensas',
    practice: 'Práctica',
    practiceHint: 'Juega contra 12 rivales, de menor a mayor Elo',
    features: [
      'Animaciones de movimiento, captura, jaque y jaque mate',
      'Barra lateral para revisar cualquier jugada anterior',
      'Reglas completas: enroque, al paso, coronación y tablas',
      'Sin cuentas: tus partidas y tu avance se guardan en el dispositivo',
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
        'Las lecciones y las variantes del entrenamiento vienen de tres proyectos abiertos: dos con licencia MIT y una base de aperturas de dominio público. Gracias a sus autores.',
      license: (license: string, holder: string) =>
        license === 'CC0' ? `Dominio público (CC0 1.0) · ${holder}` : `Licencia ${license} · © ${holder}`,
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
  bots: {
    title: 'Práctica',
    back: 'Volver',
    lead: 'Juega contra un rival del nivel que elijas. Cada pieza es un rival: del más fácil al más fuerte, para practicar sin presión.',
    eloNote:
      'El Elo es aproximado y está en la escala del motor Stockfish: sirve para ordenar a los rivales, pero no es un Elo FIDE ni el de una plataforma en línea.',
    elo: (value: number, open: boolean) => `Elo ${value}${open ? '+' : ''}`,
    tiers: {
      beginner: { title: 'Principiantes', hint: 'Para aprender cómo se mueven las piezas' },
      intermediate: { title: 'Intermedios', hint: 'Ya ven amenazas sencillas' },
      advanced: { title: 'Avanzados', hint: 'Casi no regalan nada' },
      expert: { title: 'Expertos', hint: 'Nivel de torneo' },
      master: { title: 'Maestros', hint: 'Lo más fuerte que hay' },
    },
    progress: (done: number, total: number) => `Has vencido a ${done} de ${total} rivales`,
    nextChallenge: 'Siguiente reto',
    beaten: 'Vencido',
    record: (wins: number, draws: number, losses: number) =>
      `${wins} ${wins === 1 ? 'victoria' : 'victorias'} · ${draws} ${draws === 1 ? 'empate' : 'empates'} · ${losses} ${losses === 1 ? 'derrota' : 'derrotas'}`,
    noRecord: 'Aún no has jugado contra él',
    cardLabel: (name: string, elo: string) => `Jugar contra ${name}, ${elo}`,
    resume: {
      title: 'Partida en curso',
      body: (name: string, side: string, plies: number) =>
        `Contra ${name} · juegas con ${side} · ${plies} ${plies === 1 ? 'jugada' : 'jugadas'}`,
      action: 'Continuar',
    },
    resetRecords: 'Borrar mis resultados',
    resetTitle: '¿Borrar tus resultados?',
    resetBody: 'Se borra el recuento de victorias, empates y derrotas contra todos los rivales. No se puede deshacer.',
    resetConfirm: 'Sí, borrar',
    picker: {
      title: (name: string) => `Jugar contra ${name}`,
      white: 'Blancas',
      black: 'Azules',
      random: 'Al azar',
      whiteHelp: 'Tú mueves primero',
      blackHelp: 'El rival mueve primero',
      randomHelp: 'Lo decide el azar',
      replace: (name: string) => `Se reemplaza la partida en curso contra ${name}.`,
    },
    you: 'Tú',
    gameTitle: (name: string) => `Partida contra ${name}`,
    notFound: 'No encontré a ese rival.',
    toMenu: 'Elegir rival',
    status: {
      loading: 'Cargando el motor…',
      thinking: 'Pensando…',
      failed: 'El rival no pudo cargar.',
      retry: 'Reintentar',
    },
    actions: {
      hint: 'Pista',
      hinting: 'Buscando una pista…',
      undo: 'Deshacer tu última jugada',
      draw: 'Ofrecer tablas',
      resign: 'Rendirme',
      newGame: 'Revancha',
      switchBot: 'Cambiar de rival',
    },
    menu: { title: 'Menú' },
    resign: {
      title: '¿Rendirte?',
      body: (name: string) => `La partida terminará y ganará ${name}.`,
      confirm: 'Sí, rendirme',
    },
    draw: {
      title: 'Ofrecer tablas',
      body: (name: string) => `${name} decidirá si las acepta según cómo vea la partida.`,
      offer: 'Ofrecer tablas',
      asking: (name: string) => `${name} lo está pensando…`,
      tooEarly: 'Es muy pronto para unas tablas: sigue jugando un poco más.',
      declined: (name: string) => `${name} no acepta: cree que está mejor.`,
      failed: 'No pude consultar al rival. Inténtalo de nuevo.',
      claimThreefold: 'Reclamar tablas por triple repetición',
      claimFifty: 'Reclamar tablas por la regla de 50 movimientos',
      available: 'Hay tablas disponibles',
    },
    restart: {
      title: '¿Empezar de nuevo?',
      body: 'Se pierde la partida actual y se cuenta como no jugada.',
      confirm: 'Sí, empezar de nuevo',
    },
    result: {
      win: '¡Ganaste!',
      loss: 'Perdiste',
      draw: 'Tablas',
      winBy: (name: string) => `Venciste a ${name}.`,
      lossBy: (name: string) => `${name} ganó esta vez.`,
      drawBy: (name: string, reason: string) => `${reason} contra ${name}.`,
      record: (name: string, wins: number, draws: number, losses: number) =>
        `Contra ${name}: ${wins} ${wins === 1 ? 'victoria' : 'victorias'}, ${draws} ${draws === 1 ? 'empate' : 'empates'}, ${losses} ${losses === 1 ? 'derrota' : 'derrotas'}.`,
      rematch: 'Revancha',
      other: 'Cambiar de rival',
      review: 'Revisar jugadas',
      close: 'Cerrar',
    },
    credits: {
      title: 'Motor de los rivales',
      body: 'Los rivales juegan con Stockfish, un programa libre de ajedrez (licencia GPL-3.0). Se ejecuta en tu dispositivo, dentro de la página, sin enviar tus partidas a ningún servidor.',
      source: 'Código fuente y licencia en el archivo THIRD_PARTY_NOTICES.md del repositorio.',
    },
    a11y: {
      failed: 'El rival no pudo cargar.',
      loading: 'Cargando el motor del rival.',
      hintShown: (from: string, to: string) => `Pista: mueve de ${from} a ${to}.`,
      noHint: 'No encontré una pista.',
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
