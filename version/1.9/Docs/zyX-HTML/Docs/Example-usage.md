# zyX-HTML Module Documentation

## Overview
The zyX-HTML module provides a powerful template literal-based HTML manipulation system with support for dynamic content, reactive data binding, and DOM manipulation.

## Exported Functions and Classes

### html
Tagged template literal function for creating HTML templates.
```javascript
html`template string`
```

### ZyXHTML Class
Main class for HTML template processing and manipulation.

#### Constructor
```javascript
new ZyXHTML(raw, ...tagData)
```
**Parameters:**
- `raw`: Raw template string
- `tagData`: Template data values

#### Methods

##### DOM Manipulation
- `markup()`: Get the processed DOM
- `appendTo(target)`: Append to target element
- `prependTo(target)`: Prepend to target element
- `place(place)`: Place in specified location
- `join(target)`: Join with target element

##### Template Processing
- `const(options)`: Construct the template
  - `keepRaw`: Keep raw template string
  - `keepMarkup`: Keep markup
  - `keepData`: Keep template data

##### Data Binding
- `bind(any, options)`: Bind data to template

### Helper Functions
- `makePlaceable(object)`: Convert object to DOM placeable
- `templateFromPlaceables(placeables)`: Create template from placeable objects

## Features

### Template Literals
```javascript
const template = html`
  <div class="${className}">
    <h1>${title}</h1>
    <p>${content}</p>
  </div>
`;
```

### Dynamic Attributes
```javascript
html`
  <div ${dynamicAttr}>
    <input type="text" value="${value}" />
  </div>
`;
```

### Element References
```javascript
html`
  <div id="main">
    <button id="submit">Submit</button>
  </div>
`;
```

### Reactive Data
```javascript
html`
  <div ${reactiveData}>
    ${dynamicContent}
  </div>
`;
```

## Usage Examples

See `Example.js` for working code examples of each feature. 