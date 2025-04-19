import { sleep } from "./zyX-Async.js";

/**
 * DOM Manipulation Utilities
 */

/**
 * Applies a callback function to all elements matching a query selector
 * @param {Element} that - The parent element to search within
 * @param {string} query - The CSS query selector
 * @param {Function} cbfn - The callback function to apply to each matching element
 */
export function forQuery(that, query, cbfn) {
	return [...that.querySelectorAll(query)].forEach(cbfn);
}

/**
 * Sets multiple CSS properties on an element
 * @param {Element} that - The target element
 * @param {Object<string, string>} props - Object containing CSS property-value pairs
 */
export function setProps(that, props) {
	Object.entries(props).forEach(([prop, val]) => that.style.setProperty(prop, val));
}

/**
 * Places an element within a container while ensuring it stays within bounds
 * @param {Element} target - The element to position
 * @param {Element} container - The container element
 * @param {number} x - X coordinate (negative values position from right)
 * @param {number} y - Y coordinate (negative values position from bottom)
 * @param {string} unit - CSS unit to use (default: "em")
 */
export async function placeSafely(target, container, x, y, unit = "em") {
	container.appendChild(target);
	target.style[y >= 0 ? "top" : "bottom"] = `${Math.abs(y)}${unit}`;
	target.style[x >= 0 ? "left" : "right"] = `${Math.abs(x)}${unit}`;
	await sleep(1);
	const { offsetWidth: targetWidth, offsetHeight: targetHeight } = target;
	const { offsetWidth: containerWidth, offsetHeight: containerHeight } = container;
	const { left, top, bottom, right } = target.getBoundingClientRect();
	if (!(left < 0 || top < 0 || bottom > containerHeight || right > containerWidth))
		return;
	bottom > containerHeight && (target.style.top = `${containerHeight - targetHeight}px`);
	right > containerWidth && (target.style.left = `${containerWidth - targetWidth}px`);
}


/**
 * Checks if an element is in the event path
 * @param {Event} e - The event object
 * @param {Element} elem - The element to check for
 * @returns {boolean} True if the element is in the event path
 */
export function pointerEventPathContains(e, elem) {
	return e.composedPath?.().some(element => element === elem) ?? false;
}

/**
 * Finds the first element in the event path matching a CSS selector
 * @param {Event} e - The event object
 * @param {string} cssSelector - The CSS selector to match
 * @returns {Element|null} The matching element or null if not found
 */
export function pointerEventPathContainsMatching(e, cssSelector) {
	return e.composedPath?.().find(element => element.matches?.(cssSelector)) ?? null;
}

/**
 * Color Manipulation Utilities
 */

/**
 * Converts HSL values to CSS-compatible format
 * @param {Object} params - HSL parameters
 * @param {number} [params.h=0] - Hue value
 * @param {number} [params.s=0] - Saturation value
 * @param {number} [params.l=0] - Lightness value
 * @returns {Object} Object with CSS-compatible HSL values
 */
export function hslCssKeys({ h = 0, s = 0, l = 0 } = {}) {
	return {
		h: `${h}deg`,
		s: `${s}%`,
		l: `${l}%`
	};
}

/**
 * Converts a hex color to RGB values (0-1 range)
 * @param {string} hex - Hex color code (with or without #)
 * @returns {Object} RGB values
 */
export function hexToRGB(hex) {
	const cleanHex = hex.replace("#", "");
	return {
		r: parseInt(cleanHex.substring(0, 2), 16) / 255,
		g: parseInt(cleanHex.substring(2, 4), 16) / 255,
		b: parseInt(cleanHex.substring(4, 6), 16) / 255
	};
}

/**
 * Converts a hex color to HSL values
 * @param {string} hex - Hex color code (with or without #)
 * @returns {Object} HSL values
 */
export function hexToHSL(hex) {
	const { r, g, b } = hexToRGB(hex);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);

	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100)
	};
}

/**
 * Returns 's' for plural forms
 * @param {number} int - The number to check
 * @returns {string} 's' if the number is greater than 1, empty string otherwise
 */
export function sS(int) {
	return int > 1 ? "s" : "";
}

/**
 * Random Number Utilities
 */

/**
 * Shuffles an array using a seeded random number generator
 * @param {Array} array - The array to shuffle
 * @param {number} seed - The seed value for the random number generator
 * @returns {Array} The shuffled array
 */
export function seedShuffle(array, seed) {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(seedRandom(seed) * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		seed++;
	}
	return shuffled;
}

/**
 * Generates a seeded random number between 0 and 1
 * @param {number} seed - The seed value
 * @returns {number} A random number between 0 and 1
 */
export function seedRandom(seed) {
	const x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}
