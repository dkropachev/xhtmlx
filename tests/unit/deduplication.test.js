/**
 * @jest-environment jsdom
 */

const xhtmlx = require('../../xhtmlx.js');
const { elementStates, executeRequest, DataContext } = xhtmlx._internals;

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('Request deduplication', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    global.fetch = jest.fn();
    xhtmlx.clearTemplateCache();
  });

  afterEach(() => {
    document.body.removeChild(container);
    delete global.fetch;
  });

  function mockFetchJSON(data, status = 200) {
    let resolvePromise;
    const promise = new Promise(resolve => { resolvePromise = resolve; });
    global.fetch.mockReturnValue(promise);
    return function complete() {
      resolvePromise({
        ok: status >= 200 && status < 300,
        status: status,
        statusText: status === 200 ? 'OK' : 'Error',
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data))
      });
    };
  }

  function mockFetchJSONImmediate(data, status = 200) {
    global.fetch.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status: status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    });
  }

  describe('in-flight request deduplication', () => {
    it('second request while first is in-flight is skipped', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-get', '/api/data');
      container.appendChild(el);

      // Pre-initialize element state with requestInFlight = true
      const state = { requestInFlight: true, intervalIds: [], observers: [] };
      elementStates.set(el, state);

      const ctx = new DataContext({});
      executeRequest(el, ctx, []);

      // Should not have made any fetch call since request is already in-flight
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('after first request completes, second request is allowed', async () => {
      const el = document.createElement('div');
      el.setAttribute('xh-get', '/api/data');
      container.appendChild(el);

      // Initialize state with no request in-flight
      const state = { requestInFlight: false, intervalIds: [], observers: [], processed: true };
      elementStates.set(el, state);

      mockFetchJSONImmediate({ result: 'first' });

      const ctx = new DataContext({});
      executeRequest(el, ctx, []);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Wait for promise chain to complete
      await flushPromises();
      await flushPromises();

      // State should be reset
      expect(state.requestInFlight).toBe(false);

      // Make a second request
      mockFetchJSONImmediate({ result: 'second' });
      executeRequest(el, ctx, []);

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('requestInFlight is set to true during request', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-get', '/api/data');
      container.appendChild(el);

      const state = { requestInFlight: false, intervalIds: [], observers: [] };
      elementStates.set(el, state);

      // Use a pending promise to keep request in-flight
      mockFetchJSON({ data: 'test' });

      const ctx = new DataContext({});
      executeRequest(el, ctx, []);

      expect(state.requestInFlight).toBe(true);
    });

    it('requestInFlight is reset to false after request completes', async () => {
      const el = document.createElement('div');
      el.setAttribute('xh-get', '/api/data');
      container.appendChild(el);

      const state = { requestInFlight: false, intervalIds: [], observers: [] };
      elementStates.set(el, state);

      mockFetchJSONImmediate({ data: 'test' });

      const ctx = new DataContext({});
      executeRequest(el, ctx, []);

      await flushPromises();
      await flushPromises();

      expect(state.requestInFlight).toBe(false);
    });
  });

  describe('xh-disabled-class', () => {
    it('is added during request', () => {
      const el = document.createElement('button');
      el.setAttribute('xh-get', '/api/data');
      el.setAttribute('xh-disabled-class', 'loading');
      container.appendChild(el);

      const state = { requestInFlight: false, intervalIds: [], observers: [] };
      elementStates.set(el, state);

      // Use a pending promise
      mockFetchJSON({ data: 'test' });

      const ctx = new DataContext({});
      executeRequest(el, ctx, []);

      expect(el.classList.contains('loading')).toBe(true);
    });

    it('is removed after request completes', async () => {
      const el = document.createElement('button');
      el.setAttribute('xh-get', '/api/data');
      el.setAttribute('xh-disabled-class', 'loading');
      container.appendChild(el);

      const state = { requestInFlight: false, intervalIds: [], observers: [] };
      elementStates.set(el, state);

      mockFetchJSONImmediate({ data: 'test' });

      const ctx = new DataContext({});
      executeRequest(el, ctx, []);

      // During request the class should be added
      expect(el.classList.contains('loading')).toBe(true);

      await flushPromises();
      await flushPromises();

      // After request completes the class should be removed
      expect(el.classList.contains('loading')).toBe(false);
    });

    it('is removed after failed request', async () => {
      const el = document.createElement('button');
      el.setAttribute('xh-get', '/api/data');
      el.setAttribute('xh-disabled-class', 'loading');
      container.appendChild(el);

      const state = { requestInFlight: false, intervalIds: [], observers: [] };
      elementStates.set(el, state);

      global.fetch.mockRejectedValue(new Error('Network error'));

      const ctx = new DataContext({});

      // Suppress console.error for this test
      const origError = console.error;
      console.error = jest.fn();

      executeRequest(el, ctx, []);

      await flushPromises();
      await flushPromises();

      expect(el.classList.contains('loading')).toBe(false);

      console.error = origError;
    });

    it('element without xh-disabled-class is not affected', async () => {
      const el = document.createElement('button');
      el.setAttribute('xh-get', '/api/data');
      container.appendChild(el);

      const state = { requestInFlight: false, intervalIds: [], observers: [] };
      elementStates.set(el, state);

      mockFetchJSONImmediate({ data: 'test' });

      const ctx = new DataContext({});
      executeRequest(el, ctx, []);

      // Should have no class added
      expect(el.className).toBe('');

      await flushPromises();
      await flushPromises();
    });
  });
});
