# MorphiqChess

Ajedrez con el tablero y las piezas de Morphiq, en tres modos:

- **Jugar de a dos** en un mismo dispositivo: en cada turno las piezas giran 180° para quedar derechas
  frente a quien juega.
- **Entrenamiento** de aperturas y defensas: lecciones paso a paso y práctica con repetición espaciada.
- **Práctica** contra doce rivales, de menor a mayor Elo, para jugar contra alguien de tu nivel.

**Jugar:** https://morphiqchess.vercel.app

Un proyecto de Astral Morphiq Systems.

## Qué incluye

### Jugar de a dos

- Reglas completas: enroque, captura al paso, coronación (con selector), jaque, jaque mate, ahogado,
  material insuficiente, repetición y regla de los 50 movimientos (se reclaman desde «Tablas»).
- Animaciones: giro de las piezas en su eje, desplazamiento real de cada pieza (el caballo salta),
  captura con fragmentos, jaque, jaque mate (el rey cae), coronación, enroque, y avisos de final de
  partida (ahogado, tablas, rendición).
- **Pantalla de juego inmersiva:** solo el tablero, una franja pegada a cada jugador (turno, piezas
  capturadas y ventaja) y nada que se desplace. En el móvil entra a pantalla completa y la pantalla no
  se apaga mientras juegas (en iPhone: «Añadir a pantalla de inicio»).
- **Cajón lateral:** las herramientas están en el borde derecho, entre los dos jugadores. Se abren con un
  toque al asa o deslizándola con el dedo (o el ratón); el tablero se encoge lo justo para seguir entero
  a la vista. Dentro: una guía para deslizar por las jugadas, inicio, anterior, siguiente, final,
  deshacer, pantalla completa y menú (lista de jugadas, tablas, rendirse, nueva partida, ajustes).
- Revisar cualquier jugada anterior con la animación hacia atrás y hacia delante, sin que el tablero
  se mueva de lugar; «Retomar aquí» continúa la partida desde esa jugada.
- Deshacer, rendirse, proponer tablas y empezar una partida nueva.
- La partida se guarda sola en el dispositivo y se puede continuar al volver.
- Juego con ratón (clic o arrastre), con el dedo y solo con teclado.
- Español (notación R, D, T, A, C) y diseño para móvil, tableta y escritorio, en vertical y horizontal.

### Entrenamiento de aperturas

19 temas (8 aperturas, 7 defensas y 4 de fundamentos) con 18 lecciones en español, 68 pasos en total.

- **Aprender:** clase paso a paso con un profesor que «escribe» el texto en globos, botón «Siguiente»,
  jugadas en el tablero con pista progresiva (casilla de origen, destino y, al final, la jugada) y
  avance guardado.
- **Practicar** (las 8 aperturas y 7 defensas; los fundamentos son solo lecciones): el bot juega el otro
  bando y tú respondes con la jugada de la apertura, en **1 619 variantes**, con blancas (Italiana, Ruy
  López, Gambito Viena, Gambito de Dama, Inglesa, Londres, Ataque India de Rey y Catalana) y **con azules**
  (Siciliana, Najdorf, Caro-Kann, Francesa, India de Rey, Nimzo-India y Grünfeld). Con azules el bot abre
  y el tablero se ve girado. Si fallas, la posición vuelve pronto; si aciertas, tarda más (repetición
  espaciada).
- **Dominio:** porcentaje por apertura (100 % = dominada y al día), con contadores de nuevas, por repasar,
  en curso y dominadas. Todo se guarda en el dispositivo.
- El contenido sale de tres proyectos con licencia abierta (KarpaChess y FreeChessTrainer, MIT; la base de
  nombres de aperturas de Lichess, CC0); los avisos están en [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)
  y dentro de la app, en «Entrenamiento → Créditos».

### Práctica contra rivales

- **Doce rivales, de menor a mayor Elo:** cada pieza de Morphiq (peón, caballo, alfil, torre, dama y rey, blanca
  y azul) es un personaje. Del Peón Aprendiz (Elo 400) al Rey Supremo (3000+), agrupados en principiantes,
  intermedios, avanzados, expertos y maestros. Eliges rival y bando (blancas, azules o al azar).
- **La misma pantalla inmersiva**, con una pista (la mejor jugada según el motor), deshacer (tu última jugada y la
  respuesta del rival), tablas (el rival decide si las acepta según cómo vea la partida; no antes de las
  20 jugadas), rendirse y revancha. El tablero se ve girado cuando juegas con azules.
- **Tus resultados** contra cada rival (victorias, empates, derrotas), el siguiente reto y «Partida en curso»
  para retomar lo que dejaste a medias; todo en el dispositivo.
- **El Elo es aproximado** y está en la escala de Stockfish: sirve para ordenar a los rivales, no es un Elo FIDE.
  Cómo se midió, con qué datos y sus límites: [docs/practica/calibracion.md](./docs/practica/calibracion.md).
