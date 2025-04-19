// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { pointerEventPathContains, pointerEventPathContainsMatching } from "../../";
import ZyXInput from "../zyX-Input.js";
// #endregion

/** * @this {ZyXInput} */
export default function RightClick(
    element,
    {
        onDown,
        onUp,
        once = false,
        capture = false,
        label = "rightclick"
    } = {}) {
    this.on(element).pointerDownMoveUp({
        label,
        onDown: (args) => {
            const { moveFuse, pointerDown, eventFuse } = args
            onDown && onDown(args);
            zyX(element).delay("pointer-down", this.mobilePressHoldDelay, () => {
                if (moveFuse.true || pointerDown.false || eventFuse.false) return;
                this.kingOfTheStack(eventFuse)
                onUp(args);
            })
            return true;
        },
        onUp: (args) => {
            const { up_e, moveFuse } = args
            if (up_e.pointerType === "mouse" && up_e.button === 2) {
                if (moveFuse.true) return;
                onUp(args);
            }
        },
        once,
        capture
    })
}