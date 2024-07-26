import { debugCheckpoint, debugStart, debugLog } from "./zyX-Debugger.js";

import { typeProxy } from "./zyX-Prox.js";

import { zyXAttrProcess } from "./zyX-HTML-Attrs.js";

import {
	defaultObject,
	placeholdTag,
	getPlaceholderID,
	innerHTML,
	placer,
	strPlaceholder,
	strPlaceholderHTML,
	placeholderRegex,
	placeholderRegexHTML,
	trimTextNodes,
	wrapInTemplate,
} from "./html.js";

const bench = false;

export const html = (...args) => new ZyXHtml(...args);

export class ZyXHtml {
	#constructed = false;
	#dom;
	#oven;
	#data;
	#isTemplate;
	#proxscope = {};
	#mutable;
	#proxy;
	#verbose = false;
	#garbageCollect = true;
	#logMap = false;
	constructor(raw, ...tagData) {
		bench && debugStart(this, "ZyXHtml");
		const { markup, data } = preProcess(raw, tagData);
		bench && debugCheckpoint(this, "preProcess");
		this.#data = data;
		this.#oven = markup;
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

	log(...args) {
		this.#verbose && console.log(...args);
		return this;
	}

	enableVerbose() {
		this.#verbose = true;
		return this;
	}

	disableGC() {
		console.warn("Garbage collection disabled. This may cause memory leaks.");
		this.#garbageCollect = false;
		return this;
	}

	logMap() {
		this.#logMap = true;
		return this;
	}

	bind(any) {
		this.#mutable = any;
		any.proxy = this.#proxy;
		any.__zyXHTML__ = this;
		any.appendTo = (container) => this.appendTo(container);
		any.prependTo = (container) => this.prependTo(container);
		any.place = (place) => this.place(place);
		return this.const();
	}

	join(target) {
		this.#mutable = target;
		if (target?.__zyXHTML__) Object.assign(this, target.__zyXHTML__);
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

	with(callback) {
		this.const() && callback(this);
		return this;
	}

	const() {
		if (this.#constructed) return this;
		if (this.#logMap) console.log(this.getMap());

		this.dryPlaceholders();
		this.placeReferencedPlaceholders();

		[...this.#oven.querySelectorAll("ph")].forEach((node) => {
			const firstKey = [...node.attributes][0].nodeName;
			node.setAttribute("ph", firstKey);
			this.thisAssigner(node, firstKey);
		});

		[...this.#oven.querySelectorAll("[pr0x]")].forEach((node) => {
			node.__key__ = node.getAttribute("pr0x");
			this.#proxscope[node.__key__] = new typeProxy(node.__key__, "string", node);
		});

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

		zyXAttrProcess(this, this.#oven, this.#data);

		[...this.#oven.querySelectorAll("[zyx-this]")].forEach((node) => {
			this.thisAssigner(node, node.getAttribute("zyx-this"));
			// node.removeAttribute("zyx-this");
		});

		this.#dom =
			this.#oven.childNodes.length > 1 ? wrapInTemplate(this.#oven) : this.#oven;
		this.#isTemplate = this.#dom instanceof HTMLTemplateElement;
		if (this.#isTemplate) this.#dom = this.#dom.content;
		else this.#dom = this.#dom.firstElementChild;

		if (this.#garbageCollect) {
			this.#oven = null;
			this.#data = null;
		}

		bench && debugLog(this, { label: "constructed", min: 100, dump: { zyXHtml: this } });

		this.#constructed = true;
		return this;
	}

	getMap() {
		const places = [];
		[...this.#oven.cloneNode(true).querySelectorAll(placeholdTag)].forEach((node) => {
			places[node.id] = {
				id: node.id,
				type: "node",
				ph: node,
				value: this.#data[node.id].value,
			};
		});
		this.#oven.innerHTML.match(placeholderRegex)?.forEach((_) => {
			const id = getPlaceholderID(_);
			places[id] = { id, type: "attr", ph: _, value: this.#data[id].value };
		});
		return places;
	}

	dryPlaceholders() {
		const placeholders = this.#oven.innerHTML.match(placeholderRegex);
		const placeholdersHTML = this.#oven.innerHTML.match(placeholderRegexHTML);
		this.log({
			innerHTML: this.#oven.innerHTML,
			placeholders,
			placeholdersHTML,
			placeholderRegex,
			placeholderRegexHTML,
		});
		placeholders?.forEach((ph) => {
			const { placeholder, value } = this.#data[getPlaceholderID(ph)];
			this.log("processing placeholder", { placeholder, value });
			const objectPlaceholder =
				value !== null && (typeof value === "object" || typeof value === "function");
			this.#oven.innerHTML = this.#oven.innerHTML.replace(
				placeholder,
				objectPlaceholder ? placeholder : value
			);
		});
		placeholdersHTML?.forEach((ph) => {
			const id = getPlaceholderID(ph);
			const { value } = this.#data[id];
			const htmlTarget = strPlaceholderHTML(getPlaceholderID(ph));
			this.log("processing placeholder", { htmlTarget, value });
			const objectPlaceholder =
				value !== null && (typeof value === "object" || typeof value === "function");
			this.#oven.innerHTML = this.#oven.innerHTML.replace(
				htmlTarget,
				objectPlaceholder ? htmlTarget : value
			);
		});
		this.log({ innerHTML: this.#oven.innerHTML });
	}

	placeReferencedPlaceholders() {
		for (const ph of [...this.#oven.querySelectorAll(placeholdTag)])
			ph.replaceWith(makePlaceable(this.#data[ph.id].value));
	}

	thisAssigner(node, keyname) {
		const splitNames = keyname.split(" ");
		if (splitNames.length === 1) {
			const key = splitNames[0];
			node.__key__ = key;
			this[key] = node;
			this.#mutable && (this.#mutable[key] = node);
			return;
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

function preProcess(raw, data) {
	const output = {};
	output.data = data.map((_, i) => {
		return { value: _, placeholder: strPlaceholder(i) };
	});
	output.markup = trimTextNodes(
		innerHTML(
			String.raw({ raw }, ...Object.values(output.data).map((_) => _.placeholder))
		)
	);
	return output;
}

export function makePlaceable(object) {
	if (object === false || object === null || object === undefined) return "";
	if (Array.isArray(object)) return templateFromPlaceables(object).content;
	if (typeof object === "function") return makePlaceable(object());
	if (object?.__zyXHTML__ instanceof ZyXHtml) return object.__zyXHTML__.markup();
	if (object instanceof ZyXHtml) return object.markup();
	if (object instanceof HTMLTemplateElement) return object.content;
	return object;
}

function templateFromPlaceables(placeables) {
	const fragment = document.createElement("template");
	fragment.content.append(...placeables.map(makePlaceable));
	return fragment;
}

export function getZyXMarkup(composed) {
	if (composed instanceof ZyXHtml) return composed.markup();
	else if (composed?.__zyXHTML__) return composed.__zyXHTML__.markup();
}
