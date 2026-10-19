# Apertura italiana (Italian Game)

> **Estado:** investigación — **no está implementado**. Forma parte del [plan del modo entrenamiento](README.md).
> **Perspectiva de entrenamiento:** juegas con **Blancas**; el bot elige entre las ramas de las Negras.
> **Cómo leer las jugadas:** notación española (R rey, D dama, T torre, A alfil, C caballo). Una línea sin marca figura en la base de Lichess (CC0) y el motor del proyecto confirmó que es legal. Una línea con **†** es legal pero escrita de memoria: **no está en la base** y hay que verificarla antes de enseñarla. Las líneas se muestran desde la tercera jugada de las Negras (todas empiezan con `1.e4 e5 2.Cf3 Cc6 3.Ac4`). Los comentarios (ideas, planes, consejos) son de redacción propia y **no los revisó ningún maestro ni motor**.

## 1. Resumen

- **Entrada:** `1.e4 e5 2.Cf3 Cc6 3.Ac4`
- **Idea en una frase:** desarrollo rápido, presión sobre f7 y un centro fuerte con c3 + d4 (o un plan lento con d3).
- **Por qué entrenarla:** enseña los principios de toda apertura abierta (desarrollar, enrocar, pelear el centro) y tiene ramas tácticas muy rentables si te las sabes (Evans, Hígado frito, Max Lange).
- **Tamaño en la base de Lichess:** 187 líneas con nombre (códigos ECO C50–C59). Es el árbol que Aprender debería cubrir.
- **Tercera jugada de las Negras (el gran reparto de ramas):** …Ac5 (Giuoco Piano), …Cf6 (Dos Caballos), …Ae7 (Húngara) y rarezas (…Cd4, …d6, …f5, …h6).

## 2. Las jugadas base y por qué

| Jugada | Qué hace |
|---|---|
| `1.e4` | Ocupa el centro y abre diagonales para el alfil de rey y la dama. |
| `1...e5` | Las Negras responden con la misma idea: partida abierta. |
| `2.Cf3` | Desarrolla un caballo y ataca e5. |
| `2...Cc6` | Defiende e5 y desarrolla. |
| `3.Ac4` | Saca el alfil a su mejor diagonal (a2–g8), apunta a f7 y prepara el enroque corto. |

## 3. Ideas principales (para entender, no para memorizar)

1. **Desarrolla antes de atacar:** caballos, alfiles, enroque corto. No muevas dos veces la misma pieza sin motivo.
2. **f7 es el punto débil de las Negras** mientras no enroquen (solo lo defiende el rey). Pero amenazarlo demasiado pronto con `Cg5` hace perder tiempo si el rival defiende bien.
3. **Centro con c3 + d4:** `c3` prepara `d4`; si las Negras toman en d4 recapturas con el peón (`cxd4`) y ganas tiempo con jaques.
4. **Dos estilos de juego:** (a) *abierto y táctico* (c3 + d4, Evans, Dos Caballos con d4), donde pesa la memoria de tácticas; (b) *lento y posicional* (Giuoco Pianissimo: d3, c3, Cbd2, enroque, Te1, h3), donde pesa entender la estructura.
5. **El peón e4 es el punto a vigilar:** casi siempre existe la idea …Cxe4. Antes de mover, mira si e4 está defendido.
6. **El alfil de c4** es blanco de …d5 y …Ca5; cuando lo atacan suele retirarse a b3 (su mejor diagonal) en vez de a e2.
7. **Enroque corto pronto** y torre a e1.

## 4. Mapa de ramas (lo que el modo Aprender debe cubrir)

```
3.Ac4
├─ 3...Ac5   GIUOCO PIANO ("juego tranquilo")
│   ├─ 4.c3     Clásica → 4...Cf6 → 5.d4 (centro: Greco / Möller)
│   │                              → 5.d3 (Pianissimo, plan lento)
│   │                              → 5.b4 (Ataque de Bird)
│   │           otras 4.as de las Negras: 4...De7, 4...d6
│   ├─ 4.d3     Pianissimo directo (4...Cf6 5.Cc3 …) / 4...f5 Gambito Lucchini
│   ├─ 4.O-O    → 4...Cf6 5.d3 (Pianissimo) / 5.d4 Deutz / 5.c3 Albin
│   ├─ 4.b4     GAMBITO EVANS (aceptado 4...Axb4; rehusado 4...Ab6; contragambitos)
│   ├─ 4.Axf7+  Gambito Jerome (dudoso)
│   └─ 4.d4     Gambito Rosentreter (raro)
├─ 3...Cf6   DEFENSA DE LOS DOS CABALLOS
│   ├─ 4.Cg5    → 4...d5 5.exd5 → 5...Ca5 (Polerio) · 5...Cxd5 (Hígado frito / Lolli)
│   │                           · 5...b5 (Ulvestad) · 5...Cd4 (Fritz) · 5...Cb4 (Kloss)
│   │           → 4...Ac5 Contraataque Traxler · 4...Cxe4 Ponziani-Steinitz
│   ├─ 4.d4     → 4...exd4 5.O-O (Gambito Escocés / Max Lange / Variante abierta)
│   ├─ 4.d3     Alfil moderno → transpone al Pianissimo
│   └─ 4.Cc3    → 4...Cxe4 …
├─ 3...Ae7   Defensa húngara
├─ 3...Cd4   Gambito Blackburne-Kostić (trampa)
├─ 3...d6    Defensa París
├─ 3...f5    Gambito Rousseau
└─ 3...h6    Defensa anti-Hígado frito
```

