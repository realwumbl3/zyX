// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { pointerEventPathContains, pointerEventPathContainsMatching } from "../../index.js";
import ZyXInput, { Fuse } from "../zyX-Input.js";
import { angleToDirection, calculateAngle, calculateFourAngleSnap } from "../zyX-Math.js";
// #endregion

/**
 * Handle right-click events with support for both mouse and touch devices
 * @this {ZyXInput}
 * @param {Element} element - The target element
 * @param {Object} options - Right-click handler options
 * @param {Function} [options.onDown] - Callback for pointer down event
 * @param {Function} [options.onUp] - Callback for pointer up event
 * @param {boolean} [options.once=false] - Whether to trigger only once
 * @param {boolean} [options.capture=false] - Whether to use event capture
 * @param {string} [options.label="rightclick"] - Event label for debugging
 */
export function rightClick(element, { onDown, onUp, once = false, capture = false, label = "rightclick" } = {}) {
    if (!element) {
        console.warn("[ZyXInput] Invalid element for RightClick handler");
        return;
    }

    if (!onUp) throw new Error("[ZyXInput] onUp required for RightClick");

    this.on(element).pointerDownMoveUp({
        label,
        onDown: (args) => {
            const { moveFuse, pointerDown, eventFuse } = args;

            // Call onDown callback if provided
            onDown?.(args);

            // Handle touch devices with long press
            zyX(element).delay("pointer-down", this.mobilePressHoldDelay, () => {
                if (moveFuse.true || pointerDown.false || eventFuse.false) return;
                this.kingOfTheStack(eventFuse, () => onUp(args));
            });

            return true;
        },
        onUp: (args) => {
            const { up_e, moveFuse, eventFuse } = args;

            // Only handle right mouse button clicks
            if (up_e.pointerType === "mouse" && up_e.button === 2) {
                if (moveFuse.true || eventFuse.false) return;
                this.kingOfTheStack(eventFuse, () => onUp(args));
            }
        },
        once,
        capture,
    });
}

/**
 * Handle single click events with advanced options
 * @this {ZyXInput}
 * @param {Element} element - The target element
 * @param {Object} options - Click handler options
 * @param {Function} [options.onClick] - Callback for click completion
 * @param {Function} [options.onDown] - Callback for pointer down
 * @param {boolean} [options.once=false] - Whether to trigger only once
 * @param {boolean} [options.capture=false] - Whether to use event capture
 * @param {boolean} [options.stopPropagation=false] - Whether to stop event propagation
 * @param {boolean} [options.stopImmediatePropagation=false] - Whether to stop immediate propagation
 * @param {boolean} [options.preventDefault=true] - Whether to prevent default behavior
 * @param {string} [options.label="click"] - Event label for debugging
 * @returns {Object} Unbind function to remove event listeners
 */
export function clickOne(element, args) {
    const {
        onClick = null,
        onDown = null,
        once = false,
        capture = false,
        stopPropagation = false,
        stopImmediatePropagation = false,
        preventDefault = true,
        label = "click",
    } = args;
    const func = (dwn_e) => {
        // Handle event propagation
        stopPropagation && dwn_e.stopPropagation();
        stopImmediatePropagation && dwn_e.stopImmediatePropagation();

        // Only handle left mouse button
        if (dwn_e.which !== 1) return;

        // Check if event should proceed
        const b4 = this.beforePointerEvent("clickone", dwn_e);
        if (!b4) return;

        // Create event fuse for tracking
        const eventFuse = new Fuse(true, { label });
        this.activeEvents.add(eventFuse);

        // Call onDown callback if provided
        const down_return = onDown?.({ dwn_e, kingOfTheStack: (_) => this.kingOfTheStack(eventFuse) });

        // Store initial click position and target
        const { clientX, clientY, target } = dwn_e;

        // Set up move detection
        const { check } = this.moveTripper({ startX: clientX, startY: clientY });

        if (onClick) {
            // Handle pointer up
            element.addEventListener(
                "pointerup",
                (up_e) => {
                    if (!check(up_e) && eventFuse.true && up_e.target === target) {
                        this.kingOfTheStack(eventFuse, () => onClick({ dwn_e, up_e, down_return, eventFuse }, b4));
                    }
                },
                { once: true }
            );
        }
    };

    // Set up event listeners
    element.addEventListener("pointerdown", func, { once, capture });
    if (preventDefault) {
        element.addEventListener("click", (e) => e.preventDefault(), { once, capture });
    }

    // Return unbind function
    return {
        unbind: () => {
            element.removeEventListener("pointerdown", func, { capture });
            element.removeEventListener("click", (e) => e.preventDefault(), { capture });
        },
    };
}

/**
 * Simple click handler for elements with click-enabled attribute
 * @this {ZyXInput}
 * @param {Element} element - The target element
 * @param {Function} callback - The click callback function
 */
