import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Director } from '../../anim/director';
import { EASE_OUT, IMPACT_GAP_MS, arrivalMs, type MotionMode, type Orientation } from '../../anim/timing';
import { makeFrame, type DropHint } from '../../anim/types';
import {
  colorOfCode,
  isLightSquare,
  kingSquare,
  squareName,
  typeOfCode,
  type Move,
  type Outcome,
  type PromotionPiece,
} from '../../engine';
import {
  canPlay,
  idsAt,
  inCheckAt,
  isAtEnd,
  legalMovesOf,
  lastMoveAt,
  positionAt,
  type GameSnapshot,
} from '../../game';
import { describePiece, es } from '../../i18n/es';
import { PIECE_SRC } from '../pieceArt';
import { BoardFrame } from './BoardFrame';
import { fileOf, rowOf, squareAt } from './geometry';
import { PieceView } from './PieceView';
import { PromotionChooser } from './PromotionChooser';

export interface BoardProps {
  readonly game: GameSnapshot;
  /** Hacia quién miran las piezas: 0° = Blancas (abajo), 180° = Azules (arriba). */
  readonly orientation: Orientation;
  readonly motion: MotionMode;
  /** false = tablero decorativo (sin foco ni clics). */
  readonly interactive?: boolean;
  readonly onMove?: (move: Move) => void;
}

interface Tagged {
  readonly gameId: number;
  readonly revision: number;
}

interface Selection extends Tagged {
  readonly sq: number;
}

interface PromotionRequest extends Tagged {
  readonly from: number;
  readonly to: number;
}

interface DragState {
  readonly pointerId: number;
  readonly from: number;
  readonly id: number;
  readonly startX: number;
  readonly startY: number;
  readonly element: HTMLElement | null;
  readonly wasSelected: boolean;
  readonly threshold: number;
  moved: boolean;
}

const flag = (value: boolean): '' | undefined => (value ? '' : undefined);
const NO_MOVES: readonly Move[] = [];

type BannerKind = keyof typeof es.banners;

/** Aviso del final de la partida; el jaque mate lo anuncia la propia jugada. */
function endBannerKind(outcome: Outcome | null): BannerKind | null {
  if (!outcome) return null;
  if (outcome.type === 'resignation') return 'resigned';
  if (outcome.type === 'draw') return outcome.reason === 'stalemate' ? 'stalemate' : 'draw';
  return null;
}

