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

export class ZyXSlots {
    constructor({ container, zyxreactive }) {}

}

