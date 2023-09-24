import { debugCheckpoint, debugStart, debugLog } from "./zyx-Debugger.js";

const html_time_debug = false;
export function html(raw, ...data) {
	if (html_time_debug) debugStart("html", "es6-html-string --> zyXHTML");
	const zyxHTML = new ZyxHTML(raw, ...data);
	if (html_time_debug) debugCheckpoint("html", `new ZyxHTML created.`);
	if (html_time_debug) debugLog("html", { min: 0, dump: { raw, ...data } });
	return zyxHTML;
}

export function zyXenv(args) {
	return new zyXenvClass(args);
}

const debugModule = false;
///// DOM TEMPLATES /////

export class ZyxHTML {
	constructor(raw, ...data) {
		this.__scope__ = {};
		this.__typescope__ = {};
		this.__placeholders__ = {};
		if (typeof data[0] === "object" && data[0] instanceof zyXenvClass) {
			data[0].connect(this);
			data[0] = "";
		}
		this.__html__ = this.htmlLiteralToTemplate(raw, ...data);
		zyxMagic(this, this.__html__);
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

	htmlLiteralToTemplate(raw, ...data) {
		if (debugModule) debugStart("html", "es6-html-string --> template");

		data = data.map((_) => (_ ? _ : ""));
		const stringExpressions = [];
		for (let [key, val] of Object.entries(data)) {
			if (typeof val === "function") {
				const call = val(this.__scope__);
				if (call) {
					val = call;
					data[key] = call;
				}
			}
			if (Array.isArray(val)) {
				const arrayFragment = document.createElement("template");
				const fragmentContent = arrayFragment.content;
				val = val.map((_) => {
					if (isHTML(_)) return _;
					if (_ instanceof ZyxHTML) return _.__html__;
					if (_?.__zyxHTML__) return _.__zyxHTML__.__html__;
					if (typeof _ === "string") return markUp(_);
				});
				fragmentContent.append(...val);
				data[key] = fragmentContent;
				stringExpressions.push(zyxProcessPlaceholder(key));
				continue;
			}
			if (isInsertableType(val)) {
				stringExpressions.push(zyxProcessPlaceholder(key));
				continue;
			}
			stringExpressions.push(val);

			if (debugModule) debugCheckpoint("html", `placed <StrExpr> id:${key}`);
		}

		const string = String.raw({ raw }, ...stringExpressions);

		const template = stringToTemplate(string);
		
		if (debugModule) debugCheckpoint("html", "pass string to stringToTemplate() function");

		for (const strExpPh of [...template.querySelectorAll("StrExpr")]) {
			const replacementData = data[strExpPh.id];
			if (replacementData instanceof ZyxHTML) {
				Object.assign(this.__scope__, replacementData.__scope__);
				strExpPh.replaceWith(replacementData.__html__);
			} else if (replacementData?.__zyxHTML__) {
				strExpPh.replaceWith(replacementData.__zyxHTML__.__html__);
			} else {
				strExpPh.replaceWith(replacementData);
			}
		}

		if (debugModule) debugCheckpoint("html", "query and replace <StrExpr> with values, --> template");
		if (debugModule) debugLog("html", { min: 0, dump: { raw, ...data } });

		return template;
	}

	bind(parent) {
		for (const key of Object.keys(parent)) {
			if (key in this.__scope__) {
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
		parent.appendTo = (container) => container.append(this.__html__);
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

class zyXenvClass {
	constructor(args) {
		this.args = args;
	}
	connect(parent) {
		"$" in this.args && parent.bind(this.args["$"]);
	}
}

function zyxProcessPlaceholder(key) {
	return `<StrExpr id="${key}"></StrExpr>`;
}

function isInsertableType(_) {
	return _?.__zyxHTML__ || _ instanceof ZyxHTML || _ instanceof HTMLElement || _ instanceof DocumentFragment;
}

function isHTML(_) {
	return _ instanceof HTMLElement || _ instanceof DocumentFragment;
}

export function stringToTemplate(string) {
	const templateContent = document.createElement("template").content;
	templateContent.append(...markUp(string).childNodes);
	return templateContent;
}

export function stringToTemplate2(string) {
	const template = document.createElement("template");
	template.innerHTML = string.trim();
	return template.content.firstElementChild;
}

function markUp(markup) {
	const markupContent = document.createElement("div");
	markupContent.innerHTML = markup;
	return markupContent;
}

const zyxCustomTags = ["pr0x", "this", "push", "ph"];

const customTagRegex = new RegExp(`^(${zyxCustomTags.join("|")})(.+)?`);

export function zyxMagic(that, markup) {
	[...markup.querySelectorAll("[shadw-root]")].forEach((shadowNode) => {
		const shadow = shadowNode.attachShadow({ mode: "open" });
		shadow.append(...shadowNode.childNodes);
		shadowNode.shadow = shadow;
	});
	[...markup.querySelectorAll("assign-this")].forEach((thisNode) => {
		thisNode.this = that;
	});
	[...markup.querySelectorAll("*")].forEach((thisNode) => {
		const tagName = thisNode.localName;
		if (tagName in zyxTags) {
			zyxTags[tagName](that, thisNode);
		}
		if (tagName === "ph") {
			const firstKey = [...thisNode.attributes][0].nodeName;
			thisNode.setAttribute("ph", firstKey);
			assignThisAttribute(that, thisNode, firstKey);
			return;
		}
		for (const attr of thisNode.attributes) {
			const { nodeName } = attr;
			const customTags = customTagRegex.exec(nodeName);
			if (customTags) {
				const [match, a, b] = customTags;
				const attrValue = thisNode.getAttribute(match);
				switch (a) {
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
		if (set === null || set === undefined) return true;
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

import { applyZyxAttrs, zyxTags } from "./zyx-Attrs.js";

export function placeObject(what, where) {
	if (typeof where === "string") {
		const placeTarget = document.querySelector(`ph[${where}]`);
		if (placeTarget) placeTarget.replaceWith(what);
		else {
			throw new Error(where, "not found");
		}
	} else if (typeof where === "object") where.replaceWith(what);
}
