import ZyxApp from "https://zyx.wumbl3.xyz/new";
import { zyX, html, css } from "https://zyx.wumbl3.xyz";

new ZyxApp({
	appName: "HeckYes!",
});

css`
	@import url("https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400&display=swap");
	body {
		background-color: cyan;
		height: 100vh;
		color: white;
		font-size: 70vmin;
		font-family: "Roboto Condensed";
		user-select: none;
	}
	.logoContainer {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
	}
`;

// ####################################################################################################

css`
	.zyx {
		aspect-ratio: 1.7/1;
		position: relative;
		display: flex;
	}

	.zyx a {
		position: relative;
		line-height: 38%;
		transition: text-shadow 140ms ease, transform 140ms ease;
	}

	.zyx a:hover {
		transform: scale(1.2);
		text-shadow: 0 0 0.2em white;
	}
`;

zyX().zyx({
	markup: html`
		<div class="logoContainer">
			<div class="zyx">
				<a>z</a>
				<a>y</a>
				<a>x</a>
			</div>
		</div>
	`,
	appendTo: document.body,
});
