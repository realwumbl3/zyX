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
	return [...that.querySelectorAll(query)].forEach((_) => cbfn(_));
}

export function setProps(that, props) {
	Object.entries(props).forEach(([prop, val]) => that.style.setProperty(prop, val))
}

export function events(that, events, cb) {
	events.split(" ").forEach((event) => that.addEventListener(event, cb))
}

export function timeoutLimiter({ cooldown = 60, last } = {}) {
	return () => {
		if (performance.now() - last < cooldown) return false;
		last = performance.now();
		return true;
	};
}

export function pointerEventPathContains(e, cssSelector) {
	return (e.composedPath && e.composedPath()).some(e => e.matches?.(cssSelector))
}