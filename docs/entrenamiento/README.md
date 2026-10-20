# Modo entrenamiento — investigación y plan

> **Estado:** el modo Entrenamiento **ya está implementado**, por otro camino que el de esta investigación: en lugar de escribir las lecciones a mano, se integraron dos proyectos con licencia MIT que encontró el dueño del proyecto (KarpaChess y FreeChessTrainer). Lo que hay, sus límites y cómo ampliarlo están en [ARCHITECTURE.md](../../ARCHITECTURE.md) (sección 4) y en [tools/training/README.md](../../tools/training/README.md). Lo que sigue en este documento es la investigación y el plan originales. La base CC0 de Lichess que aquí se validó ya se usa: de ella salen las variantes de Practicar de las otras doce aperturas y defensas, con blancas y con azules (ver `tools/training/README.md`). Las fichas (Italiana, Siciliana, Londres) siguen sirviendo para escribir lecciones con todas las ramas.
> **Fecha de la investigación:** 19 de octubre de 2026.

## Resumen (lo que hay que saber en un minuto)

1. **No existe un repositorio que se pueda integrar tal cual.** Los tres candidatos más cercanos no encajan (stack distinto y licencias que obligan a abrir el código). Detalle en la sección 2.
2. **Sí hay una base de datos reutilizable y de dominio público:** la lista de aperturas de Lichess (CC0). Se validó entera con el motor de MorphiqChess: las 3 865 líneas son legales. Con ella se generaron los catálogos de este directorio.
3. **El límite de esa base es la profundidad:** llega a jugadas "con nombre" (mediana de 6 jugadas completas; máximo 14). Sirve para el esqueleto del árbol, pero **las lecciones "hasta el final" y las explicaciones hay que escribirlas**. Ahí está el costo real (no en el código).
4. Los tres archivos de apertura traen: ideas, mapa de ramas, gambitos y trampas, errores típicos, plan de lecciones, notas para el bot y el catálogo completo en notación española.

| Apertura | Archivo | Tú juegas con | Líneas en la base de Lichess |
|---|---|---|---:|
| Apertura italiana | [apertura-italiana.md](apertura-italiana.md) | Blancas | 187 |
| Defensa siciliana | [defensa-siciliana.md](defensa-siciliana.md) | Negras | 400 |
| Sistema Londres | [sistema-londres.md](sistema-londres.md) | Blancas | 30 |

## 1. Qué se pidió

- Un **modo entrenamiento** donde se elige una apertura (Italiana, Siciliana, Londres) y luego **Aprender** o **Practicar**.
- **Aprender:** una clase interactiva (globos de texto con animación, botón «Siguiente», todas las ramas hasta el final, cómo responder).
- **Practicar:** jugar contra un bot que sigue exactamente esa apertura.
- **Dominio:** porcentaje por apertura (100 % = dominada) y estadísticas.
- Primero, buscar si ya existe un repo así; si no, **solo documentar** (sin implementar) en esta rama.

## 2. Búsqueda de repositorios

Se descargaron y revisaron (licencia, lenguaje, qué hace) los candidatos más cercanos:

