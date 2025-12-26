// Example usage of zyX-Async functions and classes

// Example 1: Using sleep
async function exampleSleep() {
    console.log('Starting...');
    await sleep(1000);
    console.log('After 1 second');
}

// Example 2: Using AsyncWorker
const worker = new AsyncWorker({
    url: 'worker.js',
    errorHandler: (error) => console.error('Worker error:', error)
});

// Register event handler
const cleanup = worker.on('progress', (data) => {
    console.log('Progress:', data);
});

// Execute a task
const result = await worker.execute({
    task: 'processData',
    data: { /* task data */ }
});

// Cleanup
cleanup();
worker.terminate();

// Example 3: Using AsynConstructor
class MyAsyncClass extends AsynConstructor {
    async asyncInit() {
        // Async initialization logic
        await sleep(1000);
        console.log('Initialized');
    }
}

const instance = new MyAsyncClass({ delay: 100 });
await instance.waitForInit();

// Example 4: Using debounce
const debouncedFn = debounce(() => {
    console.log('Debounced function called');
}, 500);

// Example 5: Using asyncPool
const tasks = [1, 2, 3, 4, 5];
const results = await asyncPool(2, tasks, async (item) => {
    await sleep(1000);
    return item * 2;
}); 