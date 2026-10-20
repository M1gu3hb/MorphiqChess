import { describe, expect, it } from 'vitest';
import { translateName } from './names';

describe('nombres de las variantes de Lichess', () => {
  const cases: [string, string[], string][] = [
    // La propia apertura se quita; si el nombre es solo ella, se deja.
    ['Sicilian Defense: Najdorf Variation, English Attack', ['Sicilian Defense'], 'Variante Najdorf, Ataque Inglés'],
    ['Sicilian Defense', ['Sicilian Defense'], 'Defensa Siciliana'],
    ["King's Indian Attack, with Bf5", ["King's Indian Attack"], 'Ataque India de Rey, con Af5'],
    ['French Defense, Classical, 4. Bg5', ['French Defense'], 'Variante clásica, 4.Ag5'],
    // Otras aperturas dentro del curso conservan su nombre.
    ["Queen's Gambit Declined: Slav Defense, Exchange Variation", [], 'Gambito de Dama rehusado, Defensa Eslava, Variante del cambio'],
    ["Queen's Gambit Accepted: Normal Variation, .. a6 Sideline", [], 'Gambito de Dama aceptado, Variante normal, Línea secundaria ...a6'],
    ["Queen's Pawn Game: Accelerated London System, Steinitz Countergambit", [], 'Juego de peón de dama, Sistema Londres acelerado, Contragambito Steinitz'],
    // Género de los adjetivos según el sustantivo.
    ['Caro-Kann Defense: Classical Variation', ['Caro-Kann Defense'], 'Variante clásica'],
    ['Caro-Kann Defense: Classical Defense', ['Caro-Kann Defense'], 'Defensa clásica'],
    ['French Defense: Winawer Variation, Poisoned Pawn Variation Declined', ['French Defense'], 'Variante Winawer, Variante del peón envenenado rehusada'],
    ['Sicilian Defense: Alapin Variation, Delayed Alapin Variation', ['Sicilian Defense'], 'Variante Alapin, Variante Alapin retrasada'],
    ["King's Indian Defense: Semi-Classical Variation", ["King's Indian Defense"], 'Variante semiclásica'],
    ['Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation', ['Sicilian Defense'], 'Variante Richter-Rauzer, Variante neomoderna'],
    ['English Opening: Symmetrical Variation, Botvinnik System Reversed, with e3', ['English Opening'], 'Variante simétrica, Sistema Botvinnik invertido, con e3'],
    // Gentilicios, nombres compuestos y frases hechas.
    ['Sicilian Defense: Hungarian Variation', ['Sicilian Defense'], 'Variante húngara'],
    ['Sicilian Defense: Accelerated Dragon', ['Sicilian Defense'], 'Dragón acelerado'],
    ['Sicilian Defense: Four Knights Variation', ['Sicilian Defense'], 'Variante de los Cuatro Caballos'],
    ['Catalan Opening: Closed Variation', ['Catalan Opening'], 'Variante cerrada'],
    ['Grünfeld Defense: Russian Variation', ['Grünfeld Defense'], 'Variante rusa'],
    ['Nimzo-Indian Defense: Sämisch Variation', ['Nimzo-Indian Defense'], 'Variante Sämisch'],
    // Las jugadas de las piezas van con las letras españolas.
    ['Sicilian Defense: Bd3 Line', ['Sicilian Defense'], 'Línea Ad3'],
    ['London System, with Nge2', [], 'Sistema Londres, con Cge2'],
    ['English Opening: Anti-Qxd4 Move Order Accepted', ['English Opening'], 'Orden de jugadas anti-Dxd4 aceptado'],
  ];

  it.each(cases)('%s', (english, own, spanish) => {
    expect(translateName(english, own)).toBe(spanish);
  });

  it('la mayúscula inicial es siempre de la primera letra del nombre', () => {
    expect(translateName("King's Indian Attack: with e6", ["King's Indian Attack"])).toMatch(/^Ataque/);
    expect(translateName('Sicilian Defense: with e6', ['Sicilian Defense'])).toBe('Defensa Siciliana, con e6');
  });
});
