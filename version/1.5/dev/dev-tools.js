import { io } from "../_/Cdn/socket.io.esm.min.js";

import { html, css } from "https://zyx.wumbl3.xyz/v:1.5/";

css`
.zyXServerDebugAlert {
	z-index: 99999999;
	position: absolute;
	right: 15px;
	bottom: 15px;
	width: min-content;
	height: min-content;
	overflow: hidden;
	pointer-events: none;
	font-size: 13px;
	&>.alertmsg {
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
		> p {
			white-space: nowrap;
		}
	}
}		
`;

export const devTools = new (class dev_tools_class {
	constructor() {
		console.log("[ zyX() Dev Tools loaded. ]");
		this.page_name = pageData.page_name;
		this.io = io("/dev_socket_io");
		this.io.on("connect", (e) => this.io.emit("enter", { room_code: `${this.page_name}-reload` }));
		this.io.on("reload", this.reload);
	}
	reload = ({ domain, debug_file } = {}) => {
		console.log("[ reload signal received. ]")
		if (debug_file) {
			const debug_file_meta = document.head.querySelector("meta[name=debug_file]").content;
			if (debug_file !== debug_file_meta) return;
		}
		if (domain && domain !== pageData?.domain) return;
		if (window.auto_reload) return this.reloadPage();
	};

	reloadPage() {
		html`
			<div this="auto-reload_alert" class="auto-reload_alert">
				<div this="msg" class="auto-reload_alertmsg">
					<p>Changes detected, reloading page!</p>
				</div>
			</div>
		`
			.bind(this)
			.appendTo(document.body);
		setTimeout(() => this.msg.style.transform = "translateY(0)", 10);
		setTimeout(() => window.location.reload(true), 300);
	}
})();

window.auto_reload = true;

window.reload = {
	off: () => (window.auto_reload = false),
	on: () => (window.auto_reload = true),
};
