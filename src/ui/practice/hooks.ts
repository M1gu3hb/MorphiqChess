import { useSyncExternalStore } from 'react';
import type { BotsState, BotsStore } from '../../bots/records';

/** Suscribe un componente a los resultados y a la partida en curso del modo Práctica. */
export const useBots = (store: BotsStore): BotsState => useSyncExternalStore(store.subscribe, store.getSnapshot);
