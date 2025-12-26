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
     *  @type {HTMLElement} - container element (original element with zyx-live-list attribute)
     */
    #container;
    /**
     *  @type {HTMLElement} - element where list items are populated
     */
    #listToPopulate;
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
     * @type {Function|null} - optional filter function used to decide which items are rendered
     * The function receives (item, index) and should return a truthy value to include the item.
     */
    #filter;
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
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - container element that will receive rendered items
     * @param {LiveList|LiveInterp} options.list - reactive list source (or LiveVar.interp() returning a LiveList)
     * @param {Function} [options.compose] - function or class used to compose DOM/content from list items
     * @param {number} [options.debounce=1] - debounce time for reacting to list mutations
     * @param {Array<number, number>|null} [options.range=null] - [start, end] range for windowed rendering
     * @param {Function|null} [options.after=null] - callback invoked after each update
     * @param {number} [options.offset=0] - offset applied to the range window
     * @param {Function|null} [options.filter=null] - predicate (item, index) => boolean controlling which items are rendered
     */
    constructor({
        container = container,
        list = null,
        compose = null,
        debounce = 1,
        range = null,
        after = null,
        offset = 0,
        filter = null,
    } = {}) {
        if (!(list instanceof LiveList) && !(list instanceof LiveInterp)) {
            throw new Error("list must be an instance of LiveList or LiveVar.interp() (LiveInterp)");
        }

        // Check if there's a child element with container attribute
        const containerElement = container.querySelector("[container]");
        const listToPopulate = containerElement || container;

        // Track on the original element (the one with zyx-live-list attribute)
        container.liveDomList = this;
        this.#container = container;

        // Use listToPopulate element for DOM operations
        this.#listToPopulate = listToPopulate;
        this.infiniteScrolling = null;

        LiveLists.set(container, this);

        this.#compose = compose;
        this.#after = after;

        this.#list = list;
        this.#range = range;
        this.#offset = offset;
        this.#debounce = debounce;
        this.#filter = typeof filter === "function" ? filter : null;

        // Bind the array modified callback once to reuse
        this.#boundArrayModified = this.arrayModified.bind(this);

        // Setup subscription based on list type
        if (list instanceof LiveList) {
            this.#activeList = list;
            this.#activeList.subscribe(this.#boundArrayModified, container);
        } else if (list instanceof LiveInterp) {
            // Subscribe to the LiveVar.interp() changes
            this.#activeList = this.#resolveActiveList();
            this.#subscribeToActiveList();
            this.#list.reactive.subscribe(this.liveVarChanged.bind(this), container);
        }

        this.update();
    }

    get isUpdating() {
        return this.#pending_update !== null;
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
        // if (this.#debounce <= 0) return this.update();
        if (this.#pending_update) clearTimeout(this.#pending_update);
        this.#pending_update = setTimeout(() => {
            this.update();
            this.#pending_update = null;
        }, this.#debounce);
    }

    forEach(cb) {
        for (const entry of this.entries()) cb(entry);
    }

    entries() {
        return Array.from(this.#listToPopulate.children, (dom_element) => [dom_element, this.#arrayMap.get(dom_element)]);
    }

    orderedEntires() {
        return Array.from(this.orderedDomItems(), (dom_element) => [dom_element, this.#arrayMap.get(dom_element)]);
    }

    domItems() {
        return Array.from(this.#listToPopulate.children, (dom_element) => this.#arrayMap.get(dom_element));
    }

    orderedDomItems() {
        return Array.from(this.#listToPopulate.children).sort((a, b) => a.style.order - b.style.order);
    }

    get(obj) {
        return this.#arrayMap.get(obj);
    }

    solo(obj) {
        let existed = false;
        // remove all other elements from the list associated with the object
        for (const [domItem, item] of this.entries()) {
            if (item !== obj) domItem.remove();
            else existed = true;
        }
        if (!existed) {
            const element = makePlaceable(this.createCompose(obj));
            if (element instanceof HTMLTemplateElement || element instanceof DocumentFragment) {
                throw Error("cannot associate reactive object with a template element");
            }
            this.appendToContainer(element, obj);
            this.#arrayMap.set(element, obj);
            if (typeof obj === "symbol" || typeof obj === "object") this.#arrayMap.set(obj, element);
        }
        return this;
    }

    createCompose(item, ...args) {
        if (!this.#compose) return item;
        if (typeof this.#compose.prototype === "object") {
            return new this.#compose(item, ...args);
        }
        return this.#compose(item, ...args);
    }

    getTarget() {
        let target = Object.values(this.#activeList);
        if (this.#range !== null) {
            const { start, end } = this.getRange();
            target = target.slice(start, end);
        }
        if (this.#filter) {
            target = target.filter((item, index) => this.#filter(item, index));
        }
        return target;
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
     * Update the filter function used to determine which items are rendered.
     * Passing a non-function (or null) will clear the filter and render all items in range.
     * @param {Function|null} filter - predicate (item, index) => boolean
     */
    setFilter(filter) {
        this.#filter = typeof filter === "function" ? filter : null;
        this.update();
    }

    /**
     * Update the range of elements to display
     * @param {Function} cb - callback to update the range, takes the current range as an argument and returns the new range
     */
    updateRange(cb) {
        const newRange = cb(this.#range);
        this.#range = [Math.max(0, newRange[0]), Math.max(0, newRange[1])];
        this.#listToPopulate.setAttribute("data-range", this.#range.join(","));
        this.update();
    }

    shiftRange(n) {
        this.updateRange((range) => [range[0] + n, range[1] + n]);
    }

    updateOffset(cb) {
        const newOffset = cb(this.#offset);
        this.#offset = Math.max(0, newOffset);
        this.#listToPopulate.setAttribute("data-offset", this.#offset);
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
                console.error("cannot associate reactive object with a template element", {
                    element,
                    item,
                    zyXHtml,
                    target_content,
                });
                throw Error("cannot associate reactive object with a template element");
            }
            this.appendToContainer(element, zyXHtml);
            this.#arrayMap.set(element, item);
            if (typeof item === "symbol" || typeof item === "object") this.#arrayMap.set(item, element);
            return { item, index, element };
        });
    }

    appendToContainer(element, item) {
        this.#listToPopulate.appendChild(element);
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
        for (const { element, index } of elements) {
            element.style.order = index;
            element.setAttribute("list-index", index);
        }
        if (this.#after) this.#after();
    }
}
