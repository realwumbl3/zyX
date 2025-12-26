import { getPlaceholderID } from "./zyX-HTML-Utils.js";

// Global variable for the inline "or" attribute name - easily adjustable
export const INLINE_OR_ATTRIBUTE_NAME = "or";

// Map to store conditional groups - now keyed by the if element
const conditionalGroups = new WeakMap();
const MULTI_REACTIVE_FLAG = Symbol("zyxMultiReactive");

const markAsMultiReactive = (sources) => {
    const tagged = sources.slice();
    tagged[MULTI_REACTIVE_FLAG] = true;
    return tagged;
};

const isMultiReactiveInput = (input) => Array.isArray(input) && input[MULTI_REACTIVE_FLAG] === true;

/**
 * Normalizes zyX conditional expressions into a consistent shape.
 * Supports:
 * - Primitive / single reactive references (`state.flag`)
 * - Tuple form `[reactive, predicate]`
 * - Multi-reactive arrays ending with a predicate
 *   `[reactiveA, reactiveB, (a, b) => a && b]`
 * @param {*} data - Raw conditional payload captured from the template.
 * @returns {{ reactive: any|any[]|undefined, predicate: Function|null }}
 */
function normalizeConditionData(data) {
    const isArray = Array.isArray(data);
    // LiveList extends Array, so treat any array exposing subscribe as a single reactive source.
    const isReactiveArrayLike = isArray && data && typeof data.subscribe === "function";

    if (!isArray || isReactiveArrayLike) {
        return { reactive: data, predicate: null };
    }

    if (data.length === 0) {
        return { reactive: undefined, predicate: null };
    }

    const maybePredicate = data[data.length - 1];
    const preceding = data.slice(0, -1);

    if (typeof maybePredicate === "function") {
        if (preceding.length === 0) {
            return { reactive: [], predicate: maybePredicate };
        }
        if (preceding.length === 1) {
            return { reactive: preceding[0], predicate: maybePredicate };
        }
        return { reactive: markAsMultiReactive(preceding), predicate: maybePredicate };
    }

    const [reactive, predicate] = data;
    return {
        reactive,
        predicate: typeof predicate === "function" ? predicate : null,
    };
}

/**
 * Class to manage conditional rendering groups
 * (if/else-if/else blocks) including per-node inline or conditions.
 */
export class ConditionalGroup {
    #conditions = [];
    #activeElement = null;
    /** @type {WeakMap<HTMLElement, Object>} */
    #elementConditions = new WeakMap();

    constructor(ifElement) {
        conditionalGroups.set(ifElement, this);
    }

    /**
     * Adds a condition to the group
     * @param {HTMLElement} element - The element to show/hide
     * @param {Object} condition - Condition configuration
     * @param {Object|Object[]|any} condition.reactive - Single reactive or array of reactives
     * @param {Function} condition.predicate - Function that evaluates the condition
     * @param {Boolean} condition.isElse - Whether this is an else block
     * @param {Object} [condition.inlineOr] - Optional inline or condition
     * @param {Object|Object[]|any} [condition.inlineOr.reactive] - Reactive data value(s) for inline or
     * @param {Function} [condition.inlineOr.predicate] - Predicate for inline or evaluation
     */
    addCondition(element, condition) {
        this.#conditions.push({
            element,
            condition,
        });
        this.#elementConditions.set(element, condition);

        // Hide all elements initially
        element.style.display = "none";

        const subscribeToSource = (source) => {
            if (
                source &&
                typeof source === "object" &&
                "subscribe" in source &&
                typeof source.subscribe === "function"
            ) {
                source.subscribe(() => this.evaluateConditions(), element);
            }
        };

        const subscribeReactiveInput = (input) => {
            if (isMultiReactiveInput(input)) {
                input.forEach(subscribeToSource);
                return;
            }
            subscribeToSource(input);
        };

        subscribeReactiveInput(condition.reactive);

        if (condition.inlineOr) {
            subscribeReactiveInput(condition.inlineOr.reactive);
        }

        // Evaluate immediately so the initial state is reflected
        this.evaluateConditions();
    }


    /**
     * Evaluates all conditions in the group and updates visibility
     */
    evaluateConditions() {
        let conditionMet = false;
        let elseElement = null;

        // Hide current active element if exists
        if (this.#activeElement) {
            this.#activeElement.style.display = "none";
            this.#activeElement = null;
        }

        // Hide all elements first
        for (const { element } of this.#conditions) {
            element.style.display = "none";
        }

        const resolveValue = (source) => {
            if (source && typeof source === "object" && "value" in source) {
                return source.value;
            }
            return source;
        };

        const evaluateReactiveInput = (reactiveInput, predicate) => {
            if (isMultiReactiveInput(reactiveInput)) {
                const values = reactiveInput.map(resolveValue);
                if (predicate) {
                    return predicate(...values);
                }
                return values[0];
            }
            const value = resolveValue(reactiveInput);
            return predicate ? predicate(value) : value;
        };

        // Evaluate conditions in order
        for (const { element, condition } of this.#conditions) {
            // Store else element for later
            if (condition.isElse) {
                elseElement = element;
                continue;
            }

            // Check if primary condition is met
            let result = evaluateReactiveInput(condition.reactive, condition.predicate);

            // If the primary condition failed, but we have an inline or condition
            // associated with this same element, evaluate that as a secondary path.
            if (!result && condition.inlineOr) {
                result = evaluateReactiveInput(condition.inlineOr.reactive, condition.inlineOr.predicate);
            }

            if (result && !conditionMet) {
                // Show this element and mark condition as met
                element.style.display = "";
                this.#activeElement = element;
                conditionMet = true;
            }
        }

        // If no condition was met and we have an else element, show it
        if (!conditionMet && elseElement) {
            elseElement.style.display = "";
            this.#activeElement = elseElement;
        }
    }
}

