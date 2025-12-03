import { getPlaceholderID } from "./zyX-HTML-Utils.js";

// Global variable for the inline "or" attribute name - easily adjustable
export const INLINE_OR_ATTRIBUTE_NAME = "or";

// Map to store conditional groups - now keyed by the if element
const conditionalGroups = new WeakMap();

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
     * @param {Object} condition.reactive - Reactive data value
     * @param {Function} condition.predicate - Function that evaluates the condition
     * @param {Boolean} condition.isElse - Whether this is an else block
     * @param {Object} [condition.inlineOr] - Optional inline or condition
     * @param {Object} [condition.inlineOr.reactive] - Reactive data value for the inline or
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

        // If this is a reactive condition, subscribe to changes
        if (condition.reactive && typeof condition.reactive === "object" && "subscribe" in condition.reactive) {
            condition.reactive.subscribe(() => this.evaluateConditions(), element);
        }

        // If there is an inline or condition with its own reactive value, subscribe as well.
        if (
            condition.inlineOr &&
            condition.inlineOr.reactive &&
            typeof condition.inlineOr.reactive === "object" &&
            "subscribe" in condition.inlineOr.reactive
        ) {
            condition.inlineOr.reactive.subscribe(() => this.evaluateConditions(), element);
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

        // Evaluate conditions in order
        for (const { element, condition } of this.#conditions) {
            // Store else element for later
            if (condition.isElse) {
                elseElement = element;
                continue;
            }

            // Helper to safely unwrap reactive values that may or may not expose `.value`
            const resolveValue = (source) => {
                if (source && typeof source === "object" && "value" in source) {
                    return source.value;
                }
                return source;
            };

            // Check if primary condition is met
            const baseValue = resolveValue(condition.reactive);
            let result = condition.predicate ? condition.predicate(baseValue) : baseValue;

            // If the primary condition failed, but we have an inline or condition
            // associated with this same element, evaluate that as a secondary path.
            if (!result && condition.inlineOr) {
                const orValue = resolveValue(condition.inlineOr.reactive);
                const orResult = condition.inlineOr.predicate
                    ? condition.inlineOr.predicate(orValue)
                    : orValue;
                result = orResult;
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
    const [reactive, predicate] = Array.isArray(data) ? data : [data, null];

    // Check for inline or attribute and process it
    let inlineOr = null;
    if (node.hasAttribute(INLINE_OR_ATTRIBUTE_NAME)) {
        const orAttrValue = node.getAttribute(INLINE_OR_ATTRIBUTE_NAME);
        const orPlaceholderId = getPlaceholderID(orAttrValue);
        const orData = orPlaceholderId !== null && zyxhtml ? zyxhtml.getDataByPlaceholderId(orPlaceholderId) : null;
        
        if (orData !== null && orData !== undefined) {
            const [orReactive, orPredicate] = Array.isArray(orData) ? orData : [orData, null];
            inlineOr = {
                reactive: orReactive,
                predicate: orPredicate,
            };
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
    const [reactive, predicate] = Array.isArray(data) ? data : [data, null];

    // Check for inline or attribute and process it
    let inlineOr = null;
    if (node.hasAttribute(INLINE_OR_ATTRIBUTE_NAME)) {
        const orAttrValue = node.getAttribute(INLINE_OR_ATTRIBUTE_NAME);
        const orPlaceholderId = getPlaceholderID(orAttrValue);
        const orData = orPlaceholderId !== null && zyxhtml ? zyxhtml.getDataByPlaceholderId(orPlaceholderId) : null;
        
        if (orData !== null && orData !== undefined) {
            const [orReactive, orPredicate] = Array.isArray(orData) ? orData : [orData, null];
            inlineOr = {
                reactive: orReactive,
                predicate: orPredicate,
            };
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
