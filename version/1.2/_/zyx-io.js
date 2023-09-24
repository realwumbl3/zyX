export default class zyXio {
	constructor({ endpointUrl, events, roomCode } = {}) {

		this.endpointUrl = endpointUrl;
		this.roomCode = roomCode;

		this.sio = io(this.endpointUrl);
		this.sio.on("connect", (_) => this.connected(_));
		this.sio.on("disconnect", (_) => this.disconnect(_));
		this.extendedEvents = {};
		this.bind(events);
	}

	emit(event, data) {
		if (!data) data = {};
		this.sio.emit(event, data);
	}

	bind(nameCallbacks) {
		for (let [name, callback] of Object.entries(nameCallbacks)) {
			if (["connect"].includes(name)) {
				this.extendedEvents[name] = callback;
				continue;
			}
			this.sio.on(name, callback);
		}
	}

	connected(e) {
		this.sio.emit("enter", {
			roomCode: this.roomCode,
		});
		if (this.extendedEvents.connect) {
			this.extendedEvents.connect();
		}
	}

	disconnect() {}
}
