// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX from "../";

import { WeakRefSet } from "./zyX-Types.js";
import { pointerEventPathContainsMatching } from "./zyX-Toolbox.js";

import * as presets from "./ZyXInput/Presets.js";

import { MomentumScroll } from "./ZyXInput/MomentumScroll.js";
import BackHandler from "./ZyXInput/Back.js";
import { timeoutLimiter } from "./zyX-Delay.js";


// #endregion

/**
 * ZyXInput - A comprehensive input handling system for web applications
 * @class
 * @description Handles keyboard, mouse, touch, and controller inputs with advanced features
 * like momentum scrolling,  and modal handling.
 */
export default class ZyXInput {
    /**
     * @param {Object} options - Configuration options
     * @param {Function} [options.customQueryFunc] - Custom query function for element selection
     * @param {Function} [options.customClearSelections] - Custom function to clear text selections
     * @param {Function} [options.onKeyPress] - Callback for key press events
     */
    constructor({ customQueryFunc, customClearSelections, onKeyPress = null } = {}) {
        this.onKeyPress = onKeyPress;
        this.customQueryFunc = customQueryFunc;
        this.customClearSelections = customClearSelections;

        // Default enabled keyboard shortcuts
        this.enabledDefaults = ["Tab", "Esc", "F5", "F11", "F12", "KeyI", "KeyC", "KeyV", "KeyX"];

        // Initialize event listeners
        this._initializeEventListeners();

        // Input state tracking
        this.mouse = { x: 0, y: 0, pointerDown: false };
        this.keyCooldown = timeoutLimiter(100);
        this.activeEvents = new WeakRefSet();
        this.openModals = new WeakRefSet();
        this.listenToController = false;

        // Input timing configurations
        this.clickOrTwoWindowMs = 350;
        this.moveTripperDist = 5;
        this.mobilePressHoldDelay = 550;

        // Back button handling
        this.backHandler = new BackHandler(this);
        this.backHandler.on(_ => this.processModalEvent(), { weight: 1000 });
    }

    /**
     * Initialize all event listeners
     * @private
     */
    _initializeEventListeners() {
        // Keyboard events
        document.addEventListener("keypress", (e) => this.keyEvent("keypress", e));
        document.addEventListener("keydown", (e) => this.keyEvent("keydown", e));
        document.addEventListener("keyup", (e) => this.keyEvent("keyup", e));

        // Mouse/Touch events
        document.addEventListener("pointermove", e => this._updateMousePosition(e));
        document.addEventListener("pointerdown", e => this._updateMousePosition(e, true));
        document.addEventListener("pointerup", e => this.mouse.pointerDown = false);
        document.addEventListener("pointerleave", e => this.mouse.pointerDown = false);

        // Context menu handling
        document.addEventListener("contextmenu", e => {
            if (e.shiftKey || pointerEventPathContainsMatching(e, "[can-contextmenu]")) return false;
            nullifyEvent(e);
        });

        // Drag handling
        this.on(document).dragstart((e) => { });
    }

