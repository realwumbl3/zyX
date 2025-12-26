/**
 * @module zyX-Fetch
 * @description A comprehensive HTTP request and file handling module.
 * Provides functionality for making HTTP requests, handling file uploads, and managing binary data.
 */

/**
 * @function postData
 * @description Send a POST request with JSON data
 * @param {string} url - The URL to send the request to
 * @param {Object} data - The data to send in the request body
 * @param {Object} [options] - Additional request options
 * @param {Object} [options.headers] - Custom headers to include
 * @param {Function} [options.onProgress] - Callback for upload progress
 * @returns {Promise<Response>} The response from the server
 */
export function postData(url, data, options = {}) {
    if (options.form) {
        return postForm(url, data, options);
    }
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "POST",
        credentials: "include",
        body: JSON.stringify(data),
        ...options,
    });
}

/**
 * @function getData
 * @description Send a GET request
 * @param {string} url - The URL to send the request to
 * @param {Object} [options] - Additional request options
 * @param {Object} [options.headers] - Custom headers to include
 * @returns {Promise<Response>} The response from the server
 */
export function getData(url, options = {}) {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "GET",
        credentials: "include",
        ...options,
    });
}

/**
 * @function postForm
 * @description Send a POST request with form data
 * @param {string} url - The URL to send the request to
 * @param {FormData} formData - The form data to send
 * @param {Object} [options] - Additional request options
 * @param {Object} [options.headers] - Custom headers to include
 * @param {Function} [options.onProgress] - Callback for upload progress
 * @returns {Promise<Response>} The response from the server
 */
export function postForm(url, data, options = {}) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    return fetch(url, {
        method: "POST",
        credentials: "include",
        body: formData,
        ...options,
    });
}

/**
 * @function fetchCSS
 * @description Fetches a CSS stylesheet asynchronously and returns a promise containing the link element and a remove function
 * @param {string} url - The URL of the stylesheet to load
 * @returns {Promise<{link: HTMLLinkElement, remove: Function}>} Object containing the link element and a remove function
 */
export function fetchCSS(url) {
    return new Promise((res, rej) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.onload = () => {
            link.remove();
            res({ link, remove: () => link.remove() });
        };
        link.onerror = rej;
        link.href = url;
        document.head.appendChild(link);
    });
}

/**
 * @function grabBlob
 * @description Fetches a blob from a URL and creates an object URL
 * @param {string} url - The URL to fetch the blob from
 * @returns {Promise<{blob: Blob, objectURL: string}>} Object containing the blob and its object URL
 * @throws {Error} If the blob fetch fails
 */
export async function grabBlob(url) {
    const response = await fetch(url);
    if (response.ok) {
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        return { blob, objectURL };
    } else {
        throw new Error("Blob fetch failed");
    }
}

/**
 * @function loadImg
 * @description Loads an image from a URL
 * @param {string} url - The URL of the image to load
 * @returns {Promise<HTMLImageElement>} The loaded image element
 * @throws {Error} If the image fails to load
 */
export async function loadImg(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * @function shrinkImage
 * @description Resizes an image to fit within specified dimensions while maintaining aspect ratio
 * @param {string} url - The URL of the image to resize
 * @param {number} maxSide - Maximum width or height of the resized image
 * @returns {Promise<HTMLCanvasElement>} Canvas element containing the resized image
 */
export async function shrinkImage(url, maxSide) {
    const image = await loadImg(url);
    maxSide = maxSide || 512;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const [width, height] = resizeImage(image.width, image.height, maxSide);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return canvas;
}

/**
 * @function resizeImage
 * @description Calculates new dimensions for an image while maintaining aspect ratio
 * @param {number} width - Original width of the image
 * @param {number} height - Original height of the image
 * @param {number} maxSize - Maximum size for the larger dimension
 * @returns {[number, number]} Array containing new width and height
 */
function resizeImage(width, height, maxSize) {
    if (width > maxSize || height > maxSize) {
        const ratio = maxSize / Math.max(width, height);
        return [width * ratio, height * ratio];
    }
    return [width, height];
}

/**
 * @function splitFilename
 * @description Splits a URL into filename and extension
 * @param {string} url - The URL to split
 * @returns {{filename: string, ext: string}} Object containing filename and extension
 */
export function splitFilename(url) {
    const filename = url.replace(/^.*[\\\/]/, "").split("?")[0];
    return { filename, ext: filename.split(".").pop() };
}

/**
 * @function fetchJSON
 * @description Send a request and parse the response as JSON
 * @param {string} url - The URL to send the request to
 * @param {Object} [options] - Request options
 * @param {string} [options.method='GET'] - HTTP method to use
 * @param {Object} [options.body] - Request body data
 * @param {Object} [options.headers] - Custom headers to include
 * @returns {Promise<Object>} The parsed JSON response
 */
export async function fetchJSON(url, options = {}) {
    const response = await fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        credentials: "include",
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
}

/**
 * @function putData
 * @description Send a PUT request with JSON data
 * @param {string} url - The URL to send the request to
 * @param {Object} data - The data to send in the request body
 * @returns {Promise<Response>} The response from the server
 */
export function putData(url, data) {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "PUT",
        credentials: "include",
        body: JSON.stringify(data),
    });
}

