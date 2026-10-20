# Arquitectura de MorphiqChess

El proyecto está pensado para crecer: cada capa depende solo de las de abajo y se puede probar o
reemplazar sin tocar las de arriba.

```
ui  →  anim  →  game  →  engine
 │                ↑         ↑      (TypeScript puro, sin DOM ni React)
 └──→ training ───┴─────────┘
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
- `SettingsStore`: preferencias (giro de piezas, animaciones completas o reducidas y pantalla completa
  al jugar). El movimiento reducido arranca con `prefers-reduced-motion`; la pantalla completa
  automática, con los dispositivos táctiles.
- `tallyMaterial`: piezas capturadas por cada bando y ventaja de material hasta el cursor del historial
  (por eso las franjas cambian al revisar jugadas).
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

## 4. `training`: aprender y practicar aperturas

Lógica pura (sin DOM ni React) sobre `engine` y `game`. La interfaz vive en `ui/training/` y se
descarga aparte (`import()` en `App.tsx`, dentro de un `ErrorBoundary` y un `Suspense`): quien solo
quiere jugar una partida no baja lecciones, variantes ni estilos del entrenamiento, y si esa descarga
falla (sin conexión, o la app se actualizó) aparece una pantalla con «Recargar» e «Inicio» en lugar de
una pantalla en blanco.

- **Datos** (`src/training/data/`): `catalog.json` (19 temas: resumen, bando, lecciones y variantes),
  `lessons/*.json` (una lección por tema, con pasos para leer y para jugar) y `lines/*.json` (las
  variantes de los temas con práctica). Cada tema se carga por separado con `import()`; el menú solo
  necesita el catálogo. Los generó `tools/training` (`npm run training:convert`) a partir de los
  repositorios originales (MIT, ver `THIRD_PARTY_NOTICES.md`) comprobando cada jugada con el motor;
  `data.test.ts` las vuelve a comprobar en cada ejecución de las pruebas.
- **Marcado** (`markup.ts`): el texto de las lecciones (`**negrita**`, `*cursiva*`, listas, citas y
  `{{Nf3}}` para jugadas) se interpreta a bloques de datos, nunca HTML en crudo, y se «escribe» letra a letra.
- **Grafo** (`graph.ts`): las variantes de una apertura se funden en un grafo de posiciones. La clave
  de una posición son las piezas, el turno y los enroques, no el camino: dos órdenes de jugadas que
  llegan a lo mismo (una transposición) comparten progreso. Una **tarjeta** es una posición donde le
  toca mover a la persona; `acceptedMoves` da todas las jugadas buenas, no solo una.
- **Progreso** (`progress.ts`): repetición espaciada por cajas (Leitner 0 a 5; vuelve a tocar a los 0,
  1, 3, 7, 14 y 30 días). El **dominio** es la suma de las cajas entre el máximo posible; una tarjeta
  vencida cuenta una caja menos, así que el dominio «se oxida» si no se repasa, y 100 % significa todas
  en la caja 5 y al día. Se guarda en `morphiqchess:training:v1` y se valida al leer: un guardado dañado
  nunca entra, y las tarjetas que ya no existen en la apertura se descartan.
- **Práctica** (`practice.ts`): `pickDrill` elige la posición que más falta (nueva, fallada o vencida), y
  solo si las anteriores de su camino ya están aprendidas; `planSetup` la prepara animando solo las
  últimas jugadas; el bot contesta con una de las variantes posibles (`replyChoices`); la pista sube de
  nivel (casilla de origen, destino y, al final, juega la jugada, que cuenta como fallo). Fallar una
  tarjeta se anota una sola vez por intento.
- **Lecciones** (`lesson.ts`): la posición dentro de la lección (paso y globo), avance, retroceso y barra de avance.
- **Resumen** (`overview.ts`): estadísticas y dominio del menú y de cada apertura.

**Pruebas:** unitarias para cada módulo (incluida la simulación de intentos y repasos) y una de datos que
reproduce cada lección y cada variante con el motor.

## 5. `ui`: la interfaz

- **Tablero:** un marco SVG con tu diseño medido a escala (el tablero es un contenedor CSS, así `--cell`
  es una casilla en cualquier tamaño), una rejilla HTML transparente con `role="grid"` que recibe los
  eventos, y encima la capa de piezas y la de efectos.
- **Entrada:** clic y clic, arrastre (con umbral para no confundirlo con un toque), pantalla táctil y
  teclado (flechas, Enter o espacio, Esc). El foco virtual usa `aria-activedescendant`.
- **Pantalla de juego:** ocupa toda la pantalla (`position: fixed`, `100dvh`, áreas seguras) y no se
  desplaza. Se compone de la escena (`.stage`: franja del jugador de arriba, tablero, franja del de abajo)
  y el cajón lateral (`.rail`). El tamaño del tablero sale de una sola variable (`--board-size`) y, en
  teléfono acostado, las franjas pasan a las esquinas para darle todo el alto. Al no haber nada que
  cambie de alto al revisar jugadas, el tablero no se mueve (antes la tarjeta de estado empujaba el
  tablero 70–120 px al entrar o salir de una jugada anterior).
- **Cajón lateral:** `useDrawer` guarda el avance (0 = cerrado, 1 = abierto) y lo aplica directo al
  `transform` del cajón y de la escena en cada fotograma, sin pasar por React, para que el gesto siga
  al dedo sin tirones; React solo se entera al soltar. Al abrir, la escena se encoge y se corre
  (`pushGeometry`, aparte y con pruebas) para que el tablero entero quede a la vista junto al cajón.
  Tocar el asa lo alterna, arrastrarlo lo sigue, un lanzamiento rápido lo abre o cierra por velocidad,
  tocar fuera lo cierra (sin tocar piezas) y Escape también. Cerrado, el panel es `inert`.
  La guía de jugadas (`Scrubber`) es un `role="slider"` propio con puntero y teclado.
- **Pantalla completa:** `useFullscreen` (API estándar y prefijo `webkit`) y `useWakeLock`. El navegador
  solo la concede dentro de un toque, así que se pide al empezar o continuar desde Inicio y se sale al
  volver a Inicio. En iPhone no existe para páginas web: se aprovecha como app instalada
  (`display_override` y metas `apple-mobile-web-app-*`).
- **Menú:** un diálogo con la lista de jugadas y las acciones (tablas, rendirse, nueva partida, ajustes,
  inicio). El resultado de la partida aparece solo cuando termina aquí mismo y tras la animación del final.
- **Diálogos:** el elemento nativo `<dialog>` (foco atrapado, Esc, foco de vuelta a quien lo abrió).
- **Navegación:** rutas en el hash con `history.pushState` (`#/partida`, `#/entrenamiento`,
  `#/entrenamiento/<apertura>`, `…/aprender/<lección>` y `…/practicar[/inicio]`), así no hace falta
  reescribir nada en el servidor. `ui/route.ts` las interpreta (una dirección inválida lleva a Inicio).
  Cada entrada del historial guarda de dónde venía: «Volver» retrocede de verdad en el historial y, si
  la pantalla se abrió directo, reemplaza la actual en vez de apilar entradas.
- **Accesibilidad:** cada casilla tiene su etiqueta, una región `aria-live` anuncia cada jugada y el
  foco pasa al título al cambiar de pantalla.
- **Textos:** todos en `src/i18n/es.ts`; agregar un idioma es crear un archivo con la misma forma.

## 6. Estilos

CSS por área en `src/styles/`. Los colores, radios y duraciones de la marca viven en `tokens.css`:
cambiar la marca es cambiar ese archivo. Sin gradientes ni efectos de cristal.

## 7. Compilación y despliegue

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
| Relojes                         | Estado aparte en `game/` y mostrarlos en las franjas de `ui/stage/PlayerStrip.tsx`       |
| Exportar o importar partidas    | PGN a partir de `Ply.san` y `serializeGame`                                              |
| Una lección nueva               | Un `lessons/<id>.json` declarado en `tools/training/courses.ts`; `data.test.ts` la valida con el motor |
| Practicar otra apertura         | Sumar sus variantes (mismo formato que `data/lines/*.json`) y declararlas en `tools/training/courses.ts` |
| Practicar con azules            | El grafo ya trae `userSide`; faltan variantes de ese bando y revisar hacia quién miran las piezas en `PracticeScreen` |
