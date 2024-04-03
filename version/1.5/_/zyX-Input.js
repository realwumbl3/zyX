// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { pointerEventPathContains, WeakRefSet } from "../";

import * as functions from "./ZyXInput/Functions.js";
export { functions }

import * as presets from "./ZyXInput/Presets.js";

import { MomentumScroll } from "./ZyXInput/Scrolling.js";
import BackHandler from "./ZyXInput/Back.js";
import { Focusable, FocusController } from "./zyX-Focusables.js";
import { XboxControllerMap } from "./ZyXInput/Functions.js";
// #endregion

export default class ZyXInput {
    constructor({ customQueryFunc, customClearSelections } = {}) {
        this.customQueryFunc = customQueryFunc;
        this.customClearSelections = customClearSelections

        this.focus = new FocusController();

        this.enabledDefaults = ["Tab", "Esc", "F5", "F11", "F12", "KeyI", "KeyC", "KeyV", "KeyX"];

        document.addEventListener("keypress", (e) => this.keyEvent("keypress", e));
        document.addEventListener("keydown", (e) => this.keyEvent("keydown", e));
        document.addEventListener("keyup", (e) => this.keyEvent("keyup", e));

        this.activeEvents = new WeakRefSet();
        this.openModals = new WeakRefSet();

        // // IN ALPHADEK, WE DO OUR OWN DARN CLICKS YA HEAR ME??
        document.addEventListener("click", e => !this.beforePointerEvent("default-click", e) && nullifyEvent(e))

        this.mouse = { x: 0, y: 0, pointerDown: false };
        document.addEventListener("pointermove", e => (this.mouse.x = e.clientX, this.mouse.y = e.clientY))
        document.addEventListener("pointerdown", e => (this.mouse.x = e.clientX, this.mouse.y = e.clientY, this.mouse.pointerDown = true))
        document.addEventListener("pointerup", e => this.mouse.pointerDown = false)
        document.addEventListener("pointerleave", e => this.mouse.pointerDown = false)

        document.addEventListener("contextmenu", e => {
            if (e.shiftKey || pointerEventPathContains(e, "[context-menuable]")) return false
            nullifyEvent(e)
        })

        this.on(document).dragstart((e) => { });

        this.listenToController = false;

        this.clickOrTwoWindowMs = 350;
        this.moveTripperDist = 5;
        this.mobilePressHoldDelay = 550;

        this.backHandler = new BackHandler(this);

        this.backHandler.on(_ => {
            return this.processModalEvent()
        }, { weight: 1000 })
    }

    /**
     * 
     * @param {*} element 
     * @returns {presets}
     */
    on(element) {
        return new Proxy(presets, { get: (o, k) => this.customEventHandlers(element, k) });
    }

    customEventHandlers(element, funcname) {
        if (presets[funcname]) {
            return (...args) => presets[funcname].bind(this)(element, ...args);
        }
        switch (funcname) {
            case "pointerdown":
            case "pointerup":
            case "dragstart":
                return (callback) => {
                    element.addEventListener(funcname, (e) => { const b4 = this.beforePointerEvent(funcname, e); callback(e, b4) });
                }
            default:
                throw new Error(`Event function ${funcname}(elem, ...args) not found in ZyXInput.presets`);
        }

    }

    setupMomentumScroll(container) {
        return new MomentumScroll(this, container);
    }

    queryApplication(query) {
        return this?.customQueryFunc?.(query) || document.querySelectorAll(query);
    }

    clearAllSelections() {
        this?.customClearSelections?.() || window.getSelection().removeAllRanges();
    }

    nullAllEvents() {
        this.activeEvents.clear();
    }

    kingOfTheStack(kingevent) {
        // console.log(kingevent.randomId, "King of the stack b4", this.activeEvents.get());
        this.activeEvents.singleize(kingevent);
        // console.log(kingevent.randomId, "King of the stack 4t", this.activeEvents.get());
    }

    beforePointerEvent(event, e) {
        const isButton = e.target?.matches("input[type=checkbox] , input[type=radio] , button");
        if (isButton) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            return true;
        }
        switch (event) {
            case "default-click":
                if (!e.pointerType) return true;
                if (e.target?.matches("[click-enabled]")) return false;
            case "pointerdown":
            case "dragstart":
                if (e.target?.matches("a, [click-enabled]")) return false;
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

    processModalEvent(e) {
        const modals = this.openModals.get();
        if (modals.length < 0) return true;
        if (modals.length > 0) {
            if (e && pointerEventPathContains(e, "[zyx-input-modal]")) return false;
            modals.forEach(modal => modal.clickedOutside(modal))
            this.nullAllEvents();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.openModals.clear();
            return true;
        }
        return false;
    }

    isolateEventWithinContainer(node, clickedOutside) {
        this.openModals.add(node);
        node.setAttribute("zyx-input-modal", "");
        node.clickedOutside = clickedOutside.bind(node);
    }

    moveTripper({ startX, startY, deadzone } = {}) {
        const { moveFuse, check } = this.simpleMoveTripper({ startX, startY, deadzone });
        document.addEventListener("pointermove", check);
        document.addEventListener("pointerup", () => document.removeEventListener("pointermove", check), { once: true })
        return { moveFuse, check }
    }

    simpleMoveTripper({
        startX, startY, deadzone = this.moveTripperDist, moveFuse = returnFuse()
    } = {}) {
        return {
            moveFuse, check: (e) => {
                Math.hypot(e.clientX - startX, e.clientY - startY) > deadzone && moveFuse.True()
                return moveFuse.true
            }
        }
    }

    // KEYBOARD / CONTROLLER INPUTS
    async keyEvent(event, e) {
        try {
            if (
                e.ctrlKey ||
                e.metaKey ||
                this.queryApplication("input:focus,textarea:focus").length > 0
            ) return false;

            const module = this.focus.getFocusedModule();
            if (typeof module?.keyEvent !== "function") return false;

            if (
                !e.joy && // Don't prevent default for xbox controller,
                !this.enabledDefaults.includes(e.code) // Don't prevent default for keys inside enabledDefaults
            ) {
                e.preventDefault();
                e.stopPropagation();
            }

            await module?.keyEvent(event, e);

        } catch (err) {
            console.error("[Key Event Error Additional Context]", { event, e });
            throw err;
        }
    }

    socketXinputEvent(data) {
        if (!this.listenToController) return;
        const buttonState = data.pressed === 1 ? "keydown" : "keyup";
        this.keyEvent(buttonState, { joy: true, key: XboxControllerMap[data.button] });
    }

}

export function nullifyEvent(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
}

export function returnFuse(init_state, data) {
    return {
        data,
        randomId: Math.random().toString(36).substring(7),
        true: init_state ? true : false,
        false: init_state ? false : true,
        True: function () {
            this.true = true
            this.false = false
            return this
        },
        False: function () {
            this.true = false
            this.false = true
            return this
        },
        reset: function (callback) {
            this.true = false;
            typeof callback === "function" && callback()
            return this
        },
        falseTrue: function (_false, _true, ...args) {
            this.true ? _true(...args) : _false(...args)
            return this
        }
    };
}