/**
 * @function deleteData
 * @description Send a DELETE request
 * @param {string} url - The URL to send the request to
 * @returns {Promise<Response>} The response from the server
 */
export function deleteData(url) {
    return fetch(url, {
        headers: new Headers({ "Content-Type": "application/json" }),
        method: "DELETE",
        credentials: "include",
    });
}

/**
 * @function injectScript
 * @description Inject a script into the document
 * @param {string} src - URL of the script to inject
 * @param {Object} [options] - Script options
 * @param {boolean} [options.async=false] - Whether to load the script asynchronously
 * @param {boolean} [options.defer=false] - Whether to defer script loading
 * @returns {Promise<HTMLScriptElement>} The created script element
 */
export async function injectScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => resolve(script);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * @function dataToBlob
 * @description Converts data to a Blob and creates an object URL
 * @param {*} data - The data to convert to a Blob
 * @param {string} [type='application/octet-stream'] - MIME type of the blob
 * @returns {Promise<{blob: Blob, objectURL: string}>} Object containing the blob and its object URL
 */
export async function dataToBlob(data, type = "application/octet-stream") {
    const blob = new Blob([data], { type });
    return {
        blob,
        objectURL: URL.createObjectURL(blob),
    };
}

/**
 * @function fetchWithTimeout
 * @description Fetches data with a timeout
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Fetch options
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<Response>} The response from the server
 * @throws {Error} If the request times out
 */
export async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * @function tryFetch
 * @description Attempts to fetch data with retries
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Fetch options
 * @param {number} [retries=3] - Number of retry attempts
 * @param {number} [delay=1000] - Delay between retries in milliseconds
 * @returns {Promise<Response>} The response from the server
 * @throws {Error} If all retry attempts fail
 */
export async function tryFetch(url, options = {}, retries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fetch(url, options);
        } catch (error) {
            lastError = error;
            if (attempt < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

/**
 * @function downloadFile
 * @description Download a file from a URL
 * @param {string} url - URL of the file to download
 * @param {string} filename - Name to save the file as
 * @param {Object} [options] - Download options
 * @param {Function} [options.onProgress] - Callback for download progress
 * @returns {Promise<void>}
 */
export function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename || "";
        link.style.display = "none";

        link.onclick = () => {
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
                link.remove();
                resolve();
            }, 150);
        };

        link.onerror = () => {
            URL.revokeObjectURL(link.href);
            link.remove();
            reject(new Error("Download failed"));
        };

        document.body.appendChild(link);
        link.click();
    });
}

/**
 * @function blobToBase64
 * @description Convert a Blob to a base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} The base64 string
 */
export async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * @function canvasToBlob
 * @description Convert a canvas to a Blob
 * @param {HTMLCanvasElement} canvas - The canvas to convert
 * @param {string} [type='image/png'] - MIME type of the output
 * @param {number} [quality=0.8] - Quality of the output (0-1)
 * @returns {Promise<Blob>} The created blob
 */
export function canvasToBlob(canvas, type = "image/png", quality = 0.8) {
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                resolve({
                    blob,
                    objectURL: URL.createObjectURL(blob),
                });
            },
            type,
            quality
        );
    });
}

/**
 * @function handleUploadProgress
 * @description Handle upload progress events
 * @param {XMLHttpRequest} xhr - The XMLHttpRequest instance
 * @param {Function} onProgress - Progress callback function
 */
export function handleUploadProgress(xhr, onProgress) {
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(percent, e);
        }
    };
}

/**
 * @function preloadImage
 * @description Preloads an image and returns its dimensions
 * @param {string} url - The URL of the image to preload
 * @returns {Promise<{img: HTMLImageElement, width: number, height: number}>} Object containing the image and its dimensions
 */
export async function preloadImage(url) {
    const img = await loadImg(url);
    return {
        img,
        width: img.width,
        height: img.height,
    };
}

