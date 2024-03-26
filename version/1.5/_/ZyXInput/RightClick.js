// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { pointerEventPathContains } from "zyX";
// #endregion
export default function RightClick(
    element,
    on_down,
    on_up,
    {
        once = false,
        capture = false
    } = {}) {
    this.on(element).pointerdownmoveup({
        onDown: ({ dwn_e, b4, move_fuse, pointerDown, event_fuse } = {}) => {
            if (pointerEventPathContains(dwn_e, "[no-custom-rclick]")) return false;

            on_down({ dwn_e, b4 });

            zyX(element).delay("pointer-down", this.mobilePressHoldDelay, () => {
                if (move_fuse.true || !pointerDown.true || !event_fuse.true) return;
                this.kingOfTheStack(event_fuse)
                on_up({ dwn_e });
            })

            return true;
        },
        onUp: ({ up_e, dwn_e, move_fuse }) => {
            if (up_e.pointerType === "mouse" && up_e.button === 2) {
                if (move_fuse.true) return;
                on_up({ up_e, dwn_e });
            }
        },
        once,
        capture
    })
}