import { codeOf, colorOfCode, typeOfCode } from './pieces';
import { FILES, parseSquare, squareName } from './squares';
import {
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  type Color,
  type PieceType,
  type Position,
} from './types';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const PIECE_LETTERS = 'pnbrqk';

/**
 * Lee una posición en notación FEN. Valida la estructura (no la legalidad profunda).
 * Los derechos de enroque se normalizan contra las piezas realmente presentes.
 */
export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 4) throw new Error('FEN inválido: se esperaban al menos 4 campos');
  const placement = fields[0]!;
  const active = fields[1]!;
  const castlingField = fields[2]!;
  const epField = fields[3]!;
  const halfmove = fields[4] === undefined ? 0 : Number(fields[4]);
  const fullmove = fields[5] === undefined ? 1 : Number(fields[5]);

  const ranks = placement.split('/');
  if (ranks.length !== 8) throw new Error('FEN inválido: se esperaban 8 filas');

  const board = new Int8Array(64);
  const kings = { w: 0, b: 0 };
  for (let i = 0; i < 8; i++) {
    const rank = 7 - i;
    let file = 0;
    for (const ch of ranks[i]!) {
      if (ch >= '1' && ch <= '8') {
        file += Number(ch);
        continue;
      }
      const lower = ch.toLowerCase();
      if (PIECE_LETTERS.indexOf(lower) < 0 || file > 7) {
        throw new Error(`FEN inválido: carácter inesperado "${ch}" en la fila ${rank + 1}`);
      }
      const color: Color = ch === lower ? 'b' : 'w';
      const type = lower as PieceType;
      if (type === 'p' && (rank === 0 || rank === 7)) {
        throw new Error('FEN inválido: peón en la primera o última fila');
      }
      if (type === 'k') kings[color]++;
      board[rank * 8 + file] = codeOf(color, type);
      file++;
    }
    if (file !== 8) throw new Error(`FEN inválido: la fila ${rank + 1} no suma 8 columnas`);
  }
  if (kings.w !== 1 || kings.b !== 1) throw new Error('FEN inválido: cada bando necesita exactamente un rey');

  if (active !== 'w' && active !== 'b') throw new Error('FEN inválido: turno debe ser "w" o "b"');
  const turn: Color = active;

  let castling = 0;
  if (castlingField !== '-') {
    for (const ch of castlingField) {
      if (ch === 'K') castling |= CASTLE_WK;
      else if (ch === 'Q') castling |= CASTLE_WQ;
      else if (ch === 'k') castling |= CASTLE_BK;
      else if (ch === 'q') castling |= CASTLE_BQ;
      else throw new Error(`FEN inválido: derecho de enroque desconocido "${ch}"`);
    }
  }
  // Un derecho solo es real si rey y torre siguen en su casilla de origen.
  if (board[4] !== codeOf('w', 'k')) castling &= ~(CASTLE_WK | CASTLE_WQ);
  if (board[7] !== codeOf('w', 'r')) castling &= ~CASTLE_WK;
  if (board[0] !== codeOf('w', 'r')) castling &= ~CASTLE_WQ;
  if (board[60] !== codeOf('b', 'k')) castling &= ~(CASTLE_BK | CASTLE_BQ);
  if (board[63] !== codeOf('b', 'r')) castling &= ~CASTLE_BK;
  if (board[56] !== codeOf('b', 'r')) castling &= ~CASTLE_BQ;

  let ep = -1;
  if (epField !== '-') {
    const sq = parseSquare(epField);
    if (sq === null) throw new Error(`FEN inválido: casilla al paso "${epField}"`);
    const expectedRank = turn === 'w' ? 5 : 2;
    if (sq >> 3 !== expectedRank) throw new Error('FEN inválido: casilla al paso en fila incorrecta');
    // Solo se conserva si el peón que acaba de avanzar existe de verdad.
    const pawnSq = turn === 'w' ? sq - 8 : sq + 8;
    if (board[pawnSq] === codeOf(turn === 'w' ? 'b' : 'w', 'p') && board[sq] === 0) ep = sq;
  }

  if (!Number.isInteger(halfmove) || halfmove < 0) throw new Error('FEN inválido: contador de medios movimientos');
  if (!Number.isInteger(fullmove) || fullmove < 1) throw new Error('FEN inválido: número de jugada');

  return { board, turn, castling, ep, halfmove, fullmove };
}

export function initialPosition(): Position {
  return parseFen(START_FEN);
}

/** Primera parte del FEN: colocación de piezas. */
export function placementOf(board: Int8Array): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const code = board[rank * 8 + file]!;
      if (code === 0) {
        empty++;
        continue;
      }
      if (empty > 0) {
        row += empty;
        empty = 0;
      }
      const letter = typeOfCode(code);
      row += colorOfCode(code) === 'w' ? letter.toUpperCase() : letter;
    }
    if (empty > 0) row += empty;
    rows.push(row);
  }
  return rows.join('/');
}

export function castlingString(castling: number): string {
  let out = '';
  if (castling & CASTLE_WK) out += 'K';
  if (castling & CASTLE_WQ) out += 'Q';
  if (castling & CASTLE_BK) out += 'k';
  if (castling & CASTLE_BQ) out += 'q';
  return out || '-';
}

export function toFen(pos: Position): string {
  const ep = pos.ep === -1 ? '-' : squareName(pos.ep);
  return `${placementOf(pos.board)} ${pos.turn} ${castlingString(pos.castling)} ${ep} ${pos.halfmove} ${pos.fullmove}`;
}

/** Texto ASCII del tablero (útil en pruebas y depuración). */
export function boardToAscii(board: Int8Array): string {
  const lines: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let line = `${rank + 1} `;
    for (let file = 0; file < 8; file++) {
      const code = board[rank * 8 + file]!;
      if (code === 0) line += '. ';
      else {
        const letter = typeOfCode(code);
        line += `${colorOfCode(code) === 'w' ? letter.toUpperCase() : letter} `;
      }
    }
    lines.push(line.trimEnd());
  }
  lines.push(`  ${[...FILES].join(' ')}`);
  return lines.join('\n');
}
