import { zyX, html, css } from "https://zyx2.wumbl3.xyz/v:1.2/";
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

css`
	.Splash-Overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
		z-index: 1000000;
		background: rgba(0, 0, 0, 0.3);
		transition: opacity 500ms ease;
	}

	.Splash-Animation {
		position: absolute;
		inset: 0;
		display: none;
		place-items: center;
		overflow: hidden;
	}

	.Splash-Animation .Background {
		position: absolute;
		inset: 0;
		width: 100vw;
		height: 100vh;
		/* background-color: white; */
	}

	.Splash-Animation .LogoContainer {
		--height: min(40vw, 40vh);
		height: var(--height);
		aspect-ratio: 4/5;
		position: relative;
		display: grid;
		grid-template-rows: 1fr;
		grid-auto-columns: 1fr;
		place-items: center;
		transition: opacity 500ms ease;
		perspective: 500px;
	}

	.Splash-Animation .M {
		position: relative;
		display: grid;
		inset: 0;
		width: 100%;
		height: 100%;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr 1fr 1fr;
		place-items: center;
		animation-name: in-m;
		animation-duration: 7000ms;
		animation-timing-function: cubic-bezier(1.4, 0.7, 1, 0.6);
		animation-fill-mode: forwards;
		opacity: 0;
		transition: transform 4s ease;
	}

	@keyframes in-m {
		0% {
			opacity: 0;
			transform: scale(1) translateY(150%) translateZ(1000px) rotateX(-90deg) rotateZ(120deg);
		}

		70% {
			opacity: 1;
			transform: scale(1) translateY(-10%) translateZ(0px) rotateX(-12deg) rotateZ(0deg);
		}

		100% {
			opacity: 1;
			transform: scale(0.95) translateY(0%) rotateX(0deg) rotateZ(0deg);
		}
	}

	.Splash-Animation .Msection {
		position: relative;
		inset: 0;
		width: 100%;
		height: 100%;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}

	.Splash-Animation .Msection.a {
		background-image: url("/static/cached/M/a.png");
	}

	.Splash-Animation .Msection.b {
		background-image: url("/static/cached/M/b.png");
	}

	.Splash-Animation .Msection.c {
		background-image: url("/static/cached/M/c.png");
	}

	.Splash-Animation .Msection.a {
		opacity: 0;
		animation-name: in-a;
		animation-duration: 800ms;
		animation-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
		animation-delay: 3000ms;
		animation-fill-mode: forwards;
	}

	.Splash-Animation .Msection.b {
		opacity: 0;
		animation-name: in-b;
		animation-duration: 1500ms;
		animation-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
		animation-delay: 4000ms;
		animation-fill-mode: forwards;
	}

	.Splash-Animation .Msection.c {
		opacity: 0;
		animation-name: in-c;
		animation-duration: 1500ms;
		animation-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
		animation-delay: 2000ms;
		animation-fill-mode: forwards;
	}

	@keyframes in-a {
		from {
			transform: translate3d(30%, -100%, 0) rotateZ(5deg);
			opacity: 0;
		}

		to {
			transform: translate3d(0, 0%, 0) rotateZ(5deg);
			opacity: 1;
		}
	}

	@keyframes in-b {
		from {
			transform: translate3d(0, 50%, 0);
			opacity: 0;
		}

		to {
			transform: translate3d(0, 0%, 0);
			opacity: 1;
		}
	}

	@keyframes in-c {
		from {
			transform: translate3d(30%, 200%, 0) rotateZ(-5deg);
			opacity: 0;
		}

		to {
			transform: translate3d(0, 0%, 0) rotateZ(-5deg);
			opacity: 1;
		}
	}

	#Splash-Overlay-Dismisser {
		position: absolute;
		inset: 0;
		background-image: radial-gradient(circle at center, black, transparent);
		display: grid;
		place-items: center;
		cursor: pointer;
		pointer-events: all;
		overflow: hidden;
		user-select: none;
		perspective: 300px;
	}

	#Splash-Overlay-Dismisser .GreetOrb {
		position: absolute;
		right: -30vmin;
		bottom: -30vmin;
		aspect-ratio: 1;
		width: 60vmin;
		transition: backdrop-filter 300ms ease, transform 300ms ease, opacity 300ms ease, width 300ms ease, right 300ms ease, bottom 300ms ease;
		border-radius: 100%;
		backdrop-filter: blur(0em) brightness(100%);
		transform: scale(0.8);
	}

	#Splash-Overlay-Dismisser:hover .GreetOrb {
		backdrop-filter: blur(0.5em) brightness(400%);
		transform: scale(1.2);
	}

	#Splash-Overlay-Dismisser:active .GreetOrb {
		backdrop-filter: blur(0.5em) brightness(600%);
		transform: scale(1.1);
	}

	#Splash-Overlay-Dismisser .GreetOrb.enter {
		transform: scale(10);
		right: -60vmin;
		bottom: -60vmin;
		opacity: 0;
	}

	#Splash-Overlay-Dismisser .GreetOrb-inner {
		transform: scale(0);
		opacity: 0;
		position: absolute;
		inset: 0;
		border-radius: 100%;
		mix-blend-mode: screen;
		--opacity-dur: 400ms;
		--transform-delay: 0ms;
		--transform-incr: 80ms;
		transition: opacity var(--opacity-dur) ease, transform 600ms ease var(--transform-delay);
	}

	#Splash-Overlay-Dismisser .GreetOrb-inner:nth-child(1) {
		box-shadow: inset 0 0 3.7em 0.2em rgba(0, 255, 255, 1), 0 0 1.5em 0.2em rgba(0, 255, 255, 0.6);
	}

	#Splash-Overlay-Dismisser .GreetOrb-inner:nth-child(2) {
		--transform-delay: calc(var(--transform-incr) * 1);
		box-shadow: inset 0 0 3.7em 0.2em rgba(255, 0, 255, 1), 0 0 1.5em 0.2em rgba(255, 0, 255, 0.6);
	}

	#Splash-Overlay-Dismisser .GreetOrb-inner:nth-child(3) {
		--transform-delay: calc(var(--transform-incr) * 2);
		box-shadow: inset 0 0 3.7em 0.2em rgba(255, 255, 0, 1), 0 0 1.5em 0.2em rgba(255, 255, 0, 0.6);
	}

	#Splash-Overlay-Dismisser:hover .GreetOrb-inner {
		--opacity-dur: 200ms;
		opacity: 1;
		transform: scale(1);
	}

	#Splash-Overlay-Dismisser .Greet {
		font-family: "Roboto Condensed";
		font-size: 7vmin;
		text-align: right;
		opacity: 0;
		transition: opacity 500ms ease;
		position: absolute;
		right: 0;
		bottom: 0;
		contain: paint;
		padding: 1em;
	}

	.appName-container {
		position: relative;
	}

	#Splash-Overlay-Dismisser .Greet p.appName-base {
		font-size: 2.5em;
		line-height: 0.7em;
		text-shadow: 0px 0px 10px black;
		color: var(--color);
		transition: color 40ms ease;
		mix-blend-mode: multiply;
		transition: transform 200ms ease;
		transform: translateX(0.02em);
	}

	#Splash-Overlay-Dismisser:hover p.appName-base {
		transform: translateX(0.04em);
	}

	#Splash-Overlay-Dismisser .Greet p.appName {
		position: absolute;
		inset: 0;
		font-size: 2.5em;
		line-height: 0.7em;
		color: white;
	}

	#Splash-Overlay-Dismisser .Greet p.version {
		color: white;
		font-size: 0.5em;
		text-shadow: 0px 0px 20px black;
	}

	#Splash-Overlay-Dismisser .Greet p.dismiss {
		color: white;
		font-size: 0.4em;
		text-align: justify;
		animation: dismiss-pulse 1s ease infinite alternate;
		position: relative;
		text-shadow: 0px 0px 10px black;
		margin-left: 1em;
	}

	#Splash-Overlay-Dismisser .Greet p.dismiss:after {
		display: block;
		content: "";
	}

	@keyframes dismiss-pulse {
		from {
			opacity: 0.3;
		}
		to {
			opacity: 1;
		}
	}
`;
