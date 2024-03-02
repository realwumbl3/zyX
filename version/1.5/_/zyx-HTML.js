import { debugCheckpoint, debugStart, debugLog } from "./zyx-Debugger.js";

const ENABLE_TIMERS = false;

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

		const content = this.__isTemplate__ ? this.__dom__.content : this.__dom__;

		[...content.querySelectorAll("ph")].forEach((node) => {
			const firstKey = [...node.attributes][0].nodeName;
			node.setAttribute("ph", firstKey);
			thisAssigner(this, node, firstKey);
			return;
		});

		[...content.querySelectorAll("[pr0x]")].forEach((node) => {
			node.__key__ = node.getAttribute("pr0x");
			this.__proxscope__[node.__key__] = new typeProxy(node.__key__, "string", node);
		});

		// try depractating
		[...content.querySelectorAll("[zyx-proxy]")].forEach((node) => {
			node.proxy = this.proxy;
		});

		[...content.querySelectorAll("[this]")].forEach((node) => {
			thisAssigner(this, node, node.getAttribute("this"));
			node.removeAttribute("this");
		});

		[...content.querySelectorAll("[push]")].forEach((node) => {
			push_assigner(this, node, node.getAttribute("push"));
			node.removeAttribute("push");
		});

		applyZyxAttrs(this, content);

		[...content.querySelectorAll("[shadow-root]")].forEach((node) => {
			const node_nodes = node.childNodes;
			node.attachShadow({ mode: "open" });
			node.shadowRoot.append(...node_nodes);
		});

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
