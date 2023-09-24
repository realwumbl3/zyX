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

export function clickOutsideOf(node, callback, type) {
	if (!type) type = "click";
	const destroy = () => {
		window.removeEventListener(type, clickScanFunction, true);
	};
	const clickScanFunction = (e) => {
		if (!e.composedPath().includes(node)) {
			e.stopPropagation();
			e.stopImmediatePropagation();
			e.preventDefault();
			destroy();
			callback();
		}
	};
	setTimeout((_) => window.addEventListener(type, clickScanFunction, true), 1);
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
		return [...this.values()].filter((weakRef) => {
			const obj = weakRef.deref();
			if (obj) return true;
			else {
				this.delete(weakRef);
				return false;
			}
		});
	}
}
