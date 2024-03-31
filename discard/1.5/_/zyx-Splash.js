import zyX, { zyxcss, html } from "../";

// <ph splash-intro></ph>
zyxcss.l("https://zyxx.wumbl3.xyz/v:1.5/_/Splash/zyX-Splash.css");

export default class Splash {
	constructor({ version = "alpha 0.1", title = document.title } = {}) {
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
							<p this="logo a" class="appName-base">${title}</p>
							<p this="logo b" class="appName">${title}</p>
						</div>
						<p class="version">${version}</p>
					</div>
				</div>
				<p class="DismissHint">${pageData.mobile ? "tap" : "click anywhere"} to dismiss.</p>
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
			.appendTo(document.body);

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
			.then((_) => (this.main.style.opacity = 1), 100)
			.then((_) => (this.greet.style.opacity = 1), 1500);

	}

	playSplash() {
		this.splash.style.display = "grid";
	}
}

