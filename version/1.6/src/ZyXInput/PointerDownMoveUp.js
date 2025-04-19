// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { pointerEventPathContains, pointerEventPathContainsMatching } from "../../";
import ZyXInput, { Fuze } from "../zyX-Input.js";
import { angleToDirection, calculateAngle, calculateFourAngleSnap } from "./Functions.js";
// #endregion

/** * @this {ZyXInput} */
export default function PointerDownMoveUp(element, {
    onDown,
    onStartMove,
    onMove,
    onUp,
    once = false,
    deadzone = null,
    capture = false,
    captureMove = false,
    verbose = false,
    stopPropagation = false,
    stopImmediatePropagation = false,
    stopMovePropagation = false,
    stopImmediateMovePropagation = false,
    movePrecision = 1,
    label = "pointerDownMoveUp"
} = {}) {

    const down_func = (dwn_e) => {

        deadzone = deadzone || this.moveTripperDist;

        if (!this.beforePointerEvent("pointerDownMoveUp", dwn_e)) return false

        const {
            eventFuse = new Fuze(true, { label }),
            pointerDown = new Fuze(true, { label }),
            startX,
            startY
        } = {
            startX: dwn_e.clientX,
            startY: dwn_e.clientY
        }

        this.activeEvents.add(eventFuse);

        const { moveFuse, check } = this.deadzone({ startX, startY, deadzone });

        stopPropagation && dwn_e.stopPropagation()
        stopImmediatePropagation && dwn_e.stopImmediatePropagation()

        const composedPath = dwn_e.composedPath()

        let {
            startAngle = null,
            moveCalledOnce = false,
            latest_move_e = null,
            startMove,
            pixels_moved = 0
        } = {}

        const down_return = onDown({
            composedPath,
            dwn_e,
            moveFuse,
            pointerDown,
            eventFuse,
            kingOfTheStack: _ => this.kingOfTheStack(eventFuse),
            pathContains: (selector) => pointerEventPathContains(dwn_e, selector),
            pathContainsMatching: (selector) => pointerEventPathContainsMatching(dwn_e, selector)
        });

        if (!down_return) {
            return false;
        }

        const angleFromStart = (e) => calculateAngle(startX, startY, e.clientX, e.clientY);

        const distanceFromStart = (e) => Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2))

        const fourAngleSnap = (e) => calculateFourAngleSnap(angleFromStart(e));

        const move_wrapped = (mv_e) => {
            try {

                if (eventFuse.false) {
                    verbose && console.log({ element }, "eventFuse.false, returning")
                    return unbind();
                }

                pixels_moved++;
                if (movePrecision > 1) {
                    if (pixels_moved < movePrecision) return
                    else (pixels_moved = 0);
                }

                latest_move_e = mv_e;

                if (!check(mv_e)) return;

                if (!startAngle) {
                    startAngle = angleFromStart(mv_e);
                }

                const call = {
                    dwn_e,
                    mv_e,
                    startX,
                    startY,
                    startAngle,
                    movementX: mv_e.movementX,
                    movementY: mv_e.movementY,
                    stop: unbind,
                    up: canceled_or_up,
                    moveFuse,
                    startMove,
                    kingOfTheStack: _ => this.kingOfTheStack(eventFuse),
                    clearAllSelections: () => this.clearAllSelections(),
                    fourAngleSnap: () => fourAngleSnap(mv_e),
                    angleFromStart: () => angleFromStart(mv_e),
                    distanceFromStart: () => distanceFromStart(mv_e),
                    direction: () => angleToDirection(angleFromStart(mv_e))
                }

                stopMovePropagation && mv_e.stopPropagation()
                stopImmediateMovePropagation && mv_e.stopImmediatePropagation()

                if (moveCalledOnce && onMove) return onMove(call, down_return);

                if (onStartMove) {
                    startMove = onStartMove(call, down_return)
                    if (!startMove) return false;
                    if (typeof startMove === 'object' && startMove !== null && ('onMove' in startMove || 'onUp' in startMove)) {
                        startMove?.onMove && (onMove = startMove.onMove)
                        startMove?.onUp && (onUp = startMove.onUp)
                    }
                }

                this.kingOfTheStack(eventFuse);

                moveCalledOnce = true;

            } catch (e) {
                console.error(e)
            }
        }

        const canceled_or_up = (up_e) => {
            pointerDown.setFalse();
            unbind();
            const call = {
                dwn_e,
                up_e,
                composedPath,
                mv_e: latest_move_e,
                startX,
                startY,
                startAngle,
                startMove,
                moveFuse,
                onStartMove,
                fourAngleSnap: () => fourAngleSnap(up_e),
                angleFromStart: () => angleFromStart(up_e),
                distanceFromStart: () => distanceFromStart(up_e),
                direction: () => angleToDirection(angleFromStart(up_e))
            }
            onUp && onUp(call, down_return)
        }

        document.addEventListener("pointermove", move_wrapped, { capture: captureMove });
        document.addEventListener("pointerup", canceled_or_up)
        document.addEventListener("pointercancel", canceled_or_up)
        const unbind = _ => {
            document.removeEventListener("pointermove", move_wrapped, { capture: captureMove });
            document.removeEventListener("pointerup", canceled_or_up);
            document.removeEventListener("pointercancel", canceled_or_up);
        }
    }

    element.addEventListener("pointerdown", down_func, { once, capture });

    return {
        removeEventListener: _ => element.removeEventListener("pointerdown", down_func, { capture })
    }
}
