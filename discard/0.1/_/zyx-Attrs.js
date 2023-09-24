import { zyX, html, zyxcss } from "https://zyx.wumbl3.xyz/v:0.1/";

zyxcss.path("https://zyx.wumbl3.xyz/v:0.1/zyx-Attrs.css");

export const zyxAttrs = {};

const POPUP_PARAMS = [
	// 'location=no',
	"height=1300",
	"width=900",
	"top=10",
	"left=10",
	// 'scrollbars=no',
	// 'status=no'
].join(",");

export async function zyxImgJump(target) {
	const target_bounding_rect = target.getBoundingClientRect();
	const new_img_popup = zyX("img").element({
		cls: "zyx-open-popupimg",
		attr: { src: target.src },
		style: {
			left: target_bounding_rect.x + "px",
			top: target_bounding_rect.y + "px",
			width: target_bounding_rect.width + "px",
			height: target_bounding_rect.height + "px",
		},
		appendTo: document.body,
	});
	await zyX(new_img_popup).delay("popup-img", 1, () => {
		Object.assign(new_img_popup.style, {
			transform: "scale(10)",
			// filter: 'blur(1px)',
			opacity: 0,
		});
	});
	await zyX(new_img_popup).delay("popup-img", 250, () => {
		console.log("remove?");
		new_img_popup.remove();
	});
}

// export class t8_tooltip {
// 	constructor() {
// 		console.log("init tooltips");
// 		this.tooltips = [];
// 		this.button_offset = [5, 10];
// 		this.mouse_pos = [0, 0];
// 		this.ttcount = 3;
// 		this.indx = 0;
// 		this.iter_tooltip;
// 		if (!document.querySelector("ph[zyx-tooltips]")) {
// 			return console.warn("no tooltip container");
// 		}
// 		this.t8tooltipContainer = zyX("div").element({
// 			cls: "t8tooltipContainer",
// 			place: "zyx-tooltips",
// 		});
// 		for (let i = 0; i < this.ttcount; i++) {
// 			const new_tooltip = this.create_tooltip(i);
// 			console.log("new_tooltip", new_tooltip);
// 			this.tooltips.push(new_tooltip);
// 			this.t8tooltipContainer.append(new_tooltip.tooltip);
// 		}
// 		document.addEventListener("mousemove", (e) => this.mousemove(e), { passive: true });
// 	}
// 	create_tooltip(i) {
// 		return zyX().zyx({
// 			htme: html` <div this="tooltip" class="t8_tooltip" i="${i}">
// 				<a this="tooltip_text"></a>
// 			</div>`,
// 		});
// 	}
// 	iter() {
// 		this.iter_tooltip = this.tooltips[(this.indx = this.indx >= this.ttcount - 1 ? 0 : this.indx + 1)];
// 	}
// 	enter = (e) => {
// 		if (e.pointerType !== "mouse") return false;
// 		this.iter();
// 		const selected_tip = this.iter_tooltip.tooltip;
// 		this.iter_tooltip.tooltip_text.innerText = e.target.getAttribute("zyx-tooltip");
// 		selected_tip.classList.add("visible");
// 		zyX(selected_tip).setProps({
// 			"--width": selected_tip.clientWidth + "px",
// 			"--height": selected_tip.clientHeight + "px",
// 		});
// 		this.set_pos();
// 	};
// 	leave(e) {
// 		this.iter_tooltip.tooltip.classList.remove("visible");
// 	}
// 	mousemove(e) {
// 		this.mouse_pos = [e.clientX, e.clientY];
// 		this.set_pos();
// 	}
// 	set_pos = () => {
// 		if (!this?.iter_tooltip) return false;
// 		zyX(this.iter_tooltip.tooltip).setProps({
// 			"--left": (this.mouse_pos[0] / window.innerWidth) * 100 + "%",
// 			"--top": (this.mouse_pos[1] / window.innerHeight) * 100 + "%",
// 		});
// 	};
// 	apply_t8 = (e, arg) => {
// 		e.addEventListener("pointerleave", this.leave.bind(this), { passive: true });
// 		e.addEventListener("pointerenter", this.enter.bind(this), { passive: true });
// 	};
// }