### A) 3…Ac5 — Giuoco Piano

`1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5`

- **Idea:** ambos bandos copian el desarrollo; las dos piezas apuntan a f7/f2. La lucha es por el centro (d4/d5).
- **Tu decisión (jugada 4):** `c3` (la más temática), `d3` (la más tranquila), `O-O` o el gambito `b4`.

**4.c3 (Clásica).** `3...Ac5 4.c3 Cf6`
- **Con 5.d4 (centro).** Tras `5...exd4 6.cxd4 Ab4+` eliges entre `7.Cc3` (afilado) y `7.Ad2` (sólido).
  - Afilado: `3...Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Axc3 9.d5` *(Lichess: Classical Variation, Greco Gambit, Moeller-Therkatz Attack)* — sacrificas un peón por desarrollo y ataque.
  - Sólido: `3...Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Ad2 Axd2+ 8.Cbxd2 d5 9.exd5 Cxd5`† (a mano; la base solo registra `7...Cxe4` después de `7.Ad2`).
- **Con 5.d3 (plan lento).** `3...Ac5 4.c3 Cf6 5.d3 d6 6.Cbd2 O-O 7.O-O` *(Lichess: Classical Variation, Giuoco Pianissimo)*
- **Con 5.b4 (Ataque de Bird).** `3...Ac5 4.c3 Cf6 5.b4` *(Lichess: Bird's Attack)* — idea parecida al gambito Evans, pero con `c3` ya jugada. Arriesgado.
- **Otras cuartas jugadas de las Negras:** `3...Ac5 4.c3 De7` *(Lichess: Classical Variation, Closed Variation)* y `3...Ac5 4.c3 d6 5.d4 exd4 6.cxd4 Ab6` *(Lichess: Classical Variation, La Bourdonnais Variation)*.

**4.d3 (Pianissimo directo).** `3...Ac5 4.d3 Cf6 5.Cc3 d6 6.Ag5` *(Lichess: Giuoco Pianissimo, Canal Variation)*
- **Idea:** solidez. Desarrollas `Cc3`, clavas con `Ag5`, y más tarde `h3`, `Cd2`/`Ce2`. La ruptura `d4` llega cuando está preparada.
- **Atención:** `3...Ac5 4.d3 f5` *(Lichess: Giuoco Pianissimo, Lucchini Gambit)* (las Negras ofrecen un gambito).

**4.O-O.** `3...Ac5 4.O-O Cf6 5.d3 d6 6.c3 a6 7.Te1`
- Transpone al Pianissimo. Alternativas: `3...Ac5 4.O-O Cf6 5.d4` *(Lichess: Deutz Gambit)* y `3...Ac5 4.O-O Cf6 5.c3` *(Lichess: Classical Variation, Albin Gambit)*.

**Errores típicos aquí:** jugar `d4` sin haber preparado la recaptura con `c3` (se pierde un peón sin compensación, salvo en los gambitos que lo ofrecen a propósito); olvidar que el alfil de c5 apunta a f2; dejar e4 sin defensa ante …Cxe4.

### B) 3…Cf6 — Defensa de los Dos Caballos

`1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6`

- **Idea:** las Negras contraatacan e4 en vez de defender pasivamente. Tú decides: `Cg5` (muy agudo), `d4` (centro), `d3` (tranquilo) o `Cc3`.

**4.Cg5 (Ataque del caballo).** `3...Cf6 4.Cg5` *(Lichess: Two Knights Defense, Knight Attack)* — amenaza `Cxf7`. La respuesta habitual es `4...d5 5.exd5`; a partir de ahí:
- **5…Ca5 (Defensa Polerio).** `3...Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Ae2 h6 9.Cf3 e4 10.Ce5 Ad6` o la alternativa tranquila `3...Cf6 4.Cg5 d5 5.exd5 Ca5 6.d3` *(Lichess: Two Knights Defense, Polerio Defense, Kieseritzky Variation)*. Las Negras dan un peón a cambio de desarrollo y centro.
- **5…Cxd5 (Hígado frito).** `3...Cf6 4.Cg5 d5 5.exd5 Cxd5 6.Cxf7` *(Lichess: Two Knights Defense, Fried Liver Attack)* → `3...Cf6 4.Cg5 d5 5.exd5 Cxd5 6.Cxf7 Rxf7 7.Df3+ Re6 8.Cc3 Cb4`. Sacrificas un caballo para sacar al rey negro al centro. Si el rival no se sabe la defensa, ganas rápido; si se la sabe, el ataque es de riesgo. Alternativa menos sacrificial: `3...Cf6 4.Cg5 d5 5.exd5 Cxd5 6.d4` *(Lichess: Two Knights Defense, Lolli Attack)*.
- **5…b5 (Ulvestad):** `3...Cf6 4.Cg5 d5 5.exd5 b5 6.Af1`.
- **5…Cd4 (Fritz):** `3...Cf6 4.Cg5 d5 5.exd5 Cd4 6.c3 b5 7.Af1 Cxd5 8.Ce4`.
- **5…Cb4 (Gambito Kloss):** `3...Cf6 4.Cg5 d5 5.exd5 Cb4` *(Lichess: Two Knights Defense, Kloss Gambit)*.

**4…Ac5 (Contraataque Traxler).** `3...Cf6 4.Cg5 Ac5` *(Lichess: Two Knights Defense, Traxler Counterattack)* — teoría muy afilada. Las dos reacciones registradas: `3...Cf6 4.Cg5 Ac5 5.Axf7+` *(Lichess: Two Knights Defense, Traxler Counterattack, Bishop Sacrifice Line)* y `3...Cf6 4.Cg5 Ac5 5.Cxf7` *(Lichess: Two Knights Defense, Traxler Counterattack, Knight Sacrifice Line)* (la "marcha del rey": `3...Cf6 4.Cg5 Ac5 5.Cxf7 Axf2+ 6.Rxf2 Cxe4+ 7.Re3` *(Lichess: Two Knights Defense, Traxler Counterattack, King March Line)*). **Decisión pendiente:** enseñarla completa o recomendar una sola respuesta cuando haya una fuente verificada.

**4…Cxe4 (Gambito Ponziani-Steinitz):** `3...Cf6 4.Cg5 Cxe4` *(Lichess: Two Knights Defense, Ponziani-Steinitz Gambit)*.

**4.d4 (centro).** `3...Cf6 4.d4` *(Lichess: Two Knights Defense, Open Variation)* → `4...exd4 5.O-O`:
- **Gambito Escocés:** `3...Cf6 4.d4 exd4 5.O-O` *(Lichess: Scotch Gambit)*.
- **Ataque Max Lange (5…Ac5):** `3...Cf6 4.d4 exd4 5.O-O Ac5 6.e5 d5 7.exf6 dxc4 8.Te1+ Ae6 9.Cg5 Dd5 10.Cc3` — melé táctica con teoría larga.
- **Variante abierta (5…Cxe4):** `3...Cf6 4.d4 exd4 5.O-O Cxe4 6.Te1 d5 7.Axd5 Dxd5 8.Cc3 Da5 9.Cxe4 Ae6`.
- **Con 5.e5:** `3...Cf6 4.d4 exd4 5.e5 d5 6.Ab5 Ce4` *(Lichess: Scotch Gambit, Max Lange Attack)*.
- **Si las Negras no aceptan:** `3...Cf6 4.d4 d6` *(Lichess: Scotch Invitation Declined)*.

**4.d3 (Alfil moderno).** `3...Cf6 4.d3` *(Lichess: Two Knights Defense, Modern Bishop's Opening)*; respuestas registradas `3...Cf6 4.d3 Ac5`, `3...Cf6 4.d3 Ae7` y `3...Cf6 4.d3 h6 5.O-O d6`. Casi siempre transpone al Pianissimo.

**4.Cc3:** `3...Cf6 4.Cc3 Cxe4 5.Cxe4 d5` (la base solo registra esta línea).

**Errores típicos aquí:** lanzar `Cg5` sin conocer las respuestas; olvidar que `Cg5` + `Ac4` solo amenazan mientras f7 siga siendo débil; entrar en Max Lange sin repasar la teoría.

### C) Otras terceras jugadas de las Negras

- **3…Ae7 — Defensa húngara.** `3...Ae7` *(Lichess: Hungarian Defense)* Sólida pero pasiva. Línea registrada: `3...Ae7 4.d4 exd4 5.c3 Cf6 6.e5 Ce4` *(Lichess: Hungarian Defense, Tartakower Variation)*. Plan de las Blancas: espacio en el centro y desarrollo cómodo.
- **3…Cd4 — Gambito Blackburne-Kostić.** `3...Cd4` *(Lichess: Blackburne-Kostić Gambit)* Gambito dudoso con una trampa conocida (…Dg5 contra g2). La línea exacta de la trampa **está pendiente de verificar**; la idea para las Blancas es no precipitarse y simplemente cambiar caballos y desarrollar.
- **3…d6 — Defensa París.** `3...d6` *(Lichess: Paris Defense)* Pasiva: defiende e5 pero retrasa el desarrollo. Las Blancas siguen con `c3` y `d4`.
- **3…f5 — Gambito Rousseau.** `3...f5` *(Lichess: Rousseau Gambit)* Dudoso; la base no registra más jugadas. Pendiente de investigar cómo responder.
- **3…h6 — Defensa anti-Hígado frito.** `3...h6` *(Lichess: Anti-Fried Liver Defense)* Evita ideas con `Cg5`; el juego sigue como Giuoco.

## 5. Gambitos y trampas

**Más importantes (comentario propio):**

- **Gambito Evans** — `3...Ac5 4.b4`. Ofreces el peón b para ganar tiempo (`c3` y `d4`) y construir un gran centro con ataque. *Aceptado* (`4...Axb4 5.c3`): el alfil se retira a a5 (línea principal), e7 (Anderssen), c5 (McDonnell), d6 (Stone-Ware) o f8 (Mayet); típico: `3...Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O`. *Rehusado:* `3...Ac5 4.b4 Ab6` *(Lichess: Evans Gambit Declined)*. *Contragambitos:* `3...Ac5 4.b4 d5` *(Lichess: Evans Gambit, Hein Countergambit)* y `3...Ac5 4.b4 b5` *(Lichess: Evans Gambit, Fontaine Countergambit)*. Es una rama de memoria pura: conviene enseñarla después de las básicas.
- **Ataque del Hígado frito** — ver sección B. Riesgo alto, recompensa alta.
- **Ataque Max Lange** — ver sección B. Muy teórico.
- **Gambito Jerome** — `3...Ac5 4.Axf7+` *(Lichess: Jerome Gambit)*. Se considera incorrecto: las Negras capturan con el rey y terminan mejor si se defienden con precisión. Sirve para saber refutarlo si algún día se entrena el lado de las Negras.
- **Gambitos del Pianissimo:** Deutz (`5.d4`), Albin (`5.c3`), Lucchini (…f5). Ver sección A.

**Índice completo de gambitos, trampas y contraataques con nombre (generado de la base de Lichess):**

- **Jerome Gambit** · C50 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.Axf7+`
- **Albin Gambit** · C50 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.c3`
- **Deutz Gambit** · C50 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d4`
- **Evans Gambit** · C51 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4`
- **Evans Gambit Declined** · C51 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6`
- **Evans Gambit Accepted** · C51 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4`
- **Leonhardt Countergambit** · C52 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 b5`
- **Mortimer-Evans Gambit** · C51 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.Cc3 Ag4 10.Da4 Ad7 11.Db3 Ca5 12.Axf7+ Rf8 13.Dc2 Rxf7`
- **Fontaine Countergambit** · C51 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 b5`
- **Hein Countergambit** · C51 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 d5`
- **Walbrodt-Baird Gambit** · C56 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.O-O`
- **Greco Gambit** · C54 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.b4`
- **Lucchini Gambit** · C50 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d3 f5`
- **Rosentreter Gambit** · C50 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d4`
- **Blackburne-Kostić Gambit** · C50 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cd4`
- **Traxler Counterattack** · C57 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Ac5`
- **Trencianske-Teplice Gambit** · C57 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Ac5 5.Axf7+ Re7 6.d4`
- **Ponziani-Steinitz Gambit** · C57 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Cxe4`
- **Kloss Gambit** · C57 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cb4`
- **Kurkin Gambit** · C57 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 b5 6.Af1 h6 7.Cxf7`
- **Scotch Gambit** · C56 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O`
- **Double Gambit Accepted** · C56 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Cxe4`
- **Nakhmanson Gambit** · C56 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Cxe4 6.Cc3`
- **Rousseau Gambit** · C50 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 f5`

## 6. Plan de lecciones sugerido (modo Aprender)

1. Las 5 primeras jugadas y por qué (`1.e4 e5 2.Cf3 Cc6 3.Ac4`).
2. Giuoco Piano clásico: `4.c3` y el plan lento `5.d3`.
3. Centro con `5.d4`: `6.cxd4 Ab4+`, `7.Ad2` frente a `7.Cc3`.
4. Dos Caballos tranquilo: `4.d3`, transposición al Pianissimo.
5. Dos Caballos con `4.Cg5`: `4...d5 5.exd5` y las respuestas (Polerio, Hígado frito, Ulvestad, Fritz, Kloss).
6. Gambito Evans (aceptado y rehusado).
7. Max Lange y Gambito Escocés.
8. Trampas y rarezas: Húngara, Blackburne-Kostić, Jerome, Rousseau, Traxler.
9. Repaso del árbol completo.

## 7. Notas para el modo Practicar (bot)

- El bot juega las Negras y, en cada posición del árbol, elige una de las ramas registradas. Pesos iniciales uniformes; después **adaptativos** (más peso a las ramas donde el usuario falla). No se inventan porcentajes de popularidad.
- Si el usuario se sale del repertorio: avisar «fuera del repertorio», mostrar la jugada del árbol y dejarle reintentar. Si es una transposición legítima, haría falta un detector de transposiciones (comparar posición/FEN, no solo la secuencia de jugadas).
- Al terminar una línea: mostrar «línea completada», actualizar el dominio y ofrecer otra rama.
- Nodos que cuentan para el porcentaje de dominio: las posiciones donde le toca mover al usuario (Blancas). El total exacto depende del árbol que se escriba; **la base de Lichess sola llega a profundidad corta** (ver README).

## 8. Catálogo completo (generado de la base de Lichess)

Todas las líneas de la base de Lichess para la apertura italiana, agrupadas por familia, con las jugadas en notación española. Datos: [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings) (CC0), validados con el motor de MorphiqChess.

### Índice de familias

| Familia (nombre de Lichess) | ECO | Líneas | Línea de entrada |
|---|---|---:|---|
| (línea base) | C50 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4` |
| Giuoco Piano | C50–C54 | 10 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5` |
| Jerome Gambit | C50 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.Axf7+` |
| Giuoco Pianissimo | C50 | 9 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d3` |
| Classical Variation | C50–C54 | 45 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3` |
| Deutz Gambit | C50 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d4` |
| Scotch Gambit | C56 | 14 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O` |
| Evans Gambit | C51–C52 | 41 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4` |
| Evans Gambit Declined | C51 | 9 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6` |
| Evans Gambit Accepted | C51 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4` |
| Bird's Attack | C53 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.b4` |
| Rosentreter Gambit | C50 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d4` |
| Hungarian Defense | C50 | 2 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ae7` |
| Blackburne-Kostić Gambit | C50 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cd4` |
| Two Knights Defense | C55–C59 | 46 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6` |
| Scotch Invitation Declined | C56 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 d6` |
| Paris Defense | C50 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 d6` |
| Rousseau Gambit | C50 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 f5` |
| Anti-Fried Liver Defense | C50 | 1 | `1.e4 e5 2.Cf3 Cc6 3.Ac4 h6` |

<details>
<summary>Ver las 187 líneas</summary>

#### (línea base)
*C50 · 1 línea*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4`

#### Giuoco Piano
*C50–C54 · 10 líneas*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5`
- **C54** Krause Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Ad2 Cxe4 8.Axb4 Cxb4 9.Axf7+ Rxf7 10.Db3+ d5 11.Ce5+ Rf6 12.f3`
- **C54** Cracow Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Rf1`
- **C54** Greco's Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3`
- **C54** Steinitz Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Axc3 9.bxc3 d5 10.Aa3`
- **C54** Therkatz-Herzog Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Axc3 9.d5 Af6 10.Te1 Ce7 11.Txe4 d6 12.Ag5 Axg5 13.Cxg5 O-O 14.Cxh7`
- **C54** Aitken Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Cxc3 9.bxc3 Axc3 10.Aa3`
- **C54** Bernstein Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Cxc3 9.bxc3 Axc3 10.Db3 d5`
- **C54** Holzhausen Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.O-O Ac5 5.d4 Axd4 6.Cxd4 Cxd4 7.Ag5 d6 8.f4 De7 9.fxe5 dxe5 10.Cc3`
- **C54** Rosentreter Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.O-O Ac5 5.d4 Axd4 6.Cxd4 Cxd4 7.Ag5 h6 8.Ah4 g5 9.f4`

#### Jerome Gambit
*C50 · 1 línea*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.Axf7+`

#### Giuoco Pianissimo
*C50 · 9 líneas*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.Cc3 Cf6 5.O-O O-O`
- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.Cc3 Cf6 5.O-O O-O 6.d3`
- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d3`
- **C50** Italian Four Knights Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d3 Cf6 5.Cc3`
- **C50** Canal Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d3 Cf6 5.Cc3 d6 6.Ag5`
- **C50** Lucchini Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d3 f5`
- **C50** Dubois Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d3 f5 5.Cg5 f4`
- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.O-O Ac5 5.Cc3 d6 6.d3`
- **C50** Normal · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d3 Ac5`

#### Classical Variation
*C50–C54 · 45 líneas*

- **C50** Albin Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.c3`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 O-O 6.c3 d5`
- **C54** Giuoco Pianissimo, with a5 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 a5 6.c3`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 Ab6`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 O-O`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 a5`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 a6`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 a6 7.Te1`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 a6 7.Te1 Aa7`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 a6 7.a4`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 a6 7.a4 Aa7`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 a6 7.a4 O-O`
- **C54** Giuoco Pianissimo, with h6 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 h6`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 h6 7.Cbd2`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 d6 6.c3 h6 7.Te1`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d3 h6 6.c3`
- **C53** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3`
- **C54** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3`
- **C54** Giuoco Pianissimo, with a6 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 a6`
- **C54** with d5 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 d5`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 d6`
- **C54** Giuoco Pianissimo · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 d6 6.Cbd2 O-O 7.O-O`
- **C54** Giuoco Pianissimo, with a6 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 d6 6.Cbd2 a6`
- **C54** Giuoco Pianissimo, Main Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 d6 6.O-O O-O 7.Te1 a6 8.Ab3 Aa7 9.h3`
- **C54** Giuoco Pianissimo, with a4 a5 · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 d6 6.O-O O-O 7.a4 a5`
- **C54** Giuoco Pianissimo, Albin Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d3 d6 6.b4`
- **C54** Center Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4`
- **C54** Greco Gambit, Dubov Italian · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.b4`
- **C54** Greco Gambit, Traditional Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4`
- **C54** Greco Gambit, Main Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Axc3`
- **C54** Greco Gambit, Moeller-Therkatz Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Axc3 9.d5`
- **C54** Greco Gambit, Moeller-Bayonet Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Axc3 9.d5 Af6 10.Te1 Ce7 11.Txe4 d6 12.g4`
- **C54** Greco Gambit, Greco Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.cxd4 Ab4+ 7.Cc3 Cxe4 8.O-O Cxc3`
- **C54** Greco Gambit, Modern Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.e5`
- **C54** Ghulam-Kassim Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.e5 Ce4 7.Ad5 Cxf2 8.Rxf2 dxc3+ 9.Rg3`
- **C54** Greco Gambit, Modern Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.e5 d5`
- **C54** Greco Gambit, Anderssen Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.e5 d5 7.Ab5 Ce4 8.cxd4 Ab4+`
- **C53** Closed Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 De7`
- **C53** Center Holding Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 De7 5.d4 Ab6`
- **C53** Mestel Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 De7 5.d4 Ab6 6.Ag5`
- **C53** Tarrasch Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 De7 5.d4 Ab6 6.O-O d6 7.a4 a6 8.h3 Cf6 9.Te1`
- **C53** Eisinger Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 De7 5.d4 Ab6 6.d5 Cb8 7.d6`
- **C53** La Bourdonnais Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 d6 5.d4 exd4 6.cxd4 Ab6`

#### Deutz Gambit
*C50 · 1 línea*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d4`

#### Scotch Gambit
*C56 · 14 líneas*

- **C56** Max Lange Attack Accepted · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.O-O Cf6 5.d4 exd4 6.e5 d5 7.exf6 dxc4 8.Te1+ Ae6 9.fxg7`
- **C56** Walbrodt-Baird Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.d4 exd4 6.O-O`
- **C56** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O`
- **C56** Double Gambit Accepted · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Cxe4`
- **C56** Nakhmanson Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Cxe4 6.Cc3`
- **C56** Anderssen Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Cxe4 6.Te1 d5 7.Axd5 Dxd5 8.Cc3`
- **C56** Anderssen Attack, Main Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Cxe4 6.Te1 d5 7.Axd5 Dxd5 8.Cc3 Da5 9.Cxe4 Ae6 10.Ad2 Dd5 11.Ag5`
- **C56** Max Lange Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.e5 d5 6.Ab5 Ce4`
- **C56** Max Lange Attack · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Cf6 5.O-O Ac5`
- **C56** Max Lange Attack, Spielmann Defense · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Cf6 5.O-O Ac5 6.e5 Cg4`
- **C56** Max Lange Attack, Long Variation · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Cf6 5.O-O Ac5 6.e5 d5 7.exf6 dxc4 8.Te1+ Ae6 9.Cg5 Dd5 10.Cc3 Df5 11.Cce4`
- **C56** de Riviere Defense · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Cf6 5.O-O Ae7`
- **C56** Canal Variation · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Cf6 5.O-O Cxe4 6.Te1 d5 7.Cc3`
- **C56** Janowski Defense · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Cf6 5.O-O d6`

#### Evans Gambit
*C51–C52 · 41 líneas*

- **C51** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4`
- **C52** Main Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5`
- **C52** Slow Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.O-O`
- **C52** Richardson Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.O-O Cf6 7.d4 O-O 8.Cxe5`
- **C52** Anderssen Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.O-O Cf6 7.d4 exd4`
- **C52** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.O-O d6`
- **C52** Lasker Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.O-O d6 7.d4 Ab6`
- **C52** Sanders-Alapin Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.O-O d6 7.d4 Ad7`
- **C52** Alapin-Steinitz Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.O-O d6 7.d4 Ag4`
- **C52** Laroche Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 Cf6`
- **C52** Leonhardt Countergambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 b5`
- **C52** Bronstein Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 d6`
- **C52** Sokolsky Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 d6 7.Ag5`
- **C52** Tartakower Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 d6 7.Db3`
- **C52** Levenfish Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 d6 7.Db3 Dd7 8.dxe5 dxe5 9.O-O Ab6 10.Aa3 Ca5 11.Cxe5`
- **C52** Pierce Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4`
- **C52** Mieses Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O Cge7`
- **C52** Johner Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O b5`
- **C52** Dufresne Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O d3`
- **C52** Waller Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O d6 8.Db3`
- **C51** Morphy Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.Cc3`
- **C52** Compromised Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O dxc3`
- **C52** Compromised Defense, Main Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O dxc3 8.Db3 Df6 9.e5 Dg6 10.Cxc3 Cge7 11.Aa3`
- **C52** Compromised Defense, Potter Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Aa5 6.d4 exd4 7.O-O dxc3 8.Db3 Df6 9.e5 Dg6 10.Cxc3 Cge7 11.Td1`
- **C51** McDonnell Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5`
- **C51** McDonnell Defense, Main Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6`
- **C51** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.Cc3 Ag4`
- **C51** Fraser Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.Cc3 Ag4 10.Da4`
- **C51** Fraser-Mortimer Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.Cc3 Ag4 10.Da4 Ad7 11.Db3 Ca5 12.Axf7+ Rf8 13.Dc2`
- **C51** Mortimer-Evans Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.Cc3 Ag4 10.Da4 Ad7 11.Db3 Ca5 12.Axf7+ Rf8 13.Dc2 Rxf7`
- **C51** Göring Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.Cc3 Ca5 10.Ag5`
- **C51** Steinitz Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.Cc3 Ca5 10.Ag5 f6 11.Ae3`
- **C51** Ulvestad Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.d5 Ca5 10.Ab2`
- **C51** Paulsen Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.O-O d6 8.cxd4 Ab6 9.d5 Ca5 10.Ab2 Ce7`
- **C51** Harding Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ac5 6.d4 exd4 7.cxd4 Ab4+ 8.Ad2`
- **C51** Stone-Ware Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ad6`
- **C51** Anderssen Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ae7`
- **C51** Anderssen Variation, Cordel Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Ae7 6.d4 Ca5`
- **C51** Mayet Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4 5.c3 Af8`
- **C51** Fontaine Countergambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 b5`
- **C51** Hein Countergambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 d5`

#### Evans Gambit Declined
*C51 · 9 líneas*

- **C51** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6`
- **C51** Cordel Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.Ab2`
- **C51** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.a4`
- **C51** Showalter Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.a4 a6 6.Cc3`
- **C51** Lange Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.b5 Ca5 6.Cxe5 Ch6`
- **C51** Pavlov Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.b5 Ca5 6.Cxe5 Ch6 7.d4 d6 8.Axh6 dxe5 9.Axg7 Tg8 10.Axf7+ Rxf7 11.Axe5 Dg5 12.Cd2`
- **C51** Hirschbach Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.b5 Ca5 6.Cxe5 Dg5`
- **C51** Vasquez Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.b5 Ca5 6.Cxe5 Dg5 7.Axf7+ Re7 8.Dh5`
- **C51** Hicken Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Ab6 5.b5 Ca5 6.Cxe5 Dg5 7.Df3 Dxe5 8.Dxf7+ Rd8 9.Ab2`

#### Evans Gambit Accepted
*C51 · 1 línea*

- **C51** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.b4 Axb4`

#### Bird's Attack
*C53 · 1 línea*

- **C53** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.c3 Cf6 5.b4`

#### Rosentreter Gambit
*C50 · 1 línea*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ac5 4.d4`

#### Hungarian Defense
*C50 · 2 líneas*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ae7`
- **C50** Tartakower Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Ae7 4.d4 exd4 5.c3 Cf6 6.e5 Ce4`

#### Blackburne-Kostić Gambit
*C50 · 1 línea*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cd4`

#### Two Knights Defense
*C55–C59 · 46 líneas*

- **C55** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6`
- **C55** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cc3 Cxe4 5.Cxe4 d5`
- **C57** Knight Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5`
- **C57** Traxler Counterattack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Ac5`
- **C57** Traxler Counterattack, Bishop Sacrifice Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Ac5 5.Axf7+`
- **C57** Traxler Variation, Trencianske-Teplice Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Ac5 5.Axf7+ Re7 6.d4`
- **C57** Traxler Counterattack, Knight Sacrifice Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Ac5 5.Cxf7`
- **C57** Traxler Counterattack, King March Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Ac5 5.Cxf7 Axf2+ 6.Rxf2 Cxe4+ 7.Re3`
- **C57** Ponziani-Steinitz Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 Cxe4`
- **C57** Knight Attack, Normal Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5`
- **C58** Polerio Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5`
- **C58** Polerio Defense, Bishop Check Line · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+`
- **C58** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Ae2`
- **C59** Polerio Defense, Suhle Defense · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Ae2 h6`
- **C59** Knorre Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Ae2 h6 9.Cf3 e4 10.Ce5 Ad6 11.d4 Dc7 12.Ad2`
- **C59** Polerio Defense, Göring Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Ae2 h6 9.Cf3 e4 10.Ce5 Dc7`
- **C59** Steinitz Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Ae2 h6 9.Ch3`
- **C58** Polerio Defense, Bogoljubow Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Df3`
- **C58** Paoli Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Df3 Dc7 9.Ad3`
- **C58** Colman Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Df3 Tb8`
- **C58** Blackburne Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.Ab5+ c6 7.dxc6 bxc6 8.Df3 cxb5`
- **C58** Polerio Defense, Kieseritzky Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.d3`
- **C58** Polerio Defense, Yankovich Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.d3 h6 7.Cf3 e4 8.De2 Cxc4 9.dxc4 Ac5 10.Cfd2`
- **C58** Maróczy Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Ca5 6.d3 h6 7.Cf3 e4 8.De2 Cxc4 9.dxc4 Ae7`
- **C57** Kloss Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cb4`
- **C57** Fritz Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cd4`
- **C57** Fritz, Gruber Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cd4 6.c3 b5 7.Af1 Cxd5 8.Ce4`
- **C57** Fried Liver Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cxd5 6.Cxf7`
- **C57** Fegatello Attack, Leonhardt Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cxd5 6.Cxf7 Rxf7 7.Df3+ Re6 8.Cc3 Cb4 9.De4 c6 10.a3 Ca6 11.d4 Cc7`
- **C57** Lolli Attack · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cxd5 6.d4`
- **C57** Pincus Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 Cxd5 6.d4 Ab4+`
- **C57** Ulvestad Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 b5`
- **C57** Ulvestad Variation, Kurkin Gambit · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.Cg5 d5 5.exd5 b5 6.Af1 h6 7.Cxf7`
- **C55** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.O-O Ac5 5.d4 Axd4 6.Cxd4 Cxd4 7.Ag5 d6`
- **C55** Modern Bishop's Opening · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d3`
- **C55** Modern Bishop's Opening · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d3 Ae7`
- **C55** Modern Bishop's Opening · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d3 h6 5.O-O d6`
- **C56** Open Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4`
- **C56** Perreux Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.Cg5`
- **C56** Max Lange Attack, Krause Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Ac5 6.e5 Cg4 7.c3`
- **C56** Max Lange Attack, Rubinstein Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Ac5 6.e5 d5 7.exf6 dxc4 8.Te1+ Ae6 9.Cg5 Dd5 10.Cc3 Df5 11.Cce4 Af8`
- **C56** Max Lange Attack, Berger Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.O-O Ac5 6.e5 d5 7.exf6 dxc4 8.Te1+ Ae6 9.Cg5 Dd5 10.Cc3 Df5 11.g4 Dg6 12.Cce4 Ab6 13.f4 O-O-O`
- **C56** Keidansky Variation · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 exd4 5.e5 d5 6.Ab5 Ce4 7.Cxd4 Ac5 8.Cxc6 Axf2+ 9.Rf1 Dh4`
- **C56** Max Lange Attack, Loman Defense · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Ac5 5.O-O Cf6 6.e5 d5 7.exf6 dxc4 8.Te1+ Ae6 9.Cg5 g6`
- **C56** Max Lange Attack · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Cf6 5.O-O Ac5 6.e5`
- **C56** Yurdansky Attack · `1.e4 e5 2.Cf3 Cc6 3.d4 exd4 4.Ac4 Cf6 5.O-O Cxe4 6.Te1 d5 7.Axd5 Dxd5 8.Cc3 Da5 9.Cxe4 Ae6 10.Ag5 h6 11.Ah4 g5 12.Cf6+ Re7 13.b4`

#### Scotch Invitation Declined
*C56 · 1 línea*

- **C56** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 Cf6 4.d4 d6`

#### Paris Defense
*C50 · 1 línea*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 d6`

#### Rousseau Gambit
*C50 · 1 línea*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 f5`

#### Anti-Fried Liver Defense
*C50 · 1 línea*

- **C50** Línea base · `1.e4 e5 2.Cf3 Cc6 3.Ac4 h6`

</details>
