import {
    placeholdTag,
    getPlaceholderID,
    innerHTML,
    placer,
    strPlaceholder,
    wrapInTemplate,
    trimTextNodes,
} from "./html/HTML.js";

const IDENTIFIER_KEY = "###";
const CONTENT_CONTEXT = "content";
const TAG_CONTEXT = "tag";
const UNQUOTED_VALUE_CONTEXT = "unquoted-value";
const QUOTED_VALUE_CONTEXT = "quoted-value";

/* <zyx-module place src="./exampleCode.js"></zyx-script> TODO: query for zyx-module and replace with ZyXHTML default at src. */

import { ZyXDynamicVar, processDynamicVarAttributes } from "./html/dynamicVariable.js";

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
    #map;
    /** @private */
    #isTemplate;
    /** @private */
    #mutable;
    /** @private */
    #raw;
    /** @private Array<TagExpressionData> */
    #tagData;
    /** @private */
    #selfMutationObserver;
    /**
     * Creates a new ZyXHtml instance
     * @param {TemplateStringsArray} raw - The raw HTML template string
     * @param {...*} tagData - The data to be inserted into the template
     */
    constructor(raw, ...tagData) {
        // Store the raw HTML string and tag data
        this.#raw = raw;
        this.#tagData = tagData;
        this.#data = this.processTagData();
        this.#markup = this.becomeDOM();
        this.#isTemplate = false;
        this.#dom = null;
        this.#map = null;
        this.#constructed = false;
    }

    cleanUp(keepMarkup = false, keepRaw = false, keepData = false, keepMap = false) {
        if (!keepMarkup) this.#markup = null;
        if (!keepRaw) this.#raw = null;
        if (!keepData) {
            this.#data = null;
            this.#tagData = null;
        }
        if (!keepMap) this.#map = null;
    }

    /**
     * Processes tag data and determines context for each placeholder
     * @private
     */
    processTagData() {
        const rawParts = this.#raw.slice(0, -1);
        let scanned = "";
        // Process each expression and track its context
        return this.#tagData.map((value, i) => {
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

            const placeholder = needsQuotes ? `"${strPlaceholder(i)}"` : strPlaceholder(i);

            return {
                context,
                value,
                replacement: context === "tag" ? value : placeholder,
                needsPlaceholder: value !== null && (typeof value === "object" || typeof value === "function"),
            };
        });
    }

    /**
     * Converts the raw HTML string into a DOM structure
     * @private
     */
    becomeDOM() {
        const string = String.raw({ raw: this.#raw }, ...this.#data.map(({ value, needsPlaceholder, replacement }) =>
            needsPlaceholder ? replacement : value
        ));

        return trimTextNodes(innerHTML(string));
    }

    /**
     * Constructs the final DOM structure
     * @param {ConstOptions} options - Options for the construction process
     * @returns {ZyXHtml} The current instance
     */
    const({ keepRaw = false, keepMarkup = false, keepData = false, keepMap = false, mutationObserver = false } = {}) {
        if (this.#constructed) return this;

        this.#map = this.mapEverything();
        console.log(this.#map);

        this.replaceDOMPlaceholders();

        for (const { node, ph } of this.#map.phs) {
            node.setAttribute("ph", ph);
            this.thisAssigner(node, ph);
            markAttributeProcessed(node, "ph", ph);
        }

        // Assign "this" references to elements
        for (const { node, key } of this.#map.hasThis) {
            this.thisAssigner(node, key);
            markAttributeProcessed(node, "this", key);
        }

        for (const { node, id } of this.#map.hasId) {
            this.thisAssigner(node, id);
            markAttributeProcessed(node, "id", id);
        }

        for (const { node, attr, data } of this.#map.zyxBindAttributes) {
            const handler = zyxAttributes[attr];
            try {
                handler({ zyxhtml: this, node, data });
                markAttributeProcessed(node, attr);
            } catch (e) {
                console.error("ZyXHTML: Error binding attribute", attr, "to", data, "on", node, "with handler", handler, "error", e);
                markAttributeProcessed(node, `errored-${attr}`, e);
            }
        }

        // Process dynamic values in all attributes
        for (const { node, attr, data } of this.#map.zyxDynamicVars) {
            processDynamicVarAttributes(this, node, attr, data);
            markAttributeProcessed(node, attr);
        }

        // If no element has been assigned to "main", assign the first element
        if (!this.main && this.#markup.firstElementChild) {
            this.thisAssigner(this.#markup.firstElementChild, "main");
            markAttributeProcessed(this.#markup.firstElementChild, "main");
        }

        // Wrap the markup in a template if necessary
        this.#dom = this.#markup.childNodes.length > 1 ? wrapInTemplate(this.#markup) : this.#markup;
        this.#isTemplate = this.#dom instanceof HTMLTemplateElement;
        if (this.#isTemplate) this.#dom = this.#dom.content;
        else this.#dom = this.#dom.firstElementChild;

        if (mutationObserver) {
            this.setupSelfMutationObserver();
        }

        this.cleanUp(keepMarkup, keepRaw, keepData, keepMap);

        this.#constructed = true;
        return this;
    }

    /**
     * Creates a hydrated map of the DOM placeholders
     * @private
     */
    mapEverything() {
        const allElements = [...this.#markup.querySelectorAll("*")];
        const placeholders = []
        const hasThis = []
        const hasId = []
        const zyxBindAttributes = []
        const zyxDynamicVars = []
        const phs = []

        for (const node of allElements) {
            if (node.matches(placeholdTag)) {
                const phid = node.getAttribute("id");
                if (phid) {
                    const dataValue = this.#data[phid]?.value;
                    placeholders.push({ node, phid, dataValue });
                }
                continue;
            }
            if (node.hasAttribute("ph")) {
                phs.push({ node, ph: node.getAttribute("ph") });
                continue;
            }
            if (node.hasAttribute("this")) {
                hasThis.push({ node, key: node.getAttribute("this") });
            }
            if (node.hasAttribute("id")) {
                hasId.push({ node, id: node.getAttribute("id") });
            }
            for (const { name: attr, value } of [...node.attributes]) {
                if (attr in zyxAttributes) {
                    const hasData = getPlaceholderID(value);
                    const data = this.#data[hasData]?.value;
                    zyxBindAttributes.push({ node, attr, data });
                    if (data && data instanceof ZyXDynamicVar) {
                        zyxDynamicVars.push({ node, attr, data });
                    }
                }
            }
        }

        return {
            all: allElements,
            placeholders,
            hasThis,
            hasId,
            zyxBindAttributes,
            zyxDynamicVars,
            phs,
        }
    }


    /**
     * Replaces DOM placeholders with their corresponding elements
     * @private
     */
    replaceDOMPlaceholders() {
        // Replace DOM placeholders with their corresponding elements
        for (const { node, dataValue } of this.#map.placeholders) {
            // Check if this is a dynamic/reactive value
            if (dataValue instanceof ZyXDynamicVar) {
                processDynamicVarAttributes(this, node, null, dataValue);
            } else {
                node.replaceWith(makePlaceable(dataValue));
            }
        }

    }

    setupSelfMutationObserver() {
        this.#selfMutationObserver = new MutationObserver((mutations) => {
            console.log(this, "self mutation observer", mutations);
            for (const mutation of mutations) {
                console.log(mutation);
            }
        });
        this.#selfMutationObserver.observe(this.#dom, { childList: true, subtree: true });
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

function markAttributeProcessed(node, attr, value) {
    node.removeAttribute(attr);
    node.setAttribute(`${attr}-processed`, value || "");
}

import { defaultEvents } from "./html/DefaultEvents.js";
import { conditionalAttributes } from "./html/Conditional.js";
import { processLiveDomListAttributes } from "./html/LiveDomList.js";
import zyxTransform from "./zyX-Transform.js";

const zyxAttributes = {
    ...defaultEvents,
    ...conditionalAttributes,
    ...processLiveDomListAttributes,
    "zyx-insert-n": ({ zyxhtml, node, data }) => {
        const [n, compose] = data;
        for (let i = 0; i < n; i++) {
            node.append(makePlaceable(compose(zyxhtml, i, n)));
        }
    },
    "zyx-transform": ({ node, data }) => {
        node.zyxTrans = zyxTransform(node, data?.map);
    }
}

/**
 * Creates a new ZyXHtml instance
 * @param {TemplateStringsArray} args - The template strings and data
 * @returns {ZyXHtml} A new ZyXHtml instance
 */
export const html = (...args) => new ZyXHtml(...args);
