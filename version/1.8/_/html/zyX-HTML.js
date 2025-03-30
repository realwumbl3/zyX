import {
  placeholdTag,
  getPlaceholderID,
  innerHTML,
  placer,
  strPlaceholder,
  placeholderRegex,
  wrapInTemplate,
  trimTextNodes,
} from "./html.js";

const IDENTIFIER_KEY = "###";
const CONTENT_CONTEXT = "content";
const TAG_CONTEXT = "tag";
const UNQUOTED_VALUE_CONTEXT = "unquoted-value";
const QUOTED_VALUE_CONTEXT = "quoted-value";

import { processDynamicVarAttributes } from "./dynamicVariable.js";

export class ZyXHtml {
  #constructed = false;
  #dom;
  #markup;
  #data;
  #isTemplate;
  #proxscope = {};
  #mutable;
  #proxy;
  #raw;
  #tagData;

  processTagData() {
    const rawParts = this.#raw.slice(0, -1);
    let scanned = "";
    // Process each expression and track its context
    this.#data = this.#tagData.map((value, i) => {
      scanned += rawParts.shift();

      // We need to analyze the full string before the placeholder to determine context
      let context = CONTENT_CONTEXT; // Default - between tags
      let needsQuotes = false;

      // Check if we're in a tag name position by looking for < followed by optional whitespace
      if (/<\s*$/.test(scanned)) {
        context = TAG_CONTEXT;
      }
      // Check if we're in an attribute-value by looking for = pattern
      else if (/=\s*$/.test(scanned)) {
        // Attribute value without quotes
        needsQuotes = true;
        context = UNQUOTED_VALUE_CONTEXT;
      } else if (/=\s*["']\s*$/.test(scanned)) {
        // Attribute value with quotes
        needsQuotes = false;
        context = QUOTED_VALUE_CONTEXT;
      }
      // Check for closing tag name
      else if (/<\/\s*$/.test(scanned)) {
        context = TAG_CONTEXT;
      }

      const placeholder = strPlaceholder(i);

      const needsObjectPlaceholder = value !== null && (typeof value === "object" || typeof value === "function");

      const placeholderQuoteFix = needsQuotes ? `"${placeholder}"` : placeholder;

      return {
        value,
        replacement: !needsObjectPlaceholder || context === "tag" ? value : placeholderQuoteFix,
        needsObjectPlaceholder,
        context,
        needsQuotes,
      };
    });
  }

  becomeDOM() {
    const string = String.raw({ raw: this.#raw }, ...this.#data.map((_) => _.replacement));
    // place in a DOM object and trim text nodes
    this.#markup = trimTextNodes(innerHTML(string));
  }

  constructor(raw, ...tagData) {
    // Store the raw HTML string and tag data
    this.#raw = raw;
    this.#tagData = tagData;
    this.#data = null;
    this.#markup = null;

    // Process the tag data and generate placeholders
    this.processTagData();
    this.becomeDOM();

    // Create a proxy to handle property access and mutation
    this.#proxy = new Proxy(this, {
      get: (obj, key) => {
        if (this.hasOwnProperty(key)) return this[key];
        if (this.#proxscope.hasOwnProperty(key)) return this.#proxscope[key].value;
        return obj[key];
      },
      set: (obj, key, val) => {
        if (this.#proxscope.hasOwnProperty(key)) return this.#proxscope[key].set(val);
        return (obj[key] = val);
      },
    });
  }

  replaceInnerHTMLPlaceholders() {
    const placeholders = this.#markup.innerHTML.match(placeholderRegex);
    placeholders?.forEach((ph) => {
      const { placeholder, value, needsObjectPlaceholder } = this.#data[getPlaceholderID(ph)];
      this.#markup.innerHTML = this.#markup.innerHTML.replace(
        placeholder,
        needsObjectPlaceholder ? placeholder : value
      );
    });
  }

  replaceDOMPlaceholders() {
    // Replace DOM placeholders with their corresponding elements
    for (const ph of [...this.#markup.querySelectorAll(placeholdTag)]) {
      const dataValue = this.#data[ph.id].value;
      // Check if this is a dynamic/reactive value
      if (dataValue && typeof dataValue === "object" && "subscribe" in dataValue) {
        processDynamicVarAttributes(this, ph, null, dataValue);
      } else {
        ph.replaceWith(makePlaceable(dataValue));
      }
    }
  }

  const({ keepRaw = false, keepMarkup = false, keepData = false } = {}) {
    if (this.#constructed) return this;

    // Replace RAW placeholders with actual values
    this.replaceInnerHTMLPlaceholders();
    // Replace DOM placeholders with their corresponding elements
    this.replaceDOMPlaceholders();

    // Assign "this" references to elements
    [...this.#markup.querySelectorAll("ph")].forEach((node) => {
      const firstKey = [...node.attributes][0].nodeName;
      node.setAttribute("ph", firstKey);
      this.thisAssigner(node, firstKey);
    });

    [...this.#markup.querySelectorAll("[this]")].forEach((node) => {
      this.thisAssigner(node, node.getAttribute("this"));
      node.removeAttribute("this");
    });

    [...this.#markup.querySelectorAll("[id]")].forEach((node) => {
      this.thisAssigner(node, node.id);
    });

    // Process custom attributes
    this.processAttributes(this.#markup, this.#data);

    // If no element has been assigned to "main", assign the first element
    if (!this.main && this.#markup.firstElementChild) {
      this.thisAssigner(this.#markup.firstElementChild, "main");
    }

    // Wrap the markup in a template if necessary
    this.#dom = this.#markup.childNodes.length > 1 ? wrapInTemplate(this.#markup) : this.#markup;
    this.#isTemplate = this.#dom instanceof HTMLTemplateElement;
    if (this.#isTemplate) this.#dom = this.#dom.content;
    else this.#dom = this.#dom.firstElementChild;

    if (!keepMarkup) this.#markup = null;
    if (!keepRaw) this.#raw = null;
    if (!keepData) {
      this.#data = null;
      this.#tagData = null;
    }

    this.#constructed = true;
    return this;
  }

  thisAssigner(node, keyname) {
    const splitNames = keyname.split(" ");
    if (splitNames.length === 1) {
      const key = splitNames[0];
      node.__key__ = key;
      this[key] = node;
      this.#mutable && (this.#mutable[key] = node);
    } else {
      for (const key of splitNames) {
        node.__key__ = key;
        this[key] = node;
        this.#mutable && (this.#mutable[key] = node);
      }
    }
  }

  processAttributes() {
    const zyxBindAttributespattern = `[${Object.keys(zyxAttributes).join("],[")}]`;

    // Process zyx attributes
    new Set(this.#markup.querySelectorAll(zyxBindAttributespattern)).forEach((node) => {
      for (const attr of [...node.attributes].filter((_) => _.name in zyxAttributes)) {
        const placeholder = getPlaceholderID(attr.value);
        if (placeholder) {
          zyxAttributes[attr.name]({
            zyxhtml: this,
            node,
            data: this.#data[placeholder].value,
          });
          node.removeAttribute(attr.name);
        } else {
          zyxAttributes[attr.name]({ zyxhtml: this, node, data: attr.value });
        }
      }
    });

    // Process dynamic values in all attributes
    [...this.#markup.querySelectorAll("*")].forEach((node) => {
      [...node.attributes].forEach((attr) => {
        const placeholder = getPlaceholderID(attr.value);
        if (placeholder) {
          const dataValue = this.#data[placeholder].value;
          // Check if this is a dynamic/reactive value
          if (dataValue && typeof dataValue === "object" && "subscribe" in dataValue) {
            processDynamicVarAttributes(this, node, attr.name, dataValue);
            node.removeAttribute(attr.name);
          }
        }
      });
    });
  }

  markup() {
    return this.const().#dom;
  }

  appendTo(target) {
    target.append(this.markup());
    return this;
  }

  prependTo(target) {
    target.prepend(this.markup());
    return this;
  }

  place(place) {
    placer(this.markup(), place);
    return this;
  }

  bind(any, opts = {}) {
    this.#mutable = any;
    any.proxy = this.#proxy;
    any[IDENTIFIER_KEY] = this;
    any.appendTo = (container) => this.appendTo(container);
    any.prependTo = (container) => this.prependTo(container);
    any.place = (place) => this.place(place);
    return this.const(opts);
  }

  join(target) {
    this.#mutable = target;
    if (target?.[IDENTIFIER_KEY]) Object.assign(this, target[IDENTIFIER_KEY]);
    return this.const();
  }
}

export function makePlaceable(object) {
  if (object === false || object === null || object === undefined) return "";
  if (Array.isArray(object)) return templateFromPlaceables(object).content;
  if (typeof object === "function") return makePlaceable(object());
  if (object?.[IDENTIFIER_KEY] instanceof ZyXHtml) return object[IDENTIFIER_KEY].markup();
  if (object instanceof ZyXHtml) return object.markup();
  if (object instanceof HTMLTemplateElement) return object.content;
  return object;
}

export function templateFromPlaceables(placeables) {
  const fragment = document.createElement("template");
  fragment.content.append(...placeables.map(makePlaceable));
  return fragment;
}

import { defaultEvents } from "./defaultevents.js";
import { conditionalAttributes } from "./if-elif-else.js";
import { processDynamicDomListAttributes } from "./dynamicDomList.js";

const zyxAttributes = {
  ...defaultEvents,
  ...conditionalAttributes,
  ...processDynamicDomListAttributes,
};

export const html = (...args) => new ZyXHtml(...args);
