# Defensa siciliana (Sicilian Defense)

> **Estado:** investigación — **no está implementado**. Forma parte del [plan del modo entrenamiento](README.md).
> **Perspectiva de entrenamiento:** juegas con **Negras** (defiendes con `1...c5`); el bot elige las jugadas de las Blancas.
> **Cómo leer las jugadas:** notación española (R rey, D dama, T torre, A alfil, C caballo). Una línea sin marca figura en la base de Lichess (CC0) y el motor del proyecto confirmó que es legal. Una línea con **†** es legal pero escrita de memoria: **no está en la base** y hay que verificarla antes de enseñarla. Las líneas se muestran desde el punto donde se bifurca la rama (el tronco aparece completo al abrir cada sección). Los comentarios (ideas, planes, consejos) son de redacción propia y **no los revisó ningún maestro ni motor**.

## 1. Resumen

- **Entrada:** `1.e4 c5`
- **Idea en una frase:** las Negras no copian a las Blancas; cambian un peón de flanco (el de c) por el peón central de d4. La partida queda **asimétrica**: ambos bandos tienen ventajas y atacan en flancos distintos.
- **Por qué entrenarla:** es la respuesta más combativa a `1.e4` y la más estudiada. Premia entender planes además de memorizar.
- **Tamaño en la base de Lichess:** 400 líneas con nombre (ECO B20–B99), con decenas de familias. Es, con diferencia, el árbol más grande de los tres.
- **Dos problemas distintos** (y por eso conviene dividirla en módulos):
  1. La **Siciliana abierta** (`2.Cf3` y `3.d4`): el rival elige entre muchos sistemas y tú eliges *tu* esquema (Najdorf, Dragón, Scheveningen, Clásica, Sveshnikov, Taimanov, Kan…).
  2. Las **antisicilianas** (Alapin, Cerrada, Smith-Morra, Rossolimo, etc.): el rival evita la teoría abierta y tú necesitas una respuesta sólida para cada una.

## 2. Ideas principales

1. **Qué cambia tras el intercambio** (`…cxd4`, `Cxd4`): las Blancas pierden un peón central y las Negras uno de flanco. Resultado: las Negras tienen **mayoría central** (peones d y e contra el peón e) y una **columna c semiabierta**; las Blancas tienen **ventaja de desarrollo y espacio** y una mayoría en el flanco de dama (a, b, c contra a, b).
2. **Planes típicos de las Blancas:** ataque contra el rey con `f3`/`f4`, `g4`, `h4`, `Dd2`, `Ae3` y enroque largo (enroques opuestos = carrera de ataques); o presión central con `Ac4`/`f4`.
3. **Planes típicos de las Negras:** contrajuego por la columna c (`…Tc8`), la ruptura `…b5` y/o `…d5`, y casillas como c4 para las piezas. A menudo se sacrifica calidad (`…Txc3`) por iniciativa.
4. **Estructuras:** Najdorf y Scheveningen (peones d6/e6 o e5 con `…a6`), Dragón (fianchetto con `…g6`/`…Ag7`), Sveshnikov (`…e5` con hueco en d5), Taimanov y Kan (`…e6` flexible con `…Dc7`, `…a6`).
5. **Disciplina de movimientos:** es una apertura donde un solo orden de jugadas mal puesto te lleva a otra apertura. En entrenamiento, conviene que el árbol se guíe por la **posición** (FEN) y no solo por la secuencia.

## 3. Mapa de ramas

```
1.e4 c5
├─ 2.Cf3  ← SICILIANA ABIERTA (lo más común)
│   ├─ 2...d6   3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 →
│   │            5...a6 NAJDORF · 5...g6 DRAGÓN · 5...e6 SCHEVENINGEN · 5...Cc6 CLÁSICA
│   ├─ 2...Cc6  3.d4 cxd4 4.Cxd4 → 4...Cf6 5.Cc3 e5 SVESHNIKOV · 4...g6 DRAGÓN ACELERADO
│   ├─ 2...e6   3.d4 cxd4 4.Cxd4 → 4...Cc6 TAIMANOV · 4...a6 KAN · 4...Cf6 5.Cc3 d6 SCHEVENINGEN
│   ├─ 2...g6   Dragón hiperacelerado
│   ├─ 2...a6   O'Kelly      · 2...Cf6 Nimzowitsch
│   └─ antisicilianas con 2.Cf3:  3.Ab5 (Rossolimo, tras 2...Cc6)
│                                  3.Ab5+ (Moscú, tras 2...d6)
│                                  3.c3 (Alapin retrasado, tras 2...e6)
├─ 2.c3    ALAPIN
├─ 2.Cc3   CERRADA  (con 3.f4: Ataque Gran Premio)
├─ 2.d4 cxd4 3.c3   GAMBITO SMITH-MORRA
├─ 2.f4    ATAQUE McDONNELL
├─ 2.b4    GAMBITO DEL ALA
└─ otras: 2.Ac4 Bowdler · 2.g3 Lasker-Dunne · 2.c4 Staunton-Cochrane · 2.Dg4 Amazona … (ver catálogo)
```

### A) La Siciliana abierta

Posición central de la teoría: `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3`
Aquí las Negras eligen su esquema. Tú decides cuál enseñar (ver "Decisiones pendientes" en el README).

#### Najdorf (5…a6)

`1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6` *(Lichess: Najdorf Variation)*

- **Idea:** `…a6` evita `Cb5`/`Ab5`, prepara `…b5` y ofrece mucha flexibilidad. Es el esquema más combativo y el más teórico.
- **Sexta jugada de las Blancas y tu plan:**
  - **6.Ag5** (la más aguda). Entrada: `6.Ag5 e6 7.f4` *(Lichess: Najdorf Variation)* Desde ahí hay tres caminos:
    - *Línea principal:* `6.Ag5 e6 7.f4 Ae7 8.Df3 Dc7 9.O-O-O Cbd7` *(Lichess: Najdorf Variation, Main Line)*
    - *Peón envenenado* (`7…Db6`): `6.Ag5 e6 7.f4 Db6` *(Lichess: Najdorf Variation, Poisoned Pawn Variation)* → `6.Ag5 e6 7.f4 Db6 8.Dd2 Dxb2 9.Tb1 Da3` *(Lichess: Najdorf Variation, Poisoned Pawn Accepted)*. Ganas un peón pero pones la dama en riesgo; es teoría de alto riesgo.
    - *Polugaevsky* (`7…b5`): `6.Ag5 e6 7.f4 b5` *(Lichess: Najdorf Variation, Polugaevsky Variation)*
    - Otra opción en la sexta: `6.Ag5 Cbd7`
  - **6.Ae3 (Ataque inglés):** `6.Ae3 e5 7.Cb3 Ae6 8.f3` *(Lichess: Najdorf Variation, English Attack)*. Las Blancas preparan `Dd2`, `O-O-O` y `g4`; tú respondes con `…Cbd7`, `…Ae7`, `…Tc8` y `…b5`. Alternativa de las Negras: `6.Ae3 Cg4` *(Lichess: Najdorf Variation, English Attack, Anti-English)* (anti-inglés). Con `6…e6`: `6.Ae3 e6 7.f3` y se sigue con `…b5` (†).
  - **6.Ac4 (Ataque Sozin/Fischer):** `6.Ac4 e6 7.Ab3 b5` *(Lichess: Sozin Attack, Flank Variation)*
  - **6.Ae2 (Opočenský):** `6.Ae2 e5 7.Cb3 Ae7`
  - **6.f4:** `6.f4 e6`
  - **6.h3 y 6.g3:** `6.h3` y `6.g3`. La base solo registra la entrada; la respuesta habitual es `…e5` (†).

#### Dragón (5…g6)

`1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6`

- **Idea:** fianchetto del alfil de rey, enroque corto y juego por la columna c. Muy práctico: las ideas se repiten.
- **Ataque Yugoslavo** (`6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6`): el gran test. `6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.O-O-O Tc8 11.Ab3`. Continuación habitual: `6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.O-O-O Tc8 11.Ab3 Ce5 12.h4 h5 13.Ag5 Tc4`†. Otras novenas jugadas de las Blancas: `6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.g4` (Soltis) y `6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.O-O-O d5`†.
- **Clásica (6.Ae2):** `6.Ae2 Ag7 7.O-O Cc6`
- **6.f4 (Levenfish):** `6.f4 Cbd7`

#### Scheveningen (…e6 y …d6)

`1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6`

- **Idea:** pequeño centro compacto (`d6`/`e6`), muy flexible. Se puede llegar por varios órdenes de jugadas (cuidado con las transposiciones).
- **Ataque Keres (6.g4):** `6.g4`
- **Clásica (6.Ae2):** `6.Ae2`
- **Ataque inglés contra el Scheveningen** (`6.Ae3`, `f3`, `Dd2`): ver familia *Scheveningen Variation* del catálogo.

#### Clásica y Richter-Rauzer (5…Cc6)

`1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6`

- **Richter-Rauzer (6.Ag5):** `6.Ag5 e6 7.Dd2 Ae7 8.O-O-O O-O 9.f4` *(Lichess: Richter-Rauzer Variation, Classical Variation)*
- **Ataque Sozin / Velimirović (6.Ac4):** `6.Ac4 e6 7.Ae3 Ae7 8.De2` *(Lichess: Velimirovic Attack)*
- **Boleslavsky (6.Ae2 e5):** `6.Ae2 e5`

