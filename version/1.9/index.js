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
import html, { ZyXHTML, makePlaceable } from "./src/zyX-HTML.js";
import { getTopLevelElements, insertAfter } from "./src/zyX-HTML-Utils.js";

// CSS
import css, { zyxcss } from "./src/zyX-CSS.js";
// Shadowroot
import { clearAllSelections, forEachShadowRoot, getAllShadowRoots, queryAllRoots } from "./src/zyX-Shadowroot.js";
// Store
import { Cookies } from "./src/zyX-Store.js";
// Async
import { sleep, AsynConstructor, AsyncWorker, asyncPool, LegacyAsynConstructor } from "./src/zyX-Async.js";
// Delay
import { delayChain, breakDelayChain, clearDelay, delay, debounce, instant, throttle } from "./src/zyX-Delay.js";
// Events
import ZyXEvents, { addEventListeners, removeEventListeners } from "./src/zyX-Events.js";
// Math
import {
    clamp,
    lerp,
    mapRange,
    scaleFromOffset,
    scaleToOffset,
    roundTo,
    roundToDecimals,
    randomInt,
    randomFloat,
    isEven,
    isOdd,
    isInteger,
    isFloat,
} from "./src/zyX-Math.js";
// Types
import { WeakRefSet, Deque } from "./src/zyX-Types.js";
// LiveTypes
import { LiveList, LiveDeque, LiveVar } from "./src/zyX-LiveTypes.js";
// LiveDomList
import LiveDomList from "./src/zyX-LiveDomList.js";
// Audio
import ZyXAudio from "./src/zyX-Audio.js";
// Fetch
import {
    postData,
    getData,
    postForm,
    fetchCSS,
    grabBlob,
    shrinkImage,
    splitFilename,
    fetchJSON,
    putData,
    deleteData,
    injectScript,
    dataToBlob,
    fetchWithTimeout,
    loadImg,
} from "./src/zyX-Fetch.js";
// Focusable
import { FocusController, Focusable } from "./src/zyX-Focus.js";
// Input
import ZyXInput from "./src/zyX-Input.js";
// Websocket
import ZyXIO from "./src/zyX-IO.js";
// Animation
import displayAnimation from "./src/zyX-Animation.js";
// Transform
import zyxTransform from "./src/zyX-Transform.js";
// Toolbox
import {
    forQuery,
    setProps,
    placeSafely,
    pointerEventPathContains,
    pointerEventPathContainsMatching,
    hslCssKeys,
    hexToRGB,
    hexToHSL,
    sS,
    seedShuffle,
    seedRandom,
    shorthandNumber,
    hslToHex,
} from "./src/zyX-Toolbox.js";
// ScrollTo
import ScrollTo from "./src/zyX-ScrollTo.js";
// HUE
import calculateDominantColor from "./src/zyX-HUE.js";
// Currently implemented exports
export {
    // HTML
    html,
    makePlaceable,
    // HTML utils
    getTopLevelElements,
    insertAfter,
    // CSS
    css,
    zyxcss,
    // Shadowroot
    clearAllSelections,
    forEachShadowRoot,
    getAllShadowRoots,
    queryAllRoots,
    // Store
    Cookies,
    ZyXHTML,
    ZyXAudio,
    // Events
    ZyXEvents,
    addEventListeners,
    removeEventListeners,
    // Input
    ZyXInput,
    // Websocket
    ZyXIO,
    // Types
    WeakRefSet,
    Deque,
    // Live Types
    LiveList,
    LiveDeque,
    LiveVar,
    // LiveDomList
    LiveDomList,
    // Async
    sleep,
    AsyncWorker,
    AsynConstructor,
    LegacyAsynConstructor,
    // Delay
    delayChain,
    breakDelayChain,
    clearDelay,
    delay,
    debounce,
    instant,
    asyncPool,
    throttle,
    // Math
    clamp,
    lerp,
    mapRange,
    scaleFromOffset,
    scaleToOffset,
    roundTo,
    roundToDecimals,
    randomInt,
    randomFloat,
    isEven,
    isOdd,
    isInteger,
    isFloat,
    // Fetch
    postData,
    getData,
    postForm,
    fetchCSS,
    grabBlob,
    shrinkImage,
    splitFilename,
    fetchJSON,
    putData,
    deleteData,
    injectScript,
    dataToBlob,
    fetchWithTimeout,
    loadImg,
    // Focusable
    FocusController,
    Focusable,
    // Toolbox
    forQuery,
    setProps,
    placeSafely,
    pointerEventPathContains,
    pointerEventPathContainsMatching,
    hslCssKeys,
    hexToRGB,
    hexToHSL,
    hslToHex,
    sS,
    seedShuffle,
    seedRandom,
    shorthandNumber,
    // ScrollTo
    ScrollTo,
    // HUE
    calculateDominantColor,
    // Animation
    displayAnimation,
    // Transform
    zyxTransform,
};

export function isMobile() {
    return navigator.maxTouchPoints > 0;
}

const zyXMethods = {
    forQuery,
    setProps,
    delay,
    instant,
    clearDelay,
    delayChain,
    breakDelayChain,
    debounce,
    addEventListeners,
    removeEventListeners,
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
