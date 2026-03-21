/**
 * @jest-environment jsdom
 */

/**
 * Comparison: xhtmlx render() with DOM patching vs React re-render
 *
 * xhtmlx.render() patches bound DOM nodes in place on subsequent calls,
 * similar to how React's reconciler diffs and patches.
 *
 * React side uses a stateful component with useState, which is how real
 * React apps work. setState(sameRef) bails via Object.is() — equivalent
 * to xhtmlx's data-identity check. setState(newObj) triggers reconciliation.
 */

const { bench } = require('../bench-helper');
const xhtmlx = require('../../../xhtmlx.js');
const { DataContext } = xhtmlx._internals;
const { h, createStatefulBench } = require('./react-helper');

describe('vs React: Patched render (DOM diffing)', () => {
  let xhContainer, reactContainer;

  beforeEach(() => {
    xhContainer = document.createElement('div');
    reactContainer = document.createElement('div');
    document.body.appendChild(xhContainer);
    document.body.appendChild(reactContainer);
    xhtmlx.clearTemplateCache();
  });

  afterEach(() => {
    xhContainer.remove();
    reactContainer.remove();
  });

  // --- Single text binding, same data (patch = noop) ---

  test('[xhtmlx render()] single text — same data (patch noop)', () => {
    const html = '<span xh-text="name"></span>';
    const data = { name: 'Alice' };
    bench('xhtmlx render(): 1 text same data', 50000, () => {
      xhtmlx.render(html, data, xhContainer);
    });
  });

  test('[React]             single text — same data', () => {
    const data = { name: 'Alice' };
    const { update, teardown } = createStatefulBench(
      d => h('span', null, d.name),
      reactContainer
    );
    update(data); // initial render
    bench('React:            1 text same data', 50000, () => {
      update(data); // same reference → useState bail → noop
    });
    teardown();
  });

  // --- Single text binding, changing data ---

  test('[xhtmlx render()] single text — changing data', () => {
    const html = '<span xh-text="count"></span>';
    let i = 0;
    bench('xhtmlx render(): 1 text changing', 50000, () => {
      xhtmlx.render(html, { count: i++ }, xhContainer);
    });
  });

  test('[React]             single text — changing data', () => {
    const { update, teardown } = createStatefulBench(
      d => h('span', null, d.count),
      reactContainer
    );
    let i = 0;
    bench('React:            1 text changing', 50000, () => {
      update({ count: i++ }); // new object → re-render
    });
    teardown();
  });

  // --- 5 text bindings, same data ---

  test('[xhtmlx render()] 5 texts — same data', () => {
    const html = `<div>
      <span xh-text="a"></span><span xh-text="b"></span>
      <span xh-text="c"></span><span xh-text="d"></span>
      <span xh-text="e"></span></div>`;
    const data = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' };
    bench('xhtmlx render(): 5 text same', 20000, () => {
      xhtmlx.render(html, data, xhContainer);
    });
  });

  test('[React]             5 texts — same data', () => {
    const data = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' };
    const { update, teardown } = createStatefulBench(
      d => h('div', null,
        h('span', null, d.a), h('span', null, d.b),
        h('span', null, d.c), h('span', null, d.d),
        h('span', null, d.e)
      ),
      reactContainer
    );
    update(data);
    bench('React:            5 text same', 20000, () => {
      update(data);
    });
    teardown();
  });

  // --- 10 text bindings, changing data ---

  test('[xhtmlx render()] 10 texts — changing data', () => {
    const fields = {};
    for (let i = 0; i < 10; i++) fields[`f${i}`] = `v${i}`;
    const html = '<div>' + Array.from({ length: 10 }, (_, i) =>
      `<span xh-text="f${i}"></span>`
    ).join('') + '</div>';
    let n = 0;
    bench('xhtmlx render(): 10 text changing', 10000, () => {
      const data = {};
      for (let i = 0; i < 10; i++) data[`f${i}`] = `v${n + i}`;
      xhtmlx.render(html, data, xhContainer);
      n++;
    });
  });

  test('[React]             10 texts — changing data', () => {
    const { update, teardown } = createStatefulBench(
      d => {
        const children = [];
        for (let i = 0; i < 10; i++) children.push(h('span', { key: i }, d[`f${i}`]));
        return h('div', null, ...children);
      },
      reactContainer
    );
    let n = 0;
    bench('React:            10 text changing', 10000, () => {
      const data = {};
      for (let i = 0; i < 10; i++) data[`f${i}`] = `v${n + i}`;
      update(data);
      n++;
    });
    teardown();
  });

  // --- Dashboard card (mixed bindings), same data ---

  test('[xhtmlx render()] dashboard card — same data', () => {
    const html = `<div class="card">
      <h3 xh-text="title"></h3>
      <div xh-text="value"></div>
      <span xh-class-up="positive" xh-text="change"></span>
      <a xh-attr-href="link">Details</a></div>`;
    const data = { title: 'Revenue', value: '$12,345', change: '+5%', positive: true, link: '/r' };
    bench('xhtmlx render(): card same', 20000, () => {
      xhtmlx.render(html, data, xhContainer);
    });
  });

  test('[React]             dashboard card — same data', () => {
    const data = { title: 'Revenue', value: '$12,345', change: '+5%', positive: true, link: '/r' };
    const { update, teardown } = createStatefulBench(
      d => h('div', { className: 'card' },
        h('h3', null, d.title),
        h('div', null, d.value),
        h('span', { className: d.positive ? 'up' : '' }, d.change),
        h('a', { href: d.link }, 'Details')
      ),
      reactContainer
    );
    update(data);
    bench('React:            card same', 20000, () => {
      update(data);
    });
    teardown();
  });

  // --- Dashboard card, changing data ---

  test('[xhtmlx render()] dashboard card — changing data', () => {
    const html = `<div class="card">
      <h3 xh-text="title"></h3>
      <div xh-text="value"></div>
      <span xh-class-up="positive" xh-text="change"></span>
      <a xh-attr-href="link">Details</a></div>`;
    let i = 0;
    bench('xhtmlx render(): card changing', 20000, () => {
      xhtmlx.render(html, {
        title: 'Revenue', value: `$${10000 + i}`,
        change: `+${i % 10}%`, positive: i % 2 === 0,
        link: `/r/${i}`
      }, xhContainer);
      i++;
    });
  });

  test('[React]             dashboard card — changing data', () => {
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
    bench('React:            card changing', 20000, () => {
      update({
        title: 'Revenue', value: `$${10000 + i}`,
        change: `+${i % 10}%`, positive: i % 2 === 0,
        link: `/r/${i}`
      });
      i++;
    });
    teardown();
  });

  // --- User profile card (9 bindings), same data ---

  test('[xhtmlx render()] profile card — same data', () => {
    const html = `<div class="profile-card">
      <img xh-attr-src="avatar" xh-attr-alt="name" class="avatar">
      <h2 xh-text="name" xh-class-verified="verified"></h2>
      <p xh-text="role"></p><p xh-text="email"></p>
      <p xh-text="location"></p>
      <span xh-text="posts"></span><span xh-text="followers"></span></div>`;
    const data = {
      name: 'Alice', email: 'a@b.com', avatar: '/a.png', role: 'Dev',
      location: 'SF', verified: true, posts: 142, followers: 1283
    };
    bench('xhtmlx render(): profile same', 10000, () => {
      xhtmlx.render(html, data, xhContainer);
    });
  });

  test('[React]             profile card — same data', () => {
    const d = {
      name: 'Alice', email: 'a@b.com', avatar: '/a.png', role: 'Dev',
      location: 'SF', verified: true, posts: 142, followers: 1283
    };
    const { update, teardown } = createStatefulBench(
      d => h('div', { className: 'profile-card' },
        h('img', { src: d.avatar, alt: d.name, className: 'avatar' }),
        h('h2', { className: d.verified ? 'verified' : '' }, d.name),
        h('p', null, d.role), h('p', null, d.email),
        h('p', null, d.location),
        h('span', null, d.posts), h('span', null, d.followers)
      ),
      reactContainer
    );
    update(d);
    bench('React:            profile same', 10000, () => {
      update(d);
    });
    teardown();
  });

  // --- Conditional (xh-show) same data ---

  test('[xhtmlx render()] conditional — same (no toggle)', () => {
    const html = '<div><div xh-show="show"><span xh-text="name"></span></div></div>';
    const data = { show: true, name: 'Alice' };
    bench('xhtmlx render(): cond same', 20000, () => {
      xhtmlx.render(html, data, xhContainer);
    });
  });

  test('[React]             conditional — same (no toggle)', () => {
    const data = { show: true, name: 'Alice' };
    const { update, teardown } = createStatefulBench(
      d => h('div', null, h('div', null, h('span', null, d.name))),
      reactContainer
    );
    update(data);
    bench('React:            cond same', 20000, () => {
      update(data);
    });
    teardown();
  });
});
