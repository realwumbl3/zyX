import { makePlaceable } from "./zyX-HTML.js";
import { WeakRefSet } from "./types.js";
const dynamicLists = new WeakMap();

export function getDynamicList(container) {
  return dynamicLists.get(container);
}

export default class DynamicListDOM {
  /**
   * map between dom elements and reactive objects
   */
  #arrayMap = new WeakMap();
  /**
   *  @type {HTMLElement} - container element
   */
  #container;
  /**
   *  @type {DynamicList} - reactive dynamicList object
   */
  #list;
  /**
   * @type {Function} - compose function
   */
  #compose;
  /**
   * @type {Number} - how many elements to cache in the memoize
   */
  #range;
  /**
   * @type {Array<Number, Number>} - offset for the range of elements to display
   */
  #offset;
  /**
   * @type {Number} - debounce time
   */
  #debounce;
  /**
   * @type {Function} - callback after update
   */
  #after;

  #pending_update = null;
  constructor({
    container = container,
    list = null,
    compose = null,
    debounce = 1,
    range = null,
    after = null,
    offset = 0,
  } = {}) {
    if (!(list instanceof DynamicList)) throw new Error("list must be an instance of DynamicList");

    this.#container = container;
    this.infiniteScrolling = null;

    dynamicLists.set(container, this);

    this.#compose = compose;
    this.#after = after;

    this.#list = list;
    this.#range = range;
    this.#offset = offset;
    this.#debounce = debounce;

    this.#list.addListener(this.arrayModified);

    this.update();
  }

  arrayModified = (array, method, ...elements) => {
    if (this.#debounce <= 0) return this.update();
    if (this.#pending_update) clearTimeout(this.#pending_update);
    this.#pending_update = setTimeout(() => {
      this.#pending_update = null;
      this.update();
    }, this.#debounce);
  };

  forEach(cb) {
    for (const entry of this.entries()) cb(entry);
  }

  entries() {
    return Array.from(this.#container.children, (dom_element) => [dom_element, this.#arrayMap.get(dom_element)]);
  }

  orderedEntires() {
    return Array.from(this.orderedDomItems(), (dom_element) => [dom_element, this.#arrayMap.get(dom_element)]);
  }

  domItems() {
    return Array.from(this.#container.children, (dom_element) => this.#arrayMap.get(dom_element));
  }

  orderedDomItems() {
    return Array.from(this.#container.children).sort((a, b) => a.style.order - b.style.order);
  }

  get(obj) {
    return this.#arrayMap.get(obj);
  }

  createCompose(item, ...args) {
    if (!this.#compose) return item;
    if (typeof this.#compose.prototype === "object") {
      return new this.#compose(item, ...args);
    }
    return this.#compose(item, ...args);
  }

  getTarget() {
    if (this.#range === null) return Object.values(this.#list);
    const { start, end } = this.getRange();
    return Object.values(this.#list).slice(start, end);
  }

  getRange() {
    return {
      start: Math.max(0, this.#range[0] + this.#offset),
      end: Math.min(this.#list.length, this.#range[1] + this.#offset),
    };
  }

  getRangeHalf() {
    const range = this.getRange();
    return (range.start + range.end) / 2;
  }

  getRangeLength() {
    return this.getRange().end - this.getRange().start;
  }

  updateRange(cb) {
    const newRange = cb(this.#range);
    this.#range = [Math.max(0, newRange[0]), Math.max(0, newRange[1])];
    this.#container.setAttribute("data-range", this.#range.join(","));
    this.update();
  }

  updateOffset(cb) {
    const newOffset = cb(this.#offset);
    this.#offset = Math.max(0, newOffset);
    this.#container.setAttribute("data-offset", this.#offset);
    this.update();
  }

  removeNonArrayElements(target_content) {
    target_content = target_content || this.getTarget();
    const domItems = this.domItems();
    for (const domItem of domItems) {
      if (target_content.includes(domItem)) continue;
      this.get(domItem).remove();
    }
  }

  getCreateElements(target_content) {
    target_content = target_content || this.getTarget();
    const domItems = this.domItems();
    let index = -1;
    return target_content.map((item) => {
      index++;
      let element = this.#arrayMap.get(item);
      if (element) {
        const inDom = domItems.includes(item);
        if (!inDom) this.appendToContainer(element, item);
        return { item, element, index };
      }
      const zyXHtml = this.createCompose(item);
      element = makePlaceable(zyXHtml);
      if (element instanceof HTMLTemplateElement || element instanceof DocumentFragment) {
        throw Error("cannot associate reactive object with a template element");
      }
      this.appendToContainer(element, zyXHtml);
      this.#arrayMap.set(element, item);
      if (typeof item === "symbol" || typeof item === "object") this.#arrayMap.set(item, element);
      return { item, index, element };
    });
  }

  appendToContainer(element, item) {
    if (this.pauseScrolling) clearTimeout(this.pauseScrolling);
    this.pauseScrolling = setTimeout(() => (this.pauseScrolling = null), 20);
    this.#container.appendChild(element);
    if (this.infiniteScrolling) this.infiniteScrolling.mutationObserver.observe(element);
    try {
      item.onConnected?.(element);
    } catch (e) {
      console.error("item.onConnected error", e);
    }
  }

  update() {
    const target_content = this.getTarget();
    this.removeNonArrayElements(target_content);
    const elements = this.getCreateElements(target_content);
    for (const { element, index } of elements) element.style.order = index;
    if (this.#after) this.#after();
  }
}

export class DynamicList extends Array {
  #eventListeners = new WeakRefSet();
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
