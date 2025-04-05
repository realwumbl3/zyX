/*
    <script type="importmap">
    {
        "imports": {
            "zyX": "https://zyxx.wumbl3.xyz/v:1.5/",
            "zyX/": "https://zyxx.wumbl3.xyz/v:1.5/"
        }
    }
    </script>
*/

// Core imports
// HTML
import html, { ZyXHtml, makePlaceable } from "./src/zyX-HTML.js";
import { dynamicVar } from "./src/html/dynamicVariable.js";
import LiveDomList from "./src/html/LiveDomList.js";
// CSS
import css, { zyxcss } from "./src/zyX-CSS.js";
// Store
import { Cookies } from "./src/zyX-Store.js";
// Async
import { sleep, AsynConstructor, AsyncWorker, asyncPool } from "./src/zyX-Async.js";
// Delay
import { delayChain, breakDelayChain, clearDelay, delay, debounce, instant } from "./src/zyX-Delay.js";
// Events
import ZyXEvents from "./src/zyX-Events.js";
// Math
import { clamp, lerp, mapRange, scaleFromOffset, scaleToOffset, roundTo, roundToDecimals, randomInt, randomFloat, isEven, isOdd, isInteger, isFloat } from "./src/zyX-Math.js";
// Types
import { WeakRefSet, Deque, LiveList, LiveVariable, LiveDeque } from "./src/zyX-Types.js";
// Audio
import ZyXAudio from "./src/zyX-Audio.js";
// Fetch
import { postData, getData, postForm, fetchCSS, grabBlob, shrinkImage, splitFilename, fetchJSON, putData, deleteData, injectScript, dataToBlob, fetchWithTimeout } from "./src/zyX-Fetch.js";
// Focusable
import { FocusController, Focusable } from "./src/zyX-Focus.js";
// Input
import ZyXInput from "./src/zyX-Input.js";
// Websocket
import ZyXIO from "./src/zyX-IO.js";
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
    seedRandom
} from "./src/zyX-Toolbox.js";

// Currently implemented exports
export {
    // HTML
    html,
    makePlaceable,
    // CSS
    css,
    zyxcss,
    // Store
    Cookies,
    ZyXHtml,
    ZyXAudio,
    ZyXEvents,
    // Input
    ZyXInput,
    // Websocket
    ZyXIO,
    // Dynamic Variable
    dynamicVar,
    // LiveDomList
    LiveDomList,
    // Types
    WeakRefSet,
    Deque,
    LiveList,
    LiveVariable,
    LiveDeque,
    // Async
    sleep,
    AsyncWorker,
    AsynConstructor,
    // Delay
    delayChain,
    breakDelayChain,
    clearDelay,
    delay,
    debounce,
    instant,
    asyncPool,
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
    sS,
    seedShuffle,
    seedRandom,

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
`