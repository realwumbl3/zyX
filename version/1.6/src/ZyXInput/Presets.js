import ZyXInput, { Fuze } from "../zyX-Input.js";
import zyX from "../../";

import clickOne, { Click as click } from "./Click.js";
import rightClick from "./RightClick.js";
import pointerDownMoveUp from "./PointerDownMoveUp.js";
import wheel from "./Wheel.js";

export { clickOne, click, rightClick, pointerDownMoveUp, wheel };

/** * @this {ZyXInput} */
export function hrefDoubleClick(ele, ...args) {
    this.on(ele).clickOrTwo({
        single: (se) => window.open(ele.href, "_blank"),
        double: (dbe) => window.open(ele.href, "_blank", ["height=1400", "width=1000", "top=10", "left=10"].join(","))
    });
}

/** * @this {ZyXInput} */
export function clickOrTwo(element, {
    single,
    double,
    doubleWait = false,
    cooldown,
    cooldownDuration = 350,
    label = "click-or-two",
    preventDefault = true
} = {}, {
    active_fuse = new Fuze(),
    db_fuse = new Fuze()
} = {}) {
    this.on(element).clickOne({
        preventDefault,
        label,
        onClick: ({ dwn_e, up_e }) => {
            if (cooldown) return;

            if (active_fuse.true) return db_fuse.setTrue();

            zyX({}).delay("click", doubleWait || this.clickOrTwoWindowMs, () => {
                active_fuse.reset()
                db_fuse.falseTrue(
                    _ => single(dwn_e),
                    _ => {
                        double(dwn_e);
                        cooldown = setTimeout(() => cooldown = null, cooldownDuration);
                    }
                )
                db_fuse.reset()
            })

            active_fuse.setTrue();
        }
    })
}