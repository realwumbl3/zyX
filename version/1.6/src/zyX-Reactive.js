import { getZyXMarkup } from "./zyX-HTML.js";
import { WeakRefSet, ZyXDeque, ZyXArray, ZyXObject } from "./zyX-Types.js";

import { html } from "./zyX-HTML.js";

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
     *  @type {ZyXArray} - reactive zyxactive object
     */
    #zyxactive;
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
        zyxactive = null,
        compose = null,
        debounce = 1,
        range = null,
        after = null,
        memoize = 0,
        offset = 0
    } = {}) {
        if (!(zyxactive instanceof ZyXArray || zyxactive instanceof ZyXObject)) throw new Error("zyxactive must be an instance of either ZyXArray or ZyXObject");

        this.#container = container;
        this.infiniteScrolling = null;

        zyXDomArrays.set(container, this);

        this.#compose = compose;
        this.#after = after;

        this.#zyxactive = zyxactive;
        this.#range = range;
        this.#offset = offset;
        this.#debounce = debounce;

        this.#memoize = memoize;
        this.#memoized = new ZyXDeque(memoize);

        this.#zyxactive.addListener(this.arrayModified);

        this.update();
        this.pauseScrolling = false;
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
        if (!this.#compose) return item
        if (typeof this.#compose.prototype === "object") {
            return new this.#compose(item, ...args);
        }
        return this.#compose(item, ...args);
    }

    getTarget() {
        if (this.#range === null) return Object.values(this.#zyxactive);
        const { start, end } = this.getRange();
        return Object.values(this.#zyxactive).slice(start, end);
    }

    getRange() {
        return { start: Math.max(0, this.#range[0] + this.#offset), end: Math.min(this.#zyxactive.length, this.#range[1] + this.#offset) };
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

    setupInfiniteScrolling() {
        const TOP_UP = 1;
        const BOT_DOWN = 2;
        const context = {
            direction: null,
            scrollTop: 0
        }
        this.#container.addEventListener("scroll", () => {
            context.direction = this.#container.scrollTop > context.scrollTop ? BOT_DOWN : TOP_UP;
            context.scrollTop = this.#container.scrollTop;
        });
        const mutationObserver = new IntersectionObserver((intersections) => {
            // debugIntersections(intersections);

            const icount = intersections.length;
            if (icount >= this.#range[1]) return console.log("range intersection reached");
            const intersectings = intersections.filter((intersection) => intersection.isIntersecting);
            if (intersectings.length === 0) return;
            const count = intersectings.length;
            const topOrBottom = intersections[0].boundingClientRect.top > 0 ? BOT_DOWN : TOP_UP;
            const orderedItems = this.orderedDomItems();
            const rangeHalf = this.#container.children.length / 2;
            const targetItem = topOrBottom === BOT_DOWN ? intersections[0].target : intersections[count - 1].target;
            const targetItemIndex = orderedItems.indexOf(targetItem);
            // console.log({
            //     count,
            //     topOrBottom: topOrBottom === BOT_DOWN ? "down" : "up",
            //     rangeHalf,
            //     targetItem,
            //     targetItemIndex
            // });
            if (topOrBottom === BOT_DOWN && targetItemIndex >= rangeHalf) {
                this.updateOffset((offset) => offset + count);
            }
            if (topOrBottom === TOP_UP && targetItemIndex <= rangeHalf) {
                this.updateOffset((offset) => offset - count);
            }
        }, {
            rootMargin: "0px",
            root: this.#container,
            threshold: 0.5
        });
        this.infiniteScrolling = { mutationObserver, context }
        return this.infiniteScrolling;
    }

    setupScrollEventListener() {
        const TOP_UP = 1;
        const BOT_DOWN = 2;
        const context = {
            direction: null,
            scrollTop: 0
        }
        this.#container.addEventListener("scroll", () => {
            context.direction = this.#container.scrollTop > context.scrollTop ? BOT_DOWN : TOP_UP;
            context.scrollTop = this.#container.scrollTop;
            context.scrollBottom = this.#container.scrollTop + this.#container.clientHeight;


        });

        return;
    }

}


function debugIntersections(intersections) {
    for (const intersection of intersections) {
        for (const item of [...intersection.target.querySelectorAll(".intersectionData")]) item.remove();
        html`
                    <div class="intersectionData">
                        <div>isIntersecting: ${intersection.isIntersecting || "false"}</div>
                        <div>intersectionRatio: ${intersection.intersectionRatio}</div>
                        <div>time: ${intersection.time}</div>
                        <div class="Row">
                            <div>boundingClientRect:</div>
                            <div>top: ${intersection.boundingClientRect.top}</div>
                            <div>bottom: ${intersection.boundingClientRect.bottom}</div>
                            <div>left: ${intersection.boundingClientRect.left}</div>    
                            <div>right: ${intersection.boundingClientRect.right}</div>      
                            <div>width: ${intersection.boundingClientRect.width}</div>      
                            <div>height: ${intersection.boundingClientRect.height}</div>            
                        </div>
                        <div class="Row">
                            <div>intersectionRect:</div>
                            <div>top: ${intersection.intersectionRect.top}</div>
                            <div>bottom: ${intersection.intersectionRect.bottom}</div>
                            <div>left: ${intersection.intersectionRect.left}</div>    
                            <div>right: ${intersection.intersectionRect.right}</div>      
                            <div>width: ${intersection.intersectionRect.width}</div>      
                            <div>height: ${intersection.intersectionRect.height}</div>
                        </div>
                    </div>
                    `.const()
            .appendTo(intersection.target);
    }
}