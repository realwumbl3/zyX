import { fetchCSS } from "./zyX-Fetch.js";

export function getAllShadowRoots() {
    return [...document.querySelectorAll("zyx-shadow-root")].map((node) => node.shadow);
}

export function forEachShadowRoot(callback) {
    getAllShadowRoots().forEach(callback);
}

export function clearAllSelections() {
    forEachShadowRoot((shadowRoot) => shadowRoot.getSelection?.().removeAllRanges());
    document.getSelection?.().removeAllRanges();
}

export function queryAllRoots(selector) {
    const all = [];
    forEachShadowRoot((shadowRoot) => all.push(...shadowRoot.querySelectorAll(selector)));
    all.push(...document.querySelectorAll(selector));
    return all;
}

/**
 * @deprecated
 * @param {Element} node
 */
export function LegacyShadowRoot({ node }) {
    if (node.shadow) return;
    node.shadow = node.attachShadow({ mode: "open" });
    node.shadow.append(...node.childNodes);
    node.loadCSS = async (p) => {
        if (Array.isArray(p)) {
            for (const css of p) await node.loadCSS(css);
            return;
        }
        const { link } = await fetchCSS(p);
        node.shadow.append(link);
    };
    node.removeAttribute("zyx-shadowroot");
}
