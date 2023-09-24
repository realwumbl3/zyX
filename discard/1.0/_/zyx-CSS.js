const zyxcss = (function () {
	let styles = document.querySelector("styles");
	const loaded = [];
	if (!styles) {
		styles = document.createElement("styles");
		document.body.after(styles);
	}
	const style = doMe("style")({
		appendTo: styles,
		attr: { zyxcss: "" },
	});
	const node = (e, keyname) => {
		if (keyname) {
			if (loaded.includes(keyname)) return;
			loaded.push(keyname);
			e.setAttribute("template-name", keyname);
		}
		styles.append(e);
	};
	const str = (strcss) => {
		style.innerHTML += strcss;
	};
	const path = (cssPath) => {
		doMe("link")({
			attr: {
				rel: "stylesheet",
				type: "text/css",
				href: cssPath,
			},
			appendTo: styles,
			not8: true,
		});
	};
	const self = {
		styles,
		str,
		style,
		path,
		node,
	};
	return self;
})();

const css = (raw, ..._) => zyxcss.str(raw);

import { doMe } from "https://zyx2.wumbl3.xyz/";

export { zyxcss, css };
