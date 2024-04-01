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
