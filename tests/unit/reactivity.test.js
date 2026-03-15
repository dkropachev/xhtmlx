/**
 * @jest-environment jsdom
 */

const xhtmlx = require('../../xhtmlx.js');
const { MutableDataContext } = xhtmlx._internals;

describe('MutableDataContext', () => {
  describe('set()', () => {
    it('updates value in data', () => {
      const ctx = new MutableDataContext({ name: 'Alice' });
      ctx.set('name', 'Bob');
      expect(ctx.data.name).toBe('Bob');
    });

    it('with dot notation creates nested structure', () => {
      const ctx = new MutableDataContext({});
      ctx.set('user.name', 'Charlie');
      expect(ctx.data.user).toBeDefined();
      expect(ctx.data.user.name).toBe('Charlie');
    });

    it('with dot notation updates existing nested structure', () => {
      const ctx = new MutableDataContext({ user: { name: 'Alice', age: 30 } });
      ctx.set('user.name', 'Bob');
      expect(ctx.data.user.name).toBe('Bob');
      expect(ctx.data.user.age).toBe(30);
    });

    it('with deeply nested dot notation creates intermediate objects', () => {
      const ctx = new MutableDataContext({});
      ctx.set('a.b.c', 'deep');
      expect(ctx.data.a.b.c).toBe('deep');
    });
  });

  describe('subscribe()', () => {
    it('callback fires on set()', () => {
      const ctx = new MutableDataContext({ name: 'Alice' });
      const callback = jest.fn();
      ctx.subscribe('name', callback);
      ctx.set('name', 'Bob');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('multiple subscribers on same path all fire', () => {
      const ctx = new MutableDataContext({ count: 0 });
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      const cb3 = jest.fn();
      ctx.subscribe('count', cb1);
      ctx.subscribe('count', cb2);
      ctx.subscribe('count', cb3);
      ctx.set('count', 1);
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(cb3).toHaveBeenCalledTimes(1);
    });

    it('does not fire for unrelated path changes', () => {
      const ctx = new MutableDataContext({ name: 'Alice', age: 30 });
      const callback = jest.fn();
      ctx.subscribe('name', callback);
      ctx.set('age', 31);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('resolve() still works after set()', () => {
    it('resolves updated simple value', () => {
      const ctx = new MutableDataContext({ name: 'Alice' });
      ctx.set('name', 'Bob');
      expect(ctx.resolve('name')).toBe('Bob');
    });

    it('resolves updated nested value', () => {
      const ctx = new MutableDataContext({ user: { name: 'Alice' } });
      ctx.set('user.name', 'Bob');
      expect(ctx.resolve('user.name')).toBe('Bob');
    });

    it('resolves newly created nested value', () => {
      const ctx = new MutableDataContext({});
      ctx.set('settings.theme', 'dark');
      expect(ctx.resolve('settings.theme')).toBe('dark');
    });
  });

  describe('inherits from DataContext', () => {
    it('has resolve method', () => {
      const ctx = new MutableDataContext({ x: 1 });
      expect(ctx.resolve('x')).toBe(1);
    });

    it('supports parent chain resolution', () => {
      const parent = new MutableDataContext({ parentVal: 'hello' });
      const child = new MutableDataContext({ childVal: 'world' }, parent);
      expect(child.resolve('parentVal')).toBe('hello');
    });

    it('supports $index', () => {
      const ctx = new MutableDataContext({ item: 'test' }, null, 5);
      expect(ctx.resolve('$index')).toBe(5);
    });

    it('supports $parent', () => {
      const parent = new MutableDataContext({ name: 'parent' });
      const child = new MutableDataContext({ name: 'child' }, parent);
      expect(child.resolve('$parent.name')).toBe('parent');
    });
  });
});
