/**
 * Nombres de las variantes en español. Los de FreeChessTrainer y los de Lichess siguen la misma
 * convención inglesa, «Apertura: Variante, Subvariante, …», y se traducen con las mismas reglas:
 *
 *  - La palabra final (Variation, Gambit, Defense…) se vuelve el sustantivo y va primero: «Najdorf
 *    Variation» → «Variante Najdorf». Los adjetivos conocidos van después y concuerdan en género:
 *    «Classical Variation» → «Variante clásica», «Classical Defense» → «Defensa clásica».
 *  - Los nombres propios (Najdorf, Sämisch, Grünfeld…) se dejan como están: son apellidos.
 *  - Lo que no sigue la regla se escribe a mano en `EXACT`.
 *
 * Es lógica pura, sin importar nada: la usan el convertidor y sus pruebas.
 */

type Gender = 'm' | 'f';

/** Sustantivos que cierran un segmento. Cada uno trae su traducción y su género. */
const NOUNS: Readonly<Record<string, readonly [string, Gender]>> = {
  Variation: ['Variante', 'f'],
  Variations: ['Variantes', 'f'],
  Gambit: ['Gambito', 'm'],
  Countergambit: ['Contragambito', 'm'],
  Defense: ['Defensa', 'f'],
  Attack: ['Ataque', 'm'],
  System: ['Sistema', 'm'],
  Trap: ['Trampa', 'f'],
  Line: ['Línea', 'f'],
  Counterattack: ['Contraataque', 'm'],
  Hybrid: ['Híbrido', 'm'],
  Formation: ['Formación', 'f'],
  Opening: ['Apertura', 'f'],
  Game: ['Juego', 'm'],
  Sacrifice: ['Sacrificio', 'm'],
  Bind: ['Cerrojo', 'm'],
  Retreat: ['Retirada', 'f'],
  Sideline: ['Línea secundaria', 'f'],
  Extension: ['Extensión', 'f'],
  Dragon: ['Dragón', 'm'],
};

/** Adjetivos: masculino y femenino. Los que no cambian llevan el mismo texto dos veces. */
const ADJECTIVES: Readonly<Record<string, readonly [string, string]>> = {
  Classical: ['clásico', 'clásica'],
  Closed: ['cerrado', 'cerrada'],
  Open: ['abierto', 'abierta'],
  Modern: ['moderno', 'moderna'],
  Main: ['principal', 'principal'],
  Normal: ['normal', 'normal'],
  Old: ['antiguo', 'antigua'],
  Original: ['original', 'original'],
  Double: ['doble', 'doble'],
  Exchange: ['del cambio', 'del cambio'],
  Center: ['del centro', 'del centro'],
  Central: ['central', 'central'],
  Declined: ['rehusado', 'rehusada'],
  Accepted: ['aceptado', 'aceptada'],
  Deferred: ['diferido', 'diferida'],
  Delayed: ['retrasado', 'retrasada'],
  Accelerated: ['acelerado', 'acelerada'],
  Hyperaccelerated: ['hiperacelerado', 'hiperacelerada'],
  Advance: ['del avance', 'del avance'],
  Symmetrical: ['simétrico', 'simétrica'],
  Reversed: ['invertido', 'invertida'],
  Quiet: ['tranquilo', 'tranquila'],
  Sharp: ['agudo', 'aguda'],
  Positional: ['posicional', 'posicional'],
  Standard: ['estándar', 'estándar'],
  Traditional: ['tradicional', 'tradicional'],
  Orthodox: ['ortodoxo', 'ortodoxa'],
  Flexible: ['flexible', 'flexible'],
  Fluid: ['fluido', 'fluida'],
  Dynamic: ['dinámico', 'dinámica'],
  Early: ['temprano', 'temprana'],
  Immediate: ['inmediato', 'inmediata'],
  Extended: ['extendido', 'extendida'],
  Short: ['corto', 'corta'],
  Long: ['largo', 'larga'],
  Rare: ['rara', 'rara'],
  Hidden: ['oculto', 'oculta'],
  Primitive: ['primitivo', 'primitiva'],
  Endgame: ['de final', 'de final'],
  Development: ['de desarrollo', 'de desarrollo'],
  Pawn: ['de peón', 'de peón'],
  Poisoned: ['envenenado', 'envenenada'],
  Defensive: ['defensivo', 'defensiva'],
  Bishop: ['de alfil', 'de alfil'],
  Knight: ['de caballo', 'de caballo'],
  Queen: ['de dama', 'de dama'],
  Rook: ['de torre', 'de torre'],
  Catalan: ['catalán', 'catalana'],
  // Gentilicios: concuerdan con el sustantivo («Variante rusa», «Defensa siciliana»).
  American: ['americano', 'americana'],
  Argentine: ['argentino', 'argentina'],
  Argentinian: ['argentino', 'argentina'],
  Armenian: ['armenio', 'armenia'],
  Austrian: ['austríaco', 'austríaca'],
  Baltic: ['báltico', 'báltica'],
  Chinese: ['chino', 'china'],
  Czech: ['checo', 'checa'],
  Danish: ['danés', 'danesa'],
  Dutch: ['holandés', 'holandesa'],
  English: ['inglés', 'inglesa'],
  Finnish: ['finlandés', 'finlandesa'],
  French: ['francés', 'francesa'],
  Hungarian: ['húngaro', 'húngara'],
  Icelandic: ['islandés', 'islandesa'],
  Indian: ['indio', 'india'],
  Italian: ['italiano', 'italiana'],
  Norwegian: ['noruego', 'noruega'],
  Polish: ['polaco', 'polaca'],
  Romanian: ['rumano', 'rumana'],
  Russian: ['ruso', 'rusa'],
  Scandinavian: ['escandinavo', 'escandinava'],
  Siberian: ['siberiano', 'siberiana'],
  Sicilian: ['siciliano', 'siciliana'],
  Slav: ['eslavo', 'eslava'],
  Spanish: ['español', 'española'],
  Swiss: ['suizo', 'suiza'],
  Ukrainian: ['ucraniano', 'ucraniana'],
};

