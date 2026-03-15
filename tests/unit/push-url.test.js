/**
 * @jest-environment jsdom
 */

const xhtmlx = require('../../xhtmlx.js');
const { executeRequest, DataContext, elementStates } = xhtmlx._internals;

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe('xh-push-url — browser history and URL management', () => {
  let container;
  let pushStateSpy;
  let replaceStateSpy;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    global.fetch = jest.fn();
    xhtmlx.clearTemplateCache();

    pushStateSpy = jest.spyOn(window.history, 'pushState').mockImplementation(() => {});
    replaceStateSpy = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.removeChild(container);
    delete global.fetch;
    pushStateSpy.mockRestore();
    replaceStateSpy.mockRestore();
  });

  function mockFetchJSON(data, status) {
    status = status || 200;
    global.fetch.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status: status,
      statusText: status === 200 ? 'OK' : 'Error',
      text: function () { return Promise.resolve(JSON.stringify(data)); }
    });
  }

  it('xh-push-url calls history.pushState after swap', async () => {
    mockFetchJSON({ name: 'Alice' });

    var el = document.createElement('div');
    el.setAttribute('xh-get', '/api/user');
    el.setAttribute('xh-push-url', '/users/alice');
    container.appendChild(el);

    var state = { requestInFlight: false, intervalIds: [], observers: [] };
    elementStates.set(el, state);

    var ctx = new DataContext({});
    executeRequest(el, ctx, []);

    await flushPromises();
    await flushPromises();

    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ xhtmlx: true }),
      '',
      '/users/alice'
    );
  });

  it('xh-push-url="true" uses the request URL', async () => {
    mockFetchJSON({ name: 'Bob' });

    var el = document.createElement('div');
    el.setAttribute('xh-get', '/api/user');
    el.setAttribute('xh-push-url', 'true');
    container.appendChild(el);

    var state = { requestInFlight: false, intervalIds: [], observers: [] };
    elementStates.set(el, state);

    var ctx = new DataContext({});
    executeRequest(el, ctx, []);

    await flushPromises();
    await flushPromises();

    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    // The URL should be the request URL
    expect(pushStateSpy.mock.calls[0][2]).toBe('/api/user');
  });

  it('xh-push-url="/custom" uses the custom path', async () => {
    mockFetchJSON({ id: 5 });

    var el = document.createElement('div');
    el.setAttribute('xh-get', '/api/items/5');
    el.setAttribute('xh-push-url', '/items/{{id}}');
    container.appendChild(el);

    var state = { requestInFlight: false, intervalIds: [], observers: [] };
    elementStates.set(el, state);

    var ctx = new DataContext({});
    executeRequest(el, ctx, []);

    await flushPromises();
    await flushPromises();

    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(pushStateSpy.mock.calls[0][2]).toBe('/items/5');
  });

  it('xh-replace-url calls history.replaceState', async () => {
    mockFetchJSON({ name: 'Charlie' });

    var el = document.createElement('div');
    el.setAttribute('xh-get', '/api/user');
    el.setAttribute('xh-replace-url', '/users/charlie');
    container.appendChild(el);

    var state = { requestInFlight: false, intervalIds: [], observers: [] };
    elementStates.set(el, state);

    var ctx = new DataContext({});
    executeRequest(el, ctx, []);

    await flushPromises();
    await flushPromises();

    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ xhtmlx: true }),
      '',
      '/users/charlie'
    );
  });

  it('xh-replace-url="true" uses the request URL', async () => {
    mockFetchJSON({ name: 'Dave' });

    var el = document.createElement('div');
    el.setAttribute('xh-get', '/api/users/dave');
    el.setAttribute('xh-replace-url', 'true');
    container.appendChild(el);

    var state = { requestInFlight: false, intervalIds: [], observers: [] };
    elementStates.set(el, state);

    var ctx = new DataContext({});
    executeRequest(el, ctx, []);

    await flushPromises();
    await flushPromises();

    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
    expect(replaceStateSpy.mock.calls[0][2]).toBe('/api/users/dave');
  });

  it('no history change without xh-push-url or xh-replace-url', async () => {
    mockFetchJSON({ name: 'Eve' });

    var el = document.createElement('div');
    el.setAttribute('xh-get', '/api/user');
    container.appendChild(el);

    var state = { requestInFlight: false, intervalIds: [], observers: [] };
    elementStates.set(el, state);

    var ctx = new DataContext({});
    executeRequest(el, ctx, []);

    await flushPromises();
    await flushPromises();

    expect(pushStateSpy).not.toHaveBeenCalled();
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });

  it('history state contains xhtmlx metadata', async () => {
    mockFetchJSON({ name: 'Frank' });

    var el = document.createElement('div');
    el.setAttribute('xh-get', '/api/user');
    el.setAttribute('xh-push-url', '/profile');
    el.setAttribute('xh-target', '#output');
    el.setAttribute('xh-template', '/templates/user.html');
    container.appendChild(el);

    var target = document.createElement('div');
    target.id = 'output';
    container.appendChild(target);

    var state = { requestInFlight: false, intervalIds: [], observers: [] };
    elementStates.set(el, state);

    // Mock the template fetch as well
    xhtmlx._internals.templateCache.set('/templates/user.html', Promise.resolve('<span>{{name}}</span>'));

    var ctx = new DataContext({});
    executeRequest(el, ctx, []);

    await flushPromises();
    await flushPromises();

    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    var historyState = pushStateSpy.mock.calls[0][0];
    expect(historyState.xhtmlx).toBe(true);
    expect(historyState.url).toBe('/api/user');
    expect(historyState.verb).toBe('GET');
    expect(historyState.targetSel).toBe('#output');
    expect(historyState.templateUrl).toBe('/templates/user.html');
  });

  it('both xh-push-url and xh-replace-url can be used (push-url takes effect first)', async () => {
    mockFetchJSON({ name: 'Grace' });

    var el = document.createElement('div');
    el.setAttribute('xh-get', '/api/user');
    el.setAttribute('xh-push-url', '/pushed');
    el.setAttribute('xh-replace-url', '/replaced');
    container.appendChild(el);

    var state = { requestInFlight: false, intervalIds: [], observers: [] };
    elementStates.set(el, state);

    var ctx = new DataContext({});
    executeRequest(el, ctx, []);

    await flushPromises();
    await flushPromises();

    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(replaceStateSpy).toHaveBeenCalledTimes(1);
  });
});
