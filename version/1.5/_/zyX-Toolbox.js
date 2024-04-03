import { sleep } from "./zyX-Async.js";

export function forQuery(that, query, cbfn) {
	return [...that.querySelectorAll(query)].forEach((_) => cbfn(_));
}

export function setProps(that, props) {
	Object.entries(props).forEach(([prop, val]) => that.style.setProperty(prop, val))
}

export async function placeSafely(target, container, x, y) {
	container.appendChild(target);
	target.style[y >= 0 ? "top" : "bottom"] = Math.abs(y) + "em";
	target.style[x >= 0 ? "left" : "right"] = Math.abs(x) + "em";
	await sleep(1)
	const { offsetWidth: targetWidth, offsetHeight: targetHeight } = target;
	const { offsetWidth: containerWidth, offsetHeight: containerHeight } = container;
	const { left, top, bottom, right } = target.getBoundingClientRect();
	if (!(left < 0 || top < 0 || bottom > containerHeight || right > containerWidth)) return
	bottom > containerHeight && (target.style.top = `${containerHeight - targetHeight}px`)
	right > containerWidth && (target.style.left = `${containerWidth - targetWidth}px`)
}

export function events(that, events, cb, options = {}) {
	events.split(" ").forEach((event) => that.addEventListener(event, cb, options))
}

export function timeoutLimiter({ cooldown = 60, last } = {}) {
	return () => {
		if (performance.now() - last < cooldown) return false;
		last = performance.now();
		return true;
	};
}

export function pointerEventPathContains(e, cssSelector) {
	return (e.composedPath && e.composedPath()).some(e => e.matches?.(cssSelector))
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
	if (max !== min) s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
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
};

export function ss(int) {
	return (int > 1 ? "s" : "")
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
