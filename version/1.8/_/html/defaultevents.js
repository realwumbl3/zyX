const defaultBrowserEventListeners = [
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
];

export const defaultEvents = Object.fromEntries(
  defaultBrowserEventListeners.map((_) => [
    `zyx-${_}`,
    ({ node, data, zyxhtml }) => {
      // Create a wrapper function that uses a proxy
      const eventHandler = (originalEvent) => {
        // Create a proxy that combines the original event and the ZyXHTML object
        const eventProxy = new Proxy(originalEvent, {
          get: (target, prop) => {
            if (prop === "e" || prop === "event") return originalEvent;
            if (prop in zyxhtml) return zyxhtml[prop];
            return undefined;
          },
        });

        // Call the original handler with our proxy
        return data(eventProxy);
      };

      node.addEventListener(_, eventHandler);
    },
  ])
);