zyxAttrs["zyx-open"] = (element, arg) => {
	let open_fn, drag_fn, url_to_open;
	if (arg) {
		url_to_open = arg;
		open_fn = (e) => {
			e.preventDefault();
			window.open(url_to_open, "_blank", POPUP_PARAMS);
		};
		drag_fn = (event) => event.dataTransfer.setData("text/plain", url_to_open);
		element.setAttribute("href", url_to_open);
	} else {
		open_fn = async (e) => {
			e.preventDefault();
			if (e.target.getAttribute("src")) {
				await t8_imgjump(e.target);
			}
			window.open(element.getAttribute("href"), "_blank", POPUP_PARAMS);
		};
		drag_fn = (event) => event.dataTransfer.setData("text/plain", element.getAttribute("href"));
	}
	element.addEventListener("dragstart", drag_fn);
	element.setAttribute("draggable", true);
	element.addEventListener("click", open_fn);
	element.classList.add("t8open");
};

zyxAttrs["zyx-uplate"] = (element, arg) => {
	element.templates = {};
	element.active_template = "default";

	element.add = ({ template_name, template, carry_values } = {}) => {
		const prev_active = element.templates[element.active_template];
		if (template_name in element.templates) {
			return element;
		} else {
			element.templates[template_name] = {
				fragments: {},
				values: {},
			};
		}
		const active_template_data = element.templates[template_name];
		if (carry_values && prev_active.values) {
			Object.assign(active_template_data.values, prev_active.values);
		}
		active_template_data.template = template;
		const matches = template.match(/{([a-z0-9]*?){(.*?)}}/gm);
		if (matches)
			for (let var_template of matches) {
				const var_data = /{([a-z0-9]*?){(.*?)}}/gm.exec(var_template);
				const template_fragment = var_data[0],
					var_name = var_data[1],
					default_val = var_data[2];
				if (default_val) active_template_data.values[var_name] = default_val;
				active_template_data.fragments[template_fragment] = () => active_template_data.values[var_name];
			}
		return element;
	};

	element.switch = (template_name) => {
		element.active_template = template_name;
		element.flash();
		return element;
	};

	element.flash = (new_data) => {
		const active_template_data = element.templates[element.active_template];
		let string_template = `${active_template_data.template}`; // clone string
		if (new_data) {
			Object.assign(active_template_data.values, new_data);
		}
		for (let [var_tmp, getval] of Object.entries(active_template_data.fragments)) {
			string_template = string_template.replace(var_tmp, getval());
		}
		element.innerHTML = string_template;
		return element;
	};

	element
		.add({
			template_name: "default",
			template: element.innerHTML,
		})
		.flash(arg);
};

zyxAttrs["zyx-click-pop"] = (element, arg) => {
	const new_circle = (e) => {
		const new_circle = zyX("div").element({
			cls: "zyx-expand_circle",
			evt: {
				animationend: function () {
					new_circle_ctn.remove();
				},
			},
		});
		const new_circle_ctn = zyX("div").element({
			cls: "zyx-expand_circle_ctn",
			append: [new_circle],
		});
		new_circle.style.left = e.layerX + "px";
		new_circle.style.top = e.layerY + "px";
		element.append(new_circle_ctn);
	};
	if (arg && arg.on) for (let evt of arg.on.split(" ")) element.addEventListener(evt, new_circle);
	else element.addEventListener("pointerdown", new_circle);
};

export function applyZyxAttrs(that, element) {
	try {
		for (let [preset, func] of Object.entries(zyxAttrs)) {
			for (let e of scan(element).preset(preset)) {
				const arg = e.getAttribute(preset);
				parseZyxTools(func, e, arg, that);
			}
		}
	} catch (e) {
		return false;
	}
}

export function parseZyxTools(func, element, arg, that) {
	try {
		arg = JSON.parse(arg);
	} catch (e) {}
	if (typeof func?.apply_t8 === "function") {
		func.apply_t8(element, arg, that);
	} else func(element, arg, that);
}

function scan(element) {
	return {
		preset: function (preset) {
			return [...element.querySelectorAll(`[${preset}]`)];
		},
	};
}
