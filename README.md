# MorphiqChess

Ajedrez para **dos jugadores en un mismo dispositivo**, con el tablero y las piezas de Morphiq.
En cada turno las piezas giran 180° sobre su propio eje para quedar derechas frente a quien juega.

**Jugar:** https://morphiqchess.vercel.app

Un proyecto de Astral Morphiq Systems.

## Qué incluye

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
- **Entrenamiento de aperturas** (botón «Entrenamiento» en Inicio): 19 temas (8 aperturas, 7 defensas y
  4 de fundamentos) y 18 lecciones en español, 68 pasos en total.
  - **Aprender:** clase paso a paso con un profesor que «escribe» el texto en globos, botón «Siguiente»,
    jugadas en el tablero con pista progresiva (casilla de origen, destino y, al final, la jugada) y
    avance guardado.
  - **Practicar** (Italiana, Ruy López y Gambito Viena, con blancas): el bot juega el otro bando y tú
    respondes con la jugada de la apertura, en 127 variantes. Si fallas, la posición vuelve pronto;
    si aciertas, tarda más (repetición espaciada).
  - **Dominio:** porcentaje por apertura (100 % = dominada y al día), con contadores de nuevas, por repasar,
    en curso y dominadas. Todo se guarda en el dispositivo.
  - El contenido sale de dos proyectos MIT (KarpaChess y FreeChessTrainer); los avisos de licencia están
    en [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) y dentro de la app, en «Entrenamiento → Créditos».

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

## Estructura

```
src/
  engine/   Reglas del ajedrez en TypeScript puro (sin DOM): jugadas legales, SAN, FEN, resultados.
  game/     Estado de la partida: historial, ids estables de pieza, deshacer, guardado, ajustes.
  anim/     Director de animaciones (Web Animations API) y su temporización.
  training/ Lógica del entrenamiento (sin DOM): datos de aperturas, grafo de posiciones, repetición
            espaciada, dominio, práctica y lecciones.
  ui/       Componentes de React: tablero, franjas de jugador, cajón lateral, pantallas y diálogos;
            `ui/training/` es el modo entrenamiento (se descarga aparte, solo al abrirlo).
  styles/   CSS por área, con los colores y medidas de la marca en tokens.css.
  i18n/     Todos los textos de la interfaz (es.ts).
  assets/   Logo y piezas de Morphiq (WebP).
tools/      Utilidades de compilación (metadatos del sitio) y el conversor de datos de entrenamiento.
public/     Íconos, manifiesto, imagen para compartir y página 404.
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
una política CSP estricta (sin scripts ni estilos en línea) y caché de un año para los archivos con hash.

La URL pública (canonical, Open Graph, `robots.txt` y `sitemap.xml`) no está escrita en el código: se
toma de `SITE_URL` o, en Vercel, del dominio de producción del proyecto. Al conectar un dominio propio
basta con volver a desplegar.

## Marca y licencia

El logo, el tablero y las piezas son de Morphiq. Todos los derechos reservados; no se concede licencia
de uso, copia ni distribución del código ni de los diseños sin autorización.

Las lecciones y variantes del modo Entrenamiento **no** son de Morphiq: vienen de KarpaChess (© 2026
Mourad Ghafiri) y de FreeChessTrainer (© 2025 FreeChessTrainer), ambos con licencia MIT. Esa licencia
se conserva completa en [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
