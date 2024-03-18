import zyX, { WeakRefSet, ZyXHtml } from "zyX";

export class zyXDomArray extends HTMLElement {
    constructor(target, cb, {
        debounce = 0,
        range = null,
        id = null,
        classList = []
    } = {}) {
        super();

        if (!(target instanceof zyXArray)) throw new Error("zyXDomArray target must be zyXArray");
        this.target = target;
        this.cb = cb;

        this.range = range;
        this.debounce = debounce;

        this.pending_update = null;

        this.target.addListener(this.targetCallback);

        this.objDomWeakRef = new WeakMap();

        if (id) this.id = id;
        if (classList.length > 0) this.classList.add(...classList);
    }

    targetCallback = () => {
        if (this.debounce <= 0) return this.update();
        if (this.pending_update) clearTimeout(this.pending_update);
        this.pending_update = setTimeout(() => {
            this.pending_update = null;
            this.update();
        }, this.debounce);
    }

    forEachInDom(cb) {
        for (const dom_element of this.children) cb(dom_element);
    }

    forEach(cb) {
        for (const dom_element of this.children) cb([dom_element, this.objDomWeakRef.get(dom_element)]);
    }

    domGet(obj) {
        return this.objDomWeakRef.get(obj);
    }

    update() {
        this.innerHTML = "";
        let target_content = Object.values(this.target)

        if (this.range !== null && target_content.length > Math.abs(this.range)) {
            if (this.range < 0) {
                target_content = target_content.slice(target_content.length + this.range, target_content.length);
            } else {
                target_content = target_content.slice(0, this.range);
            }
        }

        for (const item of target_content) {
            const frag_create = this.cb(item);
            let frag;
            if (frag_create instanceof ZyXHtml) {
                console.log("instanceof ZyXHtml", frag_create);
                frag = frag_create.markup();
            } else if (frag_create?.__ZyXHtml__) {
                console.log("binded with __ZyXHtml__", frag_create.__ZyXHtml__);
                frag = frag_create.__ZyXHtml__.markup();
            } else {
                console.error("Can't insert non-ZyXHtml content")
                continue;
            }
            // check if HTMLTemplateElement or HTMLTemplateElement.content
            if (frag instanceof HTMLTemplateElement || frag instanceof DocumentFragment) {
                throw Error("cannot associate reactive object with a template element")
            }
            this.append(frag);
            this.objDomWeakRef.set(frag, item);
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