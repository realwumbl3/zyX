import { io } from "https://zyx.wumbl3.xyz/v:1.4/_/dependencies/socket.io.esm.min.js";

export default class zyXio {
	constructor({ endpointUrl, events } = {}) {
		this.endpointUrl = endpointUrl;
		this.room_code;

		this.logging = false;

		this.sio = io(this.endpointUrl);
		this.sio.on("connect", () => {
			this.logging && console.log("[socketio] Connected to server");
			this.connected();
		});
		// this.sio.on("disconnect", (_) => {
		// 	this.logging && console.log("[socketio] Disconnected from server");
		// 	// this.disconnect(_);
		// });
		this.extendedEvents = {};
		this.bind(events);
	}

	connect() {
		this.sio.connect();
	}

	// disconnect() {
	// 	this.sio.disconnect();
	// }

	connected() {
		if (this.extendedEvents.connect) {
			this.extendedEvents.connect();
		}
	}

	join(room_code) {
		this.room_code = room_code;
		this.logging && console.log("[socketio] Join room", room_code);
		this.sio.emit("enter", {
			room_code: this.room_code,
		});
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
}
