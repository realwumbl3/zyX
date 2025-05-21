import { WeakRefSet, Deque } from "./zyX-Types.js";
import { VarInterp } from "./zyX-LiveInterp.js";

/**
 * An enhanced array implementation with event handling
 * @class
 * @extends {Array}
 */
export class LiveList extends Array {
    #eventListeners;

    /**
     * Creates a new LiveList
     * @param {Array} [initialValue] - Initial array elements
     */
    constructor(initialValue) {
        if (initialValue instanceof Array) super(...initialValue);
        else super();

        this.#eventListeners = new EventSubscriber();
    }

    interp(callback) {
        return new VarInterp(this, callback, () => this);
    }

    /**
     * Gets a proxy for the array that handles events
     * @returns {Proxy} The proxied array
     */
    getProxy() {
        return new Proxy(this, {
            set: (target, property, value, receiver) => {
                const result = Reflect.set(target, property, value, receiver);
                if (typeof property === "string" && !isNaN(property)) {
                    this.callListeners("set", property, value);
                }
                return result;
            },
            get: (target, property, receiver) => {
                const result = Reflect.get(target, property, receiver);
                if (typeof result === "function") return result.bind(target);
                return result;
            },
        });
    }

    /**
     * Adds an event listener
     * @param {Function} cb - The callback function
     */
    addListener(cb) {
        if (typeof cb !== "function") {
            throw new TypeError("Callback must be a function");
        }
        this.#eventListeners.addListener(cb);
    }

    /**
     * Removes an event listener
     * @param {Function} cb - The callback function
     */
    removeListener(cb) {
        if (typeof cb !== "function") {
            throw new TypeError("Callback must be a function");
        }
        this.#eventListeners.unsubscribe(cb);
    }

    /**
     * Calls all event listeners with the given arguments
     * @param {string} method - The method name
     * @param {...*} args - Arguments to pass to listeners
     * @returns {LiveList} The array instance
     */
    callListeners(method, ...args) {
        this.#eventListeners.notifySubscribers(this, method, ...args);
        return this;
    }

    /**
     * Adds elements to the end of the array
     * @param {...*} args - Elements to add
     * @returns {LiveList} The array instance
     */
    push(...args) {
        super.push(...args);
        this.callListeners("push", ...args);
        return this;
    }

    /**
     * Removes and returns the last element
     * @returns {*} The last element
     */
    pop() {
        const result = super.pop();
        this.callListeners("pop", result);
        return result;
    }

    /**
     * Removes and returns the first element
     * @returns {*} The first element
     */
    shift() {
        const result = super.shift();
        this.callListeners("shift", result);
        return result;
    }

    /**
     * Adds elements to the beginning of the array
     * @param {...*} args - Elements to add
     * @returns {LiveList} The array instance
     */
    unshift(...args) {
        super.unshift(...args);
        this.callListeners("unshift", ...args);
        return this;
    }

    /**
     * Changes array contents by removing/replacing elements
     * @param {number} start - Starting index
     * @param {number} deleteCount - Number of elements to delete
     * @param {...*} items - Elements to insert
     * @returns {Array} Array of deleted elements
     */
    splice(start, deleteCount, ...items) {
        const result = super.splice(start, deleteCount, ...items);
        this.callListeners("splice", start, deleteCount, ...items);
        return result;
    }

    /**
     * Triggers an update event
     * @returns {LiveList} The array instance
     */
    update() {
        this.callListeners("update");
        return this;
    }

    /**
     * Removes all elements from the array
     * @returns {LiveList} The array instance
     */
    clear() {
        super.splice(0, this.length);
        this.callListeners("clear");
        return this;
    }

    /**
     * Removes the first occurrence of an item
     * @param {*} item - The item to remove
     * @returns {LiveList} The array instance
     */
    remove(item) {
        const index = this.indexOf(item);
        if (index !== -1) this.splice(index, 1);
        return this;
    }

    /**
     * Sorts the array
     * @param {Function} compareFn - Comparison function
     * @returns {LiveList} The array instance
     */
    sort(compareFn) {
        super.sort(compareFn);
        this.callListeners("sort", compareFn);
        return this;
    }

    /**
     * Replaces array contents with another array
     * @param {Array} array - The array to swap with
     * @returns {LiveList} The array instance
     * @throws {TypeError} If input is not an array
     */
    swap(array) {
        if (!Array.isArray(array)) {
            throw new TypeError("LiveList.swap() requires an array");
        }
        this.clear();
        this.push(...array);
        return this;
    }

    /**
     * Inserts items at a specific index
     * @param {number} index - The index to insert at
     * @param {...*} items - Items to insert
     * @returns {LiveList} The array instance
     */
    insert(index, ...items) {
        this.splice(index, 0, ...items);
        return this;
    }
}

export class LiveDeque extends Deque {
    constructor(initialValue) {
        super(initialValue);
    }
}

/**
 * Class representing a dynamic variable with reactive behavior
 */
export class LiveVar {
    /**
     * Create a new dynamic variable
     * @param {*} initialValue - The initial value of the variable
     */
    constructor(initialValue) {
        this.initialValue = initialValue;
        this.value = initialValue;
        this.eventListeners = new EventSubscriber();
    }

    interp(callback) {
        return new VarInterp(this, callback, () => this.value);
    }

    /**
     * Reset the value to its initial value
     */
    reset() {
        this.value = this.initialValue;
        this.eventListeners.notifySubscribers(this.value);
    }

    /**
     * Set a new value and notify subscribers
     * @param {*} newValue - The new value to set
     */
    set(newValue) {
        if (newValue === this.value) return;
        this.value = newValue;
        this.eventListeners.notifySubscribers(this.value);
    }

    /**
     * Get the current value of the dynamic variable
     * @returns {*} The current value
     */
    get() {
        return this.value;
    }
}

/**
 * Class representing a dynamic variable with reactive behavior
 */
export class EventSubscriber {
    constructor(callback_value) {
        this.callback_value = callback_value;
        this.subscribers = new Set();
    }

    /**
     * Add a subscriber to be notified on changes
     * @param {Function} callback - The callback function to call when value changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.unsubscribe(callback); // Return unsubscribe function
    }

    /**
     * Unsubscribe a callback from the event
     * @param {Function} callback - The callback function
     */
    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    /**
     * Alias for subscribe to maintain compatibility with LiveVariable
     * @param {Function} callback - The callback function
     * @returns {Function} Unsubscribe function
     */
    addListener(callback) {
        return this.subscribe(callback);
    }

    notifySubscribers(...args) {
        this.subscribers.forEach((callback) => callback(...args));
    }
}
