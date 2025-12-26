import { LiveArray, Deque, LiveDeque, WeakRefSet, EventHandlerMapObject } from '../../zyX-Types.js';

// Example 1: LiveArray
console.log('\n=== LiveArray Example ===');
const list = new LiveArray([1, 2, 3]);
list.addListener((array, method, ...args) => {
    console.log(`Array ${method}:`, args);
});
list.push(4);
list.pop();
list.unshift(0);
list.splice(1, 1);

// Example 2: Deque
console.log('\n=== Deque Example ===');
const deque = new Deque(3);
deque.append(1);
deque.prepend(0);
deque.append(2);
deque.append(3);
console.log('Deque contents:', [...deque]);
const first = deque.popleft();
console.log('Removed first:', first);
console.log('Deque contents:', [...deque]);

// Example 3: LiveDeque
console.log('\n=== LiveDeque Example ===');
const liveDeque = new LiveDeque(3);
liveDeque.addListener((deque, method, ...args) => {
    console.log(`Deque ${method}:`, args);
});
liveDeque.append(1);
liveDeque.prepend(0);
liveDeque.popleft();

// Example 4: WeakRefSet
console.log('\n=== WeakRefSet Example ===');
const set = new WeakRefSet();
const obj1 = { id: 1 };
const obj2 = { id: 2 };
set.add(obj1);
set.add(obj2);
console.log('Set size:', set.size);
set.forEach(obj => console.log('Object:', obj.id));
set.delete(obj1);
console.log('Set size after delete:', set.size);

// Example 5: EventHandlerMapObject
console.log('\n=== EventHandlerMapObject Example ===');
class CustomObject extends EventHandlerMapObject {
    constructor() {
        super();
    }

    doSomething() {
        this.getEventListeners().forEach(cb => cb(this, 'custom', 'data'));
    }
}

const obj = new CustomObject();
obj.addListener((source, event, data) => {
    console.log(`Event ${event}:`, data);
});
obj.doSomething(); 