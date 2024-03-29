export function sleep(ms) {
	return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

export class AsyncWorker {
	constructor({ url, type = "module" } = {}) {
		this.sW = new Worker(url, { type });
		this.serviceWorkerTasks = {};
		this.sW.onmessage = this.serviceWorkerResponse;
		this.callbacks = {};
	}

	on(key, cb) {
		if (!(key in this.callbacks)) this.callbacks[key] = [];
		this.callbacks[key].push(cb);
	}

	callCallback(data) {
		const callbacks = this.callbacks[data.event];
		if (!callbacks) return
		for (const cb of callbacks) cb(data.data);
	}

	serviceWorkerResponse = (response) => {
		if ("event" in response.data) {
			return this.callCallback(response.data);
		}
		const { taskID, reject } = response.data;
		const serviceTask = this.serviceWorkerTasks[taskID];
		delete this.serviceWorkerTasks[taskID];
		if (reject) return serviceTask.reject(reject);
		serviceTask?.resolve(response.data);
	};

	task({ task, data }) {
		return new Promise((resolve, reject) => {
			const taskID = Math.random().toString(36).slice(2, 10);
			const serviceWorkerTask = { task, taskID, resolve, reject };
			this.serviceWorkerTasks[taskID] = serviceWorkerTask;
			this.sW.postMessage({ task, data, taskID });
		});
	}
}

export class AsynConstructor {
	constructor({ delay = 1, microtask = false } = {}) {
		if (typeof this.asynConstructor === "function") {
			if (microtask) {
				queueMicrotask(_ => this.asynConstructor());
			} else {
				setTimeout(_ => this.asynConstructor(), delay);
			}
		} else {
			console.warn("you are using a (new AsynConstructor()) class without an async asynConstructor method.");
		}
	}
}
