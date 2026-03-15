/**
 * TypeScript definitions for xhtmlx
 *
 * Declarative HTML attributes for REST API driven UIs.
 * Like htmx, but the server returns JSON and xhtmlx renders UI client-side
 * using templates.
 */

export = xhtmlx;
export as namespace xhtmlx;

declare const xhtmlx: xhtmlx.Xhtmlx;

declare namespace xhtmlx {

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  interface XhtmlxConfig {
    /** Enable debug logging to the console. */
    debug: boolean;
    /** Default swap mode for rendered content (e.g. "innerHTML"). */
    defaultSwapMode: string;
    /** CSS class added to indicator elements while a request is in-flight. */
    indicatorClass: string;
    /** CSS class added to elements that have a request in-flight. */
    requestClass: string;
    /** CSS class added to elements that received an error response. */
    errorClass: string;
    /** Arrays above this size use requestAnimationFrame batching in xh-each. */
    batchThreshold: number;
    /** Global fallback error template URL. */
    defaultErrorTemplate: string | null;
    /** Global fallback error target CSS selector. */
    defaultErrorTarget: string | null;
    /** Prefix prepended to all xh-template URLs (for UI versioning). */
    templatePrefix: string;
    /** Prefix prepended to all REST verb URLs. */
    apiPrefix: string;
    /** Current UI version identifier (any string). */
    uiVersion: string | null;
  }

  // -------------------------------------------------------------------------
  // DataContext
  // -------------------------------------------------------------------------

  class DataContext {
    /** The JSON payload for this context level. */
    data: any;
    /** Enclosing parent context, or null at root. */
    parent: DataContext | null;
    /** Current iteration index for xh-each, or null. */
    index: number | null;

    /**
     * @param data   The JSON payload for this level.
     * @param parent Enclosing context (null at root).
     * @param index  Current iteration index for xh-each.
     */
    constructor(data?: any, parent?: DataContext | null, index?: number | null);

    /**
     * Resolve a dotted path against this context.
     *
     * Special variables:
     *   $index  - iteration index
     *   $parent - jump to parent context, continue resolving remainder
     *   $root   - jump to root context, continue resolving remainder
     *
     * Supports transform pipes: "price | currency"
     *
     * If the key is not found locally, walks up the parent chain.
     *
     * @param path e.g. "user.name", "$parent.title", "$index"
     * @returns resolved value or undefined
     */
    resolve(path: string): any;
  }

  // -------------------------------------------------------------------------
  // MutableDataContext
  // -------------------------------------------------------------------------

  class MutableDataContext extends DataContext {
    /**
     * @param data   The JSON payload for this level.
     * @param parent Enclosing context (null at root).
     * @param index  Current iteration index for xh-each.
     */
    constructor(data?: any, parent?: DataContext | null, index?: number | null);

    /**
     * Set a value at the given dotted path, creating intermediate objects as
     * needed. Notifies all subscribers for the given path.
     *
     * @param path  e.g. "user.name"
     * @param value The new value.
     */
    set(path: string, value: any): void;

    /**
     * Subscribe to changes on a given path.
     *
     * @param path     The dotted path to watch.
     * @param callback Called when the value at path changes.
     */
    subscribe(path: string, callback: () => void): void;
  }

  // -------------------------------------------------------------------------
  // SwitchVersionOptions
  // -------------------------------------------------------------------------

  interface SwitchVersionOptions {
    /** Template prefix. Defaults to "/ui/{version}". */
    templatePrefix?: string;
    /** API prefix. Defaults to "" (unchanged). */
    apiPrefix?: string;
    /** Re-render all active widgets. Defaults to true. */
    reload?: boolean;
  }

  // -------------------------------------------------------------------------
  // Custom event detail types
  // -------------------------------------------------------------------------

  interface XhBeforeRequestDetail {
    url: string;
    method: string;
    headers: Record<string, string>;
  }

  interface XhAfterRequestDetail {
    url: string;
    status: number;
  }

  interface XhBeforeSwapDetail {
    target: Element;
    fragment: DocumentFragment;
    swapMode: string;
    isError?: boolean;
  }

  interface XhAfterSwapDetail {
    target: Element;
    isError?: boolean;
  }

  interface XhResponseErrorDetail {
    status: number;
    statusText: string;
    body: any;
  }

  interface XhRetryDetail {
    attempt: number;
    maxRetries: number;
    status?: number;
    error?: string;
  }

  interface XhVersionChangedDetail {
    version: string;
    templatePrefix: string;
    apiPrefix: string;
  }

  interface XhWsOpenDetail {
    url: string;
  }

  interface XhWsCloseDetail {
    code: number;
    reason: string;
  }

  interface XhWsErrorDetail {
    url: string;
  }

  // -------------------------------------------------------------------------
  // Main xhtmlx API
  // -------------------------------------------------------------------------

  interface Xhtmlx {
    /** Library configuration. */
    config: XhtmlxConfig;

    /**
     * Manually process a DOM node and its descendants.
     * @param root Element to process (defaults to document.body).
     * @param ctx  Optional data context.
     */
    process(root?: Element, ctx?: DataContext): void;

    /**
     * Create a DataContext for programmatic use.
     * @param data   The data payload.
     * @param parent Parent context.
     * @param index  Iteration index.
     */
    createContext(data: any, parent?: DataContext, index?: number): DataContext;

