/**
 * @module zyX-Async
 * @description A utility module for handling asynchronous operations in JavaScript applications.
 * Provides functionality for worker management, async initialization, and concurrency control.
 */

/**
 * Creates a promise that resolves after a specified delay
 * @param {number} ms - Time to sleep in milliseconds
 * @param {boolean} [throwOnNegative=true] - Whether to throw on negative time values
 * @returns {Promise<void>}
 * @throws {Error} When throwOnNegative is true and ms is negative
 */
export function sleep(ms, throwOnNegative = true) {
    if (throwOnNegative && ms < 0) {
        throw new Error("Sleep duration cannot be negative");
    }
    return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

/**
 * Enhanced worker for handling async tasks with type safety and error handling
 * @class AsyncWorker
 * @description Manages Web Workers with event handling and task execution capabilities
 */
export class AsyncWorker {
    #worker;
    #tasks;
    #eventHandlers;
    #errorHandler;

    constructor({ url, type = "module", errorHandler = console.error }) {
        this.#worker = new Worker(url, { type });
        this.#tasks = new Map();
        this.#eventHandlers = new Map();
        this.#errorHandler = errorHandler;

        this.#worker.onmessage = this.#handleMessage.bind(this);
        this.#worker.onerror = this.#handleError.bind(this);
    }

    /**
     * Register an event handler
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} handler - Handler function
     * @returns {() => void} Cleanup function to remove the handler
     */
    on(eventName, handler) {
        if (!this.#eventHandlers.has(eventName)) {
            this.#eventHandlers.set(eventName, new Set());
        }
        this.#eventHandlers.get(eventName).add(handler);

        return () => this.off(eventName, handler);
    }

    /**
     * Remove an event handler
     * @param {string} eventName - Name of the event
     * @param {Function} handler - Handler function to remove
     */
    off(eventName, handler) {
        const handlers = this.#eventHandlers.get(eventName);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    /**
     * Execute a task in the worker
     * @template T
     * @param {{task: string, data?: any}} options - Task options
     * @returns {Promise<T>} Result of the task execution
     */
    async execute(options) {
        const taskId = crypto.randomUUID();

        const promise = new Promise((resolve, reject) => {
            this.#tasks.set(taskId, { resolve, reject });
        });

        this.#worker.postMessage({ ...options, taskId });

        return promise;
    }

    /**
     * Terminate the worker and cleanup resources
     */
    terminate() {
        this.#worker.terminate();
        this.#tasks.clear();
        this.#eventHandlers.clear();
    }

    #handleMessage(event) {
        const { taskId, error, data, type } = event.data;

        if (type === "event") {
            const handlers = this.#eventHandlers.get(data.event);
            if (handlers) {
                handlers.forEach((handler) => {
                    try {
                        handler(data.payload);
                    } catch (err) {
                        this.#errorHandler(err);
                    }
                });
            }
            return;
        }

        const task = this.#tasks.get(taskId);
        if (!task) return;

        this.#tasks.delete(taskId);
        if (error) {
            task.reject(new Error(error));
        } else {
            task.resolve(data);
        }
    }

    #handleError(error) {
        this.#errorHandler(error);
    }
}

/**
 * Base class for creating asynchronous constructors
 * @class AsynConstructor
 * @description Provides async initialization capabilities for classes
 */
export class AsynConstructor {
    #initialized;
    #initPromise;

    constructor({ delay = 1, immediate = false } = {}) {
        this.#initialized = false;
        this.#initPromise = new Promise((resolve, reject) => {
            const init = async () => {
                try {
                    if (typeof this.asyncInit === "function") {
                        await this.asyncInit();
                    }
                    this.#initialized = true;
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            if (immediate) {
                queueMicrotask(init);
            } else {
                setTimeout(init, delay);
            }
        });
    }

    /**
     * Check if the async initialization is complete
     * @returns {boolean} Whether initialization is complete
     */
    get isInitialized() {
        return this.#initialized;
    }

    /**
     * Wait for async initialization to complete
     * @returns {Promise<void>}
     */
    async waitForInit() {
        await this.#initPromise;
    }
}

export class LegacyAsynConstructor {
    #delay;
    #microtask;

    constructor({ delay = 1, microtask = false } = {}) {
        this.#delay = delay;
        this.#microtask = microtask;
        this.callAsyncConstructor();
    }

    callAsyncConstructor() {
        if (typeof this?.asynConstructor !== "function") {
            console.warn("you are using a (new AsynConstructor()) class without an async asynConstructor method.");
            return;
        }
        if (this.#microtask) {
            queueMicrotask((_) => this.asynConstructor());
        } else {
            setTimeout((_) => this.asynConstructor(), this.#delay);
        }
    }
}

/**
 * Creates a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Run multiple async tasks with concurrency control
 * @param {number} concurrency - Maximum number of concurrent tasks
 * @param {Array} tasks - Array of tasks to process
 * @param {Function} iteratorFn - Function to process each task
 * @returns {Promise<Array>} Array of results from all tasks
 */
export async function asyncPool(concurrency, tasks, iteratorFn) {
    const ret = [];
    const executing = new Set();

    for (const item of tasks) {
        const p = Promise.resolve().then(() => iteratorFn(item, tasks));
        ret.push(p);

        if (concurrency <= tasks.length) {
            const e = p.then(() => executing.delete(e));
            executing.add(e);
            if (executing.size >= concurrency) {
                await Promise.race(executing);
            }
        }
    }

    return Promise.all(ret);
}
