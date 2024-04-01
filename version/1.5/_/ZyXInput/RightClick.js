// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { pointerEventPathContains } from "../../";
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
        onDown: ({ dwn_e, b4, moveFuse, pointerDown, eventFuse } = {}) => {
            onDown?.({ dwn_e, b4 });
            zyX(element).delay("pointer-down", this.mobilePressHoldDelay, () => {
                if (moveFuse.true || pointerDown.false || eventFuse.false) return;
                this.kingOfTheStack(eventFuse)
                onUp({ dwn_e });
            })
            return true;
        },
        onUp: ({ up_e, dwn_e, moveFuse }) => {
            if (up_e.pointerType === "mouse" && up_e.button === 2) {
                if (moveFuse.true) return;
                onUp({ up_e, dwn_e });
            }
        },
        once,
        capture
    })
}