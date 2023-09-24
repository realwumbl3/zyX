`-This is all you need in your HTML. __________________
<head><script type="module" src="./index.js"></script></head>

-import the zyX app initializer with __________________
import ZyxApp from "https://zyx.wumbl3.xyz/new";     
import { zyX, html, css } from "https://zyx.wumbl3.xyz";
new ZyxApp({
	appName: "HeckYes!",
});

‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
Make sure you visit wxyz.wumbl3.xyz to know more! `;
const html = (raw, ..._) => String.raw({ raw }, ..._);
document.open("text/html");
document.write(html`
	<!DOCTYPE html>
	<head>
		<title></title>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	</head>
	<style name="base_styles">
		body {
			background-color: black;
		}
		placeholder,
		templates,
		styles {
			display: none;
		}
		.noTapHighlight {
			-webkit-tap-highlight-color: transparent;
		}
		* {
			box-sizing: border-box;
			padding: 0;
			margin: 0;
			scrollbar-width: none;
		}
		*::-webkit-scrollbar {
			display: none;
		}
	</style>
	<body></body>
	<styles></styles>
	<html lang="en"></html>
`);
document.close();

function makeFavicon(head) {
	const newFavicon = document.createElement("link");
	newFavicon.setAttribute("rel", "shortcut icon");
	head.appendChild(newFavicon);
	return {
		favicon: newFavicon,
		set: (url) => newFavicon.setAttribute("href", url),
	};
}

export default class zyxApp {
	constructor({ appName = "xyZ.js app.", favicon = "https://zyx.wumbl3.xyz/files/favicon/favicon.ico" } = {}) {
		this.head = document.querySelector("head");
		this.favicon = makeFavicon(this.head);

		document.title = appName;
		this.favicon.set(favicon);
	}

	append = (appContainer) => document.body.append(appContainer);
}
