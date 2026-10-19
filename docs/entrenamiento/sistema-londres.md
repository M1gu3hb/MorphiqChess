# Sistema Londres (London System)

> **Estado:** investigación — **no está implementado**. Forma parte del [plan del modo entrenamiento](README.md).
> **Perspectiva de entrenamiento:** juegas con **Blancas**; el bot elige las respuestas de las Negras.
> **Cómo leer las jugadas:** notación española (R rey, D dama, T torre, A alfil, C caballo). Una línea sin marca figura en la base de Lichess (CC0) y el motor del proyecto confirmó que es legal. Una línea con **†** es legal pero escrita de memoria: **no está en la base** y hay que verificarla antes de enseñarla. Las líneas se muestran desde el punto donde se bifurca la rama. Los comentarios (ideas, planes, consejos) son de redacción propia y **no los revisó ningún maestro ni motor**.

## 1. Resumen

- **Entradas:** `1.d4 d5 2.Cf3 Cf6 3.Af4` (la más común), `1.d4 d5 2.Af4` (acelerado) y `1.d4 Cf6 2.Cf3 e6 3.Af4` (contra el sistema indio).
- **Idea en una frase:** un **sistema**, no una variante: casi siempre colocas las mismas piezas (peones d4, e3, c3; Cf3, Af4, Ad3, Cbd2, enroque corto) sin importar mucho lo que haga el rival.
- **Por qué entrenarla:** poca teoría que memorizar y estructuras que se repiten. Ideal para aprender a *jugar* una posición.
- **Hallazgo importante:** la base de Lichess tiene solo **30 líneas** relacionadas, porque el Londres es un sistema y no una apertura de teoría larga. **Aprender y Practicar necesitarán un árbol escrito a mano** (ver "Notas para Practicar" y el README).

## 2. Las jugadas base y por qué

| Jugada | Qué hace |
|---|---|
| `1.d4` | Centro con el peón de dama y alfil de dama libre para salir. |
| `2.Cf3` | Desarrolla y controla e5. |
| `3.Af4` | **El alfil sale antes de `e3`.** Si juegas `e3` primero, el alfil queda encerrado detrás de su cadena de peones. Esta es la idea central del sistema. |
| `4.e3` | Apoya el centro y abre la diagonal del alfil de rey. |
| `c3`, `Cbd2`, `Ad3`, `O-O` | Completan la estructura. |

## 3. Ideas principales

1. **El orden importa:** `Af4` antes de `e3`.
2. **El alfil f4 vigila e5 y c7.** Si lo atacan (por ejemplo con `…Ad6` o `…Ch5`), se retira a g3 y se mantiene el par de alfiles; el cambio con `Axd6` también es válido.
3. **Casilla e5:** un caballo en e5 apoyado por `d4` y `Af4` es la mejor pieza del sistema.
4. **Cuidado con b2:** al sacar el alfil, el peón b2 queda menos protegido; `…Db6` es la respuesta clásica de las Negras. Hay que decidir de antemano cómo responderle.
5. **`h3`** evita `…Ag4`/`…Cg4` y deja un escape (h2) al alfil.
6. **Contra `…c5`:** apoya el centro con `e3`, `c3` y `Cbd2`; recapturas con calma si cambian en d4.
7. **Planes típicos:** enroque corto, `Ad3`, `Dc2` (o `Db3`), `Te1`, y después `Ce5`, `f4`/`Df3` y ataque al flanco de rey, o ruptura central con `e4`.

## 4. Posición objetivo (esquema típico)

`1.d4 d5 2.Cf3 Cf6 3.Af4 e6 4.e3 Ae7 5.Ad3 b6 6.Cbd2 Ab7 7.O-O O-O 8.c3`† (a mano).

Peones: d4, e3, c3. Piezas: Cf3, Af4, Ad3, Cbd2, enroque corto. Es el "objetivo" de la lección del esquema: después del enroque, las ideas son `Ce5`, `Dc2`, `Tfe1` y, según el caso, `e4` o `f4`.

