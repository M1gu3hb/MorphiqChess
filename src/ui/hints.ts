/**
 * Avisos de una sola vez (p. ej. el cajón lateral que «asoma» para que se sepa que está ahí).
 * Todo va protegido: el almacenamiento puede no existir y entonces el aviso se repite, sin más.
 */
const KEY = 'morphiqchess:hints:v1';

export type HintName = 'rail';

function read(): Partial<Record<HintName, boolean>> {
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY);
    const data: unknown = raw ? JSON.parse(raw) : {};
    return typeof data === 'object' && data !== null ? (data as Partial<Record<HintName, boolean>>) : {};
  } catch {
    return {};
  }
}

export const hintSeen = (name: HintName): boolean => read()[name] === true;

export function markHintSeen(name: HintName): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [name]: true }));
  } catch {
    /* sin almacenamiento */
  }
}
