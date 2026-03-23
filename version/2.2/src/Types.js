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
        if (typeof cb !== "function") {
            throw new TypeError("Callback must be a function");
        }
        this.getEventListeners().add(cb);
    }

    /**
     * Removes an event listener
     * @param {Function} cb - The callback function to remove
     */
    removeListener(cb) {
        if (typeof cb !== "function") {
            throw new TypeError("Callback must be a function");
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
            throw new TypeError("Cannot add null or undefined to WeakRefSet");
        }
        if (!this.has(ref)) super.add(new WeakRef(ref));
    }

    /**
     * Executes a callback for each valid reference in the set
     * @param {Function} callback - The callback to execute
     */
    forEach(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("Callback must be a function");
        }
        for (const weakRef of this.get()) {
            callback(weakRef);
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
            throw new TypeError("Cannot singleize with null or undefined reference");
        }
        for (const weakRef of super.values()) {
            if (weakRef.deref() !== ref) super.delete(weakRef);
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
        if (typeof limit !== "number" || limit < 0) {
            throw new TypeError("Limit must be a non-negative number");
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
