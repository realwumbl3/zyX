# zyX Library Function Reference

This document provides a summary of the functions and classes available in the zyX library, based on the exports in `index.js` and their associated JSDoc comments.

## Top-Level Exports (`index.js`)

### `isMobile`

```jsdoc
/**
 * @function isMobile
 * @description Checks if the user agent indicates a mobile device based on touch points.
 * @returns {boolean} True if navigator.maxTouchPoints > 0, false otherwise.
 */
```

### `zyX` (Default Export)

```jsdoc
/**
 * @function zyX
 * @description Creates a proxy object for applying specific zyX utility functions to a given context ('that').
 * This allows chaining methods like `zyX(element).delay(...)`.
 * Currently provides access to: `forQuery`, `setProps`, `delay`, `instant`, `clearDelay`, `delayChain`, `breakDelayChain`, `debounce`.
 * @param {Object} that - The context object ('this') to which the utility functions will be applied.
 * @returns {Proxy} A proxy object enabling chained calls.
 */
```

---

## zyX-HTML (`src/zyX-HTML.js`)

[Module Documentation](./Docs/zyX-HTML/)

### `html`

```jsdoc
/**
 * @function html
 * @description Template literal tag function for creating ZyXHTML instances.
 * Processes HTML strings with embedded expressions and prepares them for DOM manipulation.
 * @param {TemplateStringsArray} raw - The raw HTML template string parts.
 * @param {...*} tagData - The values to be interpolated into the template.
 * @returns {ZyXHTML} A new ZyXHTML instance representing the processed template.
 * @example
 * const myComponent = html`<div id="main">Hello ${name}</div>`;
 * myComponent.appendTo(document.body);
 */
 // Note: This export uses the ZyXHTML class constructor internally.
```

### `ZyXHTML`

```jsdoc
/**
 * @class ZyXHTML
 * @description A class that handles HTML template processing and DOM manipulation. It parses template literals, manages placeholders for dynamic data, constructs DOM fragments, and provides methods for placing the content (`appendTo`, `prependTo`, `place`). It also supports binding to component instances (`bind`, `join`) and special attribute handling.
 */
```

### `makePlaceable`

```jsdoc
/**
 * @function makePlaceable
 * @description Creates a placeable DOM element or fragment from various object types.
 * Handles arrays, functions, ZyXHTML instances, and template elements. Returns primitives directly.
 * Returns an empty string for false, null, or undefined inputs.
 * @param {*} object - The object to convert into a placeable DOM node/fragment.
 * @returns {Element|DocumentFragment|string} The placeable DOM structure or an empty string.
 */
```

---

## zyX-CSS (`src/zyX-CSS.js`)

[Module Documentation](./Docs/zyX-CSS/) <!-- Assuming Docs/zyX-CSS/ exists based on src/zyX-CSS.js -->

### `css`

```jsdoc
/**
 * @function css
 * @description CSS template literal tag function for injecting styles using the global `zyxcss` manager.
 * Can inject inline <style> tags or load external stylesheets via `url()`.
 * @param {TemplateStringsArray} raw - Template literal strings.
 * @param {...any} _ - Template literal expressions (values are interpolated into the string).
 * @returns {Promise<HTMLElement|void>} A promise resolving to the injected <style> element for inline CSS, or void if external URLs are used.
 * @example
 * css`body { background-color: blue; }`;
 * css`url(/path/to/styles.css)`;
 */
```

### `zyxcss`

```jsdoc
/**
 * @const {ZyXCssManager} zyxcss
 * @description Global instance of the ZyXCssManager class, attached to `document.head`. Used by the `css` template tag. Provides methods like `loadUrl` and `str`.
 */
```

---

## zyX-Store (`src/zyX-Store.js`)

[Module Documentation](./Docs/zyX-Store/)

### `Cookies`

```jsdoc
/**
 * @const {ZyXCookie} Cookies
 * @description An instance of the ZyXCookie class for managing browser cookies. Provides `get`, `set`, and `delete` methods.
 * @example
 * Cookies.set('username', 'wumbl3', 30); // Set cookie for 30 days
 * const user = Cookies.get('username', 'guest'); // Get cookie or default
 * Cookies.delete('username'); // Delete cookie
 */
```

---

## zyX-Async (`src/zyX-Async.js`)

[Module Documentation](./Docs/zyX-Async/)

### `sleep`