export function click(element, callback) {
    if (!element || typeof callback !== "function") {
        console.warn("[ZyXInput] Invalid parameters for Click handler");
        return;
    }

    element.setAttribute("click-enabled", "");

    element.addEventListener("pointerdown", (e) => {
        const b4 = this.beforePointerEvent("custom-click", e);
        if (!b4) return nullifyEvent(e);

        element.addEventListener(
            "click",
            () => {
                callback();
            },
            { once: true }
        );
    });
}

/**
 * Handle single or double click events with configurable behavior
 * @this {ZyXInput}
 * @param {Element} element - The target element
 * @param {Object} options - Configuration options
 * @param {Function} options.single - Callback for single click
 * @param {Function} options.double - Callback for double click
 * @param {boolean} [options.doubleWait=false] - Whether to wait for double click
 * @param {number} [options.cooldown] - Cooldown timer reference
 * @param {number} [options.cooldownDuration=350] - Cooldown duration in ms
 * @param {string} [options.label="click-or-two"] - Event label
 * @param {boolean} [options.preventDefault=true] - Whether to prevent default behavior
 * @param {Object} [state] - Internal state object
 * @param {Fuse} [state.activeFuse=new Fuse()] - Active state fuse
 * @param {Fuse} [state.db_fuse=new Fuse()] - Double click state fuse
 */
export function clickOrTwo(
    element,
    {
        single,
        double,
        doubleWait = false,
        cooldown,
        cooldownDuration = this.clickOrTwoWindowMs,
        button = 0,
        label = "click-or-two",
        preventDefault = true,
    } = {},
    { activeFuse = new Fuse(), dblClickFuse = new Fuse(), singleClickTimeout = null } = {}
) {
    if (!element) {
        console.warn("[ZyXInput] Invalid element for ClickOrTwo handler");
        return;
    }

    this.on(element).pointerDownMoveUp({
        label,
        onDown: (args) => {
            const { dwn_e, moveFuse, pointerDown, eventFuse } = args;
            if (cooldown || moveFuse.true || pointerDown.false || eventFuse.false) return;
            if (dwn_e.button !== button) return;

            // Just track that a down event happened, but don't trigger callbacks here
            return true;
        },
        onUp: (args) => {
            const { up_e, moveFuse, eventFuse } = args;
            // Only handle specific button clicks
            if (up_e.pointerType === "mouse" && up_e.button !== button) return;
            if (moveFuse.true || eventFuse.false) return;

            // At this point we know the button was clicked and released without movement

            if (activeFuse.true) {
                // Second click within window - handle double click
                if (eventFuse.true) {
                    // Only handle if our event is still king
                    // Clear any pending single click timeout
                    if (singleClickTimeout) {
                        clearTimeout(singleClickTimeout);
                        singleClickTimeout = null;
                    }

                    double(args);
                    cooldown = setTimeout(() => (cooldown = null), cooldownDuration);
                }
                activeFuse.reset();
                dblClickFuse.reset();
                return;
            }

            // First click - set up for potential double click
            activeFuse.setTrue();

            // Set timeout to handle the single click if no second click arrives
            singleClickTimeout = setTimeout(() => {
                // Only handle single click if our event is still king and active
                if (activeFuse.true && eventFuse.true) {
                    single(args);
                }
                activeFuse.reset();
                singleClickTimeout = null;
            }, doubleWait || cooldownDuration);
        },
        once: false,
        capture: false,
    });
}

/**
 * Handle pointer down, move, and up events with advanced features
 * @this {ZyXInput}
 * @param {Element} element - The target element
 * @param {Object} options - Event handler options
 * @param {Function} [options.onDown] - Callback for pointer down
 * @param {Function} [options.onStartMove] - Callback for start of movement
 * @param {Function} [options.onMove] - Callback for movement
 * @param {Function} [options.onUp] - Callback for pointer up
 * @param {boolean} [options.once=false] - Whether to trigger only once
 * @param {number} [options.deadzone] - Movement deadzone distance
 * @param {boolean} [options.capture=false] - Whether to use event capture
 * @param {boolean} [options.captureMove=false] - Whether to capture move events
 * @param {boolean} [options.verbose=false] - Whether to log debug info
 * @param {boolean} [options.stopPropagation=false] - Whether to stop event propagation
 * @param {boolean} [options.stopImmediatePropagation=false] - Whether to stop immediate propagation
 * @param {boolean} [options.stopMovePropagation=false] - Whether to stop move event propagation
 * @param {boolean} [options.stopImmediateMovePropagation=false] - Whether to stop immediate move propagation
 * @param {number} [options.movePrecision=1] - Movement precision threshold
 * @param {string} [options.label="pointerDownMoveUp"] - Event label for debugging
 * @returns {Object} Unbind function to remove event listeners
 */
