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

import { ZyXDomArray, getDomArray } from "./_/zyX-Reactive.js";
import { ZyXArray, ZyXObject } from "./_/zyX-Types.js";
import { css, zyxcss } from "./_/zyX-CSS.js";

import { ZyXHtml, html, makePlaceable, getTopLevelElements } from "./_/zyX-HTML.js";

import "./_/zyX-Init.js";

import { offset, offsetLimit } from "./_/zyX-Math.js";

import { sleep, AsyncWorker, AsynConstructor } from "./_/zyX-Async.js";

import {
	delayChain,
	breakDelayChain,
	clearDelay,
	delay,
	debounce,
	instant,
} from "./_/zyX-Delay.js";

import { WeakRefSet, ZyXSlots, ZyXDeque } from "./_/zyX-Types.js";

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
} from "./_/zyX-Toolbox.js";

import zyXCookie from "./_/zyX-Cookie.js";

import ZyXEvents from "./_/zyX-Event.js";
import ZyXAudio from "./_/zyX-Audio.js";
import ZyXInput, { functions } from "./_/zyX-Input.js";
import { Focusable, FocusController } from "./_/zyX-Focusables.js";

import calculateDominantColor from "./_/zyX-HUE.js";
import zyXTransform from "./_/zyX-Transform.js";

import {
	getAllShadowRoots,
	clearAllSelections,
	forEachShadowRoot,
	queryAllRoots,
} from "./_/zyX-ShadowRoot.js";

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
} from "./_/zyX-Fetch.js";
import ScrollTo from "./_/zyX-ScrollTo.js";

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
