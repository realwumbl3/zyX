/**
 * @fileoverview CSS management module for zyX framework
 * @module zyX-CSS
 */

import { fetchCSS } from "./zyX-Fetch.js";
import  html from "./zyX-HTML.js";

/**
 * Manages CSS styles in the application, providing methods to load external stylesheets
 * and inject inline styles.
 * @class
 */
export class ZyXCssManager {
    /**
     * Creates a new CSS manager instance
     * @param {Object} options - Configuration options
     * @param {HTMLElement} [options.root] - The root element to append styles to (defaults to document.head)
     */
    constructor({ root } = {}) {
        html` <styles this="styles"></styles> `.bind(this);
        if (root) this.appendTo(root);
    }

    /**
     * Loads an external stylesheet from a URL
     * @param {string} url - The URL of the stylesheet to load
     * @returns {Promise<{link: HTMLLinkElement, remove: Function}>} Object containing the link element and a remove function
     */
    async loadUrl(url) {
        const { link, remove } = await fetchCSS(url);
        this.styles.appendChild(link);
        return { link, remove };
    }

    /**
     * Processes and injects CSS styles
     * @param {TemplateStringsArray} raw - Template literal strings
     * @param {...any} _ - Template literal expressions
     * @returns {Promise<HTMLElement|void>} The style element if inline CSS, void if external URL
     */
    async str(raw, ..._) {
        const strcss = String.raw(raw, ..._);
        if (String(strcss).startsWith("url(")) {
            const urls = strcss
                .split("url(")
                .slice(1)
                .map((url) => url.split(")")[0]);
            for (const url of urls) await this.loadUrl(url);
            return;
        }
        return html`<style this="style">${strcss}</style>`.appendTo(this.styles);
    }

    /**
     * Creates a new instance of ZyXCssManager with a different root element
     * @param {HTMLElement} root - The new root element
     * @returns {ZyXCssManager} A new CSS manager instance
     */
    cloneType(root) {
        return new ZyXCssManager({ root });
    }
}

/**
 * Global CSS manager instance
 * @type {ZyXCssManager}
 */
export const zyxcss = new ZyXCssManager({
    root: typeof document !== "undefined" && document.head,
});

/**
 * CSS template literal tag function for injecting styles
 * @param {TemplateStringsArray} raw - Template literal strings
 * @param {...any} _ - Template literal expressions
 * @returns {Promise<HTMLElement|void>} The style element if inline CSS, void if external URL
 */
export default function css(raw, ..._) {
    return zyxcss.str(raw, ..._);
}
