/**
 * @jest-environment jsdom
 */

const xhtmlx = require('../../xhtmlx.js');
const { DataContext, applyBindings } = xhtmlx._internals;

describe('xh-class-* directive', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('adds class when value is truthy', () => {
    it('adds class when value is true', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-active', 'isActive');
      container.appendChild(el);

      const ctx = new DataContext({ isActive: true });
      applyBindings(el, ctx);

      expect(el.classList.contains('active')).toBe(true);
    });

    it('adds class when value is 1', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-highlighted', 'flag');
      container.appendChild(el);

      const ctx = new DataContext({ flag: 1 });
      applyBindings(el, ctx);

      expect(el.classList.contains('highlighted')).toBe(true);
    });

    it('adds class when value is "yes"', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-visible', 'state');
      container.appendChild(el);

      const ctx = new DataContext({ state: 'yes' });
      applyBindings(el, ctx);

      expect(el.classList.contains('visible')).toBe(true);
    });

    it('adds class when value is a non-empty string', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-enabled', 'label');
      container.appendChild(el);

      const ctx = new DataContext({ label: 'something' });
      applyBindings(el, ctx);

      expect(el.classList.contains('enabled')).toBe(true);
    });

    it('adds class when value is a non-empty array', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-has-items', 'items');
      container.appendChild(el);

      const ctx = new DataContext({ items: [1, 2, 3] });
      applyBindings(el, ctx);

      expect(el.classList.contains('has-items')).toBe(true);
    });

    it('adds class when value is a non-zero number', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-positive', 'count');
      container.appendChild(el);

      const ctx = new DataContext({ count: 42 });
      applyBindings(el, ctx);

      expect(el.classList.contains('positive')).toBe(true);
    });
  });

  describe('removes class when value is falsy', () => {
    it('removes class when value is false', () => {
      const el = document.createElement('div');
      el.classList.add('active');
      el.setAttribute('xh-class-active', 'isActive');
      container.appendChild(el);

      const ctx = new DataContext({ isActive: false });
      applyBindings(el, ctx);

      expect(el.classList.contains('active')).toBe(false);
    });

    it('removes class when value is 0', () => {
      const el = document.createElement('div');
      el.classList.add('highlighted');
      el.setAttribute('xh-class-highlighted', 'flag');
      container.appendChild(el);

      const ctx = new DataContext({ flag: 0 });
      applyBindings(el, ctx);

      expect(el.classList.contains('highlighted')).toBe(false);
    });

    it('removes class when value is null', () => {
      const el = document.createElement('div');
      el.classList.add('visible');
      el.setAttribute('xh-class-visible', 'state');
      container.appendChild(el);

      const ctx = new DataContext({ state: null });
      applyBindings(el, ctx);

      expect(el.classList.contains('visible')).toBe(false);
    });

    it('removes class when value is undefined', () => {
      const el = document.createElement('div');
      el.classList.add('visible');
      el.setAttribute('xh-class-visible', 'missing');
      container.appendChild(el);

      const ctx = new DataContext({});
      applyBindings(el, ctx);

      expect(el.classList.contains('visible')).toBe(false);
    });

    it('removes class when value is empty string', () => {
      const el = document.createElement('div');
      el.classList.add('enabled');
      el.setAttribute('xh-class-enabled', 'label');
      container.appendChild(el);

      const ctx = new DataContext({ label: '' });
      applyBindings(el, ctx);

      expect(el.classList.contains('enabled')).toBe(false);
    });

    it('does not add class when value is falsy and class not present', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-active', 'isActive');
      container.appendChild(el);

      const ctx = new DataContext({ isActive: false });
      applyBindings(el, ctx);

      expect(el.classList.contains('active')).toBe(false);
    });
  });

  describe('multiple xh-class-* on same element', () => {
    it('applies multiple class directives independently', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-active', 'isActive');
      el.setAttribute('xh-class-highlighted', 'isHighlighted');
      el.setAttribute('xh-class-error', 'hasError');
      container.appendChild(el);

      const ctx = new DataContext({
        isActive: true,
        isHighlighted: false,
        hasError: true
      });
      applyBindings(el, ctx);

      expect(el.classList.contains('active')).toBe(true);
      expect(el.classList.contains('highlighted')).toBe(false);
      expect(el.classList.contains('error')).toBe(true);
    });

    it('preserves existing classes not managed by xh-class-*', () => {
      const el = document.createElement('div');
      el.className = 'base-class';
      el.setAttribute('xh-class-active', 'isActive');
      container.appendChild(el);

      const ctx = new DataContext({ isActive: true });
      applyBindings(el, ctx);

      expect(el.classList.contains('base-class')).toBe(true);
      expect(el.classList.contains('active')).toBe(true);
    });
  });

  describe('dot notation works', () => {
    it('resolves nested field for class value', () => {
      const el = document.createElement('div');
      el.setAttribute('xh-class-active', 'user.isActive');
      container.appendChild(el);

      const ctx = new DataContext({ user: { isActive: true } });
      applyBindings(el, ctx);

      expect(el.classList.contains('active')).toBe(true);
    });
  });

  describe('combined with other directives', () => {
    it('works alongside xh-text', () => {
      const el = document.createElement('span');
      el.setAttribute('xh-text', 'label');
      el.setAttribute('xh-class-bold', 'isBold');
      container.appendChild(el);

      const ctx = new DataContext({ label: 'Hello', isBold: true });
      applyBindings(el, ctx);

      expect(el.textContent).toBe('Hello');
      expect(el.classList.contains('bold')).toBe(true);
    });
  });
});
