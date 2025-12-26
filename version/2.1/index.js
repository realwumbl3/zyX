/*
    <script type="importmap">
    {
        "imports": {
            "zyX": "https://z.wumbl3.xyz/v:1.9/", // https://zyx.wumbl3.xyz/ for cached version
            "zyX/": "https://z.wumbl3.xyz/v:1.9/" // https://zyx.wumbl3.xyz/ for cached version
        }
    }
    </script>
*/

// Core imports
// HTML
import html, { ZyXHTML } from "./src/zyX-HTML.js";

// CSS
import css, { zyxcss } from "./src/zyX-CSS.js";

// Delay
import { delayChain, breakDelayChain, clearDelay, delay, debounce, instant, throttle } from "./src/zyX-Delay.js";

// Types
import { WeakRefSet, Deque } from "./src/zyX-Types.js";
// LiveTypes
import { LiveList, LiveDeque, LiveVar } from "./src/zyX-LiveTypes.js";
// Currently implemented exports
export {
    // HTML
    html,
    // CSS
    css,
    zyxcss,
    ZyXHTML,
    // Types
    WeakRefSet,
    Deque,
    // Live Types
    LiveList,
    LiveDeque,
    LiveVar,
    // Delay
    delayChain,
    breakDelayChain,
    clearDelay,
    delay,
    debounce,
    instant,
    throttle,
};

export function isMobile() {
    return navigator.maxTouchPoints > 0;
}

const zyXMethods = {
    delay,
    instant,
    clearDelay,
    delayChain,
    breakDelayChain,
    debounce,
    throttle,
};

export default function zyX(that) {
    return new Proxy(zyXMethods, {
        get: (obj, key) => {
            if (obj.hasOwnProperty(key)) {
                const func = obj[key];
                return (...args) => func(that, ...args);
            }
            throw new Error(`zyX().${key} is not a function`);
        },
    });
}

css`
    ph {
        display: none;
    }
`;
