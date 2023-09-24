export function raf({ env, func, goal, logging, start = false, callback, after_cycle } = {}) {
	let state = true;
	const stop = () => {
			state = false;
		},
		frame = () => {
			func(env);
			let go = goal(env);
			if (!state) return null;
			if (go) {
				if (after_cycle) after_cycle(env);
				if (callback) {
					let cb = callback(env);
					if (logging) console.log("call back");
					if (logging) console.log(cb);
					return cb;
				} else {
					return env;
				}
			}
			if (after_cycle) after_cycle(env);
			if (logging) console.log("is goal?:" + (go ? true : false));
			if (logging) console.log(env);
			window.requestAnimationFrame(frame);
		},
		exec = start
			? () => {
					console.log("func started");
					window.requestAnimationFrame(frame);
			  }
			: (() => {
					window.requestAnimationFrame(frame);
					return true;
			  })();
	return { stop, exec };
}

export function forQuery(that, query, cbfn) {
	try {
		[...that.querySelectorAll(query)].forEach((_) => cbfn(_));
	} catch (err) {
		console.error(err);
		throw err;
	}
}

export function setProps(that, props) {
	try {
		for (let [property_name, property] of Object.entries(props)) {
			that.style.setProperty(property_name, property);
		}
	} catch (err) {
		console.error(err);
		throw err;
	}
}

export function events(that, _events, callbackfn) {
	for (let event of _events.split(" ")) {
		that.addEventListener(event, callbackfn);
	}
}

export function forwardEffect(_events, callback, ...containers) {
	for (const containA of containers) {
		events(containA, _events, () => {
			for (const containB of containers) {
				callback(containB);
			}
		});
	}
}

export function timeoutLimiter({ cooldown = 60, last } = {}) {
	return () => {
		if (performance.now() - last < cooldown) return false;
		last = performance.now();
		return true;
	};
}

export function rightClick(element, func) {
	zyX(element).events("contextmenu", (_) => func(_));
}

export function pathContains(e, match) {
	let path = e.path || (e.composedPath && e.composedPath());
	for (let element of path) {
		if (element === document) return false;
		if (typeof match === "string" && element.matches(match)) return element;
		else if (element === match) return element;
	}
	return false;
}

function nullifyEvent(e) {
	e.stopPropagation();
	e.stopImmediatePropagation();
	e.preventDefault();
}

function disconnect_scan(connected) {
	if (!connected) return false;
	for (const n of connected) {
		if (!n.isConnected) return true;
	}
	return false;
}

export function clickOutsideOf(node, kwargs, type) {
	const { callback, connected } = kwargs;
	if (!type) type = ["click", "contextmenu"];
	const destroy = () => {
		for (const t of type) {
			window.removeEventListener(t, clickScanFunction, true);
		}
	};
	const clickScanFunction = (e) => {
		// if click is inside node, don't destroy event listener
		if (e.composedPath().includes(node)) return;

		// any click outside of node will destroy the event listener and call the callback 
		destroy();

		// check if all connected nodes are still connected, if no (must be connected) nodes are provided always nullify event.
		const disconnected_trigger = disconnect_scan(connected);

		callback(); // call callback after disconnect check because callback may disconnect nodes

		if (disconnected_trigger) return; // don't nullify event if a (must be connected) node is disconnected
		nullifyEvent(e);
	};
	setTimeout((_) => {
		for (const t of type) {
			window.addEventListener(t, clickScanFunction, true);
		}
	}, 1);
	return destroy;
}

export function pointerDrag(node, callback) {
	const state = {
		active: null,
	};
	node.addEventListener("pointerup", (_) => (state.active = false));
	node.addEventListener("pointerdown", (_) => {
		state.active = true;
		callback(_);
	});
	node.addEventListener("pointermove", (_) => {
		if (!state.active) return;
		callback(_);
	});
}

export function pointerDragGlobal(node, callback) {
	const state = {
		active: null,
	};
	node.addEventListener("pointerdown", (_) => {
		state.active = true;
		callback(_);
	});
	window.addEventListener("pointermove", (_) => {
		if (!state.active) return;
		callback(_);
	});
	window.addEventListener("pointerup", (_) => (state.active = false));
}

export class WeakRefSet extends Set {
	addRef(ref) {
		this.add(new WeakRef(ref));
	}

	get() {
		return [...this.values()]
			.map((weakRef) => {
				try {
					const obj = weakRef.deref();
					if (obj) return obj;
					else {
						this.delete(weakRef);
						return false;
					}
				} catch (err) {
					console.error(err);
					console.log("weakRef", weakRef);
				}
			})
			.filter((_) => _);
	}
}
