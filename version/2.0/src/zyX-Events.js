/**
 * A lightweight event emitter implementation for JavaScript applications.
 * Provides methods for subscribing to and emitting events with support for multiple event names.
 * 
 * @class ZyXEvents
 * @example
 * const events = new ZyXEvents();
 * events.on('userLogin', (user) => console.log(`User ${user.name} logged in`));
 * events.call('userLogin', { name: 'John' });
 */
export default class ZyXEvents {
    /** @private */
    #events = {};

    /**
     * Subscribe to one or more events.
     * 
     * @param {string} event - Event name(s) to subscribe to. Multiple events can be specified with comma separation.
     * @param {Function} callback - Function to be called when the event is emitted.
     * @throws {TypeError} If event is not a string or callback is not a function.
     * @returns {void}
     */
    on(event, callback) {
        if (typeof event !== 'string') {
            throw new TypeError('Event name must be a string');
        }
        if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function');
        }

        if (event.includes(',')) {
            event.split(',').forEach(e => this.on(e.trim(), callback));
            return;
        }

        if (!(event in this.#events)) {
            this.#events[event] = [];
        }
        this.#events[event].push(callback);
    }

    /**
     * Emit an event with optional arguments.
     * 
     * @param {string} eventName - Name of the event to emit.
     * @param {...*} args - Arguments to pass to the event callbacks.
     * @throws {TypeError} If eventName is not a string.
     * @returns {void}
     */
    call(eventName, ...args) {
        if (typeof eventName !== 'string') {
            throw new TypeError('Event name must be a string');
        }

        const eventCallbacks = this.#events[eventName];
        if (!eventCallbacks) return;

        for (const cb of eventCallbacks) {
            try {
                cb(...args);
            } catch (error) {
                console.error(`Error in event handler for '${eventName}':`, error);
                // Emit error event if there are listeners
                this.call('error', error, eventName, args);
            }
        }
    }

    /**
     * Remove event listener(s).
     * 
     * @param {string} event - Event name(s) to unsubscribe from.
     * @param {Function} [callback] - Specific callback to remove. If not provided, removes all callbacks for the event.
     * @returns {void}
     */
    off(event, callback) {
        if (typeof event !== 'string') {
            throw new TypeError('Event name must be a string');
        }

        if (event.includes(',')) {
            event.split(',').forEach(e => this.off(e.trim(), callback));
            return;
        }

        if (!(event in this.#events)) return;

        if (callback) {
            this.#events[event] = this.#events[event].filter(cb => cb !== callback);
        } else {
            delete this.#events[event];
        }
    }

    /**
     * Get the number of listeners for an event.
     * 
     * @param {string} event - Event name to check.
     * @returns {number} Number of listeners for the event.
     */
    listenerCount(event) {
        return this.#events[event]?.length || 0;
    }
}


// Random aah helpers


/**
 * Adds event listeners to an element for multiple events
 * @param {Element} that - The element to add event listeners to
 * @param {string} events - The events to add, separated by spaces
 * @param {Function} cb - The callback function to call when the event occurs
 * @param {Object} [options] - Optional event listener options  
 */
export function addEventListeners(that, events, cb, options = {}) {
    events.split(" ").forEach((event) => that.addEventListener(event, cb, options));
}

/**
 * Removes event listeners from an element for multiple events
 * @param {Element} that - The element to remove event listeners from
 * @param {string} events - The events to remove, separated by spaces
 * @param {Function} cb - The callback function to remove
 * @param {Object} [options] - Optional event listener options
 */
export function removeEventListeners(that, events, cb, options = {}) {
    events.split(" ").forEach((event) => that.removeEventListener(event, cb, options));
}