#### Sveshnikov (2…Cc6 y 5…e5)

- **Idea:** `…e5` deja un hueco en d5 a cambio de actividad, el par de alfiles y juego en el flanco de rey. Estructura muy estudiada, con ideas claras.
- **Entrada:** `6.Cdb5 d6 7.Ag5 a6 8.Ca3 b5`
- **Variante Cheliábinsk (9.Cd5):** `6.Cdb5 d6 7.Ag5 a6 8.Ca3 b5 9.Cd5` *(Lichess: Lasker-Pelikan Variation, Sveshnikov Variation, Chelyabinsk Variation)*
- **9.Axf6:** `6.Cdb5 d6 7.Ag5 a6 8.Ca3 b5 9.Axf6 gxf6 10.Cd5 f5` *(Lichess: Lasker-Pelikan Variation, Sveshnikov Variation)*

#### Dragón acelerado (2…Cc6 y 4…g6)

`1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6`

- **Idea:** el Dragón sin gastar `…d6`; evita el Ataque Yugoslavo, pero permite el **cerco de Maróczy** (`5.c4`).
- **Maróczy:** `5.c4 Ag7 6.Ae3 Cf6 7.Cc3` → la base registra `5.c4 Ag7 6.Ae3 Cf6 7.Cc3 Cg4` (Breyer); lo habitual es `7…O-O 8.Ae2 d6` (†).

#### Taimanov, Kan y Cuatro caballos (2…e6)

- **Taimanov (4…Cc6):** `4...Cc6 5.Cc3 Dc7 6.Ae3 a6 7.Ae2`. Idea: flexibilidad con `…Dc7`, `…a6`, `…Cf6`, `…Ae7`.
- **Kan (4…a6):** `4...a6` *(Lichess: Kan Variation)*; con `5.c4` (Maróczy): `4...a6 5.c4 Cf6 6.Cc3 Ab4 7.Ad3 Cc6` *(Lichess: Kan Variation, Maróczy Bind, Bronstein Variation)*; con `5.Ad3`: `4...a6 5.Ad3 Cf6`.
- **Cuatro caballos:** `4...Cc6 5.Cc3 Cf6` *(Lichess: Four Knights Variation)*.

#### Otras segundas jugadas de las Negras (2.Cf3)

- **Dragón hiperacelerado (2…g6):** `2...g6` *(Lichess: Hyperaccelerated Dragon)* y `2...g6 3.d4 Ag7` *(Lichess: Hyperaccelerated Pterodactyl)*.
- **O'Kelly (2…a6):** `2...a6` *(Lichess: O'Kelly Variation)*. Familia grande en el catálogo (Maróczy, Venecia, Réti, Yereván…).
- **Nimzowitsch (2…Cf6):** `2...Cf6 3.e5 Cd5 4.Cc3 e6 5.Cxd5 exd5 6.d4 Cc6` *(Lichess: Nimzowitsch Variation, Main Line)*.

### B) Antisicilianas (qué hacer cuando el rival no entra en la teoría abierta)

Para cada una, la base de Lichess da la **entrada**; la respuesta "recomendada" es un ejemplo para que Miguel decida el repertorio.

- **2.c3 — Alapin.** `2.c3` *(Lichess: Alapin Variation)*
  - *Respuesta con `2…Cf6`:* `2.c3 Cf6 3.e5 Cd5 4.d4 cxd4` *(Lichess: Alapin Variation, Smith-Morra Declined)*; ataque Stoltz: `2.c3 Cf6 3.e5 Cd5 4.Cf3 Cc6 5.Ac4 Cb6 6.Ab3` *(Lichess: Alapin Variation, Stoltz Attack)*.
  - *Respuesta con `2…d5`:* `2.c3 d5 3.exd5 Dxd5 4.d4 Cf6 5.Cf3 Ag4` (Defensa Barmen).
- **2.Cc3 — Cerrada.** `2.Cc3` *(Lichess: Closed)* Esquema típico de las Negras: `2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7 5.d3 d6` *(Lichess: Closed)*. Con `3.f4` (Gran Premio): `2.Cc3 Cc6 3.f4` *(Lichess: Grand Prix Attack)* y `2.Cc3 Cc6 3.f4 g6 4.Cf3 Ag7 5.Ac4 e6 6.f5` *(Lichess: Grand Prix Attack, Schofman Variation)*.
- **2.d4 cxd4 3.c3 — Gambito Smith-Morra.** `2.d4 cxd4 3.c3` *(Lichess: Smith-Morra Gambit)*
  - *Aceptado:* `2.d4 cxd4 3.c3 dxc3` *(Lichess: Smith-Morra Gambit Accepted)* → esquema Scheveningen `2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 d6 6.Ac4 e6` *(Lichess: Smith-Morra Gambit Accepted, Scheveningen Formation)*. Con `…e6` y `6.Ac4 Dc7` aparece la trampa siberiana: `2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 Dc7 7.De2 Cf6 8.O-O Cg4` *(Lichess: Smith-Morra Gambit Accepted, Siberian Variation, Siberian Trap)* (**el detalle de la trampa está pendiente de verificar**).
  - *Rehusado:* `2.d4 cxd4 3.c3 Cf6` *(Lichess: Smith-Morra Gambit Declined, Alapin Formation)* (formación Alapin) o `2.d4 cxd4 3.c3 d5` *(Lichess: Smith-Morra Gambit Declined, Scandinavian Formation)* (formación escandinava).
- **2.f4 — Ataque McDonnell.** `2.f4` *(Lichess: McDonnell Attack)* y `2.f4 d5 3.exd5 Cf6` *(Lichess: McDonnell Attack, Tal Gambit)* (Gambito Tal).
- **2.b4 — Gambito del ala.** `2.b4` *(Lichess: Wing Gambit)* → `2.b4 cxb4 3.a3` *(Lichess: Wing Gambit, Marshall Variation)* y `2.b4 cxb4 3.a3 d5 4.exd5 Dxd5 5.Ab2` *(Lichess: Wing Gambit, Marienbad Variation)*.
- **2.Cf3 Cc6 3.Ab5 — Rossolimo.** `2.Cf3 Cc6 3.Ab5` *(Lichess: Nyezhmetdinov-Rossolimo Attack)* → `2.Cf3 Cc6 3.Ab5 g6` *(Lichess: Nyezhmetdinov-Rossolimo Attack, Fianchetto Variation)* y `2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.Te1 e5 6.b4` *(Lichess: Nyezhmetdinov-Rossolimo Attack, Gurgenidze Variation)*.
- **2.Cf3 d6 3.Ab5+ — Moscú.** `2.Cf3 d6 3.Ab5+` *(Lichess: Moscow Variation)* → `2.Cf3 d6 3.Ab5+ Ad7` *(Lichess: Moscow Variation, Main Line)* y `2.Cf3 d6 3.Ab5+ Ad7 4.Axd7+ Dxd7 5.c4` *(Lichess: Moscow Variation, Sokolsky Variation)*.
- **2.Cf3 e6 3.c3 — Alapin retrasado.** `2.Cf3 e6 3.c3` *(Lichess: Delayed Alapin Variation, with e6)* → `2.Cf3 e6 3.c3 d5 4.exd5 Dxd5 5.d4 Cf6` *(Lichess: Delayed Alapin Variation)*.
- **Otras primeras segundas jugadas** (con nombre en la base): `2.Ac4` *(Lichess: Bowdler Attack)* (Bowdler), `2.g3` *(Lichess: Lasker-Dunne Attack)* (Lasker-Dunne), `2.c4` *(Lichess: Staunton-Cochrane Variation)* (Staunton-Cochrane), `2.Dg4` *(Lichess: Amazon Attack)* (Amazona), `2.a3` *(Lichess: Mengarini Variation)* (Mengarini), `2.Ca3` *(Lichess: Kronberger Variation)* (Kronberger).

#### Repertorio de ejemplo (solo para discutir, no verificado)

| Si las Blancas juegan | Una respuesta posible |
|---|---|
| `2.Cf3` | `2…d6` y Najdorf (`5…a6`) |
| `2.c3` | `2…Cf6` (o `2…d5`) |
| `2.Cc3` | `2…Cc6` |
| `2.d4` (Smith-Morra) | aceptar con `3…dxc3` |
| `2.f4` | `2…Cc6` |
| `2.b4` | aceptar con `2…cxb4` |
| `3.Ab5` (Rossolimo / Moscú) | `3…g6` / `3…Ad7` |

## 4. Gambitos y trampas

- **Peón envenenado del Najdorf** (`7…Db6`): ver sección A.
- **Gambito Smith-Morra** (`2.d4 cxd4 3.c3`): el rival ofrece un peón por desarrollo; la respuesta correcta suele ser aceptarlo y devolverlo en el momento justo.
- **Gambito del ala** (`2.b4`): similar; acepta y toma el centro con `…d5`.
- **Trampa siberiana** y **trampa Magnus Smith**: ver el índice generado.

**Índice completo de gambitos, trampas y contraataques con nombre (generado de la base de Lichess):**

