# Arquitectura de MorphiqChess

El proyecto está pensado para crecer: cada capa depende solo de las de abajo y se puede probar o
reemplazar sin tocar las de arriba.

```
ui  →  anim  →  game  →  engine
 ↑                          (TypeScript puro, sin DOM ni React)
 └── i18n, styles, assets
```

## 1. `engine`: las reglas

TypeScript puro, sin DOM. Es la única fuente de verdad del ajedrez.

- Tablero en un `Int8Array` de 64 casillas (a1 = 0): positivo = Blancas, negativo = Azules, 1–6 = P N B R Q K.
- Colores `'w'` (Blancas) y `'b'` (Azules).
- Generación de jugadas legales, enroque, captura al paso y coronación.
- Notación SAN canónica (letras inglesas) y su localización a español (`localizeSan`: K→R, Q→D, R→T, B→A, N→C).
- FEN de ida y vuelta.
- Resultados: jaque mate, ahogado, material insuficiente, 75 movimientos y quíntuple repetición
  (automáticos); rendición, acuerdo, triple repetición y 50 movimientos (manuales).

**Pruebas:** `perft` contra conteos de nodos conocidos y una comparación jugada por jugada contra
`chess.js` (solo dependencia de desarrollo) en partidas aleatorias.

## 2. `game`: la partida

Estado inmutable de una partida, sin saber nada de React ni del DOM.

- `GameSnapshot`: jugadas (`Ply`), cursor del historial, claves de repetición, resultado y la
  **transición** que llevó al estado actual (`none`, `reset`, `forward`, `backward`, `jump`).
- **Ids estables de pieza:** cada pieza conserva su identidad durante toda la partida (incluso al
  retroceder y revivir una captura). Gracias a eso la interfaz sabe qué pieza se movió y cuál se capturó.
- `GameStore`: guardado automático en `localStorage`, suscripción para `useSyncExternalStore` y las
  acciones (`play`, `goTo`, `undo`, `resumeFromCursor`, `resign`, `agreeDraw`, `claimDraw`, `newGame`).
- **Guardado versionado** (`morphiqchess:game:v1`): se guardan jugadas en coordenadas y se **revalidan
  reproduciéndolas** al cargar, así una partida dañada o manipulada nunca entra al juego.
- `SettingsStore`: preferencias (giro de piezas y animaciones completas o reducidas). El movimiento
  reducido arranca con `prefers-reduced-motion`.
- `orientationAt`: hacia quién miran las piezas (0° Blancas, 180° Azules); con la partida terminada se
  quedan mirando al ganador.

## 3. `anim`: las animaciones

Idea central: **React pinta siempre el estado final** y el `Director` «reproduce hacia ese estado»
con la Web Animations API. Nunca hay estados intermedios que se desincronicen y cancelar una animación
equivale a saltar al final, por eso se puede jugar o navegar muy rápido sin que el tablero quede mal.

Estructura de cada pieza en el DOM:

```
.piece            posición (en porcentajes de su propio tamaño) y capa
  .piece-shadow   sombra
  .piece-lift     salto y escala en pantalla (el caballo salta)
    .piece-face   giro sobre su eje: siempre en sentido horario, 0→180 y 180→360
      img.piece-img
```

- Movimiento: deslizamiento con duración según la distancia, con estela; el caballo salta.
- Captura: la pieza capturada se rompe en fragmentos con chispas y un anillo.
- Jaque y jaque mate: anillos, destello, sacudida del tablero y caída del rey (el aviso aparece cuando
  llega la pieza). Final de partida: avisos de ahogado, tablas y rendición.
- Coronación: la pieza vieja se desliza y la nueva emerge. Enroque: la torre se mueve con un pequeño retraso.
- Giro: se propaga como una ola desde la pieza que se movió.
- Movimiento reducido: solo fundidos cortos, sin giros ni efectos grandes.
- Todos los tiempos están en `timing.ts`.

## 4. `ui`: la interfaz

- **Tablero:** un marco SVG con tu diseño medido a escala (el tablero es un contenedor CSS, así `--cell`
  es una casilla en cualquier tamaño), una rejilla HTML transparente con `role="grid"` que recibe los
  eventos, y encima la capa de piezas y la de efectos.
- **Entrada:** clic y clic, arrastre (con umbral para no confundirlo con un toque), pantalla táctil y
  teclado (flechas, Enter o espacio, Esc). El foco virtual usa `aria-activedescendant`.
- **Panel:** estado del turno, flechas de historial, capturas, lista de jugadas y acciones.
- **Diálogos:** el elemento nativo `<dialog>` (foco atrapado, Esc, foco de vuelta a quien lo abrió).
- **Navegación:** `#/partida` con `history.pushState`; no necesita reescrituras en el servidor.
- **Accesibilidad:** cada casilla tiene su etiqueta, una región `aria-live` anuncia cada jugada y el
  foco pasa al título al cambiar de pantalla.
- **Textos:** todos en `src/i18n/es.ts`; agregar un idioma es crear un archivo con la misma forma.

## 5. Estilos

CSS por área en `src/styles/`. Los colores, radios y duraciones de la marca viven en `tokens.css`:
cambiar la marca es cambiar ese archivo. Sin gradientes ni efectos de cristal.

## 6. Compilación y despliegue

- Vite + React + TypeScript estricto. `npm run build` revisa los tipos y compila.
- `tools/site-meta.ts` agrega canonical, Open Graph con imagen absoluta, `robots.txt` y `sitemap.xml`
  según `SITE_URL` o el dominio de producción de Vercel, sin escribir ninguna URL en el código.
- `vercel.json` define la CSP estricta (todo es del mismo origen, sin `unsafe-inline`), las demás
  cabeceras de seguridad y la caché.
- La integración continua (`.github/workflows/ci.yml`) corre tipos, pruebas y compilación en cada cambio.

## Cómo extenderlo

| Quiero…                         | Dónde tocar                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Otro idioma                     | Copiar `src/i18n/es.ts` y elegir el idioma al arrancar                                   |
| Nuevas piezas o tablero         | Reemplazar `src/assets/pieces/*` y el marco en `ui/board/BoardFrame.tsx`; ver `tokens.css`  |
| Jugar contra la computadora     | Nueva capa que llame a `legalMovesOf` y juegue con `GameStore.play`; no toca la interfaz |
| Partida en línea                | Reemplazar `GameStore` por uno que sincronice jugadas (el resto solo lee `GameSnapshot`) |
| Relojes                         | Estado aparte en `game/` y un componente en `ui/panel/`                                  |
| Exportar o importar partidas    | PGN a partir de `Ply.san` y `serializeGame`                                              |
