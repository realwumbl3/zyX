import { io } from "./Cdn/socket.io.esm.min.js";

/*
FORCE IT TO STAY CONNECTED OR HAVE DISCONNECTED CALLBACKS OR SOMETHIONG
TRACK ROOMS ?>????!??????
VERBOSCIOUS LOGGING
*/

export default class zyXio {
	constructor({ endpointUrl, events } = {}) {
		this.endpointUrl = endpointUrl;
		this.logging = false;
		this.sio = io(this.endpointUrl);
		this.sio.on("connect", () => {
			this.logging && console.log("[socketio] Connected to server");
			this.connected();
		});
		this.extendedEvents = {};
		this.bind(events);
	}

	connect() {
		this.sio.connect();
	}

	disconnect() {
		this.sio.disconnect();
	}

	connected() {
		if (this.extendedEvents.connected) this.extendedEvents.connected();
	}

	join(room_code) {
		this.logging && console.log("[socketio] Join room", room_code);
		this.sio.emit("enter", { room_code: room_code });
	}

	emit(event, data) {
		if (!data) data = {};
		this.sio.emit(event, data);
	}

	bind(nameCallbacks) {
		for (const [name, callback] of Object.entries(nameCallbacks)) {
			if (["connected"].includes(name)) {
				this.extendedEvents[name] = callback;
				continue;
			}
			this.sio.on(name, callback);
		}
	}
}
