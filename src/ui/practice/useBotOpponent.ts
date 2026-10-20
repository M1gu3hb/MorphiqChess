import { useEffect, useState } from 'react';
import { EngineError, UciEngine, workerTransport } from '../../bots/engine';
import { BotOpponent, type OpponentStatus } from '../../bots/opponent';
import type { Persona } from '../../bots/personas';
import { opposite, type Color } from '../../engine';
import type { GameStore } from '../../game';

export interface BotRuntime {
  /** El motor en uso (para pedir pistas y tablas), o `null` mientras no hay. */
  readonly engine: UciEngine | null;
  readonly status: OpponentStatus;
  readonly error: Error | null;
  /** Abre un motor nuevo (si el anterior se cayó o no cargó). */
  readonly retry: () => void;
}

interface State {
  readonly engine: UciEngine | null;
  readonly status: OpponentStatus;
  readonly error: Error | null;
}

const NONE: State = { engine: null, status: 'idle', error: null };

/**
 * El rival de la partida: abre Stockfish en un Worker mientras la pantalla está abierta y lo cierra al
 * salir. `side` es el bando de la persona; el rival juega el otro. El motor se calienta enseguida para
 * que su primera respuesta no se haga esperar, y si no carga se avisa de inmediato.
 */
export function useBotOpponent(store: GameStore, persona: Persona, side: Color, enabled: boolean): BotRuntime {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>(NONE);

  useEffect(() => {
    if (!enabled) return;
    const engine = new UciEngine(() => workerTransport());
    const update = (patch: Partial<State>) =>
      setState((current) => (current.engine === engine ? { ...current, ...patch } : current));
    const opponent = new BotOpponent({
      store,
      engine,
      persona,
      side: opposite(side),
      onStatus: (status, error) => update({ status, error: error ?? null }),
    });
    setState({ engine, status: 'idle', error: null });
    opponent.start();
    engine.ready().catch((error: unknown) => {
      if (error instanceof EngineError && error.kind === 'disposed') return;
      update({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
    });
    return () => {
      opponent.stop();
      engine.dispose();
      setState(NONE);
    };
  }, [enabled, store, persona, side, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
