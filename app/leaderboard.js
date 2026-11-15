// The leaderboard page: ranked rows, windowed so thousands of entries
// never all sit in the DOM at once. Loaded only when the route is hit.
// Default payload is rows=first: 10 full rows + slim rest rows.

import { getLeaderboard } from './api.js';
import { bytes, esc, num, pct } from './format.js';

const WINDOW = 40;

// One full row (top 10): rank, handle, title, win rate, interval, valid, size.
function fullRow(r) {
  const v = r.values ?? {};
  return `<tr data-rank="${num(r.rank)}">
    <td>${num(r.rank)}</td>
    <td><a href="#/u/${encodeURIComponent(r.handle ?? '')}">${esc(r.handle ?? '—')}</a></td>
    <td>${esc(r.title ?? '')}</td>
    <td>${pct(v.judge)}</td>
    <td>${pct(v.judge_low)}–${pct(v.judge_high)}</td>
    <td>${v.valid === undefined ? '—' : num(v.valid)}</td>
    <td>${bytes(v.bytes)}</td>
  </tr>`;
}

// One slim rest row: the same columns, from the compact fields the API sends.
function slimRow(r) {
  const judge = r.value ?? r.performance;
  return `<tr data-rank="${num(r.rank)}">
    <td>${num(r.rank)}</td>
    <td><a href="#/u/${encodeURIComponent(r.handle ?? '')}">${esc(r.handle ?? '—')}</a></td>
    <td>${esc(r.title ?? '')}</td>
    <td>${pct(judge)}</td>
    <td>${r.interval ? `${pct(r.interval.low)}–${pct(r.interval.high)}` : '—'}</td>
    <td>—</td>
    <td>—</td>
  </tr>`;
}

export function leaderboardView(data) {
  const c = data.competition ?? {};
  const phase = data.phase ?? {};
  const entries = data.entries ?? [];
  const rest = data.rest ?? [];
  const total = entries.length + rest.length;
  const views = (data.views ?? []).map(
    (v) => `<button type="button" data-view="${esc(v)}" aria-pressed="${v === data.view}">${esc(v)}</button>`,
  ).join('');
  const phases = ['dev', 'final'].map(
    (p) => `<button type="button" data-phase="${p}" aria-pressed="${p === phase.key}">${p}</button>`,
  ).join('');
  const rows = entries.map(fullRow).join('');
  const shown = total === 0 ? 'No entries yet.' : `${num(total)} entries`;
  return `<p><a href="#/bounty/${encodeURIComponent(c.slug ?? '')}">&larr; ${esc(c.title ?? 'Bounty')}</a></p>
  <h1>${esc(c.title ?? 'Leaderboard')}</h1>
  <p class="lede">${esc(phase.title ?? '')} phase &middot; ${shown}${phase.scores_visible === false ? ' &middot; scores hidden' : ''}</p>
  <div class="chips" role="group" aria-label="Phase">${phases}</div>
  ${views ? `<div class="chips" role="group" aria-label="View">${views}</div>` : ''}
  <div class="table-wrap"><table class="board-table">
  <thead><tr><th>Rank</th><th>Handle</th><th>Entry</th><th>Win rate</th><th>90% interval</th><th>Valid</th><th>Size</th></tr></thead>
  <tbody id="lb-rows">${rows}</tbody></table></div>
  ${rest.length ? `<p id="lb-more" class="lede">Showing ${num(entries.length)} of ${num(total)} — scroll for more, or <button type="button" id="lb-all">load full detail</button>.</p>` : ''}
  <div id="lb-sentinel" aria-hidden="true"></div>`;
}

// Windowing: append the slim rows in chunks of WINDOW as the reader
// scrolls to the sentinel; the DOM never holds more than a few dozen rows.
export function mountLeaderboard(root, data) {
  const slug = data.competition?.slug;
  let rest = [...(data.rest ?? [])];
  const tbody = root.querySelector('#lb-rows');
  const sentinel = root.querySelector('#lb-sentinel');
  const more = root.querySelector('#lb-more');
  if (!tbody || !sentinel) return;
  const paint = () => {
    if (!rest.length) {
      if (more) more.textContent = `All ${num((data.entries ?? []).length + (data.rest ?? []).length)} entries shown.`;
      return;
    }
    const chunk = rest.splice(0, WINDOW);
    const wrap = document.createElement('template');
    wrap.innerHTML = chunk.map(slimRow).join('');
    tbody.append(...wrap.content.children);
    if (more) more.textContent = `Showing ${num(tbody.rows.length)} of ${num(tbody.rows.length + rest.length)} — scroll for more.`;
  };
  const io = new IntersectionObserver((hits) => {
    if (hits.some((h) => h.isIntersecting)) paint();
  });
  io.observe(sentinel);
  const allBtn = root.querySelector('#lb-all');
  if (allBtn) {
    allBtn.addEventListener('click', async () => {
      allBtn.disabled = true;
      allBtn.textContent = 'Loading…';
      try {
        const full = await getLeaderboard(slug, data.phase?.key ?? 'dev', data.view ?? 'overall', 'all');
        const rows = (full.entries ?? []).map(fullRow).join('');
        tbody.innerHTML = rows;
        rest = [];
        if (more) more.textContent = `All ${num(full.entries?.length ?? 0)} entries shown in full detail.`;
      } catch {
        allBtn.disabled = false;
        allBtn.textContent = 'load full detail';
      }
    });
  }
  // Phase and view toggles reload this route's data once, in place.
  root.querySelectorAll('[data-phase],[data-view]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const phase = btn.dataset.phase ?? data.phase?.key ?? 'dev';
      const view = btn.dataset.view ?? data.view ?? 'overall';
      try {
        const next = await getLeaderboard(slug, phase, view, 'first');
        const html = leaderboardView(next);
        const wrap = document.createElement('template');
        wrap.innerHTML = html.trim();
        root.replaceChildren(...wrap.content.children);
        mountLeaderboard(root, next);
      } catch {
        // Keep the current table; the toggle simply did not take.
      }
    });
  });
}
