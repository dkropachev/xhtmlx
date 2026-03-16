/**
 * @jest-environment jsdom
 */

const xhtmlx = require("../../xhtmlx.js");
const { validateElement } = xhtmlx._internals;

describe("validateElement", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("required rule", () => {
    it("blocks when field is empty", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.value = "";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(false);
    });

    it("blocks when field is whitespace only", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.value = "   ";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(false);
    });

    it("passes when field has a value", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.value = "alice";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(true);
    });
  });

  describe("pattern rule", () => {
    it("blocks when value does not match pattern", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "email");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-pattern", "^[^@]+@[^@]+$");
      input.value = "not-an-email";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(false);
    });

    it("passes when value matches pattern", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "email");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-pattern", "^[^@]+@[^@]+$");
      input.value = "user@example.com";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(true);
    });

    it("skips pattern check when value is empty", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "email");
      input.setAttribute("xh-validate", "none");
      input.setAttribute("xh-validate-pattern", "^[^@]+@[^@]+$");
      input.value = "";
      form.appendChild(input);
      container.appendChild(form);

      // Pattern is only checked when value is non-empty
      const result = validateElement(form);
      expect(result).toBe(true);
    });
  });

  describe("min/max rules", () => {
    it("blocks when value is below min", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "age");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-min", "18");
      input.value = "10";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(false);
    });

    it("blocks when value is above max", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "age");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-max", "100");
      input.value = "150";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(false);
    });

    it("passes when value is within min/max range", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "age");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-min", "18");
      input.setAttribute("xh-validate-max", "100");
      input.value = "25";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(true);
    });
  });

  describe("minlength/maxlength rules", () => {
    it("blocks when value is shorter than minlength", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "password");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-minlength", "8");
      input.value = "abc";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(false);
    });

    it("blocks when value is longer than maxlength", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "code");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-maxlength", "5");
      input.value = "abcdefgh";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(false);
    });

    it("passes when value length is within bounds", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "password");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-minlength", "4");
      input.setAttribute("xh-validate-maxlength", "20");
      input.value = "securepass";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(true);
    });
  });

  describe("xh-validate-class", () => {
    it("adds custom error class on invalid field", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-class", "my-error");
      input.value = "";
      form.appendChild(input);
      container.appendChild(form);

      validateElement(form);
      expect(input.classList.contains("my-error")).toBe(true);
    });

    it("adds default xh-invalid class when no custom class specified", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.value = "";
      form.appendChild(input);
      container.appendChild(form);

      validateElement(form);
      expect(input.classList.contains("xh-invalid")).toBe(true);
    });

    it("removes error class when field becomes valid", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-class", "my-error");
      input.value = "";
      form.appendChild(input);
      container.appendChild(form);

      // First validation: invalid
      validateElement(form);
      expect(input.classList.contains("my-error")).toBe(true);

      // Fix the value and re-validate
      input.value = "alice";
      validateElement(form);
      expect(input.classList.contains("my-error")).toBe(false);
    });
  });

  describe("xh-validate-target", () => {
    it("shows error message in the target element", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-target", "#username-error");
      input.value = "";
      form.appendChild(input);

      const errorSpan = document.createElement("span");
      errorSpan.id = "username-error";
      form.appendChild(errorSpan);
      container.appendChild(form);

      validateElement(form);
      expect(errorSpan.textContent).toBe("username is required");
    });

    it("clears error message when field becomes valid", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-target", "#username-error");
      input.value = "";
      form.appendChild(input);

      const errorSpan = document.createElement("span");
      errorSpan.id = "username-error";
      form.appendChild(errorSpan);
      container.appendChild(form);

      // First validation: show error
      validateElement(form);
      expect(errorSpan.textContent).toBe("username is required");

      // Fix and re-validate: clear error
      input.value = "alice";
      validateElement(form);
      expect(errorSpan.textContent).toBe("");
    });
  });

  describe("xh-validate-message", () => {
    it("uses custom message instead of default", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-message", "Please enter your username");
      input.setAttribute("xh-validate-target", "#err");
      input.value = "";
      form.appendChild(input);

      const errorSpan = document.createElement("span");
      errorSpan.id = "err";
      form.appendChild(errorSpan);
      container.appendChild(form);

      validateElement(form);
      expect(errorSpan.textContent).toBe("Please enter your username");
    });
  });

  describe("xh:validationError event", () => {
    it("fires with error details when validation fails", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.value = "";
      form.appendChild(input);
      container.appendChild(form);

      let eventDetail = null;
      form.addEventListener("xh:validationError", function(e) {
        eventDetail = e.detail;
      });

      validateElement(form);

      expect(eventDetail).not.toBeNull();
      expect(eventDetail.errors).toHaveLength(1);
      expect(eventDetail.errors[0].field).toBe("username");
      expect(eventDetail.errors[0].message).toBe("username is required");
      expect(eventDetail.errors[0].element).toBe(input);
    });

    it("does not fire when all fields are valid", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "username");
      input.setAttribute("xh-validate", "required");
      input.value = "alice";
      form.appendChild(input);
      container.appendChild(form);

      let eventFired = false;
      form.addEventListener("xh:validationError", function() {
        eventFired = true;
      });

      validateElement(form);
      expect(eventFired).toBe(false);
    });
  });

  describe("multiple validations", () => {
    it("validates multiple rules on one field", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "password");
      input.setAttribute("xh-validate", "required");
      input.setAttribute("xh-validate-minlength", "8");
      input.value = "abc";
      form.appendChild(input);
      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(false);
      expect(input.classList.contains("xh-invalid")).toBe(true);
    });

    it("validates multiple fields at once", () => {
      const form = document.createElement("form");

      const input1 = document.createElement("input");
      input1.setAttribute("name", "first");
      input1.setAttribute("xh-validate", "required");
      input1.value = "";
      form.appendChild(input1);

      const input2 = document.createElement("input");
      input2.setAttribute("name", "last");
      input2.setAttribute("xh-validate", "required");
      input2.value = "";
      form.appendChild(input2);

      container.appendChild(form);

      let eventDetail = null;
      form.addEventListener("xh:validationError", function(e) {
        eventDetail = e.detail;
      });

      const result = validateElement(form);
      expect(result).toBe(false);
      expect(eventDetail.errors).toHaveLength(2);
      expect(input1.classList.contains("xh-invalid")).toBe(true);
      expect(input2.classList.contains("xh-invalid")).toBe(true);
    });

    it("returns true when all fields are valid", () => {
      const form = document.createElement("form");

      const input1 = document.createElement("input");
      input1.setAttribute("name", "first");
      input1.setAttribute("xh-validate", "required");
      input1.value = "John";
      form.appendChild(input1);

      const input2 = document.createElement("input");
      input2.setAttribute("name", "last");
      input2.setAttribute("xh-validate", "required");
      input2.value = "Doe";
      form.appendChild(input2);

      container.appendChild(form);

      const result = validateElement(form);
      expect(result).toBe(true);
    });
  });

  describe("scope handling", () => {
    it("scopes to form when element is inside a form", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("name", "field1");
      input.setAttribute("xh-validate", "required");
      input.value = "";
      form.appendChild(input);

      const button = document.createElement("button");
      form.appendChild(button);
      container.appendChild(form);

      const result = validateElement(button);
      expect(result).toBe(false);
    });

    it("scopes to element itself when not in a form", () => {
      const div = document.createElement("div");
      const input = document.createElement("input");
      input.setAttribute("name", "field1");
      input.setAttribute("xh-validate", "required");
      input.value = "";
      div.appendChild(input);
      container.appendChild(div);

      const result = validateElement(div);
      expect(result).toBe(false);
    });

    it("uses xh-model as field name when no name attribute", () => {
      const form = document.createElement("form");
      const input = document.createElement("input");
      input.setAttribute("xh-model", "user.name");
      input.setAttribute("xh-validate", "required");
      input.value = "";
      form.appendChild(input);
      container.appendChild(form);

      let eventDetail = null;
      form.addEventListener("xh:validationError", function(e) {
        eventDetail = e.detail;
      });

      validateElement(form);
      expect(eventDetail.errors[0].field).toBe("user.name");
    });
  });
});
