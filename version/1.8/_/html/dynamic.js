// Dynamic value system for zyX HTML
// Provides reactive values that update DOM when modified

export function dynamic(initialValue) {
  // Store subscribers that will be updated when the value changes
  const subscribers = new Set();

  // Create a reactive object with getter/setter
  const reactive = {
    value: initialValue,

    // Method to update the value and notify subscribers
    set(newValue) {
      if (newValue === reactive.value) return;
      reactive.value = newValue;
      notifySubscribers();
    },

    // Add a subscriber to be notified on changes
    subscribe(callback) {
      subscribers.add(callback);
      return () => subscribers.delete(callback); // Return unsubscribe function
    },
  };

  // Notify all subscribers of value change
  function notifySubscribers() {
    subscribers.forEach((callback) => callback(reactive.value));
  }

  return reactive;
}

// Process reactive values in attributes and content
export function processReactiveValues(zyxhtml, node, attrName, reactive) {
  if (!reactive || typeof reactive !== "object" || !("subscribe" in reactive)) {
    return; // Not a reactive value
  }

  if (attrName) {
    // For attributes: update the attribute when the value changes
    const updateAttribute = (newValue) => {
      node.setAttribute(attrName, newValue);
    };

    // Initial update
    updateAttribute(reactive.value);

    // Subscribe to changes
    reactive.subscribe(updateAttribute);
  } else {
    // For content: create a span that updates when the value changes
    const span = document.createElement("span");

    const updateContent = (newValue) => {
      span.textContent = newValue;
    };

    // Initial update
    updateContent(reactive.value);

    // Subscribe to changes
    reactive.subscribe(updateContent);

    // Replace the node with our reactive span
    node.replaceWith(span);
  }
}
