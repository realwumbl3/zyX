import { makePlaceable } from "./zyX-HTML.js";
import { LiveList } from "./zyX-LiveTypes.js";
import { LiveInterp } from "./zyX-LiveInterp.js";

const LiveLists = new WeakMap();

export function getLiveList(container) {
    return LiveLists.get(container);
}

export const processLiveDomListAttributes = {
    "zyx-live-list": ({ node, data }) => new LiveDomList({ container: node, ...data }),
};

export default class LiveDomList {
    get startIndex() {
        return this.#range[0];
    }
    get endIndex() {
        return this.#range[1];
    }

    /**
     * map between dom elements and reactive objects
     */
    #arrayMap = new WeakMap();
    /**
     *  @type {HTMLElement} - container element
     */
    #container;
    /**
     *  @type {LiveList|LiveInterp} - reactive LiveList object or LiveVar.interp() that returns LiveList
     */
    #list;
    /**
     *  @type {LiveList} - current active LiveList (resolved from #list)
     */
    #activeList;
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
    /**
     * @type {Function} - bound callback for array modifications
     */
    #boundArrayModified;

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
        if (!(list instanceof LiveList) && !(list instanceof LiveInterp)) {
            throw new Error("list must be an instance of LiveList or LiveVar.interp() (LiveInterp)");
        }

        container.liveDomList = this;

        this.#container = container;
        this.infiniteScrolling = null;

        LiveLists.set(container, this);

        this.#compose = compose;
        this.#after = after;

        this.#list = list;
        this.#range = range;
        this.#offset = offset;
        this.#debounce = debounce;

        // Bind the array modified callback once to reuse
        this.#boundArrayModified = this.arrayModified.bind(this);

        // Setup subscription based on list type
        if (list instanceof LiveList) {
            this.#activeList = list;
            this.#activeList.subscribe(this.#boundArrayModified, this.#container);
        } else if (list instanceof LiveInterp) {
            // Subscribe to the LiveVar.interp() changes
            this.#activeList = this.#resolveActiveList();
            this.#subscribeToActiveList();
            this.#list.reactive.subscribe(this.liveVarChanged.bind(this), this.#container);
        }

        this.update();
    }

    #resolveActiveList() {
        if (this.#list instanceof LiveList) {
            return this.#list;
        } else if (this.#list instanceof LiveInterp) {
            const result = this.#list.interprate();

            // If the interp callback returns nothing, show no elements
            if (result == null || result === undefined) {
                return new LiveList([]);
            }

            // If it returns something but it's not a LiveList, throw error
            if (!(result instanceof LiveList)) {
                throw new Error("LiveVar.interp() callback must return a LiveList instance or null/undefined");
            }

            return result;
        }
        throw new Error("Invalid list type");
    }

    #subscribeToActiveList() {
        if (this.#activeList) {
            this.#activeList.subscribe(this.#boundArrayModified, this.#container);
        }
    }

    #unsubscribeFromActiveList() {
        if (this.#activeList) {
            this.#activeList.removeListener(this.#boundArrayModified);
        }
    }

    liveVarChanged() {
        // Unsubscribe from old list
        this.#unsubscribeFromActiveList();

        // Resolve new active list
        this.#activeList = this.#resolveActiveList();

        // Subscribe to new list
        this.#subscribeToActiveList();

        // Update DOM
        this.update();
    }

    arrayModified(array, method, ...elements) {
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
        if (!this.#compose) return item;
        if (typeof this.#compose.prototype === "object") {
            return new this.#compose(item, ...args);
        }
        return this.#compose(item, ...args);
    }

    getTarget() {
        if (this.#range === null) return Object.values(this.#activeList);
        const { start, end } = this.getRange();
        return Object.values(this.#activeList).slice(start, end);
    }

    getRange() {
        return {
            start: Math.max(0, this.#range[0] + this.#offset),
            end: Math.min(this.#activeList.length, this.#range[1] + this.#offset),
        };
    }

    getRangeHalf() {
        const range = this.getRange();
        return (range.start + range.end) / 2;
    }

    getRangeLength() {
        return this.getRange().end - this.getRange().start;
    }

    /**
     * Update the range of elements to display
     * @param {Function} cb - callback to update the range, takes the current range as an argument and returns the new range
     */
    updateRange(cb) {
        const newRange = cb(this.#range);
        this.#range = [Math.max(0, newRange[0]), Math.max(0, newRange[1])];
        this.#container.setAttribute("data-range", this.#range.join(","));
        this.update();
    }

    shiftRange(n) {
        this.updateRange((range) => [range[0] + n, range[1] + n]);
    }

    updateOffset(cb) {
        const newOffset = cb(this.#offset);
        this.#offset = Math.max(0, newOffset);
        this.#container.setAttribute("data-offset", this.#offset);
        this.update();
    }

    removeNonArrayElements(target_content) {
        target_content = target_content || this.getTarget();
        const domItems = this.entries();
        for (const [domItem, item] of domItems) {
            if (target_content.includes(item)) continue;
            domItem.remove();
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
