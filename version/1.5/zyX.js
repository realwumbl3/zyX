const __VERSION__ = "1.5";
const __ROOT__ = `https://zyx.wumbl3.xyz/v:${__VERSION__}`;

import { css, zyxcss } from "./_/zyx-CSS.js";

css`url(${__ROOT__}/zyX-Attr.css)`;

import { ZyXHtml, html } from "./_/zyx-HTML.js";

import { zyXPost, zyXGet, getImageBlob } from "./_/zyx-Fetch.js";

import { offset, offsetLimit } from "./_/zyx-Math.js";

import { sleep, AsyncWorker, AsynConstructor } from "./_/zyx-Async.js";

import zyXCookie from "./_/zyx-Cookie.js";

import { delayChain, breakDelayChain, clearDelay, delay, debounce } from "./_/zyx-Delay.js";

import Splash from "./_/zyx-Splash.js";

import ZyXEvents from "./_/zyx-Event.js";

import calculateDominantColor from "./_/zyx-HUE.js";

import { zyXDomArray, zyXArray } from "./_/zyx-Reactive.js";

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
} from "./_/zyx-Toolbox.js";

import zyXio from "./_/zyx-IO.js";

import zyxAudio from "./_/zyx-Audio.js";

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
	ZyXHtml,
	html,
	css,
	zyxcss,
	zyXDomArray,
	zyXArray,
	//
	ZyXEvents,
	zyXCookie,
	zyxAudio,
	zyXio,
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
	WeakRefSet,
	Splash,
	//
	zyXPost,
	zyXGet,
	getImageBlob,
	//
	AsyncWorker,
	AsynConstructor,
	//
	calculateDominantColor,
};
