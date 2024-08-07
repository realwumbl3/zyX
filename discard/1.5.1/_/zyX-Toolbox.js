import { sleep } from "./zyX-Async.js";

export function forQuery(that, query, cbfn) {
	return [...that.querySelectorAll(query)].forEach((_) => cbfn(_));
}

export function setProps(that, props) {
	Object.entries(props).forEach(([prop, val]) => that.style.setProperty(prop, val));
}

export async function placeSafely(target, container, x, y, unit = "em") {
	container.appendChild(target);
	target.style[y >= 0 ? "top" : "bottom"] = Math.abs(y) + unit;
	target.style[x >= 0 ? "left" : "right"] = Math.abs(x) + unit;
	await sleep(1);
	const { offsetWidth: targetWidth, offsetHeight: targetHeight } = target;
	const { offsetWidth: containerWidth, offsetHeight: containerHeight } = container;
	const { left, top, bottom, right } = target.getBoundingClientRect();
	if (!(left < 0 || top < 0 || bottom > containerHeight || right > containerWidth))
		return;
	bottom > containerHeight && (target.style.top = `${containerHeight - targetHeight}px`);
	right > containerWidth && (target.style.left = `${containerWidth - targetWidth}px`);
}

export function events(that, events, cb, options = {}) {
	events.split(" ").forEach((event) => that.addEventListener(event, cb, options));
}

/**
	 * @param {Number} cooldown - The cooldown in milliseconds
	 * @returns {Function} - Returns true if the cooldown has passed

 */
export function timeoutLimiter(cooldown) {
	const last = { ago: 0, key: null };
	cooldown = cooldown || 60;
	return (key) => {
		if (key && key !== last.key) {
			last.key = key;
			return true;
		}
		if (performance.now() - last.ago < cooldown) return false;
		last.ago = performance.now();
		return true;
	};
}

export function pointerEventPathContains(e, elem) {
	return (e.composedPath && e.composedPath()).some((e) => e === elem);
}

export function pointerEventPathContainsMatching(e, cssSelector) {
	return (e.composedPath && e.composedPath()).find((e) => e.matches?.(cssSelector));
}

export function hslCssKeys({ h = 0, s = 0, l = 0 } = {}) {
	return { h: h + "deg", s: s + "%", l: l + "%" };
}

export function hexToRGB(hex) {
	hex = hex.replace("#", "");
	return {
		r: parseInt(hex.substring(0, 2), 16) / 255,
		g: parseInt(hex.substring(2, 4), 16) / 255,
		b: parseInt(hex.substring(4, 6), 16) / 255,
	};
}
export function hexToHSL(hex) {
	const { r, g, b } = hexToRGB(hex);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let s = 0;
	if (max !== min)
		s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
	let h = 0;
	if (max !== min) {
		if (max === r) {
			h = (g - b) / (max - min);
		} else if (max === g) {
			h = 2 + (b - r) / (max - min);
		} else {
			h = 4 + (r - g) / (max - min);
		}
	}
	h *= 60;
	if (h < 0) h += 360;
	return {
		h: Math.round(h),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

export function exposeToWindow(modules) {
	for (const [key, val] of Object.entries(modules)) window[key] = val;
}

export function ss(int) {
	return int > 1 ? "s" : "";
}

export function clamp(val, min, max) {
	return Math.max(min, Math.min(max, val));
}

export function ceilClamp(val, min, max) {
	return Math.min(Math.max(Math.ceil(val), min), max);
}

export function minMax(val, min, max) {
	return Math.min(Math.max(val, min), max);
}

export function seedShuffle(array, seed) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(seedRandom(seed) * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
		seed++;
	}
	return array;
}

export function seedRandom(seed) {
	const x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}
