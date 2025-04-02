/**
 * Input event presets and handlers
 * @module ZyXInput/Presets
 */

import ZyXInput from "../zyX-Input.js";

// import clickOne, { Click as click } from "./Click.js";
// import rightClick from "./RightClick.js";
// import clickOrTwo from "./ClickOrTwo.js";
// import pointerDownMoveUp from "./PointerDownMoveUp.js";

import { clickOne, click, rightClick, clickOrTwo, pointerDownMoveUp } from "./Click.js";

import wheel from "./Wheel.js";

export {
    clickOne, click, clickOrTwo, rightClick, pointerDownMoveUp,
    wheel,
};

/**
 * Handle double-clicking on href elements
 * @this {ZyXInput}
 * @param {HTMLAnchorElement} ele - The anchor element to handle
 * @param {...*} args - Additional arguments
 */
export function hrefDoubleClick(ele, ...args) {
    this.on(ele).clickOrTwo({
        single: (se) => window.open(ele.href, "_blank"),
        double: (dbe) => window.open(ele.href, "_blank", [
            "height=1400",
            "width=1000",
            "top=10",
            "left=10"
        ].join(","))
    });
}
