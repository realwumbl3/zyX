/*
import { zyX, oM, html, css } from "https://zyx.wumbl3.xyz/"
*/
///// wumbl3.xyz 2022 ///// zyXw/vanilla. 2022

import { zyxcss, css } from "./zyx-CSS.js";
import { html } from "./zyx-HTML.js";

import { doMe } from "./zyx-DoMe.js";
import { zyx } from "./zyx-Magic.js";

const GlobalMap = new Map();

const GlobalGet = (ref, bank) => {
	let map = GlobalMap.get(ref);
	// console.log('map for', map)
	if (!map) {
		GlobalMap.set(ref, { banks: {} });
		map = GlobalMap.get(ref);
	}
	if (!(bank in map.banks)) map.banks[bank] = {};

	return map.banks[bank];
};

const createChainMap = () => {
	return new Object({
		callbacks: [],
		pending: [],
	});
};

export function zyX(that) {
	return {
		zyx: (args) => {
			try {
				return zyx({ that: that, ...args });
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		element: function (args) {
			// Deprecate with idfnt client.
			try {
				return doMe({ type: that || "div", ...args });
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		// fetchtml: async () => {
		// 	try {
		// 		const html_fetch = await fetch(that);
		// 		if (html_fetch.status !== 200) return console.log("html fetch error");
		// 		const html_text = await html_fetch.text();
		// 		let parser = new DOMParser();
		// 		const parsed = parser.parseFromString(html_text, "text/html");
		// 		return parsed.body;
		// 	} catch (err) {
		// 		console.error(err);
		// 		throw err;
		// 	}
		// },
		delayChain: (keyname) => {
			const map = GlobalGet(that, "delayChains");
			if (keyname in map) {
				for (const timeout of map[keyname].pending) {
					clearTimeout(timeout);
				}
				map[keyname].pending = [];
				map[keyname].callbacks = [];
			} else {
				map[keyname] = createChainMap();
			}
			const callTimeout = () => (map[keyname].callbacks.length > 0 ? map[keyname].callbacks.splice(0, 1)[0]() : false);
			const returnFunc = () => {
				return {
					then: (cb, delay) => {
						const cbfunc = () => {
							map[keyname].pending.push(
								setTimeout((_) => {
									cb();
									callTimeout();
								}, delay)
							);
						};
						map[keyname].callbacks.push(cbfunc);
						return returnFunc();
					},
				};
			};
			map[keyname].pending.push(setTimeout(callTimeout, 1));
			return returnFunc();
		},
		breakDelayChain: (keyname) => {
			const map = GlobalGet(that, "delayChains");
			if (keyname in map) {
				for (const timeout of map[keyname].pending) {
					clearTimeout(timeout);
				}
				map[keyname] = createChainMap();
			}
		},
		delay: (keyname, ms, func) => {
			return new Promise((res, rej) => {
				const map = GlobalGet(that, "delays");
				if (keyname in map) clearTimeout(map[keyname]);
				if (!ms) return;
				if (func) map[keyname] = setTimeout(() => res(func()), ms);
				else map[keyname] = setTimeout(res, ms);
				return map[keyname];
			});
		},
		clearDelay: (...keynames) => {
			const map = GlobalGet(that, "delays");
			for (const keyname in keynames) if (keyname in map) clearTimeout(map[keyname]);
			return false;
		},
		// /////////////////////////
		forQuery: function (query, cbfn) {
			try {
				[...that.querySelectorAll(query)].forEach((_) => cbfn(_));
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		setProps: function (props) {
			try {
				for (let [property_name, property] of Object.entries(props)) {
					that.style.setProperty(property_name, property);
				}
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		events: function (events, callbackfn) {
			for (let event of events.split(" ")) {
				that.addEventListener(event, callbackfn);
			}
		},
		pathContains(match) {
			let path = that.path || (that.composedPath && that.composedPath());
			for (let e of path) {
				if (e === document) return false;
				if (typeof match === "string" && e.matches(match)) return e;
				else if (e === match) return e;
			}
			return false;
		},
	};
}

window.zyx = zyX;

import { zyxImgJump } from "./_/zyx-Attrs.js";

import { zyxTransform } from "./_/zyx-Transform.js";

import { sleep, offset, offsetLimit } from "./_/zyx-General.js";

import { zyxCookie } from "./_/zyx-Cookie.js";

import zyxAudio from "./_/zyx-Audio.js";

import { oM } from "./_/zyx-oM.js";

const $f = (condition, callback) => {
	return condition ? callback : "";
};

const placeIf = (condition) => {
	return (content) => {
		return condition ? content : "";
	};
};

function clickOutsideOf(node, callback) {
	const destroy = () => {
		window.removeEventListener("click", clickScanFunction, true);
	};
	const clickScanFunction = (e) => {
		if (!e.composedPath().includes(node)) {
			e.stopPropagation();
			e.stopImmediatePropagation();
			e.preventDefault();
			destroy();
			callback();
		}
	};
	setTimeout((_) => window.addEventListener("click", clickScanFunction, true), 1);
	return destroy;
}

function pointerDrag(node, callback) {
	const state = {
		active: null,
	};
	node.addEventListener("pointerup", (_) => (state.active = false));
	node.addEventListener("pointerdown", (_) => {
		state.active = true;
		callback(_);
	});
	node.addEventListener("pointermove", (_) => {
		if (!state.active) return;
		callback(_);
	});
}
// const $f = (condition, that) => {
// 	const attemptBuild = new condition(that);
// 	console.log("attemptBuild", attemptBuild);
// 	return attemptBuild.main || "";
// };

/////// \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
export { oM, html, $f, pointerDrag, clickOutsideOf, placeIf, zyxcss, css, zyxTransform, zyxAudio, zyxCookie, zyxImgJump, sleep, offset, offsetLimit };
///// wumbl3.xyz 2022 ///// //// /// // 7 Montreal Police Are Dumb Scumbags //////
