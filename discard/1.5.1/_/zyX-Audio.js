// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.

// #endregion

export default class ZyXAudio {
	constructor(audio_root) {
		this.AUDIO_ROOT = audio_root;
		this.ctx = new AudioContext();
		this.gainNode = this.ctx.createGain();
		this.gainNode.gain.value = 1.0;
		this.gainNode.connect(this.ctx.destination);
		this.SOUNDS = {};
		this.muted = false;
	}

	addSound(file_name) {
		return new Promise((resolve, reject) => {
			if (Object.keys(this.SOUNDS).includes(file_name)) return resolve();
			let xhr = new XMLHttpRequest();
			xhr.onload = (e) => {
				this.ctx.decodeAudioData(
					e.target.response,
					(b) => {
						this.SOUNDS[file_name] = b;
						resolve(this.SOUNDS[file_name]);
					},
					(e) => {
						reject(e);
					}
				);
			};
			xhr.open("GET", this.AUDIO_ROOT + file_name, true);
			xhr.responseType = "arraybuffer";
			xhr.send();
		});
	}

	stop(source) {
		if (source.stop) source.stop();
		if (source.disconnect) source.disconnect();
	}

	toggleMute() {
		this.muted = !this.muted;
		return this.muted;
	}

	createBuffer(name, onended) {
		const source = this.ctx.createBufferSource();
		source.buffer = this.SOUNDS[name];
		source.connect(this.gainNode);
		if (!onended)
			onended = () => {
				this.stop(source);
			};
		else {
			source.onended = () => onended();
		}
		return source;
	}

	createAndExecute(name, onended) {
		return this.createBuffer(name, onended).start(0);
	}

	async play({ source, name, looping = false, delay = 0, volume = 1, loopOnEnded, n = 0 } = {}) {
		// fetch sound if not already fetched, caching it in this.SOUNDS.
		await this.addSound(name);
		volume = this.muted ? 0 : volume;
		if (volume === 0) return;
		// Set volume
		this.gainNode.gain.value = calculateLogarithmicVolume(volume);
		if (looping || n) {
			looping = true;
			// If n is set, decrement n and check if it is still greater than 0.
			let repeat_count = n-- > 0;
			// If loopOnEnded is not set, create a default loopOnEnded function.
			loopOnEnded = () => {
				// If looping is false or n is set and n is less than or equal to 0, break loop.
				if (!looping || (repeat_count && n-- <= 0)) return;
				// If delay is set, wait for delay before looping
				setTimeout((_) => {
					// Create and execute the sound.
					source = this.createAndExecute(name, loopOnEnded);
				}, delay);
			};
			// Create and execute the sound.
			source = this.createAndExecute(name, loopOnEnded);
			return {
				source,
				stop: () => (looping = false),
			};
		} else {
			// If looping or n is not set, create and execute the sound emmediately.
			this.createAndExecute(name);
		}
	}
}

function calculateLogarithmicVolume(volume) {
	if (volume <= 0) {
		return 0;
	} else if (volume >= 1) {
		return 1;
	} else {
		return Math.pow(volume, 3);
	}
}