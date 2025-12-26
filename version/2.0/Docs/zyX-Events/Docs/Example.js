import ZyXEvents from '../../src/zyX-Events.js';

// Create an event emitter instance
const events = new ZyXEvents();

// Example 1: Basic event handling
events.on('greeting', (name) => {
    console.log(`Hello, ${name}!`);
});

// Example 2: Multiple event subscriptions
events.on('start,stop', (action) => {
    console.log(`System ${action}ed`);
});

// Example 3: Event with multiple parameters
events.on('userAction', (userId, action, timestamp) => {
    console.log(`User ${userId} performed ${action} at ${new Date(timestamp).toISOString()}`);
});

// Emit events
console.log('=== Basic Event Example ===');
events.call('greeting', 'World');

console.log('\n=== Multiple Events Example ===');
events.call('start', 'start');
events.call('stop', 'stop');

console.log('\n=== Multiple Parameters Example ===');
events.call('userAction', 123, 'login', Date.now()); 