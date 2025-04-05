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
  defaultBrowserEventListeners.map((eventName) => [
    `zyx-${eventName}`,
    ({ node, data, zyxhtml }) => {
      try {
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
