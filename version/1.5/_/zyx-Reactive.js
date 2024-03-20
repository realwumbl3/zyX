import { ZyXHtml } from "./zyx-HTML.js";
import { WeakRefSet } from "./zyx-Toolbox.js";

export class zyXDomArray {
    /**
     *  @type {HTMLElement}
     */
    #container;
    /**
     *  @type {zyXArray}
     */
    #array;
    #compose;
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
    } = {}) {
        this.#container = container;
        container.__zyXArray__ = this;

        this.#compose = compose;
        this.#array = array;
        this.#range = range;
        this.#debounce = debounce;

        if (!(this.#array instanceof zyXArray)) throw new Error("zyXDomArray target must be zyXArray");
        this.#array.addListener(this.arrayModified);
    }

    arrayModified = () => {
        if (this.#debounce <= 0) return this.update();
        if (this.#pending_update) clearTimeout(this.#pending_update);
        this.#pending_update = setTimeout(() => {
            this.#pending_update = null;
            this.update();
        }, this.#debounce);
    }

    forEachInDom(cb) {
        for (const dom_element of this.#container.children) cb(dom_element);
    }

    forEach(cb) {
        for (const [dom_element, item] of this.entries()) cb([dom_element, item]);
    }

    entries() {
        return [...this.#container.children].map((dom_element) => [dom_element, this.#arrayMap.get(dom_element)]);
    }

    get(obj) {
        return this.#arrayMap.get(obj);
    }

    update() {
        this.#container.innerHTML = "";
        let target_content = Object.values(this.#array)
        if (this.#range !== null && target_content.length > Math.abs(this.#range)) {
            if (this.#range < 0) {
                target_content = target_content.slice(target_content.length + this.#range, target_content.length);
            } else {
                target_content = target_content.slice(0, this.#range);
            }
        }
        let previous = null;
        for (const item of target_content) {
            const frag_create = this.#compose(item, previous);
            let frag;
            if (frag_create instanceof ZyXHtml) {
                frag = frag_create.markup();
            } else if (frag_create?.__ZyXHtml__) {
                frag = frag_create.__ZyXHtml__.markup();
            } else {
                console.error("Can't insert non-ZyXHtml content")
                continue;
            }
            // check if HTMLTemplateElement or HTMLTemplateElement.content
            if (frag instanceof HTMLTemplateElement || frag instanceof DocumentFragment) {
                throw Error("cannot associate reactive object with a template element")
            }
            this.#container.append(frag);
            this.#arrayMap.set(frag, item);
            this.#arrayMap.set(item, frag);
            previous = { item, frag };
        }
    }

}


export class zyXArray extends Array {
    #onchange = new WeakRefSet();

    constructor(...args) {
        super(...args);
    }

    addListener(cb) {
        this.#onchange.add(cb);
    }

    removeListener(cb) {
        this.#onchange.delete(cb);
    }

    push(...args) {
        super.push(...args);
        this.#onchange.forEach((cb) => cb(this));
    }

    pop(...args) {
        super.pop(...args);
        this.#onchange.forEach((cb) => cb(this));
    }

    shift(...args) {
        super.shift(...args);
        this.#onchange.forEach((cb) => cb(this));
    }

    unshift(...args) {
        super.unshift(...args);
        this.#onchange.forEach((cb) => cb(this));
    }

    splice(...args) {
        super.splice(...args);
        this.#onchange.forEach((cb) => cb(this));
    }

    get onchange() {
        return new Proxy(this.#onchange, {
            get: () => {
                throw new Error("'onchange' is a private property and cannot be accessed directly.");
            },
        });
    }
}