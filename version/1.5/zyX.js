export const __BASEDIR__ = "https://zyx.wumbl3.xyz/v:1.5/" // import.neta.path (w/o webpack)
export const __VERSION__ = __BASEDIR__.split("/").slice(-2)[0]
console.log("[ZyX] Version:", __VERSION__, "BaseDir:", __BASEDIR__);
/*
	<script type="importmap">
	{
		"imports": {
			"zyX": "https://zyx.wumbl3.xyz/v:1.5/",
			"zyX/": "https://zyx.wumbl3.xyz/v:1.5/"
		}
	}
	</script>
*/

import { css, zyxcss } from "./_/zyX-CSS.js";

css`@import url(${__BASEDIR__}_/@css/zyX-Attr.css);`;

import { ZyXHtml, html } from "./_/zyX-HTML.js";

import { zyXPost, zyXGet, getImageBlob } from "./_/zyX-Fetch.js";

import { offset, offsetLimit } from "./_/zyX-Math.js";

import { sleep, AsyncWorker, AsynConstructor } from "./_/zyX-Async.js";

import zyXCookie from "./_/zyX-Cookie.js";

import {
	delayChain,
	breakDelayChain,
	clearDelay,
	delay,
	debounce
} from "./_/zyX-Delay.js";

import Splash from "./_/zyX-Splash.js";

import ZyXEvents from "./_/zyX-Event.js";

import calculateDominantColor from "./_/zyX-HUE.js";

import { ZyXDomArray, ZyXArray } from "./_/zyX-Reactive.js";

import {
	timeoutLimiter,
	rightClick,
	events,
	forQuery,
	pathContains,
	pointerDrag, // depracate this (feednav in feed dekapp)
	setProps,
	WeakRefSet,
	pointerEventPathContains
} from "./_/zyX-Toolbox.js";

import ZyXio from "./_/zyX-IO.js";

import ZyXAudio from "./_/zyX-Audio.js";

///// wumbl3.xyz 2023 ///// //// /// // 7

const zyXMethods = {
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
		if (out instanceof ZyXHtml) out.const();
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

export function isMobile() { return navigator.maxTouchPoints > 0; }

/////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
export {
	html,
	css,
	zyxcss,
	//
	zyXCookie,
	zyXPost,
	zyXGet,
	getImageBlob,
	//
	ZyXHtml,
	ZyXDomArray,
	ZyXArray,
	ZyXEvents,
	ZyXAudio,
	ZyXio,
	//
	AsyncWorker,
	AsynConstructor,
	//
	WeakRefSet,
	//
	offset,
	offsetLimit,
	//
	forQuery,
	setProps,
	pathContains,
	pointerDrag,
	pointerEventPathContains,
	// 
	delay,
	clearDelay,
	delayChain,
	breakDelayChain,
	debounce,
	sleep,
	timeoutLimiter,
	//
	calculateDominantColor,
	//
	Splash,
};
