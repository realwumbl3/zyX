import { ZyXHtml } from "./zyx-HTML.js";
import { WeakRefSet } from "./zyx-Toolbox.js";

export class ZyXDomArray {
    /**
     *  @type {HTMLElement}
     */
    #container;
    /**
     *  @type {ZyXArray}
     */
    #array;
    #compose;
    #after;
    #arrayMap = new WeakMap();
    #debounce;
    #range;
    #pending_update = null;
    constructor({
        container = container,
        array = null,
        compose = null,
        debounce = 0,
        range = null,
        after = null,
    } = {}) {
        if (!(array instanceof ZyXArray)) throw new Error("zyXDomArray target must be zyXArray");

        this.#container = container;
        container.__zyXArray__ = this;

        this.#compose = compose;
        this.#after = after;

        this.#array = array;
        this.#range = range;
        this.#debounce = debounce;

        this.#array.addListener(this.arrayModified);

        this.update();
    }

    arrayModified = () => {
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
        return [...this.#container.children].map((dom_element) => [dom_element, this.#arrayMap.get(dom_element)]);
    }

    get(obj) {
        return this.#arrayMap.get(obj);
    }

    getTarget() {
        let target_content = Object.values(this.#array)
        if (this.#range !== null && target_content.length > Math.abs(this.#range)) {
            if (this.#range < 0) {
                return target_content.slice(target_content.length + this.#range, target_content.length);
            } else {
                return target_content.slice(0, this.#range);
            }
        }
        return target_content;
    }

    createCompose(item, ...args) {
        if (!this.#compose) return item
        if (typeof this.#compose.prototype === "object") {
            return new this.#compose(item, ...args);
        }
        return this.#compose(item, ...args);
    }

    update() {
        this.#container.innerHTML = "";
        const target_content = this.getTarget();
        const prev = { item: null, element: null };
        let index = 0;
        for (const item of target_content) {
            const next = target_content[index + 1];
            const zyXHtml = this.createCompose(item, { prev, next, index });
            const element = getZyXMarkup(zyXHtml);
            if (element instanceof HTMLTemplateElement || element instanceof DocumentFragment) {
                throw Error("cannot associate reactive object with a template element")
            }
            this.#container.append(element);
            this.#arrayMap.set(element, item);
            // check if symbol or object
            if (typeof item === "symbol" || typeof item === "object") this.#arrayMap.set(item, element);
            prev.item = item;
            prev.element = element;
            index++;
        }
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

export class ZyXArray extends Array {
    #onchange = new WeakRefSet();

    addListener(cb) {
        this.#onchange.add(cb);
    }

    removeListener(cb) {
        this.#onchange.delete(cb);
    }

    constructor(...args) {
        super(...args);
    }

    clear() {
        super.splice(0, this.length);
        this.#onchange.forEach((cb) => cb(this, "clear"));
    }

    push(...args) {
        super.push(...args);
        this.#onchange.forEach((cb) => cb(this, "push", ...args));
    }

    pop(...args) {
        super.pop(...args);
        this.#onchange.forEach((cb) => cb(this, "pop", ...args));
    }

    shift(...args) {
        super.shift(...args);
        this.#onchange.forEach((cb) => cb(this, "shift", ...args));
    }

    unshift(...args) {
        super.unshift(...args);
        this.#onchange.forEach((cb) => cb(this, "unshift", ...args));
    }

    splice(...args) {
        super.splice(...args);
        this.#onchange.forEach((cb) => cb(this, "splice", ...args));
    }

}