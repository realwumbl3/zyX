const GlobalMap = new WeakMap();

if (typeof window !== "undefined") {
	window.zyxMap = GlobalMap;
}

const GlobalGet = (ref, bank) => {
	let map = GlobalMap.get(ref);
	// console.log('map for', map)
	if (!map) {
		GlobalMap.set(ref, { banks: {} });
		map = GlobalMap.get(ref);
	}
	if (!(bank in map.banks)) map.banks[bank] = {};

	return map.banks[bank];
};

function createChainMap() {
	return {
		callbacks: [],
		pending: [],
	}
};

export function delayChain(that, keyname) {
	const map = GlobalGet(that, "delayChains");
	if (keyname in map) {
		for (const timeout of map[keyname].pending) {
			clearTimeout(timeout);
		}
		map[keyname].pending = [];
		map[keyname].callbacks = [];
	} else {
		map[keyname] = createChainMap();
	}
	const callTimeout = () => (map[keyname].callbacks.length > 0 ? map[keyname].callbacks.splice(0, 1)[0]() : false);
	const returnFunc = () => {
		return {
			then: (cb, delay) => {
				const cbfunc = () => {
					map[keyname].pending.push(
						setTimeout((_) => {
							cb();
							callTimeout();
						}, delay)
					);
				};
				map[keyname].callbacks.push(cbfunc);
				return returnFunc();
			},
		};
	};
	map[keyname].pending.push(setTimeout(callTimeout, 1));
	return returnFunc();
}

export function breakDelayChain(that, keyname) {
	const map = GlobalGet(that, "delayChains");
	if (keyname in map) {
		for (const timeout of map[keyname].pending) {
			clearTimeout(timeout);
		}
		map[keyname] = createChainMap();
	}
}

export function delay(that, keyname, ms, func) {
	// console.log(keyname, "delay", that);
	return new Promise((res, rej) => {
		const map = GlobalGet(that, "delays");
		if (keyname in map) clearTimeout(map[keyname].timeout);
		ms = ms || 0;
		if (func) map[keyname] = { func, timeout: setTimeout(() => res(func()), ms) };
		else map[keyname] = { func, timeout: setTimeout(res, ms) };
	});
}

export function clearDelay(that, ...keynames) {
	const map = GlobalGet(that, "delays");
	if (keynames.length > 1) {
		for (const keyname in keynames) {
			if (keyname in map) clearTimeout(map[keyname]?.timeout);
		}
	} else {
		clearTimeout(map[keynames[0]]?.timeout);
	}
}

// call an existing delay and clear it
export function instant(that, keyname) {
	const map = GlobalGet(that, "delays");
	if (keyname in map) {
		clearTimeout(map[keyname].timeout);
		map[keyname].func();
	}
}

// #########################################################################################

export function debounce(that, keyname, func, ms) {
	const map = GlobalGet(that, "debouncers");
	if (keyname in map) map[keyname](func);
	else {
		try {
			func();
			func = null;
		} catch (e) {
			throw new Error(e);
		}
		setTimeout((_) => {
			try {
				func && func();
			} catch (e) {
				throw new Error(e);
			}
			delete map[keyname];
		}, ms);
		map[keyname] = (newfunc) => (func = newfunc);
	}
}
