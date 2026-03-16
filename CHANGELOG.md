# Changelog

All notable changes to this project will be documented in this file.

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
