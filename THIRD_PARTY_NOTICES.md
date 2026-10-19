# Avisos de terceros

El **modo Entrenamiento** de MorphiqChess usa contenido de dos proyectos con licencia MIT. La licencia
pide conservar el aviso de derechos de autor y el texto del permiso; aquí están completos. También se
muestran dentro de la app, en «Entrenamiento → Créditos».

El resto del código y los diseños de este repositorio no vienen de estos proyectos. Solo se tomó el
**contenido de aperturas**: no se copió código, rompecabezas ni lecciones de otros temas.

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

## Cómo se regeneran los datos

`npm run training:convert` vuelve a leer los dos repositorios (clonados aparte) y reescribe
`src/training/data/`. El detalle está en `tools/training/README.md`.
