# Conversión de aperturas (modo Entrenamiento)

Genera `src/training/data/` a partir de dos repositorios con licencia MIT (ver `THIRD_PARTY_NOTICES.md`):

| Fuente | Qué se toma | Resultado |
| ------ | ----------- | --------- |
| [KarpaChess](https://github.com/mourad-ghafiri/KarpaChess) | `data/lessons/es/openings-*.json` (18 lecciones en español) | `data/lessons/<id>.json` |
| [FreeChessTrainer Openings](https://github.com/freechesstrainer/freechess-trainer-openings) | `openings/*.json` (127 variantes con blancas) | `data/lines/<id>.json` |

Además escribe `data/catalog.json`: el menú (nombre, grupo, bando, cuántos pasos y tarjetas tiene cada
apertura) y los créditos. Solo se toman las aperturas; el código, los rompecabezas y las lecciones de otros
temas de esos proyectos no se usan.

## Regenerar

Los datos ya están en el repositorio; esto solo hace falta si cambian las fuentes o el convertidor.

```bash
git clone https://github.com/mourad-ghafiri/KarpaChess ../KarpaChess
git clone https://github.com/freechesstrainer/freechess-trainer-openings ../freechess-trainer-openings
npm run training:convert -- --karpa ../KarpaChess --fct ../freechess-trainer-openings
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
3. **Menú** (`courses.ts`): la única parte escrita a mano: qué lecciones y variantes forman cada apertura,
   su nombre corto, grupo y bando. El convertidor falla si una lección queda sin apertura o en dos.

Todo se valida antes de escribir: si algo falla, los datos anteriores quedan intactos.

## Cómo funciona por dentro

`vite build --config tools/training/vite.config.ts` empaqueta `run.ts` para Node en
`node_modules/.cache/training-convert/` (así importa el motor de la app tal cual, sin copiarlo) y
luego `node` lo ejecuta. Las pruebas del convertidor están en `convert.test.ts`.
