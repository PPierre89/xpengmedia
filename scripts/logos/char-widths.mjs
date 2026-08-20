/**
 * Largeur d'avance de chaque caractère, en em, pour la pile de polices des
 * logotypes (`system-ui` et ses replis).
 *
 * Pourquoi une table plutôt qu'une constante : le générateur estimait
 * auparavant 0,62 em pour TOUS les caractères. Or les vraies valeurs vont de
 * 0,343 (« i », « l ») à 1,103 (« W »). Comme le corps de la police était
 * calculé à partir de cette estimation puis la largeur figée par
 * `textLength`, les glyphes étaient étirés ou comprimés pour rattraper
 * l'écart : « CANAL+ » sortait comprimé à 81 %, « CNEWS » à 76 %, tandis que
 * « xfinity » était étiré à 122 %. Les tuiles paraissaient cassées.
 *
 * Avec ces largeurs, la taille de police est calculée pour que la largeur
 * naturelle du texte corresponde déjà à la largeur visée : `textLength` ne
 * corrige plus qu'un résidu négligeable et ne déforme plus rien. Il reste
 * présent pour figer le rendu quelle que soit la police réellement disponible
 * sur l'écran embarqué.
 *
 * Mesuré dans Chromium à 100 px, en graisse 700, chaque caractère répété dix
 * fois pour amortir l'arrondi. Régénérer avec scripts/measure-char-widths.mjs
 * si la pile de polices change.
 */
export const CHAR_WIDTHS = Object.freeze({
  ".": 0.38, "+": 0.838, "0": 0.696, "1": 0.696, "3": 0.696, "5": 0.696,
  "6": 0.696, "7": 0.696, "8": 0.696, "9": 0.696, "a": 0.675, "A": 0.774,
  "b": 0.716, "B": 0.762, "c": 0.593, "C": 0.734, "d": 0.716, "D": 0.83,
  "e": 0.678, "E": 0.683, "f": 0.405, "F": 0.683, "g": 0.716, "G": 0.821,
  "h": 0.712, "H": 0.837, "i": 0.343, "I": 0.372, "j": 0.343, "J": 0.372,
  "k": 0.665, "K": 0.775, "l": 0.343, "L": 0.637, "m": 1.042, "M": 0.995,
  "n": 0.712, "N": 0.837, "o": 0.687, "O": 0.85, "p": 0.716, "P": 0.733,
  "Q": 0.85, "r": 0.493, "R": 0.77, "s": 0.595, "S": 0.68, "t": 0.478,
  "T": 0.703, "u": 0.712, "U": 0.812, "v": 0.652, "V": 0.774, "w": 0.924,
  "W": 1.103, "x": 0.645, "X": 0.771, "y": 0.652, "Y": 0.724, "z": 0.582,
  "Z": 0.725,
});

/** Repli pour un caractère absent de la table (moyenne mesurée). */
export const DEFAULT_CHAR_WIDTH = 0.692;

/** Largeur d'une chaîne, en em. */
export function measureEm(text) {
  let total = 0;
  for (const character of text) total += CHAR_WIDTHS[character] ?? DEFAULT_CHAR_WIDTH;
  return total;
}