/**
 * Find the most recent zyx-if sibling that precedes the given element
 * @param {HTMLElement} element - The element to search backwards from
 * @returns {HTMLElement|null} - The preceding zyx-if element or null
 */
function findPrecedingIfElement(element) {
    let currentElement = element.previousElementSibling;

    while (currentElement) {
        if (currentElement.hasAttribute("zyx-if")) {
            return currentElement;
        }
        currentElement = currentElement.previousElementSibling;
    }

    return null;
}

/**
 * Get or create a conditional group for an if element
 * @param {HTMLElement} ifElement - The zyx-if element that starts the group
 * @returns {ConditionalGroup} - The conditional group
 */
export function getConditionalGroup(ifElement) {
    let group = conditionalGroups.get(ifElement);
    if (!group) {
        group = new ConditionalGroup(ifElement);
    }
    return group;
}

/**
 * Get the conditional group for an elif or else element by finding its corresponding if
 * @param {HTMLElement} element - The zyx-elif or zyx-else element
 * @returns {ConditionalGroup|null} - The conditional group or null if no if found
 */
function getConditionalGroupForElseIf(element) {
    const ifElement = findPrecedingIfElement(element);
    if (!ifElement) {
        console.warn("zyx-elif or zyx-else found without a preceding zyx-if:", element);
        return null;
    }
    return getConditionalGroup(ifElement);
}

/**
 * Process zyx-if attribute
 */
export function processIf({ node, data, zyxhtml }) {
    // Create a new conditional group for this if element
    const group = getConditionalGroup(node);

    // Process condition data
    const { reactive, predicate } = normalizeConditionData(data);

    // Check for inline or attribute and process it
    let inlineOr = null;
    if (node.hasAttribute(INLINE_OR_ATTRIBUTE_NAME)) {
        const orAttrValue = node.getAttribute(INLINE_OR_ATTRIBUTE_NAME);
        const orPlaceholderId = getPlaceholderID(orAttrValue);
        const orData = orPlaceholderId !== null && zyxhtml ? zyxhtml.getDataByPlaceholderId(orPlaceholderId) : null;

        if (orData !== null && orData !== undefined) {
            inlineOr = normalizeConditionData(orData);
        }

        // Remove the or attribute after processing
        if (zyxhtml) {
            zyxhtml.markAttributeProcessed(node, INLINE_OR_ATTRIBUTE_NAME);
        }
    }

    // Add to conditional group
    group.addCondition(node, {
        reactive,
        predicate,
        inlineOr,
    });
}

/**
 * Process zyx-else-if attribute
 */
export function processElseIf({ node, data, zyxhtml }) {
    // Find the conditional group from the preceding zyx-if
    const group = getConditionalGroupForElseIf(node);

    if (!group) {
        return; // Warning already logged in getConditionalGroupForElseIf
    }

    // Process condition data
    const { reactive, predicate } = normalizeConditionData(data);

    // Check for inline or attribute and process it
    let inlineOr = null;
    if (node.hasAttribute(INLINE_OR_ATTRIBUTE_NAME)) {
        const orAttrValue = node.getAttribute(INLINE_OR_ATTRIBUTE_NAME);
        const orPlaceholderId = getPlaceholderID(orAttrValue);
        const orData = orPlaceholderId !== null && zyxhtml ? zyxhtml.getDataByPlaceholderId(orPlaceholderId) : null;

        if (orData !== null && orData !== undefined) {
            inlineOr = normalizeConditionData(orData);
        }

        // Remove the or attribute after processing
        if (zyxhtml) {
            zyxhtml.markAttributeProcessed(node, INLINE_OR_ATTRIBUTE_NAME);
        }
    }

    // Add to conditional group
    group.addCondition(node, {
        reactive,
        predicate,
        inlineOr,
    });
}

/**
 * Process zyx-else attribute
 */
export function processElse({ node, data, zyxhtml }) {
    // Find the conditional group from the preceding zyx-if
    const group = getConditionalGroupForElseIf(node);

    if (!group) {
        return; // Warning already logged in getConditionalGroupForElseIf
    }

    // Add to conditional group as an else block
    group.addCondition(node, {
        isElse: true,
    });
}

// Export the conditional attribute processors for registration in zyX-HTML.js
export const conditionalAttributes = {
    "zyx-if": processIf,
    "zyx-elif": processElseIf,
    "zyx-else": processElse,
};
