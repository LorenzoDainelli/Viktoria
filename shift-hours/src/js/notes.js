/* Shift Hours — la frase in fondo allo scontrino.
 *
 * Ogni settimana, sotto il totale, compare una frase presa da questo elenco.
 * Cambia di settimana in settimana e resta la stessa per tutta la settimana:
 * non è un sorteggio a ogni apertura, se no le ballerebbe sotto gli occhi
 * ogni volta che tocca uno slider.
 *
 * DUE COSE CHE NON DEVONO CAMBIARE MAI:
 *
 *   1. Questa frase **non entra nel messaggio che va al capo**. Vive solo
 *      dentro `buildReceipt()`; `buildSummary()` non la conosce nemmeno.
 *   2. **Massimo 35 caratteri** per frase. È la larghezza dello scontrino: una
 *      frase più lunga sfonderebbe le colonne di tutto il resto. Sotto i 30 sta
 *      meglio, perché centrata respira.
 *
 * Le frasi le scrive Lorenzo. Vanno in inglese, come tutto il resto dell'app.
 */

/** @type {string[]} */
export const NOTES = [
  // Ancora vuoto: finché è così, lo scontrino finisce con il totale.
];

/** La larghezza dello scontrino, e quindi il limite di una frase. */
export const MAX_NOTE = 35;

/* Un lunedì di riferimento da cui contare le settimane. */
const EPOCH_MONDAY = Date.UTC(2026, 0, 5); // lunedì 5 gennaio 2026

/**
 * La frase di una certa settimana.
 *
 * **Non è un sorteggio**: è un giro. Le frasi si susseguono in ordine, una per
 * settimana, e quando finiscono si ricomincia. Il motivo è che un sorteggio
 * vero, con poche frasi, ne ripete due o tre e ne lascia fuori altre per mesi
 * — provato, con cinque frasi ne uscivano tre. Così invece le vede tutte, e
 * non ne capita mai una uguale due settimane di fila.
 *
 * La frase dipende solo dalla data: la stessa settimana dà sempre la stessa
 * frase, a ogni riapertura e su tutti e due i telefoni.
 *
 * @param {string} weekStartISO "2026-08-10"
 * @returns {string|null} la frase, o null se non ce ne sono
 */
export function noteForWeek(weekStartISO) {
  const usable = NOTES.filter((note) => note.length > 0 && note.length <= MAX_NOTE);
  if (usable.length === 0) return null;

  const [y, m, d] = weekStartISO.split("-").map(Number);
  const weeks = Math.floor((Date.UTC(y, m - 1, d) - EPOCH_MONDAY) / 604800000);

  // L'operatore % in JavaScript dà risultati negativi sui numeri negativi:
  // senza questa correzione una settimana prima del 2026 romperebbe l'indice.
  return usable[((weeks % usable.length) + usable.length) % usable.length];
}
