import { debugCheckpoint, debugStart, debugLog } from "./zyx-Debugger.js";

const bench = false;

export function html(raw, ...data) {
	return new ZyXHtml(raw, ...data)
}

const placehold_tag = "oxk8-zph";

function strPlaceholder(key) {
	return `<${placehold_tag} id='${key}'></${placehold_tag}>`;
}

function getPlaceholderID(markup) {
	const match = markup.match(/id='(.*?)'/)
	return match?.length > 0 ? match[1] : null;
}

function processLiteralData(raw, string_data) {
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
		// (raw, ...data) '<div zyx-keyup=', '>', '</div>' || ...function, "content"
		bench && debugStart("html", "html`<...>` called");

		// process the literal data.
		this.#data = processLiteralData(raw, literal_data);

		// console.log({ data: this.#data })

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

		[...new Set(this.#oven.querySelectorAll(zyxBindAttributespattern))].forEach((node) => {
			const attributes = [...node.attributes].filter((_) => _.name.startsWith("zyx-"));
			const zyXBinds = attributes.filter((_) => {
				if (_.name in zyxBindAttributes) return true;
				else {
					console.log({ attributes })
					throw Error(`[zyX]Html] : <${_.name}=""> is not a valid zyx-bind attribute.`);
				}
			});
			for (const attr of zyXBinds) {
				const placeholder = getPlaceholderID(attr.value);
				if (!placeholder) continue;
				zyxBindAttributes[attr.name]({ node, data: this.#data[placeholder] })
				node.removeAttribute(attr.name);
			}
		});

		processPlaceholders(this.#oven, this.#data);
		applyZyxAttrs(this.#oven, this);

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

		this.#dom = this.#oven.childNodes.length > 1 ? wrapInTemplate(this.#oven) : this.#oven;
		this.#isTemplate = this.#dom instanceof HTMLTemplateElement;
		if (this.#isTemplate) this.#dom = this.#dom.content;
		else this.#dom = this.#dom.firstElementChild;

		this.#constructed = true;
		return this;
	}

	markup() {
		this.const();
		return this.#dom;
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

function processPlaceholders(markup, templateData) {
	try {
		for (const placeholder of [...markup.querySelectorAll(placehold_tag)]) {
			placeholder.replaceWith(makePlaceable(templateData[placeholder.id].value));
		}
		const placehodlersUnproccesed = markup.innerHTML.match(/<oxk8-zph id='.*?'><\/oxk8-zph>/);
		if (placehodlersUnproccesed) {
			for (const placeholderTag of placehodlersUnproccesed) {
				const placeholderId = getPlaceholderID(placeholderTag);
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

function trimTextNodes(dom) {
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

function newDivInnerHTML(markup) {
	const markupContent = document.createElement("div");
	markupContent.innerHTML = markup;
	return markupContent;
}

function wrapInTemplate(markup) {
	const asHTMLTemplate = document.createElement("template");
	asHTMLTemplate.content.append(...markup.childNodes);
	return asHTMLTemplate;
}

export function placer(what, where) {
	if (typeof where === "object") return where.replaceWith(what);
	const placeTarget = document.querySelector(`ph[${where}]`);
	if (placeTarget) placeTarget.replaceWith(what);
	else throw new Error(where, "not found");
}

function defaultObject(obj, key) {
	if (!obj.hasOwnProperty(key)) obj[key] = {};
}

import { typeProxy } from "./zyx-Prox.js";

import { applyZyxAttrs } from "./zyx-Attrs.js";

import { ZyXDomArray } from "./zyx-Reactive.js";

const zyxBindAttributes = {
	"zyx-click": ({ node, data }) => node.addEventListener("click", data.value),
	"zyx-dblclick": ({ node, data }) => node.addEventListener("dblclick", data.value),
	"zyx-mousedown": ({ node, data }) => node.addEventListener("mousedown", data.value),
	"zyx-mouseup": ({ node, data }) => node.addEventListener("mouseup", data.value),
	"zyx-mouseover": ({ node, data }) => node.addEventListener("mouseover", data.value),
	"zyx-mousemove": ({ node, data }) => node.addEventListener("mousemove", data.value),
	"zyx-mouseout": ({ node, data }) => node.addEventListener("mouseout", data.value),
	"zyx-mouseenter": ({ node, data }) => node.addEventListener("mouseenter", data.value),
	"zyx-mouseleave": ({ node, data }) => node.addEventListener("mouseleave", data.value),
	"zyx-keydown": ({ node, data }) => node.addEventListener("keydown", data.value),
	"zyx-keypress": ({ node, data }) => node.addEventListener("keypress", data.value),
	"zyx-keyup": ({ node, data }) => node.addEventListener("keyup", data.value),
	"zyx-focus": ({ node, data }) => node.addEventListener("focus", data.value),
	"zyx-blur": ({ node, data }) => node.addEventListener("blur", data.value),
	"zyx-submit": ({ node, data }) => node.addEventListener("submit", data.value),
	"zyx-load": ({ node, data }) => node.addEventListener("load", data.value),
	"zyx-error": ({ node, data }) => node.addEventListener("error", data.value),
	"zyx-input": ({ node, data }) => node.addEventListener("input", data.value),
	"zyx-change": ({ node, data }) => node.addEventListener("change", data.value),
	"zyx-scroll": ({ node, data }) => node.addEventListener("scroll", data.value),
	"zyx-array": ({ node, data }) => new ZyXDomArray({ container: node, ...data.value }),
	"zyx-pointerdown": ({ node, data }) => node.addEventListener("pointerdown", data.value),
	"zyx-pointermove": ({ node, data }) => node.addEventListener("pointermove", data.value),
	"zyx-pointerup": ({ node, data }) => node.addEventListener("pointerup", data.value),
	"zyx-pointerover": ({ node, data }) => node.addEventListener("pointerover", data.value),
	"zyx-pointerout": ({ node, data }) => node.addEventListener("pointerout", data.value),
	"zyx-pointerenter": ({ node, data }) => node.addEventListener("pointerenter", data.value),
	"zyx-pointerleave": ({ node, data }) => node.addEventListener("pointerleave", data.value),
	"zyx-pointercancel": ({ node, data }) => node.addEventListener("pointercancel", data.value),
	"zyx-switch": ({ node, data }) => node,
	"zyx-switch-active": ({ node, data }) => node
}

const zyxBindAttributespattern = `[${Object.keys(zyxBindAttributes).join("],[")}]`
