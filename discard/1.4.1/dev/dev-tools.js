import { css, html } from "../zyx.js.js";

import { io } from "https://zyx.wumbl3.xyz/v:1.4/_/dependencies/socket.io.esm.min.js";

css`
	.auto-reload_alert {
		z-index: 99999999;
		position: absolute;
		right: 15px;
		bottom: 15px;
		width: min-content;
		height: min-content;
		overflow: hidden;
		pointer-events: none;
		font-size: 1em;
	}

	.auto-reload_alertmsg {
		display: grid;
		position: relative;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding: 4px;
		border: 1px solid white;
		border-radius: 8px;
		color: white;
		font-family: "Roboto Condensed", Arial, Helvetica, sans-serif;
		background-color: rgba(0, 0, 0, 0.8);
		transition: transform 100ms ease-in-out;
		transform: translateY(200%);
		backdrop-filter: blur(10px);
		place-items: center;
	}

	.auto-reload_alertmsg > p {
		white-space: nowrap;
	}
`;

window.auto_reload = true;

export const devTools = new (class dev_tools_class {
	constructor() {
		this.pageName = pageData.pageName;
		html`
			<div this="auto-reload_alert" class="auto-reload_alert">
				<div this="msg" class="auto-reload_alertmsg">
					<p>Changes detected, reloading page!</p>
				</div>
			</div>
		`
			.bind(this)
			.appendTo(document.body);

		this.io = io("/dev_socket_io");
		this.io.on("connect", (e) => this.io.emit("enter", { room_code: `${this.pageName}-reload` }));
		this.io.on("reload", this.reload);
	}
	reload = ({ domain, type, debug_file } = {}) => {
		if (debug_file) {
			const debug_file_meta = document.head.querySelector("meta[name=debug_file]").content;
			if (debug_file !== debug_file_meta) return;
		}
		if (domain && domain !== pageData?.domain) return;
		if (type && type.css) return this.reloadCss();
		if (window.auto_reload) return this.reloadPage();
	};

	reloadPage() {
		setTimeout(() => window.location.reload(true), 300);
		this.msg.style.transform = "translateY(0%)";
	}
	reloadCss() {
		for (const cssStylesheet of [...document.getElementsByTagName("link")]) {
			cssStylesheet.setAttribute("href", cssStylesheet.getAttribute("href") + "?" + new Date().getTime());
		}
	}
})();

window.devTools = devTools;
