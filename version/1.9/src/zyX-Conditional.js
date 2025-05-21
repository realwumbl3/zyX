// Map to store conditional groups
const conditionalGroups = new WeakMap();

/**
 * Class to manage conditional rendering groups
 * (if/else-if/else blocks)
 */
export class ConditionalGroup {
    #conditions = [];
    #activeElement = null;

    constructor(container) {
        conditionalGroups.set(container, this);
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
 * Get or create a conditional group for a container
 */
export function getConditionalGroup(container) {
    let group = conditionalGroups.get(container);
    if (!group) {
        group = new ConditionalGroup(container);
    }
    return group;
}

/**
 * Process zyx-if attribute
 */
export function processIf({ node, data, zyxhtml }) {
    // Extract the parent element to use as container
    const parent = node.parentElement;

    // Get or create conditional group
    const group = getConditionalGroup(parent);

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
    // Extract the parent element to use as container
    const parent = node.parentElement;

    // Get conditional group (should already exist from a preceding if)
    const group = getConditionalGroup(parent);

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
    // Extract the parent element to use as container
    const parent = node.parentElement;

    // Get conditional group (should already exist from a preceding if)
    const group = getConditionalGroup(parent);

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
