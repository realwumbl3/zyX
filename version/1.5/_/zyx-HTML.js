import { debugCheckpoint, debugStart, debugLog } from "./zyx-Debugger.js";

const ENABLE_TIMERS = false;



export function html(raw, ...data) {
	ENABLE_TIMERS && debugStart("html", "html`<...>` called");
	const { markup, inheritable_data } = htmlLiteralProcessor(raw, ...data);
	ENABLE_TIMERS && debugCheckpoint("html", `htmlLiteralProcessor(raw, ...data)`);
	let created = null;
	trimTextNodes(markup);
	if (markup.childNodes.length === 1) {
		created = new zyXHtml(markup);
	} else {
		const asHTMLTemplate = document.createElement("template");
		asHTMLTemplate.content.append(...markup.childNodes);
		created = new zyXHtml(asHTMLTemplate);
	}
	ENABLE_TIMERS && debugCheckpoint("html", `new zyXHtml(markup)`);
	ENABLE_TIMERS && debugLog("html", { min: 0, dump: { created } });
	return created;
}

// window.html = html;

export class zyXHtml {
	#constructed = false;
	#dom;
	#isTemplate;
	#proxscope;
	#proxy;
	#mutable;
	constructor(dom) {
		this.#constructed = false;
		this.#dom = dom;
		this.#isTemplate = dom instanceof HTMLTemplateElement;
		this.#proxscope = {};
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
	}

	markup() {
		if (!this.#constructed) this.const();
		return this.#dom;
	}

	flatten() {
		if (!this.#constructed) this.const();
		this.#isTemplate = true;
		const template = document.createElement("template");
		template.content.append(...this.#dom.childNodes);
		this.#dom = template.content;
		return this;
	}

	const() {
		if (this.#constructed) return this;

		const content = this.#isTemplate ? this.#dom.content : this.#dom;

		[...content.querySelectorAll("ph")].forEach((node) => {
			const firstKey = [...node.attributes][0].nodeName;
			node.setAttribute("ph", firstKey);
			this.thisAssigner(node, firstKey);
			return;
		});

		[...content.querySelectorAll("[pr0x]")].forEach((node) => {
			node.__key__ = node.getAttribute("pr0x");
			this.#proxscope[node.__key__] = new typeProxy(node.__key__, "string", node);
		});

		// try depractating
		[...content.querySelectorAll("[zyx-proxy]")].forEach((node) => {
			node.proxy = this.#proxy;
		});

		[...content.querySelectorAll("[this]")].forEach((node) => {
			this.thisAssigner(node, node.getAttribute("this"));
			node.removeAttribute("this");
		});

		[...content.querySelectorAll("[push]")].forEach((node) => {
			this.pushAssigner(node, node.getAttribute("push"));
			node.removeAttribute("push");
		});

		applyZyxAttrs(this, content);

		[...content.querySelectorAll("[shadow-root]")].forEach((node) => {
			const node_nodes = node.childNodes;
			node.attachShadow({ mode: "open" });
			node.shadowRoot.append(...node_nodes);
		});

		if (this.#isTemplate) this.#dom = this.#dom.content;
		else this.#dom = this.#dom.firstElementChild;
		this.#constructed = true;
		return this;
	}

	bind(any) {
		Object.assign(any, this.__scope__);
		this.#mutable = any;
		any.proxy = this.#proxy;
		any.__zyXHtml__ = this;
		any.appendTo = (container) => this.appendTo(container);
		any.prependTo = (container) => this.prependTo(container);
		any.place = (place) => this.place(place);
		return this.const();
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

	touch(_) {
		if (!this.#constructed) this.const();
		_({ proxy: this.#proxy, markup: this.markup() });
		return this;
	}

	ns(_) {
		if (!this.#constructed) this.const();
		return _(this.#proxy);
	}

	pass(_) {
		if (!this.#constructed) this.const();
		_(this);
		return this;
	}

	return(_) {
		return _({ this: this, proxy: this.#proxy, markup: this.markup() });
	}

	thisAssigner(node, keyname) {
		const splitNames = keyname.split(" ");
		if (splitNames.length > 1) {
			const [first_key, second_key] = splitNames;
			IfNotSetEmptyObject(this, first_key);
			this[first_key][second_key] = node;

			if (this.#mutable) {
				IfNotSetEmptyObject(this.#mutable, first_key);
				this.#mutable[first_key][second_key] = node;
			}

			node.__group__ = first_key;
			node.__key__ = second_key;
		} else if (splitNames.length === 1) {
			node.__key__ = splitNames[0];
			this[splitNames[0]] = node;
			this.#mutable && (this.#mutable[splitNames[0]] = node);
		}
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

function htmlLiteralProcessor(raw, ...string_data) {
	const { data, dry_html } = htmlLiteralDataProcessor(raw, string_data);
	const { markup, inheritable_data } = processPlaceholders(strCreateNodes(dry_html), data);
	return { markup, inheritable_data };
}

function htmlLiteralDataProcessor(raw, string_data) {
	const data = string_data.map((value) => value || "");
	const placeholders = [];
	for (let [key, value] of Object.entries(data)) {

		if (typeof value === "function") {
			const result = value();
			if (result) {
				if (result instanceof zyXHtml) {
					result.const();
				}
				data[key] = result;
				value = result;
			} else {
				data[key] = "";
				value = "";
			}
		}

		if (Array.isArray(value)) {
			const fragment = document.createElement("template");
			fragment.content.append(
				...value.map((item) => {
					if (item?.__zyXHtml__) item = item.__zyXHtml__;
					if (item instanceof zyXHtml) return item.markup();
					if (item instanceof HTMLTemplateElement) return item.content;
					if (item instanceof HTMLElement) return item;
					if (!item) return "";
					return document.createTextNode(item);
				})
			);
			data[key] = fragment.content;
			placeholders.push(strPlaceholder(key));

		} else if (isInsertable(value)) {
			placeholders.push(strPlaceholder(key));
		} else {
			placeholders.push(value);
		}

	}
	const dry_html = String.raw({ raw }, ...placeholders);
	return { data, dry_html };
}

function processPlaceholders(markup, data) {
	const inheritable_data = [];
	for (const placeholder of [...markup.querySelectorAll(placehold_tag)]) {

		let placeholder_data = data[placeholder.id];

		if (placeholder_data?.__zyXHtml__) placeholder_data = placeholder_data.__zyXHtml__;

		if (placeholder_data instanceof zyXHtml) {
			placeholder.replaceWith(placeholder_data.markup());
		} else {
			placeholder.replaceWith(placeholder_data);
		}

	}
	return { markup, inheritable_data };
}

function isInsertable(_) {
	return _?.__zyXHtml__ || _ instanceof zyXHtml || _ instanceof HTMLElement || _ instanceof DocumentFragment;
}

function strCreateNodes(markup) {
	const markupContent = document.createElement("div");
	markupContent.innerHTML = markup;
	return markupContent;
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
}

const placehold_tag = "zyx-processor-placehold";

function strPlaceholder(key) {
	return `<${placehold_tag} id="${key}"></${placehold_tag}>`;
}

import { typeProxy } from "./zyx-Prox.js";

export function placer(what, where) {
	if (typeof where === "object") return where.replaceWith(what);
	const placeTarget = document.querySelector(`ph[${where}]`);
	if (placeTarget) placeTarget.replaceWith(what);
	else throw new Error(where, "not found");
}

function IfNotSetEmptyObject(obj, key) {
	if (!obj.hasOwnProperty(key)) obj[key] = {};
}


import { applyZyxAttrs } from "./zyx-Attrs.js";
