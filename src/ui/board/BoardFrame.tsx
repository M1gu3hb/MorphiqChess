import logo from '../../assets/brand/logo-morphiq.webp';
import { CELL, GRID, VIEW_SIZE } from './geometry';

/**
 * Esquinas «M» del diseño original, vectorizadas del tablero que diste. La esquina superior
 * izquierda se refleja para las inferiores; la superior derecha tiene su propia forma.
 */
const TL_M = '106,8.8 84,9 49.8,43.6 14.5,8.8 9,8.9 9,113.8 25,97.5 25,42.3 50,66.6 106.2,9.6';
const TL_TRI = '36.3,67.7 36.2,83.3 43.9,75.2';
const TR_V = '1147.2,9 1203.2,66.2 1205.9,64.6 1241.8,28.9 1245.2,24.2 1245.1,9.2 1244.4,8.5 1239.1,8.6 1204,43.5 1169.5,8.9';
const TR_BAR = '1244.8,35.2 1229.5,49.6 1229,97.5 1244.8,113.8';
const TR_TRI = '1218.1,67.6 1210.4,75.4 1218,83.2';

const FILE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
const LOGO_HEIGHT = 52;
const LOGO_WIDTH = LOGO_HEIGHT * (900 / 267);

const darkSquares: { key: string; x: number; y: number }[] = [];
for (let row = 0; row < 8; row++) {
  for (let file = 0; file < 8; file++) {
    if ((file + row) % 2 === 1) darkSquares.push({ key: `${file}${row}`, x: GRID.x + file * CELL, y: GRID.y + row * CELL });
  }
}

/**
 * Marco, casillas, esquinas, coordenadas y logo: todo estático, un solo SVG. En la vista de Azules
 * solo cambian las coordenadas (H…A de izquierda a derecha y 1…8 de arriba abajo).
 */
export function BoardFrame({ flipped = false }: { readonly flipped?: boolean }) {
  return (
    <svg
      className="board-frame"
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect className="bf-margin" width={VIEW_SIZE} height={VIEW_SIZE} />
      <g shapeRendering="crispEdges">
        <rect className="bf-light" x={GRID.x} y={GRID.y} width={GRID.size} height={GRID.size} />
        {darkSquares.map((s) => (
          <rect key={s.key} className="bf-dark" x={s.x} y={s.y} width={CELL} height={CELL} />
        ))}
      </g>
      <rect className="bf-frame" x={GRID.x - 3.5} y={GRID.y - 3.5} width={GRID.size + 7} height={GRID.size + 7} />

      <g className="bf-brackets">
        <polygon points={TL_M} />
        <polygon points={TL_TRI} />
        <g transform={`translate(0 ${VIEW_SIZE}) scale(1 -1)`}>
          <polygon points={TL_M} />
          <polygon points={TL_TRI} />
        </g>
        <polygon points={TR_V} />
        <polygon points={TR_BAR} />
        <polygon points={TR_TRI} />
        <g transform={`translate(${VIEW_SIZE} ${VIEW_SIZE}) rotate(180)`}>
          <polygon points={TL_M} />
          <polygon points={TL_TRI} />
        </g>
      </g>

      <image
        href={logo}
        x={(VIEW_SIZE - LOGO_WIDTH) / 2}
        y={5}
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        preserveAspectRatio="xMidYMid meet"
      />

      <g className="bf-coords">
        {Array.from({ length: 8 }, (_, row) => (
          <text key={`r${row}`} x={38.5} y={GRID.y + (row + 0.5) * CELL} dy="0.35em">
            {flipped ? row + 1 : 8 - row}
          </text>
        ))}
        {FILE_LABELS.map((_, file) => (
          <text key={file} x={GRID.x + (file + 0.5) * CELL} y={1212} dy="0.35em">
            {FILE_LABELS[flipped ? 7 - file : file]}
          </text>
        ))}
      </g>
    </svg>
  );
}
