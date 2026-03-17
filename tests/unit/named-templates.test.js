/**
 * @jest-environment jsdom
 */

const xhtmlx = require("../../xhtmlx.js");
const { templateCache, config, scanNamedTemplates } = xhtmlx._internals;

beforeEach(() => {
  document.body.innerHTML = "";
  templateCache.clear();
  config.templatePrefix = "";
});

afterEach(() => {
  config.templatePrefix = "";
});

describe("Named templates (<template xh-name>)", () => {
  test("scanNamedTemplates populates template cache from xh-name templates", () => {
    document.body.innerHTML = `
      <template xh-name="/templates/card.html">
        <div class="card"><span xh-text="name"></span></div>
      </template>
    `;

    scanNamedTemplates();

    expect(templateCache.has("/templates/card.html")).toBe(true);
  });

  test("cached template content matches the template innerHTML", async () => {
    document.body.innerHTML = `
      <template xh-name="/templates/item.html">
        <li xh-text="title"></li>
      </template>
    `;

    scanNamedTemplates();

    const html = await templateCache.get("/templates/item.html");
    expect(html).toContain("xh-text");
    expect(html).toContain("title");
  });

  test("multiple named templates are all cached", () => {
    document.body.innerHTML = `
      <template xh-name="/templates/a.html"><div>A</div></template>
      <template xh-name="/templates/b.html"><div>B</div></template>
      <template xh-name="/templates/c.html"><div>C</div></template>
    `;

    scanNamedTemplates();

    expect(templateCache.has("/templates/a.html")).toBe(true);
    expect(templateCache.has("/templates/b.html")).toBe(true);
    expect(templateCache.has("/templates/c.html")).toBe(true);
  });

  test("templates without xh-name are ignored", () => {
    document.body.innerHTML = `
      <template xh-name="/templates/named.html"><div>Named</div></template>
      <template><div>Unnamed</div></template>
    `;

    scanNamedTemplates();

    expect(templateCache.size).toBe(1);
  });

  test("templatePrefix is prepended to cache key", () => {
    config.templatePrefix = "/ui/v2";

    document.body.innerHTML = `
      <template xh-name="/templates/card.html"><div>Card</div></template>
    `;

    scanNamedTemplates();

    expect(templateCache.has("/ui/v2/templates/card.html")).toBe(true);
    expect(templateCache.has("/templates/card.html")).toBe(false);
  });

  test("named template takes priority over fetch", async () => {
    global.fetch = jest.fn();

    document.body.innerHTML = `
      <template xh-name="/templates/card.html">
        <span class="from-inline" xh-text="name"></span>
      </template>
    `;

    scanNamedTemplates();

    // Fetch the template — should resolve from cache, not call fetch
    const { fetchTemplate } = xhtmlx._internals;
    const html = await fetchTemplate("/templates/card.html");

    expect(html).toContain("from-inline");
    expect(global.fetch).not.toHaveBeenCalled();

    delete global.fetch;
  });

  test("missing template still falls back to fetch", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      text: () => Promise.resolve("<span>fetched</span>")
    });

    document.body.innerHTML = `
      <template xh-name="/templates/cached.html"><span>cached</span></template>
    `;

    scanNamedTemplates();

    const { fetchTemplate } = xhtmlx._internals;
    const html = await fetchTemplate("/templates/not-cached.html");

    expect(html).toContain("fetched");
    expect(global.fetch).toHaveBeenCalled();

    delete global.fetch;
  });

  test("empty xh-name attribute is ignored", () => {
    document.body.innerHTML = `
      <template xh-name=""><div>Empty</div></template>
      <template xh-name="/templates/real.html"><div>Real</div></template>
    `;

    scanNamedTemplates();

    expect(templateCache.size).toBe(1);
  });

  test("scanNamedTemplates is idempotent", async () => {
    document.body.innerHTML = `
      <template xh-name="/templates/card.html"><div>V1</div></template>
    `;

    scanNamedTemplates();
    scanNamedTemplates(); // Second call

    const html = await templateCache.get("/templates/card.html");
    expect(html).toContain("V1");
  });

  test("scanNamedTemplates is exposed on public API", () => {
    expect(typeof xhtmlx.scanNamedTemplates).toBe("function");
  });
});
