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

describe("xh-model integration flow", () => {
  test("GET response pre-fills form inputs via xh-model", async () => {
    mockFetchJSON({ name: "Alice", email: "alice@example.com", age: 30 });

    document.body.innerHTML = `
      <div id="profile" xh-get="/api/user" xh-trigger="load">
        <template>
          <form id="edit-form">
            <input type="text" xh-model="name" />
            <input type="email" xh-model="email" />
            <input type="number" xh-model="age" />
          </form>
        </template>
      </div>
    `;

    xhtmlx.process(document.body);
    await flushPromises();

    const nameInput = document.querySelector('[xh-model="name"]');
    const emailInput = document.querySelector('[xh-model="email"]');
    const ageInput = document.querySelector('[xh-model="age"]');

    expect(nameInput).not.toBeNull();
    expect(nameInput.value).toBe("Alice");
    expect(emailInput.value).toBe("alice@example.com");
    expect(ageInput.value).toBe("30");
  });

  test("GET response pre-fills checkbox via xh-model", async () => {
    mockFetchJSON({ active: true, newsletter: false });

    document.body.innerHTML = `
      <div id="settings" xh-get="/api/settings" xh-trigger="load">
        <template>
          <form id="settings-form">
            <input type="checkbox" xh-model="active" />
            <input type="checkbox" xh-model="newsletter" />
          </form>
        </template>
      </div>
    `;

    xhtmlx.process(document.body);
    await flushPromises();

    const activeCheckbox = document.querySelector('[xh-model="active"]');
    const newsletterCheckbox = document.querySelector('[xh-model="newsletter"]');

    expect(activeCheckbox.checked).toBe(true);
    expect(newsletterCheckbox.checked).toBe(false);
  });

  test("GET response pre-fills select via xh-model", async () => {
    mockFetchJSON({ role: "editor" });

    document.body.innerHTML = `
      <div id="role-selector" xh-get="/api/user/role" xh-trigger="load">
        <template>
          <form>
            <select xh-model="role">
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </form>
        </template>
      </div>
    `;

    xhtmlx.process(document.body);
    await flushPromises();

    const select = document.querySelector('[xh-model="role"]');
    expect(select.value).toBe("editor");
  });

  test("form with xh-model inputs submits collected values via xh-put", async () => {
    // First call returns user data, second call receives the update
    let callCount = 0;
    global.fetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(JSON.stringify({ name: "Alice", email: "alice@example.com" }))
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(JSON.stringify({ success: true }))
      });
    });

    document.body.innerHTML = `
      <div id="profile" xh-get="/api/user" xh-trigger="load">
        <template>
          <form id="edit-form" xh-put="/api/user" xh-trigger="submit">
            <input type="text" xh-model="name" />
            <input type="email" xh-model="email" />
            <template><span class="result">Updated!</span></template>
          </form>
        </template>
      </div>
    `;

    xhtmlx.process(document.body);
    await flushPromises();

    // Verify pre-fill worked
    const nameInput = document.querySelector('[xh-model="name"]');
    const emailInput = document.querySelector('[xh-model="email"]');
    expect(nameInput.value).toBe("Alice");

    // Simulate user editing
    nameInput.value = "Bob";
    emailInput.value = "bob@example.com";

    // Submit the form
    const form = document.getElementById("edit-form");
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    await flushPromises();

    // Verify the PUT request was made with collected xh-model values
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [putUrl, putOpts] = global.fetch.mock.calls[1];
    expect(putUrl).toBe("/api/user");
    expect(putOpts.method).toBe("PUT");

    const putBody = JSON.parse(putOpts.body);
    expect(putBody.name).toBe("Bob");
    expect(putBody.email).toBe("bob@example.com");
  });

  test("xh-model checkbox state is sent as boolean in PUT request", async () => {
    // First call returns data, second receives the update
    let callCount = 0;
    global.fetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(JSON.stringify({ active: true, newsletter: false }))
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(JSON.stringify({ success: true }))
      });
    });

    document.body.innerHTML = `
      <div id="settings" xh-get="/api/settings" xh-trigger="load">
        <template>
          <form id="settings-form" xh-put="/api/settings" xh-trigger="submit">
            <input type="checkbox" xh-model="active" />
            <input type="checkbox" xh-model="newsletter" />
            <template><span class="result">Saved!</span></template>
          </form>
        </template>
      </div>
    `;

    xhtmlx.process(document.body);
    await flushPromises();

    // Verify pre-fill
    const activeCheckbox = document.querySelector('[xh-model="active"]');
    const newsletterCheckbox = document.querySelector('[xh-model="newsletter"]');
    expect(activeCheckbox.checked).toBe(true);
    expect(newsletterCheckbox.checked).toBe(false);

    // Toggle the checkboxes
    activeCheckbox.checked = false;
    newsletterCheckbox.checked = true;

    // Submit
    const form = document.getElementById("settings-form");
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    await flushPromises();

    const [, putOpts] = global.fetch.mock.calls[1];
    const putBody = JSON.parse(putOpts.body);
    expect(putBody.active).toBe(false);
    expect(putBody.newsletter).toBe(true);
  });

  test("full flow: GET -> pre-fill -> edit -> PUT with collected values", async () => {
    let callCount = 0;
    global.fetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // GET returns existing user data
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          text: () => Promise.resolve(JSON.stringify({
            name: "Alice",
            email: "alice@example.com",
            active: true,
            role: "viewer"
          }))
        });
      }
      // PUT response
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(JSON.stringify({ success: true }))
      });
    });

    document.body.innerHTML = `
      <div id="user-edit" xh-get="/api/user/1" xh-trigger="load">
        <template>
          <form id="user-form" xh-put="/api/user/1" xh-trigger="submit">
            <input type="text" xh-model="name" />
            <input type="email" xh-model="email" />
            <input type="checkbox" xh-model="active" />
            <select xh-model="role">
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <template><span class="result">Saved</span></template>
          </form>
        </template>
      </div>
    `;

    // Step 1: Process triggers GET request
    xhtmlx.process(document.body);
    await flushPromises();

    // Step 2: Verify pre-fill from GET response
    const nameInput = document.querySelector('[xh-model="name"]');
    const emailInput = document.querySelector('[xh-model="email"]');
    const activeCheckbox = document.querySelector('[xh-model="active"]');
    const roleSelect = document.querySelector('[xh-model="role"]');

    expect(nameInput.value).toBe("Alice");
    expect(emailInput.value).toBe("alice@example.com");
    expect(activeCheckbox.checked).toBe(true);
    expect(roleSelect.value).toBe("viewer");

    // Step 3: Simulate user editing
    nameInput.value = "Bob";
    emailInput.value = "bob@example.com";
    activeCheckbox.checked = false;
    roleSelect.value = "admin";

    // Step 4: Submit triggers PUT request
    const form = document.getElementById("user-form");
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    await flushPromises();

    // Step 5: Verify PUT request body contains edited values
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [putUrl, putOpts] = global.fetch.mock.calls[1];
    expect(putUrl).toBe("/api/user/1");
    expect(putOpts.method).toBe("PUT");

    const putBody = JSON.parse(putOpts.body);
    expect(putBody.name).toBe("Bob");
    expect(putBody.email).toBe("bob@example.com");
    expect(putBody.active).toBe(false);
    expect(putBody.role).toBe("admin");
  });
});
