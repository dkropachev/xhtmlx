# Changelog

All notable changes to this project will be documented in this file.

## [0.4.1] - 2026-03-21

### Fixed
- Fix `no-redeclare` lint error: rename duplicate `var p` declarations in IIFE scope
- Remove unused imports and dead code across benchmark and test files
- Lint now passes with zero errors and zero warnings

### Changed
- Optimize CI pipeline: parallel jobs, Playwright browser caching, skip browser tests in publish
- Update site meta tags, fix stale stats (~16KB to ~17KB, test count to 1024)
- Add GitHub star button to hero section

## [0.4.0] - 2026-03-21

### Security
- Apply `sanitizeHtml` hook in plan-based and DOM-patching innerHTML paths (XSS fix)
- Add cross-origin validation to `boostForm` and `popstateHandler` (prevents cookie leaking)
- Mitigate ReDoS in `xh-validate-pattern` by capping tested input length

### Fixed
- Evict failed template fetches from cache (rejected promises no longer persist)
- Null-guard `closest("[xh-boost]")` in boost link and form handlers
- CSP-safe child clearing in router, boost, and popstate code paths
- Add `.catch()` handler to router 404 template fetch
- Clear `pathSplitCache` and `triggerSpecCache` on version switch
- Bounds-check `navigatePath` to prevent TypeError on DOM mutations
- Log errors in `popstateHandler` and `boostForm` instead of silently swallowing
- Skip `File` inputs in `formDataToObject` (prevents `[object File]` in JSON body)
- Clean up old WebSocket handlers before reconnect (prevents listener accumulation)
- Clear all caches (`pathSplitCache`, `triggerSpecCache`, `validationRegexCache`) in `destroy()`
- Bound `triggerSpecCache` (500 max) and `validationRegexCache` (200 max) to prevent memory leaks

### Added
- Logo and favicon (Concept 4: X-in-a-Tag) integrated into docs site
- `logos/` directory with dark/light logo, icon, favicon, and social preview SVGs

### Changed
- Upgrade React devDependency from 18.3 to 19.2 for benchmark comparisons
- Updated benchmark results across README and docs site

## [0.3.1] - 2026-03-19

### Performance
- Pre-compute numeric binding type codes in render plan (eliminates string comparison per binding)
- Skip child creation when xh-text/xh-html will overwrite them
- Use `textContent = ''` instead of `innerHTML = ""` in performSwap (avoids HTML parser)
- Batch `classList.add` calls in plan bindings
- Check `instanceof MutableDataContext` once per render, pass boolean down recursion
- Shared frozen `PROCESSED_STATE` constant (avoids per-element object allocation)
- Replace `data-xh-each-item` setAttribute with WeakSet lookup
- Eliminate `renderItem` closure in plan-based processEach path
- Inline plan bindings bypass DOM setAttribute round-trip
- Compiled xh-each plans with direct DOM creation (no cloneNode)
- xh-if fast path checks before element/child creation
- Skip cleanup querySelectorAll, outerHTML fast path, selector caching
- Compiled render plans with resolve() fast path and text binding optimizations
- Eliminate remaining querySelectorAll("*"), cache hot paths, fix resource leaks
- Eliminate DOM serialization, reduce allocations, add caches
- Optimize hot paths — eliminate redundant DOM scans, add fast paths
- Remove unnecessary IIFE closures in bindings, add destroy() for cleanup
- Consolidate i18n scans, cache validation regex, optimize xh-each nesting check
- Fix listener duplication, resize element leaks, subscriber accumulation
- Replace querySelectorAll("*") in gatherXhElements with targeted selector
- Use targeted selectors in xh-each clone processing
- Deduplicate XH_KNOWN_SELECTOR and XH_DETECT_SELECTOR

## [0.3.0] - 2026-03-17

### Added

#### Analytics
- `xhtmlx.analytics(handler)` — pluggable analytics adapter for tracking user interactions
- `xh-track` — declarative event tracking on click/submit (`xh-track="button_clicked"`)
- `xh-track-view` — viewport-based impression tracking via IntersectionObserver
- `xh-track-vals` — attach extra data to analytics events (`xh-track-vals='{"category":"nav"}'`)
- Automatic request lifecycle tracking (`request:start`, `request:success`, `request:error`) when an analytics adapter is registered

#### Responsive
- `resize` trigger — re-fetch/re-render on viewport resize
- Breakpoint-aware templates (`xh-template-sm`, `xh-template-md`, `xh-template-lg`)
- `$viewport` variable (xs/sm/md/lg/xl) available in templates

#### Templates
- `<template xh-name>` — named inline template definitions for reuse without external files

#### Security
- `config.cspSafe` — CSP-safe mode for environments with strict Content-Security-Policy

#### Tooling
- `npx xhtmlx-migrate` — CLI migration tool to automate upgrades from htmx to xhtmlx
- Migration guide documentation

#### Documentation
- Interactive tutorial: build a Task Manager in 9 steps
- Comprehensive API reference documentation
- Interactive playground with mock API
- StackBlitz template for quick experimentation
- README badges and SEO meta tags

#### Testing
- Playwright browser test suite
- Integration + browser tests for tutorial and API docs
- Playground smoke tests

### Fixed
- outerHTML swap binding + rAF guard
- Auto-init when xhtmlx is loaded after `DOMContentLoaded`
- Memory leaks in DOM traversals and attribute loops

