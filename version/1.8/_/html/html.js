export function innerHTML(markup) {
  const markupContent = document.createElement("div");
  markupContent.innerHTML = markup;
  return markupContent;
}

export function wrapInTemplate(markup) {
  const asHTMLTemplate = document.createElement("template");
  asHTMLTemplate.content.append(...markup.childNodes);
  return asHTMLTemplate;
}

export function placer(what, where) {
  if (typeof where === "object") return where.replaceWith(what);
  const placeTarget = document.querySelector(`ph[${where}]`);
  if (placeTarget) placeTarget.replaceWith(what);
  else throw new Error(`${where} not found`);
}

export const placeholdTag = "zyx-ph";

export function strPlaceholder(key) {
  return `<${placeholdTag} id='${key}'></${placeholdTag}>`;
}

// export function strPlaceholderHTML(key) {
//   return `&lt;${placeholdTag} id='${key}'&gt;&lt;/${placeholdTag}&gt;`;
// }

export const placeholderRegex = new RegExp(`(${strPlaceholder("\\d+")})`, "g");
// export const placeholderRegexHTML = new RegExp(`(${strPlaceholderHTML("\\d+")})`, "g");

export function getPlaceholderID(markup) {
  const match = markup.match(/id='(.*?)'/);
  return match?.length > 0 ? match[1] : null;
}

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
