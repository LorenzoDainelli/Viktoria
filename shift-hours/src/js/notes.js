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
 *   2. **Massimo 35 caselle** per frase. È la larghezza dello scontrino: una
 *      frase più lunga sfonderebbe le colonne di tutto il resto. Sotto i 30 sta
 *      meglio, perché centrata respira. Attenzione: una emoji occupa **due**
 *      caselle, non una — vedi `displayWidth()` qui sotto.
 *
 * Le frasi le scrive Lorenzo. Vanno in inglese, come tutto il resto dell'app.
 */

/** @type {string[]} */
export const NOTES = [
  "Have an amazing week love 💋💋☀️!",   // 33 caselle
];

/** La larghezza dello scontrino, e quindi il limite di una frase. */
export const MAX_NOTE = 35;

/**
 * Quante caselle occupa una frase nel carattere a spaziatura fissa.
 *
 * Non è `note.length`, per due motivi che tirano in direzioni opposte:
 *
 *   - JavaScript conta a coppie di byte, non a caratteri: `"💋".length` è 2
 *     perché quella emoji sta fuori dal primo blocco Unicode;
 *   - a schermo un'emoji è larga **il doppio** di una lettera, perché la
 *     disegna il font di sistema (Apple Color Emoji sull'iPhone) e i suoi
 *     glifi sono quadrati.
 *
 * Qui si conta quello che conta davvero: le caselle occupate. Le emoji
 * valgono 2, le lettere 1, e i pezzi invisibili che tengono insieme le emoji
 * composte — il selettore di variante, il tono della pelle, il giunto a
 * larghezza zero — valgono 0, perché non si vedono e non spostano niente.
 *
 * Non pretende la precisione al pixel: la frase è centrata e decorativa, non
 * deve incolonnarsi con nient'altro. Serve solo a non farla sfondare.
 *
 * Misurato in browser il 14 agosto 2026, dentro la bolla dello scontrino a
 * 393 px di larghezza: una casella 8,44 px, un'emoji 17,47 px, cioè **2,07
 * caselle**. Contarla 2 sbaglia di sette centesimi per emoji, in difetto:
 * con tre emoji in una frase il conto perde due decimi di casella, che a
 * schermo sono meno di due pixel.
 */
export function displayWidth(text) {
  let cells = 0;
  for (const ch of text) {           // per punti di codice, non per byte
    const cp = ch.codePointAt(0);
    if (
      cp === 0xfe0f || cp === 0xfe0e ||          // selettori di variante
      cp === 0x200d ||                            // giunto a larghezza zero
      (cp >= 0x1f3fb && cp <= 0x1f3ff)            // toni della pelle
    ) {
      continue;                                   // invisibili: zero caselle
    }
    const wide =
      cp >= 0x1f000 ||                            // il grosso delle emoji
      (cp >= 0x2600 && cp <= 0x27bf) ||           // simboli vari, dingbat
      (cp >= 0x2b00 && cp <= 0x2bff) ||           // frecce e forme
      (cp >= 0x3000 && cp <= 0x9fff);             // punteggiatura e ideogrammi CJK
    cells += wide ? 2 : 1;
  }
  return cells;
}

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
  const usable = NOTES.filter((note) => {
    const cells = displayWidth(note);
    return cells > 0 && cells <= MAX_NOTE;
  });
  if (usable.length === 0) return null;

  const [y, m, d] = weekStartISO.split("-").map(Number);
  const weeks = Math.floor((Date.UTC(y, m - 1, d) - EPOCH_MONDAY) / 604800000);

  // L'operatore % in JavaScript dà risultati negativi sui numeri negativi:
  // senza questa correzione una settimana prima del 2026 romperebbe l'indice.
  return usable[((weeks % usable.length) + usable.length) % usable.length];
}
