// Dynamic value system for zyX HTML
// Provides reactive values that update DOM when modified
const VERBOSE = true;
/** 
 * Creates a dynamic variable with reactive behavior
 * @param {*} initialValue - The initial value of the variable
 * @returns {Object} The reactive variable object
 */
export function dynamicVar(initialValue) {
  // Store subscribers that will be updated when the value changes
  const subscribers = new Set();

  // Create a reactive object with getter/setter
  const reactive = {
    initialValue: initialValue,
    reset() {
      reactive.value = reactive.initialValue;
      notifySubscribers();
    },
    value: initialValue,
    // Method to update the value and notify subscribers
    set(newValue) {
      if (VERBOSE) console.log("setting value", newValue, { reactive, subscribers });
      if (newValue === reactive.value) return;
      reactive.value = newValue;
      notifySubscribers();
    },

    // Add a subscriber to be notified on changes
    subscribe(callback) {
      subscribers.add(callback);
      return () => subscribers.delete(callback); // Return unsubscribe function
    },

    // Alias for subscribe to maintain compatibility with LiveVariable
    addListener(callback) {
      return this.subscribe(callback);
    }
  };

  // Notify all subscribers of value change
  function notifySubscribers() {
    if (VERBOSE) console.log("notifying subscribers", { reactive, subscribers });
    subscribers.forEach((callback) => callback(reactive.value));
  }

  return reactive;
}

/**
 * Processes reactive values in attributes and content
 * @param {ZyXHtml} zyxhtml - The zyX HTML instance
 * @param {Element} node - The DOM element to process
 * @param {string} attrName - The name of the attribute to process
 * @param {Object} reactive - The reactive value object
 * @returns {void}
 */

// Process reactive values in attributes and content
export function processDynamicVarAttributes(zyxhtml, node, attrName, reactive) {
  if (!reactive || typeof reactive !== "object" || !("subscribe" in reactive)) {
    return; // Not a reactive value
  }

  if (attrName) {
    // For attributes: update the attribute when the value changes
    const updateAttribute = (newValue) => {
      if (VERBOSE) console.log("updating attribute", { node, attrName, newValue });

      // if node is an input, also update the value of the input
      if (node.tagName === "INPUT") {
        if (VERBOSE) console.log("updating input value", { node, newValue });
        node.value = `${newValue}`;
      }

      node.setAttribute(attrName, `${newValue}`);
    };

    // Initial update - ensure it runs after the node is in the DOM
    setTimeout(() => {
      updateAttribute(reactive.value);
    }, 0);

    // Subscribe to changes
    reactive.subscribe(updateAttribute);
  } else {
    // For content: create a span that updates when the value changes
    const span = document.createElement("span");

    const updateContent = (newValue) => {
      if (VERBOSE) console.log("updating content", { span, newValue });
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
