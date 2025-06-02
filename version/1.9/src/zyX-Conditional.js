// Map to store conditional groups - now keyed by the if element
const conditionalGroups = new WeakMap();

/**
 * Class to manage conditional rendering groups
 * (if/else-if/else blocks)
 */
export class ConditionalGroup {
    #conditions = [];
    #activeElement = null;

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
     */
    addCondition(element, condition) {
        this.#conditions.push({
            element,
            condition,
        });

        // Hide all elements initially
        element.style.display = "none";

        // If this is a reactive condition, subscribe to changes
        if (condition.reactive && typeof condition.reactive === "object" && "subscribe" in condition.reactive) {
            condition.reactive.subscribe(() => this.evaluateConditions(), element);
        }

        // Defer evaluation to next tick to ensure all conditions are added first
        setTimeout(() => this.evaluateConditions(), 0);
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

            // Check if condition is met
            const value = condition.reactive.value;
            const result = condition.predicate ? condition.predicate(value) : value;

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

    // Add to conditional group
    group.addCondition(node, {
        reactive,
        predicate,
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

    // Add to conditional group
    group.addCondition(node, {
        reactive,
        predicate,
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
