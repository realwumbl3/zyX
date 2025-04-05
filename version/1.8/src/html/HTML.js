/**
 * @param {string} markup
 * @returns {Element}
 */
export function innerHTML(markup) {
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
 * @type {string}
 */
export const placeholdTag = "zyx-ph";

/**
 * @param {string} key
 * @returns {string}
 */
export function strPlaceholder(key) {
  return `<${placeholdTag} id='${key}'></${placeholdTag}>`;
}

/**
 * @type {RegExp}
 */
export const placeholderRegex = new RegExp(`(${strPlaceholder("\\d+")})`, "g");

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