    /** Clear the template cache. */
    clearTemplateCache(): void;

    /** Clear the response cache. */
    clearResponseCache(): void;

    /**
     * Interpolate a string using a data context.
     * Replaces all {{field}} tokens.
     *
     * @param str       Source string with {{field}} tokens.
     * @param ctx       Data context for resolution.
     * @param uriEncode If true, URI-encode each substituted value.
     */
    interpolate(str: string, ctx: DataContext, uriEncode?: boolean): string;

    /**
     * Register a custom directive processed during binding application.
     *
     * @param name    Directive name (the xh-* attribute name without the "xh-" prefix).
     * @param handler Called for each element with the directive.
     */
    directive(
      name: string,
      handler: (el: Element, value: string, ctx: DataContext) => void
    ): void;

    /**
     * Register a global hook.
     * Return false from the handler to cancel the event (where applicable).
     *
     * @param event   Hook event name (e.g. "beforeRequest").
     * @param handler Hook handler. Return false to cancel.
     */
    hook(event: string, handler: (detail: any) => boolean | void): void;

    /**
     * Register a named transform for pipe syntax in bindings.
     * Usage in templates: {{price | currency}}
     *
     * @param name Transform name.
     * @param fn   Transform function.
     */
    transform(name: string, fn: (value: any) => any): void;

    /**
     * Switch UI version. Sets template and API prefixes, clears all caches.
     * Version can be any string: "v2", "abc123", "20260315", a git SHA, etc.
     *
     * @param version Version identifier.
     * @param opts    Options for prefix overrides and reload control.
     */
    switchVersion(version: string, opts?: SwitchVersionOptions): void;

    /**
     * Re-render all active widgets, or only those using a specific template.
     * Re-fetches data from API and re-renders with (possibly new) templates.
     *
     * @param templateUrl If provided, only reload widgets using this template.
     */
    reload(templateUrl?: string): void;

    /** Library version string. */
    version: string;

    /** Internals exposed for testing (not part of the public API). */
    _internals: {
      DataContext: typeof DataContext;
      MutableDataContext: typeof MutableDataContext;
      interpolate: (str: string, ctx: DataContext, uriEnc: boolean) => string;
      parseTrigger: Function;
      parseTimeValue: Function;
      renderTemplate: Function;
      applyBindings: (el: Element, ctx: DataContext) => boolean;
      processEach: Function;
      processBindingsInTree: Function;
      processElement: Function;
      attachOnHandler: Function;
      executeRequest: Function;
      resolveErrorTemplate: Function;
      findErrorBoundary: Function;
      getRestVerb: (el: Element) => { verb: string; url: string } | null;
      performSwap: Function;
      buildRequestBody: Function;
      fetchTemplate: (url: string) => Promise<string>;
      resolveTemplate: Function;
      getSwapTarget: Function;
      defaultTrigger: Function;
      resolveDot: (obj: any, parts: string[]) => any;
      templateCache: Map<string, Promise<string>>;
      responseCache: Map<string, { data: string; timestamp: number }>;
      elementStates: WeakMap<Element, any>;
      generationMap: WeakMap<Element, number>;
      fetchWithRetry: Function;
      applySettleClasses: Function;
      setupWebSocket: Function;
      setupWsSend: Function;
      boostElement: Function;
      boostLink: Function;
      boostForm: Function;
      customDirectives: Array<{ name: string; handler: Function }>;
      globalHooks: Record<string, Function[]>;
      transforms: Record<string, (value: any) => any>;
      runHooks: (event: string, detail: any) => boolean;
      registerDirective: (
        name: string,
        handler: (el: Element, value: string, ctx: DataContext) => void
      ) => void;
      registerHook: (
        event: string,
        handler: (detail: any) => boolean | void
      ) => void;
      registerTransform: (name: string, fn: (value: any) => any) => void;
      config: XhtmlxConfig;
    };
  }
}

// ---------------------------------------------------------------------------
// Global declarations (browser -- window.xhtmlx and custom events)
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    xhtmlx: xhtmlx.Xhtmlx;
  }

  /**
   * Custom event map for xhtmlx events.
   * Use with addEventListener on DOM elements:
   *   el.addEventListener("xh:beforeRequest", (e) => { ... })
   */
  interface HTMLElementEventMap {
    "xh:beforeRequest": CustomEvent<xhtmlx.XhBeforeRequestDetail>;
    "xh:afterRequest": CustomEvent<xhtmlx.XhAfterRequestDetail>;
    "xh:beforeSwap": CustomEvent<xhtmlx.XhBeforeSwapDetail>;
    "xh:afterSwap": CustomEvent<xhtmlx.XhAfterSwapDetail>;
    "xh:responseError": CustomEvent<xhtmlx.XhResponseErrorDetail>;
    "xh:retry": CustomEvent<xhtmlx.XhRetryDetail>;
    "xh:versionChanged": CustomEvent<xhtmlx.XhVersionChangedDetail>;
    "xh:wsOpen": CustomEvent<xhtmlx.XhWsOpenDetail>;
    "xh:wsClose": CustomEvent<xhtmlx.XhWsCloseDetail>;
    "xh:wsError": CustomEvent<xhtmlx.XhWsErrorDetail>;
  }
}