```jsdoc
/**
 * @function sleep
 * @description Creates a promise that resolves after a specified delay.
 * @param {number} ms - Time to sleep in milliseconds.
 * @param {boolean} [throwOnNegative=true] - Whether to throw an error if `ms` is negative. Defaults to true.
 * @returns {Promise<void>} A promise that resolves after the specified time.
 * @throws {Error} When throwOnNegative is true and ms is negative.
 */
```

### `AsyncWorker`

```jsdoc
/**
 * @class AsyncWorker
 * @description Manages Web Workers with enhanced features like task management (`execute`), event handling (`on`, `off`), and error handling. Simplifies communication with worker threads.
 * @param {object} options - Configuration options.
 * @param {string} options.url - Path to the worker script file.
 * @param {string} [options.type="module"] - Worker type (e.g., 'module', 'classic').
 * @param {Function} [options.errorHandler=console.error] - Custom function to handle errors from the worker.
 */
```

### `AsynConstructor`

```jsdoc
/**
 * @class AsynConstructor
 * @description Base class for creating classes that require asynchronous initialization. Provides `asyncInit` method hook, `isInitialized` getter, and `waitForInit` method.
 * @param {Object} [options] - Configuration options.
 * @param {number} [options.delay=1] - Delay in milliseconds before starting async initialization (unless `immediate` is true).
 * @param {boolean} [options.immediate=false] - If true, starts initialization using `queueMicrotask` instead of `setTimeout`.
 */
```

### `asyncPool`

```jsdoc
/**
 * @function asyncPool
 * @description Runs multiple asynchronous tasks with a controlled level of concurrency.
 * @param {number} concurrency - Maximum number of tasks to run simultaneously.
 * @param {Array<*>} tasks - An array of items to be processed by the `iteratorFn`.
 * @param {Function} iteratorFn - An async function that takes an item from `tasks` and the `tasks` array itself, and performs the asynchronous operation. Must return a Promise.
 * @returns {Promise<Array<*>>} A promise that resolves with an array containing the results of all tasks in the original order.
 */
```

---

## zyX-Delay (`src/zyX-Delay.js`)

[Module Documentation](./Docs/zyX-Delay/)

### `delayChain`

```jsdoc
/**
 * @function delayChain
 * @description Creates a chainable sequence of delayed function executions associated with a specific context (`that`) and key (`keyname`). Existing chains with the same key are cleared.
 * @param {Object} that - The context object to associate the delay chain with.
 * @param {string} keyname - A unique key name for this delay chain within the context.
 * @returns {object} An object with a `then` method.
 * @example
 * delayChain(this, 'animation')
 *  .then(() => { console.log('Step 1'); }, 500)
 *  .then(() => { console.log('Step 2'); }, 1000);
 */
```

### `breakDelayChain`

```jsdoc
/**
 * @function breakDelayChain
 * @description Clears any pending timeouts and callbacks for a specific delay chain associated with a context (`that`) and key (`keyname`).
 * @param {Object} that - The context object associated with the delay chain.
 * @param {string} keyname - The key name of the delay chain to break.
 */
```

### `clearDelay`

```jsdoc
/**
 * @function clearDelay
 * @description Clears one or more pending timeouts created by the `delay` function, associated with a specific context (`that`) and key name(s).
 * @param {Object} that - The context object associated with the delay(s).
 * @param {...string} keynames - The key name(s) of the delays to clear.
 */
```

### `delay`

```jsdoc
/**
 * @function delay
 * @description Creates a delayed execution associated with a context (`that`) and key (`keyname`). If called again with the same key before the delay expires, the previous delay is cancelled.
 * @param {Object} that - The context object to associate the delay with.
 * @param {string} keyname - A unique key name for this delay within the context.
 * @param {number} ms - The delay duration in milliseconds.
 * @param {Function} [func] - An optional function to execute after the delay. If provided, the promise resolves with the function's return value.
 * @returns {Promise<*>} A promise that resolves after the delay. If `func` is provided, it resolves with the result of `func()`.
 */
```

### `debounce`

```jsdoc
/**
 * @function debounce
 * @description Debounces a function call associated with a context (`that`) and key (`keyname`). Ensures the function is only called after a certain period of inactivity. If called multiple times within the `ms` duration, only the last provided `func` will execute.
 * @param {Object} that - The context object to associate the debounce with.
 * @param {string} keyname - A unique key name for this debounce operation within the context.
 * @param {Function} func - The function to debounce.
 * @param {number} ms - The debounce duration in milliseconds.
 */
```

