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
