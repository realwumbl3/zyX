import { debugCheckpoint, debugStart, debugLog } from "./zyx-Debugger.js";

const ENABLE_TIMERS = false;

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

export function html(raw, ...data) {
	const { markup, inheritable_data } = htmlLiteralProcessor(raw, ...data);
	trimTextNodes(markup);
	if (markup.childNodes.length === 1) {
		const zyxHTML = new zyXHtml(markup, inheritable_data);
		return zyxHTML;
	} else {
		const asHTMLTemplate = document.createElement("template");
		asHTMLTemplate.content.append(...markup.childNodes);
		return new zyXHtml(asHTMLTemplate, inheritable_data);
	}
}

// window.html = html;

export class zyXHtml {
	constructor(dom, stringdata) {
		this.__constructed__ = false;
		this.__dom__ = dom;
		this.__isTemplate__ = dom instanceof HTMLTemplateElement;
		this.__stringdata__ = stringdata;
		this.__scope__ = {};
		this.__proxscope__ = {};
		this.__mutable__ = null;
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
	}

	markup() {
		if (!this.__constructed__) this.const();
		return this.__dom__;
	}

	const() {
		if (this.__constructed__) return this;
		postProcessor(this, this.__isTemplate__ ? this.__dom__.content : this.__dom__);
		if (this.__isTemplate__) this.__dom__ = this.__dom__.content;
		else this.__dom__ = this.__dom__.firstElementChild;
		this.__constructed__ = true;
		return this;
	}

	bind(any) {
		Object.assign(any, this.__scope__);
		this.__mutable__ = any;
		any.proxy = this.proxy;
		any.__zyXHtml__ = this;
		any.appendTo = (container) => container.append(this.__dom__);
		any.prependTo = (container) => container.prepend(this.__dom__);
		any.place = (place) => placer(this.__dom__, place);
		return this.const();
	}

	appendTo(target) {
		target.append(this.__dom__);
		return this;
	}

	prependTo(target) {
		target.prepend(this.__dom__);
		return this;
	}

	place(place) {
		placer(this.__dom__, place);
		return this;
	}

	touch(_) {
		if (!this.__constructed__) this.const();
		_({ proxy: this.proxy, markup: this.__dom__ });
		return this;
	}

	ns(_) {
		return _(this.proxy);
	}

	pass(_) {
		this.const()
		_(this);
		return this;
	}

	return(_) {
		return _({ this: this, proxy: this.proxy, markup: this.__dom__ });
	}

	pro() {
		return this.proxy;
	}

}

function htmlLiteralProcessor(raw, ...string_data) {
	const { data, stringExpressions } = htmlLiteralDataProcessor(string_data);

	const string = String.raw({ raw }, ...stringExpressions);

	const raw_markup = putInsideDiv(string);

	const { markup, inheritable_data } = processPlaceholders(raw_markup, data);

	return { markup, inheritable_data };
}

function htmlLiteralDataProcessor(stringData) {
	const data = stringData.map((value) => value || "");
	const stringExpressions = [];
	for (let [key, value] of Object.entries(data)) {
		if (typeof value === "function") {
			const result = value();
			if (result) {
				if (result instanceof zyXHtml) {
					if (!result.__constructed__) result.const();
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
					if (item instanceof zyXHtml) return item.__dom__;
					if (item instanceof DoJoin) return item.zyxHTMLInstance.__dom__;
					if (item instanceof HTMLTemplateElement) return item.content;
					if (item instanceof HTMLElement) return item;
					if (!item) return "";
					return document.createTextNode(item);
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
	return _?.__zyXHtml__ || _ instanceof zyXHtml || _ instanceof HTMLElement || _ instanceof DocumentFragment || _ instanceof DoJoin;
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

class DoJoin {
	constructor(zyxHTMLInstance) {
		this.zyxHTMLInstance = zyxHTMLInstance;
	}
}

export function join(zyxHTMLInstance) {
	return new DoJoin(zyxHTMLInstance);
}

function processPlaceholders(markup, data) {
	const inheritable_data = [];
	for (const stringPlaceholder of [...markup.querySelectorAll(placehold_tag)]) {

		let placeholder_data = data[stringPlaceholder.id];

		if (placeholder_data?.__zyXHtml__) placeholder_data = placeholder_data.__zyXHtml__;

		if (placeholder_data instanceof DoJoin) {
			stringPlaceholder.replaceWith(placeholder_data.zyxHTMLInstance.__dom__);
			inheritable_data.push(placeholder_data.zyxHTMLInstance.__scope__);
		} else if (placeholder_data instanceof zyXHtml) {
			stringPlaceholder.replaceWith(placeholder_data.__dom__);
		} else {
			stringPlaceholder.replaceWith(placeholder_data);
		}

	}
	return { markup, inheritable_data };
}

import { typeProxy } from "./zyx-Prox.js";

export function postProcessor(zyx, content) {
	[...content.querySelectorAll("ph")].forEach((node) => {
		const firstKey = [...node.attributes][0].nodeName;
		node.setAttribute("ph", firstKey);
		thisAssigner(zyx, node, firstKey);
		return;
	});

	[...content.querySelectorAll("[pr0x]")].forEach((node) => {
		node.__key__ = node.getAttribute("pr0x");
		zyx.__proxscope__[node.__key__] = new typeProxy(node.__key__, "string", node);
	});

	[...content.querySelectorAll("[zyx-proxy]")].forEach((node) => {
		node.proxy = zyx.proxy;
	});

	[...content.querySelectorAll("[this]")].forEach((node) => {
		thisAssigner(zyx, node, node.getAttribute("this"));
		node.removeAttribute("this");
	});

	[...content.querySelectorAll("[push]")].forEach((node) => {
		push_assigner(zyx, node, node.getAttribute("push"));
		node.removeAttribute("push");
	});

	applyZyxAttrs(zyx, content);

	[...content.querySelectorAll("[shadow-root]")].forEach((node) => {
		const node_nodes = node.childNodes;
		node.attachShadow({ mode: "open" });
		node.shadowRoot.append(...node_nodes);
	});

}


export function placer(what, where) {
	if (typeof where === "object") return where.replaceWith(what);
	const placeTarget = document.querySelector(`ph[${where}]`);
	if (placeTarget) placeTarget.replaceWith(what);
	else throw new Error(where, "not found");
}

function thisAssigner(zyx, node, keyname) {
	const splitNames = keyname.split(" ");
	if (splitNames.length > 1) {
		const [first_key, second_key] = splitNames;
		IfNotSetEmptyObject(zyx.__scope__, first_key);
		zyx.__scope__[first_key][second_key] = node;

		if (zyx.__mutable__) {
			IfNotSetEmptyObject(zyx.__mutable__, first_key);
			zyx.__mutable__[first_key][second_key] = node;
		}

		node.__group__ = first_key;
		node.__key__ = second_key;
	} else if (splitNames.length === 1) {
		node.__key__ = splitNames[0];
		zyx.__scope__[splitNames[0]] = node;
		zyx?.__mutable__ && (zyx.__mutable__[splitNames[0]] = node);
	}
}

function IfNotSetEmptyObject(obj, key) {
	if (!obj.hasOwnProperty(key)) obj[key] = {};
}

function push_assigner(zyx, node, keyname) {
	if (!zyx.__scope__.hasOwnProperty(keyname)) {
		zyx.__scope__[keyname] = [];
		zyx?.__mutable__ && (zyx.__mutable__[keyname] = zyx.__scope__[keyname]);
	}
	node.__key__ = keyname;
	zyx.__scope__[keyname].push(node);
}

import { applyZyxAttrs } from "./zyx-Attrs.js";
