# Avisos de terceros

MorphiqChess usa material de otros proyectos, cada uno con su propia licencia:

| Qué | De dónde | Licencia | Dónde se usa |
| --- | --- | --- | --- |
| Lecciones de aperturas (español) | [KarpaChess](#karpachess) | MIT | Entrenamiento → Aprender |
| Variantes de la Apertura Italiana, la Ruy López y el Gambito Viena | [FreeChessTrainer Opening Dataset](#freechesstrainer-opening-dataset) | MIT | Entrenamiento → Practicar |
| Variantes de las otras doce aperturas y defensas | [Lichess chess-openings](#lichess-chess-openings) | CC0 (dominio público) | Entrenamiento → Practicar |
| El motor de ajedrez de los rivales | [Stockfish.js](#stockfishjs-el-motor-de-los-rivales) | **GPL-3.0** | Práctica |

La licencia MIT pide conservar el aviso de derechos de autor y el texto del permiso; aquí están completos.
Los avisos también se muestran dentro de la app: «Entrenamiento → Créditos» y «Práctica → Motor de los
rivales».

El resto del código y los diseños de este repositorio no vienen de estos proyectos. De los de contenido
(KarpaChess, FreeChessTrainer, Lichess) solo se tomaron las **aperturas**: no se copió código, rompecabezas ni
lecciones de otros temas. Stockfish.js es un programa completo que se distribuye **tal cual y aparte** del
código de la app (ver su sección).

## KarpaChess

- Autor: Mourad Ghafiri · https://github.com/mourad-ghafiri/KarpaChess
- Versión usada: commit `c25f5054d254d594fc44901e1951e850e9683407` (15 de mayo de 2026)
- Qué se tomó: las 18 lecciones de aperturas y defensas en español (`data/lessons/es/openings-*.json`)
- Dónde queda: `src/training/data/lessons/`
- Qué se adaptó (el contenido de las lecciones no cambia):
  - «negras/negro» pasa a «azules/azul», que es como se llama ese bando en MorphiqChess;
  - las jugadas con letras inglesas (`Nf6`, `Bxh7+`) se marcan para que la app las muestre en español
    (`Cf6`, `Axh7+`), igual que el resto de la interfaz;
  - cada paso para leer se parte en globos de texto cortos, uno por «Siguiente».

```text
MIT License

Copyright (c) 2026 Mourad Ghafiri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## FreeChessTrainer Opening Dataset

- Autor: FreeChessTrainer · https://github.com/freechesstrainer/freechess-trainer-openings
- Cita: *FreeChessTrainer Opening Dataset, GitHub repository:
  https://github.com/freechesstrainer/freechess-trainer-openings*
- Versión usada: commit `3c8e04f51f88a941093257e04d252afeee814564` (22 de diciembre de 2025)
- Qué se tomó: las 127 variantes de la Apertura Italiana (59), la Ruy López (64) y el Gambito Viena (4),
  jugando con blancas (`openings/italian-game.json`, `ruy-lopez.json` y `vienna-gambit.json`)
- Dónde queda: `src/training/data/lines/`
- Qué se adaptó:
  - los nombres de las variantes se tradujeron al español (el original en inglés se conserva en `nameEn`);
  - se descartaron las evaluaciones del motor y los metadatos que la app no usa;
  - cada variante se comprobó jugada por jugada con el motor de reglas de MorphiqChess.

```text
MIT License

Copyright (c) 2025 FreeChessTrainer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Lichess chess-openings

- Autor: los colaboradores de Lichess · https://github.com/lichess-org/chess-openings
- Versión usada: commit `a6189a30dc273ccb21fc2536a9a2fefd5592a67a` (6 de octubre de 2026)
- Qué se tomó: nombre, código ECO y jugadas de las filas de `a.tsv` … `e.tsv` que corresponden a doce aperturas
  y defensas: Gambito de Dama, Apertura Inglesa, Sistema Londres, Ataque India de Rey, Catalana, Defensa
  Siciliana, Najdorf, Caro-Kann, Francesa, India de Rey, Nimzo-India y Grünfeld (1 492 variantes en total)
- Dónde queda: `src/training/data/lines/`
- Qué se adaptó:
  - los nombres se tradujeron al español con reglas (el original en inglés se conserva en `nameEn`);
  - de cada apertura se quedan las líneas más cortas hasta 200 posiciones en las que decide la persona;
  - cada línea se comprobó jugada por jugada con el motor de reglas de MorphiqChess.
- Licencia: **CC0 1.0** (dedicación al dominio público). El proyecto indica que, como colección de hechos, los
  datos son de dominio público y que, en lo que el trabajo de depuración pudiera tener derechos, se libera con
  CC0: https://creativecommons.org/publicdomain/zero/1.0/. No exige atribución; se da por cortesía.

## Stockfish.js, el motor de los rivales

- Proyecto: Stockfish.js 19.0.1, edición «lite» de un solo hilo, tal como se publica en npm (paquete
  `stockfish` 19.0.1) · https://github.com/nmrugg/stockfish.js. Es una compilación a WebAssembly de
  [Stockfish](https://github.com/official-stockfish/Stockfish), el motor de ajedrez libre.
- Derechos de autor: © 2026 Chess.com, LLC (Stockfish.js); © T. Romstad, M. Costalba, J. Kiiski, G. Linscott y
  demás colaboradores de Stockfish.
- Dónde queda: `public/engine/` (se publica en `/engine/`):
  - `stockfish-19-lite-single.js` (28 KB) y `stockfish-19-lite-single.wasm` (1.8 MB, con la red neuronal
    `nn-61e7af4bb97d` incluida);
  - `Copying.txt`: el texto completo de la licencia;
  - `README.txt`: las sumas SHA-256 de los archivos y dónde está el código fuente.
- **Sin modificaciones.** Los archivos son idénticos a los del paquete de npm. MorphiqChess los ejecuta como un
  programa aparte dentro de un Web Worker y solo se comunica con él con el protocolo UCI (mensajes de texto); el
  código de la app no incluye ni enlaza el del motor. Corre en el dispositivo de quien juega: ninguna partida
  se envía a un servidor.
- Licencia: **GNU General Public License, versión 3** (https://www.gnu.org/licenses/gpl-3.0.html). El texto
  completo está en `public/engine/Copying.txt`.
- Código fuente correspondiente (lo que se compiló para obtener esos archivos):
  - Stockfish.js 19.0.1: https://github.com/nmrugg/stockfish.js/tree/v19.0.1 (incluye en `src/` el código de
    Stockfish y el script de compilación `build.js`);
  - Stockfish: https://github.com/official-stockfish/Stockfish;
  - red neuronal: https://tests.stockfishchess.org/nns?network_name=nn-61e7af4bb97d.
- Para recompilar: emscripten 6.0.9 y `./build.js --single-threaded --lite` en el repositorio de Stockfish.js.

La GPL-3.0 rige para Stockfish.js, no para el resto de MorphiqChess, que es un programa distinto y separado (ver
la sección «Marca y licencia» del `README.md`).

## Cómo se regeneran los datos

`npm run training:convert` vuelve a leer los tres repositorios de contenido (clonados aparte) y reescribe
`src/training/data/`. El detalle está en `tools/training/README.md`. El Elo de los rivales se midió con
`npm run bots:duel` y `npm run bots:fit` (ver `docs/practica/calibracion.md`).
