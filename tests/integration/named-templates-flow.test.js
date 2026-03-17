/**
 * @jest-environment jsdom
 */

const xhtmlx = require("../../xhtmlx.js");
const { templateCache, scanNamedTemplates } = xhtmlx._internals;

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

beforeEach(() => {
  document.body.innerHTML = "";
  global.fetch = jest.fn();
  templateCache.clear();
});

afterEach(() => {
  delete global.fetch;
});

describe("Named templates integration flow", () => {
  test("xh-template resolves from named template without fetch", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/")) {
        return Promise.resolve({
          ok: true, status: 200, statusText: "OK",
          text: () => Promise.resolve(JSON.stringify({ name: "Alice", email: "alice@co.io" }))
        });
      }
      return Promise.reject(new Error("Should not fetch template"));
    });

    document.body.innerHTML = `
      <template xh-name="/templates/user.html">
        <div class="user">
          <span class="user-name" xh-text="name"></span>
          <span class="user-email" xh-text="email"></span>
        </div>
      </template>

      <div xh-get="/api/user/1" xh-trigger="load"
           xh-template="/templates/user.html"
           xh-target="#result">
      </div>
      <div id="result"></div>
    `;

    scanNamedTemplates();
    xhtmlx.process(document.body);
    await flushPromises();

    expect(document.querySelector(".user-name").textContent).toBe("Alice");
    expect(document.querySelector(".user-email").textContent).toBe("alice@co.io");

    // Only the API was fetched, not the template
    const fetchCalls = global.fetch.mock.calls.map(c => c[0]);
    expect(fetchCalls.some(u => u.includes("/api/"))).toBe(true);
    expect(fetchCalls.some(u => u.includes(".html"))).toBe(false);
  });

  test("named template with xh-each renders list", async () => {
    global.fetch.mockResolvedValue({
      ok: true, status: 200, statusText: "OK",
      text: () => Promise.resolve(JSON.stringify({
        items: [{ title: "One" }, { title: "Two" }, { title: "Three" }]
      }))
    });

    document.body.innerHTML = `
      <template xh-name="/templates/list.html">
        <ul>
          <li xh-each="items" class="item" xh-text="title"></li>
        </ul>
      </template>

      <div xh-get="/api/items" xh-trigger="load"
           xh-template="/templates/list.html"
           xh-target="#output">
      </div>
      <div id="output"></div>
    `;

    scanNamedTemplates();
    xhtmlx.process(document.body);
    await flushPromises();

    const items = document.querySelectorAll(".item");
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe("One");
    expect(items[2].textContent).toBe("Three");
  });

  test("mix of named and fetched templates works", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/")) {
        return Promise.resolve({
          ok: true, status: 200, statusText: "OK",
          text: () => Promise.resolve(JSON.stringify({ msg: "hello" }))
        });
      }
      if (url.includes("/templates/remote.html")) {
        return Promise.resolve({
          ok: true, status: 200, statusText: "OK",
          text: () => Promise.resolve('<span class="remote" xh-text="msg"></span>')
        });
      }
      return Promise.reject(new Error("Unexpected fetch: " + url));
    });

    document.body.innerHTML = `
      <template xh-name="/templates/local.html">
        <span class="local" xh-text="msg"></span>
      </template>

      <div xh-get="/api/data" xh-trigger="load"
           xh-template="/templates/local.html"
           xh-target="#local-result">
      </div>
      <div id="local-result"></div>

      <div xh-get="/api/data" xh-trigger="load"
           xh-template="/templates/remote.html"
           xh-target="#remote-result">
      </div>
      <div id="remote-result"></div>
    `;

    scanNamedTemplates();
    xhtmlx.process(document.body);
    await flushPromises();
    await flushPromises();

    expect(document.querySelector(".local").textContent).toBe("hello");
    expect(document.querySelector(".remote").textContent).toBe("hello");
  });

  test("named error template works", async () => {
    global.fetch.mockResolvedValue({
      ok: false, status: 404, statusText: "Not Found",
      text: () => Promise.resolve(JSON.stringify({ error: "not_found", message: "User not found" }))
    });

    document.body.innerHTML = `
      <template xh-name="/templates/error.html">
        <div class="err">
          <span class="err-status" xh-text="status"></span>
          <span class="err-msg" xh-text="body.message"></span>
        </div>
      </template>

      <div xh-get="/api/missing" xh-trigger="load"
           xh-error-template="/templates/error.html"
           xh-target="#result">
        <template><span>success</span></template>
      </div>
      <div id="result"></div>
    `;

    scanNamedTemplates();
    xhtmlx.process(document.body);
    await flushPromises();
    await flushPromises();

    expect(document.querySelector(".err-status").textContent).toBe("404");
    expect(document.querySelector(".err-msg").textContent).toBe("User not found");
  });
});
