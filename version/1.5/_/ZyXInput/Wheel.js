import ZyXInput from "../zyX-Input.js";

/**
    @this {ZyXInput}
 */
export default function Wheel(element, {
    onWheel,
    capture = false,
    passive = false
} = {}) {
    element.addEventListener("wheel", (whl_e) => {
        onWheel({
            whl_e,
            killPropagation: () => whl_e.stopPropagation() && whl_e.stopImmediatePropagation(),
            pathContains: (selector) => pointerEventPathContains(whl_e, selector)
        });
    }, { capture, passive })
}