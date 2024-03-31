export function forQuery(that, query, cbfn) {
	return [...that.querySelectorAll(query)].forEach((_) => cbfn(_));
}

export function setProps(that, props) {
	Object.entries(props).forEach(([prop, val]) => that.style.setProperty(prop, val))
}

export function events(that, events, cb, options = {}) {
	events.split(" ").forEach((event) => that.addEventListener(event, cb, options))
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