- **El motor** es Stockfish.js 19 (GPL-3.0), sin modificar, en un Web Worker del propio dispositivo: ninguna partida
  sale a un servidor. Se descarga (≈1.9 MB, luego en caché) al entrar a Práctica, no antes.

## Desarrollo

Requiere Node 22 (hay un `.nvmrc`).

```bash
npm install
npm run dev          # servidor de desarrollo
npm run verify       # tipos + pruebas + compilación (lo mismo que corre la integración continua)
```

| Comando              | Qué hace                                                   |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | Servidor de desarrollo con recarga en caliente             |
| `npm run build`      | Revisa los tipos y compila a `dist/`                       |
| `npm run preview`    | Sirve `dist/` para probar la compilación                   |
| `npm run typecheck`  | Solo revisa los tipos (TypeScript estricto)                |
| `npm test`           | Pruebas unitarias y de integración (Vitest)                |
| `npm run test:watch` | Pruebas en modo observador                                 |
| `npm run training:convert` | Vuelve a generar los datos de entrenamiento desde los repos originales (ver `tools/training/README.md`) |
| `npm run bots:duel` | Partidas entre dos rivales para medir su fuerza (ver `docs/practica/calibracion.md`) |
| `npm run bots:fit`  | Calcula el Elo de cada rival a partir de esos resultados                                 |

## Estructura

```
src/
  engine/   Reglas del ajedrez en TypeScript puro (sin DOM): jugadas legales, SAN, FEN, resultados.
  game/     Estado de la partida: historial, ids estables de pieza, deshacer, guardado, ajustes.
  anim/     Director de animaciones (Web Animations API) y su temporización.
  training/ Lógica del entrenamiento (sin DOM): datos de aperturas, grafo de posiciones, repetición
            espaciada, dominio, práctica y lecciones.
  bots/     Lógica de los rivales (sin DOM): protocolo UCI, fuerza de cada rival, el rival que
            juega en el tablero, resultados y partida en curso.
  ui/       Componentes de React: tablero, franjas de jugador, cajón lateral, pantallas y diálogos;
            `ui/training/` es el entrenamiento y `ui/practice/` la práctica contra rivales (cada uno
            se descarga aparte, solo al abrirlo).
  styles/   CSS por área, con los colores y medidas de la marca en tokens.css.
  i18n/     Todos los textos de la interfaz (es.ts).
  assets/   Logo y piezas de Morphiq (WebP).
tools/      Utilidades: metadatos del sitio, conversor de datos de entrenamiento y pruebas de rivales.
public/     Íconos, manifiesto, imagen para compartir, página 404 y el motor Stockfish.js (engine/).
docs/       Notas de investigación del entrenamiento y la calibración del Elo de los rivales.
```

La arquitectura y las decisiones de diseño están en [ARCHITECTURE.md](./ARCHITECTURE.md);
lo que sigue está en [ROADMAP.md](./ROADMAP.md).

## Calidad

- El motor se prueba con **perft** (conteos de nodos conocidos) y con una **comparación jugada por
  jugada contra chess.js**, que solo existe como dependencia de desarrollo.
- Estricto de punta a punta: TypeScript con `strict`, `noUncheckedIndexedAccess` y sin variables sin usar.
- Accesibilidad: tablero como rejilla ARIA operable con teclado, avisos para lectores de pantalla,
  diálogos nativos con foco controlado, contraste AA y respeto de `prefers-reduced-motion`.

## Despliegue

El proyecto está conectado a Vercel: cada `push` a `main` publica en producción y cada rama genera
una vista previa. La configuración está en [`vercel.json`](./vercel.json): cabeceras de seguridad con
una política CSP estricta (sin scripts ni estilos en línea; solo permite compilar WebAssembly y un Web Worker
del propio sitio, para el motor de los rivales) y caché de un año para los archivos con hash y para el motor.

La URL pública (canonical, Open Graph, `robots.txt` y `sitemap.xml`) no está escrita en el código: se
toma de `SITE_URL` o, en Vercel, del dominio de producción del proyecto. Al conectar un dominio propio
basta con volver a desplegar.

## Marca y licencia

El logo, el tablero, las piezas y el código de la aplicación son de Morphiq. Todos los derechos reservados; no se
concede licencia de uso, copia ni distribución del código ni de los diseños sin autorización.

Lo siguiente **no** es de Morphiq y conserva su propia licencia (texto completo y detalles en
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)):

- Las lecciones y variantes del modo Entrenamiento: KarpaChess (© 2026 Mourad Ghafiri) y FreeChessTrainer
  (© 2025 FreeChessTrainer), ambos con licencia MIT, y la base de nombres de aperturas de Lichess (CC0).
- **El motor Stockfish.js de `public/engine/`**, con licencia **GPL-3.0** (© 2026 Chess.com, LLC y los
  colaboradores de Stockfish). Se distribuye sin modificar, con su licencia y el enlace a su código fuente, y la
  aplicación solo habla con él por el protocolo UCI desde otro programa (un Web Worker). La GPL-3.0 rige para ese
  motor, no para el resto del proyecto.
