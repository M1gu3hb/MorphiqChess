# Conversión de aperturas (modo Entrenamiento)

Genera `src/training/data/` a partir de tres repositorios (ver `THIRD_PARTY_NOTICES.md`):

| Fuente | Licencia | Qué se toma | Resultado |
| ------ | -------- | ----------- | --------- |
| [KarpaChess](https://github.com/mourad-ghafiri/KarpaChess) | MIT | `data/lessons/es/openings-*.json` (18 lecciones en español) | `data/lessons/<id>.json` |
| [FreeChessTrainer Openings](https://github.com/freechesstrainer/freechess-trainer-openings) | MIT | `openings/*.json` (127 variantes con blancas: Italiana, Ruy López y Gambito Viena) | `data/lines/<id>.json` |
| [Lichess chess-openings](https://github.com/lichess-org/chess-openings) | CC0 | `a.tsv` … `e.tsv` (nombre y jugadas de cada posición): las variantes de las otras doce aperturas y defensas, con blancas y con azules | `data/lines/<id>.json` |

Además escribe `data/catalog.json`: el menú (nombre, grupo, bando, cuántos pasos y tarjetas tiene cada
apertura) y los créditos. Solo se toman las aperturas; el código, los rompecabezas y las lecciones de otros
temas de esos proyectos no se usan.

## Regenerar

Los datos ya están en el repositorio; esto solo hace falta si cambian las fuentes o el convertidor.

```bash
git clone https://github.com/mourad-ghafiri/KarpaChess ../KarpaChess
git clone https://github.com/freechesstrainer/freechess-trainer-openings ../freechess-trainer-openings
git clone https://github.com/lichess-org/chess-openings ../chess-openings
npm run training:convert -- --karpa ../KarpaChess --fct ../freechess-trainer-openings --lichess ../chess-openings
npm test        # data.test.ts comprueba que todo quedó completo y bien formado
```

`--out <carpeta>` cambia el destino (por defecto `src/training/data`). Las carpetas descargadas se tratan
como datos: el convertidor solo lee sus archivos JSON y no ejecuta nada de ellas.

## Qué hace

1. **Lecciones** (`convert.ts → convertLesson`): cada paso se valida con el motor de la app (el FEN se lee
   y las jugadas pedidas son legales). Al texto se le aplican tres adaptaciones y nada más:
   «negras/negro» → «azules/azul» (el bando se llama así en MorphiqChess; «cinturón negro» no se toca),
   las jugadas con letras inglesas (`Nf6`) se marcan como `{{Nf6}}` para que la interfaz las muestre en
   español (`Cf6`) y cada paso para leer se parte en globos cortos (uno por «Siguiente»).
2. **Variantes** (`convertLines`): se normaliza el SAN, se quitan las repetidas y se traduce el nombre
   (`translateLineName`; el original queda en `nameEn`). Se descartan las evaluaciones del motor y los
   metadatos. Cada variante se juega entera con el motor al armar el grafo de posiciones.
3. **Variantes de Lichess** (`lichess.ts`): cada fila de la base nombra una posición
   (`C50 · Italian Game: Giuoco Piano · 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5`). Una apertura toma las filas cuyo nombre
   empieza como ella y cuyas jugadas empiezan como ella (`LichessSpec` en `courses.ts`), sin repetir secuencias.
   Si son demasiadas, se quedan **las líneas más cortas hasta llenar 200 posiciones en las que decide la persona**
   (una tarjeta cada una): así cada rama queda completa en lo básico y no se llega a rincones muy profundos.
   Se juega cada línea con el motor, así que una jugada ilegal en la base detiene todo con el nombre y las jugadas.
   Con azules, el bot juega primero y el tablero se ve girado; el grafo ya lo maneja por el bando (`LinesFile.side`).
4. **Nombres en español** (`names.ts`): los nombres de Lichess van en inglés y se traducen con reglas
   (sustantivo primero: «Variante Najdorf», «Defensa Siciliana»; gentilicios; género de los adjetivos según el
   sustantivo; letras españolas en las jugadas, `Nf3` → `Cf3`). El nombre de la propia apertura se quita del
   principio de cada variante, salvo que sea todo el nombre. El original queda en `nameEn`. Los casos delicados
   están en `names.test.ts`.
5. **Menú** (`courses.ts`): la única parte escrita a mano: qué lecciones y variantes forman cada apertura,
   su nombre corto, grupo y bando. El convertidor falla si una lección queda sin apertura o en dos, o si una
   apertura tiene variantes de dos fuentes.

Todo se valida antes de escribir: si algo falla, los datos anteriores quedan intactos.

## Cómo funciona por dentro

`vite build --config tools/training/vite.config.ts` empaqueta `run.ts` para Node en
`node_modules/.cache/training-convert/` (así importa el motor de la app tal cual, sin copiarlo) y
luego `node` lo ejecuta. Las pruebas del convertidor están en `convert.test.ts`, `lichess.test.ts` y `names.test.ts`.
