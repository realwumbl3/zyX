export default class EventSystem {
    constructor() {
        this.__events__ = {};
    }

    on(event, callback) {
        if (event.includes(",")) {
            event.split(",").forEach((event) => this.on(event, callback));
            return;
        }
        if (!(event in this.__events__)) this.__events__[event] = [];
        this.__events__[event].push(callback);
    }

    call(eventName, ...args) {
        const eventCallbacks = this.__events__[eventName];
        if (!eventCallbacks) return;
        for (const cb of eventCallbacks) cb(...args);
    }

}