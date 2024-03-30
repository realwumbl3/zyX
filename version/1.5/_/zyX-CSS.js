import { html } from "./zyX-HTML.js";

export default class ZyXCssManager {
	constructor({ root } = {}) {
		html`
			<styles this=styles></styles>
		`.bind(this)
		if (root) this.appendTo(root)
	}

	loadUrl(url) {
		return new Promise((res, rej) => {
			html`<link rel="stylesheet" type="text/css" this=link href="${url}">`
				.appendTo(this.styles)
				.pass(({ link } = {}) => {
					link.onload = () => res({ link, cleanuUp: () => link.remove() })
					link.onerror = rej
				})
		})
	}

	async str(raw, ..._) {
		const strcss = String.raw(raw, ..._)
		if (String(strcss).startsWith("url(")) {
			const urls = strcss.split("url(").slice(1).map((url) => url.split(")")[0])
			for (const url of urls) await this.loadUrl(url)
			return
		}
		return html`
			<style this=style></style>
		`
			.appendTo(this.styles)
			.pass(({ style } = {}) => {
				style.innerHTML = strcss
			})
	}

	cloneType(root) {
		return new ZyXCssManager({ root })
	}

}

export const zyxcss = new ZyXCssManager({
	root: typeof document !== "undefined" && document.head
});

export const css = (raw, ..._) => zyxcss.str(raw, ..._)