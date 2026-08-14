/* Shift Hours — calendario delle copie di sicurezza.
 *
 * Solo funzioni pure: niente DOM, niente localStorage. Qui vive tutta la
 * logica di "quale mese va salvato e cosa ci finisce dentro", così si può
 * ragionare (e sbagliare) in un posto solo.
 *
 * Regole, da PIANO-FASE-2.md sezione 3:
 *   - una settimana appartiene al mese della sua DOMENICA;
 *   - un mese è chiuso quando la settimana corrente appartiene a un mese
 *     successivo;
 *   - il file contiene tutto dall'inizio fino all'ultima settimana del mese
 *     chiuso, quindi è sempre cumulativo.
 */

import { addDays, fromISODate, toISODate } from "./week.js";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Dal lunedì al mese ───────────────────────────────────────────── */

/** La domenica che chiude la settimana iniziata in `weekStartISO`. */
export function sundayOfWeek(weekStartISO) {
  return addDays(fromISODate(weekStartISO), 6);
}

/** "2026-08" — il mese a cui appartiene la settimana, cioè quello della domenica. */
export function monthOfWeek(weekStartISO) {
  const sunday = sundayOfWeek(weekStartISO);
  return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}`;
}

/** "August26" — il nome che lei vedrà nella cartella. */
export function monthLabel(month) {
  const [year, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]}${String(year).slice(-2)}`;
}

/** "August" — per il testo dell'avviso. */
export function monthName(month) {
  return MONTHS[Number(month.split("-")[1]) - 1];
}

export function fileNameFor(month) {
  return `${monthLabel(month)}.json`;
}

/* ── Mesi chiusi ──────────────────────────────────────────────────── */

/** Il mese precedente. "2027-01" → "2026-12". */
function previousMonth(month) {
  const [year, m] = month.split("-").map(Number);
  return m === 1
    ? `${year - 1}-12`
    : `${year}-${String(m - 1).padStart(2, "0")}`;
}

/**
 * L'ultimo mese chiuso, visto dalla settimana in cui lei si trova adesso.
 * Settimana che finisce il 6 settembre → mese corrente settembre → chiuso agosto.
 */
export function closedMonth(currentWeekStartISO) {
  return previousMonth(monthOfWeek(currentWeekStartISO));
}

/**
 * L'ultima domenica del mese: è la fine dell'ultima settimana che gli
 * appartiene, e quindi il taglio del file. Agosto 2026 → 2026-08-30.
 */
export function coversUntil(month) {
  const [year, m] = month.split("-").map(Number);
  const last = new Date(year, m, 0);   // giorno 0 del mese dopo = ultimo di questo
  last.setDate(last.getDate() - last.getDay()); // indietro fino alla domenica
  return toISODate(last);
}

/* ── Selezione delle settimane ────────────────────────────────────── */

/** Vero se la settimana finisce entro il taglio (estremo incluso). */
export function weekIsWithin(weekStartISO, coversUntilISO) {
  return toISODate(sundayOfWeek(weekStartISO)) <= coversUntilISO;
}

/** Le settimane da mettere nel file, dalla più recente alla più vecchia. */
export function weeksWithin(weeks, coversUntilISO) {
  return weeks
    .filter((entry) => entry && weekIsWithin(entry.weekStart, coversUntilISO))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

/** Vero se in quelle settimane c'è almeno un turno: se non c'è, niente avviso. */
export function hasHours(weeks) {
  return weeks.some((entry) => entry && Object.keys(entry.days || {}).length > 0);
}

/* ── Cosa chiedere ────────────────────────────────────────────────── */

/**
 * Decide se mostrare l'avviso arancione.
 *
 * @param {string} currentWeekStartISO lunedì della settimana in corso
 * @param {Array}  weeks               tutte le settimane conosciute
 * @param {?string} lastSavedMonth     ultimo mese già salvato ("2026-08" o null)
 * @returns {?{month:string, title:string, label:string, name:string, until:string}}
 */
export function pendingBackup(currentWeekStartISO, weeks, lastSavedMonth) {
  const month = closedMonth(currentWeekStartISO);
  if (lastSavedMonth && lastSavedMonth >= month) return null;

  const until = coversUntil(month);
  if (!hasHours(weeksWithin(weeks, until))) return null;

  return {
    month,                        // "2026-08"
    title: monthName(month),      // "August"    — per l'avviso
    label: monthLabel(month),     // "August26"  — per la conferma e lo stato
    name: fileNameFor(month),     // "August26.json"
    until,                        // "2026-08-30"
  };
}