- **Nemeth Gambit** · B20 · `1.e4 c5 2.Ca3 Cc6 3.d4 cxd4 4.Ac4`
- **San Francisco Gambit** · B30 · `1.e4 c5 2.Cf3 Cc6 3.Ab5 Ca5 4.b4`
- **Lutikov Gambit** · B31 · `1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.c3 Cf6 6.d4`
- **Gufeld Gambit** · B31 · `1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.c3 e5 6.d4`
- **Portsmouth Gambit** · B30 · `1.e4 c5 2.Cf3 Cc6 3.b4`
- **Magnus Smith Trap** · B57 · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 g6 7.Cxc6 bxc6 8.e5`
- **Zollner Gambit** · B73 · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.Ae3 Ag7 6.Ae2 Cf6 7.Cc3 O-O 8.O-O d6 9.f4 Db6 10.e5`
- **Gambit Line** · B28 · `1.e4 c5 2.Cf3 a6 3.c3 d5 4.exd5 Cf6`
- **Cortlever Gambit** · B28 · `1.e4 c5 2.Cf3 a6 3.d4 cxd4 4.Ac4`
- **Polish Gambit** · B27 · `1.e4 c5 2.Cf3 b5`
- **Haag Gambit** · B52 · `1.e4 c5 2.Cf3 d6 3.Ab5+ Ad7 4.Axd7+ Dxd7 5.O-O Cc6 6.c3 Cf6 7.d4`
- **Dorfman Gambit** · B51 · `1.e4 c5 2.Cf3 d6 3.Ab5+ Cc6 4.O-O Ad7 5.De2 g6 6.e5`
- **Moscow Gambit** · B51 · `1.e4 c5 2.Cf3 d6 3.Ab5+ Cc6 4.O-O Ad7 5.c3 Cf6 6.Te1 a6 7.Axc6 Axc6 8.d4 Axe4 9.Ag5`
- **Basman-Palatnik Gambit** · B50 · `1.e4 c5 2.Cf3 d6 3.c3 Cf6 4.Ae2 Cc6 5.d4 cxd4 6.cxd4 Cxe4`
- **Basman-Palatnik Double Gambit** · B50 · `1.e4 c5 2.Cf3 d6 3.c3 Cf6 4.Ae2 Cc6 5.d4 cxd4 6.cxd4 Cxe4 7.d5 Da5+ 8.Cc3 Cxc3 9.bxc3`
- **Ginsberg Gambit** · B54 · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Ac4`
- **Perenyi Gambit** · B90 · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e6 7.g4 e5 8.Cf5 g6 9.g5`
- **Dekker Gambit** · B90 · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.g4`
- **Kotov Gambit** · B50 · `1.e4 c5 2.Cf3 d6 3.g3 b5`
- **Wing Gambit Deferred** · B40 · `1.e4 c5 2.Cf3 e6 3.b4`
- **Gary Gambit** · B44 · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cb5 d6 6.c4 Cf6 7.C1c3 a6 8.Ca3 d5`
- **Ponomariov Gambit** · B47 · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Dc7 6.Cdb5 Db8 7.Ae3 a6 8.Ab6`
- **Smith-Morra Gambit Deferred** · B40 · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.c3`
- **Marshall Counterattack** · B40 · `1.e4 c5 2.Cf3 e6 3.d4 d5`
- **Brussels Gambit** · B27 · `1.e4 c5 2.Cf3 f5`
- **Double-Dutch Gambit** · B27 · `1.e4 c5 2.Cf3 f5 3.exf5 Ch6`
- **Prins Gambit** · B20 · `1.e4 c5 2.b3 d5 3.Ab2`
- **Wing Gambit** · B20 · `1.e4 c5 2.b4`
- **Nanu Gambit** · B20 · `1.e4 c5 2.b4 cxb4 3.a3 d5 4.exd5 Dxd5 5.Cf3 e5 6.c4 De6 7.Ad3`
- **Anti-Alapin Gambit** · B22 · `1.e4 c5 2.c3 d5 3.exd5 Cf6`
- **Smith-Morra Gambit** · B21 · `1.e4 c5 2.d4`
- **Morphy Gambit** · B21 · `1.e4 c5 2.d4 cxd4 3.Cf3`
- **Andreaschek Gambit** · B21 · `1.e4 c5 2.d4 cxd4 3.Cf3 e5 4.c3`
- **Coles Sicilian Gambit** · B21 · `1.e4 c5 2.d4 cxd4 3.Dxd4 Cc6 4.Dd1 Cf6 5.Ac4`
- **Smith-Morra Gambit Declined** · B21 · `1.e4 c5 2.d4 cxd4 3.c3 Cf6`
- **Smith-Morra Gambit Accepted** · B21 · `1.e4 c5 2.d4 cxd4 3.c3 dxc3`
- **Siberian Trap** · B21 · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 Dc7 7.De2 Cf6 8.O-O Cg4`
- **Halasz Gambit** · B21 · `1.e4 c5 2.d4 cxd4 3.f4`
- **Tal Gambit** · B21 · `1.e4 c5 2.f4 d5 3.exd5 Cf6`

## 5. Plan de lecciones sugerido (modo Aprender)

1. Por qué `1…c5` y qué cambia tras `…cxd4` (mayorías y columna c).
2. La posición central (`5.Cc3`) y los cuatro esquemas.
3. Najdorf: sextas jugadas (`Ag5`, `Ae3`, `Ac4`, `Ae2`, `f4`).
4. Najdorf profundo: línea principal, Polugaevsky y peón envenenado.
5. Dragón y Ataque Yugoslavo.
6. Scheveningen y Ataque Keres.
7. Clásica / Richter-Rauzer / Sozin.
8. Sveshnikov.
9. Taimanov y Kan.
10. Antisicilianas (Alapin, Cerrada, Smith-Morra, Rossolimo, Moscú, McDonnell, ala).
11. Repaso total.

## 6. Notas para el modo Practicar (bot)

- El bot juega las **Blancas** y elige entre las ramas del árbol. Pesos adaptativos (más peso a lo que el usuario domina menos).
- Dividir en **módulos** (Najdorf, Dragón, Scheveningen, Clásica, Sveshnikov, Taimanov/Kan, Antisicilianas) con porcentaje de dominio por módulo y uno global.
- Árbol guiado por **posición (FEN)**, no solo por secuencia, por las transposiciones.
- La base de Lichess llega solo a la profundidad de "la variante con nombre"; para entrenar hasta el final de cada línea hace falta una fuente de teoría más profunda (ver README).

## 7. Catálogo completo (generado de la base de Lichess)

Todas las líneas de la base de Lichess para la Siciliana, agrupadas por familia, con las jugadas en notación española. Datos: [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) (CC0), validados con el motor de MorphiqChess.

### Índice de familias

| Familia (nombre de Lichess) | ECO | Líneas | Línea de entrada |
|---|---|---:|---|
| (línea base) | B20–B50 | 4 | `1.e4 c5` |
| Bowdler Attack | B20 | 1 | `1.e4 c5 2.Ac4` |
| King David's Opening | B20 | 1 | `1.e4 c5 2.Re2` |
| Kronberger Variation | B20 | 2 | `1.e4 c5 2.Ca3` |
| Closed | B23–B30 | 26 | `1.e4 c5 2.Cc3` |
| Grand Prix Attack | B23 | 2 | `1.e4 c5 2.Cc3 Cc6 3.f4` |
| Dragon Variation | B35–B79 | 43 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 g6` |
| Keres Variation | B20 | 1 | `1.e4 c5 2.Ce2` |
| Old Sicilian | B30 | 1 | `1.e4 c5 2.Cf3 Cc6` |
| Nyezhmetdinov-Rossolimo Attack | B30–B31 | 8 | `1.e4 c5 2.Cf3 Cc6 3.Ab5` |
| Portsmouth Gambit | B30 | 1 | `1.e4 c5 2.Cf3 Cc6 3.b4` |
| Open | B32–B33 | 4 | `1.e4 c5 2.Cf3 Cc6 3.d4` |
| Classical Variation | B56–B58 | 6 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6` |
| Sozin Attack | B86–B89 | 6 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4` |
| Velimirovic Attack | B89 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 e6 7.Ae3 Ae7 8.De2` |
| Magnus Smith Trap | B57 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 g6 7.Cxc6 bxc6 8.e5` |
| Boleslavsky Variation | B58–B59 | 3 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ae2 e5` |
| Richter-Rauzer Variation | B60–B69 | 21 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5` |
| Spielmann Variation | B56 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Cde2` |
| Lasker-Pelikan Variation | B33 | 10 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5` |
| Godiva Variation | B32 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Db6` |
| Flohr Variation | B32 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Dc7` |
| O'Kelly Variation | B28–B32 | 21 | `1.e4 c5 2.Cf3 a6` |
| Nimzo-American Variation | B32 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 d5` |
| Löwenthal Variation | B32 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 e5` |
| Kalashnikov Variation | B32 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 e5 5.Cb5 d6` |
| Accelerated Dragon | B32–B39 | 10 | `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6` |
| Franco-Sicilian Variation | B32 | 1 | `1.e4 c5 2.Cf3 Cc6 3.d4 e6` |
| Nimzowitsch Variation | B29 | 5 | `1.e4 c5 2.Cf3 Cf6` |
| Najdorf Variation | B84–B99 | 33 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6` |
| Mongoose Variation | B27 | 1 | `1.e4 c5 2.Cf3 Da5` |
| Quinteros Variation | B27 | 1 | `1.e4 c5 2.Cf3 Dc7` |
| Polish Gambit | B27 | 1 | `1.e4 c5 2.Cf3 b5` |
| Katalimov Variation | B27 | 1 | `1.e4 c5 2.Cf3 b6` |
| Modern Variations | B50–B54 | 6 | `1.e4 c5 2.Cf3 d6` |
| Moscow Variation | B51–B52 | 6 | `1.e4 c5 2.Cf3 d6 3.Ab5+` |
| Kopec System | B50 | 1 | `1.e4 c5 2.Cf3 d6 3.Ad3` |
| Wing Gambit | B20–B50 | 9 | `1.e4 c5 2.b4` |
| Delayed Alapin Variation | B22–B50 | 6 | `1.e4 c5 2.Cf3 d6 3.c3` |
| Kupreichik Variation | B56 | 1 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Ad7` |
| Scheveningen Variation | B80–B90 | 20 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6` |
| Venice Attack | B56 | 1 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Ab5+` |
| Prins Variation | B54–B55 | 2 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.f3` |
| Chekhover Variation | B53 | 2 | `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Dxd4` |
| Kotov Gambit | B50 | 1 | `1.e4 c5 2.Cf3 d6 3.g3 b5` |
| Jalalabad Variation | B27 | 1 | `1.e4 c5 2.Cf3 e5` |
| French Variation | B40 | 4 | `1.e4 c5 2.Cf3 e6` |
| Kan Variation | B40–B43 | 15 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6` |
| Wing Gambit Deferred | B40 | 1 | `1.e4 c5 2.Cf3 e6 3.b4` |
| Alapin Variation | B22–B40 | 13 | `1.e4 c5 2.c3` |
| Kramnik Variation | B40 | 1 | `1.e4 c5 2.Cf3 e6 3.c4` |
| Drazic Variation | B40 | 1 | `1.e4 c5 2.Cf3 e6 3.d4 a6` |
| Paulsen-Basman Defense | B40 | 1 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Ac5` |
| Taimanov Variation | B44–B49 | 10 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6` |
| Four Knights Variation | B45 | 5 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Cf6` |
| Pin Variation | B40 | 3 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Ab4` |
| Gaw-Paw Variation | B40 | 1 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Db6` |
| Kveinis Variation | B40 | 1 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Db6` |
| Smith-Morra Gambit Deferred | B40 | 1 | `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.c3` |
| Marshall Counterattack | B40 | 1 | `1.e4 c5 2.Cf3 e6 3.d4 d5` |
| Brussels Gambit | B27 | 1 | `1.e4 c5 2.Cf3 f5` |
| Double-Dutch Gambit | B27 | 1 | `1.e4 c5 2.Cf3 f5 3.exf5 Ch6` |
| Hyperaccelerated Dragon | B27 | 2 | `1.e4 c5 2.Cf3 g6` |
| Acton Extension | B27 | 1 | `1.e4 c5 2.Cf3 g6 3.c4 Ah6` |
| Hyperaccelerated Pterodactyl | B27 | 2 | `1.e4 c5 2.Cf3 g6 3.d4 Ag7` |
| Frederico Variation | B27 | 1 | `1.e4 c5 2.Cf3 g6 3.d4 f5` |
| Bücker Variation | B27 | 1 | `1.e4 c5 2.Cf3 h6` |
| Brick Variation | B20 | 1 | `1.e4 c5 2.Ch3` |
| Amazon Attack | B20 | 1 | `1.e4 c5 2.Dg4` |
| Mengarini Variation | B20 | 1 | `1.e4 c5 2.a3` |
| Myers Attack | B20 | 2 | `1.e4 c5 2.a4` |
| Czerniak Attack | B20 | 2 | `1.e4 c5 2.b3` |
| Euwe Attack | B20 | 1 | `1.e4 c5 2.b3 d5 3.Ab2` |
| Heidenfeld Variation | B22 | 1 | `1.e4 c5 2.c3 Cf6 3.e5 Cd5 4.Cf3 Cc6 5.Ca3` |
| Staunton-Cochrane Variation | B20 | 1 | `1.e4 c5 2.c4` |
| Gloria Variation | B20 | 1 | `1.e4 c5 2.c4 d6 3.Cc3 Cc6 4.g3 h5` |
| Big Clamp Formation | B20 | 1 | `1.e4 c5 2.d3 Cc6 3.c3 d6 4.f4` |
| Smith-Morra Gambit | B21 | 2 | `1.e4 c5 2.d4` |
| Morphy Gambit | B21 | 2 | `1.e4 c5 2.d4 cxd4 3.Cf3` |
| Coles Sicilian Gambit | B21 | 1 | `1.e4 c5 2.d4 cxd4 3.Dxd4 Cc6 4.Dd1 Cf6 5.Ac4` |
| Smith-Morra Gambit Declined | B21 | 6 | `1.e4 c5 2.d4 cxd4 3.c3 Cf6` |
| Smith-Morra Gambit Accepted | B21 | 21 | `1.e4 c5 2.d4 cxd4 3.c3 dxc3` |
| Halasz Gambit | B21 | 1 | `1.e4 c5 2.d4 cxd4 3.f4` |
| McDonnell Attack | B21 | 8 | `1.e4 c5 2.f4` |
| Lasker-Dunne Attack | B20 | 1 | `1.e4 c5 2.g3` |
| Grob Variation | B20 | 1 | `1.e4 c5 2.g4` |

<details>
<summary>Ver las 400 líneas</summary>

#### (línea base)
*B20–B50 · 4 líneas*

- **B20** Línea base · `1.e4 c5`
- **B27** Línea base · `1.e4 c5 2.Cf3`
- **B50** Línea base · `1.e4 c5 2.Cf3 d6 3.d4`
- **B50** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4`

