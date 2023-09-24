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

export function pathContains(that, match) {
	let path = that.path || (that.composedPath && that.composedPath());
	for (let e of path) {
		if (e === document) return false;
		if (typeof match === "string" && e.matches(match)) return e;
		else if (e === match) return e;
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

// function GfxCache
/*
	module names -> libraries

export const GFX = {};

async function getGFX() {
	for (let preload_url of ["/static/cached/connection-lost-s.png"]) {
		const blobUrl = await aD.content.getImgBlob({ url: preload_url });
		GFX[preload_url] = blobUrl;
	}
}
*/
