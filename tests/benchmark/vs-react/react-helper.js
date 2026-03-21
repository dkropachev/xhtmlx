/**
 * React helpers for benchmark comparison.
 * Uses React.createElement directly (no JSX/Babel needed).
 */

const React = require('react');
const ReactDOM = require('react-dom');
const { createRoot } = require('react-dom/client');
const { flushSync } = require('react-dom');

const h = React.createElement;

/**
 * Synchronous render into a container using ReactDOM.flushSync.
 * This forces React to commit synchronously (no batching / concurrent mode),
 * making it a fair comparison with xhtmlx's synchronous DOM writes.
 */
function syncRender(element, container) {
  let root = container._reactRoot;
  if (!root) {
    root = createRoot(container);
    container._reactRoot = root;
  }
  flushSync(() => {
    root.render(element);
  });
}

/**
 * Unmount React root from container.
 */
function syncUnmount(container) {
  if (container._reactRoot) {
    flushSync(() => {
      container._reactRoot.unmount();
    });
    delete container._reactRoot;
  }
}

/**
 * Create a stateful React component for re-render benchmarks.
 *
 * Uses useState internally so React can bail out on same-reference data
 * via Object.is() — equivalent to xhtmlx's data-identity check in render().
 * This is how real React apps work: components re-render via state updates,
 * not repeated root.render() calls.
 *
 * @param {Function} renderFn - (data) => ReactElement
 * @param {Element} container - DOM container
 * @returns {{ update: Function, teardown: Function }}
 */
function createStatefulBench(renderFn, container) {
  let setter = null;

  function BenchComponent() {
    const stateHook = React.useState(undefined);
    setter = stateHook[1];
    return stateHook[0] !== undefined ? renderFn(stateHook[0]) : null;
  }

  const root = createRoot(container);
  container._reactRoot = root;
  flushSync(() => root.render(h(BenchComponent)));

  return {
    update: function(data) {
      flushSync(() => setter(data));
    },
    teardown: function() {
      flushSync(() => root.unmount());
      delete container._reactRoot;
    }
  };
}

module.exports = { h, React, ReactDOM, syncRender, syncUnmount, createStatefulBench, flushSync };
