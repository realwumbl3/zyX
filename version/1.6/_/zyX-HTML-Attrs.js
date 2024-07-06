import { getPlaceholderID, placeholdTag } from "./html.js";

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
	"contextmenu",
]

const pgk1Remap = Object.fromEntries(Object.entries(Pkg1).map(([funcname, func]) => [`zyx-${funcname.toLowerCase()}`, func]));

const browserDefaultEvents = Object.fromEntries(BrowserDefaultEvents.map((_) => ([`zyx-${_}`,
({ node, data }) => {
	node.addEventListener([_], data);
}])));

const zyxBindAttributes = {
	"zyx-array": ({ node, data }) => new ZyXDomArray({ container: node, ...data }),
	"zyx-slots": ({ node, data }) => new ZyXSlots({ container: node, ...data }),
	"zyx-object-receiver": ({ node, data }) => console.log("zyx-object-receiver", { node, data }),
	...pgk1Remap,
	...browserDefaultEvents,
}

const zyxBindAttributespattern = `[${Object.keys(zyxBindAttributes).join("],[")}]`

export function zyXAttrProcess(zyxhtml, oven, data) {
	// const attributesWithPlaceholders = getElementsWithAttributeValuePrefix(oven, `<${placeholdTag}`);
	new Set(oven.querySelectorAll(zyxBindAttributespattern)).forEach((node) => {
		for (const attr of [...node.attributes].filter((_) => _.name in zyxBindAttributes)) {
			const placeholder = getPlaceholderID(attr.value);
			if (placeholder) {
				zyxBindAttributes[attr.name]({ node, data: data[placeholder].value })
				node.removeAttribute(attr.name);
			} else {
				zyxBindAttributes[attr.name]({ node, data: attr.value })
			}
		}
	});
}

function getElementsWithAttributeValuePrefix(ctx, prefix) {
	const xpath = `//*[starts-with(@*, '${prefix}')]`;
	const result = [];
	const nodesSnapshot = document.evaluate(xpath, ctx, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	for (let i = 0; i < nodesSnapshot.snapshotLength; i++) result.push(nodesSnapshot.snapshotItem(i));
	return result;
}
