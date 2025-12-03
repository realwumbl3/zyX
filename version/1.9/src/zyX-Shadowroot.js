import { fetchCSS } from "./zyX-Fetch.js";

/**
 * Retrieves all shadow roots in the document.
 * @returns {ShadowRoot[]} An array of all shadow roots in the document.
 */
export function getAllShadowRoots() {
    return [...document.querySelectorAll("[zyx-shadowroot-processed]")].map((node) => node.shadow).filter(Boolean);
}

/**
 * Executes a callback function for each shadow root in the document.
 * @param {function(ShadowRoot): void} callback - The function to execute on each shadow root.
 */
export function forEachShadowRoot(callback) {
    const shadowRoots = getAllShadowRoots();
    shadowRoots.forEach(callback);
}

/**
 * Clears all text selections in every shadow root and the main document.
 */
export function clearAllSelections() {
    // Clear selections in shadow roots
    forEachShadowRoot((shadowRoot) => {
        if (shadowRoot.getSelection) {
            shadowRoot.getSelection().removeAllRanges();
        }
    });

    // Clear selection in main document
    if (document.getSelection) {
        document.getSelection().removeAllRanges();
    }
}

/**
 * Queries for elements matching the selector across all shadow roots and the main document.
 * @param {string} selector - The CSS selector to match elements against.
 * @returns {Element[]} An array of all matching elements.
 */
export function queryAllRoots(selector) {
    const results = [];

    // Query elements in shadow roots
    forEachShadowRoot((shadowRoot) => {
        results.push(...shadowRoot.querySelectorAll(selector));
    });

    // Query elements in main document
    results.push(...document.querySelectorAll(selector));

    return results;
}

/**
 * Creates a shadow root for the provided node and moves its children into the shadow DOM.
 * @param {Object} options - The options object.
 * @param {Element} options.node - The element to create a shadow root for.
 * @returns {void}
 */
export function LegacyShadowRoot({ node }) {
    // Don't process if already has a shadow root
    if (node.shadow) return;

    // Create shadow root and move children
    node.shadow = node.attachShadow({ mode: "open" });
    const styles = document.createElement("style");

    node.shadow.append(...node.childNodes);
    node.shadow.append(styles);

    /**
     * Loads CSS into the shadow root.
     * @param {string|string[]} paths - The path(s) to CSS file(s) to load.
     * @returns {Promise<void>}
     */
    node.loadCSS = async (paths) => {
        if (Array.isArray(paths)) {
            for (const cssPath of paths) {
                await node.loadCSS(cssPath);
            }
            return;
        }

        // const { link } = await fetchCSS(paths);
        // // styles.appendChild(link);
        // node.shadow.appendChild(link);

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = paths;

        await new Promise((resolve, reject) => {
            link.onload = () => resolve();
            link.onerror = reject;
            // Append into the shadow root so styles apply inside it
            node.shadow.appendChild(link);
        });
    };

    // Mark as processed
    node.removeAttribute("zyx-shadowroot");
}
