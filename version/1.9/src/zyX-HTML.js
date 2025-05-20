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

import { ZyXDynamicVar, VarInterp } from "./html/dynamicVariable.js";

import { LegacyShadowRoot } from "./zyX-Shadowroot.js";

/**
 * @typedef {Object} TagExpressionData
 * @property {*} value - The actual value to be inserted
 * @property {string} replacement - The placeholder or value to be used for replacement
 * @property {boolean} [needsPlaceholder=false] - Whether the value needs a placeholder
 * @property {string} [context=CONTENT_CONTEXT] - The context where the value appears (tag, content, etc.)
 * @property {boolean} [needsQuotes=false] - Whether the value needs to be quoted
 */

/**
 * @typedef {Object} CleanupOptions
 * @property {boolean} [keepRaw=false] - Whether to keep the raw HTML string
 * @property {boolean} [keepMarkup=false] - Whether to keep the markup
 * @property {boolean} [keepData=false] - Whether to keep the tag data
 * @property {boolean} [keepMap=false] - Whether to keep the map data
 */

/**
 * @typedef {Object} ZyxMap
 * @property {Array<TagExpressionData>} [placeholders=[]] - The placeholders
 * @property {Array<TagExpressionData>} [hasThis=[]] - The elements with this attribute
 * @property {Array<TagExpressionData>} [hasId=[]] - The elements with id attribute
 * @property {Array<TagExpressionData>} [zyxBindAttributes=[]] - The elements with zyx-bind-attributes
 * @property {Array<TagExpressionData>} [zyxDynamicVars=[]] - The elements with a DynamicVar based class attribute
 * @property {Array<TagExpressionData>} [phs=[]] - The elements with a ph attribute
 */

/**
 * A class that handles HTML template processing and DOM manipulation
 * @class
 * @property {boolean} [constructed=false] - Whether the DOM has been constructed
 * @property {Element} [dom=null] - The DOM element
 * @property {Element} [markup=null] - The markup element
 * @property {Array<TagExpressionData>} [data=[]] - The data to be inserted into the template
 * @property {ZyxMap} [map=null] - The map of placeholders
 * @property {boolean} [isTemplate=false] - Whether the markup is a template
 * @property {Object} [mutable=null] - The mutable object
 * @property {string} [raw=null] - The raw HTML string
 * @property {Array<TagExpressionData>} [tagData=[]] - The tag data
 * @property {MutationObserver} [selfMutationObserver=null] - The self mutation observer
 */
