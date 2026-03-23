/**
 * Parse an HTML string into a container element.
 *
 * Notes on special cases:
 * - Table section elements (`<tr>`, `<td>`, `<th>`) cannot be direct children of a `<div>`.
 *   If we parse them inside a generic `<div>`, browsers may generate unexpected wrapper
 *   structures or drop them entirely. To preserve the intended structure, we parse:
 *     - `<tr>...</tr>` inside a `<tbody>`
 *     - `<td>...</td>` / `<th>...</th>` inside a `<tr>`
 *
 * This ensures that ZyXHTML templates like `html`<tr>...</tr`` and `html`<td>...</td``
 * survive parsing and can later be correctly inserted into real `<table>` / `<tr>` parents.
 *
 * @param {string} markup
 * @returns {Element}
 */
export function innerHTML(markup) {
    const trimmed = markup.trimStart();

    // Handle table row templates as top-level markup.
    // Example: html`<tr>...</tr>`
    if (/^<tr\b/i.test(trimmed)) {
        const tbody = document.createElement("tbody");
        tbody.innerHTML = markup;
        return tbody;
    }

    // Handle table cell / header templates as top-level markup.
    // Example: html`<td>...</td>` or html`<th>...</th>`
    if (/^<(td|th)\b/i.test(trimmed)) {
        const tr = document.createElement("tr");
        tr.innerHTML = markup;
        return tr;
    }

    // Default behavior: parse into a generic container.
    const markupContent = document.createElement("div");
    markupContent.innerHTML = markup;
    return markupContent;
}

/**
 * @param {Element} markup
 * @returns {Element}
 */
export function wrapInTemplate(markup) {
    const asHTMLTemplate = document.createElement("template");
    asHTMLTemplate.content.append(...markup.childNodes);
    return asHTMLTemplate;
}

/**
 * Places a node in the DOM
 * if where is an object, it will replace the node
 * if where is a string, it look for a ph (placeholder) node with that id and replace it
 * @param {Element} what
 * @param {string|Element} where
 * @returns {void}
 */
export function placer(what, where) {
    if (typeof where === "object") return where.replaceWith(what);
    const placeTarget = document.querySelector(`ph[${where}]`);
    if (placeTarget) placeTarget.replaceWith(what);
    else throw new Error(`${where} not found`);
}


/**
 * @param {string} markup
 * @returns {string}
 */
export function getPlaceholderID(markup) {
    const match = markup.match(/id='(.*?)'/);
    return match?.length > 0 ? match[1] : null;
}

/**
 * @param {Element} dom
 * @returns {Element}
 */
export function trimTextNodes(dom) {
    // remove first and last child if they are empty text nodes
    const nodes = dom.childNodes;
    for (let i = 0; i < 2; i++) {
        if (!nodes[i]) continue;
        if (nodes[i].nodeType === 3 && nodes[i].textContent.trim() === "") {
            dom.removeChild(nodes[i]);
        }
    }
    return dom;
}

// Convert markup strings to HTML elements.
// Returns an array of all the created elements.
export function getTopLevelElements(htmlString) {
    // Create a temporary container
    const container = document.createElement("div");
    container.innerHTML = htmlString.trim();

    // Convert the top-level child nodes to an array
    return Array.from(container.children);
}

/**
 * Inserts a node after a reference node
 * @param {Element} newNode
 * @param {Element} referenceNode
 * @returns {void}
 */
export function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
