// A make.fun frontend: board, bounty page, leaderboard and profile,
// on hash routes, over the live public API.
//
//   #/                              the board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     its leaderboard
//   #/u/<handle>                    one account profile
//
// window.__shotReady is false while a route loads and true once its data
// has rendered, so a screenshot script knows when to capture.
// First-load total (gzip-9): 8,849 bytes over 8 files — see the dossier.

import { getBounties, getBounty, getLeaderboard, getProfile } from './api.js';
import { boardRow, boardView, bountyView, errorView, filterBoard, notFoundView, sortBoard } from './views.js';
import { patchBoard, patchTimeLeft } from './render.js';

const app = document.getElementById('app');
let boardFilter = 'all';
let boardData = null;
let routeToken = 0;

function loading() {
  window.__shotReady = false;
  app.innerHTML = '<p>Loading…</p>';
}

function show(html, title) {
  document.title = title;
  app.innerHTML = html;
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

async function boardRoute() {
  const token = ++routeToken;
  loading();
  try {
    boardData = await getBounties();
  } catch (err) {
    if (token !== routeToken) return;
    show(errorView('The bounty board did not answer. Try again in a moment.'), 'make.fun bounties');
    return;
  }
  if (token !== routeToken) return;
  show(boardView(boardData, boardFilter), 'make.fun bounties');
}

async function bountyRoute(slug) {
  const token = ++routeToken;
  loading();
  let b;
  try {
    b = await getBounty(slug);
  } catch (err) {
    if (token !== routeToken) return;
    if (err.status === 404) {
      show(notFoundView('bounty'), 'Not found · make.fun bounties');
      return;
    }
    show(errorView('That bounty did not answer. It may not exist.'), 'make.fun bounties');
    return;
  }
  if (token !== routeToken) return;
  if (!b || b.success === false || !b.slug) {
    show(notFoundView('bounty'), 'Not found · make.fun bounties');
    return;
  }
  show(bountyView(b), `${b.title} · make.fun bounties`);
}

async function leaderboardRoute(slug) {
  const token = ++routeToken;
  loading();
  const { leaderboardView, mountLeaderboard } = await import('./leaderboard.js');
  if (token !== routeToken) return;
  let data;
  try {
    data = await getLeaderboard(slug, 'dev', 'overall', 'first');
  } catch (err) {
    if (token !== routeToken) return;
    if (err.status === 404) {
      show(notFoundView('leaderboard'), 'Not found · make.fun bounties');
      return;
    }
    show(errorView('That leaderboard did not answer. It may not exist.'), 'make.fun bounties');
    return;
  }
  if (token !== routeToken) return;
  if (!data || data.success === false || !data.competition) {
    show(notFoundView('leaderboard'), 'Not found · make.fun bounties');
    return;
  }
  show(leaderboardView(data), `${data.competition.title} leaderboard · make.fun bounties`);
  mountLeaderboard(app, data);
}

async function profileRoute(handle) {
  const token = ++routeToken;
  loading();
  const { profileView } = await import('./profile.js');
  if (token !== routeToken) return;
  let p;
  try {
    p = await getProfile(handle);
  } catch (err) {
    if (token !== routeToken) return;
    if (err.status === 404) {
      show(notFoundView('profile'), 'Not found · make.fun bounties');
      return;
    }
    show(errorView('That profile did not answer. It may not exist.'), 'make.fun bounties');
    return;
  }
  if (token !== routeToken) return;
  if (!p || p.success === false || !p.handle) {
    show(notFoundView('profile'), 'Not found · make.fun bounties');
    return;
  }
  show(profileView(p), `@${p.handle} · make.fun bounties`);
}

function route() {
  const hash = location.hash || '#/';
  let m = hash.match(/^#\/bounty\/([^/#?]+)\/leaderboard$/);
  if (m) return leaderboardRoute(decodeURIComponent(m[1]));
  m = hash.match(/^#\/bounty\/([^/#?]+)$/);
  if (m) return bountyRoute(decodeURIComponent(m[1]));
  m = hash.match(/^#\/u\/([^/#?]+)$/);
  if (m) return profileRoute(decodeURIComponent(m[1]));
  if (hash === '#/' || hash === '') return boardRoute();
  show(notFoundView('page'), 'Not found · make.fun bounties');
}

// Filter chips: re-render from the board already fetched, no new request.
app.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-filter]');
  if (!chip || !boardData) return;
  boardFilter = chip.dataset.filter;
  const list = document.getElementById('board-list');
  const items = sortBoard(filterBoard(boardData.items ?? [], boardFilter));
  document.querySelectorAll('.chips [data-filter]').forEach((c) => {
    c.setAttribute('aria-pressed', String(c === chip));
  });
  if (list) patchBoard(list, items, boardRow);
});

// Once a minute, refresh only the time-left text; when a deadline passes,
// re-render the current route once so its status chip flips.
setInterval(() => {
  if (patchTimeLeft(app)) route();
}, 60000);

window.addEventListener('hashchange', route);
route();