export function pointerDownMoveUp(
    element,
    {
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
        label = "pointerDownMoveUp",
    } = {}
) {
    if (!element) {
        console.warn("[ZyXInput] Invalid element for PointerDownMoveUp handler");
        return;
    }

    const down_func = (dwn_e) => {
        // Set up deadzone
        deadzone = deadzone || this.moveTripperDist;

        // Check if event should proceed
        if (!this.beforePointerEvent("pointerDownMoveUp", dwn_e)) return false;

        // Initialize state
        const {
            eventFuse = new Fuse(true, { label }),
            pointerDown = new Fuse(true, { label }),
            startX,
            startY,
        } = {
            startX: dwn_e.clientX,
            startY: dwn_e.clientY,
        };

        this.activeEvents.add(eventFuse);

        // Set up move detection
        const { moveFuse, check } = this.deadzone({ startX, startY, deadzone });

        // Handle event propagation
        stopPropagation && dwn_e.stopPropagation();
        stopImmediatePropagation && dwn_e.stopImmediatePropagation();

        const composedPath = dwn_e.composedPath();

        // Initialize movement tracking
        let { startAngle = null, moveCalledOnce = false, latest_move_e = null, startMove, pixels_moved = 0 } = {};

        // Call onDown callback
        const down_return = onDown?.({
            composedPath,
            dwn_e,
            moveFuse,
            pointerDown,
            eventFuse,
            kingOfTheStack: (_) => this.kingOfTheStack(eventFuse),
            pathContains: (selector) => pointerEventPathContains(dwn_e, selector),
            pathContainsMatching: (selector) => pointerEventPathContainsMatching(dwn_e, selector),
        });

        if (!down_return) {
            return false;
        }

        // Movement calculation helpers
        const angleFromStart = (e) => calculateAngle(startX, startY, e.clientX, e.clientY);
        const distanceFromStart = (e) => Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
        const fourAngleSnap = (e) => calculateFourAngleSnap(angleFromStart(e));

        // Handle pointer move
        const move_wrapped = (mv_e) => {
            try {
                if (eventFuse.false) {
                    verbose && console.log({ element }, "eventFuse.false, returning");
                    return unbind();
                }

                // Check movement precision
                pixels_moved++;
                if (movePrecision > 1) {
                    if (pixels_moved < movePrecision) return;
                    pixels_moved = 0;
                }

                latest_move_e = mv_e;

                if (!check(mv_e)) return;

                // Initialize angle tracking
                if (!startAngle) {
                    startAngle = angleFromStart(mv_e);
                }

                // Prepare move callback data
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
                    kingOfTheStack: (_) => this.kingOfTheStack(eventFuse),
                    clearAllSelections: () => this.clearAllSelections(),
                    fourAngleSnap: () => fourAngleSnap(mv_e),
                    angleFromStart: () => angleFromStart(mv_e),
                    distanceFromStart: () => distanceFromStart(mv_e),
                    direction: () => angleToDirection(angleFromStart(mv_e)),
                };

                // Handle move event propagation
                stopMovePropagation && mv_e.stopPropagation();
                stopImmediateMovePropagation && mv_e.stopImmediatePropagation();

                // Handle move callbacks
                if (moveCalledOnce && onMove) {
                    return onMove(call, down_return);
                }

                if (onStartMove) {
                    startMove = onStartMove(call, down_return);
                    if (!startMove) return false;
                    if (typeof startMove === "object" && startMove !== null) {
                        if ("onMove" in startMove) onMove = startMove.onMove;
                        if ("onUp" in startMove) onUp = startMove.onUp;
                    }
                }

                this.kingOfTheStack(eventFuse);
                moveCalledOnce = true;
            } catch (error) {
                console.error("[ZyXInput] Error in move handler:", error);
            }
        };

        // Handle pointer up/cancel
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
                eventFuse,
                fourAngleSnap: () => fourAngleSnap(up_e),
                angleFromStart: () => angleFromStart(up_e),
                distanceFromStart: () => distanceFromStart(up_e),
                direction: () => angleToDirection(angleFromStart(up_e)),
            };
            onUp?.(call, down_return);
        };

        // Set up event listeners
        document.addEventListener("pointermove", move_wrapped, { capture: captureMove });
        document.addEventListener("pointerup", canceled_or_up);
        document.addEventListener("pointercancel", canceled_or_up);

        // Return unbind function
        const unbind = () => {
            document.removeEventListener("pointermove", move_wrapped, { capture: captureMove });
            document.removeEventListener("pointerup", canceled_or_up);
            document.removeEventListener("pointercancel", canceled_or_up);
        };
    };

    // Set up down event listener
    element.addEventListener("pointerdown", down_func, { once, capture });

    // Return unbind function
    return {
        removeEventListener: () => element.removeEventListener("pointerdown", down_func, { capture }),
    };
}
