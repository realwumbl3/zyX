/**
 * Back button handling module
 * @module ZyXInput/Back
 */

// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { html, isMobile } from "../../";
// #endregion

/**
 * Handles back button navigation with support for mobile and desktop
 * @class
 */
export default class BackHandler {
	/**
	 * @param {ZyXInput} input_binder - The input binder instance
	 */
	constructor(input_binder) {
		this.input_binder = input_binder;
		this.tapsToExit = 3;
		this.backPresses = this.tapsToExit;
		this.onBack = [];

		// Initialize history state
		window.history.pushState({}, "");
		window.addEventListener("popstate", () => this.handleBackButton());

		// Create tap indicator UI
		this._createTapIndicator();
	}

	/**
	 * Create the tap indicator UI element
	 * @private
	 */
	_createTapIndicator() {
		html`
			<div this="tap_indicator" class="tap-to-exit-confirm">
				<div class="tap-to-exit-label" pr0x="nth">
					Go back ${this.tapsToExit} more times to exit app.
				</div>
			</div>
		`.bind(this);
	}

	/**
	 * Handle back button press events
	 * @private
	 */
	handleBackButton() {
		// Sort and execute callbacks by weight
		const sortedByWeight = this.onBack.sort((a, b) => (a.weight > b.weight ? 1 : -1));

		for (const bind of sortedByWeight) {
			const callback = bind.cb.deref();
			if (!callback) {
				this.onBack.splice(this.onBack.indexOf(bind), 1);
				continue;
			}
			if (callback()) {
				window.history.pushState({}, "");
				return;
			}
		}

		// Handle mobile vibration feedback
		if (this.backPresses < 3) {
			window.navigator.vibrate?.(300);
		}

		// Reset back presses after delay
		zyX(this).delay("back-panic", 700, () => {
			this.backPresses = this.tapsToExit;
			window.history.pushState({}, "");
			this.tap_indicator?.classList.remove("visible");
		});

		// Update UI
		this.tap_indicator?.classList.add("visible");
		const indicatorCount = Math.max(1, this.backPresses);
		this.proxy.nth = `Go back ${indicatorCount} more time${pluralize(indicatorCount)} to exit app.`;

		this.backPresses--;

		// Handle navigation
		if (this.backPresses <= 0) {
			if (isMobile()) {
				return window.history.back();
			}
			return window.history.back();
		}

		window.history.pushState({}, "");
	}

	/**
	 * Register a callback for back button events
	 * @param {Function} callback - The callback function
	 * @param {Object} options - Callback options
	 * @param {number} [options.weight=0] - Callback priority weight
	 */
	on(callback, options = {}) {
		if (typeof callback !== 'function') {
			console.warn('[ZyXInput] Invalid callback for BackHandler.on()');
			return;
		}
		this.onBack.push({
			cb: new WeakRef(callback),
			weight: 0,
			...options
		});
	}
}

/**
 * Pluralize a word based on count
 * @private
 * @param {number} count - The count to check
 * @returns {string} The plural suffix
 */
function pluralize(count) {
	return count > 1 ? "s" : "";
}
