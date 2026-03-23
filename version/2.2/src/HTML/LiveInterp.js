import { makePlaceable } from "./HTML.js";

export class LiveInterp {
    constructor(reactive, interp, mode) {
        this.reactive = reactive;
        this.interp = interp;
        this.mode = mode || "text"; // text, html
        this.activeDomNode = null;
    }

    interprate() {
        if (this.interp) return this.interp(this.reactive.value);
        return this.reactive.value;
    }

    createZyXHTMLReactiveNode(zyxhtml, node, attrName) {
        let updateFunction;
        let ref;
        if (attrName) {
            // For attributes: update the attribute when the value changes
            updateFunction = () => {
                const newValue = this.interprate();
                if (newValue === null) return node.removeAttribute(attrName);
                node.setAttribute(attrName, newValue);
                if (node.tagName === "INPUT") {
                    node.value = newValue;
                    node.dispatchEvent(new Event("change"));
                }
            };
            ref = node;
            // Initial update - ensure it runs after the node is in the DOM because inputs :3
            setTimeout(() => updateFunction(), 0);
        } else {
            if (this.mode === "text") {
                // For text: create a text node that updates when the value changes
                const textNode = document.createTextNode("");
                node.replaceWith(textNode);
                ref = textNode;
                updateFunction = () => {
                    const newValue = this.interprate();
                    textNode.textContent = newValue;
                };
            } else if (this.mode === "html") {
                // For html: create a replaceable node that updates when the value changes
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
            // Initial update - it can be done immediately because.
            updateFunction();
        }
        if (this.reactive.eventListeners) {
            this.reactive.eventListeners.subscribe(updateFunction, ref);
        } else {
            this.reactive.subscribe(updateFunction, ref);
        }
    }
}