#### Bowdler Attack
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.Ac4`

#### King David's Opening
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.Re2`

#### Kronberger Variation
*B20 · 2 líneas*

- **B20** Línea base · `1.e4 c5 2.Ca3`
- **B20** Nemeth Gambit · `1.e4 c5 2.Ca3 Cc6 3.d4 cxd4 4.Ac4`

#### Closed
*B23–B30 · 26 líneas*

- **B23** Línea base · `1.e4 c5 2.Cc3`
- **B23** Traditional · `1.e4 c5 2.Cc3 Cc6`
- **B23** Chameleon Variation · `1.e4 c5 2.Cc3 Cc6 3.Cge2`
- **B23** Portland Attack · `1.e4 c5 2.Cc3 Cc6 3.d3 g6 4.g4`
- **B24** Fianchetto Variation · `1.e4 c5 2.Cc3 Cc6 3.g3`
- **B24** Línea base · `1.e4 c5 2.Cc3 Cc6 3.g3 g6`
- **B24** Línea base · `1.e4 c5 2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7`
- **B25** Línea base · `1.e4 c5 2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7 5.d3 d6`
- **B26** Línea base · `1.e4 c5 2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7 5.d3 d6 6.Ae3`
- **B25** Botvinnik Defense, with Cge2 · `1.e4 c5 2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7 5.d3 d6 6.Cge2 e5`
- **B25** Línea base · `1.e4 c5 2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7 5.d3 d6 6.f4`
- **B25** Botvinnik Defense, with f4 · `1.e4 c5 2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7 5.d3 d6 6.f4 e5`
- **B25** Botvinnik Defense, Edge Variation · `1.e4 c5 2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7 5.d3 d6 6.f4 e5 7.Ch3 Cge7`
- **B24** Smyslov Variation · `1.e4 c5 2.Cc3 Cc6 3.g3 g6 4.Ag2 Ag7 5.d3 e6 6.Ae3 Cd4 7.Cce2`
- **B23** Grob Attack · `1.e4 c5 2.Cc3 Cc6 3.g4`
- **B23** Carlsen Variation · `1.e4 c5 2.Cc3 d6 3.d4 cxd4 4.Dxd4 Cc6 5.Dd2`
- **B23** Línea base · `1.e4 c5 2.Cc3 e6`
- **B23** Línea base · `1.e4 c5 2.Cc3 e6 3.Cge2 a6 4.g3`
- **B23** Línea base · `1.e4 c5 2.Cc3 e6 3.f4 Cc6 4.Cf3 d5`
- **B23** Línea base · `1.e4 c5 2.Cc3 e6 3.f4 Cc6 4.Cf3 d5 5.Ab5`
- **B23** Línea base · `1.e4 c5 2.Cc3 e6 3.g3`
- **B23** Korchnoi Defense · `1.e4 c5 2.Cc3 e6 3.g3 d5`
- **B30** Anti-Sveshnikov Variation · `1.e4 c5 2.Cf3 Cc6 3.Cc3 e5`
- **B30** Anti-Sveshnikov Variation, with Cf6 · `1.e4 c5 2.Cf3 Cc6 3.Cc3 e5 4.Ac4 Ae7 5.d3 Cf6`
- **B30** Anti-Sveshnikov Variation, with d6 · `1.e4 c5 2.Cf3 Cc6 3.Cc3 e5 4.Ac4 Ae7 5.d3 d6`
- **B30** Anti-Sveshnikov Variation, Kharlov-Kramnik Line · `1.e4 c5 2.Cf3 Cc6 3.Cc3 e5 4.Ac4 Ae7 5.d3 d6 6.Cd2 Ag5`

#### Grand Prix Attack
*B23 · 2 líneas*

- **B23** Línea base · `1.e4 c5 2.Cc3 Cc6 3.f4`
- **B23** Schofman Variation · `1.e4 c5 2.Cc3 Cc6 3.f4 g6 4.Cf3 Ag7 5.Ac4 e6 6.f5`

