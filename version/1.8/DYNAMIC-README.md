# ZyX HTML Dynamic Values

This extension to ZyX HTML adds support for reactive dynamic values that automatically update the DOM when changed.

## Usage

```javascript
import { html, dynamic } from "./index.js";

// Create a dynamic value with an initial value
const counter = dynamic(42);

// Use in HTML templates - both in attributes and content
const template = html`
  <div data-count=${counter}>
    Current count: ${counter}
  </div>
  <button zyx-click=${() => counter.set(counter.value + 1)}>
    Increment
  </button>
`;

// Render the template
template.place(document.body);

// Later, update the value programmatically
counter.set(100); // Both the attribute and content will update automatically
```

## API

### dynamic(initialValue)

Creates a new reactive value with the given initial value.

Returns an object with the following properties:

- `value`: The current value
- `set(newValue)`: Method to update the value and trigger DOM updates
- `subscribe(callback)`: Method to subscribe to value changes

## Examples

Check out the test examples in the `_/tests/` directory:

- `dynamic-test.html`: Basic counter example
- `dynamic-boat-example.html`: Boat counting example from the TODO

## How It Works

The dynamic system works by:

1. Creating reactive objects with getter/setter for values
2. Detecting these objects in ZyX HTML templates
3. Setting up subscriptions to update the DOM automatically when values change
4. For attributes: Updates the attribute directly
5. For content: Uses a span tag to wrap the content for updates

Works with any attribute, including custom ones and zyx- prefixed attributes. 