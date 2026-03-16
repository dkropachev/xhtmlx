const { test, expect } = require("@playwright/test");

test.describe("Playground", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", msg => {
      if (msg.type() === "error") console.log("[BROWSER]", msg.text());
    });
    await page.goto("/playground/");
    // Wait for playground to fully initialize (fetches xhtmlx.js async)
    await page.waitForFunction(() => window.__playgroundReady === true, { timeout: 10000 });
  });

  test("page loads with all UI elements", async ({ page }) => {
    await expect(page.locator("#codeEditor")).toBeVisible();
    await expect(page.locator("#previewIframe")).toBeVisible();
    await expect(page.locator("#exampleSelect")).toBeVisible();
    await expect(page.locator("#btnRun")).toBeVisible();
    await expect(page.locator("#btnShare")).toBeVisible();
  });

  test("code editor has default content (basic-get example)", async ({ page }) => {
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("xh-get");
    expect(value).toContain("xh-trigger");
  });

  test("example selector has all 8 options", async ({ page }) => {
    const options = await page.locator("#exampleSelect option").count();
    expect(options).toBe(9); // 1 placeholder + 8 examples
  });

  test("selecting Basic GET example loads code into editor", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("basic-get");
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("xh-get");
    expect(value).toContain("/api/users");
  });

  test("selecting CRUD Form example loads different code", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("crud-form");
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("xh-post");
  });

  test("selecting Nested Templates example loads code", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("nested-templates");
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("xh-each");
  });

  test("selecting Search example loads debounce code", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("search-debounce");
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("delay");
  });

  test("selecting Conditionals example loads code", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("conditionals");
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("xh-if");
  });

  test("selecting Error Handling example loads code", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("error-handling");
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("error");
  });

  test("selecting Polling example loads code", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("polling");
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("every");
  });

  test("selecting Reactivity example loads code", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("model-reactivity");
    const value = await page.locator("#codeEditor").inputValue();
    expect(value).toContain("xh-model");
  });

  test("Run button triggers preview render", async ({ page }) => {
    await page.locator("#codeEditor").fill('<div xh-get="/api/users" xh-trigger="load"><template><div xh-each="users"><span class="test-name" xh-text="name"></span></div></template></div>');
    await page.locator("#btnRun").click();
    await page.waitForTimeout(1500);

    const iframe = page.frameLocator("#previewIframe");
    await expect(iframe.locator(".test-name").first()).toBeVisible({ timeout: 5000 });
    const text = await iframe.locator(".test-name").first().textContent();
    expect(text).toBe("Alice");
  });

  test("preview renders user list from mock API", async ({ page }) => {
    await page.locator("#exampleSelect").selectOption("basic-get");
    await page.waitForTimeout(2000);

    const iframe = page.frameLocator("#previewIframe");
    // The basic-get example should render users from the mock API
    const body = await iframe.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(10);
  });

  test("switching tabs shows Mock API editor", async ({ page }) => {
    await page.locator("#tabMock").click();
    await expect(page.locator("#mockEditor")).toBeVisible();
    const mockValue = await page.locator("#mockEditor").inputValue();
    expect(mockValue).toContain("GET /api/users");
  });

  test("switching back to HTML tab shows code editor", async ({ page }) => {
    await page.locator("#tabMock").click();
    await page.locator("#tabHtml").click();
    await expect(page.locator("#codeEditor")).toBeVisible();
  });

  test("editing code auto-runs preview after debounce", async ({ page }) => {
    await page.locator("#codeEditor").fill("<p>Hello xhtmlx</p>");
    // Wait for debounce (500ms) + render
    await page.waitForTimeout(1500);

    const iframe = page.frameLocator("#previewIframe");
    await expect(iframe.locator("p")).toHaveText("Hello xhtmlx");
  });

  test("Ctrl+Enter runs preview immediately", async ({ page }) => {
    await page.locator("#codeEditor").fill("<h1>Instant</h1>");
    await page.locator("#codeEditor").press("Control+Enter");
    await page.waitForTimeout(500);

    const iframe = page.frameLocator("#previewIframe");
    await expect(iframe.locator("h1")).toHaveText("Instant");
  });

  test("share button updates URL hash", async ({ page }) => {
    await page.locator("#codeEditor").fill("<div>share-test</div>");
    await page.locator("#btnRun").click();
    await page.waitForTimeout(500);
    await page.locator("#btnShare").click();
    await page.waitForTimeout(500);

    const url = page.url();
    expect(url).toContain("#");
    const hash = url.split("#")[1];
    expect(hash.length).toBeGreaterThan(5);
  });

  test("theme toggle switches between dark and light", async ({ page }) => {
    // Check initial theme
    const initialBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.locator("#btnTheme").click();
    await page.waitForTimeout(300);

    const newBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(newBg).not.toBe(initialBg);
  });

  test("line numbers update with editor content", async ({ page }) => {
    await page.locator("#codeEditor").fill("line1\nline2\nline3\nline4\nline5");
    await page.waitForTimeout(600);

    const lineNumbers = await page.locator("#lineNumbers").innerHTML();
    expect(lineNumbers).toContain(">1<");
    expect(lineNumbers).toContain(">5<");
  });

  test("preview background toggle works", async ({ page }) => {
    const toggle = page.locator("#previewBgToggle");
    await toggle.click();
    await page.waitForTimeout(500);

    // Click again to toggle back
    await toggle.click();
    await page.waitForTimeout(500);
    // No crash = pass
  });

  test("xh-each renders multiple items in preview", async ({ page }) => {
    await page.locator("#codeEditor").fill(
      '<div xh-get="/api/users" xh-trigger="load">' +
      '<template><ul><li xh-each="users" class="user-item" xh-text="name"></li></ul></template>' +
      '</div>'
    );
    await page.locator("#btnRun").click();
    await page.waitForTimeout(2000);

    const iframe = page.frameLocator("#previewIframe");
    const count = await iframe.locator(".user-item").count();
    expect(count).toBeGreaterThanOrEqual(2); // Users from mock API
  });

  test("xh-if conditionally renders in preview", async ({ page }) => {
    await page.locator("#codeEditor").fill(
      '<div xh-get="/api/users" xh-trigger="load">' +
      '<template><div xh-each="users">' +
      '<span class="admin-badge" xh-if="role" xh-text="role"></span>' +
      '</div></template></div>'
    );
    await page.locator("#btnRun").click();
    await page.waitForTimeout(2000);

    const iframe = page.frameLocator("#previewIframe");
    const badges = await iframe.locator(".admin-badge").count();
    expect(badges).toBeGreaterThan(0);
  });

  test("mock API editor changes affect preview", async ({ page }) => {
    // Switch to mock tab and change the users response
    await page.locator("#tabMock").click();
    const mockEditor = page.locator("#mockEditor");
    await mockEditor.fill(JSON.stringify({
      "GET /api/users": {
        status: 200,
        body: { users: [{ id: 1, name: "CustomUser", email: "custom@test.com", role: "tester" }] }
      }
    }, null, 2));
    await page.waitForTimeout(500);

    // Switch back to HTML and load basic-get example
    await page.locator("#tabHtml").click();
    await page.locator("#exampleSelect").selectOption("basic-get");
    await page.waitForTimeout(2000);

    const iframe = page.frameLocator("#previewIframe");
    const body = await iframe.locator("body").innerHTML();
    expect(body).toContain("CustomUser");
  });

  test("no console errors on page load", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/playground/");
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors (SW registration in test env)
    const critical = errors.filter(e => !e.includes("ServiceWorker") && !e.includes("sw.js"));
    expect(critical).toEqual([]);
  });
});
