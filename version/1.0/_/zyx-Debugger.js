const DEBUG_TIMERS = {};
function debugStart(name, title) {
	DEBUG_TIMERS[name] = {
		title,
		start: performance.now(),
		chkpoints: [],
	};
}
function debugCheckpoint(name, chkpoint) {
	const TIMER = DEBUG_TIMERS[name];
	TIMER.chkpoints.push({
		chkpoint,
		timeSinceStart: (performance.now() - TIMER.start).toFixed(1),
	});
}
function debugLog(name, { min, dump } = {}) {
	const TIMER = DEBUG_TIMERS[name];
	let title = name;
	if (min) {
		const overMin = TIMER.chkpoints.filter((_) => _.timeSinceStart > min);
		if (overMin.length < 1) return;
	}
	if (TIMER?.title) title += TIMER?.title;
	console.group(title);
	for (const chkpoint of TIMER.chkpoints) {
		console.log(`Checkpoint: ${chkpoint.chkpoint}, time since start: %c${chkpoint.timeSinceStart}ms`, timerColors(chkpoint.timeSinceStart));
	}
	if (dump) {
		console.log("dump", dump);
		console.trace();
	}
	console.groupEnd();
}

function timerColors(time) {
	return `color:${time <= 1 ? "green" : time <= 3 ? "yellow" : time <= 5 ? "orange" : "red"}`;
}

export { debugStart, debugCheckpoint, debugLog };
