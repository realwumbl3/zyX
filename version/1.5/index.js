export const { root, version } = getBaseMeta()
console.log("[ZyX] Version:", version, "BaseDir:", root);
/*
	<script type="importmap">
	{
		"imports": {
			"zyX": "https://zyxx.wumbl3.xyz/v:1.5/",
			"zyX/": "https://zyxx.wumbl3.xyz/v:1.5/"
		}
	}
	</script>
*/

export function getBaseMeta() {
	return { root: import.meta.url, version: import.meta.url.split("/").slice(-2)[0] }
}

import { ZyXDomArray, ZyXArray } from "./_/zyX-Reactive.js";

import { css, zyxcss } from "./_/zyX-CSS.js";

import { ZyXHtml, html } from "./_/zyX-HTML.js";

css`@import url(${root}_/@css/zyX-Attr.css);`;


import { offset, offsetLimit } from "./_/zyX-Math.js";

import { sleep, AsyncWorker, AsynConstructor } from "./_/zyX-Async.js";

import {
	delayChain,
	breakDelayChain,
	clearDelay,
	delay,
	debounce
} from "./_/zyX-Delay.js";

import { WeakRefSet, Fuze } from "./_/zyX-Types.js";

import {
	timeoutLimiter,
	events,
	forQuery,
	placeSafely,
	setProps,
	pointerEventPathContains,
	hexToRGB,
	hexToHSL,
	exposeToWindow, ss, clamp, ceilClamp, minMax, seedShuffle, seedRandom,
} from "./_/zyX-Toolbox.js";

import zyXCookie from "./_/zyX-Cookie.js";


import ZyXEvents from "./_/zyX-Event.js";
import ZyXAudio from "./_/zyX-Audio.js";
import ZyXInput, { functions } from "./_/zyX-Input.js";
import { Focusable, FocusController } from "./_/zyX-Focusables.js";

import calculateDominantColor from "./_/zyX-HUE.js";

///// wumbl3.xyz 2023 ///// //// /// // 7

const zyXMethods = {
	forQuery,
	setProps,
	events,
	delay,
	clearDelay,
	delayChain,
	breakDelayChain,
	debounce,
	of: (times, call) => Array(times).fill().map((_, index) => call(index))
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

import { zyXPost, zyXGet, zyXFormPost, zyXFetchBlob, resizeImageToCanvas, urlSplitExt } from "./_/zyX-Fetch.js";
import ScrollTo from "./_/zyX-ScrollTo.js";

/////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
export {
	//
	WeakRefSet,
	Fuze,
	//
	ZyXDomArray,
	ZyXArray,
	ZyXHtml,
	//
	html,
	css,
	zyxcss,
	//
	ZyXEvents,
	ZyXInput,
	ZyXAudio,
	//
	Focusable,
	FocusController,
	//
	AsyncWorker,
	AsynConstructor,
	//
	zyXCookie,
	zyXGet,
	zyXFetchBlob,
	zyXPost,
	zyXFormPost,
	urlSplitExt,
	//
	resizeImageToCanvas,
	calculateDominantColor,
	//
	exposeToWindow,
	ss,
	offset,
	offsetLimit,
	clamp,
	ceilClamp,
	minMax,
	seedShuffle,
	seedRandom,
	functions,
	hexToRGB,
	hexToHSL,
	//
	placeSafely,
	forQuery,
	setProps,
	pointerEventPathContains,
	ScrollTo,
	// 
	delay,
	clearDelay,
	delayChain,
	breakDelayChain,
	debounce,
	sleep,
	timeoutLimiter,
	//
};
