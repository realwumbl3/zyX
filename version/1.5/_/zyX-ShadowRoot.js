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

