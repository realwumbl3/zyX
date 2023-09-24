// function isChar(input) {
// 	const c = input[0];
// 	if (c >= "0" && c <= "9") return parseInt(input);
// 	return input;
// }

// function typeObj(key) {
// 	return typeof key === "number" ? [] : typeof key === "string" ? {} : null;
// }

// function parseTemplateString(string, args) {
// 	const string_variables = string.match(/{([a-z0-9]*?)}/gm);
// 	let string_clone = `${string}`;
// 	if (!string_variables) return false;
// 	for (let str of string_variables) {
// 		const str_dec = /({([a-z0-9]*?)})/gm.exec(str);
// 		if (!Object.keys(args).includes(str_dec[2])) continue;
// 		string_clone = string_clone.replace(str_dec[1], args[str_dec[2]]);
// 	}
// 	return string_clone;
// }

// cross_pos = (e) => {
// 	if ("changedTouches" in e)
// 		return {
// 			x: e.changedTouches[0].clientX,
// 			y: e.changedTouches[0].clientY,
// 		};
// 	if ("touches" in e)
// 		return {
// 			x: e.touches[0].clientX,
// 			y: e.touches[0].clientY,
// 		};
// 	return {
// 		x: e.clientX,
// 		y: e.clientY,
// 	};
// };

import { zyxcss } from "./zyx-CSS.js";

function cultivateStyles(element, keyname) {
	for (const e of [...element.querySelectorAll("style")]) {
		e.remove();
		if (!keyname) {
			keyname = e.getAttribute("name");
			if (!keyname) console.error("inmarkup styles require a name attribute.", e);
			e.removeAttribute("name");
		}
		zyxcss.node(e, keyname);
	}
}

export function readTemplateFromDOM({ template, templateMarkup } = {}) {
	templateMarkup = document.querySelector(`template[${template}]`);
	if (!templateMarkup) {
		console.error(`Zyx, Template "${template}" Not Found In Dom.`);
		return { error: "Template Not Found In Dom" };
	}
	const templateElement = templateMarkup.content.cloneNode(true);
	cultivateStyles(templateElement, template);
	return templateElement;
}

export function sleep(ms) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, ms);
	});
}

export function offset(int, off) {
	return Math.max(0, (-off + int) / (1 - off));
}

export function offsetLimit(int, off) {
	return Math.min(1, int / off);
}

// // Object Space
// oS(obj)(
// 	"key",
// 	setTimeout((_) => func(), 100)
// );
// // If instance of setTimeout / Interval. clear existing first.
