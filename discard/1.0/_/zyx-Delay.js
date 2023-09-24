const GlobalMap = new Map();

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

const createChainMap = () => {
	return new Object({
		callbacks: [],
		pending: [],
	});
};

export function delayChain(keyname){
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

export function breakDelayChain(keyname) {
    const map = GlobalGet(that, "delayChains");
    if (keyname in map) {
        for (const timeout of map[keyname].pending) {
            clearTimeout(timeout);
        }
        map[keyname] = createChainMap();
    }
}

export function delay(keyname, ms, func) {
    return new Promise((res, rej) => {
        const map = GlobalGet(that, "delays");
        if (keyname in map) clearTimeout(map[keyname]);
        if (!ms) return;
        if (func) map[keyname] = setTimeout(() => res(func()), ms);
        else map[keyname] = setTimeout(res, ms);
        return map[keyname];
    });
}

export function clearDelay(...keynames) {
    const map = GlobalGet(that, "delays");
    for (const keyname in keynames) if (keyname in map) clearTimeout(map[keyname]);
    return false;
}