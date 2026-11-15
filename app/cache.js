// ETag cache: one in-memory map, URL -> {etag, body}.
// A repeat fetch sends If-None-Match; a 304 reuses the body for free
// (no bytes, no rate-limit cost). Nothing persists across page loads,
// so a stale pot can never survive a reload.

const store = new Map();

// A body fetched less than a minute ago is served without any request:
// the server binds ETags to the minute, so nothing newer can exist, and
// a revalidation inside the minute would only risk the 304-without-CORS
// failure below. After the minute, revalidate with If-None-Match.
const FRESH_MS = 60000;

export async function apiGet(url) {
  const hit = store.get(url);
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.body;
  const headers = {};
  if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    // A conditional revalidation can fail in the browser even when the
    // server answered: its 304 carries no Access-Control-Allow-Origin, so
    // the browser blocks it. In exactly that case the cached body is still
    // current (a changed body would come back 200, with CORS headers),
    // so serve it rather than failing the view.
    if (hit) return hit.body;
    throw err;
  }
  if (res.status === 304 && hit) return hit.body;
  if (!res.ok) {
    const err = new Error(`make.fun API ${res.status} for ${url}`);
    err.status = res.status;
    throw err;
  }
  const body = await res.json();
  const etag = res.headers.get('ETag');
  if (etag) store.set(url, { etag, body, at: Date.now() });
  return body;
}

// The body a URL already fetched in this session, if any.
export function cached(url) {
  const hit = store.get(url);
  return hit ? hit.body : undefined;
}
