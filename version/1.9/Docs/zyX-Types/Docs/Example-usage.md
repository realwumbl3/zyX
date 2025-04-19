# zyX-Types Usage Examples

This document provides examples of how to use the various types provided by the zyX-Types module.

## LiveArray

LiveArray is an enhanced array implementation that emits events when modified.

```javascript
import { LiveArray } from '../zyX-Types.js';

// Create a new LiveArray
const list = new LiveArray([1, 2, 3]);

// Add an event listener
list.addListener((array, method, ...args) => {
    console.log(`Array ${method}:`, args);
});

// Modify the array - events will be emitted
list.push(4);        // Logs: Array push: [4]
list.pop();          // Logs: Array pop: [4]
list.unshift(0);     // Logs: Array unshift: [0]
list.splice(1, 1);   // Logs: Array splice: [1, 1]

// Use array methods as normal
list.push(5, 6);
list.sort((a, b) => a - b);
list.clear();
```

## Deque

Deque is a double-ended queue implementation with a size limit.

```javascript
import { Deque } from '../zyX-Types.js';

// Create a deque with a limit of 3
const deque = new Deque(3);

// Add items to either end
deque.append(1);     // [1]
deque.prepend(0);    // [0, 1]
deque.append(2);     // [0, 1, 2]
deque.append(3);     // [1, 2, 3] (0 was removed due to limit)

// Remove items from either end
const first = deque.popleft();   // Returns 1, deque is now [2, 3]
const last = deque.popright();   // Returns 3, deque is now [2]

// Check deque status
console.log(deque.isEmpty());    // false
console.log(deque.isFull());     // false
```

## LiveDeque

LiveDeque combines the functionality of Deque with event handling.

```javascript
import { LiveDeque } from '../zyX-Types.js';

// Create a live deque with a limit of 3
const liveDeque = new LiveDeque(3);

// Add event listener
liveDeque.addListener((deque, method, ...args) => {
    console.log(`Deque ${method}:`, args);
});

// Modify the deque - events will be emitted
liveDeque.append(1);     // Logs: Deque append: [1]
liveDeque.prepend(0);    // Logs: Deque prepend: [0]
liveDeque.popleft();     // Logs: Deque popleft: [0]
```

## WeakRefSet

WeakRefSet is a Set implementation that uses WeakRef for automatic garbage collection.

```javascript
import { WeakRefSet } from '../zyX-Types.js';

// Create a new WeakRefSet
const set = new WeakRefSet();

// Add objects to the set
const obj1 = { id: 1 };
const obj2 = { id: 2 };
set.add(obj1);
set.add(obj2);

// Iterate over valid references
set.forEach(obj => console.log(obj.id));

// Remove an object
set.delete(obj1);

// Get all valid references
const refs = set.get();

// Keep only one reference
set.singleize(obj2);
```

## EventHandlerMapObject

EventHandlerMapObject is a base class for objects that need event listener management.

```javascript
import { EventHandlerMapObject } from '../zyX-Types.js';

// Create a custom class that extends EventHandlerMapObject
class CustomObject extends EventHandlerMapObject {
    constructor() {
        super();
    }

    doSomething() {
        // Trigger custom event
        this.getEventListeners().forEach(cb => cb(this, 'custom', 'data'));
    }
}

// Create an instance
const obj = new CustomObject();

// Add event listener
obj.addListener((source, event, data) => {
    console.log(`Event ${event}:`, data);
});

// Trigger event
obj.doSomething();  // Logs: Event custom: data
``` 