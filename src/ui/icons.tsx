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
