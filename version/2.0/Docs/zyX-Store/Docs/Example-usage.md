# zyX-Store Module Usage Examples

The zyX-Store module provides a simple and efficient way to manage browser cookies in your web applications.

## Basic Usage

```javascript
import { Cookies } from 'zyX-Store.js';

// Set a cookie
Cookies.set('userPreferences', { theme: 'dark' });

// Get a cookie value
const preferences = Cookies.get('userPreferences');

// Delete a cookie
Cookies.delete('userPreferences');
```

## Features

### Setting Cookies
- Set cookies with optional expiration time
- Automatically handles JSON serialization/deserialization
- Default expiration of 9999 days if not specified

```javascript
// Set a cookie with 7 days expiration
Cookies.set('sessionId', 'abc123', 7);

// Set a cookie with default expiration
Cookies.set('theme', 'dark');
```

### Getting Cookies
- Retrieve cookie values with type preservation
- Support for default values
- Automatic type conversion for boolean values

```javascript
// Get a cookie value
const theme = Cookies.get('theme');

// Get a cookie with default value
const language = Cookies.get('language', 'en');

// Get a boolean cookie
const isLoggedIn = Cookies.get('isLoggedIn');
```

### Deleting Cookies
- Remove cookies from the browser
- Automatically sets expiration to past date

```javascript
// Delete a cookie
Cookies.delete('sessionId');
```

## Best Practices

1. Always provide meaningful cookie names
2. Use appropriate expiration times
3. Handle missing cookies with default values
4. Clean up cookies when they're no longer needed

## Error Handling

The module handles common edge cases:
- Missing cookies return default values
- Invalid cookie names are handled gracefully
- Expiration dates are properly formatted 