// The account profile page: handle, record and solutions.
// Loaded only when the route is hit.

import { date, esc, money, num } from './format.js';

// A solution row: the competition it entered, where it placed, what it won.
function solutionRow(s) {
  const comp = s.competition ?? {};
  return `<li>
    <a href="#/bounty/${encodeURIComponent(comp.slug ?? '')}">${esc(comp.title ?? s.title ?? '—')}</a>
    <span>${s.placement ? `#${num(s.placement)}` : '—'}</span>
    <span>${s.prize_usd ? money(s.prize_usd) : '—'}</span>
    <span>${s.score?.display ?? (s.score?.value ?? '')}</span>
    <span>${s.entered_at ? date(s.entered_at) : ''}</span>
  </li>`;
}

export function profileView(p) {
  const r = p.record ?? {};
  const avatar = p.image ?? p.avatar;
  const wallet = p.wallet ?? {};
  const solutions = (p.solutions ?? []).map(solutionRow).join('');
  return `<h1>@${esc(p.handle)}</h1>
  ${p.display_name ? `<p class="lede">${esc(p.display_name)}</p>` : ''}
  ${avatar ? `<img class="avatar" src="${esc(avatar)}" alt="Avatar of @${esc(p.handle)}" crossorigin="anonymous">` : ''}
  ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
  <dl class="facts">
    ${wallet.address ? `<dt>Wallet</dt><dd><code>${esc(wallet.address)}</code>${wallet.explorer_url ? ` <a href="${esc(wallet.explorer_url)}">explorer &rarr;</a>` : ''}</dd>` : ''}
    ${p.github_login ? `<dt>GitHub</dt><dd>${esc(p.github_login)}</dd>` : ''}
    ${p.discord ? `<dt>Discord</dt><dd>${esc(p.discord)}</dd>` : ''}
    ${p.joined_at ? `<dt>Joined</dt><dd>${date(p.joined_at)}</dd>` : ''}
  </dl>
  <h2>Record</h2>
  <dl class="facts">
    <dt>Entered</dt><dd>${num(r.competitions_entered)}</dd>
    <dt>Placed</dt><dd>${num(r.competitions_placed)}</dd>
    <dt>Won</dt><dd>${num(r.competitions_won)}</dd>
    <dt>Podium finishes</dt><dd>${num(r.podium_finishes)}</dd>
    <dt>Best placement</dt><dd>${r.best_placement ? `#${num(r.best_placement)}` : '—'}</dd>
    <dt>Prize money</dt><dd>${money(r.prize_usd ?? 0)}</dd>
  </dl>
  <h2>Solutions</h2>
  ${solutions ? `<ul class="solutions">${solutions}</ul>` : '<p class="lede">No solutions listed.</p>'}
  <p class="lede">The API caps the solutions list; the record above is the full count.</p>`;
}