/** Nombres propios que sí tienen forma en español. */
const PROPER: Readonly<Record<string, string>> = {
  Scotch: 'Escocés',
  Basque: 'Vasco',
  Yugoslav: 'Yugoslavo',
  Berlin: 'Berlín',
  Lopez: 'López',
};

/** Frases que no siguen la regla general. */
const EXACT: Readonly<Record<string, string>> = {
  // Aperturas y familias (cuando el nombre las conserva como primer segmento)
  "Queen's Gambit": 'Gambito de Dama',
  "Queen's Gambit Declined": 'Gambito de Dama rehusado',
  "Queen's Gambit Accepted": 'Gambito de Dama aceptado',
  "Queen's Pawn Game": 'Juego de peón de dama',
  "King's Pawn Game": 'Juego de peón de rey',
  'Indian Defense': 'Defensa India',
  'English Opening': 'Apertura Inglesa',
  'Catalan Opening': 'Apertura Catalana',
  'Slav Defense': 'Defensa Eslava',
  'Semi-Slav Defense': 'Defensa Semieslava',
  'Semi-Slav Defense Accepted': 'Defensa Semieslava aceptada',
  'Semi-Slav': 'Semieslava',
  'Slav Gambit': 'Gambito Eslavo',
  'Slav Formation': 'Formación Eslava',
  'Sicilian Defense': 'Defensa Siciliana',
  'Caro-Kann Defense': 'Defensa Caro-Kann',
  'French Defense': 'Defensa Francesa',
  "King's Indian Defense": 'Defensa India de Rey',
  "King's Indian Attack": 'Ataque India de Rey',
  'Nimzo-Indian Defense': 'Defensa Nimzo-India',
  'Grünfeld Defense': 'Defensa Grünfeld',
  'London System': 'Sistema Londres',
  'Accelerated London System': 'Sistema Londres acelerado',
  'Catalan Defense': 'Defensa Catalana',
  'Catalan Defense Accepted': 'Defensa Catalana aceptada',
  "Queen's Indian Formation": 'Formación India de Dama',
  "Queen's Indian Variation": 'Variante India de Dama',
  "King's Indian Formation": 'Formación India de Rey',
  'Old Indian Formation': 'Formación India antigua',

  // Frases corrientes
  'Great Snake Variation': 'Variante de la Gran Serpiente',
  'Neo-Catalan': 'Neocatalana',
  'Neo-Catalan Declined': 'Neocatalana rehusada',
  'Early b3': 'b3 temprano',
  'Central Exchange': 'Cambio central',
  "King David's Opening": 'Apertura del Rey David',
  'Double-Dutch Gambit': 'Gambito Doble-Holandés',
  'Brooklyn Retreat Defense': 'Defensa de la retirada Brooklyn',
  'Retreat Variation': 'Variante de la retirada',
  'Retreat Line': 'Línea de la retirada',
  'Swiss Cheese Variation': 'Variante del queso suizo',
  'Anti-Qxd4 Move Order': 'Orden de jugadas anti-Dxd4',
  'Anti-Qxd4 Move Order Accepted': 'Orden de jugadas anti-Dxd4 aceptado',
  'Pseudo-Tarrasch Bishop Attack': 'Ataque del alfil Pseudo-Tarrasch',
  'Bradford Attack Variation': 'Variante del ataque Bradford',
  'Delayed ...Nc6': '...Cc6 retrasado',
  'Hyperaccelerated Pterodactyl': 'Pterodáctilo hiperacelerado',
  'Pterodactyl Variation': 'Variante Pterodáctilo',
  'Pseudo-Scandinavian': 'Pseudoescandinava',
  'Bird Invitation': 'Invitación Bird',
  "Christiansen's Dream": 'El sueño de Christiansen',
  'Nimzo-English': 'Nimzo-Inglesa',
  "Peresypkin's Sacrifice": 'Sacrificio Peresypkin',
  'Prickly Pawn Pass System': 'Sistema Prickly Pawn Pass',
  'Sveshnikov Transfer': 'Transferencia Sveshnikov',
  Sicilian: 'Variante siciliana',
  'Anglo-Dutch Defense': 'Defensa anglo-holandesa',
  'Anglo-Dutch Variation': 'Variante anglo-holandesa',
  'Anglo-Grünfeld Defense': 'Defensa Anglo-Grünfeld',
  'Anglo-Grünfeld Variation': 'Variante Anglo-Grünfeld',
  'Anglo-Indian Defense': 'Defensa anglo-india',
  'Anglo-Lithuanian Variation': 'Variante anglo-lituana',
  'Anglo-Scandinavian Defense': 'Defensa anglo-escandinava',
  'Anglo-Slav Variation': 'Variante anglo-eslava',
  'Anti-English': 'Anti-Inglesa',
  'Accelerated Dragon': 'Dragón acelerado',
  'Hyperaccelerated Dragon': 'Dragón hiperacelerado',
  'Chinese Dragon': 'Dragón chino',
  'Hungarian Dragon': 'Dragón húngaro',
  'Reversed Dragon': 'Dragón invertido',
  'Dragon Variation': 'Variante del Dragón',
  'Dragon Transfer': 'Transferencia del Dragón',
  'Accelerated Move Order': 'Orden de jugadas acelerado',
  'Early Deviations': 'Desviaciones tempranas',
  'Rare Defenses': 'Defensas raras',
  'Poisoned Pawn Variation': 'Variante del peón envenenado',
  'Poisoned Pawn Accepted': 'Peón envenenado aceptado',
  'Pawn Grab Line': 'Línea de la captura del peón',
  'Pawn Center Variation': 'Variante del centro de peones',
  'Three Pawn Attack': 'Ataque de los tres peones',
  'Four Pawns Attack': 'Ataque de los cuatro peones',
  'Six Pawns Attack': 'Ataque de los seis peones',
  'Two Knights': 'Dos Caballos',
  'Two Knights Attack': 'Ataque de los Dos Caballos',
  'Two Knights Variation': 'Variante de los Dos Caballos',
  'Three Knights': 'Tres Caballos',
  'Three Knights System': 'Sistema de los Tres Caballos',
  'Three Knights Variation': 'Variante de los Tres Caballos',
  'Four Knights System': 'Sistema de los Cuatro Caballos',
  'Four Knights Variation': 'Variante de los Cuatro Caballos',
  "King's Knight Variation": 'Variante del caballo de rey',
  "Queen's Knight": 'Caballo de dama',
  "Queen's Knight Variation": 'Variante del caballo de dama',
  'Knight Defense': 'Defensa del caballo',
  'Knight Variation': 'Variante del caballo',
  "King's English": 'Inglesa de rey',
  "King's English Variation": 'Variante Inglesa de rey',
  'English Attack': 'Ataque Inglés',
  'English Hybrid': 'Híbrido inglés',
  'Queen Attack': 'Ataque de dama',
  'Queen Attack Deferred': 'Ataque de dama diferido',
  'Queen Fianchetto Variation': 'Variante del fianchetto de dama',
  'Queenside Storm Line': 'Línea de la tormenta en el flanco de dama',
  'Wing Attack': 'Ataque del ala',
  'Wing Formation': 'Formación del ala',
  'Wing Gambit': 'Gambito del ala',
  'Wing Gambit Deferred': 'Gambito del ala diferido',
  'Flank Variation': 'Variante del flanco',
  'Bishop Sacrifice Line': 'Línea del sacrificio de alfil',
  'Knight Sacrifice Line': 'Línea del sacrificio de caballo',
  'Extended Bishop Swap': 'Cambio de alfiles extendido',
  'Endgame Offer': 'Oferta de final',
  'Endgame Variation': 'Variante del final',
  'Double Fianchetto': 'Doble fianchetto',
  'Double Fianchetto Attack': 'Ataque con doble fianchetto',
  'Classical Fianchetto': 'Fianchetto clásico',
  'Deferred Fianchetto': 'Fianchetto diferido',
  'Delayed Fianchetto': 'Fianchetto retrasado',
  'Immediate Fianchetto': 'Fianchetto inmediato',
  'Fianchetto Defense': 'Defensa del fianchetto',
  'Fianchetto Gambit': 'Gambito del fianchetto',
  'Fianchetto Line': 'Línea del fianchetto',
  'Fianchetto Variation': 'Variante del fianchetto',
  'Hedgehog': 'Erizo',
  'Hedgehog Defense': 'Defensa Erizo',
  'Hedgehog System': 'Sistema Erizo',
  'Hedgehog Variation': 'Variante Erizo',
  'Porcupine Variation': 'Variante Puercoespín',
  'Big Clamp Formation': 'Formación de la gran pinza',
  'Maróczy Bind': 'Cerrojo Maróczy',
  'Full Symmetry': 'Simetría completa',
  'Full Symmetry Line': 'Línea de simetría completa',
  'Symmetrical': 'Variante simétrica',
  'Symmetrical Defense': 'Defensa simétrica',
  'Ultra-Symmetrical Variation': 'Variante ultrasimétrica',
  'Old Sicilian': 'Siciliana antigua',
  'Reversed Closed Sicilian': 'Siciliana cerrada invertida',
  'Reversed Sicilian': 'Siciliana invertida',
  'Reversed Philidor Formation': 'Formación Philidor invertida',
  'Franco-Sicilian Defense': 'Defensa Franco-Siciliana',
  'Franco-Sicilian Variation': 'Variante Franco-Siciliana',
  'Standard Development': 'Desarrollo estándar',
  'Flexible Formation': 'Formación flexible',
  'Pin Defense': 'Defensa de la clavada',
  'Pin Variation': 'Variante de la clavada',
  'Gambit Line': 'Línea del gambito',
  'Modern Variations': 'Variantes modernas',
  'Siberian Trap': 'Trampa siberiana',
  'Lasker Trap': 'Trampa de Lasker',
  'Magnus Smith Trap': 'Trampa Magnus Smith',
  'Delayed Exchange Variation': 'Variante del cambio retrasada',
  'Delayed Alapin Variation': 'Variante Alapin retrasada',
  'Delayed Keres Attack': 'Ataque Keres retrasado',
  'Delayed Castling Line': 'Línea del enroque retrasado',
  'Alekhine Gambit Accepted': 'Gambito Alekhine aceptado',
  'Yugoslav Variation': 'Variante Yugoslava',
  'Lesser Simagin (Spassky)': 'Simagin menor (Spassky)',
  'Wolf Gambit': 'Gambito Wolf',
  'Kan Formation': 'Formación Kan',
  'Center Holding Variation': 'Variante del centro sostenido',
  'Scotch Invitation Declined': 'Invitación escocesa rehusada',
  'King March Line': 'Línea de la marcha del rey',
  "King's Bishop Variation": 'Variante del alfil de rey',
  'Fried Liver Attack': 'Ataque del Hígado Frito',
  'Two Knights Defense': 'Defensa de los Dos Caballos',
  "Greco's Attack": 'Ataque de Greco',
  'Smyslov-Breyer-Zaitsev Hybrid': 'Híbrido Smyslov-Breyer-Zaitsev',
  Open: 'Variante abierta',
  Closed: 'Variante cerrada',
  Normal: 'Variante normal',
  Classical: 'Variante clásica',
  Advance: 'Variante del avance',
  Traditional: 'Variante tradicional',
};

