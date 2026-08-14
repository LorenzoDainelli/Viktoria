/* Shift Hours — il messaggio per il capo.
 *
 * Il formato è vincolante alla lettera (PIANO-FASE-1-v2.md, sezione 5):
 * è ciò che riceve il suo capo e su cui viene pagata.
 *
 *   Week ending 16 August
 *   Monday: 8:00 - 16:30 8.30 hrs
 *   Saturday: 8:30 - 17:00 8.30 hrs
 *   17 hours
 *
 * Fra i due orari un trattino spaziato, fra l'orario di fine e le ore solo
 * uno spazio: è il formato chiesto da Viktoria il 14 agosto 2026.
 *
 * Con un solo giorno lavorato l'ultima riga sparisce: ripeterebbe la stessa
 * cifra. La paga stimata non entra mai nel messaggio.
 */

import {
  DAY_NAMES,
  formatDayMonth,
  formatHrs,
  formatTime,
  formatTotalLong,
  shiftMinutes,
  sundayOf,
  totalMinutes,
  workedDays,
} from "./week.js";

import { noteForWeek } from "./notes.js";

/**
 * @returns {string|null} il messaggio, o null se non ha lavorato nessun giorno
 */
export function buildSummary(week, days) {
  const worked = workedDays(week, days);
  if (worked.length === 0) return null;

  const lines = [`Week ending ${formatDayMonth(sundayOf(week.weekStart))}`];

  for (const day of worked) {
    const shift = week.days[day];
    lines.push(
      `${DAY_NAMES[day - 1]}: ${formatTime(shift.start)} - ${formatTime(shift.end)}` +
      ` ${formatHrs(shiftMinutes(shift))}`
    );
  }

  if (worked.length > 1) {
    lines.push(formatTotalLong(totalMinutes(week, days)));
  }

  return lines.join("\n");
}

/**
 * Lo stesso contenuto, incolonnato, per il riquadro dentro l'app.
 *
 * **Non è il messaggio.** Quello che arriva al capo lo costruisce
 * `buildSummary()` qui sopra e non deve cambiare mai: le colonne allineate
 * reggono solo in un font a spaziatura fissa, e WhatsApp scrive con un font
 * proporzionale, dove le stesse righe si sfaserebbero.
 *
 * Le misure sono quelle fissate da Lorenzo il 14 agosto 2026: dopo il nome del
 * giorno più lungo tre spazi prima di un'ora a una cifra (due se ne ha due),
 * tre spazi fra la fine del turno e le ore. In tutto 35 caratteri.
 *
 *       Week ending 16 August
 *   -----------------------------------
 *   Monday      9:00 - 17:00      8 hrs
 *   Wednesday  10:00 - 17:00      7 hrs
 *   Thursday    9:00 - 16:30   7.30 hrs
 *   -----------------------------------
 *   Total                      55 hours
 *
 * @returns {string|null} lo scontrino, o null se non ha lavorato nessun giorno
 */
export function buildReceipt(week, days) {
  const worked = workedDays(week, days);
  if (worked.length === 0) return null;

  const rows = worked.map((day) => {
    const shift = week.days[day];
    return (
      DAY_NAMES[day - 1].padEnd(9) +
      formatTime(shift.start).padStart(7) +
      " - " +
      formatTime(shift.end).padStart(5) +
      "   " +
      formatHrs(shiftMinutes(shift)).padStart(8)
    );
  });

  // La larghezza la decidono le righe, non un numero scritto a mano: se un
  // giorno esce più lungo del previsto, righello e totale lo seguono.
  const width = Math.max(...rows.map((row) => row.length));
  const rule = "-".repeat(width);
  const title = `Week ending ${formatDayMonth(sundayOf(week.weekStart))}`;
  const total = formatTotalLong(totalMinutes(week, days));

  const lines = [
    padCenter(title, width),
    rule,
    ...rows,
    rule,
    "Total".padEnd(9) + total.padStart(width - 9),
  ];

  // La frase della settimana, centrata come il titolo e staccata dal totale.
  // Non esiste in `buildSummary()`: al capo non arriva.
  const note = noteForWeek(week.weekStart);
  if (note) lines.push("", padCenter(note, width));

  return lines.join("\n");
}

function padCenter(text, width) {
  const left = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(left) + text;
}

/**
 * Copia negli appunti. Su iPhone in HTTPS funziona l'API moderna; il ripiego
 * serve ai browser che non ce l'hanno o quando la pagina non è sicura.
 *
 * @returns {Promise<boolean>}
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // si prova il ripiego qui sotto
  }

  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length); // iOS ignora select() da solo
    const done = document.execCommand("copy");
    document.body.removeChild(field);
    return done;
  } catch {
    return false;
  }
}
