/** Íconos de trazo (24 × 24). Decorativos: el botón que los usa lleva su propio nombre accesible. */
const PATHS = {
  first: 'M6 5v14M18 6l-8 6 8 6',
  back: 'M15 5l-7 7 7 7',
  forward: 'M9 5l7 7-7 7',
  last: 'M18 5v14M6 6l8 6-8 6',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  flag: 'M5 21V4M5 4h12l-2.5 4L17 12H5',
  draw: 'M5 9h14M5 15h14',
  plus: 'M12 5v14M5 12h14',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M9 14v6',
  home: 'M4 11l8-7 8 7M6 10v10h12V10',
  rotate: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5',
  close: 'M6 6l12 12M18 6 6 18',
  play: 'M8 5v14l11-7z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  fullscreen: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  exitFullscreen: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  book: 'M5 5.5A1.5 1.5 0 0 1 6.5 4H19v13H6.5A1.5 1.5 0 0 0 5 18.5v-13zM5 18.5A1.5 1.5 0 0 0 6.5 20H19M9 8h6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2h5.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.5v.5',
  trash: 'M5 7h14M10 7V4h4v3M7 7l.8 13h8.4L17 7M10 11v6M14 11v6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
