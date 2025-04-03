import {
    placeholdTag,
    getPlaceholderID,
    innerHTML,
    placer,
    strPlaceholder,
    placeholderRegex,
    wrapInTemplate,
    trimTextNodes,
} from "./html/HTML.js";

const IDENTIFIER_KEY = "###";
const CONTENT_CONTEXT = "content";
const TAG_CONTEXT = "tag";
const UNQUOTED_VALUE_CONTEXT = "unquoted-value";
const QUOTED_VALUE_CONTEXT = "quoted-value";

/* <zyx-module place src="./exampleCode.js"></zyx-script> TODO: query for zyx-module and replace with ZyXHTML default at src. */

import { processDynamicVarAttributes } from "./html/dynamicVariable.js";

/**
 * @typedef {Object} TagExpressionData
 * @property {*} value - The actual value to be inserted
 * @property {string} replacement - The placeholder or value to be used for replacement
 * @property {boolean} needsObjectPlaceholder - Whether the value needs a placeholder
 * @property {string} context - The context where the value appears (tag, content, etc.)
 * @property {boolean} needsQuotes - Whether the value needs to be quoted
 */

/**
 * @typedef {Object} ConstOptions
 * @property {boolean} [keepRaw=false] - Whether to keep the raw HTML string
 * @property {boolean} [keepMarkup=false] - Whether to keep the markup
 * @property {boolean} [keepData=false] - Whether to keep the tag data
 */

/**
 * A class that handles HTML template processing and DOM manipulation
 * @class
 */
export class ZyXHtml {
    /** @private */
    #constructed = false;
    /** @private */
    #dom;
    /** @private */
    #markup;
    /** @private */
    #data;
    /** @private */
    #isTemplate;
    /** @private */
    #proxscope = {};
    /** @private */
    #mutable;
    /** @private */
    #proxy;
    /** @private */
    #raw;
    /** @private Array<TagExpressionData> */
    #tagData;

    /**
     * Processes tag data and determines context for each placeholder
     * @private
     */
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

    /**
     * Converts the raw HTML string into a DOM structure
     * @private
     */
    becomeDOM() {
        const string = String.raw({ raw: this.#raw }, ...this.#data.map((_) => _.replacement));
        // place in a DOM object and trim text nodes
        this.#markup = trimTextNodes(innerHTML(string));
    }

    /**
     * Creates a new ZyXHtml instance
     * @param {TemplateStringsArray} raw - The raw HTML template string
     * @param {...*} tagData - The data to be inserted into the template
     */
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

    /**
     * Replaces innerHTML placeholders with their corresponding values
     * @private
     */
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

    /**
     * Replaces DOM placeholders with their corresponding elements
     * @private
     */
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

    /**
     * Constructs the final DOM structure
     * @param {ConstOptions} options - Options for the construction process
     * @returns {ZyXHtml} The current instance
     */
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

    /**
     * Assigns elements to properties based on their keys
     * @private
     * @param {Element} node - The DOM node to assign
     * @param {string} keyname - The key name(s) to assign the node to
     */
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

    /**
     * Processes special attributes in the markup
     * @private
     */
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

    /**
     * Returns the constructed DOM structure
     * @returns {Element} The DOM element
     */
    markup() {
        return this.const().#dom;
    }

    /**
     * Appends the markup to a target element
     * @param {Element} target - The target element to append to
     * @returns {ZyXHtml} The current instance
     */
    appendTo(target) {
        target.append(this.markup());
        return this;
    }

    /**
     * Prepends the markup to a target element
     * @param {Element} target - The target element to prepend to
     * @returns {ZyXHtml} The current instance
     */
    prependTo(target) {
        target.prepend(this.markup());
        return this;
    }

    /**
     * Places the markup at a specified location
     * @param {string|Element} place - The placement target
     * @returns {ZyXHtml} The current instance
     */
    place(place) {
        placer(this.markup(), place);
        return this;
    }

    /**
     * Binds the instance to an object and constructs the DOM
     * @param {Object} any - The object to bind to
     * @param {ConstOptions} opts - Construction options
     * @returns {ZyXHtml} The current instance
     */
    bind(any, opts = {}) {
        this.#mutable = any;
        any.proxy = this.#proxy;
        any[IDENTIFIER_KEY] = this;
        any.appendTo = (container) => this.appendTo(container);
        any.prependTo = (container) => this.prependTo(container);
        any.place = (place) => this.place(place);
        return this.const(opts);
    }

    /**
     * Joins the instance with a target object
     * @param {Object} target - The target object to join with
     * @returns {ZyXHtml} The current instance
     */
    join(target) {
        this.#mutable = target;
        if (target?.[IDENTIFIER_KEY]) Object.assign(this, target[IDENTIFIER_KEY]);
        return this.const();
    }
}

/**
 * Creates a placeable element from an object
 * @param {*} object - The object to convert
 * @returns {Element|string} The placeable element or empty string
 */
export function makePlaceable(object) {
    if (object === false || object === null || object === undefined) return "";
    if (Array.isArray(object)) return templateFromPlaceables(object).content;
    if (typeof object === "function") return makePlaceable(object());
    if (object?.[IDENTIFIER_KEY] instanceof ZyXHtml) return object[IDENTIFIER_KEY].markup();
    if (object instanceof ZyXHtml) return object.markup();
    if (object instanceof HTMLTemplateElement) return object.content;
    return object;
}

/**
 * Creates a template from an array of placeables
 * @param {Array} placeables - Array of placeable elements
 * @returns {HTMLTemplateElement} A template containing the placeables
 */
export function templateFromPlaceables(placeables) {
    const fragment = document.createElement("template");
    fragment.content.append(...placeables.map(makePlaceable));
    return fragment;
}

import { defaultEvents } from "./html/DefaultEvents.js";
import { conditionalAttributes } from "./html/Conditional.js";
import { processLiveDomListAttributes } from "./html/LiveDomList.js";

const zyxAttributes = {
    ...defaultEvents,
    ...conditionalAttributes,
    ...processLiveDomListAttributes,
    "zyx-insert-n": ({ zyxhtml, node, data }) => {
        const [n, compose] = data;
        for (let i = 0; i < n; i++) {
            node.append(makePlaceable(compose(zyxhtml, i)));
        }
    },
};

/**
 * Creates a new ZyXHtml instance
 * @param {TemplateStringsArray} args - The template strings and data
 * @returns {ZyXHtml} A new ZyXHtml instance
 */
export const html = (...args) => new ZyXHtml(...args);
