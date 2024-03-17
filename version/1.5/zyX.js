const __VERSION__ = "1.5";
const __ROOT__ = `https://zyx.wumbl3.xyz/v:${__VERSION__}`;

import { css, zyxcss } from "./_/zyx-CSS.js";

css`url(${__ROOT__}/zyX-Attr.css)`;

import { zyXHtml, html } from "./_/zyx-HTML.js";

import { zyXPost, zyXGet, zyXGet2 } from "./_/zyx-Fetch.js";

import { pr0x } from "./_/zyx-Prox.js";

import { doMe } from "./_/zyx-DoMe.js";

import { offset, offsetLimit } from "./_/zyx-Math.js";

import { sleep, asyncWorkerHost, AsynConstructor } from "./_/zyx-Async.js";

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
	events,
	forQuery,
	pathContains,
	pointerDrag,
	pointerDragGlobal,
	setProps,
	WeakRefSet,
	pointerEventPathContains
} from "./_/zyx-Toolbox.js";

import zyXio from "./_/zyx-io.js";

import zyxAudio from "./_/zyx-Audio.js";

///// wumbl3.xyz 2023 ///// //// /// // 7

const zyXMethods = {
	pointerDrag,
	pointerDragGlobal,
	forQuery,
	setProps,
	pathContains,
	events,
	delay,
	clearDelay,
	delayChain,
	breakDelayChain,
	rightClick,
	debounce,
	of: (times, markup) => Array(times).fill().map(_ => {
		const out = markup()
		if (out instanceof zyXHtml) out.const();
		return out;
	})
}

export default function zyX(that) {
	return new Proxy(zyXMethods,
		{
			get: (obj, key) => {
				if (obj.hasOwnProperty(key)) {
					const func = obj[key];
					return (...args) => func(that, ...args);
				}
				throw new Error(`zyX().${key} is not a function`);
			},
			set: () => { },
		}
	);
}

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
	asyncWorkerHost,
	AsynConstructor
};
