const __VERSION__ = "1.5";
const __ROOT__ = `https://zyx.wumbl3.xyz/v:${__VERSION__}`;

import { css, zyxcss } from "./_/zyx-CSS.js";

css`url(${__ROOT__}/zyX-Attr.css)`;

import { zyXHtml, html } from "./_/zyx-HTML.js";

import { zyXPost, zyXGet, zyXGet2 } from "./_/zyx-Fetch.js";

import { pr0x } from "./_/zyx-Prox.js";

import { doMe } from "./_/zyx-DoMe.js";

import { zyxTransform } from "./_/zyx-Transform.js";

import { offset, offsetLimit } from "./_/zyx-Math.js";

import { sleep } from "./_/zyx-Async.js";

import zyXcookie from "./_/zyx-Cookie.js";

import { delayChain, breakDelayChain, clearDelay, delay, debounce } from "./_/zyx-Delay.js";

import Splash from "./_/zyx-Splash.js";

import EventSystem from "./_/zyx-Event.js";

import calculateDominantColor from "./_/zyx-HUE.js";

import { zyXDomArray, zyXArray } from "./_/zyx-Reactive.js";

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

import zyXio from "./_/zyx-io.js";

import zyxAudio from "./_/zyx-Audio.js";

/////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
export {
	zyXDomArray,
	zyXArray,
	EventSystem,
	zyXGet2,
	css,
	zyxcss,
	html,
	calculateDominantColor,
	raf,
	zyXio,
	forwardEffect,
	pr0x,
	doMe,
	events,
	zyXcookie,
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

export class asyncWorkerHost {
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
