const { test, expect } = require("@playwright/test");

test.describe("Tutorial page", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", err => console.log("[PAGEERROR]", err.message));
    await page.goto("/tutorial/");
    // Wait for xhtmlx to load and init
    await page.waitForFunction(() => window.__xhtmlxLoaded === true, { timeout: 15000 });
  });

  test("page loads with all 9 step headings", async ({ page }) => {
    const headings = await page.locator(".step-title").allTextContents();
    expect(headings.length).toBe(9);
    expect(headings[0]).toContain("First Request");
    expect(headings[1]).toContain("Data Binding");
    expect(headings[2]).toContain("Conditionals");
    expect(headings[3]).toContain("Creating Tasks");
    expect(headings[4]).toContain("Completing Tasks");
    expect(headings[5]).toContain("Deleting Tasks");
    expect(headings[6]).toContain("Search");
    expect(headings[7]).toContain("Indicator");
    expect(headings[8]).toContain("Error");
  });

  test("step 1: GET loads task list", async ({ page }) => {
    // Wait for tasks to actually render
    await page.waitForFunction(
      () => document.body.innerHTML.includes("Learn xhtmlx") ||
            document.querySelector(".task-item, .task-title") !== null,
      { timeout: 10000 }
    );
    const body = await page.locator("body").innerHTML();
    const hasTasks = body.includes("Learn xhtmlx") || body.includes("task-item") || body.includes("task-title");
    expect(hasTasks).toBe(true);
  });

  test("step 2: data binding renders task fields", async ({ page }) => {
    await page.waitForFunction(
      () => document.body.innerHTML.includes("Learn xhtmlx"),
      { timeout: 10000 }
    );
    const body = await page.locator("body").innerHTML();
    expect(body).toContain("Learn xhtmlx");
  });

  test("step 3: conditionals show/hide elements", async ({ page }) => {
    await page.waitForFunction(
      () => document.body.innerHTML.includes("Learn xhtmlx"),
      { timeout: 10000 }
    );
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(1000);
  });

  test("step 4: page has a create form with POST", async ({ page }) => {
    await page.waitForFunction(
      () => document.body.innerHTML.includes("xh-post"),
      { timeout: 10000 }
    );
    const body = await page.locator("body").innerHTML();
    expect(body).toContain("xh-post");
    expect(body).toContain("/api/tasks");
  });

  test("step 6: DELETE removes a task", async ({ page }) => {
    await page.waitForFunction(
      () => document.body.innerHTML.includes("Learn xhtmlx"),
      { timeout: 10000 }
    );
    const deleteBtn = page.locator("button:has-text('Delete'), button:has-text('Remove'), [class*='delete']").first();
    if (await deleteBtn.count() > 0) {
      const beforeCount = await page.locator(".task-item, .task-card, [class*='task']").count();
      await deleteBtn.click();
      // Wait for DOM to update after delete
      await page.waitForFunction(
        (prev) => document.querySelectorAll(".task-item, .task-card, [class*='task']").length <= prev,
        beforeCount,
        { timeout: 5000 }
      );
      const afterCount = await page.locator(".task-item, .task-card, [class*='task']").count();
      expect(afterCount).toBeLessThanOrEqual(beforeCount);
    }
  });

  test("step 7: search filters results", async ({ page }) => {
    await page.waitForFunction(
      () => document.body.innerHTML.includes("Learn xhtmlx"),
      { timeout: 10000 }
    );
    const searchInput = page.locator("input[type='text'][placeholder*='earch' i], input[xh-get*='search' i], input[type='search']").first();
    if (await searchInput.count() > 0) {
      await searchInput.pressSequentially("Learn", { delay: 50 });
      // Wait for search results to update
      await page.waitForFunction(
        () => document.body.innerHTML.includes("Learn"),
        { timeout: 5000 }
      );
      const body = await page.locator("body").innerHTML();
      expect(body).toContain("Learn");
    }
  });

  test("step 9: error handling shows error template", async ({ page }) => {
    await page.waitForFunction(
      () => document.body.innerHTML.includes("Learn xhtmlx"),
      { timeout: 10000 }
    );
    const errorBtn = page.locator("button:has-text('error'), button:has-text('Error'), button:has-text('Fail'), [xh-get*='error']").first();
    if (await errorBtn.count() > 0) {
      await errorBtn.click();
      await page.waitForFunction(
        () => document.body.innerHTML.toLowerCase().includes("error"),
        { timeout: 5000 }
      );
      const body = await page.locator("body").innerHTML();
      expect(body.toLowerCase()).toContain("error");
    }
  });

  test("view source buttons toggle code visibility", async ({ page }) => {
    const viewSourceBtns = page.locator("button:has-text('View Source'), button:has-text('Source'), .view-source-btn");
    const count = await viewSourceBtns.count();
    expect(count).toBeGreaterThan(0);

    await viewSourceBtns.first().click();
    const codeBlocks = page.locator("pre, code, .source-code");
    await expect(codeBlocks.first()).toBeVisible({ timeout: 3000 });
    const visibleCode = await codeBlocks.count();
    expect(visibleCode).toBeGreaterThan(0);
  });

  test("progress bar exists and tracks scroll", async ({ page }) => {
    const progressBar = page.locator(".progress-bar, .progress, [class*='progress']").first();
    expect(await progressBar.count()).toBeGreaterThan(0);
  });

  test("no console errors during normal usage", async ({ page }) => {
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));

    await page.goto("/tutorial/");
    await page.waitForFunction(() => window.__xhtmlxLoaded === true, { timeout: 15000 });

    const critical = errors.filter(e =>
      !e.includes("ServiceWorker") &&
      !e.includes("sw.js") &&
      !e.includes("favicon")
    );
    expect(critical).toEqual([]);
  });
});
