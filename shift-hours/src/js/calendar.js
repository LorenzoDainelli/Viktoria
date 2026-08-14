/* Shift Hours — il calendario.
 *
 * Un mese alla volta, uno sotto l'altro, in sola lettura: qui non si modifica
 * niente, si guarda com'è andato il mese.
 *
 * Ogni casella porta il numero del giorno, il guadagno arrotondato all'euro e
 * un fondo colorato in base a quanto ha reso quel giorno. La scala è **per
 * mese**: il giorno più pagato del mese che si sta guardando prende il colore
 * più intenso. Se fosse la scala di sempre, un turno da dodici ore a Natale
 * schiaccerebbe tutti gli altri mesi in un grigio indistinguibile per anni.
 *
 * Funzioni pure: niente DOM, niente localStorage.
 */

import { dateOfDay, fromISODate, toISODate } from "./week.js";
import { holidayName } from "./holidays.js";
import { dayPay } from "./rates.js";

/** Quanti gradini ha la sfumatura. Devono esistere i token --sh-heat-0…5. */
export const HEAT_LEVELS = 6;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-08" → "August 2026" */
export function monthTitle(month) {
  const [year, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${year}`;
}

/** Il mese di una data ISO: "2026-08-14" → "2026-08". */
export function monthOf(iso) {
  return iso.slice(0, 7);
}

/** Il mese `delta` mesi dopo quello dato. Accetta delta negativi. */
export function shiftMonth(month, delta) {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Da quale mese a quale mese si può scorrere.
 *
 * Estremi fissi, decisi con Lorenzo: gennaio 2026 – dicembre 2028. Non
 * dipendono dai dati né dalla data di oggi, così il calendario è sempre lo
 * stesso e i mesi vuoti davanti e dietro non spariscono da soli.
 *
 * Quando ci si avvicinerà alla fine del 2028, `LAST_MONTH` va spostato: è
 * l'unica riga da cambiare.
 */
export const FIRST_MONTH = "2026-01";
export const LAST_MONTH = "2028-12";

export function monthRange() {
  return { first: FIRST_MONTH, last: LAST_MONTH };
}

/** L'elenco dei mesi dal primo all'ultimo compresi, dal più vecchio. */
export function monthsBetween(first, last) {
  const months = [];
  let month = first;
  // Un tetto duro: se le date fossero assurde, meglio una lista corta che un
  // ciclo che non finisce mai mentre lei guarda lo schermo.
  for (let i = 0; month <= last && i < 600; i++) {
    months.push(month);
    month = shiftMonth(month, 1);
  }
  return months;
}

/* ── I giorni di un mese ──────────────────────────────────────────── */

/**
 * Quanto ha guadagnato in ogni giorno, preso da tutte le settimane conosciute.
 *
 * @returns {Map<string, number>} data ISO → euro
 */
export function payByDay(weeks, rates) {
  const byDay = new Map();
  if (rates.length === 0) return byDay;

  for (const entry of weeks) {
    const days = entry.typeDays?.length ? entry.typeDays : [1, 2, 3, 4, 5, 6, 7];
    for (const day of days) {
      if (!entry.days[day]) continue;
      const iso = toISODate(dateOfDay(entry.weekStart, day));
      const pay = dayPay(entry, day, rates);
      if (pay) byDay.set(iso, (byDay.get(iso) ?? 0) + pay);
    }
  }
  return byDay;
}

/**
 * Il gradino di colore di un importo, dato il massimo del mese.
 *
 * Il giorno più pagato prende l'ultimo gradino, gli altri si distribuiscono
 * sotto. Un giorno lavorato non finisce mai sul gradino 0, che è quello dei
 * giorni senza ore: se no un giorno da poco sembrerebbe vuoto.
 */
export function heatLevel(pay, max) {
  if (!pay || max <= 0) return null;
  const step = Math.ceil((pay / max) * (HEAT_LEVELS - 1));
  return Math.min(HEAT_LEVELS - 1, Math.max(1, step));
}

/**
 * La griglia di un mese, pronta da disegnare: sempre 7 colonne, con le caselle
 * vuote davanti al primo giorno e dopo l'ultimo.
 *
 * La settimana parte dal **lunedì**, come tutto il resto dell'app.
 *
 * @returns {({date: string, day: number, pay: number|null, heat: number|null,
 *            holiday: string|null, today: boolean}|null)[]}
 */
export function monthGrid(month, byDay, today = new Date()) {
  const [year, m] = month.split("-").map(Number);
  const first = new Date(year, m - 1, 1);
  const days = new Date(year, m, 0).getDate();
  const todayISO = toISODate(today);

  // Quante caselle vuote prima del primo: lunedì = 0 … domenica = 6.
  const lead = (first.getDay() + 6) % 7;

  const dates = [];
  for (let d = 1; d <= days; d++) dates.push(toISODate(new Date(year, m - 1, d)));

  const max = Math.max(0, ...dates.map((iso) => byDay.get(iso) ?? 0));

  const cells = Array.from({ length: lead }, () => null);
  for (const iso of dates) {
    const pay = byDay.get(iso) ?? null;
    cells.push({
      date: iso,
      day: Number(iso.slice(8)),
      pay,
      heat: heatLevel(pay, max),
      holiday: holidayName(iso),
      today: iso === todayISO,
    });
  }

  // Si chiude la settimana, così l'ultima riga non resta monca.
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** La domenica di una data, per andare dal calendario alla settimana giusta. */
export function weekStartOf(iso) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toISODate(d);
}
