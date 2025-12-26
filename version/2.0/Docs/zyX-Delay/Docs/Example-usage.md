# zyX-Delay Module Documentation

## Overview
The zyX-Delay module provides utility functions for managing delayed execution, debouncing, and throttling of functions in JavaScript applications.

## Exported Functions

### delayChain(that, keyname)
Creates a chain of delayed function executions.

**Parameters:**
- `that` (Object): The context object
- `keyname` (string): Unique identifier for the delay chain

**Returns:**
- Object with `then` method for chaining delayed executions

### delay(that, keyname, ms, func)
Delays the execution of a function for a specified time.

**Parameters:**
- `that` (Object): The context object
- `keyname` (string): Unique identifier for the delay
- `ms` (number): Delay duration in milliseconds
- `func` (Function, optional): Function to execute after delay

**Returns:**
- Promise that resolves after the delay

### debounce(that, keyname, func, ms)
Debounces a function to prevent rapid successive calls.

**Parameters:**
- `that` (Object): The context object
- `keyname` (string): Unique identifier for the debounce
- `func` (Function): Function to debounce
- `ms` (number): Debounce duration in milliseconds

### throttle(that, keyname, func, ms)
Throttles a function to limit its execution frequency.

**Parameters:**
- `that` (Object): The context object
- `keyname` (string): Unique identifier for the throttle
- `func` (Function): Function to throttle
- `ms` (number): Throttle duration in milliseconds

## Usage Examples

See `Example.js` for working code examples of each function. 