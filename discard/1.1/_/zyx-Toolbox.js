export function forQuery(that) {
	return function (query, cbfn) {
		try {
			[...that.querySelectorAll(query)].forEach((_) => cbfn(_));
		} catch (err) {
			console.error(err);
			throw err;
		}
	};
}

export function setProps(that) {
	return function (props) {
		try {
			for (let [property_name, property] of Object.entries(props)) {
				that.style.setProperty(property_name, property);
			}
		} catch (err) {
			console.error(err);
			throw err;
		}
	};
}

export function events(that) {
	return function (events, callbackfn) {
		for (let event of events.split(" ")) {
			that.addEventListener(event, callbackfn);
		}
	};
}

export function pathContains(that) {
	return function (match) {
		let path = that.path || (that.composedPath && that.composedPath());
		for (let e of path) {
			if (e === document) return false;
			if (typeof match === "string" && e.matches(match)) return e;
			else if (e === match) return e;
		}
		return false;
	};
}

export function clickOutsideOf(node, callback) {
	const destroy = () => {
		window.removeEventListener("click", clickScanFunction, true);
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
	setTimeout((_) => window.addEventListener("click", clickScanFunction, true), 1);
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
