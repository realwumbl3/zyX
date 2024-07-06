import { ZyXHtml } from "./zyX-HTML.js";
import { WeakRefSet, ZyXDeque } from "./zyX-Types.js";

import { debugCheckpoint, debugStart, debugLog } from "./zyX-Debugger.js";

const zyXDomArrays = new WeakMap();

export function getDomArray(container) {
    return zyXDomArrays.get(container);
}

export class ZyXDomArray {
    /**
    * map between dom elements and reactive objects
    */
    #arrayMap = new WeakMap();
    /**
     *  @type {HTMLElement} - container element
     */
    #container;
    /**
     *  @type {ZyXArray} - reactive array
     */
    #array;
    /**
    * @type {Function} - compose function
    */
    #compose;
    /**
    * @type {Number} - how many elements to cache in the memoize
    */
    #memoize;
    /**
    * @type {ZyXDeque<HTMLElement>} - memoized elements
    */
    #memoized;
    /**
    * @type {Array<Number, Number>} - range of elements to display
    */
    #range;
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
        array = null,
        compose = null,
        debounce = 1,
        range = null,
        after = null,
        memoize = 0
    } = {}) {
        if (!(array instanceof ZyXArray)) throw new Error("zyXDomArray target must be zyXArray");

        this.#container = container;

        zyXDomArrays.set(container, this);

        this.#compose = compose;
        this.#after = after;

        this.#array = array;
        this.#range = range;
        this.#debounce = debounce;

        this.#memoize = memoize;
        this.#memoized = new ZyXDeque(memoize);

        this.#array.addListener(this.arrayModified);

        this.update();
    }

    arrayModified = (array, method, ...elements) => {
        if (this.#debounce <= 0) return this.update();
        if (this.#pending_update) clearTimeout(this.#pending_update);
        this.#pending_update = setTimeout(() => {
            this.#pending_update = null;
            this.update();
        }, this.#debounce);
    }

    forEach(cb) {
        for (const entry of this.entries()) cb(entry);
    }

    entries() {
        return Array.from(this.#container.children, (dom_element) => [dom_element, this.#arrayMap.get(dom_element)]);
    }

    domItems() {
        return Array.from(this.#container.children, (dom_element) => this.#arrayMap.get(dom_element));
    }

    get(obj) {
        return this.#arrayMap.get(obj);
    }

    createCompose(item, ...args) {
        if (!this.#compose) return item
        if (typeof this.#compose.prototype === "object") {
            return new this.#compose(item, ...args);
        }
        return this.#compose(item, ...args);
    }

    getTarget() {
        const target_content = Object.values(this.#array)
        if (this.#range === null) return target_content;
        const slice = target_content.slice(this.#range[0], this.#range[1]);
        return slice;
    }

    updateRange(cb) {
        const newRange = cb(this.#range);
        this.#range = [Math.max(0, newRange[0]), Math.max(0, newRange[1])];
        console.log(this.#range);
        this.update();
    }

    removeNonArrayElements(target_content) {
        target_content = target_content || this.getTarget();
        const domItems = this.domItems();
        for (const domItem of domItems) {
            if (target_content.includes(domItem)) continue
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
                return { item, element, index }
            }
            const zyXHtml = this.createCompose(item);
            element = getZyXMarkup(zyXHtml);
            if (element instanceof HTMLTemplateElement || element instanceof DocumentFragment) {
                throw Error("cannot associate reactive object with a template element")
            }
            this.appendToContainer(element, zyXHtml);
            this.#arrayMap.set(element, item);
            if (typeof item === "symbol" || typeof item === "object") this.#arrayMap.set(item, element);
            return { item, index, element }
        });
    }

    appendToContainer(element, item) {
        this.#container.appendChild(element);
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

function getZyXMarkup(composed) {
    if (composed instanceof ZyXHtml) {
        return composed.markup();
    } else if (composed?.__ZyXHtml__) {
        return composed.__ZyXHtml__.markup();
    }
}

const EVENTLISTENERS = new WeakMap();

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

    // array methods
    push(...args) {
        super.push(...args);
        this.getEventListeners().forEach((cb) => cb(this, "push", ...args));
        return this;
    }

    pop(...args) {
        super.pop(...args);
        this.getEventListeners().forEach((cb) => cb(this, "pop", ...args));
        return this;
    }

    shift(...args) {
        super.shift(...args);
        this.getEventListeners().forEach((cb) => cb(this, "shift", ...args));
        return this;
    }

    unshift(...args) {
        super.unshift(...args);
        this.getEventListeners().forEach((cb) => cb(this, "unshift", ...args));
        return this;
    }

    splice(...args) {
        super.splice(...args);
        this.getEventListeners().forEach((cb) => cb(this, "splice", ...args));
        return this;
    }

    // extra methods
    update() {
        this.getEventListeners().forEach((cb) => cb(this, "update"));
        return this
    }

    clear() {
        super.splice(0, this.length);
        this.getEventListeners().forEach((cb) => cb(this, "clear"));
        return this;
    }

    remove(item) {
        const index = this.indexOf(item);
        if (index !== -1) this.splice(index, 1);
        return this;
    }

    sort(scb) {
        super.sort(scb);
        this.getEventListeners().forEach((cb) => cb(this, "sort"));
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