### `instant`

```jsdoc
/**
 * @function instant
 * @description Immediately executes the function associated with a pending delay (created by `delay`) and cancels the timeout. Does nothing if no delay exists for the key.
 * @param {Object} that - The context object associated with the delay.
 * @param {string} keyname - The key name of the delay to execute instantly.
 */
```

---

## zyX-Events (`src/zyX-Events.js`)

[Module Documentation](./Docs/zyX-Events/)

### `ZyXEvents`

```jsdoc
/**
 * @class ZyXEvents
 * @description A lightweight event emitter implementation. Provides methods for subscribing (`on`), emitting (`call`), and unsubscribing (`off`) from events. Supports multiple event names separated by commas and basic error handling for callbacks.
 * @example
 * const events = new ZyXEvents();
 * events.on('userLogin,userLogout', (user) => console.log(`User event for ${user.name}`));
 * events.call('userLogin', { name: 'John' });
 * events.off('userLogout');
 */
```

---

## zyX-Math (`src/zyX-Math.js`)

[Module Documentation](./Docs/zyX-Math/)

### `clamp`

```jsdoc
/**
 * @function clamp
 * @description Clamps a numeric value between a minimum and maximum value.
 * @param {number} value - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value, ensuring `min <= value <= max`.
 */
```

### `lerp`

```jsdoc
/**
 * @function lerp
 * @description Performs linear interpolation between two values.
 * @param {number} start - The starting value (when t=0).
 * @param {number} end - The ending value (when t=1).
 * @param {number} t - The interpolation factor, typically between 0 and 1.
 * @returns {number} The interpolated value.
 */
```

### `mapRange`

```jsdoc
/**
 * @function mapRange
 * @description Maps a value from one numerical range to another.
 * @param {number} value - The value to map.
 * @param {number} inMin - The minimum of the input range.
 * @param {number} inMax - The maximum of the input range.
 * @param {number} outMin - The minimum of the output range.
 * @param {number} outMax - The maximum of the output range.
 * @returns {number} The value mapped to the output range.
 */
```

### `scaleFromOffset`

```jsdoc
/**
 * @function scaleFromOffset
 * @description Scales an input value (0 to 1) based on an offset, mapping the range [offset, 1] to [0, 1]. Values below the offset result in 0.
 * @param {number} int - Input value (expected 0 to 1).
 * @param {number} offset - Offset value (expected 0 to 1).
 * @returns {number} The scaled value (0 to 1).
 * @example scaleFromOffset(0.7, 0.5) // returns 0.4
 */
```

### `scaleToOffset`

```jsdoc
/**
 * @function scaleToOffset
 * @description Scales an input value (0 to 1) based on an offset, mapping the range [0, offset] to [0, 1]. Values above the offset result in 1.
 * @param {number} int - Input value (expected 0 to 1).
 * @param {number} offset - Offset value (expected 0 to 1).
 * @returns {number} The scaled value (0 to 1).
 * @example scaleToOffset(0.4, 0.5) // returns 0.8
 */
```

### `roundTo`

```jsdoc
/**
 * @function roundTo
 * @description Rounds a number to the nearest specified multiple.
 * @param {number} value - The value to round.
 * @param {number} multiple - The multiple to round to.
 * @returns {number} The value rounded to the nearest multiple.
 */
```

### `roundToDecimals`

```jsdoc
/**
 * @function roundToDecimals
 * @description Rounds a number to a specific number of decimal places.
 * @param {number} value - The value to round.
 * @param {number} decimals - The number of decimal places to round to.
 * @returns {number} The rounded value.
 */
```

### `randomInt`

```jsdoc
/**
 * @function randomInt
 * @description Generates a random integer between min and max (inclusive).
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {number} A random integer within the specified range.
 */
```

### `randomFloat`

```jsdoc
/**
 * @function randomFloat
 * @description Generates a random floating-point number between min and max, rounded to a specified number of decimals.
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @param {number} decimals - Number of decimal places to round the result to.
 * @returns {number} A random float within the specified range and precision.
 */
```

### `isEven`

```jsdoc
/**
 * @function isEven
 * @description Checks if a number is even.
 * @param {number} value - The value to check.
 * @returns {boolean} True if the number is even, false otherwise.
 */
```

### `isOdd`

```jsdoc
/**
 * @function isOdd
 * @description Checks if a number is odd.
 * @param {number} value - The value to check.
 * @returns {boolean} True if the number is odd, false otherwise.
 */
```

