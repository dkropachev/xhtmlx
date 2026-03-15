/**
 * @jest-environment jsdom
 */

const xhtmlx = require('../../xhtmlx.js');
const { DataContext, applyBindings } = xhtmlx._internals;

describe('xh-show / xh-hide directives', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('xh-show', () => {
    it('sets display="" when value is truthy (true)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'visible');
      el.style.display = 'none';
      container.appendChild(el);

      const ctx = new DataContext({ visible: true });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('');
    });

    it('sets display="none" when value is falsy (false)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'visible');
      container.appendChild(el);

      const ctx = new DataContext({ visible: false });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });

    it('sets display="" when value is truthy (non-empty string)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'text');
      container.appendChild(el);

      const ctx = new DataContext({ text: 'hello' });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('');
    });

    it('sets display="none" when value is falsy (null)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'value');
      container.appendChild(el);

      const ctx = new DataContext({ value: null });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });

    it('sets display="none" when value is falsy (undefined)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'missing');
      container.appendChild(el);

      const ctx = new DataContext({});
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });

    it('sets display="none" when value is falsy (0)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'count');
      container.appendChild(el);

      const ctx = new DataContext({ count: 0 });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });

    it('sets display="" when value is truthy (1)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'count');
      container.appendChild(el);

      const ctx = new DataContext({ count: 1 });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('');
    });

    it('sets display="none" when value is falsy (empty string)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'text');
      container.appendChild(el);

      const ctx = new DataContext({ text: '' });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });
  });

  describe('xh-hide', () => {
    it('sets display="none" when value is truthy (true)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'hidden');
      container.appendChild(el);

      const ctx = new DataContext({ hidden: true });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });

    it('sets display="" when value is falsy (false)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'hidden');
      el.style.display = 'none';
      container.appendChild(el);

      const ctx = new DataContext({ hidden: false });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('');
    });

    it('sets display="none" when value is truthy (non-empty string)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'reason');
      container.appendChild(el);

      const ctx = new DataContext({ reason: 'some reason' });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });

    it('sets display="" when value is falsy (null)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'value');
      el.style.display = 'none';
      container.appendChild(el);

      const ctx = new DataContext({ value: null });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('');
    });

    it('sets display="" when value is falsy (undefined)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'missing');
      el.style.display = 'none';
      container.appendChild(el);

      const ctx = new DataContext({});
      applyBindings(el, ctx);

      expect(el.style.display).toBe('');
    });

    it('sets display="none" when value is truthy (1)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'flag');
      container.appendChild(el);

      const ctx = new DataContext({ flag: 1 });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });

    it('sets display="" when value is falsy (0)', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'flag');
      el.style.display = 'none';
      container.appendChild(el);

      const ctx = new DataContext({ flag: 0 });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('');
    });
  });

  describe('element stays in DOM (unlike xh-if which removes)', () => {
    it('xh-show with falsy value keeps element in DOM', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'visible');
      container.appendChild(el);

      const ctx = new DataContext({ visible: false });
      const result = applyBindings(el, ctx);

      expect(result).toBe(true);
      expect(container.contains(el)).toBe(true);
      expect(el.style.display).toBe('none');
    });

    it('xh-hide with truthy value keeps element in DOM', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'hidden');
      container.appendChild(el);

      const ctx = new DataContext({ hidden: true });
      const result = applyBindings(el, ctx);

      expect(result).toBe(true);
      expect(container.contains(el)).toBe(true);
      expect(el.style.display).toBe('none');
    });

    it('xh-if with falsy value removes element from DOM', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-if', 'show');
      container.appendChild(el);

      const ctx = new DataContext({ show: false });
      const result = applyBindings(el, ctx);

      expect(result).toBe(false);
      expect(container.contains(el)).toBe(false);
    });
  });

  describe('works with dot notation', () => {
    it('xh-show resolves nested field', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'user.isVisible');
      container.appendChild(el);

      const ctx = new DataContext({ user: { isVisible: true } });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('');
    });

    it('xh-hide resolves nested field', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-hide', 'config.isHidden');
      container.appendChild(el);

      const ctx = new DataContext({ config: { isHidden: true } });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });

    it('xh-show with missing nested field hides element', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'user.name');
      container.appendChild(el);

      const ctx = new DataContext({ user: {} });
      applyBindings(el, ctx);

      expect(el.style.display).toBe('none');
    });
  });

  describe('xh-show and xh-hide run before xh-if/xh-unless', () => {
    it('xh-show runs and then xh-if removes element if falsy', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'showMe');
      el.setAttribute('xh-if', 'exists');
      container.appendChild(el);

      const ctx = new DataContext({ showMe: true, exists: false });
      const result = applyBindings(el, ctx);

      // xh-if should remove the element
      expect(result).toBe(false);
      expect(container.contains(el)).toBe(false);
    });

    it('both xh-show and xh-if truthy keeps element visible', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-show', 'showMe');
      el.setAttribute('xh-if', 'exists');
      container.appendChild(el);

      const ctx = new DataContext({ showMe: true, exists: true });
      const result = applyBindings(el, ctx);

      expect(result).toBe(true);
      expect(container.contains(el)).toBe(true);
      expect(el.style.display).toBe('');
    });
  });
});
