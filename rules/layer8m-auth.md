# Layer8MAuth — Mobile Authentication

`Layer8MAuth` is the encapsulated authentication module for every Layer 8 mobile UI (`web/m/`). Every network call that needs to carry the bearer token must go through it. **There is no global `fetch` interceptor on mobile by design** — interception adds hidden coupling that can't be reasoned about cross-project. Mobile uses explicit verbs.

File: `l8ui/m/js/layer8m-auth.js`.

## Contract

- All HTTP verbs attach `Authorization: Bearer <token>` from `getBearerToken()`.
- All verbs route through `makeAuthenticatedRequest(url, opts)`, which centralizes the 401 handler: on 401 the verb calls `_handleSessionExpired(url)` and returns `null`.
- Non-2xx responses other than 401 throw an `Error` whose message is sanitized server text.
- JSON verbs (`get/post/put/patch/delete`) parse and return the body as a JS object on success.
- The text verb (`fetchText`) returns the raw response body string on success — used for server-rendered HTML fragments.

This means consumers see three outcomes from every call:

| Outcome | Return value | Action |
|---|---|---|
| Success (2xx) | Parsed JSON (or string for `fetchText`) | Use it |
| Unauthorized (401) | `null` | Redirect is already in flight — bail out without throwing |
| Other error (non-2xx / network) | Throws | Caller `.catch` decides UX |

## Verbs

```js
Layer8MAuth.get(url)                  // GET → JSON
Layer8MAuth.post(url, data)           // POST JSON body → JSON
Layer8MAuth.put(url, data)            // PUT JSON body → JSON
Layer8MAuth.patch(url, data)          // PATCH JSON body → JSON
Layer8MAuth.delete(url, data = null)  // DELETE (optional JSON body) → JSON
Layer8MAuth.fetchText(url)            // GET → raw text (e.g. server-rendered HTML)
```

### When to use `fetchText`

Use it whenever the endpoint returns HTML or any non-JSON payload. The classic case is a mobile section/dashboard loader that injects `innerHTML`:

```js
const html = await Layer8MAuth.fetchText('sections/dashboard.html?t=' + Date.now());
if (html === null) return; // 401 — redirect already in progress
contentArea.innerHTML = html;
```

Do **not** call `fetch()` directly and attach the header yourself. That would be a second instance of the auth-attach + 401-handle logic already encapsulated here, which violates the Second Instance Rule (`l8erp/plans/generic-software-development-rules.md` §2).

## Session lifecycle

```js
Layer8MAuth.login(username, password, remember)   // → {success, needTfa?, setupTfa?}
Layer8MAuth.verifyTfa(code)                       // → {success, error?}
Layer8MAuth.getTfaSetup()                         // → {success, qrCode, secret}
Layer8MAuth.verifyTfaSetup(code)                  // → {success, error?}
Layer8MAuth.clearPendingAuth()
Layer8MAuth.logout(redirect = true)
Layer8MAuth.requireAuth()                         // redirect to login if no token
Layer8MAuth.isAuthenticated()
Layer8MAuth.getBearerToken()
Layer8MAuth.setBearerToken(token, remember)
Layer8MAuth.getUsername() / setUsername()
Layer8MAuth.onSessionExpired(callback)            // override default redirect popup
Layer8MAuth.showErrorAndLogout(message, detail)
```

`setBearerToken(token, remember)` is the canonical persistence shape:

- Always writes to `sessionStorage` (so the current tab stays logged in).
- Writes to `localStorage` **only** when `remember === true`.
- `getBearerToken()` reads `sessionStorage || localStorage` so a remembered token survives a tab close but a non-remembered token does not.

Desktop equivalents in `l8ui/login/login-auth.js` follow the same shape.

## Login redirect

All session-expiration paths redirect to `/l8ui/login/`. If a host UI needs a different post-logout destination (e.g. a per-portal landing page), supply a callback via `Layer8MAuth.onSessionExpired(...)` rather than monkey-patching the redirect.

## No interceptor on mobile

A global `fetch` interceptor (the pattern used in desktop `web/js/app.js`) is explicitly avoided in mobile because:

1. Interception is implicit — call sites look like ordinary `fetch()` but behave differently, which surprises readers and hides the dependency in the dependency graph (`rules/architecture-overview.md`).
2. Composing two interceptors (e.g. a host project's plus Layer8MAuth's) yields ordering bugs.
3. The explicit-verb form is grep-able: `grep -rn "fetch(" web/m/ | grep -v Layer8MAuth` finds violations in one pass.

If a new HTTP verb or response type is needed, **add it as a method on `Layer8MAuth`** rather than reaching for `fetch()` in the consumer.

## Adding a new verb

If you add e.g. an `OPTIONS` verb in the future:

1. Route through `makeAuthenticatedRequest(url, opts)` so the 401 handler is uniform.
2. Document it in this file.
3. Make sure `sanitizeServerError(errorText)` is used for the thrown message — keeps consumer error UX consistent.

## Files

- `m/js/layer8m-auth.js` — the module (no dedicated CSS; the session-expired popup reuses `m/css/layer8m-popup.css`)
