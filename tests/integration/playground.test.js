/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");

describe("Playground", () => {
  let html;

  beforeAll(() => {
    html = fs.readFileSync(
      path.join(__dirname, "../../docs/playground/index.html"),
      "utf-8"
    );
  });

  test("playground HTML file exists and is non-empty", () => {
    expect(html.length).toBeGreaterThan(1000);
  });

  test("contains the example selector dropdown", () => {
    expect(html).toContain('id="exampleSelect"');
  });

  test("contains all 8 preloaded examples", () => {
    expect(html).toContain('"basic-get"');
    expect(html).toContain('"crud-form"');
    expect(html).toContain('"nested-templates"');
    expect(html).toContain('"search-debounce"');
    expect(html).toContain('"conditionals"');
    expect(html).toContain('"error-handling"');
    expect(html).toContain('"polling"');
    expect(html).toContain('"model-reactivity"');
  });

  test("contains the code editor textarea", () => {
    expect(html).toContain('id="codeEditor"');
  });

  test("contains the preview iframe", () => {
    expect(html).toContain('id="previewIframe"');
  });

  test("contains the mock API editor", () => {
    expect(html).toContain('id="mockEditor"');
  });

  test("loads xhtmlx.js in preview", () => {
    expect(html).toContain("xhtmlx.js");
  });

  test("contains run button", () => {
    expect(html).toContain('id="btnRun"');
  });

  test("contains share button", () => {
    expect(html).toContain('id="btnShare"');
  });

  test("contains theme toggle", () => {
    expect(html).toContain('id="btnTheme"');
  });

  test("contains the loadExample function", () => {
    expect(html).toContain("function loadExample");
  });

  test("contains the runPreview function", () => {
    expect(html).toContain("function runPreview");
  });

  test("contains the buildMockScript function", () => {
    expect(html).toContain("function buildMockScript");
  });

  test("example selector has change event listener", () => {
    expect(html).toContain('exampleSelect.addEventListener("change"');
  });

  test("service worker file exists", () => {
    const sw = fs.readFileSync(
      path.join(__dirname, "../../docs/playground/sw.js"),
      "utf-8"
    );
    expect(sw.length).toBeGreaterThan(100);
    expect(sw).toContain("addEventListener");
    expect(sw).toContain("/api/");
  });

  test("mock API routes include all default endpoints", () => {
    expect(html).toContain("GET /api/users");
    expect(html).toContain("POST /api/users");
    expect(html).toContain("GET /api/posts");
    expect(html).toContain("GET /api/todos");
  });

  test("back link to main site exists", () => {
    expect(html).toMatch(/href=["']\.\.\/["']/);
  });
});