## 5. Mapa de ramas según lo que haga el rival

```
Londres
├─ 1.d4 d5 2.Cf3 Cf6 3.Af4
│   ├─ 3...c5   golpea d4  → 4.e3 Cc6 5.Cbd2 e6 6.c3            (estructura típica)
│   │            └─ 4...Db6  ataca b2 → "peón envenenado" / 5.Cc3
│   ├─ 3...e6   → 4.e3 Ae7 / …Ad6 (cambio de alfiles) / …Ch5
│   ├─ 3...Af5  espejo
│   ├─ 3...g6   esquema indio de rey
│   └─ 3...Cc6 + …Ag4 (presión sobre Cf3)
├─ 1.d4 d5 2.Af4   LONDRES ACELERADO
│   ├─ 2...c5   Contragambito Steinitz → 3.dxc5 (aceptado) / 3.e4 (Morris)
│   └─ 2...Cf6 → transpone
├─ 1.d4 Cf6 2.Cf3 e6 3.Af4   contra el sistema indio
├─ 1.d4 Cf6 2.Cf3 g6 3.Af4   contra la india de rey
│   └─ Ataque Barry: 3.Cc3 d5 4.Af4 (Tarzan: 5.Dd2)
├─ 1.d4 g6 2.Cf3 Ag7 3.Af4   contra la "Pterodáctilo" (…c5 y …Da5+)
└─ JOBAVA: 1.d4 d5 2.Cc3 Cf6 3.Af4   (rama aparte, más afilada)
```

### A) Contra …d5 / …Cf6 con 3.Af4

`1.d4 d5 2.Cf3 Cf6 3.Af4`

