/* Shift Hours — slider a doppia maniglia.
 *
 * Regole non negoziabili: nessun campo di testo per gli orari, mai valori
 * fuori dallo scatto di 5 minuti, le maniglie non si scavalcano.
 */

import { MIN_TIME, MAX_TIME, STEP, MIN_SPAN, formatTime, formatHrs } from "./week.js";

const RANGE = MAX_TIME - MIN_TIME;

function clampStart(value, end) {
  return Math.min(Math.max(value, MIN_TIME), end - MIN_SPAN);
}

function clampEnd(value, start) {
  return Math.max(Math.min(value, MAX_TIME), start + MIN_SPAN);
}

function snapToStep(value) {
  return Math.round(value / STEP) * STEP;
}

/**
 * Costruisce lo slider dentro `container` e restituisce i comandi per
 * aggiornarlo dall'esterno.
 *
 * @param {HTMLElement} container
 * @param {{start:number, end:number, onChange:Function, onCommit:Function}} options
 */
export function createRangeSlider(container, { start, end, onChange, onCommit }) {
  let current = { start, end };

  container.innerHTML = `
    <div class="sh-range">
      <div class="sh-range__readout">
        <span data-role="start">${formatTime(current.start)}</span>
        <span class="sh-range__arrow">–</span>
        <span data-role="end">${formatTime(current.end)}</span>
      </div>
      <div class="sh-range__duration" data-role="duration">${formatHrs(current.end - current.start)}</div>
      <div class="sh-range__track" data-role="track">
        <div class="sh-range__rail"></div>
        <div class="sh-range__fill" data-role="fill"></div>
        <div class="sh-range__handle" data-handle="start" role="slider" tabindex="0"
             aria-label="Start time" aria-valuemin="${MIN_TIME}" aria-valuemax="${MAX_TIME}"></div>
        <div class="sh-range__handle" data-handle="end" role="slider" tabindex="0"
             aria-label="End time" aria-valuemin="${MIN_TIME}" aria-valuemax="${MAX_TIME}"></div>
      </div>
      <div class="sh-range__scale"><span>5</span><span>10</span><span>15</span><span>20</span><span>24</span></div>
      <div class="sh-nudges">
        <div class="sh-nudge">
          <button class="sh-nudge__btn" type="button" data-nudge="start" data-delta="-1" aria-label="Start 5 minutes earlier">−</button>
          <span class="sh-nudge__label">Start</span>
          <button class="sh-nudge__btn" type="button" data-nudge="start" data-delta="1" aria-label="Start 5 minutes later">+</button>
        </div>
        <div class="sh-nudge">
          <button class="sh-nudge__btn" type="button" data-nudge="end" data-delta="-1" aria-label="End 5 minutes earlier">−</button>
          <span class="sh-nudge__label">End</span>
          <button class="sh-nudge__btn" type="button" data-nudge="end" data-delta="1" aria-label="End 5 minutes later">+</button>
        </div>
      </div>
    </div>
  `;

  const track = container.querySelector('[data-role="track"]');
  const fill = container.querySelector('[data-role="fill"]');
  const startLabel = container.querySelector('[data-role="start"]');
  const endLabel = container.querySelector('[data-role="end"]');
  const duration = container.querySelector('[data-role="duration"]');
  const handles = {
    start: container.querySelector('[data-handle="start"]'),
    end: container.querySelector('[data-handle="end"]'),
  };

  function percent(minutes) {
    return ((minutes - MIN_TIME) / RANGE) * 100;
  }

  function paint() {
    const left = percent(current.start);
    const right = percent(current.end);
    handles.start.style.left = `${left}%`;
    handles.end.style.left = `${right}%`;
    fill.style.left = `${left}%`;
    fill.style.width = `${right - left}%`;
    startLabel.textContent = formatTime(current.start);
    endLabel.textContent = formatTime(current.end);
    duration.textContent = formatHrs(current.end - current.start);
    handles.start.setAttribute("aria-valuenow", current.start);
    handles.start.setAttribute("aria-valuetext", formatTime(current.start));
    handles.end.setAttribute("aria-valuenow", current.end);
    handles.end.setAttribute("aria-valuetext", formatTime(current.end));
  }

  function apply(which, value, { commit = false } = {}) {
    const next = which === "start"
      ? { start: clampStart(value, current.end), end: current.end }
      : { start: current.start, end: clampEnd(value, current.start) };

    const changed = next.start !== current.start || next.end !== current.end;
    current = next;
    paint();
    if (changed) onChange?.(current.start, current.end);
    if (commit) onCommit?.(current.start, current.end);
  }

  function valueFromPointer(clientX) {
    const rect = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return snapToStep(MIN_TIME + Math.min(1, Math.max(0, ratio)) * RANGE);
  }

  function startDrag(which, event) {
    event.preventDefault();
    const handle = handles[which];
    handle.setPointerCapture(event.pointerId);

    const move = (e) => apply(which, valueFromPointer(e.clientX));
    const end = (e) => {
      handle.releasePointerCapture(event.pointerId);
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      apply(which, valueFromPointer(e.clientX ?? event.clientX), { commit: true });
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  for (const which of ["start", "end"]) {
    handles[which].addEventListener("pointerdown", (e) => startDrag(which, e));
    handles[which].addEventListener("keydown", (e) => {
      const delta = { ArrowLeft: -STEP, ArrowDown: -STEP, ArrowRight: STEP, ArrowUp: STEP }[e.key];
      if (delta === undefined) return;
      e.preventDefault();
      apply(which, current[which] + delta, { commit: true });
    });
  }

  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nudge]");
    if (!button) return;
    const which = button.dataset.nudge;
    const delta = Number(button.dataset.delta) * STEP;
    apply(which, current[which] + delta, { commit: true });
  });

  paint();

  return {
    /** Aggiorna lo slider senza far scattare gli eventi (es. dopo un annulla). */
    setValue(nextStart, nextEnd) {
      current = { start: nextStart, end: nextEnd };
      paint();
    },
    getValue() {
      return { ...current };
    },
  };
}
