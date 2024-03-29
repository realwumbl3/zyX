import { html } from "./zyX-HTML.js";

import { getPlaceholderID } from "./zyX-HTML.js";
import { ZyXDomArray } from "./zyX-Reactive.js";

export function zyXAttrProcess(oven, data) {
	[...new Set(oven.querySelectorAll(zyxBindAttributespattern))].forEach((node) => {
		const attributes = [...node.attributes].filter((_) => _.name.startsWith("zyx-"));
		const zyXBinds = attributes.filter((_) => _.name in zyxBindAttributes);
		for (const attr of zyXBinds) {
			const placeholder = getPlaceholderID(attr.value);
			if (placeholder) {
				zyxBindAttributes[attr.name]({ node, data: data[placeholder] })
				node.removeAttribute(attr.name);
			} else {
				zyxBindAttributes[attr.name]({ node, data: attr.value })
			}
		}
	});
}

const zyxBindAttributes = {
	"zyx-click": ({ node, data }) => node.addEventListener("click", data.value),
	"zyx-dblclick": ({ node, data }) => node.addEventListener("dblclick", data.value),
	"zyx-mousedown": ({ node, data }) => node.addEventListener("mousedown", data.value),
	"zyx-mouseup": ({ node, data }) => node.addEventListener("mouseup", data.value),
	"zyx-mouseover": ({ node, data }) => node.addEventListener("mouseover", data.value),
	"zyx-mousemove": ({ node, data }) => node.addEventListener("mousemove", data.value),
	"zyx-mouseout": ({ node, data }) => node.addEventListener("mouseout", data.value),
	"zyx-mouseenter": ({ node, data }) => node.addEventListener("mouseenter", data.value),
	"zyx-mouseleave": ({ node, data }) => node.addEventListener("mouseleave", data.value),
	"zyx-keydown": ({ node, data }) => node.addEventListener("keydown", data.value),
	"zyx-keypress": ({ node, data }) => node.addEventListener("keypress", data.value),
	"zyx-keyup": ({ node, data }) => node.addEventListener("keyup", data.value),
	"zyx-focus": ({ node, data }) => node.addEventListener("focus", data.value),
	"zyx-blur": ({ node, data }) => node.addEventListener("blur", data.value),
	"zyx-submit": ({ node, data }) => node.addEventListener("submit", data.value),
	"zyx-load": ({ node, data }) => node.addEventListener("load", data.value),
	"zyx-error": ({ node, data }) => node.addEventListener("error", data.value),
	"zyx-input": ({ node, data }) => node.addEventListener("input", data.value),
	"zyx-change": ({ node, data }) => node.addEventListener("change", data.value),
	"zyx-scroll": ({ node, data }) => node.addEventListener("scroll", data.value),
	"zyx-array": ({ node, data }) => new ZyXDomArray({ container: node, ...data.value }),
	"zyx-pointerdown": ({ node, data }) => node.addEventListener("pointerdown", data.value),
	"zyx-pointermove": ({ node, data }) => node.addEventListener("pointermove", data.value),
	"zyx-pointerup": ({ node, data }) => node.addEventListener("pointerup", data.value),
	"zyx-pointerover": ({ node, data }) => node.addEventListener("pointerover", data.value),
	"zyx-pointerout": ({ node, data }) => node.addEventListener("pointerout", data.value),
	"zyx-pointerenter": ({ node, data }) => node.addEventListener("pointerenter", data.value),
	"zyx-pointerleave": ({ node, data }) => node.addEventListener("pointerleave", data.value),
	"zyx-pointercancel": ({ node, data }) => node.addEventListener("pointercancel", data.value),
}

zyxBindAttributes["zyx-click-pop"] = ({ node, data }) => {
	const func = (e) => {
		const elementBounds = node.getBoundingClientRect();
		const xPer = elementBounds.width * ((e.clientX - elementBounds.x) / elementBounds.width);
		const yPer = elementBounds.height * ((e.clientY - elementBounds.y) / elementBounds.height);
		html`
			<div class="zyx-expand_circle_ctn" this=ctn>
				<div class="zyx-expand_circle" this=circle></div>
			</div>
		`.const()
			.appendTo(node)
			.pass(_ => {
				console.log("touch", _);
				_.circle.style.left = xPer + "px";
				_.circle.style.top = yPer + "px";
				_.circle.addEventListener("animationend", function () {
					_.ctn.remove();
				})
			})
	}
	node.addEventListener("pointerdown", func);
}

zyxBindAttributes["zyx-uplate"] = ({ node, data }) => {
	node.templates = {};
	node.active_template = "default";
	node.add = ({ template_name, template, carry_values } = {}) => {
		if (template_name in node.templates) return node;

		node.templates[template_name] = {
			fragments: {},
			values: {},
		};

		const active_template_data = node.templates[template_name];
		const prev_active = node.templates[node.active_template];

		if (carry_values && prev_active.values) {
			Object.assign(active_template_data.values, prev_active.values);
		}
		active_template_data.template = template;
		const matches = template.match(/{([a-z0-9]*?){(.*?)}}/gm);
		if (matches)
			for (let var_template of matches) {
				const var_data = /{([a-z0-9]*?){(.*?)}}/gm.exec(var_template);
				const [fragment, var_name, default_val] = var_data;
				if (default_val) active_template_data.values[var_name] = default_val;
				active_template_data.fragments[fragment] = () => active_template_data.values[var_name];
			}
		return node;
	};
	node.switch = (template_name) => {
		node.active_template = template_name;
		node.flash();
		return node;
	};
	node.flash = (new_data) => {
		const active_template_data = node.templates[node.active_template];
		let string_template = `${active_template_data.template}`; // clone string
		if (new_data) Object.assign(active_template_data.values, new_data);
		for (const [var_tmp, getval] of Object.entries(active_template_data.fragments)) {
			string_template = string_template.replace(var_tmp, getval());
		}
		node.innerHTML = string_template;
		return node;
	};
	node
		.add({
			template_name: "default",
			template: node.innerHTML,
		})
		.flash(data);
}

const zyxBindAttributespattern = `[${Object.keys(zyxBindAttributes).join("],[")}]`