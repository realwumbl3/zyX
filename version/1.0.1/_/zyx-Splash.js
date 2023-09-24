import { zyX, html, css } from "https://zyx.wumbl3.xyz/v:1.2/";
import { zyxcss } from "./zyx-CSS.js";
// <ph splash-intro></ph>
export default class Splash {
	constructor() {
		html`
			<div this="main" class="Splash-Overlay noTapHighlight">
				<div id="Splash-Overlay-Dismisser" this="autoplay_tap">
					<div this="orb" class="GreetOrb">
						<div class="GreetOrb-inner"></div>
						<div class="GreetOrb-inner"></div>
						<div class="GreetOrb-inner"></div>
					</div>
					<div class="Greet" this="greet">
						<div class="appName-container">
							<p this="logo a" class="appName-base">artDek</p>
							<p this="logo b" class="appName">artDek</p>
						</div>
						<p class="version">Beta v2.0</p>
						<p class="dismiss">${pageData.mobile ? "tap" : "click anywhere"} to dismiss.</p>
					</div>
				</div>
				<div this="splash" class="Splash-Animation">
					<div class="Background"></div>
					<div this="M_container" class="LogoContainer">
						<div this="M" class="M">
							<div class="Msection a"></div>
							<div class="Msection b"></div>
							<div class="Msection c"></div>
						</div>
					</div>
				</div>
			</div>
		`
			.bind(this)
			.place("splash-intro");

		this.main.addEventListener("click", () => {
			this.orb.classList.add("enter");
			this.autoplay_tap.style.pointerEvents = "none";
			this.main.style.pointerEvents = "none";
			zyX(this)
				.delayChain("enter")
				.then((_) => {
					this.main.style.opacity = 0;
				}, 300)
				.then((_) => {
					this.main.remove();
				}, 500);
		});

		zyX(this)
			.delayChain("greet-fadein")
			.then((_) => {
				this.greet.style.opacity = 1;
			}, 1500);
	}

	playSplash() {
		this.splash.style.display = "grid";
	}
}

zyxcss.path("https://zyx.wumbl3.xyz/v:1.2/_/Splash/zyX-Splash.css");
