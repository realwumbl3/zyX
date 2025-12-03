/**
 * RadioView manager and directive
 * Provides radio-style mutual exclusion between named views within a namespace.
 * Elements with `zyx-radioview="ns.view.open"` act as controls (click to switch).
 * Elements with `zyx-radioview="ns.view"` act as panels (shown only when selected).
 */

/**
 * @typedef {Object} RadioNamespace
 * @property {string|null} selected
 * @property {Map<string, Set<Element>>} controls
 * @property {Map<string, Set<Element>>} panels
 * @property {Set<Function>} listeners
 */

/**
 * @class RadioViewManager
 * @description Keeps per-instance radio-view state for multiple namespaces.
 */
export class RadioViewManager {
    /**
     * @param {any} owner - The owning ZyXHTML instance (not used externally)
     */
    constructor(owner) {
        /** @private */
        this._owner = owner;
        /** @private @type {Map<string, RadioNamespace>} */
        this._namespaces = new Map();
    }

    /** @private */
    _ensure(ns) {
        if (!this._namespaces.has(ns)) {
            this._namespaces.set(ns, {
                selected: null,
                controls: new Map(),
                panels: new Map(),
                listeners: new Set(),
            });
        }
        return this._namespaces.get(ns);
    }

    /**
     * @param {string} ns
     * @param {string} view
     * @param {Element} el
     */
    registerControl(ns, view, el) {
        const space = this._ensure(ns);
        if (!space.controls.has(view)) space.controls.set(view, new Set());
        space.controls.get(view).add(el);

        // Idempotent click binding
        if (!el.__zyx_radioview_bound__) {
            el.addEventListener("click", () => this.select(ns, view));
            el.__zyx_radioview_bound__ = true;
            el.setAttribute("role", "tab");
        }

        // Initialize selection if not set
        if (space.selected == null) {
            space.selected = view;
        }
        this._updateUI(ns);
    }

    /**
     * @param {string} ns
     * @param {string} view
     * @param {Element} el
     */
    registerPanel(ns, view, el) {
        const space = this._ensure(ns);
        if (!space.panels.has(view)) space.panels.set(view, new Set());
        space.panels.get(view).add(el);
        el.setAttribute("role", "tabpanel");

        // Initialize selection if not set (fallback to first panel)
        if (space.selected == null) {
            space.selected = view;
        }
        this._updateUI(ns);
    }

    /**
     * @param {string} ns
     * @param {string} view
     */
    select(ns, view) {
        const space = this._ensure(ns);
        if (space.selected === view) return;
        space.selected = view;
        this._updateUI(ns);
        for (const cb of space.listeners) {
            try {
                cb(view);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("RadioViewManager subscriber error:", e);
            }
        }
    }

    /**
     * @param {string} ns
     * @returns {string|null}
     */
    getSelected(ns) {
        return this._ensure(ns).selected;
    }

    /**
     * @param {string} ns
     * @param {(view: string)=>void} cb
     * @returns {() => void} unsubscribe
     */
    subscribe(ns, cb) {
        const space = this._ensure(ns);
        space.listeners.add(cb);
        return () => {
            space.listeners.delete(cb);
        };
    }

    /** @private */
    _updateUI(ns) {
        const space = this._ensure(ns);
        const selected = space.selected;

        // Panels
        for (const [view, elements] of space.panels.entries()) {
            const isActive = view === selected;
            for (const el of elements) {
                if (isActive) {
                    el.hidden = false;
                    el.style.display = "";
                } else {
                    el.hidden = true;
                    el.style.display = "none";
                }
            }
        }

        // Controls
        for (const [view, elements] of space.controls.entries()) {
            const isActive = view === selected;
            for (const el of elements) {
                if (isActive) {
                    el.classList.add("zyx-radioview-active");
                    el.setAttribute("aria-selected", "true");
                } else {
                    el.classList.remove("zyx-radioview-active");
                    el.setAttribute("aria-selected", "false");
                }
            }
        }
    }
}

/**
 * Parse the value of `zyx-radioview` attribute.
 * @param {string} raw
 * @returns {{ ns: string, view: string, isControl: boolean } | null}
 */
function parseRadioAttr(raw) {
    if (!raw || typeof raw !== "string") return null;
    const parts = raw.split(".");
    if (parts.length < 2) return null;
    const isControl = parts[2] === "open" || parts.includes("open");
    return {
        ns: parts[0],
        view: parts[1],
        isControl,
    };
}

/**
 * Directive handlers for zyX-HTML
 */
export const radioViewAttributes = {
    /**
     * @param {{ zyxhtml: any, node: Element, data: any }} ctx
     */
    "zyx-radioview": ({ zyxhtml, node }) => {
        const raw = node.getAttribute("zyx-radioview") || "";
        const parsed = parseRadioAttr(raw);
        if (!parsed) return;
        const { ns, view, isControl } = parsed;
        if (isControl) {
            zyxhtml.radioViewRegisterControl(ns, view, node);
        } else {
            zyxhtml.radioViewRegisterPanel(ns, view, node);
        }
    },
};


