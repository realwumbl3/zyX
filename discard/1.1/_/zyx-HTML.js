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
		this.build(raw, ...data);
		this.proxy = new Proxy(this, {
			get: (obj, key) => {
				if (key in this.__scope__) return this.__scope__[key];
				if (key in this.__typescope__) return this.__typescope__[key].value;
				return obj[key];
			},
			set: (obj, key, val) => {
				if (key in this.__typescope__) {
					const proxy = this.__typescope__[key];
					const set = proxy.setValue(val);
					if (!set) return true;
					if (proxy.inner) proxy.node.innerHTML = proxy.value;
					else proxy.node.innerHTML = proxy.value;
					return set;
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
		_(this.__scope__, this.proxy, this.__html__);
		return this;
	}
	with(_) {
		return _(this, this.proxy, this.__html__);
	}
}

export function zyxMagic(that, markup) {
	[...markup.querySelectorAll("*")].forEach((thisNode) => {
		for (const attr of thisNode.attributes) {
			if (/^pr0x(.+)?/.exec(attr.nodeName)) {
				const { type, keyname } = proxAttrGetter(thisNode);
				thisNode.__key__ = keyname;
				const newTypeProxy = new typeProxy(thisNode);
				that.__typescope__[keyname] = newTypeProxy;
			}
			if (/^this(.+)?/.exec(attr.nodeName)) {
				const attr = thisNode.getAttribute("this");
				const split_assign = attr.split(" ");
				if (split_assign.length > 1) {
					const [first_key, second_key] = split_assign;
					if (!(first_key in that.__scope__)) {
						that.__scope__[first_key] = {};
					}
					thisNode.__group__ = first_key;
					thisNode.__key__ = second_key;
					that.__scope__[first_key][second_key] = thisNode;
				} else if (split_assign.length === 1) {
					thisNode.__key__ = attr;
					that.__scope__[attr] = thisNode;
				}
			}
			if (/^push(.+)?/.exec(attr.nodeName)) {
				const attr = e.getAttribute("push");
				const { type, keyname } = proxAttrGetter(thisNode);
				thisNode.__key__ = keyname;
				if (!(attr in that.__scope__)) that.__scope__[attr] = [];
				that.__scope__[attr].push(e);
				e.removeAttribute("push");
			}
			if (/^assign-this?/.exec(attr.nodeName)) {
				thisNode.this = that;
			}
		}
	});
	applyZyxAttrs(that, markup);
}

function proxAttrGetter(node, { keyname } = {}) {
	for (const attr of ["pr0x-number", "pr0x"]) {
		if (node.hasAttribute(attr)) {
			keyname = node.getAttribute(attr);
			const type = attr.split("pr0x")[1].slice(1);
			if (type) {
				return { type, keyname };
			}
			return { type: "string", keyname };
		}
	}
	return false;
}

export const pr0x = (raw, ...data) => {
	const [name] = raw;
	return (def, ...options) => {
		const type = typeof def;
		const attrList = readHtmlOptions(options);
		console.log("attrList", attrList);
		return `<span ${attrList} pr0x${type === "string" ? "" : `-${type}`}="${name}">${def}</span>`;
	};
};

function readHtmlOptions(options) {
	console.log("options", options);
	let string = "";
	for (const option of options) {
		let [key, val] = option.split("=");
		string += key += `="${val}" `;
	}

	console.log("opt string", string);

	return string;
}

/*

HTML: pr0x`<haha>`("")

Place: pr0x`|haha|`(node)

Node: prox`:nodeName:`(node)

String: pr0x`haha`("")

Number: pr0x`haha`(0)

*/

export class typeProxy {
	constructor(node) {
		this.node = node;
		const { type, keyname } = proxAttrGetter(node);
		this.keyname = keyname;
		this.type = type;
		this.value = this.setValue(node.textContent);
	}
	setValue(val) {
		if (val === this.value) return false;
		if (typeof val === this.type) return (this.value = val);
		switch (this.type) {
			case "number":
				return (this.value = Number(val));
			case "string":
				return (this.value = `${string}`);
		}
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

const debugModule = true;

export function htmlLiteralToTemplate(raw, ...data) {
	// if (debugModule) debugStart("html", "es6-html-string --> template");

	data = data.map((_) => (_ ? _ : ""));
	const stringExpressions = [];
	for (const [key, val] of Object.entries(data)) {
		if (val instanceof ZyxHTML) {
			data[key] = val.__html__;
			stringExpressions.push(`<StrExpr id="${key}"></StrExpr>`);
			continue;
		}
		if (val instanceof HTMLElement || val instanceof DocumentFragment) {
			stringExpressions.push(`<StrExpr id="${key}"></StrExpr>`);
		} else {
			stringExpressions.push(val);
		}
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
