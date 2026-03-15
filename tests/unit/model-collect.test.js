/**
 * @jest-environment jsdom
 */

const xhtmlx = require('../../xhtmlx.js');
const { DataContext, buildRequestBody } = xhtmlx._internals;

describe('xh-model collection in buildRequestBody (Option A)', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('collects xh-model text input values', () => {
    it('collects value from a text input with xh-model', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.setAttribute('xh-model', 'username');
      input.value = 'Alice';
      form.appendChild(input);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.username).toBe('Alice');
    });

    it('collects value from multiple text inputs', () => {
      const form = document.createElement('form');
      const input1 = document.createElement('input');
      input1.setAttribute('type', 'text');
      input1.setAttribute('xh-model', 'first');
      input1.value = 'John';
      const input2 = document.createElement('input');
      input2.setAttribute('type', 'text');
      input2.setAttribute('xh-model', 'last');
      input2.value = 'Doe';
      form.appendChild(input1);
      form.appendChild(input2);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.first).toBe('John');
      expect(body.last).toBe('Doe');
    });

    it('collects value from email input', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.setAttribute('type', 'email');
      input.setAttribute('xh-model', 'email');
      input.value = 'test@example.com';
      form.appendChild(input);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.email).toBe('test@example.com');
    });

    it('collects value from number input as string', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.setAttribute('type', 'number');
      input.setAttribute('xh-model', 'age');
      input.value = '25';
      form.appendChild(input);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.age).toBe('25');
    });
  });

  describe('collects checkbox boolean values', () => {
    it('collects true when checkbox is checked', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.setAttribute('type', 'checkbox');
      input.setAttribute('xh-model', 'active');
      input.checked = true;
      form.appendChild(input);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.active).toBe(true);
    });

    it('collects false when checkbox is unchecked', () => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.setAttribute('type', 'checkbox');
      input.setAttribute('xh-model', 'active');
      input.checked = false;
      form.appendChild(input);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.active).toBe(false);
    });
  });

  describe('collects radio values', () => {
    it('collects value of checked radio button', () => {
      const form = document.createElement('form');
      const radio1 = document.createElement('input');
      radio1.setAttribute('type', 'radio');
      radio1.setAttribute('xh-model', 'color');
      radio1.value = 'red';
      radio1.checked = false;
      const radio2 = document.createElement('input');
      radio2.setAttribute('type', 'radio');
      radio2.setAttribute('xh-model', 'color');
      radio2.value = 'blue';
      radio2.checked = true;
      form.appendChild(radio1);
      form.appendChild(radio2);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.color).toBe('blue');
    });

    it('does not collect unchecked radio button', () => {
      const form = document.createElement('form');
      const radio = document.createElement('input');
      radio.setAttribute('type', 'radio');
      radio.setAttribute('xh-model', 'choice');
      radio.value = 'a';
      radio.checked = false;
      form.appendChild(radio);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      // Should not be present since it is unchecked
      expect(body.choice).toBeUndefined();
    });
  });

  describe('collects select values', () => {
    it('collects selected option value from select', () => {
      const form = document.createElement('form');
      const select = document.createElement('select');
      select.setAttribute('xh-model', 'country');
      select.innerHTML = '<option value="us">US</option><option value="uk" selected>UK</option>';
      form.appendChild(select);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.country).toBe('uk');
    });
  });

  describe('collects textarea values', () => {
    it('collects value from textarea', () => {
      const form = document.createElement('form');
      const textarea = document.createElement('textarea');
      textarea.setAttribute('xh-model', 'bio');
      textarea.value = 'Hello world';
      form.appendChild(textarea);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.bio).toBe('Hello world');
    });
  });

  describe('xh-model values override form fields with same name', () => {
    it('xh-model value takes priority over named form field', () => {
      const form = document.createElement('form');
      const namedInput = document.createElement('input');
      namedInput.name = 'username';
      namedInput.value = 'from-form';
      const modelInput = document.createElement('input');
      modelInput.setAttribute('type', 'text');
      modelInput.setAttribute('xh-model', 'username');
      modelInput.value = 'from-model';
      form.appendChild(namedInput);
      form.appendChild(modelInput);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.username).toBe('from-model');
    });
  });

  describe('xh-model values override xh-vals with same name', () => {
    it('xh-model value takes priority over xh-vals', () => {
      const form = document.createElement('form');
      form.setAttribute('xh-vals', '{"status": "from-vals"}');
      const modelInput = document.createElement('input');
      modelInput.setAttribute('type', 'text');
      modelInput.setAttribute('xh-model', 'status');
      modelInput.value = 'from-model';
      form.appendChild(modelInput);
      container.appendChild(form);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.status).toBe('from-model');
    });
  });

  describe('collection scopes to nearest REST verb ancestor', () => {
    it('scopes collection to nearest REST verb ancestor when no form', () => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('xh-put', '/api/user');
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.setAttribute('xh-model', 'name');
      input.value = 'Alice';
      wrapper.appendChild(input);
      container.appendChild(wrapper);

      // When buildRequestBody is called with the wrapper as el
      // (no form), it scopes to the REST verb element
      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(wrapper, ctx));

      expect(body.name).toBe('Alice');
    });

    it('does not collect xh-model inputs outside the scope', () => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('xh-put', '/api/user');
      const insideInput = document.createElement('input');
      insideInput.setAttribute('type', 'text');
      insideInput.setAttribute('xh-model', 'inside');
      insideInput.value = 'in-scope';
      wrapper.appendChild(insideInput);
      container.appendChild(wrapper);

      const outsideInput = document.createElement('input');
      outsideInput.setAttribute('type', 'text');
      outsideInput.setAttribute('xh-model', 'outside');
      outsideInput.value = 'out-of-scope';
      container.appendChild(outsideInput);

      const ctx = new DataContext({});
      const body = JSON.parse(buildRequestBody(wrapper, ctx));

      expect(body.inside).toBe('in-scope');
      expect(body.outside).toBeUndefined();
    });

    it('prefers form scope over REST verb ancestor', () => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('xh-post', '/api/submit');
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.setAttribute('xh-model', 'field');
      input.value = 'value';
      form.appendChild(input);
      wrapper.appendChild(form);

      const outsideInput = document.createElement('input');
      outsideInput.setAttribute('type', 'text');
      outsideInput.setAttribute('xh-model', 'other');
      outsideInput.value = 'other-value';
      wrapper.appendChild(outsideInput);
      container.appendChild(wrapper);

      // Button inside the form triggers the request
      const button = document.createElement('button');
      button.setAttribute('xh-post', '/api/submit');
      form.appendChild(button);

      const ctx = new DataContext({});
      // buildRequestBody with el = form will scope to form
      const body = JSON.parse(buildRequestBody(form, ctx));

      expect(body.field).toBe('value');
      // outsideInput is outside the form, so not collected
      expect(body.other).toBeUndefined();
    });
  });
});