#### Dragon Variation
*B35–B79 · 43 líneas*

- **B74** Classical Variation, Stockholm Attack · `1.e4 c5 2.Cc3 d6 3.f4 Cc6 4.Cf3 g6 5.d4 cxd4 6.Cxd4 Ag7 7.Ae3 Cf6 8.Ae2 O-O 9.Cb3 Ae6 10.O-O Ca5 11.f5 Ac4 12.Cxa5 Axe2 13.Dxe2 Dxa5 14.g4`
- **B72** Classical Variation, Amsterdam Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ae2 g6 7.Ae3 Ag7 8.Dd2`
- **B72** Classical Variation, Grigoriev Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ae2 g6 7.Ae3 Ag7 8.Dd2 O-O 9.O-O-O`
- **B73** Classical Variation, Zollner Gambit · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.Ae3 Ag7 6.Ae2 Cf6 7.Cc3 O-O 8.O-O d6 9.f4 Db6 10.e5`
- **B35** Modern Ac4 Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.Cc3 Ag7 6.Ae3 Cf6 7.Ac4 d6`
- **B74** Classical Variation, Spielmann Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.Cc3 Ag7 6.Ae3 Cf6 7.Ae2 O-O 8.Cb3 d6 9.O-O Ae6 10.f4 Ca5 11.f5 Ac4 12.Ad3`
- **B74** Classical Variation, Alekhine Line · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.Cc3 Ag7 6.Ae3 Cf6 7.Ae2 O-O 8.O-O d6 9.Cb3 a5`
- **B70** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6`
- **B70** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae2`
- **B73** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae2 Ag7 7.O-O Cc6 8.Ae3`
- **B74** Classical Variation, Normal Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae2 Ag7 7.O-O O-O 8.Ae3 Cc6 9.Cb3`
- **B74** Classical Variation, Maróczy Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae2 Ag7 7.O-O O-O 8.Ae3 Cc6 9.Cb3 Ae6 10.f4 Ca5`
- **B74** Classical Variation, Tartakower Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae2 Ag7 7.O-O O-O 8.Ae3 Cc6 9.Cb3 Ae6 10.f4 Dc8`
- **B73** Classical Variation, Battery Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae2 Ag7 7.O-O O-O 8.Ae3 Cc6 9.Dd2`
- **B72** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3`
- **B72** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.Ae2`
- **B72** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.Ae2 Cc6`
- **B72** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.Ae2 Cc6 8.Cb3`
- **B75** Yugoslav Attack, Early Deviations · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3`
- **B75** Yugoslav Attack, Belezky Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 Cc6`
- **B77** Yugoslav Attack, Sosonko Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 Cc6 8.Dd2 O-O 9.Ac4 Cd7`
- **B77** Yugoslav Attack, Czerniak Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 Cc6 8.Dd2 O-O 9.Ac4 Cxd4 10.Axd4 Ae6`
- **B77** Yugoslav Attack, Czerniak Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 Cc6 8.Dd2 O-O 9.Ac4 Cxd4 10.Axd4 Ae6 11.Ab3 Da5`
- **B76** Yugoslav Attack, Modern Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 Cc6 8.Dd2 O-O 9.O-O-O`
- **B76** Yugoslav Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O`
- **B76** Yugoslav Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6`
- **B77** Yugoslav Attack, Main Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4`
- **B77** Yugoslav Attack, Main Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7`
- **B77** Yugoslav Attack, Main Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.Ab3`
- **B78** Yugoslav Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.O-O-O`
- **B79** Yugoslav Attack, Soltis Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.O-O-O Da5 11.h4 Tfc8 12.Ab3 h5`
- **B78** Yugoslav Attack, Chinese Dragon · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.O-O-O Tb8`
- **B78** Yugoslav Attack, Old Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.O-O-O Tc8`
- **B78** Yugoslav Attack, Topalov Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.O-O-O Tc8 11.Ab3 Cxd4 12.Axd4`
- **B79** Yugoslav Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 Ad7 10.h4 Da5 11.O-O-O Tfc8 12.Ab3`
- **B77** Yugoslav Attack, Byrne Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.Ac4 a5`
- **B76** Yugoslav Attack, Panov Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Ag7 7.f3 O-O 8.Dd2 Cc6 9.g4`
- **B75** Yugoslav Attack, Hungarian Dragon · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.Ae3 Cc6 7.f3 h5`
- **B71** Levenfish Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.f4`
- **B71** Levenfish Variation, Main Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.f4 Cbd7`
- **B70** Fianchetto Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 g6 6.g3`
- **B54** Accelerated Dragon · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 g6`
- **B74** Classical Variation, Bernard Defense · `1.e4 c5 2.Cf3 g6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ae2 Ag7 7.O-O O-O 8.Ae3 Cc6 9.Cb3 Ae6 10.f4 Ca5 11.f5 Ac4 12.Ad3 Axd3 13.cxd3 d5`

#### Keres Variation
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.Ce2`

#### Old Sicilian
*B30 · 1 línea*

- **B30** Línea base · `1.e4 c5 2.Cf3 Cc6`

#### Nyezhmetdinov-Rossolimo Attack
*B30–B31 · 8 líneas*

- **B30** Línea base · `1.e4 c5 2.Cf3 Cc6 3.Ab5`
- **B30** San Francisco Gambit · `1.e4 c5 2.Cf3 Cc6 3.Ab5 Ca5 4.b4`
- **B30** Brooklyn Retreat Defense · `1.e4 c5 2.Cf3 Cc6 3.Ab5 Cb8`
- **B31** Fianchetto Variation · `1.e4 c5 2.Cf3 Cc6 3.Ab5 g6`
- **B31** Gurgenidze Variation · `1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.Te1 e5 6.b4`
- **B31** Fianchetto Variation, Totsky Attack · `1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.c3 Cf6 6.Da4`
- **B31** Fianchetto Variation, Lutikov Gambit · `1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.c3 Cf6 6.d4`
- **B31** Fianchetto Variation, Gufeld Gambit · `1.e4 c5 2.Cf3 Cc6 3.Ab5 g6 4.O-O Ag7 5.c3 e5 6.d4`

#### Portsmouth Gambit
*B30 · 1 línea*

- **B30** Línea base · `1.e4 c5 2.Cf3 Cc6 3.b4`

#### Open
*B32–B33 · 4 líneas*

- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4`
- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4`
- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4`
- **B33** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6`

#### Classical Variation
*B56–B58 · 6 líneas*

- **B57** Anti-Sozin Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 Db6`
- **B56** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6`
- **B57** Sozin Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ac4`
- **B58** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ae2`
- **B58** Dragon Transfer · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ae2 Cxd4 7.Dxd4 g6`
- **B56** Fianchetto Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.g3`

#### Sozin Attack
*B86–B89 · 6 líneas*

- **B88** Leonhardt Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 e6`
- **B88** Fischer Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 e6 7.Ab3 Ae7 8.Ae3 O-O 9.f4`
- **B89** Main Line · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 e6 7.Ae3`
- **B89** Main Line, Sherbakov Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ac4 e6 7.Ae3 Ae7 8.Ab3 O-O 9.O-O Ca5 10.f4 b6`
- **B87** Flank Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ac4 e6 7.Ab3 b5`
- **B86** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4`

#### Velimirovic Attack
*B89 · 1 línea*

- **B89** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 e6 7.Ae3 Ae7 8.De2`

#### Magnus Smith Trap
*B57 · 1 línea*

- **B57** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ac4 g6 7.Cxc6 bxc6 8.e5`

#### Boleslavsky Variation
*B58–B59 · 3 líneas*

- **B59** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ae2 e5 7.Cb3`
- **B58** Louma Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ae2 e5 7.Cxc6`
- **B58** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ae2 e5`

#### Richter-Rauzer Variation
*B60–B69 · 21 líneas*

- **B61** Modern Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ag5 Ad7 7.Dd2`
- **B62** Podebrady Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ag5 e6 7.Cb3`
- **B64** Classical Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ag5 e6 7.Dd2 Ae7 8.O-O-O O-O 9.f4 e5`
- **B67** Neo-Modern Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ag5 e6 7.Dd2 a6 8.O-O-O Ad7`
- **B68** Neo-Modern Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ag5 e6 7.Dd2 a6 8.O-O-O Ad7 9.f4 Ae7`
- **B69** Neo-Modern Variation, Nyezhmetdinov Attack · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ag5 e6 7.Dd2 a6 8.O-O-O Ad7 9.f4 Ae7 10.Cf3 b5 11.Axf6`
- **B60** Dragon Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ag5 g6`
- **B60** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5`
- **B60** Modern Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 Ad7`
- **B62** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6`
- **B62** Vitolins Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Ab5`
- **B62** Exchange Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Cxc6`
- **B63** Traditional Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd2`
- **B63** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd2 Ae7`
- **B63** Classical Variation, Kantscher Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd2 Ae7 8.O-O-O Cxd4 9.Dxd4 a6 10.f4 b5`
- **B64** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd2 Ae7 8.O-O-O O-O 9.f4`
- **B65** Rauzer Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd2 Ae7 8.O-O-O O-O 9.f4 Cxd4`
- **B65** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd2 Ae7 8.O-O-O O-O 9.f4 Cxd4 10.Dxd4`
- **B63** Ivanov Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd2 Db6`
- **B66** Neo-Modern Variation, Early Deviations · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd2 a6`
- **B62** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Cc6 6.Ag5 e6 7.Dd3`

