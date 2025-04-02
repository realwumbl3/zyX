# zyX-Async Module Documentation

## Overview
The zyX-Async module provides utility functions and classes for handling asynchronous operations in JavaScript applications, including worker management, async initialization, and concurrency control.

## Exported Functions and Classes

### sleep(ms, throwOnNegative)
Creates a promise that resolves after a specified delay.

**Parameters:**
- `ms` (number): Time to sleep in milliseconds
- `throwOnNegative` (boolean, optional): Whether to throw on negative time values (default: true)

**Returns:**
- Promise<void>

### AsyncWorker
Enhanced worker for handling async tasks with type safety and error handling.

**Constructor Parameters:**
- `url` (string): URL of the worker script
- `type` (string, optional): Worker type (default: "module")
- `errorHandler` (Function, optional): Custom error handler (default: console.error)

**Methods:**
- `on(eventName, handler)`: Register an event handler
- `off(eventName, handler)`: Remove an event handler
- `execute(options)`: Execute a task in the worker
- `terminate()`: Terminate the worker and cleanup resources

### AsynConstructor
Base class for creating asynchronous constructors.

**Constructor Parameters:**
- `delay` (number, optional): Delay before initialization (default: 1)
- `immediate` (boolean, optional): Whether to initialize immediately (default: false)

**Properties:**
- `isInitialized`: Check if async initialization is complete

**Methods:**
- `waitForInit()`: Wait for async initialization to complete

### debounce(fn, delay)
Creates a debounced version of a function.

**Parameters:**
- `fn` (Function): Function to debounce
- `delay` (number): Debounce delay in milliseconds

**Returns:**
- Debounced function

### asyncPool(concurrency, tasks, iteratorFn)
Run multiple async tasks with concurrency control.

**Parameters:**
- `concurrency` (number): Maximum number of concurrent tasks
- `tasks` (Array): Array of tasks to process
- `iteratorFn` (Function): Function to process each task

**Returns:**
- Promise resolving to array of results

## Usage Examples

See `Example.js` for working code examples of each function and class. 