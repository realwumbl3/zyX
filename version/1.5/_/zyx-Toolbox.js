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

export function pointerEventPathContains(e, cssSelector) {
	const path = e.path || (e.composedPath && e.composedPath());
	return path.some(e => e.matches?.(cssSelector))
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
	add(ref) {
		super.add(new WeakRef(ref));
	}

	push(ref) {
		super.add(new WeakRef(ref));
	}

	forEach(callback) {
		for (const ref of this.get()) {
			callback(ref);
		}
	}

	removeRef(_ref) {
		for (const ref of [...this.values()]) {
			if (ref.deref() === _ref) {
				this.delete(ref);
				return true;
			}
		}
	}

	get() {
		const values = [...this.values()]
		return values
			.map((weakRef) => {
				const obj = weakRef.deref();
				if (obj !== undefined) {
					return obj;
				} else {
					this.delete(weakRef);
					return false;
				}
			})
			.filter((_) => _);
	}

	getRefs = this.get;
	delete = this.removeRef;

	clear() {
		super.clear();
	}

}
