/**
 * @jest-environment jsdom
 */

const xhtmlx = require("../../xhtmlx.js");

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

beforeEach(() => {
  document.body.innerHTML = "";
  global.fetch = jest.fn();
  xhtmlx.clearTemplateCache();
});

afterEach(() => {
  delete global.fetch;
});

function mockFetchJSON(data, status = 200) {
  global.fetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status: status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
}

describe("Validation flow integration", () => {
  test("form with invalid fields blocks xh-post", async () => {
    mockFetchJSON({ success: true });

    document.body.innerHTML = `
      <form id="myform" xh-post="/api/users" xh-trigger="submit">
        <input name="username" type="text" xh-validate="required" value="" />
        <input name="email" type="email" xh-validate="required" value="" />
        <template><span class="result">Created</span></template>
      </form>
    `;

    xhtmlx.process(document.body);

    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    document.getElementById("myform").dispatchEvent(submitEvent);

    await flushPromises();

    // Fetch should NOT have been called because validation failed
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("form with valid fields sends xh-post", async () => {
    mockFetchJSON({ success: true });

    document.body.innerHTML = `
      <form id="myform" xh-post="/api/users" xh-trigger="submit">
        <input name="username" type="text" xh-validate="required" value="alice" />
        <input name="email" type="email" xh-validate="required" value="alice@example.com" />
        <template><span class="result">Created</span></template>
      </form>
    `;

    xhtmlx.process(document.body);

    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    document.getElementById("myform").dispatchEvent(submitEvent);

    await flushPromises();

    // Fetch should have been called because validation passed
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe("/api/users");
    expect(opts.method).toBe("POST");
  });

  test("validation runs on each submit attempt", async () => {
    mockFetchJSON({ success: true });

    document.body.innerHTML = `
      <form id="myform" xh-post="/api/users" xh-trigger="submit">
        <input id="name-input" name="username" type="text" xh-validate="required" value="" />
        <template><span class="result">Created</span></template>
      </form>
    `;

    xhtmlx.process(document.body);
    const form = document.getElementById("myform");
    const input = document.getElementById("name-input");

    // First submit: should fail
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(input.classList.contains("xh-invalid")).toBe(true);

    // Fix the value
    input.value = "alice";

    // Second submit: should succeed
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("error messages clear after fixing and resubmitting", async () => {
    mockFetchJSON({ success: true });

    document.body.innerHTML = `
      <form id="myform" xh-post="/api/users" xh-trigger="submit">
        <input id="name-input" name="username" type="text" xh-validate="required"
               xh-validate-target="#name-error" value="" />
        <span id="name-error"></span>
        <template><span class="result">Created</span></template>
      </form>
    `;

    xhtmlx.process(document.body);
    const form = document.getElementById("myform");
    const input = document.getElementById("name-input");
    const errorSpan = document.getElementById("name-error");

    // First submit: errors should appear
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();
    expect(errorSpan.textContent).toBe("username is required");
    expect(input.classList.contains("xh-invalid")).toBe(true);

    // Fix the value and resubmit
    input.value = "alice";
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flushPromises();

    // Errors should be cleared
    expect(errorSpan.textContent).toBe("");
    expect(input.classList.contains("xh-invalid")).toBe(false);
  });

  test("button inside form with xh-post validates form fields", async () => {
    mockFetchJSON({ success: true });

    document.body.innerHTML = `
      <form id="myform">
        <input name="username" type="text" xh-validate="required" value="" />
        <button id="btn" xh-post="/api/users" xh-trigger="click">
          <template><span>OK</span></template>
        </button>
      </form>
    `;

    xhtmlx.process(document.body);

    document.getElementById("btn").click();
    await flushPromises();

    // Fetch should NOT be called because form validation failed
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("validation with pattern blocks request for invalid format", async () => {
    mockFetchJSON({ success: true });

    document.body.innerHTML = `
      <form id="myform" xh-post="/api/users" xh-trigger="submit">
        <input name="email" type="text" xh-validate="required"
               xh-validate-pattern="^[^@]+@[^@]+$" value="not-email" />
        <template><span class="result">Created</span></template>
      </form>
    `;

    xhtmlx.process(document.body);

    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    document.getElementById("myform").dispatchEvent(submitEvent);

    await flushPromises();

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