### `isInteger`

```jsdoc
/**
 * @function isInteger
 * @description Checks if a value is an integer using `Number.isInteger`.
 * @param {number} value - The value to check.
 * @returns {boolean} True if the value is an integer, false otherwise.
 */
```

### `isFloat`

```jsdoc
/**
 * @function isFloat
 * @description Checks if a number is a float (i.e., not an integer).
 * @param {number} value - The value to check.
 * @returns {boolean} True if the number is not an integer, false otherwise.
 */
```

---

## zyX-Types (`src/zyX-Types.js`)

[Module Documentation](./Docs/zyX-Types/)

### `WeakRefSet`

```jsdoc
/**
 * @class WeakRefSet
 * @description A Set implementation that holds WeakRefs to its elements, allowing objects to be garbage collected if no other references exist. Provides methods like `add`, `delete`, `forEach`, `get`, `singleize`, and a `size` getter that accounts for potentially garbage-collected refs. Extends standard Set but overrides key methods to work with WeakRefs.
 */
```

### `Deque`

```jsdoc
/**
 * @class Deque
 * @description A double-ended queue implementation extending Array. Provides `prepend`, `append`, `popleft`, `popright`, `isEmpty`, `isFull` methods, constrained by an optional size `limit`.
 * @param {number} limit - The maximum size of the deque. Items are removed from the opposite end when the limit is reached.
 */
```

### `LiveList`

```jsdoc
/**
 * @class LiveList
 * @description An enhanced array implementation that extends Array and provides event handling capabilities. Allows adding (`addListener`) and removing (`removeListener`) callbacks that are triggered on mutation methods (`push`, `pop`, `shift`, `unshift`, `splice`, `set` via proxy).
 * @param {Array} [initialValue] - Optional initial array elements.
 */
 // Note: The getProxy method mentioned in the source is not directly exported. Event listeners are called by the class methods.
```

### `LiveVariable`

```jsdoc
/**
 * @class LiveVariable
 * @description A class to create reactive variables. Holds a value and notifies listeners when the value changes via the `set` method. Listeners subscribe using `subscribe` (alias `addListener`) and unsubscribe using `unsubscribe` (alias `removeListener`). The current value can be accessed via the `value` getter.
 * @param {*} initialValue - The initial value of the variable.
 */
```

### `LiveDeque`

```jsdoc
/**
 * @class LiveDeque
 * @description A double-ended queue (Deque) implementation with event handling capabilities. Extends Deque and adds `addListener`, `removeListener`, and `callListeners` methods. Events are fired on `prepend`, `append`, `popleft`, `popright`.
 * @param {number} limit - The maximum size of the deque.
 */
```

---

## zyX-Audio (`src/zyX-Audio.js`)

[Module Documentation](./Docs/zyX-Audio/)

### `ZyXAudio`

```jsdoc
/**
 * @class ZyXAudio
 * @description Main class for managing audio playback and effects using the Web Audio API. Handles loading sounds (`addSound`), playing sounds (`play`, `playBackgroundMusic`), managing volume (`fadeVolume`, `toggleMute`), applying filters (`setFilter`, `setupFilters`), managing categories, and controlling playback (`stop`, `stopAll`, `pauseAll`, `setPlaybackRate`, `setStereoPan`).
 * @param {string} audio_root - Base URL path for loading audio files.
 */
```

---

## zyX-Fetch (`src/zyX-Fetch.js`)

[Module Documentation](./Docs/zyX-Fetch/)

### `postData`

```jsdoc
/**
 * @function postData
 * @description Sends a POST request with JSON data. Sets 'Content-Type' to 'application/json' and includes credentials.
 * @param {string} url - The URL to send the request to.
 * @param {Object} data - The JavaScript object to be stringified and sent as the request body.
 * @returns {Promise<Response>} A promise resolving to the server's Response object.
 */
```

### `getData`

```jsdoc
/**
 * @function getData
 * @description Sends a GET request. Sets 'Content-Type' to 'application/json' (though typically not needed for GET) and includes credentials.
 * @param {string} url - The URL to send the request to.
 * @returns {Promise<Response>} A promise resolving to the server's Response object.
 */
```

### `postForm`