#### Spielmann Variation
*B56 · 1 línea*

- **B56** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Cde2`

#### Lasker-Pelikan Variation
*B33 · 10 líneas*

- **B33** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5`
- **B33** Schlechter Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cb3`
- **B33** Bird Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cdb5 d6 7.Ag5 a6 8.Ca3 Ae6`
- **B33** Sveshnikov Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cdb5 d6 7.Ag5 a6 8.Ca3 b5`
- **B33** Sveshnikov Variation, Novosibirsk Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cdb5 d6 7.Ag5 a6 8.Ca3 b5 9.Axf6 gxf6 10.Cd5 Ag7`
- **B33** Sveshnikov Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cdb5 d6 7.Ag5 a6 8.Ca3 b5 9.Axf6 gxf6 10.Cd5 f5`
- **B33** Sveshnikov Variation, Peresypkin's Sacrifice · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cdb5 d6 7.Ag5 a6 8.Ca3 b5 9.Axf6 gxf6 10.Cd5 f5 11.Axb5`
- **B33** Sveshnikov Variation, Chelyabinsk Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cdb5 d6 7.Ag5 a6 8.Ca3 b5 9.Cd5`
- **B33** Retreat Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cf3`
- **B33** Exchange Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Cxc6`

#### Godiva Variation
*B32 · 1 línea*

- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Db6`

#### Flohr Variation
*B32 · 1 línea*

- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 Dc7`

#### O'Kelly Variation
*B28–B32 · 21 líneas*

- **B32** Maróczy Bind, Geller Line · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 a6 5.c4 e5`
- **B28** Línea base · `1.e4 c5 2.Cf3 a6`
- **B28** Aronin System · `1.e4 c5 2.Cf3 a6 3.Ae2`
- **B28** Yerevan System · `1.e4 c5 2.Cf3 a6 3.Cc3`
- **B28** Kieseritzky System · `1.e4 c5 2.Cf3 a6 3.b3`
- **B28** Wing Gambit · `1.e4 c5 2.Cf3 a6 3.b4`
- **B28** Venice System · `1.e4 c5 2.Cf3 a6 3.c3`
- **B28** Venice System, Barcza Line · `1.e4 c5 2.Cf3 a6 3.c3 Cf6`
- **B28** Venice System, Ljubojevic Line · `1.e4 c5 2.Cf3 a6 3.c3 b5`
- **B28** Venice System, Gambit Line · `1.e4 c5 2.Cf3 a6 3.c3 d5 4.exd5 Cf6`
- **B28** Venice System, Steiner Line · `1.e4 c5 2.Cf3 a6 3.c3 d6`
- **B28** Maróczy Bind · `1.e4 c5 2.Cf3 a6 3.c4`
- **B28** Maróczy Bind, Robatsch Line · `1.e4 c5 2.Cf3 a6 3.c4 d6`
- **B28** Maróczy Bind, Paulsen Line · `1.e4 c5 2.Cf3 a6 3.c4 e6`
- **B28** Quiet System · `1.e4 c5 2.Cf3 a6 3.d3`
- **B28** Normal System · `1.e4 c5 2.Cf3 a6 3.d4`
- **B28** Normal System, Cortlever Gambit · `1.e4 c5 2.Cf3 a6 3.d4 cxd4 4.Ac4`
- **B28** Normal System, Taimanov Line · `1.e4 c5 2.Cf3 a6 3.d4 cxd4 4.Cxd4 e5`
- **B28** Normal System, Zagorovsky Line · `1.e4 c5 2.Cf3 a6 3.d4 cxd4 4.Dxd4`
- **B28** Normal System, Smith-Morra Line · `1.e4 c5 2.Cf3 a6 3.d4 cxd4 4.c3`
- **B28** Réti System · `1.e4 c5 2.Cf3 a6 3.g3`

#### Nimzo-American Variation
*B32 · 1 línea*

- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 d5`

#### Löwenthal Variation
*B32 · 1 línea*

- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 e5`

#### Kalashnikov Variation
*B32 · 1 línea*

- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 e5 5.Cb5 d6`

#### Accelerated Dragon
*B32–B39 · 10 líneas*

- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6`
- **B34** Modern Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.Cc3`
- **B35** Modern Ac4 Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.Cc3 Ag7 6.Ae3 Cf6 7.Ac4`
- **B34** Exchange Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.Cxc6`
- **B36** Maróczy Bind · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.c4`
- **B37** Maróczy Bind · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.c4 Ag7`
- **B38** Maróczy Bind · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.c4 Ag7 6.Ae3`
- **B39** Maróczy Bind, Breyer Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.c4 Ag7 6.Ae3 Cf6 7.Cc3 Cg4`
- **B37** Simagin Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.c4 Ag7 6.Cc2 d6 7.Ae2 Ch6`
- **B36** Maróczy Bind, Gurgenidze Variation · `1.e4 c5 2.Cf3 Cc6 3.d4 cxd4 4.Cxd4 g6 5.c4 Cf6 6.Cc3 Cxd4 7.Dxd4 d6`

#### Franco-Sicilian Variation
*B32 · 1 línea*

- **B32** Línea base · `1.e4 c5 2.Cf3 Cc6 3.d4 e6`

#### Nimzowitsch Variation
*B29 · 5 líneas*

- **B29** Línea base · `1.e4 c5 2.Cf3 Cf6`
- **B29** Closed Variation · `1.e4 c5 2.Cf3 Cf6 3.Cc3`
- **B29** Advance Variation · `1.e4 c5 2.Cf3 Cf6 3.e5`
- **B29** Exchange Variation · `1.e4 c5 2.Cf3 Cf6 3.e5 Cd5 4.Cc3 Cxc3`
- **B29** Main Line · `1.e4 c5 2.Cf3 Cf6 3.e5 Cd5 4.Cc3 e6 5.Cxd5 exd5 6.d4 Cc6`

#### Najdorf Variation
*B84–B99 · 33 líneas*

- **B92** Opocensky Variation · `1.e4 c5 2.Cf3 Cf6 3.Cc3 d6 4.d4 cxd4 5.Cxd4 a6 6.Ae2 e5 7.Cb3 Ae6 8.Ae3`
- **B90** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6`
- **B90** Lipnitsky Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ac4`
- **B90** Yates Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ad3`
- **B92** Opocensky Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae2`
- **B92** Opocensky Variation, Modern Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae2 e5 7.Cb3 Ae7 8.O-O Ae6`
- **B92** Opocensky Variation, Traditional Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae2 e5 7.Cb3 Ae7 8.O-O O-O`
- **B84** Scheveningen Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae2 e6 7.O-O Cbd7`
- **B90** English Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3`
- **B90** English Attack, Anti-English · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 Cg4`
- **B90** English Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e5 7.Cb3 Ae6 8.f3`
- **B90** English Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e5 7.Cb3 Ae6 8.h3`
- **B90** English Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e5 7.Cb3 Ae7 8.f3`
- **B90** English Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e5 7.Cb3 Ae7 8.h3`
- **B94** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5`
- **B94** Ivkov Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 Cbd7 7.Ac4 Da5 8.Dd2 e6 9.O-O-O b5 10.Ab3 Ab7 11.The1 Cc5 12.e5`
- **B95** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6`
- **B96** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4`
- **B98** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 Ae7`
- **B98** Traditional Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 Ae7 8.Df3 Dc7`
- **B99** Main Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 Ae7 8.Df3 Dc7 9.O-O-O Cbd7`
- **B98** Browne Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 Ae7 8.Df3 h6 9.Ah4 Dc7`
- **B98** Goteborg Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 Ae7 8.Df3 h6 9.Ah4 g5`
- **B96** Neo-Classical Defense · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 Cc6`
- **B97** Poisoned Pawn Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 Db6`
- **B97** Poisoned Pawn Accepted · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 Db6 8.Dd2 Dxb2 9.Tb1 Da3`
- **B96** Polugaevsky Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 b5`
- **B96** Polugaevsky Variation, Simagin Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ag5 e6 7.f4 b5 8.e5 dxe5 9.fxe5 Dc7 10.De2`
- **B90** Petronić Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Tg1`
- **B93** Amsterdam Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.f4`
- **B91** Zagreb Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.g3`
- **B90** Dekker Gambit · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.g4`
- **B90** Adams Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.h3`

#### Mongoose Variation
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 Da5`

#### Quinteros Variation
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 Dc7`

#### Polish Gambit
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 b5`

#### Katalimov Variation
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 b6`

#### Modern Variations
*B50–B54 · 6 líneas*

