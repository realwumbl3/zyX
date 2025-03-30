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