### Performance
- Single-pass `renderTemplate`, skip `<template>` elements, rAF list batching
- Single global resize listener instead of per-element observers
- Compound CSS selector in `gatherXhElements`
- Eliminate double-scan in `hasXhAttributes`
- Mark only top-level fragment children in `markFragmentOwned`
- Use compound CSS selector in `gatherXhElements`
- Cache i18n variable regexes, use targeted selectors in `applyI18n`
- Reduce `processEach` to single DOM traversal per cloned item
- Avoid slice+join allocations in `DataContext.resolve`

## [0.2.0] - 2026-03-15

### Added

#### Data Binding
- `xh-model` — pre-fill form inputs from API data, auto-collect on submit
- `MutableDataContext` — live reactivity: editing xh-model updates xh-text/xh-html/xh-attr in real-time
- `xh-class-*` — toggle CSS classes based on data (`xh-class-active="isSelected"`)
- `xh-show` / `xh-hide` — toggle visibility without removing from DOM

#### Interactivity
- `xh-on-*` — declarative event handlers (toggleClass, addClass, removeClass, remove, toggle, dispatch)
- `xh-push-url` / `xh-replace-url` — browser history management with popstate navigation
- `xh-boost` — enhance regular `<a>` and `<form>` elements to use xhtmlx

#### Real-time
- `xh-ws` — WebSocket support for real-time data
- `xh-ws-send` — send form data as JSON to a WebSocket target
- Auto-reconnect on non-1000 close codes

#### Performance
- `xh-cache` — response caching with TTL (`xh-cache="60"`, `xh-cache="forever"`)
- Request deduplication — prevent duplicate in-flight requests
- `xh-disabled-class` — CSS class applied during requests
- CSS settle classes — `xh-added` / `xh-settled` for swap transitions

#### Reliability
- `xh-retry` / `xh-retry-delay` — automatic retry with exponential backoff on 5xx/network errors
- `xh:retry` event emitted on each retry attempt

#### Forms
- `xh-validate` — declarative form validation (required, pattern, min/max, minlength/maxlength)
- `xh-validate-class`, `xh-validate-target`, `xh-validate-message`
- `xh:validationError` event with field details

#### Routing
- SPA router — `xh-router`, `xh-route` with `:param` support
- `xh-router-outlet`, `xh-router-404`
- `xh:routeChanged` / `xh:routeNotFound` events
- Active route class (`xh-route-active`)

#### Internationalization
- `xhtmlx.i18n.load(locale, translations)` — load translation dictionaries
- `xh-i18n` — set textContent from translation key
- `xh-i18n-*` — set any attribute from translation (placeholder, title, etc.)
- `xh-i18n-vars` — variable interpolation in translations
- Locale switching with auto re-render
- Fallback locale chain

#### Extensibility
- `xhtmlx.directive(name, handler)` — register custom directives
- `xhtmlx.hook(event, handler)` — register global lifecycle hooks
- `xhtmlx.transform(name, fn)` — register value transforms with pipe syntax (`"price | currency"`)

#### Versioning
- `xhtmlx.switchVersion(version, opts)` — switch UI version, clear caches, reload widgets
- `xhtmlx.reload(templateUrl?)` — re-fetch and re-render active widgets
- `config.templatePrefix` / `config.apiPrefix` — URL prefixes for versioned deployments
- Supports any version identifier (semver, git SHA, build hash, timestamp)

#### Accessibility
- `aria-busy="true"` auto-set during requests
- `aria-live="polite"` auto-set on xh-target elements
- `xh-aria-live` — override default aria-live value
- `role="alert"` auto-set on error containers
- `aria-disabled="true"` with xh-disabled-class
- `xh-focus` — focus management after swap

#### Developer Experience
- TypeScript definitions (`xhtmlx.d.ts`)
- Source map generation (`xhtmlx.min.js.map`)
- Auto-publish to npm via GitHub Actions (OIDC trusted publishers)

### Changed
- `==` to `===` for xh-model radio/select comparisons (strict equality)

### Performance
- gatherXhElements: single DOM traversal instead of two
- DataContext.resolve: cached path splits
- interpolateDOM: inline text node processing
- attachOnHandler: pre-parsed action strings
- Cached indicator element references
- Fixed INTERP_RE global regex lastIndex corruption

## [0.1.0] - 2026-03-15

### Added
- REST verbs: `xh-get`, `xh-post`, `xh-put`, `xh-delete`, `xh-patch`
- External template files (`xh-template`) with caching and deduplication
- Inline `<template>` fallback
- Recursive template composition
- Data binding: `xh-text`, `xh-html`, `xh-attr-*`
- Iteration: `xh-each` with `$index`, `$parent`, `$root`
- Conditionals: `xh-if`, `xh-unless`
- URL interpolation: `{{field}}` syntax
- Triggers: click, submit, change, load, every, revealed, delay, throttle, once, changed, from
- Targeting: `xh-target`, `xh-swap` (8 modes)
- Error handling: `xh-error-template`, per-status-code templates, `xh-error-boundary`, global config
- Loading indicators: `xh-indicator`
- Custom DOM events: `xh:beforeRequest`, `xh:afterRequest`, `xh:beforeSwap`, `xh:afterSwap`, `xh:responseError`
- Request body: form serialization, `xh-vals`, `xh-headers`
- MutationObserver for dynamically added elements
- Data context with parent chain
