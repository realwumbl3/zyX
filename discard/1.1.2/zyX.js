// version 1.2 - frozen

import { html, pr0x } from "./_/zyx-HTML.js";

import { zyxcss, css } from "./_/zyx-CSS.js";

import { doMe } from "./_/zyx-DoMe.js";

import { zyxImgJump } from "./_/zyx-Attrs.js";

import { zyxTransform } from "./_/zyx-Transform.js";

import { offset, offsetLimit } from "./_/zyx-Math.js";

import { sleep } from "./_/zyx-Async.js";

import { zyxCookie } from "./_/zyx-Cookie.js";

import { delayChain, breakDelayChain, clearDelay, delay } from "./_/zyx-Delay.js";

import { timeoutLimiter, rightClick, clickOutsideOf, events, forQuery, pathContains, pointerDrag, setProps, forwardEffect } from "./_/zyx-Toolbox.js";

import zyxAudio from "./_/zyx-Audio.js";

/////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
export {
	forwardEffect,
	html,
	pr0x,
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
	clickOutsideOf,
	zyxTransform,
	zyxImgJump,
	zyxAudio,
	delay,
	clearDelay,
	delayChain,
	breakDelayChain,
	sleep,
	rightClick,
	timeoutLimiter,
};
///// wumbl3.xyz 2022 ///// //// /// // 7

export function zyX(that) {
	return new Proxy(
		{
			pointerDrag,
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
	window.css = css;
	window.html = html;
	window.pr0x = pr0x;
	window.zyX = zyX;
	window.zyX__version__ = "1.444";
	console.log("built using zyX framework. v:", window.zyX__version__);
}
