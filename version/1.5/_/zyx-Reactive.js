
import zyX, { WeakRefSet, zyXHtml } from "zyX";


export class zyXDomArray extends HTMLElement {
    constructor(target, cb, {
        debounce = 0,
        limit = 0,
        id = null,
        classList = [],
    } = {}) {
        super();
        if (!(target instanceof zyXArray)) throw new Error("zyXDomArray target must be zyXArray");
        this.target = target;
        this.cb = cb;
        this.limit = limit;

        this.debounce = debounce;
        this.pending_update = null;

        this.target.addListener((...args) => {
            if (this.debounce <= 0) return this.update(...args);
            if (this.pending_update) clearTimeout(this.pending_update);
            this.pending_update = setTimeout(() => {
                this.pending_update = null;
                this.update(...args);
            }, this.debounce);
        });

        this.objDomWeakRef = new WeakMap();

        if (id) this.id = id;
        if (classList.length > 0) this.classList.add(...classList);
    }


    forEachInDom(cb) {
        for (const dom_element of this.children) {
            cb(dom_element);
        }
    }

    forEach(cb) {
        for (const dom_element of this.children) {
            cb([dom_element, this.objDomWeakRef.get(dom_element)]);
        }
    }

    domGet(obj) {
        return this.objDomWeakRef.get(obj);
    }

    update() {
        console.log("zyXDomArray.update", this.target);
        this.innerHTML = "";
        let added = 0;
        for (const item of Object.values(this.target)) {
            const frag_create = this.cb(item);
            let frag;
            if (frag_create instanceof zyXHtml) {
                frag = frag_create.markup();
                this.append(frag);
            } else if (frag_create?.__zyXHtml__) {
                frag = frag_create.__zyXHtml__.markup();
                this.append(frag);
            } else {
                console.error("Can't insert non-zyXHtml content")
                continue;
            }
            if (frag instanceof HTMLTemplateElement) {
                throw Error("cannot associate reactive object with a template element")
            }
            this.objDomWeakRef.set(frag, item);
            added++;
            if (this.limit > 0 && added >= this.limit) break;
        }
    }

    connectedCallback() {
        this.update();
    }

}

customElements.define("zyx-dom-array", zyXDomArray);


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