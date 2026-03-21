/**
 * @jest-environment jsdom
 */

/**
 * Comparison: Re-rendering with updated data (simulating state changes)
 *
 * xhtmlx: renderTemplate + performSwap (full re-render pipeline)
 * React:  stateful component with setState (idiomatic React update path)
 *
 * React uses a component with useState so updates go through React's
 * optimized internal setState path rather than repeated root.render() calls.
 */

const { bench } = require('../bench-helper');
const xhtmlx = require('../../../xhtmlx.js');
const { DataContext, renderTemplate, performSwap } = xhtmlx._internals;
const { h, createStatefulBench } = require('./react-helper');

describe('vs React: Re-rendering (data updates)', () => {
  let xhContainer, reactContainer;

  beforeEach(() => {
    xhContainer = document.createElement('div');
    reactContainer = document.createElement('div');
    document.body.appendChild(xhContainer);
    document.body.appendChild(reactContainer);
  });

  afterEach(() => {
    xhContainer.remove();
    reactContainer.remove();
  });

  test('[xhtmlx] counter update (single field change)', () => {
    const html = '<div><span xh-text="count"></span></div>';
    let i = 0;
    bench('xhtmlx: counter update', 10000, () => {
      const ctx = new DataContext({ count: i++ });
      const frag = renderTemplate(html, ctx);
      performSwap(xhContainer, frag, 'innerHTML');
    });
  });

  test('[React]  counter update (single field change)', () => {
    const { update, teardown } = createStatefulBench(
      d => h('div', null, h('span', null, d.count)),
      reactContainer
    );
    let i = 0;
    bench('React:  counter update', 10000, () => {
      update({ count: i++ });
    });
    teardown();
  });

  test('[xhtmlx] multi-field update (5 fields change)', () => {
    const html = `
      <div>
        <span xh-text="a"></span>
        <span xh-text="b"></span>
        <span xh-text="c"></span>
        <span xh-text="d"></span>
        <span xh-text="e"></span>
      </div>`;
    let i = 0;
    bench('xhtmlx: 5-field update', 5000, () => {
      const ctx = new DataContext({ a: i, b: i+1, c: i+2, d: i+3, e: i+4 });
      const frag = renderTemplate(html, ctx);
      performSwap(xhContainer, frag, 'innerHTML');
      i++;
    });
  });

  test('[React]  multi-field update (5 fields change)', () => {
    const { update, teardown } = createStatefulBench(
      d => h('div', null,
        h('span', null, d.a),
        h('span', null, d.b),
        h('span', null, d.c),
        h('span', null, d.d),
        h('span', null, d.e)
      ),
      reactContainer
    );
    let i = 0;
    bench('React:  5-field update', 5000, () => {
      update({ a: i, b: i+1, c: i+2, d: i+3, e: i+4 });
      i++;
    });
    teardown();
  });

  test('[xhtmlx] list update (swap 50-item list with new data)', () => {
    const html = '<ul><li xh-each="items"><span xh-text="name"></span></li></ul>';
    let i = 0;
    bench('xhtmlx: list 50 update', 100, () => {
      const items = Array.from({ length: 50 }, (_, j) => ({ id: j, name: `Item ${i}-${j}` }));
      const ctx = new DataContext({ items });
      const frag = renderTemplate(html, ctx);
      performSwap(xhContainer, frag, 'innerHTML');
      i++;
    });
  });

  test('[React]  list update (render 50-item list with new data)', () => {
    const { update, teardown } = createStatefulBench(
      d => h('ul', null,
        d.items.map(item => h('li', { key: item.id }, h('span', null, item.name)))
      ),
      reactContainer
    );
    let i = 0;
    bench('React:  list 50 update', 100, () => {
      const items = Array.from({ length: 50 }, (_, j) => ({ id: j, name: `Item ${i}-${j}` }));
      update({ items });
      i++;
    });
    teardown();
  });

  test('[xhtmlx] dashboard card — mixed bindings re-render', () => {
    const html = `
      <div class="card">
        <h3 xh-text="title"></h3>
        <div xh-text="value"></div>
        <span xh-class-up="positive" xh-text="change"></span>
        <a xh-attr-href="link">Details</a>
      </div>`;
    let i = 0;
    bench('xhtmlx: dashboard card update', 5000, () => {
      const ctx = new DataContext({
        title: 'Revenue', value: `$${10000 + i}`,
        change: `+${(i % 10)}%`, positive: i % 2 === 0,
        link: `/reports/${i}`
      });
      const frag = renderTemplate(html, ctx);
      performSwap(xhContainer, frag, 'innerHTML');
      i++;
    });
  });

  test('[React]  dashboard card — mixed props re-render', () => {
    const { update, teardown } = createStatefulBench(
      d => h('div', { className: 'card' },
        h('h3', null, d.title),
        h('div', null, d.value),
        h('span', { className: d.positive ? 'up' : '' }, d.change),
        h('a', { href: d.link }, 'Details')
      ),
      reactContainer
    );
    let i = 0;
    bench('React:  dashboard card update', 5000, () => {
      update({
        title: 'Revenue', value: `$${10000 + i}`,
        change: `+${(i % 10)}%`, positive: i % 2 === 0,
        link: `/reports/${i}`
      });
      i++;
    });
    teardown();
  });
});
