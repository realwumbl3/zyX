import { html } from "./zyX-HTML.js";

import { zyXFetchCSS } from "./zyX-Fetch.js";

export default class ZyXCssManager {
	constructor({ root } = {}) {
		html`
			<styles this=styles></styles>
		`.bind(this)
		if (root) this.appendTo(root)
	}

	async loadUrl(url) {
		const { link, remove } = await zyXFetchCSS(url)
		this.styles.appendChild(link)
		return { link, remove }
	}

	async str(raw, ..._) {
		const strcss = String.raw(raw, ..._)
		if (String(strcss).startsWith("url(")) {
			const urls = strcss.split("url(").slice(1).map((url) => url.split(")")[0])
			for (const url of urls) await this.loadUrl(url)
			return
		}
		return html`
			<style this=style>${strcss}</style>
		`.appendTo(this.styles)
	}

	cloneType(root) {
		return new ZyXCssManager({ root })
	}

}

export const zyxcss = new ZyXCssManager({
	root: typeof document !== "undefined" && document.head
});

export const css = (raw, ..._) => zyxcss.str(raw, ..._)