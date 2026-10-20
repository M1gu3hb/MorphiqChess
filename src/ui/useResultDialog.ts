import { useEffect, useState } from 'react';
import type { GameSnapshot } from '../game';

/** Pausa antes de mostrar el resultado, para que se vea primero la animación del final. */
const RESULT_DELAY_MS = { checkmate: 2300, other: 1100 } as const;

/**
 * Cuándo se muestra el resultado de la partida. Solo aparece si la partida termina aquí mismo (una
 * jugada, rendición o tablas), no al abrir una partida que ya había terminado ni al revisar jugadas.
 */
export function useResultDialog(game: GameSnapshot): readonly [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);
  const over = game.outcome !== null;
  const t = game.transition;
  const endedNow = over && ((t.type === 'forward' && t.source === 'play') || (t.type === 'none' && t.ended === true));
  const delay = game.outcome?.type === 'checkmate' ? RESULT_DELAY_MS.checkmate : RESULT_DELAY_MS.other;

  useEffect(() => {
    if (!over) {
      setOpen(false);
      return;
    }
    if (!endedNow) return;
    const timer = window.setTimeout(() => setOpen(true), delay);
    return () => window.clearTimeout(timer);
  }, [game.gameId, game.revision, over, endedNow, delay]);

  return [open, setOpen];
}
