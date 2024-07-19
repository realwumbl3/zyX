const EVENTLISTENERS = new WeakMap();

export class EventHandlerMapObject {
    constructor() {
        EVENTLISTENERS.set(this, new WeakRefSet());
    }
    getEventListeners() {
        return EVENTLISTENERS.get(this);
    }
    addListener(cb) {
        this.getEventListeners().add(cb);
    }
    removeListener(cb) {
        this.getEventListeners().delete(cb);
    }
}

export class WeakRefSet extends Set {
    add(ref) {
        super.add(new WeakRef(ref));
    }

    forEach(callback) {
        for (const weakRef of super.values()) {
            const ref = weakRef.deref();
            if (ref !== undefined) callback(ref);
        }
    }

    delete(ref) {
        for (const weakRef of super.values()) {
            if (weakRef.deref() === ref) {
                return super.delete(weakRef);
            }
        }
        return false;
    }

    singleize(ref) {
        for (const weakRef of super.values()) {
            if (weakRef.deref() !== ref) {
                super.delete(weakRef);
            }
        }
    }

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
}


export class ZyXDeque extends Array {
    constructor(limit) {
        super();
        this.limit = limit;
    }

    // Add an element to the front of the deque
    prepend(item) {
        if (this.length >= this.limit) {
            this.pop(); // Remove the last item if the limit is reached
        }
        this.unshift(item);
    }

    // Add an element to the end of the deque
    append(item) {
        if (this.length >= this.limit) {
            this.shift(); // Remove the first item if the limit is reached
        }
        this.push(item);
    }

    // Remove and return the first element from the deque
    popleft() {
        if (this.length === 0) {
            throw new Error("Deque is empty");
        }
        return this.shift();
    }

    // Remove and return the last element from the deque
    popright() {
        if (this.length === 0) {
            throw new Error("Deque is empty");
        }
        return this.pop();
    }
}



export class ZyXArray extends Array {
    constructor(...args) {
        super(...args);
        EVENTLISTENERS.set(this, new WeakRefSet());
    }

    getProxy() {
        return new Proxy(this, {
            set: (target, property, value, receiver) => {
                const result = Reflect.set(target, property, value, receiver);
                if (typeof property === 'string' && !isNaN(property)) {
                    const eventListeners = EVENTLISTENERS.get(target);
                    eventListeners.forEach((cb) => cb(this, "set", property, value));
                }
                return result;
            },
            get: (target, property, receiver) => {
                const result = Reflect.get(target, property, receiver);
                if (typeof result === 'function') return result.bind(target);
                return result;
            }
        });
    }

    // event listeners
    getEventListeners() {
        return EVENTLISTENERS.get(this);
    }

    addListener(cb) {
        this.getEventListeners().add(cb);
    }

    removeListener(cb) {
        this.getEventListeners().delete(cb);
    }

    callListeners(method, ...args) {
        this.getEventListeners().forEach((cb) => cb(this, method, ...args));
        return this;
    }

    // array methods
    push(...args) {
        super.push(...args);
        this.callListeners("push", ...args);
        return this;
    }

    pop(...args) {
        super.pop(...args);
        this.callListeners("pop", ...args);
        return this;
    }

    shift(...args) {
        super.shift(...args);
        this.callListeners("shift", ...args);
        return this;
    }

    unshift(...args) {
        super.unshift(...args);
        this.callListeners("unshift", ...args);
        return this;
    }

    splice(...args) {
        super.splice(...args);
        this.callListeners("splice", ...args);
        return this;
    }

    // extra methods
    update() {
        this.callListeners("update");
        return this
    }

    clear() {
        super.splice(0, this.length);
        this.callListeners("clear");
        return this;
    }

    remove(item) {
        const index = this.indexOf(item);
        if (index !== -1) this.splice(index, 1);
        return this;
    }

    sort(scb) {
        super.sort(scb);
        this.callListeners("sort", scb);
        return this;
    }

    swap(array) {
        if (!(array instanceof Array)) throw new Error("zyXArray.swap() requires an array");
        this.clear();
        this.push(...array);
        return this;
    }

    insert(index, ...items) {
        this.splice(index, 0, ...items);
        return this;
    }
}

// TODO: ZyXObject
export class ZyXObject extends Object { }

export class ZyXSlots extends EventHandlerMapObject {
    constructor({ container, zyxreactive }) { }

}

