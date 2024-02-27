import { html } from "./zyx-HTML.js";

export default class zyXCssManager {
	constructor({ root } = {}) {
		html`
			<styles this=styles></styles>
		`.bind(this)
		this.l = this.loadUrl
		if (root) {
			this.appendTo(root)
		}
	}

	loadUrl(url) {
		html`
			<link rel="stylesheet" type="text/css" href="${url}">
		`.const()
			.appendTo(this.styles)
	}

	str(strcss) {
		html`
			<style this=c></style>
		`.const()
			.appendTo(this.styles)
			.ns(_ => {
				_.c.innerHTML = strcss
			})
	}

	cloneType(root) {
		return new zyXCssManager({ root })
	}

}

export const zyxcss = new zyXCssManager({
	root: document !== "undefined" && document.head
});

export const css = (raw, ..._) => zyxcss.str(raw);

// window.css = css;
// window.zyxcss = zyxcss



// const zyxcss = (function () {
// 	// if (typeof document === 'undefined') return;
// 	let styles = document.querySelector("styles");
// 	const loaded = [];
// 	if (!styles) {
// 		styles = document.createElement("styles");
// 		document.body.after(styles);
// 	}
// 	const style = doMe("style")({
// 		appendTo: styles,
// 		attr: { zyxcss: "" },
// 	});
// 	const node = (e, keyname) => {
// 		if (keyname) {
// 			if (loaded.includes(keyname)) return;
// 			loaded.push(keyname);
// 			e.setAttribute("template-name", keyname);
// 		}
// 		styles.append(e);
// 	};
// 	const str = (strcss) => {
// 		style.innerHTML += strcss;
// 	};
// 	const path = (cssPath) => {
// 		doMe("link")({
// 			attr: {
// 				rel: "stylesheet",
// 				type: "text/css",
// 				href: cssPath,
// 			},
// 			appendTo: styles,
// 			not8: true,
// 		});
// 	};
// 	const self = {
// 		styles,
// 		str,
// 		style,
// 		path,
// 		node,
// 	};
// 	return self;
// })();
