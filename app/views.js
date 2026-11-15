// The board and bounty pages: pure functions from API data to HTML.
// Every value from the API goes through esc() before it reaches the page.

import { date, esc, money, num, timeLeft } from './format.js';

// A bounty still takes entries when its deadline is in the future and the
// API has not said otherwise. status alone lies: past-deadline bounties
// still list as status "open".
export function takesEntries(b) {
  if (!b.deadline) return false;
  if (b.acceptingSubmissions === false) return false;
  return new Date(b.deadline).getTime() > Date.now();
}

// The live reward: the pot, entry fees included — not rewardAmount alone.
export const potOf = (b) => b.potUsd ?? b.rewardAmount;

// Board order: open bounties closing soonest first, then biggest pot;
// closed bounties after them, most recently closed first.
export function sortBoard(items) {
  return [...items].sort((a, b) => {
    const ao = takesEntries(a) ? 0 : 1;
    const bo = takesEntries(b) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    const da = new Date(a.deadline).getTime();
    const db = new Date(b.deadline).getTime();
    if (da !== db) return ao === 0 ? da - db : db - da;
    return Number(b.potUsd ?? b.rewardAmount ?? 0) - Number(a.potUsd ?? a.rewardAmount ?? 0);
  });
}

export const FILTERS = [
  ['all', 'All'],
  ['open', 'Open now'],
  ['soon', 'Closing <24h'],
  ['free', 'Free entry'],
];

export function filterBoard(items, filter) {
  const now = Date.now();
  if (filter === 'open') return items.filter((b) => takesEntries(b));
  if (filter === 'soon')
    return items.filter((b) => takesEntries(b) && new Date(b.deadline).getTime() - now < 86400000);
  if (filter === 'free') return items.filter((b) => !b.entryFeeUsd || Number(b.entryFeeUsd) === 0);
  return items;
}

// One board row, keyed by slug so the tick can patch it in place.
export function boardRow(b) {
  const open = takesEntries(b);
  return `<li data-slug="${esc(b.slug)}">
    <a class="row-title" href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a>
    <span class="row-pot">${money(potOf(b))}</span>
    <span class="row-fee">${b.entryFeeUsd ? `${money(b.entryFeeUsd)} fee` : 'Free'}</span>
    <span class="row-time" data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>
    <span class="row-entries">${num(b.submissionCount)} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span>
    <span class="chip ${open ? 'chip-open' : 'chip-closed'}">${open ? 'Open' : 'Closed'}</span>
  </li>`;
}

export function boardView(data, filter = 'all') {
  const items = sortBoard(filterBoard(data.items ?? [], filter));
  const chips = FILTERS.map(
    ([key, label]) =>
      `<button type="button" data-filter="${key}" aria-pressed="${key === filter}">${label}</button>`,
  ).join('');
  const rows = items.map(boardRow).join('');
  return `<h1>Open bounties</h1>
  <p class="lede">Live pots, entry fees and deadlines — straight from the make.fun public API.</p>
  <div class="chips" role="group" aria-label="Filter bounties">${chips}</div>
  <ul class="board" id="board-list">${rows || '<li class="empty">No bounties match this filter.</li>'}</ul>`;
}

// The rewards table: each paid place with its live amount, fee share included.
function rewardsTable(b) {
  const rows = (b.rewardsNow ?? []).map(
    (r) => `<tr><td>#${num(r.place)}</td><td>${money(r.baseUsd)}</td><td>${money(r.feeShareUsd)}</td><td>${money(r.amountUsd)}</td></tr>`,
  ).join('');
  if (!rows) return '';
  return `<h2>Rewards now</h2>
  <p class="lede">Live pot <strong>${money(potOf(b))}</strong>${b.entryFeesUsd ? ` — ${money(b.entryFeesUsd)} paid in by ${num(b.entryFeePayers)} entrants` : ''}.</p>
  <table class="rewards"><thead><tr><th>Place</th><th>Base</th><th>Fee share</th><th>Pays</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function bountyView(b) {
  const open = takesEntries(b);
  const sponsor = b.sponsor ? esc(b.sponsor.name) : '—';
  const skills = (b.skills ?? []).map((s) => `<li>${esc(s)}</li>`).join('');
  return `<p><a href="#/">&larr; All bounties</a></p>
  <h1>${esc(b.title)}</h1>
  <p class="lede">${esc(b.summary ?? '')}</p>
  <p class="status" aria-live="polite">${open ? 'Entries open' : 'Entries closed'} &middot; <span data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span></p>
  <dl class="facts">
    <dt>Reward (live pot)</dt><dd>${money(potOf(b))}</dd>
    ${b.entryFeeUsd ? `<dt>Entry fee</dt><dd>${money(b.entryFeeUsd)}</dd>` : '<dt>Entry fee</dt><dd>Free</dd>'}
    <dt>Deadline</dt><dd>${date(b.deadline)}</dd>
    ${b.opensAt ? `<dt>Opened</dt><dd>${date(b.opensAt)}</dd>` : ''}
    ${b.publishedAt ? `<dt>Published</dt><dd>${date(b.publishedAt)}</dd>` : ''}
    <dt>Entries</dt><dd>${num(b.submissionCount)}</dd>
    <dt>Sponsor</dt><dd>${sponsor}</dd>
    <dt>Category</dt><dd>${esc(b.category ?? '—')}</dd>
  </dl>
  ${skills ? `<h2>Skills</h2><ul class="tags">${skills}</ul>` : ''}
  ${rewardsTable(b)}
  <p><a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard &rarr;</a></p>
  ${b.description ? `<h2>Description</h2><div class="description">${esc(b.description)}</div>` : ''}
  ${b.rules ? `<h2>Rules</h2><div class="description">${esc(b.rules)}</div>` : ''}`;
}

// A real not-found page, never a blank shell.
export function notFoundView(what) {
  return `<h1>Not found</h1><p class="lede">No ${esc(what)} matches this address.</p><p><a href="#/">&larr; Back to the board</a></p>`;
}

// A plain error page when the API cannot answer.
export function errorView(message) {
  return `<h1>Could not load this page</h1><p class="lede">${esc(message)}</p><p><a href="#/">Back to the board</a></p>`;
}
