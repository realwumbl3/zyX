/**
 * Mouse wheel event handling module
 * @module ZyXInput/Wheel
 */

import ZyXInput from "../zyX-Input.js";
import { pointerEventPathContains, pointerEventPathContainsMatching } from "../zyX-Toolbox.js";

/**
 * Handle mouse wheel events with utility functions
 * @this {ZyXInput}
 * @param {Element} element - The target element
 * @param {Object} options - Wheel handler options
 * @param {Function} options.onWheel - Callback for wheel events
 * @param {boolean} [options.capture=false] - Whether to use event capture
 * @param {boolean} [options.passive=false] - Whether to use passive event listener
 * @returns {Object} Unbind function to remove event listener
 */
export default function Wheel(element, {
    onWheel,
    capture = false,
    passive = false
} = {}) {
    if (!element || typeof onWheel !== 'function') {
        console.warn('[ZyXInput] Invalid parameters for Wheel handler');
        return;
    }

    const wheelHandler = (whl_e) => {
        onWheel({
            whl_e,
            killPropagation: () => {
                whl_e.stopPropagation();
                whl_e.stopImmediatePropagation();
            },
            pathContains: (selector) => pointerEventPathContains(whl_e, selector),
            pathContainsMatching: (selector) => pointerEventPathContainsMatching(whl_e, selector)
        });
    };

    element.addEventListener("wheel", wheelHandler, { capture, passive });

    return {
        unbind: () => {
            element.removeEventListener("wheel", wheelHandler, { capture });
        }
    };
}