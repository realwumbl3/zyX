export const __version__ = "1_4";

// import { debugCheckpoint, debugStart, debugLog } from "./zyx-Debugger.js";

export function html(raw, ...data) {
	// debugStart("html", "es6-html-string --> zyXHTML");

	const zyxHTML = new ZyxHTML(raw, ...data);

	// debugCheckpoint("html", `new ZyxHTML created.`);
	// debugLog("html", { min: 0, dump: { raw, ...data } });
	return zyxHTML;
}

export class ZyxHTML extends HTMLTemplateElement {
	constructor(raw, ...data) {
		super();
		this.__scope__ = {};
		this.__proxscope__ = {};

		this.proxy = new Proxy(this, {
			get: (obj, key) => {
				if (this.__scope__.hasOwnProperty(key)) return this.__scope__[key];
				if (this.__proxscope__.hasOwnProperty(key)) return this.__proxscope__[key].value;
				return obj[key];
			},
			set: (obj, key, val) => {
				if (this.__proxscope__.hasOwnProperty(key)) return this.__proxscope__[key].set(val);
				return (obj[key] = val);
			},
		});

		const { markup, inheritable_data } = htmlLiteralProcessor(raw, ...data);

		for (const data of inheritable_data) Object.assign(this.__scope__, data);

		postProcessor(this, markup);

		this.content.append(...markup.childNodes);
	}

	bind(parent) {
		Object.assign(parent, this.__scope__);
		parent.proxy = this.proxy;
		parent.__zyxHTML__ = this;
		parent.appendTo = (container) => container.append(this.content);
		parent.prependTo = (container) => container.prepend(this.content);
		return this;
	}

	shadowify() {
		const content = [...this.content.childNodes];
		const newShadow = document.createElement("div");
		newShadow.attachShadow({ mode: "open" });
		newShadow.shadowRoot.append(...content);

		this.content.innerHTML = "";

		return this;
	}

	appendTo(target) {
		target.append(this.content);
		return this;
	}

	prependTo(target) {
		target.prepend(this.content);
		return this;
	}

	place(place) {
		placer(this.content, place);
		return this;
	}

	touch(_) {
		_({ proxy: this.proxy, markup: this.content });
		return this;
	}

	with(_) {
		return _({ this: this, proxy: this.proxy, markup: this.content });
	}
}

customElements.define(`zyx-template-${__version__}`, ZyxHTML, { extends: "template" });

export function placer(what, where) {
	if (typeof where === "object") return where.replaceWith(what);

	const placeTarget = document.querySelector(`ph[${where}]`);
	if (placeTarget) placeTarget.replaceWith(what);
	else throw new Error(where, "not found");
}

function htmlLiteralDataProcessor(stringData) {
	const data = stringData.map((value) => value || "");
	const stringExpressions = [];
	for (const [key, value] of Object.entries(data)) {
		if (typeof value === "function") {
			const result = value();
			if (result) {
				data[key] = result;
				value = result;
			}
		}

		if (Array.isArray(value)) {
			const fragment = document.createElement("template");
			fragment.content.append(
				...value.map((item) => {
					if (item?.__zyxHTML__) item = item.__zyxHTML__;
					if (item instanceof ZyxHTML) return item.content;
					if (item instanceof HTMLTemplateElement) return item.content;
					if (item instanceof HTMLElement) return item;
				})
			);
			data[key] = fragment.content;
			stringExpressions.push(stringPlaceholder(key));
		} else if (isInsertable(value)) {
			stringExpressions.push(stringPlaceholder(key));
		} else {
			stringExpressions.push(value);
		}
	}

	return { stringExpressions, data };
}

function isInsertable(_) {
	return _?.__zyxHTML__ || _ instanceof ZyxHTML || _ instanceof HTMLElement || _ instanceof DocumentFragment;
}

function putInsideDiv(markup) {
	const markupContent = document.createElement("div");
	markupContent.innerHTML = markup;
	return markupContent;
}

const placehold_tag = "zyx-processor-placehold";

function stringPlaceholder(key) {
	return `<${placehold_tag} id="${key}"></${placehold_tag}>`;
}

function htmlLiteralProcessor(raw, ...string_data) {
	const { data, stringExpressions } = htmlLiteralDataProcessor(string_data);

	const string = String.raw({ raw }, ...stringExpressions);

	const raw_markup = putInsideDiv(string);

	const { markup, inheritable_data } = processPlaceholders(raw_markup, data);

	return { markup, inheritable_data };
}

function processPlaceholders(markup, data) {
	const inheritable_data = [];
	for (const stringPlaceholder of [...markup.querySelectorAll(placehold_tag)]) {
		let placeholder_data = data[stringPlaceholder.id];
		if (placeholder_data?.__zyxHTML__) placeholder_data = placeholder_data.__zyxHTML__;
		if (placeholder_data instanceof ZyxHTML) {
			inheritable_data.push(placeholder_data.__scope__);
			stringPlaceholder.replaceWith(placeholder_data.content);
		} else {
			stringPlaceholder.replaceWith(placeholder_data);
		}
	}
	return { markup, inheritable_data };
}

const CUSTOM_ZYX_ATTRS = ["pr0x", "this", "zyx-proxy"];

const CUSTOM_ZYX_ATTRS_REGEX = new RegExp(`^(${CUSTOM_ZYX_ATTRS.join("|")})(.+)?`);

import { typeProxy } from "./zyx-Prox.js";

export function postProcessor(that, content) {
	[...content.querySelectorAll("*")].forEach((node) => {
		const tag_name = node.localName;

		if (tag_name === "ph") {
			const firstKey = [...node.attributes][0].nodeName;
			node.setAttribute("ph", firstKey);
			this_assigner(that, node, firstKey);
			return;
		}

		for (const attr of node.attributes) {
			const [, a, b] = CUSTOM_ZYX_ATTRS_REGEX.exec(attr.nodeName) || [];

			if (!a) continue;

			switch (a) {
				case "pr0x":
					node.__key__ = node.getAttribute(a + (b || ""));
					const proxyType = !b ? "string" : b.split("-")[1];
					const newTypeProxy = new typeProxy(node.__key__, proxyType, node);
					that.__proxscope__[node.__key__] = newTypeProxy;
					break;
				case "this":
					this_assigner(that, node, node.getAttribute(a));
					node.removeAttribute(a);
					break;
				case "push":
					push_assigner(that, node, node.getAttribute(a));
					node.removeAttribute(a);
					break;
				case "zyx-proxy":
					node.proxy = that.proxy;
					break;
			}
		}
	});

	applyZyxAttrs(that, content);

	[...content.querySelectorAll("[shadow-root]")].forEach((node) => {
		const node_nodes = node.childNodes;
		node.attachShadow({ mode: "open" });
		node.shadowRoot.append(...node_nodes);
	});
}

function this_assigner(parent, node, keyname) {
	const splitNames = keyname.split(" ");
	if (splitNames.length > 1) {
		const [first_key, second_key] = splitNames;
		if (!parent.__scope__.hasOwnProperty(first_key)) parent.__scope__[first_key] = {};
		node.__group__ = first_key;
		node.__key__ = second_key;
		parent.__scope__[first_key][second_key] = node;
	} else if (splitNames.length === 1) {
		node.__key__ = splitNames[0];
		parent.__scope__[splitNames[0]] = node;
	}
}

function push_assigner(parent, node, keyname) {
	if (!parent.__scope__.hasOwnProperty(keyname)) parent.__scope__[keyname] = [];
	node.__key__ = keyname;
	parent.__scope__[keyname].push(node);
}

import { applyZyxAttrs } from "./zyx-Attrs.js";