```jsdoc
/**
 * @function postForm
 * @description Sends a POST request with form data. Converts a JavaScript object into FormData.
 * @param {string} url - The URL to send the request to.
 * @param {Object} data - The JavaScript object containing key-value pairs to be appended to FormData.
 * @returns {Promise<Response>} A promise resolving to the server's Response object.
 */
```

### `fetchCSS`

```jsdoc
/**
 * @function fetchCSS
 * @description Fetches an external CSS stylesheet dynamically by creating a `<link>` element.
 * @param {string} url - The URL of the stylesheet to load.
 * @returns {Promise<{link: HTMLLinkElement, remove: Function}>} A promise resolving to an object containing the created link element and a `remove` function to detach it. The link is removed immediately after loading by default in the implementation, so the primary use might be the side effect of loading the CSS.
 */
```

### `grabBlob`

```jsdoc
/**
 * @function grabBlob
 * @description Fetches content from a URL as a Blob and creates a local object URL for it.
 * @param {string} url - The URL to fetch the blob from.
 * @returns {Promise<{blob: Blob, objectURL: string}>} A promise resolving to an object containing the fetched Blob and its corresponding object URL.
 * @throws {Error} If the fetch request fails (response not ok).
 */
```

### `shrinkImage`

```jsdoc
/**
 * @function shrinkImage
 * @description Resizes an image loaded from a URL to fit within a maximum side dimension while maintaining aspect ratio. Draws the resized image onto a canvas.
 * @param {string} url - The URL of the image to resize.
 * @param {number} maxSide - Maximum width or height (whichever is larger) for the resized image. Defaults to 512 if not provided.
 * @returns {Promise<HTMLCanvasElement>} A promise resolving to a canvas element containing the resized image.
 */
```

### `splitFilename`

```jsdoc
/**
 * @function splitFilename
 * @description Splits a URL or path string into its filename and extension components. Removes query parameters.
 * @param {string} url - The URL or path string.
 * @returns {{filename: string, ext: string}} An object containing the extracted filename and extension (e.g., { filename: 'image.png', ext: 'png' }).
 */
```

### `fetchJSON`

```jsdoc
/**
 * @function fetchJSON
 * @description Sends a fetch request (default GET, customizable via options) and parses the response body as JSON. Includes credentials and sets 'Content-Type' to 'application/json'.
 * @param {string} url - The URL to send the request to.
 * @param {Object} [options] - Standard Fetch API options (method, body, headers, etc.).
 * @returns {Promise<Object>} A promise resolving to the parsed JSON object from the response.
 * @throws {Error} If the request fails (response not ok).
 */
```

### `putData`

```jsdoc
/**
 * @function putData
 * @description Sends a PUT request with JSON data. Sets 'Content-Type' to 'application/json' and includes credentials.
 * @param {string} url - The URL to send the request to.
 * @param {Object} data - The JavaScript object to be stringified and sent as the request body.
 * @returns {Promise<Response>} A promise resolving to the server's Response object.
 */
```

### `deleteData`

```jsdoc
/**
 * @function deleteData
 * @description Sends a DELETE request. Sets 'Content-Type' to 'application/json' and includes credentials.
 * @param {string} url - The URL to send the request to.
 * @returns {Promise<Response>} A promise resolving to the server's Response object.
 */
```

### `injectScript`

```jsdoc
/**
 * @function injectScript
 * @description Dynamically injects a script into the document's `<head>`.
 * @param {string} url - The URL of the script to inject.
 * @returns {Promise<HTMLScriptElement>} A promise resolving to the created script element once it has loaded. Rejects on error.
 */
```

### `dataToBlob`

```jsdoc
/**
 * @function dataToBlob
 * @description Converts arbitrary data (like ArrayBuffer, string, etc.) into a Blob and creates a local object URL for it.
 * @param {*} data - The data to convert into a Blob.
 * @param {string} [type='application/octet-stream'] - The MIME type to assign to the blob.
 * @returns {Promise<{blob: Blob, objectURL: string}>} A promise resolving to an object containing the created Blob and its corresponding object URL.
 */
```

### `fetchWithTimeout`

```jsdoc
/**
 * @function fetchWithTimeout
 * @description Performs a fetch request with a specified timeout. Aborts the request if it doesn't complete within the timeout period.
 * @param {string} url - The URL to fetch from.
 * @param {Object} [options={}] - Standard Fetch API options.
 * @param {number} [timeout=5000] - Timeout duration in milliseconds. Defaults to 5000ms.
 * @returns {Promise<Response>} A promise resolving to the server's Response object.
 * @throws {Error} If the request times out (AbortError).
 */
```