- **B50** Línea base · `1.e4 c5 2.Cf3 d6`
- **B50** Anti-Dxd4 Move Order · `1.e4 c5 2.Cf3 d6 3.d4 Cf6`
- **B50** Anti-Dxd4 Move Order Accepted · `1.e4 c5 2.Cf3 d6 3.d4 Cf6 4.dxc5 Cxe4`
- **B54** Main Line · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6`
- **B54** Ginsberg Gambit · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Ac4`
- **B50** Tartakower · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.c3`

#### Moscow Variation
*B51–B52 · 6 líneas*

- **B51** Línea base · `1.e4 c5 2.Cf3 d6 3.Ab5+`
- **B52** Main Line · `1.e4 c5 2.Cf3 d6 3.Ab5+ Ad7`
- **B52** Haag Gambit · `1.e4 c5 2.Cf3 d6 3.Ab5+ Ad7 4.Axd7+ Dxd7 5.O-O Cc6 6.c3 Cf6 7.d4`
- **B52** Sokolsky Variation · `1.e4 c5 2.Cf3 d6 3.Ab5+ Ad7 4.Axd7+ Dxd7 5.c4`
- **B51** Dorfman Gambit · `1.e4 c5 2.Cf3 d6 3.Ab5+ Cc6 4.O-O Ad7 5.De2 g6 6.e5`
- **B51** Moscow Gambit · `1.e4 c5 2.Cf3 d6 3.Ab5+ Cc6 4.O-O Ad7 5.c3 Cf6 6.Te1 a6 7.Axc6 Axc6 8.d4 Axe4 9.Ag5`

#### Kopec System
*B50 · 1 línea*

- **B50** Línea base · `1.e4 c5 2.Cf3 d6 3.Ad3`

#### Wing Gambit
*B20–B50 · 9 líneas*

- **B50** Deferred Variation · `1.e4 c5 2.Cf3 d6 3.b4`
- **B20** Línea base · `1.e4 c5 2.b4`
- **B20** Abrahams Variation · `1.e4 c5 2.b4 cxb4 3.Ab2`
- **B20** Marshall Variation · `1.e4 c5 2.b4 cxb4 3.a3`
- **B20** Carlsbad Variation · `1.e4 c5 2.b4 cxb4 3.a3 bxa3`
- **B20** Marienbad Variation · `1.e4 c5 2.b4 cxb4 3.a3 d5 4.exd5 Dxd5 5.Ab2`
- **B20** Romanian Defense · `1.e4 c5 2.b4 cxb4 3.a3 d5 4.exd5 Dxd5 5.Cf3 e5 6.Ab2 Cc6 7.c4 De6`
- **B20** Nanu Gambit · `1.e4 c5 2.b4 cxb4 3.a3 d5 4.exd5 Dxd5 5.Cf3 e5 6.c4 De6 7.Ad3`
- **B20** Santasiere Variation · `1.e4 c5 2.b4 cxb4 3.c4`

#### Delayed Alapin Variation
*B22–B50 · 6 líneas*

- **B50** with d6 · `1.e4 c5 2.Cf3 d6 3.c3`
- **B50** Basman-Palatnik Gambit · `1.e4 c5 2.Cf3 d6 3.c3 Cf6 4.Ae2 Cc6 5.d4 cxd4 6.cxd4 Cxe4`
- **B50** Basman-Palatnik Double Gambit · `1.e4 c5 2.Cf3 d6 3.c3 Cf6 4.Ae2 Cc6 5.d4 cxd4 6.cxd4 Cxe4 7.d5 Da5+ 8.Cc3 Cxc3 9.bxc3`
- **B40** with e6 · `1.e4 c5 2.Cf3 e6 3.c3`
- **B22** Línea base · `1.e4 c5 2.Cf3 e6 3.c3 d5 4.exd5 Dxd5 5.d4 Cf6`
- **B22** Línea base · `1.e4 c5 2.Cf3 e6 3.c3 d5 4.exd5 exd5 5.Ab5+ Cc6 6.O-O Ad6 7.d4`

#### Kupreichik Variation
*B56 · 1 línea*

- **B56** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Ad7`

#### Scheveningen Variation
*B80–B90 · 20 líneas*

- **B84** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae2 e6`
- **B84** Classical Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae2 e6 7.O-O Dc7`
- **B80** English Attack, with Dd2 · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e6 7.Dd2`
- **B90** English Attack, with f3 · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e6 7.f3`
- **B90** Delayed Keres Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e6 7.g4`
- **B90** Delayed Keres Attack, Perenyi Gambit · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.Ae3 e6 7.g4 e5 8.Cf5 g6 9.g5`
- **B85** Classical Variation, Paulsen Variation · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 a6 6.f4 e6 7.Ae2 Dc7 8.O-O Cc6`
- **B85** Classical Main Line · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Dc7 6.Ae2 a6 7.O-O Cf6 8.Ae3 Ae7 9.f4 d6 10.De1 O-O`
- **B85** Classical Variation, Paulsen Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Dc7 6.Ae2 a6 7.O-O Cf6 8.Ae3 d6 9.f4`
- **B85** Classical Variation, Paulsen Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Dc7 6.Ae2 a6 7.O-O Cf6 8.Rh1 Ae7 9.f4 d6 10.a4`
- **B83** Modern Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 d6 6.Ae2 Cf6`
- **B80** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6`
- **B80** Vitolins Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ab5+`
- **B83** Classical Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ae2`
- **B83** Modern Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ae2 Ae7 7.O-O O-O 8.f4 Cc6 9.Ae3`
- **B83** Modern Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.Ae2 Ae7 7.O-O O-O 8.f4 Cc6 9.Ae3 Ad7 10.Cb3`
- **B82** Matanovic Attack · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.f4`
- **B82** Tal Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.f4 Cc6 7.Ae3 Ae7 8.Df3`
- **B80** Fianchetto Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.g3`
- **B81** Keres Attack · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 d6 6.g4`

#### Venice Attack
*B56 · 1 línea*

- **B56** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 e5 6.Ab5+`

#### Prins Variation
*B54–B55 · 2 líneas*

- **B54** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.f3`
- **B55** Venice Attack · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Cxd4 Cf6 5.f3 e5 6.Ab5+`

#### Chekhover Variation
*B53 · 2 líneas*

- **B53** Línea base · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Dxd4`
- **B53** Zaitsev Defense · `1.e4 c5 2.Cf3 d6 3.d4 cxd4 4.Dxd4 Cc6 5.Ab5 Dd7`

#### Kotov Gambit
*B50 · 1 línea*

- **B50** Línea base · `1.e4 c5 2.Cf3 d6 3.g3 b5`

#### Jalalabad Variation
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 e5`

#### French Variation
*B40 · 4 líneas*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6`
- **B40** Westerinen Attack · `1.e4 c5 2.Cf3 e6 3.b3`
- **B40** Open · `1.e4 c5 2.Cf3 e6 3.d4 cxd4`
- **B40** Normal · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6`

#### Kan Variation
*B40–B43 · 15 líneas*

- **B40** Wing Attack, Fianchetto Variation · `1.e4 c5 2.Cf3 e6 3.Cc3 a6 4.g3 b5 5.d4 cxd4 6.Cxd4`
- **B41** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6`
- **B42** Modern Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Ad3`
- **B42** Polugaevsky Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Ad3 Ac5`
- **B42** Gipslis Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Ad3 Cf6 6.O-O d6 7.c4 g6`
- **B42** Swiss Cheese Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Ad3 g6`
- **B43** Knight Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Cc3`
- **B43** Wing Attack · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Cc3 b5`
- **B43** Wing Attack, Christiansen's Dream · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Cc3 b5 6.Ad3 Db6 7.Ae3 Ac5 8.Dg4`
- **B43** Wing Attack, Spraggett Attack · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Cc3 b5 6.Ad3 Db6 7.Cf3`
- **B43** Knight Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.Cc3 b5 6.g3 Ab7 7.Ag2`
- **B41** Maróczy Bind, Réti Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.c4`
- **B41** Maróczy Bind, Bronstein Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.c4 Cf6 6.Cc3 Ab4 7.Ad3 Cc6`
- **B41** Maróczy Bind, Bronstein Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.c4 Cf6 6.Cc3 Ab4 7.Ad3 Cc6 8.Ac2`
- **B41** Maróczy Bind, Hedgehog Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 a6 5.c4 g6`

#### Wing Gambit Deferred
*B40 · 1 línea*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.b4`

#### Alapin Variation
*B22–B40 · 13 líneas*

- **B40** Sherzer Variation · `1.e4 c5 2.Cf3 e6 3.c3 Cf6 4.e5 Cd5 5.d4 Cc6`
- **B22** Línea base · `1.e4 c5 2.c3`
- **B22** Stoltz Attack · `1.e4 c5 2.c3 Cf6 3.e5 Cd5 4.Cf3 Cc6 5.Ac4 Cb6 6.Ab3`
- **B22** Stoltz Attack, Ivanchuk Line · `1.e4 c5 2.c3 Cf6 3.e5 Cd5 4.Cf3 Cc6 5.Ac4 Cb6 6.Ab3 c4 7.Ac2 Dc7 8.De2 g5`
- **B22** Smith-Morra Declined · `1.e4 c5 2.c3 Cf6 3.e5 Cd5 4.d4 cxd4`
- **B22** Anti-Alapin Gambit · `1.e4 c5 2.c3 d5 3.exd5 Cf6`
- **B22** Barmen Defense · `1.e4 c5 2.c3 d5 3.exd5 Dxd5`
- **B22** Barmen Defense · `1.e4 c5 2.c3 d5 3.exd5 Dxd5 4.d4 Cc6 5.Cf3`
- **B22** Barmen Defense, Milner-Barry Attack · `1.e4 c5 2.c3 d5 3.exd5 Dxd5 4.d4 Cc6 5.Cf3 cxd4 6.cxd4 e5 7.Cc3 Ab4 8.Ae2`
- **B22** Barmen Defense, Modern Line · `1.e4 c5 2.c3 d5 3.exd5 Dxd5 4.d4 Cf6 5.Cf3 Ag4`
- **B22** Barmen Defense, Central Exchange · `1.e4 c5 2.c3 d5 3.exd5 Dxd5 4.d4 cxd4 5.cxd4 Cc6 6.Cf3 Ag4`
- **B22** Barmen Defense, Endgame Variation · `1.e4 c5 2.c3 d5 3.exd5 Dxd5 4.d4 cxd4 5.cxd4 Cc6 6.Cf3 Ag4 7.Cc3 Axf3 8.gxf3 Dxd4 9.Dxd4 Cxd4`
- **B22** Barmen Defense · `1.e4 c5 2.c3 d5 3.exd5 Dxd5 4.d4 g6 5.Cf3`

#### Kramnik Variation
*B40 · 1 línea*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.c4`