**3…c5 (golpea d4).**
- Estructura típica: `3...c5 4.e3 Cc6 5.Cbd2 e6 6.c3` *(Lichess: Queen's Pawn Game: London System)*
- Plan: mantener `d4` con `e3`/`c3`/`Cbd2`; el alfil se retira a g3 si hace falta. Continuación habitual: `6...Ad6 7.Ag3`†.

**3…c5 4.e3 Db6 (ataca b2).**
- La base lo nombra *Variante del peón envenenado* con `5.Cc3` (la registra con el orden `1.d4 Cf6 2.Cf3 d5`, que es la misma posición): `3...c5 4.e3 Db6 5.Cc3` *(Lichess: London System: Poisoned Pawn Variation)*. Si las Negras toman `…Dxb2`, la compensación de las Blancas es táctica y la teoría es afilada.
- **Decisión pendiente:** elegir una sola respuesta para enseñar. Opciones calmadas (sin verificar): `4...Db6 5.Dc1`† o `4...Db6 5.b3`†.

**3…e6.** La base registra este plan con otro orden de jugadas: `2...e6 3.Af4` *(Lichess: Queen's Pawn Game: London System, with e6)* y `2...e6 3.Af4 Cf6` *(Lichess: Queen's Pawn Game: London System, with e6)*.
- Ideas: `…Ad6` busca cambiar tu alfil → tienes `Ag3` (conservas el par) o `Axd6 cxd6` (estructura más cómoda); y `…Ch5` apunta al alfil → `Ag3` (si cambian, recapturas con `hxg3` y ganas la columna h).
- Esquema habitual: `3...e6 4.e3 Ae7 5.Ad3 b6 6.Cbd2 Ab7`†

**3…Af5 (espejo).** Las Negras cambian alfiles: se sigue con `e3`, `Ad3` y el cambio. `3...Af5 4.e3 e6 5.Ad3 Axd3 6.Dxd3`†.

**3…g6 / 3…Cc6.** `3...g6 4.e3 Ag7 5.Ae2`† Contra …Cc6 + …Ag4 hay que cuidar la presión sobre el caballo f3 (†, sin detalle).

### B) Londres acelerado (2.Af4)

`1.d4 d5 2.Af4` *(Lichess: Queen's Pawn Game: Accelerated London System)*
- **Contragambito Steinitz (2…c5):** `1.d4 d5 2.Af4 c5` *(Lichess: Queen's Pawn Game: Accelerated London System, Steinitz Countergambit)* → aceptar con `3.dxc5` *(Lichess: Queen's Pawn Game: Accelerated London System, Steinitz Countergambit Accepted)* o contragambito Morris con `3.e4 dxe4` *(Lichess: Queen's Pawn Game: Accelerated London System, Steinitz Countergambit, Morris Countergambit Accepted)*.
- **Otras:** si las Negras juegan `2…Cf6` el juego transpone a la sección A.

### C) Contra la defensa india

`1.d4 Cf6 2.Cf3`

- **Con …e6:** `2.Cf3 e6 3.Af4` *(Lichess: Indian Defense: London System)*
- **Con …g6 (esquemas de rey):** `2.Cf3 g6 3.Af4` *(Lichess: London System)* → `3.Af4 Ag7 4.e3 d6 5.Ad3` *(Lichess: London System, with Ad3)* o `3.Af4 Ag7 4.e3 d6 5.Ae2 O-O` *(Lichess: London System, with Ae2)* o `3.Af4 Ag7 4.e3 d6 5.h3 c5 6.Ae2`
- **Ataque Barry** (para evitar que las Negras jueguen …d5 cómodas): `2.Cf3 g6 3.Cc3 d5 4.Af4` *(Lichess: Queen's Pawn Game: Barry Attack)*; con `5.Dd2` es el **Ataque Tarzán**: `4.Af4 Ag7 5.Dd2` *(Lichess: Queen's Pawn Game: Barry Attack, Tarzan Attack)*; con `5.e3 O-O 6.Ae2`: `4.Af4 Ag7 5.e3 O-O 6.Ae2` *(Lichess: Queen's Pawn Game: Barry Attack, Grünfeld Variation)*

### D) Londres contra la "Pterodáctilo"

`1.d4 g6 2.Cf3 Ag7 3.Af4 c5 4.c3 cxd4 5.cxd4 Da5+` *(Lichess: Queen's Pawn Game: London System, Pterodactyl Variation)*
- Debes contestar el jaque. Dos opciones (sin verificar): `6.Cc3`† o `6.Dd2`†.

### E) Jobava (Rapport-Jobava)

`1.d4 d5 2.Cc3 Cf6 3.Af4` *(Lichess: Rapport-Jobava System)*
- **Idea:** el caballo en c3 permite `Cb5` (amenaza de `Cc7+`) y juego muy agresivo con `e3`/`f3`/`Dd2`. Más teoría y más riesgo; sugerida como rama opcional.
- **Respuestas registradas:** `3...e6` *(Lichess: Rapport-Jobava System)*, `3...g6` *(Lichess: Rapport-Jobava System)* y `2...e6 3.Af4` *(Lichess: Rapport-Jobava System, with e6)*.
- Entrada típica con `Cb5`: `4.Cb5`†

## 6. Gambitos y trampas

El Londres tiene pocos gambitos con nombre. En la base figuran:

- **Steinitz Countergambit** · D00 · `1.d4 d5 2.Af4 c5`
- **Steinitz Countergambit Accepted** · D00 · `1.d4 d5 2.Af4 c5 3.dxc5`
- **Morris Countergambit** · D00 · `1.d4 d5 2.Af4 c5 3.e4`
- **Morris Countergambit Accepted** · D00 · `1.d4 d5 2.Af4 c5 3.e4 dxe4`

Trampas y motivos a enseñar (comentario propio, por verificar con ejemplos concretos):
- Si el peón b2 queda sin defensa, `…Db6` lo ataca de inmediato.
- Con el alfil en g3 y el peón en h2, `…Ch5` suele terminar cambiando alfil por caballo y abriendo la columna h para las Blancas.
- `…e5` sin preparación puede costarle un peón a las Negras por la presión de `Af4` sobre e5 y c7.

## 7. Errores típicos

- Jugar `e3` antes de sacar el alfil (queda encerrado).
- No tener plan contra `…c5` + `…Db6`.
- Retirar el alfil demasiado pronto (si no está atacado, no hace falta).
- Olvidarse de `h3` cuando las Negras presionan con `…Ag4`.
- Mover el caballo de dama a c3 por costumbre y bloquear el peón c.
- Jugar de forma automática sin mirar si las Negras ya han hecho una amenaza concreta.

## 8. Plan de lecciones sugerido (modo Aprender)

1. ¿Qué es un sistema? Por qué `Af4` antes que `e3`.
2. La posición objetivo (esquema).
3. Contra `…d5` + `…e6` (la más tranquila).
4. Contra `…c5`.
5. Contra `…Db6` (decidir la respuesta).
6. Contra `…Af5` y `…Ad6` (cambios de alfil).
7. Contra defensas indias (`…g6`, `…e6`) y el Ataque Barry.
8. Londres acelerado (Steinitz y Morris).
9. Jobava (opcional).
10. Repaso total.

## 9. Notas para el modo Practicar (bot)

- Aquí **no basta la base de Lichess**: hay que escribir un árbol propio. Propuesta: definir por cada rama de las Negras una *posición objetivo* (el esquema) y un conjunto de movimientos aceptados, en vez de una única secuencia.
- El porcentaje de dominio podría medir **jugadas aceptadas por posición** (no memoria de una secuencia exacta).
- Para las ramas sin árbol (movimientos raros de las Negras) hará falta un motor o un generador de jugadas razonables; si no, marcar "fuera del repertorio".

## 10. Catálogo completo (generado de la base de Lichess)

Todas las líneas de la base de Lichess relacionadas con el Londres (incluye acelerado, Jobava, Barry y Pterodáctilo), en notación española. Datos: [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) (CC0), validados con el motor de MorphiqChess.

| Familia (nombre de Lichess) | ECO | Líneas | Línea de entrada |
|---|---|---:|---|
| Londres acelerado (2.Af4) | A45–D00 | 6 | `1.d4 Cf6 2.Af4` |
| Sistema Londres (con Cf3 y Af4) | A46–D02 | 15 | `1.d4 Cf6 2.Cf3 e6 3.Af4` |
| Barry Attack | A48 | 4 | `1.d4 Cf6 2.Cf3 g6 3.Cc3 d5 4.Af4` |
| Rapport-Jobava System | D01 | 4 | `1.d4 d5 2.Cc3 Cf6 3.Af4` |
| Pterodactyl (Londres contra …g6) | D02 | 1 | `1.d4 g6 2.Cf3 Ag7 3.Af4 c5 4.c3 cxd4 5.cxd4 Da5+` |

<details>
<summary>Ver las 30 líneas</summary>

#### Londres acelerado (2.Af4)
*A45–D00 · 6 líneas*

- **A45** Indian Defense: Accelerated London System · `1.d4 Cf6 2.Af4`
- **D00** Queen's Pawn Game: Accelerated London System · `1.d4 d5 2.Af4`
- **D00** Queen's Pawn Game: Accelerated London System, Steinitz Countergambit · `1.d4 d5 2.Af4 c5`
- **D00** Queen's Pawn Game: Accelerated London System, Steinitz Countergambit Accepted · `1.d4 d5 2.Af4 c5 3.dxc5`
- **D00** Queen's Pawn Game: Accelerated London System, Steinitz Countergambit, Morris Countergambit · `1.d4 d5 2.Af4 c5 3.e4`
- **D00** Queen's Pawn Game: Accelerated London System, Steinitz Countergambit, Morris Countergambit Accepted · `1.d4 d5 2.Af4 c5 3.e4 dxe4`

#### Sistema Londres (con Cf3 y Af4)
*A46–D02 · 15 líneas*

- **D02** London System: Poisoned Pawn Variation · `1.d4 Cf6 2.Cf3 d5 3.Af4 c5 4.e3 Db6 5.Cc3`
- **A46** Indian Defense: London System · `1.d4 Cf6 2.Cf3 e6 3.Af4`
- **A48** London System · `1.d4 Cf6 2.Cf3 g6 3.Af4`
- **A48** London System · `1.d4 Cf6 2.Cf3 g6 3.Af4 Ag7 4.e3`
- **A48** London System · `1.d4 Cf6 2.Cf3 g6 3.Af4 Ag7 4.e3 d6`
- **A48** London System, with Ad3 · `1.d4 Cf6 2.Cf3 g6 3.Af4 Ag7 4.e3 d6 5.Ad3`
- **A48** London System, with Ae2 · `1.d4 Cf6 2.Cf3 g6 3.Af4 Ag7 4.e3 d6 5.Ae2`
- **A48** London System, with Ae2 · `1.d4 Cf6 2.Cf3 g6 3.Af4 Ag7 4.e3 d6 5.Ae2 O-O`
- **A48** London System, with Ae2 · `1.d4 Cf6 2.Cf3 g6 3.Af4 Ag7 4.e3 d6 5.h3 c5 6.Ae2`
- **D02** Queen's Pawn Game: London System · `1.d4 d5 2.Cf3 Cf6 3.Af4`
- **D02** Queen's Pawn Game: London System · `1.d4 d5 2.Cf3 Cf6 3.Af4 c5 4.e3`
- **D02** Queen's Pawn Game: London System · `1.d4 d5 2.Cf3 Cf6 3.Af4 c5 4.e3 Cc6 5.Cbd2`
- **D02** Queen's Pawn Game: London System · `1.d4 d5 2.Cf3 Cf6 3.Af4 c5 4.e3 Cc6 5.Cbd2 e6 6.c3`
- **D02** Queen's Pawn Game: London System, with e6 · `1.d4 d5 2.Cf3 e6 3.Af4`
- **D02** Queen's Pawn Game: London System, with e6 · `1.d4 d5 2.Cf3 e6 3.Af4 Cf6`

#### Barry Attack
*A48 · 4 líneas*

- **A48** Queen's Pawn Game: Barry Attack · `1.d4 Cf6 2.Cf3 g6 3.Cc3 d5 4.Af4`
- **A48** Queen's Pawn Game: Barry Attack · `1.d4 Cf6 2.Cf3 g6 3.Cc3 d5 4.Af4 Ag7`
- **A48** Queen's Pawn Game: Barry Attack, Tarzan Attack · `1.d4 Cf6 2.Cf3 g6 3.Cc3 d5 4.Af4 Ag7 5.Dd2`
- **A48** Queen's Pawn Game: Barry Attack, Grünfeld Variation · `1.d4 Cf6 2.Cf3 g6 3.Cc3 d5 4.Af4 Ag7 5.e3 O-O 6.Ae2`

#### Rapport-Jobava System
*D01 · 4 líneas*

- **D01** Rapport-Jobava System · `1.d4 d5 2.Cc3 Cf6 3.Af4`
- **D01** Rapport-Jobava System · `1.d4 d5 2.Cc3 Cf6 3.Af4 e6`
- **D01** Rapport-Jobava System · `1.d4 d5 2.Cc3 Cf6 3.Af4 g6`
- **D01** Rapport-Jobava System, with e6 · `1.d4 d5 2.Cc3 e6 3.Af4`

#### Pterodactyl (Londres contra …g6)
*D02 · 1 línea*

- **D02** Queen's Pawn Game: London System, Pterodactyl Variation · `1.d4 g6 2.Cf3 Ag7 3.Af4 c5 4.c3 cxd4 5.cxd4 Da5+`

</details>

> Existen además en la base otras aperturas con `Af4` temprano (Trompowsky: variante Borg, Budapest, Brinckmann del Grünfeld, Harrwitz, Miles, Senechaud); no forman parte de este módulo.
