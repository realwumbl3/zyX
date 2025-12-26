const defaultBrowserEventListeners = [
    "focus",
    "blur",
    "click",
    "dblclick",
    "contextmenu",
    "mousedown",
    "mouseup",
    "mouseover",
    "mousemove",
    "mouseout",
    "mouseenter",
    "mouseleave",
    "wheel",
    "scroll",
    "submit",
    "load",
    "error",
    "input",
    "change",
    "resize",
    "drag",
    "dragstart",
    "dragend",
    "dragenter",
    "dragleave",
    "dragover",
    "drop",
    "dropzone",
    "dropzoneenter",
    "dropzoneleave",
    "dropzoneover",
    "dropzoneout",
    "dropzoneenter",
    "dropzoneleave",
    "pointerdown",
    "pointerup",
    "pointermove",
    "pointerover",
    "pointerout",
    "pointerenter",
    "pointerleave",
    "pointercancel",
    "pointerlockchange",
    "pointerlockerror",
    "gotpointercapture",
    "lostpointercapture",
    "keydown",
    "keypress",
    "keyup",
];

export const defaultEvents = Object.fromEntries(
    defaultBrowserEventListeners.map((eventName) => [
        `zyx-${eventName}`,
        ({ node, data, zyxhtml }) => {
            try {
                // Create a wrapper function that uses a proxy
                const eventHandler = (originalEvent) => {
                    // Create a proxy that combines the original event and the ZyXHTML object
                    const eventProxy = new Proxy(originalEvent, {
                        get: (target, prop) => {
                            if (prop in originalEvent) return originalEvent[prop];
                            if (prop === "el") return node;
                            if (prop === "e" || prop === "event") return originalEvent;
                            if (prop in zyxhtml) return zyxhtml[prop];
                            return undefined;
                        },
                    });

                    // Call the original handler with our proxy
                    return data(eventProxy);
                };

                node.addEventListener(eventName, eventHandler);
            } catch (e) {
                console.error(`Error adding event listener for [zyx-${eventName}]:`, { e, node, data, zyxhtml });
            }
        },
    ])
);

defaultEvents["zyx-enter"] = ({ node, data, zyxhtml }) => {
    node.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            data(
                new Proxy(event, {
                    get: (target, prop) => {
                        if (prop === "e" || prop === "event") return event;
                        if (prop in zyxhtml) return zyxhtml[prop];
                        return undefined;
                    },
                })
            );
        }
    });
};

const miceExclusiveEvents = ["up", "down", "move", "over", "out", "enter", "leave", "contextmenu", "wheel"];

export const enhandedDefaultEvents = Object.fromEntries(
    miceExclusiveEvents.map((eventName) => [
        `zyx-mice${eventName}`,
        ({ node, data, zyxhtml }) => {
            try {
                // Create a wrapper function that uses a proxy
                const eventHandler = (originalEvent) => {
                    if (originalEvent.pointerType === "touch") return;
                    // Create a proxy that combines the original event and the ZyXHTML object
                    const eventProxy = new Proxy(originalEvent, {
                        get: (target, prop) => {
                            if (prop in originalEvent) return originalEvent[prop];
                            if (prop === "el") return node;
                            if (prop === "e" || prop === "event") return originalEvent;
                            if (prop in zyxhtml) return zyxhtml[prop];
                            return undefined;
                        },
                    });

                    // Call the original handler with our proxy
                    return data(eventProxy);
                };

                node.addEventListener(`pointer${eventName}`, eventHandler);
            } catch (e) {
                console.error(`Error adding event listener for [zyx-mice${eventName}]:`, { e, node, data, zyxhtml });
            }
        },
    ])
);
