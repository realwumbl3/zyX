// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
import zyX, { html, isMobile } from "../../";
// #endregion
export default class BackHandler {
	constructor() {
		this.tapsToExit = 3;
		this.backPresses = this.tapsToExit;

		window.history.pushState({}, "");
		window.addEventListener("popstate", () => this.handleBackButton());

		// prettier-ignore
		html`
			<div this="tap_indicator" class="tap-to-exit-confirm">
				<div class="tap-to-exit-label" pr0x="nth">Go back 3 more times to exit app.</div>
			</div>
		`
			.bind(this)

		this.onBack = [];
	}

	handleBackButton() {
		const sorted_by_weigth = this.onBack.sort((a, b) => (a.weigth > b.weigth ? 1 : -1));

		for (const cb of sorted_by_weigth) {
			if (cb.cb()) {
				window.history.pushState({}, "");
				return;
			}
		}

		if (this.backPresses < 3) window.navigator.vibrate([300]);

		zyX(this).delay("back-panic", 700, () => {
			this.backPresses = this.tapsToExit;
			window.history.pushState({}, "");
			this.tap_indicator.classList.remove("visible");
		});

		this.tap_indicator.classList.add("visible");

		const indicatorCount = Math.max(1, this.backPresses);
		this.proxy.nth = `Go back ${indicatorCount} more time${ss(indicatorCount)} to exit app.`;

		this.backPresses--;

		if (isMobile() && this.backPresses <= 0) return window.history.back();
		else if (this.backPresses < 0) return window.history.back();

		window.history.pushState({}, "");
	}

	on(cb, args) {
		this.onBack.push({ cb, weigth: 0, ...args });
	}

}
