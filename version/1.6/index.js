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

import { ZyXDomArray, getDomArray } from "./src/zyX-Reactive.js";
import { ZyXArray, ZyXObject } from "./src/zyX-Types.js";
import { css, zyxcss } from "./src/zyX-CSS.js";

import { ZyXHtml, html, makePlaceable, getTopLevelElements } from "./src/zyX-HTML.js";

import "./src/zyX-Init.js";

import { offset, offsetLimit } from "./src/zyX-Math.js";

import { sleep, AsyncWorker, AsynConstructor } from "./src/zyX-Async.js";

import {
	delayChain,
	breakDelayChain,
	clearDelay,
	delay,
	debounce,
	instant,
} from "./src/zyX-Delay.js";

import { WeakRefSet, ZyXSlots, ZyXDeque } from "./src/zyX-Types.js";

import {
	timeoutLimiter,
	events,
	forQuery,
	placeSafely,
	setProps,
	pointerEventPathContains,
	pointerEventPathContainsMatching,
	hexToRGB,
	hexToHSL,
	exposeToWindow,
	ss,
	clamp,
	ceilClamp,
	minMax,
	seedShuffle,
	seedRandom,
} from "./src/zyX-Toolbox.js";

import zyXCookie from "./src/zyX-Cookie.js";

import ZyXEvents from "./src/zyX-Event.js";
import ZyXAudio from "./src/zyX-Audio.js";
import ZyXInput, { functions } from "./src/zyX-Input.js";
import { Focusable, FocusController } from "./src/zyX-Focusables.js";

import calculateDominantColor from "./src/zyX-HUE.js";
import zyXTransform from "./src/zyX-Transform.js";

import {
	getAllShadowRoots,
	clearAllSelections,
	forEachShadowRoot,
	queryAllRoots,
} from "./src/zyX-ShadowRoot.js";

///// wumbl3.xyz 2023 ///// //// /// // 7

const zyXMethods = {
	forQuery,
	setProps,
	events,
	delay,
	instant,
	clearDelay,
	delayChain,
	breakDelayChain,
	debounce,
	of: (times, call) =>
		Array(times)
			.fill()
			.map((_, index) => call(index)),
};

export default function zyX(that) {
	return new Proxy(zyXMethods, {
		get: (obj, key) => {
			if (obj.hasOwnProperty(key)) {
				const func = obj[key];
				return (...args) => func(that, ...args);
			}
			throw new Error(`zyX().${key} is not a function`);
		},
	});
}

export function isMobile() {
	return navigator.maxTouchPoints > 0;
}

import {
	zyXPost,
	zyXGet,
	zyXFormPost,
	zyXFetchBlob,
	resizeImageToCanvas,
	urlSplitExt,
} from "./src/zyX-Fetch.js";
import ScrollTo from "./src/zyX-ScrollTo.js";

/////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
export {
	//
	WeakRefSet,
	//
	ZyXHtml,
	ZyXArray,
	ZyXObject,
	ZyXDomArray,
	ZyXSlots,
	ZyXDeque,
	//
	getDomArray,
	//
	html,
	css,
	zyxcss,
	makePlaceable,
	getTopLevelElements,
	//
	ZyXEvents,
	ZyXInput,
	ZyXAudio,
	//
	Focusable,
	FocusController,
	//
	getAllShadowRoots,
	clearAllSelections,
	forEachShadowRoot,
	queryAllRoots,
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
	zyXTransform,
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
	pointerEventPathContainsMatching,
	ScrollTo,
	//
	delay,
	instant,
	clearDelay,
	delayChain,
	breakDelayChain,
	debounce,
	sleep,
	timeoutLimiter,
	//
};