| Repositorio | Licencia | Qué es | Veredicto |
|---|---|---|---|
| [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) | **CC0** (dominio público) | Archivos `a.tsv`–`e.tsv` con código ECO, nombre y jugadas (3 865 líneas). | **Se usa como base de datos.** No es un entrenador. |
| [ArneVogel/listudy](https://github.com/ArneVogel/listudy) | AGPL-3.0 | Sitio web de repertorios con repetición espaciada, hecho en Elixir/Phoenix con PostgreSQL. | **No integrable:** otro stack, necesita servidor y base de datos, y la AGPL obligaría a publicar el código de la app. Sirve como inspiración de producto. |
| [franciscoBSalgueiro/en-croissant](https://github.com/franciscoBSalgueiro/en-croissant) | GPL-3.0 | Aplicación de escritorio (Tauri) con bases de datos, motores y repertorios. | **No integrable:** es de escritorio, enorme y GPL. Útil como referencia de flujos. |
| Un entrenador de aperturas pequeño (Apache-2.0, jQuery) | Apache-2.0 | Tablero con aperturas, sin modo "aprender" ni repetición espaciada. | **Descartado:** no cubre lo pedido y usa jQuery. *(No quedó anotada su dirección exacta, por eso no se enlaza.)* |

Hay más repositorios de entrenamiento de aperturas en GitHub que **no se revisaron a fondo**: la búsqueda se detuvo al comprobar que los más completos no encajan y que la base CC0 ya cubre lo único realmente reutilizable. Si más adelante se quiere insistir, conviene buscar con términos como *opening trainer*, *repertoire*, *spaced repetition* y *chessground* y revisar la licencia **antes** de leer el código.

**Nota de licencias:** aunque el proyecto es personal y sin fines de lucro, la app está publicada en la web. Por eso se evitó copiar código GPL/AGPL (la AGPL exige abrir el código también a quien usa el servicio por red). Las bibliotecas MIT/Apache/CC0 no tienen ese problema.

## 3. Los datos: lichess-org/chess-openings

- **Qué trae:** `eco`, `name`, `pgn` por línea. Commit usado: `a6189a30dc273ccb21fc2536a9a2fefd5592a67a` (6 de octubre de 2026).
- **Validación:** cada línea se jugó con el motor de MorphiqChess (el mismo del juego) y se tradujo a notación española. Resultado: **3 865 de 3 865 legales, 0 ilegales**.
- **Cobertura para este proyecto:**

| Apertura | Líneas | Mediana (jugadas completas) | Máximo |
|---|---:|---:|---:|
| Italiana (C50–C59) | 187 | 6 | 14 |
| Siciliana (B20–B99) | 400 | 6 | 14 |
| Londres y parientes directos | 30 | 4 | 6 |

- **Lo que significa:** la base es un **índice de nombres de aperturas**, no un libro de teoría. Sirve para: (a) el esqueleto de ramas con su nombre oficial, (b) validar que las líneas escritas a mano existan, (c) generar catálogos. **No** sirve, sola, para entrenar hasta el medio juego.
- **Londres es el caso extremo:** es un sistema, no una variante con teoría larga; casi todo su contenido hay que escribirlo.

### Fuentes posibles para teoría más profunda (a decidir)

| Opción | Cómo | Ventajas | Riesgos |
|---|---|---|---|
| A. **Escribir el contenido** con ayuda de IA y validarlo con el motor | Árbol por rama, líneas revisadas por Miguel | Control total, texto en español, sin dependencias | Es el trabajo más largo; hay que revisar para no enseñar errores |
| B. **Explorador de aperturas de Lichess** (API) | Un script de construcción baja las jugadas más usadas por rama | Datos reales de partidas | Requiere red y revisar sus términos/límites (podría pedir token); no trae explicaciones |
| C. **PGN de repertorios libres** | Importar libros de acceso libre | Rapidez | Hay que verificar la licencia de cada archivo |
| D. **Motor (Stockfish en WebAssembly)** | Para validar o puntuar líneas, y para seguir jugando fuera del libro | Evita enseñar jugadas malas | Peso del motor y CSP para un *worker*; Stockfish es GPL-3.0 |

Recomendación: **A + D con revisión humana, por fases** (sección 6).

## 4. Diseño propuesto (cuando se implemente)

### 4.1 Datos

- Copiar los TSV CC0 al repo (con el hash del commit) y generar el árbol con un script de construcción (`scripts/`), validando **cada jugada con el motor** en un test.
- Dos capas: (1) **estructura** (del dataset y de las líneas escritas) y (2) **contenido** (textos de los globos, notas, etiquetas), en archivos JSON por apertura.
- Identificar los nodos por **posición (FEN)**, no por secuencia: las transposiciones comparten progreso.

```ts
interface Course {
  id: 'italiana' | 'siciliana' | 'londres';
  side: 'w' | 'b';              // el lado que juega el usuario
  modules: Module[];            // p. ej. Najdorf, Dragón… en la Siciliana
}
interface LessonNode {
  san: string;                  // jugada desde la posición del padre
  by: 'user' | 'opponent';
  say?: string[];               // globos de texto; uno por «Siguiente»
  note?: 'principal' | 'gambito' | 'trampa' | 'error-comun';
  alt?: string[];               // otras jugadas aceptables (solo si by === 'user')
  children: LessonNode[];       // ramas del rival o continuación del usuario
}
```

### 4.2 Aprender (clase interactiva)

1. Globo de texto con animación tipo máquina de escribir; tocar lo completa y «Siguiente» avanza. Con movimiento reducido, el texto aparece entero.
2. Las jugadas del rival se reproducen con la animación existente del tablero; en las del usuario, se **muestra y explica** la jugada (aquí no se evalúa).
3. En cada bifurcación del rival: «Ahora puede jugar A, B o C. Veamos A» y recorrido en profundidad con un **mapa de ramas** (visitadas / pendientes).
4. Final de rama: resumen y botón «Practicar esta rama».

### 4.3 Practicar (bot)

- El bot juega las jugadas del rival siguiendo el árbol: elige una rama con **peso adaptativo** (más peso donde el usuario falla; sin inventar porcentajes de popularidad).
- Si el usuario falla: se anima el error, se muestra la jugada correcta, se marca la tarjeta como fallada y se le deja reintentar.
- Si el usuario juega algo razonable que no está en el árbol: «fuera del repertorio» (con motor, en una fase posterior, se podría seguir jugando).
- Al terminar la línea: «línea completada» y siguiente rama.
- **No hace falta motor para la primera versión:** el bot solo recorre el árbol.

### 4.4 Porcentaje de dominio

- **Tarjeta = nodo de decisión del usuario** (posición + jugadas aceptadas).
- Esquema tipo **Leitner** (simple y explicable): caja 0 a 5; acierto sube una caja, error vuelve a 0. Intervalos de ejemplo: caja 1 → 1 día, 2 → 3 días, 3 → 7 días, 4 → 14 días, 5 → 30 días.
- **Dominio** = suma de cajas / (5 × número de tarjetas). **100 % = todas las tarjetas en la caja 5 y ninguna vencida** (una tarjeta vencida cuenta una caja menos, para que el dominio "se oxide" si no se repasa).
- También: **cobertura** (tarjetas vistas / total), **ramas más débiles**, aciertos por sesión y racha.
- Alternativa más precisa: FSRS con [`ts-fsrs`](https://www.npmjs.com/package/ts-fsrs) (licencia MIT, versión 5.4.2 al momento de revisar). Más complejo de explicar; se puede migrar después sin cambiar las tarjetas.
- Progreso en `localStorage` bajo una clave nueva con versión (por ejemplo `morphiqchess:training:v1`), con exportar/importar y restablecer.

### 4.5 Interfaz

- Menú → **Entrenamiento** → tarjetas de apertura con su anillo de dominio → **Aprender** / **Practicar** → módulos con su porcentaje.
- Reutilizar `Board`, el *Director* de animaciones y el layout inmersivo (con una variante del cajón lateral: deshacer, pista, mapa de ramas).
- Textos en `src/i18n/es.ts`; globos accesibles (región `aria-live`, enfoque en «Siguiente», teclado); respetar `prefers-reduced-motion`.

### 4.6 Pruebas

- Unitarias: cada jugada de cada curso es legal desde su posición; sin globos vacíos; matemática de las cajas y del dominio; selección de rama del bot.
- De interfaz: recorrer una línea completa en Aprender y en Practicar.

## 5. Decisiones que necesito de Miguel

1. **Lado por apertura:** Italiana y Londres con Blancas, Siciliana con Negras. ¿También el espejo (jugar contra ellas)?
2. **Siciliana:** ¿un repertorio fijo (por ejemplo Najdorf + una respuesta a cada antisiciliana) o módulos para todos los esquemas (Najdorf, Dragón, Scheveningen, Clásica, Sveshnikov, Taimanov/Kan)?
3. **Nombres:** ¿en español (glosario de abajo), en inglés (como en Lichess y los libros) o ambos?
4. **Profundidad:** ¿hasta qué jugada deben llegar las líneas (por ejemplo 10–12 o hasta el medio juego)?
5. **Fuente de teoría profunda:** A (escribirla), B (explorador de Lichess), C (PGN libres) o combinarlas.
6. **Qué ramas son opcionales** (por ejemplo Jobava en Londres, Traxler en la Italiana).

## 6. Fases y esfuerzo relativo

| Fase | Qué incluye | Tamaño |
|---|---|---|
| 0 | TSV CC0 en el repo, script que genera el árbol y lo valida con el motor, tests | S |
| 1 | **Practicar** sin textos: el bot recorre el árbol de la base, Leitner y dominio % | M |
| 2 | **Aprender**: motor de lecciones (globos, animación, «Siguiente», mapa de ramas) con un primer curso | L |
| 3 | Menú de entrenamiento y estadísticas | M |
| 4 | **Contenido**: escribir y revisar las lecciones (Italiana → Londres → Siciliana por módulos) | XL (es el costo real) |
| 5 | Opcional: Stockfish en WebAssembly para seguir jugando fuera del libro | M |

Para gastar poco uso: empezar por la fase 0 y la 1 (usan los datos que ya hay) y escribir el contenido **por rama**, no todo de golpe.

## 7. Glosario de nombres (inglés → español)

Variation → Variante · Attack → Ataque · Gambit → Gambito · Countergambit → Contragambito · Counterattack → Contraataque · Accepted → Aceptado · Declined → Rehusado · Defense → Defensa · System → Sistema · Opening → Apertura · Main Line → Línea principal · Poisoned Pawn → Peón envenenado · Fried Liver → Hígado frito · Two Knights → Dos Caballos · Four Knights → Cuatro Caballos · Hungarian → Húngara · Closed → Cerrada · Open → Abierta · Classical → Clásica · Exchange → Cambio · Advance → Avance · Dragon → Dragón · Accelerated → Acelerado · Hyperaccelerated → Hiperacelerado · Delayed → Retrasado · Wing Gambit → Gambito del Ala · Grand Prix Attack → Ataque Gran Premio · Moscow → Moscú · Pterodactyl → Pterodáctilo · Giuoco Piano → Juego tranquilo · Giuoco Pianissimo → Juego tranquilísimo.

## 8. Cómo leer estos documentos

- **Notación española:** R rey, D dama, T torre, A alfil, C caballo (igual que en la app).
- **Sin marca:** la línea figura en la base de Lichess y el motor de MorphiqChess confirmó que es legal.
- **†:** legal, pero escrita de memoria; **no** figura en la base. Hay que verificarla antes de enseñarla.
- **Comentarios (ideas, planes, consejos):** redacción propia; **no los revisó ningún maestro ni motor**. Tratarlos como borrador.
- Los catálogos y los índices de gambitos están **generados por script** a partir de la base, no escritos a mano. El script de generación y el de validación viven fuera del repositorio.
- Datos: [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings), CC0 1.0.
