const DEBUG_TIMERS = new WeakMap();

function debugStart(ref, title) {
	DEBUG_TIMERS.set(ref, {
		title,
		start: performance.now(),
		chkpoints: [{ chkpoint: "start", timeSinceStart: "00000" }],
	})
}

function debugCheckpoint(ref, chkpoint) {
	const TIMER = DEBUG_TIMERS.get(ref);
	TIMER.chkpoints.push({
		chkpoint,
		timeSinceStart: ((performance.now() - TIMER.start) * 1000).toFixed().padStart(5, "0"),
	});
}

function debugLog(ref, { label, min, dump } = {}) {
	const TIMER = DEBUG_TIMERS.get(ref);
	if (min) {
		const overMin = TIMER.chkpoints.filter((_) => _.timeSinceStart > min);
		if (overMin.length < 1) return;
	}
	console.group(TIMER.title);
	for (const chkpoint of TIMER.chkpoints) {
		console.log(`%c[${chkpoint.timeSinceStart}ns] [Checkpoint:${chkpoint.chkpoint}]`, timerColors(chkpoint.timeSinceStart));
	}
	const finish = ((performance.now() - TIMER.start) * 1000).toFixed().padStart(5, "0");
	console.log(`%c[${finish}ns] [Finish:${label}]  `, timerColors(finish));
	if (dump) console.log("Return:", dump);
	console.groupEnd();
	DEBUG_TIMERS.delete(ref);
}

function timerColors(time) {
	return `color:${time <= 100 ? "green" : time <= 300 ? "yellow" : time <= 500 ? "orange" : "red"}`;
}

export { debugStart, debugCheckpoint, debugLog };
