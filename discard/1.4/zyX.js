// version 1.4 - hot

import { html, pr0x, zyXenv, ZyxHTML2 } from "./_/zyx-HTML.js";

import { zyxcss, css } from "./_/zyx-CSS.js";

import { doMe } from "./_/zyx-DoMe.js";

import { zyxImgJump } from "./_/zyx-Attrs.js";

import { zyxTransform } from "./_/zyx-Transform.js";

import { offset, offsetLimit } from "./_/zyx-Math.js";

import { sleep } from "./_/zyx-Async.js";

import { zyxCookie } from "./_/zyx-Cookie.js";

import { delayChain, breakDelayChain, clearDelay, delay, debounce } from "./_/zyx-Delay.js";

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
	ZyxHTML2,
	raf,
	zyXio,
	forwardEffect,
	html,
	pr0x,
	zyXenv,
	css,
	zyxcss,
	doMe,
	events,
	zyxCookie,
	offset,
	offsetLimit,
	forQuery,
	setProps,
	pathContains,
	pointerDrag,
	pointerDragGlobal,
	clickOutsideOf,
	zyxTransform,
	zyxImgJump,
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
};
///// wumbl3.xyz 2022 ///// //// /// // 7

export function zyX(that) {
	return new Proxy(
		{
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
		},
		{
			get: (obj, key) => {
				const func = obj[key];
				if (typeof func === "function") {
					return (...args) => func(that, ...args);
				}
			},
			set: () => {},
		}
	);
}

export function initZyxFramework() {
	if (window.zyX__version__) {
		console.log("previous zyX init already happened", window.zyX__version__);
		console.log("over-binding...");
	}
	window.sleep = sleep;
	window.css = css;
	window.zyxcss = zyxcss;
	window.html = html;
	window.zyXenv = zyXenv;
	window.pr0x = pr0x;
	window.zyX = zyX;
	window.zyX__version__ = "1.4";
	console.log("built using zyX framework. v:", window.zyX__version__);
}

export class asyncWorkerHost {
	constructor({ url } = {}) {
		this.sW = new Worker(url);
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

/*
Use this in service worker.

const eventHandler = new (class asyncServiceWorker {
	constructor() {
		onmessage = async (taskData) => {};
	}

	call(event, data) {
		postMessage({
			event,
			data,
		});
	}
})();


*/
