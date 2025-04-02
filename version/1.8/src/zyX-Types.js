/**
 * A WeakMap to store event listeners for objects
 * @private
 */
const EVENTLISTENERS = new WeakMap();

/**
 * Base class for objects that need event listener management
 * @class
 */
export class EventHandlerMapObject {
    /**
     * Creates a new EventHandlerMapObject
     */
    constructor() {
        EVENTLISTENERS.set(this, new WeakRefSet());
    }

    /**
     * Gets the event listeners for this object
     * @returns {WeakRefSet} The set of event listeners
     */
    getEventListeners() {
        return EVENTLISTENERS.get(this);
    }

    /**
     * Adds an event listener
     * @param {Function} cb - The callback function to add
     */
    addListener(cb) {
        if (typeof cb !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.getEventListeners().add(cb);
    }

    /**
     * Removes an event listener
     * @param {Function} cb - The callback function to remove
     */
    removeListener(cb) {
        if (typeof cb !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.getEventListeners().delete(cb);
    }
}

/**
 * A Set implementation that uses WeakRef for automatic garbage collection
 * @class
 * @extends {Set}
 */
export class WeakRefSet extends Set {
    /**
     * Adds a reference to the set
     * @param {Object} ref - The object to add
     */
    add(ref) {
        if (ref === null || ref === undefined) {
            throw new TypeError('Cannot add null or undefined to WeakRefSet');
        }
        super.add(new WeakRef(ref));
    }

    /**
     * Executes a callback for each valid reference in the set
     * @param {Function} callback - The callback to execute
     */
    forEach(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        for (const weakRef of super.values()) {
            const ref = weakRef.deref();
            if (ref !== undefined) callback(ref);
        }
    }

    /**
     * Removes a reference from the set
     * @param {Object} ref - The object to remove
     * @returns {boolean} True if the reference was removed
     */
    delete(ref) {
        if (ref === null || ref === undefined) {
            return false;
        }
        for (const weakRef of super.values()) {
            if (weakRef.deref() === ref) {
                return super.delete(weakRef);
            }
        }
        return false;
    }

    /**
     * Removes all references except the specified one
     * @param {Object} ref - The reference to keep
     */
    singleize(ref) {
        if (ref === null || ref === undefined) {
            throw new TypeError('Cannot singleize with null or undefined reference');
        }
        for (const weakRef of super.values()) {
            if (weakRef.deref() !== ref) {
                super.delete(weakRef);
            }
        }
    }

    /**
     * Gets all valid references from the set
     * @returns {Array} Array of valid references
     */
    get() {
        const refs = [];
        for (const weakRef of super.values()) {
            const obj = weakRef.deref();
            if (obj === undefined) {
                super.delete(weakRef);
            } else {
                refs.push(obj);
            }
        }
        return refs;
    }

    /**
     * Gets the size of valid references in the set
     * @returns {number} The number of valid references
     */
    get size() {
        return this.get().length;
    }
}

/**
 * A double-ended queue implementation
 * @class
 * @extends {Array}
 */
export class Deque extends Array {
    /**
     * Creates a new Deque
     * @param {number} limit - The maximum size of the deque
     */
    constructor(limit) {
        if (typeof limit !== 'number' || limit < 0) {
            throw new TypeError('Limit must be a non-negative number');
        }
        super();
        this.limit = limit;
    }

    /**
     * Adds an element to the front of the deque
     * @param {*} item - The item to add
     * @returns {Deque} The deque instance
     */
    prepend(item) {
        if (this.length >= this.limit) {
            this.pop();
        }
        this.unshift(item);
        return this;
    }

    /**
     * Adds an element to the end of the deque
     * @param {*} item - The item to add
     * @returns {Deque} The deque instance
     */
    append(item) {
        if (this.length >= this.limit) {
            this.shift();
        }
        this.push(item);
        return this;
    }

    /**
     * Removes and returns the first element
     * @returns {*} The first element
     * @throws {Error} If the deque is empty
     */
    popleft() {
        if (this.length === 0) {
            throw new Error("Deque is empty");
        }
        return this.shift();
    }

    /**
     * Removes and returns the last element
     * @returns {*} The last element
     * @throws {Error} If the deque is empty
     */
    popright() {
        if (this.length === 0) {
            throw new Error("Deque is empty");
        }
        return this.pop();
    }

    /**
     * Checks if the deque is empty
     * @returns {boolean} True if the deque is empty
     */
    isEmpty() {
        return this.length === 0;
    }

    /**
     * Checks if the deque is full
     * @returns {boolean} True if the deque is full
     */
    isFull() {
        return this.length >= this.limit;
    }
}

/**
 * A double-ended queue implementation with event handling
 * @class
 * @extends {Deque}
 */
export class LiveDeque extends Deque {
    #eventListeners;

    /**
     * Creates a new LiveDeque
     * @param {number} limit - The maximum size of the deque
     */
    constructor(limit) {
        super(limit);
        this.#eventListeners = new WeakRefSet();
    }

    /**
     * Adds an event listener
     * @param {Function} cb - The callback function
     */
    addListener(cb) {
        if (typeof cb !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.#eventListeners.add(cb);
    }

    /**
     * Removes an event listener
     * @param {Function} cb - The callback function
     */
    removeListener(cb) {
        if (typeof cb !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.#eventListeners.delete(cb);
    }

    /**
     * Calls all event listeners with the given arguments
     * @param {string} method - The method name
     * @param {...*} args - Arguments to pass to listeners
     * @returns {LiveDeque} The deque instance
     */
    callListeners(method, ...args) {
        this.#eventListeners.forEach((cb) => cb(this, method, ...args));
        return this;
    }

    prepend(item) {
        super.prepend(item);
        this.callListeners("prepend", item);
        return this;
    }

    append(item) {
        super.append(item);
        this.callListeners("append", item);
        return this;
    }

    popleft() {
        const item = super.popleft();
        this.callListeners("popleft", item);
        return item;
    }

    popright() {
        const item = super.popright();
        this.callListeners("popright", item);
        return item;
    }
}

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

        this.#eventListeners = new WeakRefSet();
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
                    const eventListeners = this.#eventListeners.get(target);
                    eventListeners.forEach((cb) => cb(this, "set", property, value));
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
        if (typeof cb !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.#eventListeners.add(cb);
    }

    /**
     * Removes an event listener
     * @param {Function} cb - The callback function
     */
    removeListener(cb) {
        if (typeof cb !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.#eventListeners.delete(cb);
    }

    /**
     * Calls all event listeners with the given arguments
     * @param {string} method - The method name
     * @param {...*} args - Arguments to pass to listeners
     * @returns {LiveList} The array instance
     */
    callListeners(method, ...args) {
        this.#eventListeners.forEach((cb) => cb(this, method, ...args));
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

/**
 * A single variable implementation with event handling
 * @class
 */
export class LiveVariable {
    #value;
    #eventListeners;

    /**
     * Creates a new LiveVariable
     * @param {*} [initialValue] - Initial value for the variable
     */
    constructor(initialValue) {
        this.#value = initialValue;
        this.#eventListeners = new WeakRefSet();
    }

    /**
     * Gets the current value
     * @returns {*} The current value
     */
    get() {
        return this.#value;
    }

    /**
     * Sets a new value and triggers listeners
     * @param {*} value - The new value to set
     * @returns {LiveVariable} The variable instance
     */
    set(value) {
        const oldValue = this.#value;
        this.#value = value;
        this.callListeners("set", value, oldValue);
        return this;
    }

    /**
     * Adds an event listener
     * @param {Function} cb - The callback function
     */
    addListener(cb) {
        if (typeof cb !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.#eventListeners.add(cb);
    }

    /**
     * Removes an event listener
     * @param {Function} cb - The callback function
     */
    removeListener(cb) {
        if (typeof cb !== 'function') {
            throw new TypeError('Callback must be a function');
        }
        this.#eventListeners.delete(cb);
    }

    /**
     * Calls all event listeners with the given arguments
     * @param {string} method - The method name
     * @param {...*} args - Arguments to pass to listeners
     * @returns {LiveVariable} The variable instance
     */
    callListeners(method, ...args) {
        this.#eventListeners.forEach((cb) => cb(this, method, ...args));
        return this;
    }

    /**
     * Gets a proxy for the variable that handles events
     * @returns {Proxy} The proxied variable
     */
    getProxy() {
        return new Proxy(this, {
            get: (target, property) => {
                if (property === 'value') {
                    return target.get();
                }
                return target[property];
            },
            set: (target, property, value) => {
                if (property === 'value') {
                    target.set(value);
                } else {
                    target[property] = value;
                }
                return true;
            }
        });
    }

    /**
     * Triggers an update event
     * @returns {LiveVariable} The variable instance
     */
    update() {
        this.callListeners("update", this.#value);
        return this;
    }
}

