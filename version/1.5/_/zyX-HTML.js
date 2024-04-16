import { debugCheckpoint, debugStart, debugLog } from "./zyX-Debugger.js";

import { typeProxy } from "./zyX-Prox.js";

import { zyXAttrProcess } from "./zyX-HTML-Attrs.js";

const bench = false;

export function html(raw, ...data) {
	return new ZyXHtml(raw, ...data)
}

import {
	defaultObject,
	placeholdTag,
	getPlaceholderID,
	newDivInnerHTML,
	placer,
	strPlaceholder,
	trimTextNodes,
	wrapInTemplate
} from "./html.js";

export class ZyXHtml {
	#constructed = false;
	#dom;
	#oven;
	#data;
	#isTemplate;
	#proxscope = {};
	#mutable;
	#proxy;
	constructor(raw, ...literal_data) {
		bench && debugStart("html", "html`<...>` called");
		// process the literal data.
		this.#data = processLiteralData(literal_data);
		// place the placeholders in the markup.
		const markup = String.raw({ raw }, ...Object.values(this.#data).map((_) => _.placeholder))
		// put inside div to make it a valid html, this div is the oven where processing happens.
		this.#oven = newDivInnerHTML(markup);
		trimTextNodes(this.#oven);
		this.#proxy = new Proxy(this, {
			get: (obj, key) => {
				if (this.hasOwnProperty(key)) return this[key];
				if (this.#proxscope.hasOwnProperty(key)) return this.#proxscope[key].value;
				return obj[key];
			},
			set: (obj, key, val) => {
				if (this.#proxscope.hasOwnProperty(key)) return this.#proxscope[key].set(val);
				return (obj[key] = val);
			},
		});
		bench && debugLog("html", { min: 0, dump: { zyXHtml: this } });
	}

	bind(any) {
		this.#mutable = any;
		any.proxy = this.#proxy;
		any.__ZyXHtml__ = this;
		any.appendTo = (container) => this.appendTo(container);
		any.prependTo = (container) => this.prependTo(container);
		any.place = (place) => this.place(place);
		return this.const();
	}

	const() {
		if (this.#constructed) return this;

		[...this.#oven.querySelectorAll("ph")].forEach((node) => {
			const firstKey = [...node.attributes][0].nodeName;
			node.setAttribute("ph", firstKey);
			this.thisAssigner(node, firstKey);
		});

		[...this.#oven.querySelectorAll("[pr0x]")].forEach((node) => {
			node.__key__ = node.getAttribute("pr0x");
			this.#proxscope[node.__key__] = new typeProxy(node.__key__, "string", node);
		});

		// try depractating (in projects first, then here)
		[...this.#oven.querySelectorAll("[zyx-proxy]")].forEach((node) => {
			node.proxy = this.#proxy;
		});

		[...this.#oven.querySelectorAll("[this]")].forEach((node) => {
			this.thisAssigner(node, node.getAttribute("this"));
			node.removeAttribute("this");
		});

		[...this.#oven.querySelectorAll("[push]")].forEach((node) => {
			this.pushAssigner(node, node.getAttribute("push"));
			node.removeAttribute("push");
		});

		zyXAttrProcess(this.#oven, this.#data);

		processPlaceholders(this.#oven, this.#data);

		this.#dom = this.#oven.childNodes.length > 1 ? wrapInTemplate(this.#oven) : this.#oven;
		this.#isTemplate = this.#dom instanceof HTMLTemplateElement;
		if (this.#isTemplate) this.#dom = this.#dom.content;
		else this.#dom = this.#dom.firstElementChild;

		this.#oven = null;
		this.#data = null;
		this.#constructed = true;
		return this;
	}

	markup() {
		return this.const().#dom;
	}

	appendTo(target) {
		target.append(this.markup());
		return this;
	}

	prependTo(target) {
		target.prepend(this.markup());
		return this;
	}

	place(place) {
		placer(this.markup(), place);
		return this;
	}

	touch(callback) {
		callback({ proxy: this.#proxy, markup: this.markup() });
		return this;
	}

	pass(callback) {
		this.const() && callback(this);
		return this;
	}

	thisAssigner(node, keyname) {
		const splitNames = keyname.split(" ");
		if (splitNames.length === 1) {
			const key = splitNames[0];
			node.__key__ = key;
			this[key] = node;
			this.#mutable && (this.#mutable[key] = node);
			return
		}
		const [first_key, second_key] = splitNames;
		defaultObject(this, first_key);
		this[first_key][second_key] = node;
		if (this.#mutable) {
			defaultObject(this.#mutable, first_key);
			this.#mutable[first_key][second_key] = node;
		}
		node.__group__ = first_key;
		node.__key__ = second_key;
	}

	pushAssigner(node, keyname) {
		if (!this.hasOwnProperty(keyname)) {
			this[keyname] = [];
			this.#mutable && (this.#mutable[keyname] = this[keyname]);
		}
		node.__key__ = keyname;
		this[keyname].push(node);
	}

}

function processLiteralData(string_data) {
	const output = {}
	for (const [key, value] of Object.entries(string_data)) {
		const type = typeof value;
		const content = !(type === "string" || type === "number");
		if (value === "" || !value) {
			output[key] = { placeholder: "" }
			continue;
		}
		output[key] = {
			type,
			value,
			placeholder: content ? strPlaceholder(key) : value,
		}
	}
	return output
}


function processPlaceholders(markup, templateData) {
	try {
		for (const placeholder of [...markup.querySelectorAll(placeholdTag)]) {
			placeholder.replaceWith(makePlaceable(templateData[placeholder.id].value));
		}
		const lastStagePlaceholders = markup.innerHTML.match(strPlaceholder("(.*?)"));
		if (lastStagePlaceholders) {
			for (const _placeholder of lastStagePlaceholders) {
				const placeholderId = getPlaceholderID(_placeholder);
				const { placeholder, value } = templateData[placeholderId];
				markup.innerHTML = markup.innerHTML.replace(placeholder, value);
			}
		}
	} catch (e) {
		console.log({ markup, templateData })
		throw e;
	}
}

function makePlaceable(object) {
	if (!object) return "";
	if (Array.isArray(object)) return templateFromPlaceables(object).content;
	if (typeof object === "function") return makePlaceable(object());
	if (object?.__ZyXHtml__) return object.__ZyXHtml__.markup();
	if (object instanceof ZyXHtml) return object.markup();
	if (object instanceof HTMLTemplateElement) return object.content;
	return object
}

function templateFromPlaceables(placeables) {
	const fragment = document.createElement("template");
	fragment.content.append(...spreadPlaceables(placeables));
	return fragment;
}

function spreadPlaceables(array) {
	return array.map(makePlaceable)
}