    /**
     * Update mouse position and state
     * @private
     * @param {PointerEvent} e - The pointer event
     * @param {boolean} [isDown=false] - Whether this is a pointer down event
     */
    _updateMousePosition(e, isDown = false) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        if (isDown) {
            this.mouse.pointerDown = true;
        }
    }

    /**
     * Create event handlers for an element
     * @param {Element} element - The target element
     * @returns {Proxy} A proxy object with event handling methods
     */
    on(element) {
        return new Proxy(presets, {
            get: (o, k) => this.customEventHandlers(element, k)
        });
    }

    /**
     * Handle custom event types
     * @private
     * @param {Element} element - The target element
     * @param {string} funcname - The event function name
     * @returns {Function} The event handler function
     */
    customEventHandlers(element, funcname) {
        if (presets[funcname]) {
            return (...args) => presets[funcname].bind(this)(element, ...args);
        }

        switch (funcname) {
            case "pointerdown":
            case "pointerup":
            case "dragstart":
                return (callback) => {
                    element.addEventListener(funcname, (e) => {
                        const b4 = this.beforePointerEvent(funcname, e);
                        callback(e, b4);
                    });
                };
            default:
                throw new Error(`Event function ${funcname}(elem, ...args) not found in ZyXInput.presets`);
        }
    }

    /**
     * Initialize momentum scrolling for a container
     * @param {Element} container - The scrollable container
     * @param {Object} opts - Momentum scroll options
     * @returns {MomentumScroll} The momentum scroll instance
     */
    bindMomentumScroll(container, opts) {
        return new MomentumScroll(this, container, opts);
    }

    /**
     * Query elements in the application
     * @param {string} query - The query selector
     * @returns {NodeList} The matching elements
     */
    queryApplication(query) {
        return this?.customQueryFunc?.(query) || document.querySelectorAll(query);
    }

    /**
     * Clear all text selections
     */
    clearAllSelections() {
        this?.customClearSelections?.() || window.getSelection().removeAllRanges();
    }

    /**
     * Clear all active events
     */
    nullAllEvents() {
        this.activeEvents.clear();
    }

    /**
     * Make an event the only active event
     * @param {Event} kingevent - The event to make king
     */
    kingOfTheStack(kingevent, cb) {
        for (const event of this.activeEvents.get()) {
            if (event !== kingevent) {
                event.setFalse();
            }
        }
        cb?.();
        this.nullAllEvents();
        return;
    }

    /**
     * Process pointer events before they are handled
     * @private
     * @param {string} event - The event type
     * @param {Event} e - The event object
     * @returns {boolean} Whether to allow the event to proceed
     */
    beforePointerEvent(event, e) {
        switch (event) {
            case "pointerDownMoveUp":
            case "pointerdown":
            case "dragstart":
            case "custom-click":
            case "clickone":
            case "clickortwo":
                if (this.processModalEvent(e)) return false;
            default:
                return true;
        }
    }

    /**
     * Process modal-related events
     * @private
     * @param {Event} e - The event object
     * @returns {boolean} Whether the event was handled by a modal
     */
    processModalEvent(e) {
        const modals = this.openModals.get();
        if (modals.length < 0) return true;

        if (modals.length > 0) {
            if (e && pointerEventPathContainsMatching(e, "[is-modal]")) return false;
            modals.forEach(modal => modal.clickedOutside(modal));
            this.nullAllEvents();
            e?.stopPropagation();
            e?.stopImmediatePropagation();
            this.openModals.clear();
            return true;
        }
        return false;
    }

    /**
     * Isolate events within a modal container
     * @param {Element} node - The modal container
     * @param {Function} clickedOutside - Callback for clicks outside the modal
     */
    isolateEventWithinContainer(node, clickedOutside) {
        this.openModals.add(node);
        node.setAttribute("is-modal", "");
        node.clickedOutside = clickedOutside.bind(node);
    }

    /**
     * Unisolate events within a modal container
     * @param {Element} node - The modal container
     */
    unisolateEventWithinContainer(node) {
        this.openModals.delete(node);
        node.removeAttribute("is-modal");
    }

    /**
     * Create a move detection system with deadzone
     * @param {Object} options - Move detection options
     * @returns {Object} The move detection system
     */
    moveTripper({ startX, startY, deadzone } = {}) {
        const { moveFuse, check } = this.deadzone({ startX, startY, deadzone });
        document.addEventListener("pointermove", check);
        document.addEventListener("pointerup", () => document.removeEventListener("pointermove", check), { once: true });
        return { moveFuse, check };
    }

    /**
     * Create a deadzone system for move detection
     * @private
     * @param {Object} options - Deadzone options
     * @returns {Object} The deadzone system
     */
    deadzone({
        startX,
        startY,
        deadzone = this.moveTripperDist,
        moveFuse = new Fuse()
    } = {}) {
        return {
            moveFuse,
            check: (e) => {
                Math.hypot(e.clientX - startX, e.clientY - startY) > deadzone && moveFuse.setTrue();
                return moveFuse.true;
            }
        };
    }

    /**
     * Handle keyboard and controller input events
     * @private
     * @param {string} event - The event type
     * @param {KeyboardEvent} e - The event object
     */
    async keyEvent(event, e) {
        try {
            if (!this.keyCooldown() || !("key" in e)) return;

            if (
                e.ctrlKey ||
                e.metaKey ||
                this.queryApplication("input:focus,textarea:focus").length > 0
            ) return false;

            if (
                !e.joy && // Don't prevent default for xbox controller
                !this.enabledDefaults.includes(e.code) // Don't prevent default for enabled keys
            ) {
                e.preventDefault();
                e.stopPropagation();
            }

            this?.onKeyPress?.(event, e);
        } catch (err) {
            console.error("[Key Event Error]", { event, e, error: err });
            throw err;
        }
    }

    /**
     * Handle Xbox controller input events
     * @param {Object} data - The controller event data
     */
    socketXinputEvent(data) {
        if (!this.listenToController) return;
        const buttonState = data.pressed === 1 ? "keydown" : "keyup";
        this.keyEvent(buttonState, { joy: true, key: XboxControllerMap[data.button] });
    }
}


/**
 * Prevent default behavior and stop event propagation
 * @param {Event} e - The event to nullify
 * @returns {boolean} false
 */
export function nullifyEvent(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
}

/**
 * A simple state management class for boolean values
 * @class
 */
export class Fuse {
    /**
     * @param {boolean} [state=false] - Initial state
     */
    constructor(state = false) {
        this.true = state;
        this.false = !state;
    }

    /**
     * Reset the state and optionally run a callback
     * @param {Function} [callback] - Optional callback to run after reset
     * @returns {Fuse} This instance
     */
    reset(callback) {
        this.true = false;
        this.false = true;
        typeof callback === "function" && callback();
        return this;
    }

    /**
     * Execute different callbacks based on state
     * @param {Function} _false - Callback for false state
     * @param {Function} _true - Callback for true state
     * @param {...*} args - Arguments to pass to callbacks
     * @returns {Fuse} This instance
     */
    falseTrue(_false, _true, ...args) {
        this.true ? _true(...args) : _false(...args);
        return this;
    }

    /**
     * Set state to true
     * @returns {Fuse} This instance
     */
    setTrue() {
        this.true = true;
        this.false = false;
        return this;
    }

    /**
     * Set state to false
     * @returns {Fuse} This instance
     */
    setFalse() {
        this.true = false;
        this.false = true;
        return this;
    }
}

/**
 * Xbox controller button mapping
 * @type {Object.<number, string>}
 */
export const XboxControllerMap = {
    1: "x-uppad",
    2: "x-downpad",
    3: "x-leftpad",
    4: "x-rightpad",
    5: "x-menu",
    6: "x-start",
    7: "x-rightjoy",
    8: "x-leftjoy",
    9: "x-leftbumper",
    10: "x-rightbumper",
    13: "x-A",
    14: "x-X",
    15: "x-B",
    16: "x-Y",
};
