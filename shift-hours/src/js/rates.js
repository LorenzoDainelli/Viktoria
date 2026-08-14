/* Shift Hours — la paga oraria nel tempo.
 *
 * Fino alla Fase 2 la paga era un numero solo, e la stima si ricalcolava
 * sempre da quello: il giorno di un aumento, tutto il passato si rivalutava al
 * prezzo nuovo. Settimane già pagate a una cifra ne avrebbero mostrata
 * un'altra.
 *
 * Da qui in avanti è una lista di paghe, ognuna con il giorno da cui entra in
 * vigore, e ogni giorno viene valutato con la paga di quel giorno.
 *
 * Le regole, dal piano della Fase 3:
 *
 *   - la PRIMA paga vale dall'inizio dei tempi, anche per le settimane
 *     precedenti al giorno in cui è stata inserita;
 *   - ogni paga successiva vale dal suo `from` in poi, e la precedente vale
 *     fino al giorno prima;
 *   - cancellandone una, il periodo che copriva torna alla precedente.
 *
 * Funzioni pure: niente DOM, niente localStorage.
 */

import { dateOfDay, shiftMinutes, toISODate } from "./week.js";
import { payMultiplier } from "./holidays.js";

/**
 * @typedef {{ from: string, amount: number }} Rate
 *   `from` è una data ISO locale ("2026-01-10"), `amount` euro all'ora.
 */

/** Le paghe valide, ordinate per data. Scarta tutto quello che non lo è. */
export function normalizeRates(rates) {
  if (!Array.isArray(rates)) return [];

  const seen = new Map();
  for (const rate of rates) {
    if (!rate || typeof rate !== "object") continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rate.from)) continue;
    const amount = Number(rate.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    // Due paghe con la stessa data non possono coesistere: vince l'ultima
    // scritta, che è quella che lei ha appena inserito o corretto.
    seen.set(rate.from, { from: rate.from, amount });
  }

  return [...seen.values()].sort((a, b) => a.from.localeCompare(b.from));
}

/**
 * La paga in vigore in un certo giorno.
 *
 * Un giorno precedente a tutte le paghe prende comunque **la prima**: è la
 * regola 4 del piano, ed è ciò che rende gratuita la migrazione dalla Fase 2.
 *
 * @param {Rate[]} rates già normalizzate
 * @param {string} iso "2026-08-03"
 * @returns {number|null} euro all'ora, o null se non c'è nessuna paga
 */
export function rateOn(rates, iso) {
  if (rates.length === 0) return null;

  let current = rates[0].amount;
  for (const rate of rates) {
    if (rate.from > iso) break;
    current = rate.amount;
  }
  return current;
}

/** Fino a quando vale una paga: il giorno prima della successiva, o null. */
export function validUntil(rates, index) {
  const next = rates[index + 1];
  if (!next) return null;

  const [y, m, d] = next.from.split("-").map(Number);
  const day = new Date(y, m - 1, d - 1);
  const mm = String(day.getMonth() + 1).padStart(2, "0");
  const dd = String(day.getDate()).padStart(2, "0");
  return `${day.getFullYear()}-${mm}-${dd}`;
}

/* ── Modifiche alla lista ─────────────────────────────────────────── */

/** Aggiunge o sostituisce la paga che parte da quel giorno. */
export function withRate(rates, from, amount) {
  return normalizeRates([...rates, { from, amount }]);
}

/** Toglie la paga in posizione `index`. */
export function withoutRate(rates, index) {
  return rates.filter((_, i) => i !== index);
}

/**
 * Cambia importo e/o data della paga in posizione `index`.
 * Se la data nuova coincide con quella di un'altra, le due si fondono.
 */
export function withEditedRate(rates, index, from, amount) {
  return normalizeRates(rates.map((rate, i) => (i === index ? { from, amount } : rate)));
}

/* ── Migrazione dalla Fase 2 ──────────────────────────────────────── */

/**
 * Ricava la lista dalle impostazioni salvate, qualunque versione siano.
 *
 * Un vecchio `hourlyRate` diventa la prima e unica paga. Siccome la prima vale
 * dall'inizio dei tempi, **la stima di ogni settimana esistente resta identica
 * al centesimo**: il giorno dell'aggiornamento non cambia niente.
 *
 * `from` è una data volutamente remota, non la data di oggi: dice "questa c'è
 * sempre stata", che è esattamente ciò che l'app faceva prima.
 */
export const DAWN = "1970-01-01";

export function ratesFromSettings(settings) {
  const rates = normalizeRates(settings?.rates);
  if (rates.length > 0) return rates;

  const legacy = Number(settings?.hourlyRate);
  return Number.isFinite(legacy) && legacy > 0 ? [{ from: DAWN, amount: legacy }] : [];
}

/** La paga più recente: è la copia che finisce in `hourlyRate` nei backup. */
export function latestAmount(rates) {
  return rates.length ? rates[rates.length - 1].amount : null;
}

/* ── Quanto ha guadagnato ─────────────────────────────────────────── */

/**
 * La paga stimata di un singolo giorno.
 *
 * È qui che il ×2 dei bank holiday entra in gioco, e **solo** qui: le ore
 * restano quelle vere ovunque, nella riga del giorno, nel totale della
 * settimana, nello scontrino e soprattutto nel messaggio al capo.
 *
 * @returns {number|null} euro, o null se non c'è una paga con cui calcolare
 */
export function dayPay(week, day, rates) {
  const shift = week.days[day];
  if (!shift) return 0;

  const iso = toISODate(dateOfDay(week.weekStart, day));
  const rate = rateOn(rates, iso);
  if (rate === null) return null;

  return (shiftMinutes(shift) / 60) * rate * payMultiplier(iso);
}

/**
 * La paga stimata di una settimana: la somma dei giorni, non il totale delle
 * ore per una paga sola. È l'unico modo perché una settimana a cavallo di un
 * aumento — o con dentro un festivo — venga giusta.
 *
 * @returns {number|null} euro, o null se non c'è nessuna paga
 */
export function weekPay(week, days, rates) {
  if (rates.length === 0) return null;
  return days.reduce((sum, day) => sum + (dayPay(week, day, rates) ?? 0), 0);
}

/* ── Formati ──────────────────────────────────────────────────────── */

/** "10.20€" — con i centesimi. È la forma usata ovunque tranne il calendario. */
export function formatMoney(amount) {
  return `${amount.toFixed(2)}€`;
}

/** "126€" — arrotondato, per le caselle del calendario, dove non c'è spazio. */
export function formatMoneyRounded(amount) {
  return `${Math.round(amount)}€`;
}
