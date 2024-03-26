export default class ZyXEvents {
    #events = {};
    on(event, callback) {
        if (event.includes(",")) {
            event.split(",").forEach((event) => this.on(event, callback));
            return;
        }
        if (!(event in this.#events)) this.#events[event] = [];
        this.#events[event].push(callback);
    }
    call(eventName, ...args) {
        const eventCallbacks = this.#events[eventName];
        if (!eventCallbacks) return;
        for (const cb of eventCallbacks) cb(...args);
    }
}