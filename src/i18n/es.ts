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
    features: [
      'Animaciones de movimiento, captura, jaque y jaque mate',
      'Flechas para revisar cualquier jugada anterior',
      'Reglas completas: enroque, al paso, coronación y tablas',
    ],
    footer: 'Un proyecto de Astral Morphiq Systems',
  },
  game: {
    turnOf: (side: string) => `Turno de ${side}`,
    check: 'Jaque',
    viewing: (n: number, total: number) => `Viendo la jugada ${n} de ${total}`,
    viewingStart: (total: number) => `Viendo la posición inicial (${total} jugadas)`,
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
      confirm: 'Sí, nueva partida',
    },
    settings: {
      title: 'Ajustes',
      rotate: 'Girar las piezas en cada turno',
      rotateHelp: 'Cada pieza gira 180° sobre su propio eje para quedar derecha frente a quien juega.',
      motion: 'Animaciones completas',
      motionHelp: 'Desactívalas para reducir el movimiento: sin giros ni efectos grandes.',
      close: 'Cerrar',
    },
  },
  gameOver: {
    title: 'Fin de la partida',
    newGame: 'Nueva partida',
    review: 'Revisar jugadas',
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