/**
 * @function cancelableFetch
 * @description Creates a cancelable fetch request
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Fetch options
 * @returns {{promise: Promise<Response>, cancel: Function}} Object containing the fetch promise and cancel function
 */
export function cancelableFetch(url, options = {}) {
    const controller = new AbortController();
    const signal = controller.signal;

    const promise = fetch(url, { ...options, signal });

    return {
        promise,
        cancel: () => controller.abort(),
    };
}

/**
 * @function fetchMultiple
 * @description Fetches multiple URLs in parallel
 * @param {Array<string|Object>} requests - Array of URLs or request objects
 * @returns {Promise<Array<Response>>} Array of responses
 */
export async function fetchMultiple(requests) {
    return Promise.all(
        requests.map((request) => {
            if (typeof request === "string") {
                return fetch(request);
            } else {
                const { url, ...options } = request;
                return fetch(url, options);
            }
        })
    );
}

/**
 * @function createWebSocketConnection
 * @description Creates a WebSocket connection with helper methods
 * @param {string} url - The WebSocket URL
 * @param {string|string[]} protocols - WebSocket protocols
 * @returns {{socket: WebSocket, onMessage: Function, send: Function, close: Function}} WebSocket wrapper object
 */
export function createWebSocketConnection(url, protocols) {
    const socket = new WebSocket(url, protocols);

    return {
        socket,
        onMessage: (callback) => {
            socket.addEventListener("message", (event) => {
                try {
                    const data = JSON.parse(event.data);
                    callback(data, event);
                } catch (e) {
                    callback(event.data, event);
                }
            });
        },
        send: (data) => {
            if (typeof data === "object") {
                socket.send(JSON.stringify(data));
            } else {
                socket.send(data);
            }
        },
        close: () => socket.close(),
    };
}

/**
 * @function handleDownloadProgress
 * @description Handle download progress events
 * @param {XMLHttpRequest} xhr - The XMLHttpRequest instance
 * @param {Function} onProgress - Progress callback function
 */
export function handleDownloadProgress(xhr, onProgress) {
    xhr.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
            const percent = (e.loaded / e.total) * 100;
            onProgress(percent, e);
        }
    };
}

/**
 * @function createFormData
 * @description Creates a FormData object from a plain object
 * @param {Object} data - Object to convert to FormData
 * @returns {FormData} The created FormData instance
 */
export function createFormData(data) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    return formData;
}

/**
 * @function createQueryString
 * @description Creates a URL query string from an object
 * @param {Object} params - Object containing query parameters
 * @returns {string} The encoded query string
 */
export function createQueryString(params) {
    return Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");
}

/**
 * @function parseQueryString
 * @description Parses a URL query string into an object
 * @param {string} queryString - The query string to parse
 * @returns {Object} Object containing parsed parameters
 */
export function parseQueryString(queryString) {
    const params = {};
    queryString.split("&").forEach((param) => {
        const [key, value] = param.split("=");
        params[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    return params;
}

/**
 * @function getHeaders
 * @description Gets default headers with optional custom headers
 * @param {Object} [customHeaders] - Custom headers to merge
 * @returns {Object} Combined headers object
 */
export function getHeaders(customHeaders = {}) {
    return {
        ...customHeaders,
        "Content-Type": "application/json",
    };
}

/**
 * @function handleResponse
 * @description Handles a fetch response and returns JSON data
 * @param {Response} response - The fetch response
 * @returns {Promise<Object>} The parsed JSON response
 * @throws {Error} If the response is not ok
 */
export async function handleResponse(response) {
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
}

/**
 * @function handleError
 * @description Handles fetch errors
 * @param {Error} error - The error to handle
 * @returns {Promise<never>} Rejected promise with the error
 */
export function handleError(error) {
    throw error;
}

/**
 * @function isJSON
 * @description Checks if a string is valid JSON
 * @param {string} str - String to check
 * @returns {boolean} Whether the string is valid JSON
 */
export function isJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * @function getContentType
 * @description Gets the content type from a response
 * @param {Response} response - The fetch response
 * @returns {string} The content type
 */
export function getContentType(response) {
    return response.headers.get("Content-Type");
}

/**
 * @function isBlob
 * @description Checks if a value is a Blob
 * @param {*} value - Value to check
 * @returns {boolean} Whether the value is a Blob
 */
export function isBlob(value) {
    return value instanceof Blob;
}

/**
 * @function isFormData
 * @description Checks if a value is FormData
 * @param {*} value - Value to check
 * @returns {boolean} Whether the value is FormData
 */
export function isFormData(value) {
    return value instanceof FormData;
}