/** Adjetivo por palabra; «Neo-Classical» y «Semi-Classical» se funden en «neoclásico» y «semiclásico». */
function adjectiveOf(word: string): readonly [string, string] | undefined {
  const direct = ADJECTIVES[word];
  if (direct) return direct;
  const prefixed = /^(Neo|Semi)-(.+)$/.exec(word);
  const base = prefixed ? ADJECTIVES[prefixed[2]!] : undefined;
  if (!prefixed || !base) return undefined;
  const prefix = prefixed[1]!.toLowerCase();
  return [`${prefix}${base[0]}`, `${prefix}${base[1]}`];
}

/** Las piezas de las jugadas que aparecen en un nombre van en español: «Bd3» → «Ad3», «Nge2» → «Cge2». */
const PIECE_LETTERS: Readonly<Record<string, string>> = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' };
const piecesInSpanish = (text: string): string =>
  text.replace(/(?<![\p{L}\d])([KQRBN])([a-h]?[1-8]?x?[a-h][1-8])(?![\p{L}\d])/gu, (_all, piece: string, rest: string) => `${PIECE_LETTERS[piece]}${rest}`);

const OPENING_PREFIX = /^(?:Italian Game|Ruy Lopez|Vienna Gambit):\s*/;
const NOUN_WORDS = Object.keys(NOUNS).join('|');
const PHRASE = new RegExp(`^(.*?)\\s*(${NOUN_WORDS})$`);
const TAIL = /^(.+?)\s+(Declined|Accepted|Deferred|Reversed)$/;

