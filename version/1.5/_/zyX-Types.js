export class WeakRefSet extends Set {
    add(ref) {
        super.add(new WeakRef(ref));
    }

    forEach(callback) {
        for (const ref of this.get()) callback(ref)
    }

    delete(ref) {
        for (const weakRef of [...super.values()]) if (weakRef.deref() === ref) return super.delete(weakRef);
        return false;
    }

    singleize(ref) {
        for (const weakRef of [...super.values()]) if (weakRef.deref() !== ref) super.delete(weakRef);
    }

    get() {
        return [...super.values()]
            .map((weakRef) => {
                const obj = weakRef.deref();
                if (obj === undefined) return !super.delete(weakRef);
                return obj;
            })
            .filter((_) => _);
    }
}

export class Fuze {
    #data;
    #randomId;
    constructor(state, data) {
        this.true = state;
        this.false = !state;
        this.#data = data;
        this.#randomId = Math.random().toString(36).substring(7);
    }

    reset(callback) {
        this.true = false;
        this.false = true;
        typeof callback === "function" && callback()
        return this
    }

    falseTrue(_false, _true, ...args) {
        this.true ? _true(...args) : _false(...args)
        return this
    }

    setTrue() {
        this.true = true
        this.false = false
        return this
    }

    setFalse() {
        this.true = false
        this.false = true
        return this
    }
}