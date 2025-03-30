import { WeakRefSet } from "./types.js";

export class DynamicList extends Array {
  #eventListeners;

  constructor(initialValue) {
    if (initialValue instanceof Array) super(...initialValue);
    else super();

    this.#eventListeners = new WeakRefSet();
  }

  getProxy() {
    return new Proxy(this, {
      set: (target, property, value, receiver) => {
        const result = Reflect.set(target, property, value, receiver);
        if (typeof property === "string" && !isNaN(property)) {
          const eventListeners = this.#eventListeners.get(target);
          eventListeners.forEach((cb) => cb(this, "set", property, value));
        }
        return result;
      },
      get: (target, property, receiver) => {
        const result = Reflect.get(target, property, receiver);
        if (typeof result === "function") return result.bind(target);
        return result;
      },
    });
  }

  addListener(cb) {
    this.#eventListeners.add(cb);
  }

  removeListener(cb) {
    this.#eventListeners.delete(cb);
  }

  callListeners(method, ...args) {
    this.#eventListeners.forEach((cb) => cb(this, method, ...args));
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
    return this;
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
    if (!(array instanceof DynamicList)) throw new Error("zyXArray.swap() requires an instance of DynamicList");
    this.clear();
    this.push(...array);
    return this;
  }

  insert(index, ...items) {
    this.splice(index, 0, ...items);
    return this;
  }
}
