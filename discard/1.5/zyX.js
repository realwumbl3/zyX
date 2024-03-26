// version 1.5 - hot ??

const __VERSION__ = "1.5";
const __ROOT__ = `https://zyx.wumbl3.xyz/v:${__VERSION__}/_`;

function __GET__(path) {
	return __ROOT__ + path;
}

import { css, zyxcss } from "./_/zyx-CSS.js";

import { zyXHtml, html, join } from "./_/zyx-HTML.js";

import { zyXPost, zyXGet, zyXGet2 } from "./_/zyx-Fetch.js";

zyxcss.l(__GET__("/css/zyX-Attr.css"));

import { pr0x } from "./_/zyx-Prox.js";

import { doMe } from "./_/zyx-DoMe.js";

import { zyxTransform } from "./_/zyx-Transform.js";

import { offset, offsetLimit } from "./_/zyx-Math.js";

import { sleep } from "./_/zyx-Async.js";

import zyXCookie from "./_/zyx-Cookie.js";

import { delayChain, breakDelayChain, clearDelay, delay, debounce } from "./_/zyx-Delay.js";

import Splash from "./_/zyx-Splash.js";

import EventSystem from "./_/zyx-Event.js";

import calculateDominantColor from "./_/zyx-HUE.js";

import {
	raf,
	timeoutLimiter,
	rightClick,
	clickOutsideOf,
	events,
	forQuery,
	pathContains,
	pointerDrag,
	pointerDragGlobal,
	setProps,
	forwardEffect,
	WeakRefSet,
} from "./_/zyx-Toolbox.js";

import zyXio from "./_/zyx-IO.js";

import zyxAudio from "./_/zyx-Audio.js";

/////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
export {
	EventSystem,
	zyXGet2,
	css,
	zyxcss,
	html,
	join,
	calculateDominantColor,
	raf,
	zyXio,
	forwardEffect,
	pr0x,
	doMe,
	events,
	zyXCookie,
	offset,
	offsetLimit,
	forQuery,
	setProps,
	pathContains,
	pointerDrag,
	pointerDragGlobal,
	clickOutsideOf,
	zyxTransform,
	zyxAudio,
	delay,
	clearDelay,
	delayChain,
	breakDelayChain,
	debounce,
	sleep,
	rightClick,
	timeoutLimiter,
	WeakRefSet,
	pointerEventPathContains,
	Splash,
	zyXPost,
	zyXGet,
	zyXHtml,
};

///// wumbl3.xyz 2023 ///// //// /// // 7

function pointerEventPathContains(e, cssSelector) {
	const path = e.path || (e.composedPath && e.composedPath());
	return path.some(e => e.matches?.(cssSelector))
}

export class AsynConstructor {
	constructor({ delay = 1, microtask = false } = {}) {
		if (typeof this.asynConstructor === "function") {
			if (microtask) {
				queueMicrotask(_ => this.asynConstructor());
			} else {
				setTimeout(_ => this.asynConstructor(), delay);
			}
		} else {
			console.warn("you are using a (new AsynConstructor()) class without an async asynConstructor method.");
		}
	}

}

//class that returns a promise that resolves the next cpu cycle after the constructor is called 
export class AsynConstructorv2 {
	constructor(...args) { }
	promise() {
		return new Promise((resolve, reject) => {
			if (typeof this.asynConstructor === "function") {
				setTimeout(_ => { resolve(this.asynConstructor()) }, 1);
			} else {
				console.warn("you are using a asynConstructor without an async asynConstructor() method");
			}
		});
	}
}

export function loadCSSAsync2(url) {
	return new Promise((resolve, reject) => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = url;
		link.onerror = reject;
		link.onload = () => {
			link.remove();
			resolve({
				link,
				cleanUp: () => {
					link.remove();
				}
			})
		};
		document.head.appendChild(link);
	});
}


export function loadCSSAsync(url) {
	return new Promise((resolve, reject) => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = url;
		link.onerror = reject;
		link.onload = () => {
			link.remove();
			setTimeout(_ => resolve({
				link,
				cleanUp: () => {
					link.remove();
				}
			}), 100);
		};
		const head = document.head || document.getElementsByTagName('head')[0];
		head.appendChild(link);
	});
}

