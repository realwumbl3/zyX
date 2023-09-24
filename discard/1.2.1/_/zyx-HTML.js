import { debugCheckpoint, debugStart, debugLog } from "./zyx-Debugger.js";

/*

React framework:

js: const [culm, setCulm] = useHook(1)

html: {culm}

js: setCulm(culm * 2)

-

zyX framework:

html: ${pr0x`<culm`(1)}

js: proxy.culm = proxy.culm * 2

// const testInt = zyxLib("foo", 1);
// testInt.val = 32

*/

const debugModule = true;

function zyxProcessPlaceholder(key) {
	return `<StrExpr id="${key}"></StrExpr>`;
}

// function ifInstanceOfZyxHTML(scope, )

export function htmlLiteralToTemplate(raw, ...data) {
	// if (debugModule) debugStart("html", "es6-html-string --> template");

	data = data.map((_) => (_ ? _ : ""));
	const stringExpressions = [];
	for (let [key, val] of Object.entries(data)) {
		if (val?.__zyxHTML__) {
			// html string argument is a class object binded to another scope
			data[key] = val.__zyxHTML__.__html__;
			stringExpressions.push(zyxProcessPlaceholder(key));
			continue;
		}
		if (val instanceof HTMLElement || val instanceof DocumentFragment) {
			stringExpressions.push(zyxProcessPlaceholder(key));
			continue;
		}
		if (typeof val === "function") {
			const call = val?.();
			if (call) {
				val = call;
				data[key] = call;
			}
		}
		if (val instanceof Array) {
		}
		if (val instanceof ZyxHTML) {
			// parent < > child extending + push array culm
			Object.assign(this.__scope__, val.__scope__);
			data[key] = val.__html__;
			stringExpressions.push(zyxProcessPlaceholder(key));
			continue;
		}
		stringExpressions.push(val);
		// if (debugModule) debugCheckpoint("html", `placed <StrExpr> id:${key}`);
	}

	const string = String.raw({ raw }, ...stringExpressions);
	const template = stringToTemplate(string);

	// if (debugModule) debugCheckpoint("html", "pass string to stringToTemplate() function");

	for (const strExpPh of [...template.querySelectorAll("StrExpr")]) strExpPh.replaceWith(data[strExpPh.id]);

	// if (debugModule) debugCheckpoint("html", "query and replace <StrExpr> with values, --> template");

	// if (debugModule) debugLog("html", { min: 0, dump: { raw, ...data } });
	return template;
}

export function stringToTemplate(string) {
	const templateContent = document.createElement("template").content;
	templateContent.append(...markUp(string));
	return templateContent;
}

function markUp(markup) {
	const markupContent = document.createElement("markup");
	markupContent.innerHTML = markup;
	return markupContent.childNodes;
}

///// DOM TEMPLATES /////
const html_time_debug = true;

export function html(raw, ...data) {
	// if (html_time_debug) debugStart("html", "es6-html-string --> zyXHTML");
	const zyxHTML = new ZyxHTML(raw, ...data);
	// if (html_time_debug) debugCheckpoint("html", `new ZyxHTML created.`);
	// if (html_time_debug) debugLog("html", { min: 0, dump: { raw, ...data } });
	return zyxHTML;
}

export class ZyxHTML {
	constructor(raw, ...data) {
		this.htmlLiteralToTemplate = htmlLiteralToTemplate;
		this.__raw__ = null;
		this.__data__ = null;
		this.__scope__ = {};
		this.__typescope__ = {};
		this.__placeholders__ = {};
		this.build(raw, ...data);
		this.proxy = new Proxy(this, {
			get: (obj, key) => {
				if (key in this.__scope__) return this.__scope__[key];
				if (key in this.__typescope__) return this.__typescope__[key].value;
				return obj[key];
			},
			set: (obj, key, val) => {
				if (key in this.__typescope__) {
					return this.__typescope__[key].set(val);
				}
				return (obj[key] = val);
			},
		});
	}

	bindProxy = (that) => {
		that.proxy = this.proxy;
		return this;
	};

	build(raw, ...data) {
		// If already built gracefully swap with new build. Effects too maybe?
		this.__raw__ = raw;
		this.__data__ = data;
		this.__html__ = this.htmlLiteralToTemplate(this.__raw__, ...this.__data__);
		zyxMagic(this, this.__html__);
		return this;
	}

	bind(parent) {
		for (const key of Object.keys(parent)) {
			if (key in this.__scope__) {
				//prettier-ignore
				console.group("bind conflict.");
				console.log(parent);
				console.warn("already has", key);
				console.log("zyxHTML Proxy");
				console.log(this);
				console.groupEnd();
			}
		}
		Object.assign(parent, this.__scope__);
		this.__scope__ = parent;
		this.bindProxy(parent);
		parent.__zyxHTML__ = this;
		return this;
	}
	appendTo(target) {
		target.append(this.__html__);
		return this;
	}
	prependTo(target) {
		target.prepend(this.__html__);
		return this;
	}
	place(place) {
		placeObject(this.__html__, place);
		return this;
	}
	placeFunc(callback) {
		callback(this.__html__);
		return this;
	}
	touch(_) {
		_({ proxy: this.proxy, markup: this.__html__ });
		return this;
	}
	with(_) {
		return _({ this: this, proxy: this.proxy, markup: this.__html__ });
	}
}

