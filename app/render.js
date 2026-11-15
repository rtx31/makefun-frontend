// Targeted DOM patching: refresh a page without rebuilding it.
// The header and nav never move; only <main> changes per route, and the
// 60-second tick touches time-left text nodes in place, never innerHTML.

import { timeLeft } from './format.js';

// Recompute every [data-deadline] text node in root. Returns true when a
// deadline passed since the last tick (caller re-renders that route once).
export function patchTimeLeft(root) {
  let passed = false;
  root.querySelectorAll('[data-deadline]').forEach((el) => {
    const next = timeLeft(el.getAttribute('data-deadline'));
    if (el.textContent !== next) el.textContent = next;
    if (next === 'ended' && !el.dataset.ended) {
      el.dataset.ended = '1';
      passed = true;
    }
  });
  return passed;
}

// Keyed board diff: update each row's cells in place, add new rows,
// drop rows that left the list. Row order follows items.
export function patchBoard(list, items, rowHtml) {
  const bySlug = new Map();
  list.querySelectorAll('[data-slug]').forEach((li) => bySlug.set(li.dataset.slug, li));
  const next = items.map((b) => {
    const slug = b.slug;
    const old = bySlug.get(slug);
    bySlug.delete(slug);
    if (!old) {
      const wrap = document.createElement('template');
      wrap.innerHTML = rowHtml(b).trim();
      return wrap.content.firstElementChild;
    }
    const fresh = document.createElement('template');
    fresh.innerHTML = rowHtml(b).trim();
    const cells = fresh.content.firstElementChild.children;
    const mine = old.children;
    for (let i = 0; i < cells.length && i < mine.length; i++) {
      if (mine[i].outerHTML !== cells[i].outerHTML) mine[i].replaceWith(cells[i].cloneNode(true));
    }
    return old;
  });
  list.replaceChildren(...next);
}
