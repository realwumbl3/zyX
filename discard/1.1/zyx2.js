// version 1.1 - notouch

import { html, pr0x } from "./_/zyx-HTML.js";

import { zyxcss, css } from "./_/zyx-CSS.js";

import { doMe } from "./_/zyx-DoMe.js";

import { zyxImgJump } from "./_/zyx-Attrs.js";

import { zyxTransform } from "./_/zyx-Transform.js";

import { offset, offsetLimit } from "./_/zyx-Math.js";

import { sleep } from "./_/zyx-Async.js";

import { zyxCookie } from "./_/zyx-Cookie.js";

import { delayChain, breakDelayChain, clearDelay, delay } from "./_/zyx-Delay.js";

import { clickOutsideOf, events, forQuery, pathContains, pointerDrag, setProps } from "./_/zyx-Toolbox.js";

import zyxAudio from "./_/zyx-Audio.js";

/////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
export {
	pr0x,
	zyxCookie,
	html,
	css,
	zyxcss,
	doMe,
	events,
	sleep,
	delay,
	clearDelay,
	delayChain,
	breakDelayChain,
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
};
///// wumbl3.xyz 2022 ///// //// /// // 7

export function zyX(that) {
	return new Proxy(
		{
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
