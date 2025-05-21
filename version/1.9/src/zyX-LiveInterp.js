// Dynamic value system for zyX HTML
// Provides reactive values that update DOM when modified

export class LiveInterp {
    constructor(reactive, interp) {
        this.reactive = reactive;
        this.interp = interp;
    }

    interprate() {
        if (this.interp) {
            return this.interp(this.reactive.value);
        }
        return this.reactive.value;
    }

    createZyXHTMLReactiveNode(zyxhtml, node, attrName) {
        let updateFunction;
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
            // Initial update - ensure it runs after the node is in the DOM
        } else {
            // For content: create a span that updates when the value changes
            const span = document.createElement("span");
            node.replaceWith(span);
            updateFunction = () => {
                span.textContent = this.interprate();
            };
        }
        setTimeout(() => {
            updateFunction();
        }, 0);
        if (this.reactive.eventListeners) {
            this.reactive.eventListeners.subscribe(updateFunction);
        } else {
            this.reactive.subscribe(updateFunction);
        }
    }
}
