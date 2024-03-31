export class WeakRefSet extends Set {
    add(ref) {
        super.add(new WeakRef(ref));
    }

    push(ref) {
        super.add(new WeakRef(ref));
    }

    forEach(callback) {
        for (const ref of this.get()) {
            callback(ref);
        }
    }

    removeRef(_ref) {
        for (const ref of [...this.values()]) {
            if (ref.deref() === _ref) {
                this.delete(ref);
                return true;
            }
        }
    }

    get() {
        const values = [...this.values()]
        return values
            .map((weakRef) => {
                const obj = weakRef.deref();
                if (obj !== undefined) return obj;
                else return this.delete(weakRef) || false;
            })
            .filter((_) => _);
    }

    getRefs = this.get;
    delete = this.removeRef;

    clear() {
        super.clear();
    }

}
