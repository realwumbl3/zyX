# zyX-Events Module Usage Examples

The zyX-Events module provides a simple and powerful event handling system for JavaScript applications.

## Basic Usage

```javascript
import ZyXEvents from '../src/zyX-Events.js';

// Create an event emitter instance
const events = new ZyXEvents();

// Subscribe to an event
events.on('userLogin', (user) => {
    console.log(`User ${user.name} logged in`);
});

// Emit an event
events.call('userLogin', { name: 'John' });
```

## Multiple Event Subscriptions

```javascript
// Subscribe to multiple events at once
events.on('start,stop', (action) => {
    console.log(`Action ${action} triggered`);
});

// Emit events
events.call('start', 'started');
events.call('stop', 'stopped');
```

## Event Handling with Multiple Arguments

```javascript
// Subscribe to an event with multiple parameters
events.on('dataUpdate', (id, data, timestamp) => {
    console.log(`Data ${id} updated with ${data} at ${timestamp}`);
});

// Emit event with multiple arguments
events.call('dataUpdate', 123, { value: 42 }, Date.now());
```

## Best Practices

1. Always use descriptive event names
2. Consider using constants for event names to prevent typos
3. Clean up event listeners when they're no longer needed
4. Use TypeScript for better type safety with event arguments 