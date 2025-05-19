// Dynamic value system for zyX HTML
// Provides reactive values that update DOM when modified
const VERBOSE = false;

/**
 * Class representing a dynamic variable with reactive behavior
 */
export class ZyXDynamicVar {
    /**
     * Create a new dynamic variable
     * @param {*} initialValue - The initial value of the variable
     */
    constructor(initialValue) {
        this.initialValue = initialValue;
        this.value = initialValue;
        this.subscribers = new Set();
    }

    /**
     * Reset the value to its initial value
     */
    reset() {
        if (VERBOSE) console.log("resetting value", { initialValue: this.initialValue, value: this.value });
        this.value = this.initialValue;
        this.notifySubscribers();
    }

    /**
     * Set a new value and notify subscribers
     * @param {*} newValue - The new value to set
     */
    set(newValue) {
        if (VERBOSE) console.log("setting value", newValue, { value: this.value, subscribers: this.subscribers });
        if (newValue === this.value) return;
        this.value = newValue;
        this.notifySubscribers();
    }

    /**
     * Get the current value of the dynamic variable
     * @returns {*} The current value
     */
    get() {
        return this.value;
    }

    /**
     * Add a subscriber to be notified on changes
     * @param {Function} callback - The callback function to call when value changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback); // Return unsubscribe function
    }

    /**
     * Alias for subscribe to maintain compatibility with LiveVariable
     * @param {Function} callback - The callback function
     * @returns {Function} Unsubscribe function
     */
    addListener(callback) {
        return this.subscribe(callback);
    }

    /**
     * Notify all subscribers of value change
     * @private
     */
    notifySubscribers() {
        if (VERBOSE) console.log("notifying subscribers", { value: this.value, subscribers: this.subscribers });
        this.subscribers.forEach((callback) => callback(this.value));
    }
}

/**
 * Creates a dynamic variable with reactive behavior
 * @param {*} initialValue - The initial value of the variable
 * @returns {ZyXDynamicVar} The reactive variable object
 */
export function dynamicVar(initialValue) {
    return new ZyXDynamicVar(initialValue);
}

/**
 * Processes reactive values in attributes and content
 * @param {ZyXHtml} zyxhtml - The zyX HTML instance
 * @param {Element} node - The DOM element to process
 * @param {string} attrName - The name of the attribute to process
 * @param {ZyXDynamicVar} reactive - The reactive value object
 * @returns {void}
 */
export function processDynamicVarAttributes(zyxhtml, node, attrName, reactive) {
    if (!(reactive instanceof ZyXDynamicVar || reactive instanceof DynamicVarOutput))
        throw new Error("reactive must be an instance of ZyXDynamicVar or DynamicVarOutput");

    if (attrName) {
        // For attributes: update the attribute when the value changes
        const updateAttribute = (newValue) => {
            if (VERBOSE) console.log("updating attribute", { node, attrName, newValue });
            node.setAttribute(attrName, newValue);

            if (node.tagName === "INPUT") {
                if (VERBOSE) console.log("updating input", { node, newValue });
                node.value = newValue;
                node.dispatchEvent(new Event("change"));
            }
        };

        // Initial update - ensure it runs after the node is in the DOM
        setTimeout(() => {
            updateAttribute(reactive.value);
        }, 0);

        // Subscribe to changes
        reactive.subscribe(updateAttribute);
    } else {
        // For content: create a span that updates when the value changes
        const span = document.createElement("span");
        let updateFunction;
        if (reactive instanceof DynamicVarOutput) {
            updateFunction = () => {
                const interp = reactive.interprate();
                span.textContent = interp;
            };
            updateFunction();
            reactive.reactive.subscribe(updateFunction);
        } else {
            updateFunction = (newValue) => {
                span.textContent = newValue;
            };
            // Initial update
            updateFunction(reactive.value);
            reactive.subscribe(updateFunction);
        }

        // Replace the node with our reactive span
        node.replaceWith(span);
    }
}

export class DynamicVarOutput {
    constructor(reactive, interp) {
        this.reactive = reactive;
        this.interp = interp;
    }

    interprate() {
        return this.interp(this.reactive.value);
    }
}

export function interpVar(reactive, interp) {
    return new DynamicVarOutput(reactive, interp);
}
