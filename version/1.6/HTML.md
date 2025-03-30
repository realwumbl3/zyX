# zyX HTML Parser Documentation

## Overview

The zyX HTML parser is a sophisticated system for parsing and processing HTML markup with dynamic content and variable interpolation. This document provides a detailed explanation of how the `zyX-HTML.js` system works, including its variable handling, placeholder system, and attribute processing.

## Core Components

### 1. HTML Template Function
```javascript
export const html = (...args) => new ZyXHtml(...args);
```
The entry point that creates a new ZyXHtml instance for processing HTML templates.

### 2. ZyXHtml Class

The main class that handles HTML processing with the following key features:

#### Important Properties
- `#constructed`: Boolean flag indicating if HTML has been fully processed
- `#dom`: The final processed DOM
- `#oven`: Temporary storage for markup during processing
- `#data`: Storage for template data/variables
- `#proxscope`: Scope for proxy variables
- `#mutable`: Reference to bound objects
- `#proxy`: Proxy handler for dynamic property access

#### Processing Pipeline

1. **Construction Phase**
   - Takes raw HTML and tag data
   - Pre-processes markup and data
   - Sets up proxy handling for dynamic content

2. **Placeholder Processing**
   - Dry placeholders: Processes text-based placeholders
   - Referenced placeholders: Handles DOM-based placeholders
   - HTML placeholders: Special processing for HTML content

3. **Attribute Processing**
   - Processes special `zyx-` prefixed attributes
   - Handles event bindings
   - Processes custom attributes

### 3. Variable Handling

Variables can be passed in several ways:

1. **Text Interpolation**
   - Simple values replace placeholders directly
   - Objects/functions get special handling

2. **Attribute Interpolation**
   - Values can be interpolated into attributes
   - Special handling for HTML-safe content

3. **Proxy Variables**
   - Uses `[pr0x]` attribute for reactive content
   - Maintains two-way binding through proxy system

### 4. Special Attributes

The system supports several special attributes:

#### Built-in Attributes
- `zyx-this`: Assigns element reference to instance
- `zyx-proxy`: Enables proxy functionality
- `push`: Assigns to array/collection
- `pr0x`: Creates proxy variable

#### Event Handlers
Supports all standard browser events:
- click, dblclick, mousedown, mouseup
- keydown, keypress, keyup
- focus, blur, submit
- And many more...

#### Custom Attributes
- `zyx-array`: Handles array binding
- `zyx-replace-if`: Conditional replacement
- `zyx-object-receiver`: Object handling

### 5. Lifecycle Methods

The class provides several methods for controlling the lifecycle:

```javascript
bind(any)      // Binds to external object
join(target)   // Joins with existing instance
markup()       // Returns processed markup
appendTo()     // DOM insertion
prependTo()    // DOM insertion
place()        // Custom placement
```

### 6. Debug Features

Built-in debugging capabilities:
- `enableVerbose()`: Enables detailed logging
- `disableGC()`: Disables garbage collection
- `logMap()`: Logs placeholder mapping

## Processing Flow

1. **Initialization**
   ```javascript
   const { markup, data } = preProcess(raw, tagData);
   ```

2. **Placeholder Processing**
   ```javascript
   dryPlaceholders()
   placeReferencedPlaceholders()
   ```

3. **Attribute Processing**
   ```javascript
   zyXAttrProcess(this, this.#oven, this.#data)
   ```

4. **DOM Construction**
   - Processes template content
   - Handles single vs multiple nodes
   - Sets up final DOM structure

## Best Practices

1. **Memory Management**
   - Use `disableGC()` only when necessary
   - Clean up unused references
   - Be mindful of circular references

2. **Performance**
   - Minimize placeholder usage for better performance
   - Use appropriate binding methods
   - Leverage proxy system for reactive content

3. **Debug Tools**
   - Use `enableVerbose()` for debugging
   - Monitor placeholder maps with `logMap()`
   - Check constructed state before operations

## Example Usage

```javascript
// Basic usage
html`<div>Hello ${name}</div>`

// With attributes
html`<div class=${className}>Content</div>`

// With event handling
html`<button zyx-click=${handleClick}>Click me</button>`

// With conditional content
html`<div zyx-replace-if=${[condition, replacement]}>Default</div>`

// With proxy binding
html`<input pr0x="inputValue" />`
```

## Error Handling

The parser includes several safety mechanisms:

1. **Construction Checks**
   - Validates constructed state
   - Ensures proper initialization
   - Handles template edge cases

2. **Placeholder Safety**
   - Validates placeholder IDs
   - Handles missing data gracefully
   - Provides fallback mechanisms

3. **Attribute Validation**
   - Checks attribute existence
   - Validates event handlers
   - Ensures proper binding

## Performance Considerations

1. **Memory Usage**
   - Garbage collection enabled by default
   - Temporary storage cleanup
   - Proxy optimization

2. **Processing Efficiency**
   - Single-pass processing where possible
   - Optimized placeholder replacement
   - Efficient DOM manipulation

3. **Reactive Updates**
   - Proxy-based change detection
   - Minimal DOM updates
   - Efficient event handling 