---

## zyX-Focus (`src/zyX-Focus.js`)

[Module Documentation](./Docs/zyX-Focus/) <!-- Assuming Docs/zyX-Focus/ exists -->

### `FocusController`

```jsdoc
/**
 * @class FocusController
 * @description Manages focus between different application modules ("Focusables"). Tracks the currently focused module, allows setting focus (`setFocus`), handles focus redirection via Focusable instances, and manages a default focus target.
 * @param {Object} defaultFocusable - The default module instance (which should have a `__focusable__` property of type Focusable) to receive focus when `setFocus(null)` is called or initially.
 */
```

### `Focusable`

```jsdoc
/**
 * @class Focusable
 * @description Base class or mixin logic for modules that can receive focus managed by a `FocusController`. Stores focus state (`focused`), handles redirection (`redirect`, `setRedirection`), and provides lifecycle methods (`focus`, `unFocus`) to be called by the controller. An instance of this should typically be attached to the module it manages (e.g., `moduleInstance.__focusable__ = new Focusable(moduleInstance)`).
 * @param {Object} module - The module instance this Focusable instance is managing.
 */
```

---

## zyX-Input (`src/zyX-Input.js`)

[Module Documentation](./Docs/zyX-Input/) <!-- Assuming Docs/zyX-Input/ exists -->

### `ZyXInput`

```jsdoc
/**
 * @class ZyXInput
 * @description A comprehensive input handling system for web applications. Manages keyboard (`keyEvent`), mouse/touch (`pointerdown`, `pointermove`, `click`, `contextmenu`, etc.), and potentially controller inputs (`socketXinputEvent`). Features include focus management via `FocusController`, modal isolation (`isolateEventWithinContainer`, `processModalEvent`), momentum scrolling (`bindMomentumScroll`), back button handling (`BackHandler`), customizable event handlers (`on`, `customEventHandlers`), move detection with deadzone (`moveTripper`), and input state tracking.
 * @param {Object} [options={}] - Configuration options.
 * @param {Function} [options.customQueryFunc] - Optional custom function to replace `document.querySelectorAll`.
 * @param {Function} [options.customClearSelections] - Optional custom function to replace `window.getSelection().removeAllRanges()`.
 * @param {Function} [options.onKeyPress] - Optional global callback triggered on key events before focus module processing.
 */
```

---

## zyX-IO (`src/zyX-IO.js`)

[Module Documentation](./Docs/zyX-IO/) <!-- Assuming Docs/zyX-IO/ exists -->

### `ZyXIO`

```jsdoc
/**
 * @class ZyXIO
 * @description A helper class for managing WebSocket connections using Socket.IO client library. Simplifies connection (`connect`, `disconnect`), event binding (`bind`), event emission (`emit`), room management (`join`, `leave`, `getRooms`), and handles common connection lifecycle events (`connected`, `disconnected`, `error`).
 * @param {WebSocketConfig} config - Configuration options.
 * @param {string} config.endpointUrl - The WebSocket server URL (required).
 * @param {Object} [config.events={}] - Event handlers to bind upon instantiation (event name -> callback function).
 * @param {boolean} [config.autoConnect=true] - Whether to connect automatically when the instance is created.
 * @param {boolean} [config.debug=false] - Enable verbose console logging for connection and event activity.
 * @param {Object} [config.socketOptions={}] - Additional options to pass directly to the Socket.IO client constructor (e.g., reconnection settings).
 */
```

---

## zyX-Toolbox (`src/zyX-Toolbox.js`)

[Module Documentation](./Docs/zyX-Toolbox/) <!-- Assuming Docs/zyX-Toolbox/ exists -->

### `forQuery`

```jsdoc
/**
 * @function forQuery
 * @description Utility to apply a callback function to all elements within a parent element that match a CSS query selector. Syntactic sugar for `[...that.querySelectorAll(query)].forEach(cbfn)`.
 * @param {Element} that - The parent element to search within.
 * @param {string} query - The CSS query selector.
 * @param {Function} cbfn - The callback function to apply to each matching element. The element is passed as an argument.
 */
```

### `setProps`

```jsdoc
/**
 * @function setProps
 * @description Sets multiple CSS style properties on a DOM element.
 * @param {Element} that - The target DOM element.
 * @param {Object<string, string>} props - An object where keys are CSS property names (e.g., 'backgroundColor', '--my-var') and values are the corresponding CSS values.
 */
```

