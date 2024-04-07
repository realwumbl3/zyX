import { html } from "./zyx-HTML.js";


export const ZYX_ATTRS = {};

export const ZYXATTR = {
	queryString: '',
	add: function (name, func) {
		ZYX_ATTRS[name] = func;
		this.queryString = Object.keys(ZYX_ATTRS).map((e) => `[zyx-${e}]`).join(",");
	},
	query: function (element) {
		return element.querySelectorAll(this.queryString);
	}
}

export function applyZyxAttrs(that, content) {
	try {
		// const zyxattr_query = ZYXATTR.query(content);
		// console.log('zyxattr_query', zyxattr_query)
		for (const [preset, func] of Object.entries(ZYX_ATTRS)) {
			for (const e of [...content.querySelectorAll(`[zyx-${preset}]`)]) {
				const arg = e.getAttribute(`zyx-${preset}`);
				try {
					arg = JSON.parse(arg);
				} catch (err) { }
				// console.log(preset, arg);
				func(e, arg, that);
			}
		}
	} catch (e) {
		console.error(e);

		return false;
	}
}

const POPUP_PARAMS = [
	// 'location=no',
	"height=1300",
	"width=900",
	"top=10",
	"left=10",
	// 'scrollbars=no',
	// 'status=no'
].join(",");


ZYXATTR.add("clickpop", (element, arg) => {
	const func = (e) => {
		const elementBounds = element.getBoundingClientRect();
		const xPer = elementBounds.width * ((e.clientX - elementBounds.x) / elementBounds.width);
		const yPer = elementBounds.height * ((e.clientY - elementBounds.y) / elementBounds.height);
		html`
			<div class="zyx-expand_circle_ctn" this=ctn>
				<div class="zyx-expand_circle" this=circle></div>
			</div>
		`.const()
			.appendTo(element)
			.ns(_ => {
				_.circle.style.left = xPer + "px";
				_.circle.style.top = yPer + "px";
				_.circle.addEventListener("animationend", function () {
					_.ctn.remove();
				})
			})

	}
	element.addEventListener("pointerdown", func);
});

ZYXATTR.add("uplate", (element, arg) => {
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
})