export function Board({ game, orientation, motion, interactive = true, onMove }: BoardProps) {
  const uid = useId();
  const boardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const piecesRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const directorRef = useRef<Director | null>(null);
  const dropRef = useRef<DropHint | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [promotion, setPromotion] = useState<PromotionRequest | null>(null);
  const [hoverSq, setHoverSq] = useState<number | null>(null);
  const [focusSq, setFocusSq] = useState<number>(12); // e2

  /* ---------- datos derivados de la partida ---------- */

  const position = positionAt(game);
  const ids = idsAt(game);
  const playable = interactive && canPlay(game);
  const legal = playable ? legalMovesOf(position) : NO_MOVES;

  const movesByFrom = useMemo(() => {
    const map = new Map<number, Move[]>();
    for (const move of legal) {
      const list = map.get(move.from);
      if (list) list.push(move);
      else map.set(move.from, [move]);
    }
    return map;
  }, [legal]);

  const selectedSq =
    playable && selection && selection.gameId === game.gameId && selection.revision === game.revision
      ? selection.sq
      : null;
  const pendingPromotion =
    promotion && promotion.gameId === game.gameId && promotion.revision === game.revision ? promotion : null;

  const { targets, captures } = useMemo(() => {
    const to = new Set<number>();
    const capture = new Set<number>();
    for (const move of selectedSq === null ? NO_MOVES : (movesByFrom.get(selectedSq) ?? NO_MOVES)) {
      to.add(move.to);
      if (move.capture) capture.add(move.to);
    }
    return { targets: to, captures: capture };
  }, [selectedSq, movesByFrom]);

  const lastMove = lastMoveAt(game);
  const checkSq = inCheckAt(game) ? kingSquare(position.board, position.turn) : -1;
  const lastPly = game.cursor > 0 ? game.plies[game.cursor - 1] : undefined;
  const matedSq = lastPly?.mate ? kingSquare(position.board, position.turn) : -1;

  const transition = game.transition;
  const arriving = transition.type === 'forward' && transition.index === game.cursor ? transition.ply : null;
  const impactDelay = arriving ? arrivalMs(arriving.move, motion) + IMPACT_GAP_MS : 0;
  const toppleDelay = arriving?.mate ? impactDelay + 220 : 0;
  const ending = isAtEnd(game) ? endBannerKind(game.outcome) : null;
  let banner: { kind: BannerKind; delay: number } | null = null;
  if (arriving?.check) banner = { kind: arriving.mate ? 'mate' : 'check', delay: impactDelay + 40 };
  else if (arriving && ending) banner = { kind: ending, delay: impactDelay + 40 }; // ahogado, tablas automáticas
  else if (transition.type === 'none' && transition.ended && ending) banner = { kind: ending, delay: 120 };

  const frame = useMemo(
    () => makeFrame(game.gameId, game.revision, position.board, ids, orientation),
    [game.gameId, game.revision, position, ids, orientation],
  );

  const pieceList = useMemo(() => {
    const list: { id: number; sq: number; code: number }[] = [];
    for (let sq = 0; sq < 64; sq++) {
      const id = ids[sq]!;
      if (id >= 0) list.push({ id, sq, code: position.board[sq]! });
    }
    // Orden estable por id: el DOM de cada pieza no se mueve de lugar al jugar.
    return list.sort((a, b) => a.id - b.id);
  }, [ids, position]);

  /* ---------- director de animaciones ---------- */

  useLayoutEffect(() => {
    const board = boardRef.current;
    const pieces = piecesRef.current;
    const fx = fxRef.current;
    const flash = flashRef.current;
    if (!board || !pieces || !fx || !flash) return;
    const director = new Director(
      { board, pieces, fx, flash },
      { pieceSrc: (color, type) => PIECE_SRC[color][type] },
    );
    directorRef.current = director;
    return () => {
      director.destroy();
      directorRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const director = directorRef.current;
    if (!director) return;
    const drop = dropRef.current;
    dropRef.current = null;
    director.update({ frame, transition: game.transition, motion, drop });
    // El director solo reacciona a cambios de partida, de estado, de orientación o de movimiento.
  }, [game.gameId, game.revision, orientation, motion]);

  /* ---------- acciones ---------- */

  const clearPending = () => {
    setSelection(null);
    setPromotion(null);
    setHoverSq(null);
  };

  /** Intenta jugar from→to. Devuelve true si se jugó; false si hace falta elegir coronación o no es legal. */
  const attemptMove = (from: number, to: number, hint: DropHint | null): boolean => {
    const candidates = (movesByFrom.get(from) ?? NO_MOVES).filter((move) => move.to === to);
    const first = candidates[0];
    if (!first) return false;
    if (first.promotion) {
      setPromotion({ gameId: game.gameId, revision: game.revision, from, to });
      return false;
    }
    dropRef.current = hint;
    clearPending();
    onMove?.(first);
    return true;
  };

  const choosePromotion = (piece: PromotionPiece) => {
    if (!pendingPromotion) return;
    const move = (movesByFrom.get(pendingPromotion.from) ?? NO_MOVES).find(
      (candidate) => candidate.to === pendingPromotion.to && candidate.promotion === piece,
    );
    clearPending();
    if (move) onMove?.(move);
    gridRef.current?.focus();
  };

  const cancelPromotion = () => {
    setPromotion(null);
    gridRef.current?.focus();
  };

  /** Seleccionar una pieza propia o jugar hacia un destino (clic, toque o teclado). */
  const activate = (sq: number) => {
    if (!playable) return;
    if (selectedSq !== null && targets.has(sq)) {
      attemptMove(selectedSq, sq, null);
      return;
    }
    const code = position.board[sq]!;
    if (code !== 0 && colorOfCode(code) === position.turn) {
      setSelection(selectedSq === sq ? null : { gameId: game.gameId, revision: game.revision, sq });
    } else {
      setSelection(null);
    }
  };

  /* ---------- puntero (clic, toque y arrastre) ---------- */

  const squareFromPoint = (clientX: number, clientY: number): number | null => {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    if (x < 0 || x >= 1 || y < 0 || y >= 1) return null;
    return squareAt(Math.floor(x * 8), Math.floor(y * 8));
  };

  const pieceElement = (id: number): HTMLElement | null =>
    piecesRef.current?.querySelector<HTMLElement>(`.piece[data-id="${id}"]`) ?? null;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || pendingPromotion) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const sq = squareFromPoint(event.clientX, event.clientY);
    if (sq === null) return;
    directorRef.current?.finish();
    dropRef.current = null;
    setFocusSq(sq);
    if (!playable) return;

    if (selectedSq !== null && targets.has(sq)) {
      attemptMove(selectedSq, sq, null);
      return;
    }
    const code = position.board[sq]!;
    if (code === 0 || colorOfCode(code) !== position.turn) {
      setSelection(null);
      return;
    }
    setSelection({ gameId: game.gameId, revision: game.revision, sq });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      from: sq,
      id: ids[sq]!,
      startX: event.clientX,
      startY: event.clientY,
      element: pieceElement(ids[sq]!),
      wasSelected: selectedSq === sq,
      threshold: event.pointerType === 'mouse' ? 5 : 9,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < drag.threshold) return;
      drag.moved = true;
      drag.element?.setAttribute('data-dragging', '');
    }
    if (drag.element) drag.element.style.translate = `${dx}px ${dy}px`;
    const over = squareFromPoint(event.clientX, event.clientY);
    const next = over !== null && targets.has(over) ? over : null;
    setHoverSq((current) => (current === next ? current : next));
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    setHoverSq(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const { element } = drag;
    element?.removeAttribute('data-dragging');

    if (!drag.moved) {
      if (!cancelled && drag.wasSelected) setSelection(null);
      return;
    }

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const over = cancelled ? null : squareFromPoint(event.clientX, event.clientY);
    let played = false;

    if (over !== null && over !== drag.from && targets.has(over) && gridRef.current) {
      // Desplazamiento de la pieza respecto al centro de su casilla de destino: el director
      // la asienta desde ahí, sin que dé un salto.
      const rect = gridRef.current.getBoundingClientRect();
      const cell = rect.width / 8;
      const hint: DropHint = {
        id: drag.id,
        dx: (fileOf(drag.from) - fileOf(over)) * cell + dx,
        dy: (rowOf(drag.from) - rowOf(over)) * cell + dy,
      };
      if (element) element.style.translate = `${hint.dx}px ${hint.dy}px`;
      played = attemptMove(drag.from, over, hint);
    }

    if (!played && element) {
      // Ilegal, fuera del tablero o coronación pendiente: la pieza vuelve a su casilla.
      element.style.translate = '';
      element.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }], {
        duration: 200,
        easing: EASE_OUT,
      });
    }
  };

  /* ---------- teclado ---------- */

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || pendingPromotion) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let file = fileOf(focusSq);
    let row = rowOf(focusSq);
    switch (event.key) {
      case 'ArrowLeft':
        file = Math.max(0, file - 1);
        break;
      case 'ArrowRight':
        file = Math.min(7, file + 1);
        break;
      case 'ArrowUp':
        row = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        row = Math.min(7, row + 1);
        break;
      case 'Home':
        file = 0;
        break;
      case 'End':
        file = 7;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        directorRef.current?.finish();
        activate(focusSq);
        return;
      case 'Escape':
        if (selectedSq !== null) {
          event.preventDefault();
          event.stopPropagation();
          setSelection(null);
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    setFocusSq(squareAt(file, row));
  };

  /* ---------- render ---------- */

  const cellId = (sq: number) => `${uid}-${squareName(sq)}`;

  const rows = [];
  for (let row = 0; row < 8; row++) {
    const cells = [];
    for (let file = 0; file < 8; file++) {
      const sq = squareAt(file, row);
      const code = position.board[sq]!;
      const own = playable && code !== 0 && colorOfCode(code) === position.turn;
      const isTarget = targets.has(sq);
      const label = [
        squareName(sq),
        code === 0 ? es.a11y.empty : describePiece(colorOfCode(code), typeOfCode(code)),
        sq === selectedSq ? es.a11y.selected : '',
        isTarget ? es.a11y.legalTarget : '',
      ]
        .filter(Boolean)
        .join(', ');
      cells.push(
        <div
          key={sq}
          id={cellId(sq)}
          role="gridcell"
          className="sq"
          aria-label={label}
          aria-selected={sq === selectedSq}
          data-tone={isLightSquare(sq) ? 'light' : 'dark'}
          data-own={flag(own)}
          data-last={flag(lastMove !== null && (lastMove.from === sq || lastMove.to === sq))}
          data-sel={flag(sq === selectedSq)}
          data-tgt={flag(isTarget && !captures.has(sq))}
          data-cap={flag(captures.has(sq))}
          data-chk={flag(sq === checkSq)}
          data-hov={flag(sq === hoverSq)}
          data-foc={flag(interactive && sq === focusSq)}
        />,
      );
    }
    rows.push(
      <div key={row} role="row" className="board-row">
        {cells}
      </div>,
    );
  }

  return (
    <div
      ref={boardRef}
      className="board"
      data-motion={motion}
      style={{ '--impact-delay': `${impactDelay}ms` } as CSSProperties}
    >
      <BoardFrame />

      <div
        ref={gridRef}
        className="board-layer board-grid"
        role={interactive ? 'grid' : undefined}
        aria-label={interactive ? es.a11y.board : undefined}
        aria-describedby={interactive ? `${uid}-help` : undefined}
        aria-activedescendant={interactive ? cellId(focusSq) : undefined}
        aria-readonly={interactive ? !playable : undefined}
        tabIndex={interactive ? 0 : undefined}
        data-interactive={flag(interactive)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
        onKeyDown={onKeyDown}
        onContextMenu={(event) => event.preventDefault()}
      >
        {rows}
      </div>

      <div ref={piecesRef} className="board-layer pieces" aria-hidden="true">
        {pieceList.map(({ id, sq, code }) => (
          <PieceView
            key={id}
            id={id}
            sq={sq}
            code={code}
            orientation={orientation}
            mated={sq === matedSq}
            toppleDelay={sq === matedSq ? toppleDelay : 0}
          />
        ))}
      </div>

      <div ref={fxRef} className="board-layer fx" aria-hidden="true" />
      <div ref={flashRef} className="board-layer board-flash" aria-hidden="true" />

      {banner && (
        <div className="board-layer banner-layer" aria-hidden="true">
          <div
            key={`${game.gameId}:${game.revision}`}
            className="banner"
            data-kind={banner.kind}
            style={{ '--banner-delay': `${banner.delay}ms` } as CSSProperties}
          >
            <div className="banner__band">{es.banners[banner.kind]}</div>
          </div>
        </div>
      )}

      {pendingPromotion && (
        <PromotionChooser color={position.turn} onPick={choosePromotion} onCancel={cancelPromotion} />
      )}

      {interactive && (
        <p id={`${uid}-help`} className="visually-hidden">
          {es.a11y.boardHelp}
        </p>
      )}
    </div>
  );
}