#### Drazic Variation
*B40 · 1 línea*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 a6`

#### Paulsen-Basman Defense
*B40 · 1 línea*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Ac5`

#### Taimanov Variation
*B44–B49 · 10 líneas*

- **B44** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6`
- **B44** Szén Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cb5`
- **B44** Modern Line · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cb5 d6 6.c4 Cf6 7.C1c3 a6 8.Ca3 Ae7 9.Ae2 O-O 10.O-O b6`
- **B44** Gary Gambit · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cb5 d6 6.c4 Cf6 7.C1c3 a6 8.Ca3 d5`
- **B45** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3`
- **B47** Bastrikov Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Dc7`
- **B48** Bastrikov Variation, English Attack · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Dc7 6.Ae3`
- **B49** Bastrikov Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Dc7 6.Ae3 a6 7.Ae2`
- **B47** Bastrikov Variation, Ponomariov Gambit · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Dc7 6.Cdb5 Db8 7.Ae3 a6 8.Ab6`
- **B46** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 a6`

#### Four Knights Variation
*B45 · 5 líneas*

- **B45** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Cf6`
- **B45** American Attack · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Cf6 6.Cdb5 Ab4 7.Cd6+`
- **B45** Cobra Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Cf6 6.Cdb5 Ac5`
- **B45** Sveshnikov Transfer · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Cf6 6.Cdb5 d6`
- **B45** Exchange Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cc6 5.Cc3 Cf6 6.Cxc6`

#### Pin Variation
*B40 · 3 líneas*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Ab4`
- **B40** Jaffe Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Ab4 6.Ad3 e5`
- **B40** Koch Variation · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Ab4 6.e5`

#### Gaw-Paw Variation
*B40 · 1 línea*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Cf6 5.Cc3 Db6`

#### Kveinis Variation
*B40 · 1 línea*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.Cxd4 Db6`

#### Smith-Morra Gambit Deferred
*B40 · 1 línea*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 cxd4 4.c3`

#### Marshall Counterattack
*B40 · 1 línea*

- **B40** Línea base · `1.e4 c5 2.Cf3 e6 3.d4 d5`

#### Brussels Gambit
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 f5`

#### Double-Dutch Gambit
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 f5 3.exf5 Ch6`

#### Hyperaccelerated Dragon
*B27 · 2 líneas*

- **B27** Línea base · `1.e4 c5 2.Cf3 g6`
- **B27** Línea base · `1.e4 c5 2.Cf3 g6 3.d4`

#### Acton Extension
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 g6 3.c4 Ah6`

#### Hyperaccelerated Pterodactyl
*B27 · 2 líneas*

- **B27** Línea base · `1.e4 c5 2.Cf3 g6 3.d4 Ag7`
- **B27** Exchange Variation · `1.e4 c5 2.Cf3 g6 3.d4 Ag7 4.dxc5 Da5+ 5.Cc3 Axc3+ 6.bxc3 Dxc3+`

#### Frederico Variation
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 g6 3.d4 f5`

#### Bücker Variation
*B27 · 1 línea*

- **B27** Línea base · `1.e4 c5 2.Cf3 h6`

#### Brick Variation
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.Ch3`

#### Amazon Attack
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.Dg4`

#### Mengarini Variation
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.a3`

#### Myers Attack
*B20 · 2 líneas*

- **B20** with a4 · `1.e4 c5 2.a4`
- **B20** with h4 · `1.e4 c5 2.h4`

#### Czerniak Attack
*B20 · 2 líneas*

- **B20** Línea base · `1.e4 c5 2.b3`
- **B20** Queen Fianchetto Variation · `1.e4 c5 2.b3 b6`

#### Euwe Attack
*B20 · 1 línea*

- **B20** Prins Gambit · `1.e4 c5 2.b3 d5 3.Ab2`

#### Heidenfeld Variation
*B22 · 1 línea*

- **B22** Línea base · `1.e4 c5 2.c3 Cf6 3.e5 Cd5 4.Cf3 Cc6 5.Ca3`

#### Staunton-Cochrane Variation
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.c4`

#### Gloria Variation
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.c4 d6 3.Cc3 Cc6 4.g3 h5`

#### Big Clamp Formation
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.d3 Cc6 3.c3 d6 4.f4`

#### Smith-Morra Gambit
*B21 · 2 líneas*

- **B21** Línea base · `1.e4 c5 2.d4`
- **B21** Línea base · `1.e4 c5 2.d4 cxd4 3.c3`

#### Morphy Gambit
*B21 · 2 líneas*

- **B21** Línea base · `1.e4 c5 2.d4 cxd4 3.Cf3`
- **B21** Andreaschek Gambit · `1.e4 c5 2.d4 cxd4 3.Cf3 e5 4.c3`

#### Coles Sicilian Gambit
*B21 · 1 línea*

- **B21** Línea base · `1.e4 c5 2.d4 cxd4 3.Dxd4 Cc6 4.Dd1 Cf6 5.Ac4`

#### Smith-Morra Gambit Declined
*B21 · 6 líneas*

- **B21** Alapin Formation · `1.e4 c5 2.d4 cxd4 3.c3 Cf6`
- **B21** Wing Formation · `1.e4 c5 2.d4 cxd4 3.c3 Da5`
- **B21** Push Variation · `1.e4 c5 2.d4 cxd4 3.c3 d3`
- **B21** Dubois Variation · `1.e4 c5 2.d4 cxd4 3.c3 d3 4.c4`
- **B21** Scandinavian Formation · `1.e4 c5 2.d4 cxd4 3.c3 d5`
- **B21** Center Formation · `1.e4 c5 2.d4 cxd4 3.c3 e5`

#### Smith-Morra Gambit Accepted
*B21 · 21 líneas*

- **B21** Línea base · `1.e4 c5 2.d4 cxd4 3.c3 dxc3`
- **B21** Danish Variation · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cf3`
- **B21** Sozin Formation · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Ac4 e6 6.Cf3 d6 7.O-O a6 8.De2 b5`
- **B21** Chicago Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Ac4 e6 6.Cf3 d6 7.O-O a6 8.De2 b5 9.Ab3 Ta7`
- **B21** Classical Formation · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 d6 6.Ac4 a6 7.O-O Cf6`
- **B21** Scheveningen Formation · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 d6 6.Ac4 e6`
- **B21** Fianchetto Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 d6 6.Ac4 g6`
- **B21** Pin Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 Ab4`
- **B21** Morphy Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 Ac5`
- **B21** Siberian Variation · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 Dc7`
- **B21** Siberian Variation, Siberian Trap · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 Dc7 7.De2 Cf6 8.O-O Cg4`
- **B21** Larsen Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 Dc7 7.De2 a6 8.O-O Ad6`
- **B21** Paulsen Formation · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 a6`
- **B21** Morphy Defense Deferred · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 e6 6.Ac4 a6 7.O-O b5 8.Ab3 Ac5`
- **B21** Fianchetto Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 Cc6 5.Cf3 g6`
- **B21** Chicago Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 d6 5.Cf3 e6 6.Ac4 Cf6 7.O-O a6`
- **B21** Fianchetto Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 d6 5.Cf3 g6`
- **B21** Taimanov Formation · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 e6 5.Ac4 a6 6.Cf3 Ce7`
- **B21** Kan Formation · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 e6 5.Cf3 a6`
- **B21** Finegold Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 e6 5.Cf3 d6 6.Ac4 a6 7.O-O Ae7 8.De2 Cf6`
- **B21** Fianchetto Defense · `1.e4 c5 2.d4 cxd4 3.c3 dxc3 4.Cxc3 g6`

#### Halasz Gambit
*B21 · 1 línea*

- **B21** Línea base · `1.e4 c5 2.d4 cxd4 3.f4`

#### McDonnell Attack
*B21 · 8 líneas*

- **B21** Línea base · `1.e4 c5 2.f4`
- **B21** Línea base · `1.e4 c5 2.f4 Cc6 3.Cf3 e6`
- **B21** Línea base · `1.e4 c5 2.f4 Cc6 3.Cf3 e6 4.d3`
- **B21** Línea base · `1.e4 c5 2.f4 Cc6 3.Cf3 g6 4.Ab5 Ag7`
- **B21** Línea base · `1.e4 c5 2.f4 Cc6 3.Cf3 g6 4.Ab5 Ag7 5.Axc6 bxc6 6.O-O d6 7.d3 Cf6`
- **B21** Línea base · `1.e4 c5 2.f4 Cc6 3.Cf3 g6 4.Ab5 Ag7 5.c3 Cf6`
- **B21** Toilet Variation · `1.e4 c5 2.f4 d5 3.Cc3`
- **B21** Tal Gambit · `1.e4 c5 2.f4 d5 3.exd5 Cf6`

#### Lasker-Dunne Attack
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.g3`

#### Grob Variation
*B20 · 1 línea*

- **B20** Línea base · `1.e4 c5 2.g4`

</details>
