// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { pointerEventPathContains, WeakRefSet } from "../";

import { XboxControllerMap } from "./ZyXInput/Xinput.js";

import PointerDownMoveUp from "./ZyXInput/PointerDownMoveUp.js";
import ClickOne from "./ZyXInput/ClickOne.js";
import ClickOrTwo from "./ZyXInput/ClickOrTwo.js";
import RightClick from "./ZyXInput/RightClick.js";

import BackHandler from "./ZyXInput/Back.js";

function nullifyEvent(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
}

import { MomentumScroll } from "./ZyXInput/Scrolling.js";

import * as inputFunctions from "./ZyXInput/Functions.js";
// #endregion

import { Focusable, FocusController } from "./zyx-Focusables.js";

export default class ZyXInput {
    constructor({ app, special_query_func } = {}) {
        this.app = app;
        this.special_query_func = special_query_func;

        this.focus = new FocusController();

        this.listenToController = false;

        this.enabledDefaults = ["Tab", "Esc", "F5", "F11", "F12", "KeyI", "KeyC", "KeyV", "KeyX"];

        document.addEventListener("keypress", (e) => this.focusKeyEvent("keypress", e));
        document.addEventListener("keydown", (e) => this.focusKeyEvent("keydown", e));
        document.addEventListener("keyup", (e) => this.focusKeyEvent("keyup", e));

        this.activeEvents = new WeakRefSet();

        this.openModals = new WeakRefSet();

        this.events = [
            "click",
            "rightclick",
            "pointerdown",
            "pointerup",
            "pointermove",
            "pointerdownmoveup",
            "pointerdown",
            "dragstart",
            "clickone",
            "clickortwo",
            "wheel"
        ];

        // // IN ALPHADEK, WE DO OUR OWN DARN CLICKS YA HEAR ME??
        document.addEventListener("click", e => !this.beforePointerEvent("default-click", e) && nullifyEvent(e))

        this.mouse = { x: 0, y: 0, pointerDown: false };
        document.addEventListener("pointermove", e => (this.mouse.x = e.clientX, this.mouse.y = e.clientY))
        document.addEventListener("pointerdown", e => (this.mouse.x = e.clientX, this.mouse.y = e.clientY, this.mouse.pointerDown = true))
        document.addEventListener("pointerup", e => this.mouse.pointerDown = false)
        document.addEventListener("pointerleave", e => this.mouse.pointerDown = false)

        document.addEventListener("contextmenu", e => {
            if (e.shiftKey) return true
            if (pointerEventPathContains(e, "[context-menuable]")) return false
            nullifyEvent(e)
        })

        this.on(document).dragstart((e) => { });

        this.clickOrTwoWindowMs = 350;
        this.moveTripperDist = 13;
        this.mobilePressHoldDelay = 550;

        this.backHandler = new BackHandler(this);

        this.backHandler.on(_ => {
            return this.processModalEvent()
        }, { weight: 1000 })

        this.fn = inputFunctions;
    }

    setupMomentumScroll(container) {
        return new MomentumScroll(this, container);
    }

    clearAllSelections() {
        window.getSelection().removeAllRanges();
    }

