import { html } from "../zyX-HTML.js";
import { zyXFetchCSS } from "../zyX-Fetch.js";


export function ClickPop({ node }) {
    function func(e) {
        const elementBounds = node.getBoundingClientRect();
        const xPer = elementBounds.width * ((e.clientX - elementBounds.x) / elementBounds.width);
        const yPer = elementBounds.height * ((e.clientY - elementBounds.y) / elementBounds.height);
        html`
			<div class="zyx-expand_circle_ctn" this=ctn>
				<div class="zyx-expand_circle" this=circle style="left:${xPer}px;top:${yPer}px"></div>
			</div>
		`.const()
            .appendTo(node)
            .pass(zyx => zyx.circle.addEventListener("animationend", _ => zyx.ctn.remove()))
    }
    node.addEventListener("pointerdown", func);
}

export function Uplate({ node, data }) {
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
            for (const var_template of matches) {
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
        for (const [target, get_val] of Object.entries(active_template_data.fragments)) {
            string_template = string_template.replace(target, get_val());
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

export function ShadowRoot({ node }) {
    node.shadow = node.attachShadow({ mode: "open" });
    node.shadow.append(...node.childNodes);
    node.loadCSS = async (p) => {
        if (Array.isArray(p)) {
            for (const css of p) await node.loadCSS(css);
            return
        }
        const { link } = await zyXFetchCSS(p);
        node.shadow.append(link);
    }
    node.removeAttribute("zyx-shadowroot");
}