### `placeSafely`

```jsdoc
/**
 * @function placeSafely
 * @description Asynchronously positions an element (`target`) within a `container` at specified coordinates (`x`, `y`), ensuring it stays within the container's bounds after placement. Adjusts position if it overflows. Coordinates can be negative to position relative to the right/bottom edges.
 * @param {Element} target - The element to position. Must be appended to the DOM before calling, or appended by this function.
 * @param {Element} container - The container element whose bounds the target should respect.
 * @param {number} x - The target X coordinate within the container. Negative values position from the right edge.
 * @param {number} y - The target Y coordinate within the container. Negative values position from the bottom edge.
 * @param {string} [unit="em"] - The CSS unit to use for the initial positioning (e.g., "px", "%", "em"). Boundary correction uses pixels.
 */
```

### `pointerEventPathContains`

```jsdoc
/**
 * @function pointerEventPathContains
 * @description Checks if a specific DOM element exists within the composed path of a pointer event (useful for handling events on shadow DOM or nested elements).
 * @param {Event} e - The pointer event object (e.g., from click, pointerdown).
 * @param {Element} elem - The specific DOM element to check for in the event path.
 * @returns {boolean} True if the element is found in the event's composed path, false otherwise. Returns false if `composedPath` is not available.
 */
```

### `pointerEventPathContainsMatching`

```jsdoc
/**
 * @function pointerEventPathContainsMatching
 * @description Finds the first element within the composed path of a pointer event that matches a given CSS selector.
 * @param {Event} e - The pointer event object.
 * @param {string} cssSelector - The CSS selector to match against elements in the event path.
 * @returns {Element|null} The first matching element found in the path, or null if no match is found or `composedPath` is unavailable.
 */
```

### `hslCssKeys`

```jsdoc
/**
 * @function hslCssKeys
 * @description Converts numerical HSL values into CSS-compatible string format (adds 'deg' for hue and '%' for saturation/lightness).
 * @param {Object} [params={}] - Object containing HSL parameters.
 * @param {number} [params.h=0] - Hue value (0-360).
 * @param {number} [params.s=0] - Saturation value (0-100).
 * @param {number} [params.l=0] - Lightness value (0-100).
 * @returns {{h: string, s: string, l: string}} An object with CSS-ready HSL string values (e.g., { h: '120deg', s: '50%', l: '75%' }).
 */
```

### `hexToRGB`

```jsdoc
/**
 * @function hexToRGB
 * @description Converts a hex color code (e.g., "#FF0000" or "FF0000") to an object containing RGB values normalized to the range 0-1.
 * @param {string} hex - The hex color code string.
 * @returns {{r: number, g: number, b: number}} An object with r, g, b properties, where each value is between 0 and 1.
 */
```

### `hexToHSL`

```jsdoc
/**
 * @function hexToHSL
 * @description Converts a hex color code (e.g., "#FF0000") to an object containing HSL values (Hue: 0-360, Saturation/Lightness: 0-100).
 * @param {string} hex - The hex color code string.
 * @returns {{h: number, s: number, l: number}} An object with h, s, l properties representing the HSL values.
 */
```

### `sS`

```jsdoc
/**
 * @function sS
 * @description Simple utility function that returns the string 's' if the input number is greater than 1, otherwise returns an empty string. Useful for pluralizing words based on a count.
 * @param {number} int - The number to check for pluralization.
 * @returns {string} 's' or ''.
 */
```

### `seedShuffle`

```jsdoc
/**
 * @function seedShuffle
 * @description Shuffles an array in place using the Fisher-Yates algorithm powered by a seeded pseudo-random number generator (`seedRandom`). The shuffle order is deterministic based on the initial seed.
 * @param {Array} array - The array to shuffle.
 * @param {number} seed - The seed value for the random number generator.
 * @returns {Array} The original array, now shuffled.
 */
```

### `seedRandom`

```jsdoc
/**
 * @function seedRandom
 * @description Generates a pseudo-random number between 0 (inclusive) and 1 (exclusive) based on a seed value. Uses `Math.sin` for pseudo-randomness. The sequence is deterministic for a given starting seed. Note: This is a simple PRNG, not cryptographically secure.
 * @param {number} seed - The seed value. The function increments the seed internally for subsequent calls if maintaining state externally.
 * @returns {number} A pseudo-random number between 0 and 1.
 */
```

</rewritten_file> 