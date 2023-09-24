import { css } from "./zyx-CSS.js";
import { doMe } from "./zyx-DoMe.js";

css`
	.zyx-open-popupimg {
		position: absolute;
		border-radius: 50%;
		z-index: 999999;
		transition: transform 200ms ease, opacity 300ms ease;
		pointer-events: none;
	}

	.zyx-expand_circle_ctn {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		border-radius: inherit;
	}

	.zyx-expand_circle {
		position: absolute;
		--maxOpacity: 0.8;
		background-color: white;
		border-radius: 100%;
		animation: expand_circle 600ms ease-out forwards;
		aspect-ratio: 1;
		width: 100%;
		contain: content;
	}

	@keyframes expand_circle {
		0% {
			transform: translate(-50%, -50%) scale(0);
			opacity: 0;
		}

		25% {
			transform: translate(-50%, -50%) scale(1);
			opacity: var(--maxOpacity);
		}

		100% {
			transform: translate(-50%, -50%) scale(2);
			opacity: 0;
		}
	}
`;

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
	const new_img_popup = doMe("img")({
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

zyxAttrs.open = (element, arg) => {
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

zyxAttrs.uplate = (element, arg) => {
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

zyxAttrs["click-pop"] = (element, arg) => {
	const new_circle = (e) => {
		const elementBounds = element.getBoundingClientRect();
		const xPer = elementBounds.width * ((e.clientX - elementBounds.x) / elementBounds.width);
		const yPer = elementBounds.height * ((e.clientY - elementBounds.y) / elementBounds.height);
		const new_circle = doMe("div")({
			cls: "zyx-expand_circle",
			evt: {
				animationend: function () {
					new_circle_ctn.remove();
				},
			},
		});
		const new_circle_ctn = doMe("div")({
			cls: "zyx-expand_circle_ctn",
			append: [new_circle],
		});
		new_circle.style.left = xPer + "px";
		new_circle.style.top = yPer + "px";
		element.append(new_circle_ctn);
	};
	if (arg && arg.on) for (let evt of arg.on.split(" ")) element.addEventListener(evt, new_circle);
	else element.addEventListener("pointerdown", new_circle);
};

export function applyZyxAttrs(that, element) {
	try {
		for (const [preset, func] of Object.entries(zyxAttrs)) {
			for (const e of [...element.querySelectorAll(`[zyx-${preset}]`)]) {
				const arg = e.getAttribute(`zyx-${preset}`);
				try {
					arg = JSON.parse(arg);
				} catch (err) {}
				func(e, arg, that);
			}
		}
	} catch (e) {
		return false;
	}
}
