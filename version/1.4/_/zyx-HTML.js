import { debugCheckpoint, debugStart, debugLog } from "./zyx-Debugger.js";

const ENABLE_TIMERS = false;

export function html(raw, ...data) {
	ENABLE_TIMERS && debugStart("html", "es6-html-string --> zyXHTML");
	const zyxHTML = new zyXHtml(raw, ...data);
	ENABLE_TIMERS && debugCheckpoint("html", `new zyXHtml created.`);
	ENABLE_TIMERS && debugLog("html", { min: 0, dump: { zyxHTML, raw } });
	return zyxHTML;
}

// window.html = html;

export class zyXHtml extends HTMLTemplateElement {
	constructor(raw, ...data) {
		super();
		this.__constructed__ = false;
		this.__scope__ = {};
		this.__proxscope__ = {};
		this.__mutable__ = null;
		this.__rawdata__ = [raw, ...data];
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
		// this.refresh()
	}

	const() {
		if (this.__constructed__) return this;
		const [raw, ...data] = this.__rawdata__;
		const { markup, inheritable_data } = htmlLiteralProcessor(raw, ...data);
		for (const data of inheritable_data) Object.assign(this.__scope__, data);
		if (this.__mutable__) {
			for (const data of inheritable_data) Object.assign(this.__mutable__, data);
		}
		postProcessor(this, markup);
		this.content.append(...markup.childNodes);
		this.__constructed__ = true;
		return this;
	}

	bind(any) {
		Object.assign(any, this.__scope__);
		this.__mutable__ = any;
		any.proxy = this.proxy;
		any.__zyXHtml__ = this;
		any.appendTo = (container) => container.append(this.content);
		any.prependTo = (container) => container.prepend(this.content);
		any.place = (place) => placer(this.content, place);
		return this.const();
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
		if (!this.__constructed__) this.const();
		_({ proxy: this.proxy, markup: this.content });
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
		return _({ this: this, proxy: this.proxy, markup: this.content });
	}

	pro() {
		return this.proxy;
	}

}

customElements.define("zyx-template", zyXHtml, { extends: "template" });

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
					if (item instanceof zyXHtml) return item.content;
					if (item instanceof DoJoin) return item.zyxHTMLInstance.content;
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
			stringPlaceholder.replaceWith(placeholder_data.zyxHTMLInstance.content);
			inheritable_data.push(placeholder_data.zyxHTMLInstance.__scope__);
		} else if (placeholder_data instanceof zyXHtml) {
			stringPlaceholder.replaceWith(placeholder_data.content);
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
