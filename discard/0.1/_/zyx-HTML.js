const debugModule = false;

import { debugCheckpoint, debugStart, debugLog } from "./zyx-debugger.js";

function html(raw, ...data) {
	if (debugModule) debugStart("html`<>`", "es6-html-string --> template");

	const stringExpressions = [];

	for (const [key, val] of Object.entries(data)) {
		if (!val) {
			stringExpressions.push("");
			continue;
		}
		if (val instanceof HTMLElement || val instanceof DocumentFragment) {
			stringExpressions.push(`<StrExpr id="${key}"></StrExpr>`);
		} else {
			stringExpressions.push(val);
		}
		if (debugModule) debugCheckpoint("html`<>`", `placed <StrExpr> id:${key}`);
	}

	const string = String.raw({ raw }, ...stringExpressions);
	const template = stringToTemplate(string);

	if (debugModule) debugCheckpoint("html`<>`", "pass string to stringToTemplate() function");

	for (const strExpPlaceholder of [...template.querySelectorAll("StrExpr")]) {
		strExpPlaceholder.replaceWith(data[strExpPlaceholder.id]);
	}

	if (debugModule) debugCheckpoint("html`<>`", "query and replace <StrExpr> with values, --> template");

	if (debugModule)
		debugLog(
			"html`<>`"
			// { min: 2, dump: { raw, ...data }
		);

	return template;
}

function stringToTemplate(string) {
	const templateContent = document.createElement("template").content;
	templateContent.append(...markUp(string));
	return templateContent;
}

function markUp(markup) {
	const markupContent = document.createElement("markup");
	markupContent.innerHTML = markup;
	return markupContent.childNodes;
}

export { stringToTemplate, html };
