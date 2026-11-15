// The make.fun public API: read-only GET, no key, CORS open to any origin.
// One request per view, at most; see the API contract in the build spec.
// Full reference: https://make.fun/api/openapi.json

import { apiGet, cached } from './cache.js';

const API = 'https://make.fun/api';

// The bounty board: every competition the API lists as open.
// limit=100 keeps one page while the board is small; cursor paging
// would follow data.next_cursor when the board outgrows it.
export const getBounties = () =>
  apiGet(`${API}/competitions?status=open&activity=times&limit=100`);

// One bounty, by slug (includes rules, rewardsNow, phases).
export const getBounty = (slug) =>
  apiGet(`${API}/competitions/${encodeURIComponent(slug)}`);

// A bounty leaderboard. rows=first returns 10 full rows + slim rest;
// rows=all only when the reader asks for full detail.
export const getLeaderboard = (slug, phase = 'dev', view = 'overall', rows = 'first') =>
  apiGet(
    `${API}/competitions/${encodeURIComponent(slug)}/leaderboard?phase=${phase}&view=${view}&rows=${rows}`,
  );

// One account profile, by handle. fetch follows a 308 when a handle moved.
export const getProfile = (handle) =>
  apiGet(`${API}/profiles/${encodeURIComponent(handle)}`);

export { cached };
