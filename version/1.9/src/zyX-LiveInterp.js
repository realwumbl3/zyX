import { makePlaceable } from "./zyX-HTML.js";

export class LiveInterp {
    constructor(reactive, interp, mode) {
        this.reactive = reactive;
        this.interp = interp;
        this.mode = mode || "text"; // text, html
        this.activeDomNode = null;
    }

    interprate() {
        if (this.interp) {
            return this.interp(this.reactive.value);
        }
        return this.reactive.value;
    }

    createZyXHTMLReactiveNode(zyxhtml, node, attrName) {
        let updateFunction;
        let ref;
        if (attrName) {
            // For attributes: update the attribute when the value changes
            updateFunction = () => {
                const newValue = this.interprate();
                node.setAttribute(attrName, newValue);
                if (node.tagName === "INPUT") {
                    node.value = newValue;
                    node.dispatchEvent(new Event("change"));
                }
            };
            ref = node;
            // Initial update - ensure it runs after the node is in the DOM
        } else {
            // For content: create a text node that updates when the value changes
            if (this.mode === "text") {
                const textNode = document.createTextNode("");
                node.replaceWith(textNode);
                ref = textNode;
                updateFunction = () => {
                    const newValue = this.interprate();
                    textNode.textContent = newValue;
                };
            } else if (this.mode === "html") {
                this.activeDomNode = node;
                ref = node.parentElement;
                updateFunction = () => {
                    const newValue = makePlaceable(this.interprate());
                    if (!newValue) {
                        this.activeDomNode.style.display = "none";
                        return;
                    }
                    this.activeDomNode.replaceWith(newValue);
                    this.activeDomNode = newValue;
                };
            }
        }
        setTimeout(() => updateFunction(), 1);
        if (this.reactive.eventListeners) {
            this.reactive.eventListeners.subscribe(updateFunction, ref);
        } else {
            this.reactive.subscribe(updateFunction, ref);
        }
    }
}