    beforePointerEvent(event, e) {
        // console.log("beforePointerEvent", event, e);
        switch (event) {
            case "default-click":
                if (!e.pointerType) return true;
                return (e.target.matches && e.target.matches("[click-enabled]"))
            case "pointerdown":
            case "dragstart":
                // events triggered on elements w/ a tags and elements with [pass-event] attribute are allowed to pass through
                if (e.target.matches && e.target.matches("[prevent-event]")) return true;
                if (e.target.matches && e.target.matches("a,[pass-event], [click-enabled]")) return false;
            case "pointerdownmoveup":
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

    nullAllEvents() {
        this.activeEvents.forEach((p) => p.False() + this.activeEvents.removeRef(p))
    }

    kingOfTheStack(event) {
        this.activeEvents.forEach((p) => p !== event && p.False() + this.activeEvents.removeRef(p))
    }

    on = (element) => new Proxy(this.events, { get: (o, k) => this.customEventHandlers(element, k) });

    customEventHandlers(element, event_keyname) {
        switch (event_keyname.toLowerCase()) {
            case "pointerdownmoveup":
                return (...args) => PointerDownMoveUp.bind(this)(element, ...args)
            case "clickone":
                return (...args) => ClickOne.bind(this)(element, ...args)
            case "clickortwo":
                return (...args) => ClickOrTwo.bind(this)(element, ...args)
            case "rightclick":
                return (...args) => RightClick.bind(this)(element, ...args)
            case "wheel":
                return ({ onWheel, capture = false, passive = false } = {}) => {
                    element.addEventListener("wheel", (whl_e) => {
                        onWheel({
                            whl_e,
                            killPropagation: () => whl_e.stopPropagation() && whl_e.stopImmediatePropagation(),
                            pathContains: (selector) => pointerEventPathContains(whl_e, selector)
                        });
                    }, { capture, passive })
                }
            case "pointerdown":
            case "pointerup":
            case "click":
            case "dragstart":
                return (callback) => {
                    element.addEventListener(event_keyname, (e) => { const b4 = this.beforePointerEvent(event_keyname, e); callback(e, b4) });
                }
            case "click":
                return (callback) => {
                    element.setAttribute("click-enabled", "");
                    element.addEventListener("pointerdown", (e) => {
                        const b4 = this.beforePointerEvent("custom-click", e);
                        if (!b4) return nullifyEvent(e);
                        element.addEventListener("click", (e) => {
                            callback(e);
                        }, { once: true })
                    })
                }
        }

    }

    processModalEvent(e) {
        const modals = this.openModals.getRefs();
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

    isolateEventWithinContainer(node, kwargs) {
        const { clickedOutside, connected } = kwargs;
        this.openModals.add(node);
        node.setAttribute("zyx-input-modal", "");
        node.clickedOutside = clickedOutside.bind(node);
    }


    socketXinputEvent(data) {
        if (!this.listenToController) return;
        const buttonState = data.pressed === 1 ? "keydown" : "keyup";
        this.focusKeyEvent(buttonState, { joy: true, key: XboxControllerMap[data.button] });
    }

    queryApplication(query) {
        return this.special_query_func ? this.special_query_func(query) : document.querySelectorAll(query);
    }

    async focusKeyEvent(event, e) {
        try {

            const ultraQuery = this.queryApplication("input:focus,textarea:focus,.ql-editor:focus")

            if (ultraQuery.length > 0) return false;

            if (e.ctrlKey || e.metaKey) return false;

            this.app?.keyEvent?.(event, e);

            const module = this.focus.getFocusedModule();
            if (typeof module?.keyEvent !== "function") return false;

            if (
                !e.joy && // Don't prevent default for xbox controller,
                !this.enabledDefaults.includes(e.code) && // Don't prevent default for keys inside enabledDefaults
                this.queryApplication("input:focus").length < 1 // Though, Enable all keys inside of focused inputs
            ) {
                e.preventDefault();
                e.stopPropagation();
            }

            await module?.keyEvent(event, e);

        } catch (err) {
            console.error("Key Event Error", err, "Additional Context", { event, e });
        }
    }

    moveTripper = ({
        startX,
        startY,
        deadzone = this.moveTripperDist,
        move_fuse = this.returnFuse()
    } = {}) => {
        const check = (e) => {
            Math.hypot(e.clientX - startX, e.clientY - startY) > deadzone && move_fuse.True()
            return move_fuse.true
        }
        document.addEventListener("pointermove", check);
        document.addEventListener("pointerup", () => {
            document.removeEventListener("pointermove", check)
        }, { once: true })
        return { move_fuse, check }
    }

    simpleMoveTripper({
        startX,
        startY,
        deadzone = this.moveTripperDist,
        move_fuse = this.returnFuse()
    } = {}) {
        const check = (e) => {
            Math.hypot(e.clientX - startX, e.clientY - startY) > deadzone && move_fuse.True()
            return move_fuse.true
        }
        return { move_fuse, check }
    }


    returnFuse(init_state) {
        return {
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

}
