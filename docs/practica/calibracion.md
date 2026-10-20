# Calibración de los doce rivales

Cómo se fijó el Elo de cada personaje del modo Práctica, con qué datos y hasta dónde se puede creer.

## Qué significa el Elo que se muestra

Es **aproximado y está en la escala de Stockfish**, la del propio motor. No es un Elo FIDE ni el de una plataforma
en línea (Lichess, Chess.com…), y no hay forma honesta de convertirlo a esos: cada una tiene su escala y sus
jugadores. Sirve para ordenar a los rivales y para elegir uno «de un nivel parecido al tuyo»: si le ganas con
facilidad al de 1000, prueba el siguiente.

Un motor debilitado a propósito tampoco falla como una persona de ese Elo: sus errores salen del azar, no de la
falta de experiencia.

## Cómo juega cada nivel

- **Hasta 1200** (peones, caballos y alfil blanco). Stockfish no baja de 1320, así que aquí se usa un muestreo
  propio (`src/bots/strength.ts`): busca a poca profundidad varias jugadas candidatas, elige una con más
  probabilidad cuanto mejor sea (la *temperatura* decide cuánto se reparte) y a veces «se despista»: con cierta
  probabilidad juega al azar una que no es la mejor.
- **De 1400 a 2500** (alfil azul → rey blanco). Stockfish con su propio límite de fuerza (`UCI_LimitStrength` y
  `UCI_Elo`), con 0.4–1 s por jugada. El Elo de esos niveles es el que define el motor.
- **Rey Supremo** (3000+). Stockfish sin límite, 1.5 s por jugada.

## Resultado

Elo medido de cada configuración, con el margen aproximado al 95 %:

| Rival | Elo mostrado | Cómo juega | Elo medido |
| --- | ---: | --- | ---: |
| Peón Aprendiz | 400 | profundidad 1, 8 variantes, temperatura 320, despistes 38 % | 359 ± 30 |
| Peón Valiente | 600 | profundidad 1, 8 variantes, temperatura 215, despistes 27 % | 588 ± 28 |
| Caballo Saltarín | 800 | profundidad 1, 7 variantes, temperatura 170, despistes 18 % | 775 ± 29 |
| Caballo Astuto | 1000 | profundidad 2, 5 variantes, temperatura 200, despistes 15 % | 974 ± 23 |
| Alfil Curioso | 1200 | profundidad 3, 5 variantes, temperatura 150, despistes 10 % | 1202 ± 30 |
| Alfil Sagaz | 1400 | `UCI_Elo` 1400 | 1371 ± 55 |
| Torre Firme | 1600 | `UCI_Elo` 1600 | 1733 ± 104 † |
| Torre Estratega | 1800 | `UCI_Elo` 1800 | 1777 ± 104 † |
| Dama Veloz | 2000 | `UCI_Elo` 2000 | 1949 ± 107 † |
| Dama Implacable | 2200 | `UCI_Elo` 2200 | 2070 ± 104 † |
| Rey Maestro | 2500 | `UCI_Elo` 2500 | 2174 ± 126 † |
| Rey Supremo | 3000+ | sin límite | por encima de todos |

Los cinco primeros caen a menos de 45 puntos del número que se muestra. † Los de arriba se midieron con 24 partidas
por enfrentamiento y solo 60 ms por jugada (en la app piensan de 0.4 a 1 s): su margen es de ±100 y los más fuertes
salen más flojos que su número porque a 60 ms no llegan a la profundidad que tendrían con más tiempo. El número que
se muestra en esos niveles es el que define Stockfish.

## Cómo se midió

1. `npm run bots:duel` juega partidas entre dos rivales con **el mismo código de la app** (`planSearch` y
   `pickMove`) y el mismo Stockfish de `public/engine`, ejecutado por Node. Cada partida empieza en la posición
   inicial y se alternan los colores; la variedad sale del azar de los rivales y no de una lista de aperturas.
2. Se jugaron 205 enfrentamientos de 24 a 100 partidas (9 524 en total) entre 38 configuraciones: las candidatas
   de los cinco niveles bajos, sus vecinas y la escalera de `UCI_Elo`. Los resultados están en
   [`calibracion.jsonl`](calibracion.jsonl).
3. `npm run bots:fit` ajusta un modelo Bradley–Terry (máxima verosimilitud) a todos los resultados a la vez, con
   `elo:1320` fijo en 1320, el mínimo que admite Stockfish. Así quedan enlazados también los rivales que nunca se
   enfrentaron, a través de los que tienen en común.
4. Para cada nivel se probaron varias configuraciones y se dejó la más cercana al número redondo. Las primeras
   suposiciones estaban lejos en tres niveles (la de «800» salió en ≈880, la de «1000» en ≈1190 y la de «1200» en
   ≈1550); por eso se midió en vez de suponer.

Para repetirlo:

```bash
npm run bots:duel -- --a sampler:1:8:215:0.27 --b elo:1320 --games 100 --seed 7 >> resultados.jsonl
npm run bots:fit -- docs/practica/calibracion.jsonl --anchor elo:1320=1320
```

`bots:duel` acepta `persona:<id>`, `elo:<elo>[:<ms>]`, `max[:<ms>]` y
`sampler:<profundidad>:<variantes>:<temperatura>:<despistes>`.

## Límites

- Con 100 partidas entre dos rivales de nivel parecido, el margen de una sola ronda es de ±60 puntos de Elo; por
  eso se juntaron muchos enfrentamientos. El margen de la tabla es el de una aproximación (información de Fisher por
  rival) y subestima el error de los que solo quedan enlazados por cadenas largas.
- No hay que leer como real una diferencia de pocas decenas de puntos entre dos rivales cercanos.
- Los rivales se midieron contra otros rivales del mismo programa. Contra una persona el orden se mantiene, pero los
  números pueden moverse.
- Cada rival tiene una sola configuración. Si se cambia una (`src/bots/personas.ts`), hay que volver a medir.
