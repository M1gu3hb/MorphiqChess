import { useSyncExternalStore } from 'react';
import type { GameSnapshot, GameStore, Settings, SettingsStore } from '../game';

/** Suscribe un componente al estado de la partida. */
export const useGame = (store: GameStore): GameSnapshot => useSyncExternalStore(store.subscribe, store.getSnapshot);

/** Suscribe un componente a los ajustes de la persona. */
export const useSettings = (store: SettingsStore): Settings =>
  useSyncExternalStore(store.subscribe, store.getSnapshot);
