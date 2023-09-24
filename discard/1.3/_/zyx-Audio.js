export default class zyxAudio {
	constructor(audio_root) {
		this.AUDIO_ROOT = audio_root;
		this.ctx = new AudioContext();
		this.gainNode = this.ctx.createGain();
		this.gainNode.gain.value = 1.0;
		this.gainNode.connect(this.ctx.destination);
		this.SOUNDS = {};
	}

	add_sound(file_name) {
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

	async play({ name, looping = false, delay = null, volume = 1, loopOnEnded } = {}) {
		await this.add_sound(name);
		this.gainNode.gain.value = volume;
		if (looping) {
			let source = this.createAndExecute(name);
			loopOnEnded = () => {
				if (!looping) return;
				setTimeout((_) => {
					source = this.createAndExecute(name, loopOnEnded);
				}, delay || 0);
			};
			source = this.createAndExecute(name, loopOnEnded);
			return {
				source,
				stop: () => (looping = false),
			};
		} else {
			this.createAndExecute(name);
		}
	}
}