const zyxCustomTags = ["pr0x", "this", "push", "ph"];

const customTagRegex = new RegExp(`^(${zyxCustomTags.join("|")})(.+)?`);

export function zyxMagic(that, markup) {
	[...markup.querySelectorAll("assign-this")].forEach((thisNode) => {
		thisNode.this = that;
	});
	[...markup.querySelectorAll("*")].forEach((thisNode) => {
		const tagName = thisNode.localName;
		if (tagName === "ph") {
			const firstKey = [...thisNode.attributes][0].nodeName;
			thisNode.setAttribute("ph", firstKey);
			assignThisAttribute(that, thisNode, firstKey);
			// thisNode.removeAttribute(firstKey);
			return;
		}
		for (const attr of thisNode.attributes) {
			const { nodeName } = attr;
			const customTags = customTagRegex.exec(nodeName);
			if (customTags) {
				const [match, a, b] = customTags;
				const attrValue = thisNode.getAttribute(match);
				switch (a) {
					// case "ph":
					// 	thisNode.__key__ = attrValue;
					// 	const newPlaceholder = new PlaceHolder(attrValue, thisNode);
					// 	that.__placeholders__[attrValue] = newPlaceholder;
					// 	break;
					case "pr0x":
						thisNode.__key__ = attrValue;
						const proxyType = !b ? "string" : b.split("-")[1];
						const newTypeProxy = new typeProxy(attrValue, proxyType, thisNode);
						that.__typescope__[attrValue] = newTypeProxy;
						break;
					case "this":
						assignThisAttribute(that, thisNode, attrValue);
						thisNode.removeAttribute(a);
						break;
					case "push":
						thisNode.__key__ = attrValue;
						if (!(attrValue in that.__scope__)) that.__scope__[attrValue] = [];
						that.__scope__[attrValue].push(thisNode);
						thisNode.removeAttribute("push");
						break;
				}
			}
		}
	});
	applyZyxAttrs(that, markup);
}

function assignThisAttribute(parent, node, keyname) {
	const splitNames = keyname.split(" ");
	if (splitNames.length > 1) {
		const [first_key, second_key] = splitNames;
		if (!(first_key in parent.__scope__)) {
			parent.__scope__[first_key] = {};
		}
		node.__group__ = first_key;
		node.__key__ = second_key;
		parent.__scope__[first_key][second_key] = node;
	} else if (splitNames.length === 1) {
		node.__key__ = splitNames[0];
		parent.__scope__[splitNames[0]] = node;
	}
}

export class typeProxy {
	constructor(proxyName, proxyType, node) {
		this.keyname = proxyName;
		this.type = proxyType;
		this.node = node;
		this.setType = "textContent";
		this.value = this.setValue(node.textContent);
	}
	set(val) {
		const set = this.setValue(val);
		if (!set) return true;
		this.updateNode();
		return true;
	}
	setValue(val) {
		if (val === this.value) return false;
		if (typeof val === this.type) return (this.value = val);
		switch (this.type) {
			case "number":
				return (this.value = Number(val));
			case "string":
				return (this.value = `${val}`);
		}
		return true;
	}
	updateNode() {
		switch (this.setType) {
			case "textContent":
				this.node.textContent = this.value;
				break;
			case "HTML":
				this.node.innerHTML = this.value;
				break;
		}
	}
}

export const pr0x = (raw, ...data) => {
	const [name] = raw;
	return (def, ...options) => {
		const type = typeof def;
		const attrList = readHtmlOptions(options);
		return `<span ${attrList} pr0x${type === "string" ? "" : `-${type}`}="${name}">${def}</span>`;
	};
};

function readHtmlOptions(options) {
	let string = "";
	for (const option of options) {
		let [key, val] = option.split("=");
		string += key += `="${val}" `;
	}
	return string;
}

/*

HTML: pr0x`<haha>`("")

Place: pr0x`|haha|`(node)

Node: prox`:nodeName:`(node)

String: pr0x`haha`("")

Number: pr0x`haha`(0)

*/

export class PlaceHolder {
	constructor(name, holder) {
		// console.log("name, holder", name, holder);
	}
}

import { applyZyxAttrs } from "./zyx-Attrs.js";

export function placeObject(what, where) {
	if (typeof where === "string") {
		const placeTarget = document.querySelector(`ph[${where}]`);
		if (placeTarget) placeTarget.replaceWith(what);
		else console.error(where, "not found");
	} else if (typeof where === "object") where.replaceWith(what);
}

// ////////////////////////////////////////////////////////////////////////////////////////

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
