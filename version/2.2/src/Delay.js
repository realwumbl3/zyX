/**
 * A WeakMap to store global references.
 * @type {WeakMap}
 */
const GlobalMap = new WeakMap();

if (typeof window !== "undefined") {
    window.zyxMap = GlobalMap;
}

/**
 * Retrieves or initializes a bank in the global map for a given reference.
 * @param {Object} ref - The reference object.
 * @param {string} bank - The name of the bank to retrieve.
 * @returns {Object} The bank object associated with the reference.
 */
const GlobalGet = (ref, bank) => {
    let map = GlobalMap.get(ref);
    // console.log('map for', map)
    if (!map) {
        GlobalMap.set(ref, { banks: {} });
        map = GlobalMap.get(ref);
    }
    if (!(bank in map.banks)) map.banks[bank] = {};

    return map.banks[bank];
};

/**
 * Creates a chain map for callbacks and pending actions.
 * @returns {Object} An object containing callbacks and pending actions.
 */
function createChainMap() {
    return {
        callbacks: [],
        pending: [],
    }
};

/**
 * Delays the execution of a function chain for a specific context and key.
 * @param {Object} that - The context in which the delay is applied.
 * @param {string} keyname - The key name for the delay chain.
 * @returns {Object} An object with a `then` method for chaining.
 */
export function delayChain(that, keyname) {
    const map = GlobalGet(that, "delayChains");
    if (keyname in map) {
        for (const timeout of map[keyname].pending) {
            clearTimeout(timeout);
        }
        map[keyname].pending = [];
        map[keyname].callbacks = [];
    } else {
        map[keyname] = createChainMap();
    }
    const callTimeout = () => (map[keyname].callbacks.length > 0 ? map[keyname].callbacks.splice(0, 1)[0]() : false);
    const returnFunc = () => {
        return {
            then: (cb, delay) => {
                const cbfunc = () => {
                    map[keyname].pending.push(
                        setTimeout((_) => {
                            cb();
                            callTimeout();
                        }, delay)
                    );
                };
                map[keyname].callbacks.push(cbfunc);
                return returnFunc();
            },
        };
    };
    map[keyname].pending.push(setTimeout(callTimeout, 1));
    return returnFunc();
}

/**
 * Breaks the delay chain for a specific context and key.
 * @param {Object} that - The context in which the delay is applied.
 * @param {string} keyname - The key name for the delay chain to break.
 */
export function breakDelayChain(that, keyname) {
    const map = GlobalGet(that, "delayChains");
    if (keyname in map) {
        for (const timeout of map[keyname].pending) {
            clearTimeout(timeout);
        }
        map[keyname] = createChainMap();
    }
}

/**
 * Delays the execution of a function for a specified amount of time.
 * @param {Object} that - The context in which the delay is applied.
 * @param {string} keyname - The key name for the delay.
 * @param {number} ms - The delay duration in milliseconds.
 * @param {Function} [func] - The function to execute after the delay.
 * @returns {Promise} A promise that resolves after the delay.
 */
export function delay(that, keyname, ms, func) {
    // console.log(keyname, "delay", that);
    return new Promise((res, rej) => {
        const map = GlobalGet(that, "delays");
        if (keyname in map) clearTimeout(map[keyname].timeout);
        ms = ms || 0;
        if (func) map[keyname] = { func, timeout: setTimeout(() => res(func()), ms) };
        else map[keyname] = { func, timeout: setTimeout(res, ms) };
    });
}

/**
 * Clears the delay for specified key names.
 * @param {Object} that - The context in which the delay is applied.
 * @param {...string} keynames - The key names for the delays to clear.
 */
export function clearDelay(that, ...keynames) {
    const map = GlobalGet(that, "delays");
    if (keynames.length > 1) {
        for (const keyname in keynames) {
            if (keyname in map) clearTimeout(map[keyname]?.timeout);
        }
    } else {
        clearTimeout(map[keynames[0]]?.timeout);
    }
}

/**
 * Instantly calls an existing delay function and clears it.
 * @param {Object} that - The context in which the delay is applied.
 * @param {string} keyname - The key name for the delay to call.
 */
export function instant(that, keyname) {
    const map = GlobalGet(that, "delays");
    if (keyname in map) {
        clearTimeout(map[keyname].timeout);
        map[keyname].func();
    }
}

// #########################################################################################

/**
 * Debounces a function call, ensuring it is not called too frequently.
 * @param {Object} that - The context in which the debounce is applied.
 * @param {string} keyname - The key name for the debounce.
 * @param {Function} func - The function to debounce.
 * @param {number} ms - The debounce duration in milliseconds.
 */
export function debounce(that, keyname, func, ms) {
    const map = GlobalGet(that, "debouncers");
    if (keyname in map) map[keyname](func);
    else {
        try {
            func();
            func = null;
        } catch (e) {
            throw new Error(e);
        }
        setTimeout((_) => {
            try {
                func && func();
            } catch (e) {
                throw new Error(e);
            }
            delete map[keyname];
        }, ms);
        map[keyname] = (newfunc) => (func = newfunc);
    }
}

/**
 * Throttles a function call, ensuring it is called at most once in a specified time frame.
 * @param {Object} that - The context in which the throttle is applied.
 * @param {string} keyname - The key name for the throttle.
 * @param {Function} func - The function to throttle.
 * @param {number} ms - The throttle duration in milliseconds.
 */
export function throttle(that, keyname, func, ms) {
    const map = GlobalGet(that, "throttlers");
    if (keyname in map) {
        const now = Date.now();
        if (now - map[keyname].lastRun >= ms) {
            map[keyname].lastRun = now;
            try {
                func();
            } catch (e) {
                throw new Error(e);
            }
        }
    } else {
        try {
            func();
        } catch (e) {
            throw new Error(e);
        }
        map[keyname] = {
            lastRun: Date.now(),
            func
        };
    }
}

/**
     * @param {Number} cooldown - The cooldown in milliseconds
     * @returns {Function} - Returns true if the cooldown has passed

 */
export function keyCooldown(cooldown) {
    const last = { ago: 0, key: null };
    cooldown = cooldown || 60;
    return (key) => {
        if (key && key !== last.key) {
            last.key = key;
            return true;
        }
        if (performance.now() - last.ago < cooldown) return false;
        last.ago = performance.now();
        return true;
    };
}
