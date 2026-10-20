import { useEffect, useMemo, useState } from 'react';
import { blocksLength, blocksToText, parseMarkup, type Block } from '../../training/markup';
import { displayMove } from './RichText';

/** Caracteres por segundo con los que «se escribe» el texto del profesor. */
export const CHARS_PER_SECOND = 90;

interface Typed {
  readonly key: string;
  readonly count: number;
}

/**
 * Cuántos caracteres del texto se han «escrito». Se reinicia solo al cambiar `key` y, con `instant`
 * (movimiento reducido o texto saltado), da el total de inmediato.
 */
function useTypewriter(total: number, key: string, instant: boolean): number {
  const [typed, setTyped] = useState<Typed>({ key, count: 0 });

  useEffect(() => {
    if (instant) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const count = Math.min(total, Math.floor(((now - start) / 1000) * CHARS_PER_SECOND));
      setTyped((current) => (current.key === key && current.count === count ? current : { key, count }));
      if (count < total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [key, total, instant]);

  if (instant) return total;
  return typed.key === key ? Math.min(typed.count, total) : 0;
}

export interface CoachText {
  readonly blocks: readonly Block[];
  readonly count: number;
  readonly total: number;
  /** ¿Ya se escribió todo? */
  readonly done: boolean;
  /** Muestra el texto completo de golpe. */
  readonly skip: () => void;
  /** El mismo texto sin formato, para lectores de pantalla. */
  readonly plain: string;
}

/** El texto de un globo y su aparición letra por letra. `key` identifica el globo: al cambiar, empieza de nuevo. */
export function useCoachText(source: string, key: string, reduced: boolean): CoachText {
  const blocks = useMemo(() => parseMarkup(source), [source]);
  const total = useMemo(() => blocksLength(blocks), [blocks]);
  const plain = useMemo(() => blocksToText(blocks, displayMove), [blocks]);
  const [skipped, setSkipped] = useState<string | null>(null);
  const count = useTypewriter(total, key, reduced || skipped === key);
  return { blocks, count, total, done: count >= total, skip: () => setSkipped(key), plain };
}