export class ZyXHTML {
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
    /** @private */
    #logMap;
    /**
     * Creates a new ZyXHTML instance
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
        this.#logMap = false;
    }

    logMap() {
        this.#logMap = true;
        return this;
    }

    /**
     * Cleans up internal resources when no longer needed
     * @param {CleanupOptions} options - Options for cleanup
     */
    cleanUp({ keepMarkup = false, keepRaw = false, keepData = false, keepMap = false } = {}) {
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
     * Create a DOM structure from the raw HTML string with basic values and placeholders for objects and functions.
     * removing text nodes and trimming whitespace.
     * @private
     * @returns {Element} The DOM element, ZyXHTML markup might be a template if multiple elements are at the root of
     * the HTML template string.
     */
    becomeDOM() {
        const string = String.raw(
            { raw: this.#raw },
            ...this.#data.map(({ value, needsPlaceholder, replacement }) => (needsPlaceholder ? replacement : value))
        );

        return trimTextNodes(innerHTML(string));
    }

    /**
     * Constructs the final DOM structure
     * @param {CleanupOptions & {mutationObserver?: boolean}} options - Options for the construction process
     * @returns {ZyXHTML} The current instance
     */
    const({ keepRaw = false, keepMarkup = false, keepData = false, keepMap = false, mutationObserver = false } = {}) {
        if (this.#constructed) return this;

        this.#map = this.mapEverything();

        if (this.#logMap) console.log("ZyXHTML: map", this.#map, { this: this });

        this.replaceDOMPlaceholders();

        for (const { node, ph } of this.#map.phs) {
            node.setAttribute("ph", ph);
            this.thisAssigner(node, ph);
            this.markAttributeProcessed(node, "ph", ph);
        }

        // Assign "this" references to elements
        for (const { node, key } of this.#map.hasThis) {
            this.thisAssigner(node, key);
            this.markAttributeProcessed(node, "this", key);
        }

        // Assign "push" references to elements
        for (const { node, key } of this.#map.hasPush) {
            this.pushAssigner(node, key);
            this.markAttributeProcessed(node, "push", key);
        }

        for (const { node, id } of this.#map.hasId) {
            this.thisAssigner(node, id);
        }

        for (const { node, attr, data } of this.#map.zyxBindAttributes) {
            const handler = zyxAttributes[attr];
            try {
                handler({ zyxhtml: this, node, data });
                this.markAttributeProcessed(node, attr);
            } catch (e) {
                console.error(
                    "ZyXHTML: Error binding attribute",
                    attr,
                    "to",
                    data,
                    "on",
                    node,
                    "with handler",
                    handler,
                    "error:",
                    e
                );
                this.markAttributeProcessed(node, `errored-${attr}`, e);
            }
        }

        // Process dynamic values in all attributes
        for (const { node, attr, data } of this.#map.zyxDynamicVars) {
            data.processDynamicVarAttributes(this, node, attr);
            this.markAttributeProcessed(node, attr);
        }

        // If no element has been assigned to "main", assign the first element
        if (!this.main && this.#markup.firstElementChild) {
            this.thisAssigner(this.#markup.firstElementChild, "main");
            this.markAttributeProcessed(this.#markup.firstElementChild, "main");
        }

        // Wrap the markup in a template if necessary
        this.#dom = this.#markup.childNodes.length > 1 ? wrapInTemplate(this.#markup) : this.#markup;
        this.#isTemplate = this.#dom instanceof HTMLTemplateElement;
        if (this.#isTemplate) this.#dom = this.#dom.content;
        else this.#dom = this.#dom.firstElementChild;

        if (mutationObserver) {
            this.setupSelfMutationObserver();
        }

        this.cleanUp({ keepMarkup, keepRaw, keepData, keepMap });

        this.#constructed = true;
        return this;
    }

    /**
     * Creates a hydrated map of the DOM placeholders
     * @private
     * @returns {ZyxMap} The map of everything in the DOM we need to process in future steps.
     */
    mapEverything() {
        const allElements = [...this.#markup.querySelectorAll("*")];
        const initialMap = {
            placeholders: [],
            hasThis: [],
            hasId: [],
            zyxBindAttributes: [],
            zyxDynamicVars: [],
            phs: [],
            hasPush: [],
        };

        for (const node of allElements) {
            if (node.matches(placeholdTag)) {
                const phid = node.getAttribute("id");
                if (phid) {
                    const dataValue = this.#data[phid]?.value;
                    initialMap.placeholders.push({ node, phid, dataValue });
                }
                continue;
            }
            if (node.hasAttribute("ph")) {
                initialMap.phs.push({ node, ph: node.getAttribute("ph") });
                continue;
            }
            if (node.hasAttribute("this")) {
                initialMap.hasThis.push({ node, key: node.getAttribute("this") });
            }
            if (node.hasAttribute("push")) {
                initialMap.hasPush.push({ node, key: node.getAttribute("push") });
                continue;
            }
            if (node.hasAttribute("id")) {
                initialMap.hasId.push({ node, id: node.getAttribute("id") });
            }
            for (const attr of [...node.attributes]) {
                const hasData = getPlaceholderID(attr.value);
                const data = this.#data[hasData]?.value;
                if (attr.name in zyxAttributes) initialMap.zyxBindAttributes.push({ node, attr: attr.name, data });
                if (data && (data instanceof ZyXDynamicVar || data instanceof VarInterp))
                    initialMap.zyxDynamicVars.push({ node, attr: attr.name, data });
            }
        }

        return {
            all: allElements,
            ...initialMap,
        };
    }

    /**
     * Replaces DOM placeholders with their corresponding elements
     * @private
     */
    replaceDOMPlaceholders() {
        // Replace DOM placeholders with their corresponding elements
        if (!this.#map?.placeholders?.length) return;

        for (const { node, dataValue } of this.#map.placeholders) {
            try {
                if (dataValue instanceof ZyXDynamicVar || dataValue instanceof VarInterp) {
                    dataValue.processDynamicVarAttributes(this, node, null);
                } else {
                    node.replaceWith(makePlaceable(dataValue));
                }
            } catch (error) {
                console.error("Error replacing DOM placeholder:", error);
                // Leave the original placeholder in place if there's an error
            }
        }
    }

    /**
     * Sets up a mutation observer to track changes to the DOM
     * @private
     */
    setupSelfMutationObserver() {
        this.#selfMutationObserver = new MutationObserver((mutations) => {
            // Observer implementation - log only in development
            if (process.env.NODE_ENV === "development") {
                for (const mutation of mutations) {
                    // Process mutation if needed
                }
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
        if (!node || !keyname) return;

        try {
            const splitNames = keyname.split(" ");
            if (splitNames.length === 1) {
                const key = splitNames[0];
                node.__key__ = key;
                this[key] = node;
                this.#mutable && (this.#mutable[key] = node);
            } else {
                for (const key of splitNames) {
                    if (key && key.trim()) {
                        node.__key__ = key;
                        this[key] = node;
                        this.#mutable && (this.#mutable[key] = node);
                    }
                }
            }
        } catch (error) {
            console.error("Error in thisAssigner:", error);
        }
    }

    /**
     * Assigns elements to properties based on their keys
     * @private
     * @param {Element} node - The DOM node to assign
     * @param {string} keyname - The key name(s) to assign the node to
     */
    pushAssigner(node, keyname) {
        console.log("pushAssigner", keyname, this[keyname]);
        if (!this[keyname]) this[keyname] = [];
        this[keyname].push(node);
        if (this.#mutable) {
            if (!this.#mutable[keyname]) this.#mutable[keyname] = [];
            this.#mutable[keyname].push(node);
        }
        console.log("pushAssigner", { keyname, this: this, mutable: this.#mutable });
    }

    /**
     * Marks an attribute as processed and optionally stores its value
     * @private
     * @param {Element} node - The DOM node
     * @param {string} attr - The attribute name
     * @param {string} [value] - Optional value to store
     */
    markAttributeProcessed(node, attr, value) {
        node.removeAttribute(attr);
        node.setAttribute(`${attr}-processed`, value || "");
    }

    /**
     * Returns the constructed DOM structure
     * @returns {Element} The DOM element
     */
    get markup() {
        return this.const().#dom;
    }

    /**
     * Appends the markup to a target element
     * @param {Element} target - The target element to append to
     * @returns {ZyXHTML} The current instance
     */
    appendTo(target) {
        target.append(this.markup);
        return this;
    }

    /**
     * Prepends the markup to a target element
     * @param {Element} target - The target element to prepend to
     * @returns {ZyXHTML} The current instance
     */
    prependTo(target) {
        target.prepend(this.markup);
        return this;
    }

    /**
     * Places the markup at a specified location
     * @param {string|Element} place - The placement target
     * @returns {ZyXHTML} The current instance
     */
    place(place) {
        placer(this.markup, place);
        return this;
    }

    /**
     * Binds the instance to an object and constructs the DOM
     * @param {Object} any - The object to bind to
     * @param {CleanupOptions & {mutationObserver?: boolean}} opts - Construction options
     * @returns {ZyXHTML} The current instance
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
     * @returns {ZyXHTML} The current instance
     */
    join(target) {
        this.#mutable = target;
        if (target?.[IDENTIFIER_KEY]) Object.assign(this, target[IDENTIFIER_KEY]);
        return this.const();
    }

    /**
     * @deprecated
     * @param {Function} callback - The callback function to call
     * @returns {ZyXHTML} The current instance
     */
    touch(callback) {
        console.warn("ZyXHTML: touch is deprecated");
        callback({
            proxy: this,
            markup: this.markup,
        });
        return this;
    }
}

ZyXHTML.prototype.super = ZyXHTML.prototype.join;

/**
 * Creates a placeable element from an object
 * @param {*} object - The object to convert
 * @returns {Element|string} The placeable element or empty string
 */
export function makePlaceable(object) {
    if (object === false || object === null || object === undefined) return "";
    if (Array.isArray(object)) return templateFromPlaceables(object).content;
    if (typeof object === "function") return makePlaceable(object());
    if (object?.[IDENTIFIER_KEY] instanceof ZyXHTML) return object[IDENTIFIER_KEY].markup;
    if (object instanceof ZyXHTML) return object.markup;
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
    "zyx-insert-entries": ({ zyxhtml, node, data }) => {
        const [entries, compose, groupname] = data;
        for (const [key, value] of Object.entries(entries)) {
            const composeResult = compose(zyxhtml, key, value);
            node.append(makePlaceable(composeResult));
            if (groupname) {
                if (typeof groupname === "string") zyxhtml.pushAssigner(composeResult, groupname);
                else if (Array.isArray(groupname)) groupname.push(composeResult);
                else throw new Error("Invalid groupname");
            }
        }
    },
    "zyx-transform": ({ node, data }) => {
        node.zyxTrans = zyxTransform(node, data?.map);
    },
    // Deprecation Zone
    "zyx-shadowroot": ({ node }) => {
        LegacyShadowRoot({ node });
    },
};

/**
 * Creates a new ZyXHTML instance
 * @param {TemplateStringsArray} args - The template strings and data
 * @returns {ZyXHTML} A new ZyXHTML instance
 */
export default function html(...args) {
    return new ZyXHTML(...args);
}
