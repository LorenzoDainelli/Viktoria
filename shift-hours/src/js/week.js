/* Shift Hours — calendario e formattazione.
 *
 * Ogni orario è espresso in minuti dalla mezzanotte, multipli di 5.
 * I formati qui dentro sono vincolanti: sono quelli che finiscono nel
 * messaggio che lei manda al capo (vedi PIANO-FASE-1-v2.md, sezione 5).
 */

export const MIN_TIME = 5 * 60;   // 05:00
export const MAX_TIME = 24 * 60;  // 24:00
export const STEP = 5;            // minuti
export const MIN_SPAN = 5;        // durata minima di un turno

/* 1 = lunedì … 7 = domenica */
export const DAY_NAMES = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

export const DAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Date ─────────────────────────────────────────────────────────── */

/** Lunedì della settimana che contiene `date`, a mezzanotte locale. */
export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (d.getDay() + 6) % 7; // domenica (0) → 6
  d.setDate(d.getDate() - shift);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/** "2026-08-10" — data locale, mai UTC: la settimana è quella del suo telefono. */
export function toISODate(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Data di un giorno della settimana: dayNumber 1 = lunedì … 7 = domenica. */
export function dateOfDay(weekStartISO, dayNumber) {
  return addDays(fromISODate(weekStartISO), dayNumber - 1);
}

/** La domenica che chiude la settimana: è la data che va nel messaggio. */
export function sundayOf(weekStartISO) {
  return dateOfDay(weekStartISO, 7);
}

/** "16 August" */
export function formatDayMonth(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "16 August 2026" — usato solo nello storico, mai nel messaggio. */
export function formatDayMonthYear(date) {
  return `${formatDayMonth(date)} ${date.getFullYear()}`;
}

/* ── Orari e durate ───────────────────────────────────────────────── */

export function snap(minutes) {
  const clamped = Math.min(MAX_TIME, Math.max(MIN_TIME, minutes));
  return Math.round(clamped / STEP) * STEP;
}

/** "7:30", "17:20", "24:00" — 24 ore, senza zero davanti all'ora. */
export function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/**
 * Durata in ore e minuti, NON in decimali: 9 ore e 50 minuti → "9.50".
 * È la convenzione che lei usa già col capo. Le ore tonde non hanno decimali.
 */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}` : `${h}.${String(m).padStart(2, "0")}`;
}

/** "9.50 hrs" */
export function formatHrs(minutes) {
  return `${formatDuration(minutes)} hrs`;
}

/** "45 hours", "45 hours and 25 minutes", "1 hour", "45 minutes". */
export function formatTotalLong(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hours = `${h} ${h === 1 ? "hour" : "hours"}`;
  const mins = `${m} ${m === 1 ? "minute" : "minutes"}`;
  if (h === 0) return mins;
  if (m === 0) return hours;
  return `${hours} and ${mins}`;
}

/* ── Turni ────────────────────────────────────────────────────────── */

export function shiftMinutes(shift) {
  return shift ? shift.end - shift.start : 0;
}

/** Totale dei soli giorni previsti dal tipo di settimana. */
export function totalMinutes(week, days) {
  return days.reduce((sum, day) => sum + shiftMinutes(week.days[day]), 0);
}

/** Giorni lavorati, in ordine da lunedì a domenica. */
export function workedDays(week, days) {
  return days.filter((day) => week.days[day]).sort((a, b) => a - b);
}
