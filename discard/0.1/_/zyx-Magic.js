import { readTemplateFromDOM } from "./zyx-General.js";
import { stringToTemplate } from "./zyx-HTML.js";
import { applyZyxAttrs } from "./zyx-Attrs.js";

export function zyx({ debug, that = {}, element, markup, htme, template, place, appendTo, prependTo, returnTemplate } = {}) {
	if (debug) debugger;

	if (markup) {
		element = stringToTemplate(markup);
	} else if (htme) {
		element = htme;
	} else if (template) {
		element = readTemplateFromDOM({ template });
	}

	const { scope } = zyxMagic(that, element);

	if (place) placeObject(element, place);
	else if (appendTo) appendTo.append(element);
	else if (prependTo) prependTo.prepend(element);

	return scope;
}

export function zyxMagic(that, markup) {
	[...markup.querySelectorAll("[push]")].forEach((e) => {
		const attr = e.getAttribute("push");
		if (!(attr in that)) that[attr] = [];
		that[attr].push(e);
		e.removeAttribute("push");
	});

	[...markup.querySelectorAll("[this]")].forEach((thisNode) => {
		const attr = thisNode.getAttribute("this");
		const split_assign = attr.split(" ");
		if (split_assign.length > 1) {
			let first_key = split_assign[0];
			let second_key = split_assign[1];
			if (!(first_key in that)) {
				that[first_key] = {};
			}
			thisNode.__group__ = first_key;
			thisNode.__key__ = second_key;
			that[first_key][second_key] = thisNode;
		} else if (split_assign.length === 1) {
			thisNode.__key__ = attr;
			that[attr] = thisNode;
		}
		thisNode.removeAttribute("this");
	});

	[...markup.querySelectorAll("[assign-this]")].forEach((e) => (e.this = that));

	applyZyxAttrs(that, markup);

	let scope = markup.querySelector("[return]");

	if (scope) {
		scope.this = that;
	} else {
		scope = that;
	}

	return { scope, markup };
}

export function placeObject(what, where) {
	if (typeof where === "string") {
		const placeTarget = document.querySelector(`ph[${where}]`);
		if (placeTarget) placeTarget.replaceWith(what);
		else console.error(where, "not found");
	} else if (typeof where === "object") where.replaceWith(what);
}
