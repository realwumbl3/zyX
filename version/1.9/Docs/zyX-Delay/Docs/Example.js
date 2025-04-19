// Example usage of zyX-Delay functions

// Example 1: Using delayChain
const context = {};
delayChain(context, 'myChain')
    .then(() => console.log('First after 100ms'), 100)
    .then(() => console.log('Second after 200ms'), 200)
    .then(() => console.log('Third after 300ms'), 300);

// Example 2: Using delay
const myContext = {};
delay(myContext, 'myDelay', 1000, () => {
    console.log('Executed after 1 second');
});

// Example 3: Using debounce
const debounceContext = {};
const debouncedFunction = () => console.log('Debounced function called');
debounce(debounceContext, 'myDebounce', debouncedFunction, 500);

// Example 4: Using throttle
const throttleContext = {};
const throttledFunction = () => console.log('Throttled function called');
throttle(throttleContext, 'myThrottle', throttledFunction, 1000);

// Example 5: Clearing delays
clearDelay(myContext, 'myDelay');

// Example 6: Breaking delay chain
breakDelayChain(context, 'myChain');

// Example 7: Instantly calling a delay
instant(myContext, 'myDelay');