/** ¿Es una jugada o un trozo de notación («a6», «4. Bg5», «.. Nc6»)? Se deja igual. */
const looksLikeMove = (word: string): boolean => /^(?:\d+\.|\.\.|[KQRBN]?[a-h][1-8]?|[KQRBN][a-h]?[1-8]?x?[a-h][1-8])$/.test(word);

function translateSegment(segment: string): string {
  const exact = EXACT[segment];
  if (exact) return exact;

  const withMatch = /^with\s+(.+)$/.exec(segment);
  if (withMatch) return `con ${withMatch[1]}`;

  // «Evans Gambit Declined», «Steinitz Defense Deferred»: el estado va al final.
  const tail = TAIL.exec(segment);
  if (tail) {
    const base = translateSegment(tail[1]!);
    const noun = Object.values(NOUNS).find(([word]) => base.startsWith(word));
    const [masculine, feminine] = ADJECTIVES[tail[2]!]!;
    return `${base} ${noun?.[1] === 'f' ? feminine : masculine}`;
  }

  const phrase = PHRASE.exec(segment);
  if (phrase) {
    const [noun, gender] = NOUNS[phrase[2]!]!;
    const names: string[] = [];
    const adjectives: string[] = [];
    for (const word of phrase[1]!.split(/\s+/).filter(Boolean)) {
      const adjective = adjectiveOf(word);
      if (adjective) adjectives.push(gender === 'f' ? adjective[1] : adjective[0]);
      else names.push(PROPER[word] ?? word);
    }
    return [noun, ...names, ...adjectives].join(' ');
  }

  // Sin sustantivo: una sola palabra suelta («Classical») o nombres propios («Tartakower»).
  const words = segment.split(' ');
  if (words.every((word) => looksLikeMove(word))) return segment;
  return words.map((word) => PROPER[word] ?? word).join(' ');
}

/**
 * «Italian Game: Classical Variation, Albin Gambit» → «Variante clásica, Gambito Albin».
 * `own` son los nombres de la propia apertura (en inglés): si el nombre empieza por uno, se quita,
 * porque la persona ya está dentro de esa apertura («Sicilian Defense: Najdorf Variation» → «Variante Najdorf»).
 * Un nombre que es solo la apertura se deja entero.
 */
export function translateName(nameEn: string, own: readonly string[] = []): string {
  // «.. d6» es «...d6» (jugada de las azules) y «4. Bg5» es «4.Bg5».
  const rest = nameEn.replace(OPENING_PREFIX, '').replace(/\.\.\s+/g, '...').replace(/(\d)\.\s+/g, '$1.');
  const parts = rest.split(/:\s+|,\s+/).filter(Boolean);
  const first = parts[0];
  // «King's Indian Attack, with Bf5» conserva la apertura: «con Af5» solo no dice de qué es.
  const dropFamily = first !== undefined && own.includes(first) && parts.length > 1 && !/^with\b/.test(parts[1]!);
  const trimmed = dropFamily ? parts.slice(1) : parts;
  const name = piecesInSpanish(trimmed.map(translateSegment).join(', '));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}
