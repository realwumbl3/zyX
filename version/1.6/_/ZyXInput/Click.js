// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import ZyXInput from "../zyX-Input.js";
import { Fuze } from "../../";

// #endregion

/** * @this {ZyXInput} */
export default function ClickOne(element, {
    onClick = null,
    onDown = null,
    once = false,
    capture = false,
    stopPropagation = false,
    stopImmediatePropagation = false,
    preventDefault = true,
    label = "click"
}) {
    const func = (dwn_e) => {
        stopPropagation && dwn_e.stopPropagation()
        stopImmediatePropagation && dwn_e.stopImmediatePropagation()

        if (dwn_e.which !== 1) return;

        const b4 = this.beforePointerEvent("clickone", dwn_e);
        if (!b4) return

        const down_return = onDown?.(dwn_e);

        const { clientX, clientY, target } = dwn_e;

        const eventFuse = new Fuze(true, { label })

        this.activeEvents.add(eventFuse);

        const { check } = this.moveTripper({ startX: clientX, startY: clientY });

        element.addEventListener("pointerup", (up_e) => {
            if (!check(up_e) && eventFuse.true && up_e.target === target) {
                this.kingOfTheStack(eventFuse)
                onClick({ dwn_e, up_e, down_return }, b4);
            }
        }, { once: true })
    }

    element.addEventListener("pointerdown", func, { once, capture })
    if (preventDefault) element.addEventListener("click", e => e.preventDefault(), { once, capture })

    return {
        unbind: _ => {
            element.removeEventListener("pointerdown", func, { capture })
            element.removeEventListener("click", e => e.preventDefault(), { capture })
        }
    }
}

/** * @this {ZyXInput} */
export function Click(element, callback) {
    console.log("bind click")
    element.setAttribute("click-enabled", "");
    element.addEventListener("pointerdown", (e) => {
        console.log("pointerdown")
        const b4 = this.beforePointerEvent("custom-click", e);
        console.log("caa", b4)
        if (!b4) return nullifyEvent(e);
        element.addEventListener("click", () => {
            console.log("lick")
            callback()
        }, { once: true })
    })
}