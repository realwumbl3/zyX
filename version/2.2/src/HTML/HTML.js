import { getPlaceholderID, innerHTML, placer, wrapInTemplate, trimTextNodes } from "./Utils.js";
import { defaultEvents, enhandedDefaultEvents } from "./DefaultEvents.js";
import { conditionalAttributes } from "./Conditional.js";
import { LiveInterp } from "./LiveInterp.js";
import { LiveVar } from "../LiveTypes.js";
import { processLiveDomListAttributes } from "./LiveDomList.js";
import { radioViewAttributes } from "./RadioView.js";

const IDENTIFIER_KEY = "###";
const CONTENT_CONTEXT = "content";
const TAG_CONTEXT = "tag";
const UNQUOTED_VALUE_CONTEXT = "unquoted-value";
const QUOTED_VALUE_CONTEXT = "quoted-value";
const PLACEHOLDER_TAG = "zyx-placeholder";

const REMOVE_ATTRIBUTES = ["this", "push", "ph"];

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
    /** @private */
    #managers;
    /** @private */
    #options;

    /**
     * Creates a new ZyXHTML instance
     * @param {Object} options - The options for the ZyXHTML instance
     * @param {TemplateStringsArray} raw - The raw HTML template string
     * @param {...*} tagData - The data to be inserted into the template
     */
    constructor(options, raw, ...tagData) {
        // Store the raw HTML string and tag data
        this.#options = { verbose: [], ...options };
        this.#raw = raw;
        this.#tagData = tagData;
        this.#data = this.processTagData();
        this.#markup = this.becomeDOM();
        this.#isTemplate = false;
        this.#dom = null;
        this.#map = null;
        this.#constructed = false;
        this.#logMap = false;
        this.#managers = new Map();
    }

    /**
     * Enables logging of the map after construction
     * @returns {ZyXHTML} The current instance
     */
    logMap() {
        this.#logMap = true;
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
     * Retrieve or lazily create a per-instance manager by name.
     * @param {string} name - Unique name for the manager (e.g., "radioView")
     * @param {() => any} [factory] - Optional factory invoked when manager is missing
     * @returns {any} - The stored or newly created manager instance
     */
    getManager(name, factory) {
        if (this.#managers.has(name)) return this.#managers.get(name);
        if (factory) {
            const instance = factory();
            this.#managers.set(name, instance);
            return instance;
        }
        return null;
    }
    /**
     * Check if a manager exists by name.
     * @param {string} name
     * @returns {boolean}
     */
    hasManager(name) {
        return this.#managers.has(name);
    }
    /**
     * Set or replace a manager instance by name.
     * @param {string} name
     * @param {any} instance
     * @returns {void}
     */
    setManager(name, instance) {
        this.#managers.set(name, instance);
    }

    /**
     * Detects the parent tag type by tracking open/close tags in the scanned HTML
     * @private
     * @param {string} html - The HTML string scanned up to the current position
     * @returns {string|null} The parent tag name (lowercase) or null if not inside any tag
     */
    #detectParentType(html) {
        // Track open tags using a stack approach
        const tagStack = [];
        // Combined regex to match all tags in order: opening, closing, or self-closing
        // Matches: <tagName...>, </tagName>, or <tagName.../>
        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*\/?>/g;
        let match;
        while ((match = tagRegex.exec(html)) !== null) {
            const fullMatch = match[0];
            const tagName = match[1].toLowerCase();
            const isClosing = fullMatch.startsWith("</");
            const isSelfClosing = fullMatch.endsWith("/>") || fullMatch.endsWith("/ >");
            // Self-closing tags don't affect the stack
            if (isSelfClosing) {
                continue;
            }
            if (isClosing) {
                // Remove the most recent matching tag from stack (LIFO)
                const lastIndex = tagStack.lastIndexOf(tagName);
                if (lastIndex !== -1) {
                    tagStack.splice(lastIndex, 1);
                }
            } else {
                // Opening tag - add to stack
                tagStack.push(tagName);
            }
        }
        // Return the most recent (innermost) parent tag, or null if stack is empty
        return tagStack.length > 0 ? tagStack[tagStack.length - 1] : null;
    }

    /**
     * Returns the appropriate placeholder tag for contexts with strict child requirements.
     * Falls back to the generic ZyX placeholder otherwise.
     * @private
     * @param {string|null} parentType - The detected parent tag name (lowercase) or null
     * @param {number} index - The placeholder index
     * @returns {string} - The placeholder tag HTML string
     */
    #getPlaceholderTagForParent(parentType, index) {
        switch (parentType) {
            case "select":
                return `<option data-ph-id='${index}'></option>`;
            case "table":
                return `<tr data-ph-id='${index}'></tr>`;
            case "tr":
                return `<td data-ph-id='${index}'></td>`;
            default:
                return `<${PLACEHOLDER_TAG} id='${index}'></${PLACEHOLDER_TAG}>`;
        }
    }

    /**
     * Determine whether a parent tag enforces strict child types and needs special handling.
     * @private
     * @param {string|null} parentType
     * @returns {boolean}
     */
    #needsStrictChildHandling(parentType) {
        return parentType === "select" || parentType === "table" || parentType === "tr";
    }

    /**
     * Insert a resolved placeable into a parent that enforces strict child requirements.
     * @private
     * @param {Element|null} parent
     * @param {Element} placeholderNode
     * @param {Node|string} placeable
     * @returns {void}
     */
    #insertIntoStrictParent(parent, placeholderNode, placeable) {
        // If we somehow lost the parent, fall back to normal replacement semantics.
        if (!parent) {
            placeholderNode.replaceWith(placeable);
            return;
        }
        if (placeable instanceof DocumentFragment) {
            const children = Array.from(placeable.childNodes);
            if (children.length === 0) {
                // Empty fragment - just remove placeholder
                placeholderNode.remove();
            } else {
                placeholderNode.remove();
                parent.append(...children);
            }
            return;
        }
        if (placeable instanceof Element || placeable instanceof Text) {
            // For single node placeables, append directly to the strict parent
            placeholderNode.remove();
            parent.append(placeable);
            return;
        }
        // Non-node, empty string or falsy value - just remove the placeholder
        placeholderNode.remove();
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
            // Detect the parent tag type for this placeholder
            const parentType = this.#detectParentType(scanned);
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
            // Use valid placeholder tags for elements that have strict child requirements:
            // - <select> requires <option> children
            // - <table> requires <tr> children
            // - <tr> requires <td> or <th> children
            
            const placeholderTag = this.#getPlaceholderTagForParent(parentType, i);
            const placeholder = needsQuotes ? `"${placeholderTag}"` : placeholderTag;
            const needsPlaceholder = value !== null && (typeof value === "object" || typeof value === "function");
            if (this.#options.verbose.includes("processTagData"))
                console.log("processTagData", {
                    context,
                    value,
                    replacement: context === TAG_CONTEXT ? value : placeholder,
                    needsPlaceholder,
                    parentType,
                });
            return {
                context,
                value,
                replacement: context === TAG_CONTEXT ? value : placeholder,
                needsPlaceholder,
                parentType,
            };
        });
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

        this.processPrimitiveNodes();

        this.processAdditionalAttributes();

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
     * Create a DOM structure from the raw HTML string with basic values and placeholders for objects and functions.
     * removing text nodes and trimming whitespace.
     * @private
     * @returns {Element} The DOM element, ZyXHTML markup might be a template if multiple elements are at the root of
     * the HTML template string.
     */
    becomeDOM() {
        const getValue = ({ value, needsPlaceholder, replacement }) => (needsPlaceholder ? replacement : value ?? "");
        const string = String.raw({ raw: this.#raw }, ...this.#data.map(getValue));
        return trimTextNodes(innerHTML(string));
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
            if (node.matches(PLACEHOLDER_TAG)) {
                const phid = node.getAttribute("id");
                if (phid) {
                    const dataValue = this.#data[phid]?.value;
                    const parentType = this.#data[phid]?.parentType ?? null;
                    initialMap.placeholders.push({ node, phid, dataValue, parentType });
                }
                continue;
            }
            // Also check for special placeholder elements used inside elements with strict child requirements:
            // - <option data-ph-id> inside <select>
            // - <tr data-ph-id> inside <table>
            // - <td data-ph-id> inside <tr>
            if (
                (node.tagName === "OPTION" || node.tagName === "TR" || node.tagName === "TD") &&
                node.hasAttribute("data-ph-id")
            ) {
                const phid = node.getAttribute("data-ph-id");
                if (phid) {
                    const dataValue = this.#data[phid]?.value;
                    const parentType = this.#data[phid]?.parentType ?? null;
                    initialMap.placeholders.push({ node, phid, dataValue, parentType });
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
                if (data && data instanceof LiveInterp) {
                    initialMap.zyxDynamicVars.push({ node, attr: attr.name, data });
                }
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

        for (const { node, dataValue, parentType } of this.#map.placeholders) {
            try {
                if (dataValue instanceof LiveInterp) {
                    dataValue.createZyXHTMLReactiveNode(this, node, null);
                } else if (dataValue instanceof LiveVar) {
                    dataValue
                        .contentInterp((value) => {
                            console.log("value", value);
                            return makePlaceable(value);
                        })
                        .createZyXHTMLReactiveNode(this, node, null);
                } else {
                    const placeable = makePlaceable(dataValue);
                    const parent = node.parentElement;

                    // Special handling for elements with strict child requirements: browsers don't properly handle
                    // DocumentFragment insertion via replaceWith() and will automatically delete invalid children.
                    // We need to append children directly for: <select>, <table>, and <tr>
                    // Use parentType from data instead of checking DOM
                    if (this.#needsStrictChildHandling(parentType)) {
                        this.#insertIntoStrictParent(parent, node, placeable);
                    } else {
                        node.replaceWith(placeable);
                    }
                }
            } catch (error) {
                console.error("Error replacing DOM placeholder:", error);
                // Leave the original placeholder in place if there's an error
            }
        }
    }

    processPrimitiveNodes() {
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
    }

    processAdditionalAttributes() {
        for (const { node, attr, data } of this.#map.zyxBindAttributes) {
            const handler = zyxAttributes[attr];
            try {
                handler({ zyxhtml: this, node, data });
                this.markAttributeProcessed(node, attr);
            } catch (e) {
                console.error(e);
                console.error("ZyXHTML: Error binding attribute", { attr, node, handler, data });
                this.markAttributeProcessed(node, `errored-${attr}`, e);
            }
        }

        // // Process dynamic values in all attributes
        for (const { node, attr, data } of this.#map.zyxDynamicVars) {
            data.createZyXHTMLReactiveNode(this, node, attr);
            this.markAttributeProcessed(node, attr);
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
                const [first_key, second_key] = splitNames;
                if (!this[first_key]) this[first_key] = {};
                this[first_key][second_key] = node;
                if (this.#mutable) {
                    if (!this.#mutable[first_key]) this.#mutable[first_key] = {};
                    this.#mutable[first_key][second_key] = node;
                }
                node.__group__ = first_key;
                node.__key__ = second_key;
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
        if (!this[keyname]) this[keyname] = [];
        this[keyname].push(node);
        if (this.#mutable) {
            if (!this.#mutable[keyname]) this.#mutable[keyname] = [];
            this.#mutable[keyname].push(node);
        }
    }

    /**
     * Marks an attribute as processed and optionally stores its value
     * @private
     * @param {Element} node - The DOM node
     * @param {string} attr - The attribute name
     * @param {string} [value] - Optional value to store
     */
    markAttributeProcessed(node, attr, value) {
        if (REMOVE_ATTRIBUTES.includes(attr)) node.removeAttribute(attr);
        else node.setAttribute(`${attr}-processed`, value || "");
        node.setAttribute(attr, "");
    }

    /**
     * Get data value by placeholder ID (for internal use by attribute processors)
     * @param {string} placeholderId - The placeholder ID
     * @returns {*} The data value or null
     */
    getDataByPlaceholderId(placeholderId) {
        return this.#data?.[placeholderId]?.value ?? null;
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

const zyxAttributes = {
    ...defaultEvents,
    ...enhandedDefaultEvents,
    ...conditionalAttributes,
    ...processLiveDomListAttributes,
    ...radioViewAttributes,
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
};

class DebugHTML {
    constructor(options) {
        this.options = options;
    }
}

export function debugHTML(options) {
    return new DebugHTML(options);
}

/**
 * Creates a new ZyXHTML instance
 * @param {TemplateStringsArray} args - The template strings and data
 * @returns {ZyXHTML} A new ZyXHTML instance
 */
export default function html(raw, ...args) {
    let options = {};
    if (args[0] instanceof DebugHTML) {
        options = args[0].options;
        // Remove the DebugHTML entry by merging the first two raw strings
        raw = [raw[0] + raw[1], ...raw.slice(2)];
        // Remove the first arg
        args = args.slice(1);
    }
    return new ZyXHTML(options, raw, ...args);
}
