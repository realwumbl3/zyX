// Dynamic value system for zyX HTML
// Provides reactive values that update DOM when modified

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
        this.value = this.initialValue;
        this.notifySubscribers();
    }

    /**
     * Set a new value and notify subscribers
     * @param {*} newValue - The new value to set
     */
    set(newValue) {
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
        this.subscribers.forEach((callback) => callback(this.value));
    }

    processDynamicVarAttributes(zyxhtml, node, attrName) {
        this._processDynamicVarAttributes(zyxhtml, node, attrName, this);
    }

    _processDynamicVarAttributes(zyxhtml, node, attrName, reactive) {
        const isInterp = reactive instanceof VarInterp;
        let updateFunction;
        if (attrName) {
            // For attributes: update the attribute when the value changes
            updateFunction = () => {
                const newValue = isInterp ? reactive.interprate() : reactive.value;
                node.setAttribute(attrName, newValue);

                if (node.tagName === "INPUT") {
                    node.value = newValue;
                    node.dispatchEvent(new Event("change"));
                }
            };
            // Initial update - ensure it runs after the node is in the DOM
            setTimeout(() => {
                updateFunction();
            }, 0);
        } else {
            // For content: create a span that updates when the value changes
            const span = document.createElement("span");
            node.replaceWith(span);
            updateFunction = () => {
                span.textContent = isInterp ? reactive.interprate() : reactive.value;
            };
            updateFunction();
        }
        this.subscribe(updateFunction);
    }

    interp(callback) {
        const newReactiveInterp = new VarInterp(this, callback);
        return newReactiveInterp;
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

export class VarInterp {
    constructor(reactive, interp) {
        this.reactive = reactive;
        this.interp = interp;
    }

    interprate() {
        return this.interp(this.reactive.value);
    }

    processDynamicVarAttributes(zyxhtml, node, attrName) {
        this.reactive._processDynamicVarAttributes(zyxhtml, node, attrName, this);
    }
}

export function varInterp(reactive, interp) {
    return new VarInterp(reactive, interp);
}