const zyXaccessible_methods = {
	pointerDrag,
	pointerDragGlobal,
	zyxTransform,
	forQuery,
	setProps,
	pathContains,
	clickOutsideOf,
	events,
	delay,
	clearDelay,
	delayChain,
	breakDelayChain,
	rightClick,
	debounce,
	of: (times, markup) => Array(times).fill().map(_ => {
		const out = markup()
		if (out instanceof zyXHtml && !out.__constructed__) out.const();
		return out;
	})
}

const global = {}

export default function zyX(that) {
	return new Proxy(global,
		{
			get: (obj, key) => {
				if (zyXaccessible_methods.hasOwnProperty(key)) {
					const func = zyXaccessible_methods[key];
					return (...args) => func(that, ...args);
				}
				return obj[key];
			},
			set: () => { },
		}
	);
}

export class AsyncWorker {
	constructor({ url, type = "module" } = {}) {
		this.sW = new Worker(url, { type });
		this.serviceWorkerTasks = {};
		this.sW.onmessage = this.serviceWorkerResponse;
		this.callbacks = {};
	}

	on(key, cb) {
		if (!(key in this.callbacks)) this.callbacks[key] = [];
		this.callbacks[key].push(cb);
	}

	callCallback(data) {
		const callbacks = this.callbacks[data.event];
		if (!callbacks) return
		for (const cb of callbacks) cb(data.data);
	}

	serviceWorkerResponse = (response) => {
		if ("event" in response.data) {
			return this.callCallback(response.data);
		}
		const { taskID, reject } = response.data;
		const serviceTask = this.serviceWorkerTasks[taskID];
		delete this.serviceWorkerTasks[taskID];
		if (reject) return serviceTask.reject(reject);
		serviceTask?.resolve(response.data);
	};

	task({ task, data }) {
		return new Promise((resolve, reject) => {
			const taskID = Math.random().toString(36).slice(2, 10);
			const serviceWorkerTask = { task, taskID, resolve, reject };
			this.serviceWorkerTasks[taskID] = serviceWorkerTask;
			this.sW.postMessage({ task, data, taskID });
		});
	}
}

// str, num, bool, arr, obj, func, undf, null, sym, ukwn
export function shorthandTypeof(obj) {
	if (obj === null) return "null";
	if (obj === undefined) return "undef";
	if (typeof obj === "object") {
		if (Array.isArray(obj)) return "arr";
		if (obj instanceof HTMLElement) return "html";
		return "obj";
	}
	if (typeof obj === "function") return "func";
	if (typeof obj === "string") return "str";
	if (typeof obj === "number") return "num";
	if (typeof obj === "boolean") return "bool";
	if (typeof obj === "symbol") return "sym";
	return "ukwn";
}


export class stateInDom {
	constructor(zyXHtml) {



	}

}


export function recursiveKeyCount(obj) {
	let total = 0;
	for (const key in obj) {
		total++;
		if (typeof obj[key] === 'object') {
			total += recursiveKeyCount(obj[key]);
		}
	}
	return total;
}



export class zyXReactive {
	constructor(obj) {
		this.obj = obj;
		this.__onchange__ = new WeakRefSet();
		return new Proxy(this.obj, {
			set: (target, key, value) => {
				// console.log("set", key, value)
				target[key] = value;
				this.__onchange__.forEach(_ => _(key, value))
				return true;
			},
			get: (target, key) => {
				if (key === "onChange") return this.onChange;
				if (key === "__onchange__") return this.__onchange__;
				return target[key];
			}
		})
	}

	onChange(cb) {
		this.__onchange__.add(cb);
	}
}


// export class zyXRarray extends Array {
// 	constructor(...args) {
// 		super(...args)
// 		this.__onchange__ = new WeakRefSet();

// 		return new Proxy(this, {
// 			set: (target, property, value) => {
// 				target[property] = value;
// 				this.observeChanges(target, property, value);
// 				return true;
// 			},
// 			deleteProperty: (target, property, value) => {
// 				delete target[property];
// 				this.observeChanges(target, property, value);
// 				return true;
// 			}
// 		});
// 	}

// 	observeChanges(...args) {
// 		// console.log('Array changed:', args);
// 		this.__onchange__.forEach(_ => _(...args));
// 	}

// 	onChange(cb) {
// 		this.__onchange__.add(cb);
// 	}

// }