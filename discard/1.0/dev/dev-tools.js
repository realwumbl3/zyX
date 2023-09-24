import { css, html } from "https://zyx2.wumbl3.xyz/";

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
		.bind(this).appendTo(document.body);

		this.io = new io.connect("/socket_io");
		this.io.on("connect", (e) =>
			this.io.emit("enter", {
				roomCode: `${this.pageName}-autoReload`,
			})
		);

		this.io.on("reload", this.reload);
	}
	reload = ({ domain } = {}) => {
		if (domain && domain !== pageData?.domain) return;
		if (window.auto_reload) setTimeout(() => window.location.reload(true), 300);
		this.msg.style.transform = "translateY(0%)";
	};
})();

window.devTools = devTools;
