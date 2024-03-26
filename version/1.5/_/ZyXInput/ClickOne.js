// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
// #endregion
export default function ClickOne(element, arg, opts) {
    let {
        onClick = typeof arg === "function" ? arg : null,
        onDown = null,
        once = false,
        capture = false,
        stopPropagation = false,
        stopImmediatePropagation = false,
    } = opts || arg;
    const func = (dwn_e) => {

        stopPropagation && dwn_e.stopPropagation()
        stopImmediatePropagation && dwn_e.stopImmediatePropagation()

        if (dwn_e.which !== 1) return;

        const b4 = this.beforePointerEvent("clickone", dwn_e);
        if (!b4) return

        const down_return = onDown?.(dwn_e);

        const { clientX, clientY, target } = dwn_e;

        const event_fuse = this.returnFuse(true)

        this.activeEvents.push(event_fuse);

        const { check } = this.moveTripper({ startX: clientX, startY: clientY });

        element.addEventListener("pointerup", (up_e) => {
            if (!check(up_e) && event_fuse.true && up_e.target === target) {
                this.kingOfTheStack(event_fuse)
                onClick({ dwn_e, up_e, down_return }, b4);
            }
        }, { once: true })
    }

    element.addEventListener("pointerdown", func, { once, capture })

    return {
        unbind: _ => element.removeEventListener("pointerdown", func, { capture })
    }
}
