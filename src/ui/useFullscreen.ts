import { useCallback, useEffect, useState } from 'react';

/** Safari antiguo todavía usa el prefijo webkit. */
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

export function fullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  const root = document.documentElement as FullscreenElement;
  const enabled = document.fullscreenEnabled || doc.webkitFullscreenEnabled === true;
  return enabled && (typeof root.requestFullscreen === 'function' || typeof root.webkitRequestFullscreen === 'function');
}

/** El iPhone no permite pantalla completa en páginas web: solo se logra agregándola a la pantalla de inicio. */
export const isIPhone = (): boolean => typeof navigator !== 'undefined' && /iPhone|iPod/.test(navigator.userAgent);

export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.fullscreenElement ?? (document as FullscreenDocument).webkitFullscreenElement);
}

/** Debe llamarse desde un toque o clic: el navegador no deja entrar a pantalla completa de otra forma. */
export async function enterFullscreen(): Promise<void> {
  if (!fullscreenSupported() || isFullscreen()) return;
  const root = document.documentElement as FullscreenElement;
  try {
    if (root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' });
    else await root.webkitRequestFullscreen?.();
  } catch {
    /* el navegador lo rechazó (sin gesto o bloqueado): se juega igual, solo que con barras */
  }
}

export async function exitFullscreen(): Promise<void> {
  if (!isFullscreen()) return;
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else await (document as FullscreenDocument).webkitExitFullscreen?.();
  } catch {
    /* ya había salido */
  }
}

export interface FullscreenControl {
  readonly supported: boolean;
  readonly active: boolean;
  readonly toggle: () => void;
}

export function useFullscreen(): FullscreenControl {
  const [active, setActive] = useState(isFullscreen);

  useEffect(() => {
    const sync = () => setActive(isFullscreen());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggle = useCallback(() => {
    void (isFullscreen() ? exitFullscreen() : enterFullscreen());
  }, []);

  return { supported: fullscreenSupported(), active, toggle };
}
