/**
 * @jest-environment jsdom
 */

const xhtmlx = require("../../xhtmlx.js");
const { applyI18n, i18n } = xhtmlx._internals;

describe("i18n", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    // Reset i18n state
    i18n._locales = {};
    i18n._locale = null;
    i18n._fallback = "en";
  });

  afterEach(() => {
    document.body.removeChild(container);
    i18n._locales = {};
    i18n._locale = null;
  });

  describe("i18n.load", () => {
    it("adds translations for a locale", () => {
      i18n.load("en", { greeting: "Hello", farewell: "Goodbye" });

      expect(i18n._locales.en).toBeDefined();
      expect(i18n._locales.en.greeting).toBe("Hello");
      expect(i18n._locales.en.farewell).toBe("Goodbye");
    });

    it("merges translations when called multiple times for the same locale", () => {
      i18n.load("en", { greeting: "Hello" });
      i18n.load("en", { farewell: "Goodbye" });

      expect(i18n._locales.en.greeting).toBe("Hello");
      expect(i18n._locales.en.farewell).toBe("Goodbye");
    });

    it("overwrites existing keys when loading again", () => {
      i18n.load("en", { greeting: "Hello" });
      i18n.load("en", { greeting: "Hi" });

      expect(i18n._locales.en.greeting).toBe("Hi");
    });
  });

  describe("i18n.t", () => {
    it("returns translated string", () => {
      i18n.load("en", { greeting: "Hello" });
      expect(i18n.t("greeting")).toBe("Hello");
    });

    it("interpolates variables with {name} syntax", () => {
      i18n.load("en", { welcome: "Hello, {name}!" });
      expect(i18n.t("welcome", { name: "Alice" })).toBe("Hello, Alice!");
    });

    it("interpolates multiple variables", () => {
      i18n.load("en", { intro: "{first} {last} is {age} years old" });
      expect(i18n.t("intro", { first: "John", last: "Doe", age: "30" })).toBe(
        "John Doe is 30 years old"
      );
    });

    it("falls back to fallback locale when current locale is missing the key", () => {
      i18n.load("en", { greeting: "Hello" });
      i18n.load("fr", { farewell: "Au revoir" });
      i18n._locale = "fr";

      // "greeting" is not in fr, should fall back to en
      expect(i18n.t("greeting")).toBe("Hello");
    });

    it("returns key when no translation is found in any locale", () => {
      i18n.load("en", { greeting: "Hello" });
      expect(i18n.t("nonexistent.key")).toBe("nonexistent.key");
    });

    it("prefers current locale over fallback", () => {
      i18n.load("en", { greeting: "Hello" });
      i18n.load("fr", { greeting: "Bonjour" });
      i18n._locale = "fr";

      expect(i18n.t("greeting")).toBe("Bonjour");
    });

    it("handles numeric translation values", () => {
      i18n.load("en", { count: 42 });
      expect(i18n.t("count")).toBe("42");
    });
  });

  describe("i18n.locale", () => {
    it("returns fallback when no locale is set", () => {
      expect(i18n.locale).toBe("en");
    });

    it("returns the set locale", () => {
      i18n._locale = "fr";
      expect(i18n.locale).toBe("fr");
    });

    it("re-renders xh-i18n elements when locale is set", () => {
      i18n.load("en", { greeting: "Hello" });
      i18n.load("fr", { greeting: "Bonjour" });

      const span = document.createElement("span");
      span.setAttribute("xh-i18n", "greeting");
      container.appendChild(span);

      // Apply initial locale
      applyI18n(document.body);
      expect(span.textContent).toBe("Hello");

      // Switch locale
      i18n.locale = "fr";
      expect(span.textContent).toBe("Bonjour");
    });

    it("fires xh:localeChanged event on locale switch", () => {
      let eventDetail = null;
      document.body.addEventListener("xh:localeChanged", function (e) {
        eventDetail = e.detail;
      });

      i18n.locale = "de";

      expect(eventDetail).not.toBeNull();
      expect(eventDetail.locale).toBe("de");
    });
  });

  describe("applyI18n", () => {
    it("sets textContent from translation for xh-i18n elements", () => {
      i18n.load("en", { title: "My App" });

      const h1 = document.createElement("h1");
      h1.setAttribute("xh-i18n", "title");
      container.appendChild(h1);

      applyI18n(container);
      expect(h1.textContent).toBe("My App");
    });

    it("sets title attribute via xh-i18n-title", () => {
      i18n.load("en", { tooltip: "Click here" });

      const button = document.createElement("button");
      button.setAttribute("xh-i18n-title", "tooltip");
      container.appendChild(button);

      applyI18n(container);
      expect(button.getAttribute("title")).toBe("Click here");
    });

    it("sets placeholder attribute via xh-i18n-placeholder", () => {
      i18n.load("en", { search_hint: "Search..." });

      const input = document.createElement("input");
      input.setAttribute("xh-i18n-placeholder", "search_hint");
      container.appendChild(input);

      applyI18n(container);
      expect(input.getAttribute("placeholder")).toBe("Search...");
    });

    it("passes variables from xh-i18n-vars for interpolation", () => {
      i18n.load("en", { welcome: "Hello, {name}!" });

      const span = document.createElement("span");
      span.setAttribute("xh-i18n", "welcome");
      span.setAttribute("xh-i18n-vars", '{"name": "Alice"}');
      container.appendChild(span);

      applyI18n(container);
      expect(span.textContent).toBe("Hello, Alice!");
    });

    it("handles invalid JSON in xh-i18n-vars gracefully", () => {
      i18n.load("en", { msg: "Hello {name}" });

      const span = document.createElement("span");
      span.setAttribute("xh-i18n", "msg");
      span.setAttribute("xh-i18n-vars", "invalid json");
      container.appendChild(span);

      // Should not throw, just pass null vars
      applyI18n(container);
      expect(span.textContent).toBe("Hello {name}");
    });

    it("handles multiple xh-i18n elements at once", () => {
      i18n.load("en", { title: "Title", subtitle: "Subtitle" });

      const h1 = document.createElement("h1");
      h1.setAttribute("xh-i18n", "title");
      const h2 = document.createElement("h2");
      h2.setAttribute("xh-i18n", "subtitle");
      container.appendChild(h1);
      container.appendChild(h2);

      applyI18n(container);
      expect(h1.textContent).toBe("Title");
      expect(h2.textContent).toBe("Subtitle");
    });

    it("does not interfere with xh-i18n-vars attribute itself", () => {
      // xh-i18n-vars should not be treated as a target attribute
      i18n.load("en", { msg: "Hi {name}" });

      const span = document.createElement("span");
      span.setAttribute("xh-i18n", "msg");
      span.setAttribute("xh-i18n-vars", '{"name": "Bob"}');
      container.appendChild(span);

      applyI18n(container);
      // "vars" should not be set as an attribute on the span
      expect(span.getAttribute("vars")).toBeNull();
      expect(span.textContent).toBe("Hi Bob");
    });
  });

  describe("multiple locales", () => {
    it("can load and switch between multiple locales", () => {
      i18n.load("en", { greeting: "Hello", farewell: "Goodbye" });
      i18n.load("fr", { greeting: "Bonjour", farewell: "Au revoir" });
      i18n.load("de", { greeting: "Hallo", farewell: "Auf Wiedersehen" });

      const span = document.createElement("span");
      span.setAttribute("xh-i18n", "greeting");
      container.appendChild(span);

      i18n._locale = "en";
      applyI18n(container);
      expect(span.textContent).toBe("Hello");

      i18n._locale = "fr";
      applyI18n(container);
      expect(span.textContent).toBe("Bonjour");

      i18n._locale = "de";
      applyI18n(container);
      expect(span.textContent).toBe("Hallo");
    });
  });

  describe("public API", () => {
    it("exposes i18n on the xhtmlx object", () => {
      expect(xhtmlx.i18n).toBeDefined();
      expect(typeof xhtmlx.i18n.load).toBe("function");
      expect(typeof xhtmlx.i18n.t).toBe("function");
    });
  });
});
