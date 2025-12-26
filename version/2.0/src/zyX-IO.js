import { io } from "./cdn/socket.io.esm.min.js";

/**
 * Configuration options for the WebSocket helper
 * @typedef {Object} WebSocketConfig
 * @property {string} endpointUrl - The WebSocket server URL
 * @property {Object} events - Event handlers to bind
 * @property {boolean} [autoConnect=true] - Whether to connect automatically on instantiation
 * @property {boolean} [debug=false] - Enable debug logging
 * @property {Object} [socketOptions] - Socket.io client options
 */

/**
 * A helper class for managing WebSocket connections using Socket.IO
 * Provides methods for connection management, room handling, and event binding
 */
export default class ZyXIO {
	/**
	 * Creates a new WebSocket helper instance
	 * @param {WebSocketConfig} config - Configuration options
	 */
	constructor({ endpointUrl, events = {}, autoConnect = true, debug = false, socketOptions = {} } = {}) {
		if (!endpointUrl) {
			throw new Error('endpointUrl is required');
		}

		this.endpointUrl = endpointUrl;
		this.debug = debug;
		this.socketOptions = {
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			...socketOptions
		};

		this.sio = io(this.endpointUrl, this.socketOptions);
		this.extendedEvents = {};
		this.rooms = new Set();

		this.setupConnectionHandlers();
		this.bind(events);

		if (autoConnect) {
			this.connect();
		}
	}

	/**
	 * Sets up connection event handlers
	 * @private
	 */
	setupConnectionHandlers() {
		this.sio.on("connect", () => {
			this.debug && console.log("[socketio] Connected to server");
			this.connected();
		});

		this.sio.on("disconnect", (reason) => {
			this.debug && console.log("[socketio] Disconnected from server:", reason);
			if (this.extendedEvents.disconnected) {
				this.extendedEvents.disconnected(reason);
			}
		});

		this.sio.on("connect_error", (error) => {
			this.debug && console.error("[socketio] Connection error:", error);
			if (this.extendedEvents.error) {
				this.extendedEvents.error(error);
			}
		});
	}

	/**
	 * Connects to the WebSocket server
	 * @returns {void}
	 */
	connect() {
		if (!this.sio.connected) {
			this.sio.connect();
		}
	}

	/**
	 * Disconnects from the WebSocket server
	 * @returns {void}
	 */
	disconnect() {
		this.sio.disconnect();
	}

	/**
	 * Called when successfully connected to the server
	 * @private
	 */
	connected() {
		if (this.extendedEvents.connected) {
			this.extendedEvents.connected();
		}
	}

	/**
	 * Joins a room
	 * @param {string} roomCode - The room code to join
	 * @returns {void}
	 */
	join(roomCode) {
		if (!roomCode) {
			throw new Error('roomCode is required');
		}

		this.debug && console.log("[socketio] Joining room:", roomCode);
		this.sio.emit("enter", { room_code: roomCode });
		this.rooms.add(roomCode);

		if (this.extendedEvents.roomJoined) {
			this.extendedEvents.roomJoined(roomCode);
		}
	}

	/**
	 * Leaves a room
	 * @param {string} roomCode - The room code to leave
	 * @returns {void}
	 */
	leave(roomCode) {
		if (!roomCode) {
			throw new Error('roomCode is required');
		}

		this.debug && console.log("[socketio] Leaving room:", roomCode);
		this.sio.emit("leave", { room_code: roomCode });
		this.rooms.delete(roomCode);

		if (this.extendedEvents.roomLeft) {
			this.extendedEvents.roomLeft(roomCode);
		}
	}

	/**
	 * Gets the list of rooms the client is currently in
	 * @returns {string[]} Array of room codes
	 */
	getRooms() {
		return Array.from(this.rooms);
	}

	/**
	 * Emits an event to the server
	 * @param {string} event - The event name
	 * @param {Object} [data] - The data to send with the event
	 * @returns {void}
	 */
	emit(event, data = {}) {
		if (!event) {
			throw new Error('event name is required');
		}

		this.debug && console.log("[socketio] Emitting event:", event, data);
		this.sio.emit(event, data);
	}

	/**
	 * Binds event handlers to socket events
	 * @param {Object} nameCallbacks - Object mapping event names to callback functions
	 * @returns {void}
	 */
	bind(nameCallbacks) {
		if (!nameCallbacks || typeof nameCallbacks !== 'object') {
			throw new Error('nameCallbacks must be an object');
		}

		for (const [name, callback] of Object.entries(nameCallbacks)) {
			if (typeof callback !== 'function') {
				throw new Error(`Callback for event "${name}" must be a function`);
			}

			if (["connected", "disconnected", "error", "roomJoined", "roomLeft"].includes(name)) {
				this.extendedEvents[name] = callback;
				continue;
			}

			this.sio.on(name, callback);
		}
	}

	/**
	 * Removes all event listeners
	 * @returns {void}
	 */
	removeAllListeners() {
		this.sio.removeAllListeners();
		this.extendedEvents = {};
		this.rooms.clear();
	}

	/**
	 * Checks if the socket is currently connected
	 * @returns {boolean} True if connected, false otherwise
	 */
	isConnected() {
		return this.sio.connected;
	}
}
