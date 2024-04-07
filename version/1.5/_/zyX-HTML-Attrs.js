import { getPlaceholderID } from "./html.js";

import { ZyXDomArray } from "./zyX-Reactive.js";
import * as Pkg1 from "./zyX-Attrs/Pkg1.js";

const BrowserDefaultEvents = [
	"click",
	"dblclick",
	"mousedown",
	"mouseup",
	"mouseover",
	"mousemove",
	"mouseout",
	"mouseenter",
	"mouseleave",
	"keydown",
	"keypress",
	"keyup",
	"focus",
	"blur",
	"submit",
	"load",
	"error",
	"input",
	"change",
	"scroll",
	"pointerdown",
	"pointermove",
	"pointerup",
	"pointerover",
	"pointerout",
	"pointerenter",
	"pointerleave",
	"pointercancel",
	"pointerlockchange",
	"pointerlockerror",
	"gotpointercapture",
	"lostpointercapture",
	"drag",
	"dragstart",
	"dragend",
	"dragenter",
	"dragover",
	"dragleave",
	"dragexit",
	"dragdrop",
	"touchstart",
	"touchend",
	"touchmove",
	"touchcancel",
	"touchenter",
	"touchleave",
	"touchforcechange",
]

const pgk1Remap = Object.fromEntries(Object.entries(Pkg1).map(([funcname, func]) => [`zyx-${funcname.toLowerCase()}`, func]));
const browserDefaultEvents = Object.fromEntries(BrowserDefaultEvents.map((_) => ([`zyx-${_}`, ({ node, data }) => node.addEventListener([_], data.value)])));

const zyxBindAttributes = {
	"zyx-array": ({ node, data }) => new ZyXDomArray({ container: node, ...data.value }),
	...pgk1Remap,
	...browserDefaultEvents,
}

const zyxBindAttributespattern = `[${Object.keys(zyxBindAttributes).join("],[")}]`

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
