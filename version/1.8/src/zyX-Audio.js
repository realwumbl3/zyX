/**
 * @module zyX-Audio
 * @description A comprehensive audio management system for web applications.
 * Provides functionality for sound effects, background music, audio filters, and playback controls.
 */

// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.

// #endregion

/**
 * @class ZyXAudio
 * @description Main class for managing audio playback and effects
 */
export default class ZyXAudio {
    /**
     * Create a new ZyXAudio instance
     * @param {string} audio_root - Base URL for audio files
     */
    constructor(audio_root) {
        this.AUDIO_ROOT = audio_root;
        this.ctx = new AudioContext();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 1.0;
        this.gainNode.connect(this.ctx.destination);
        this.SOUNDS = {};
        this.muted = false;
        this.activeSources = new Set();
        this.backgroundMusic = null;
        this.categories = {
            music: new Set(),
            sfx: new Set(),
            ambient: new Set()
        };
        this.filters = null;
        this.filtersEnabled = false;
    }

    /**
     * Set up audio filters for processing
     * @private
     */
    setupFilters() {
        if (this.filters) return;

        this.filters = {
            lowpass: this.ctx.createBiquadFilter(),
            highpass: this.ctx.createBiquadFilter(),
            bandpass: this.ctx.createBiquadFilter()
        };

        // Setup filter chain
        this.filters.lowpass.type = 'lowpass';
        this.filters.highpass.type = 'highpass';
        this.filters.bandpass.type = 'bandpass';

        // Set neutral filter values
        this.filters.lowpass.frequency.value = 20000;  // Effectively bypass
        this.filters.highpass.frequency.value = 20;    // Effectively bypass
        this.filters.bandpass.frequency.value = 1000;  // Center frequency
        this.filters.bandpass.Q.value = 1;             // Neutral Q

        // Connect filters in series
        this.filters.lowpass.connect(this.filters.highpass);
        this.filters.highpass.connect(this.filters.bandpass);
        this.filters.bandpass.connect(this.gainNode);
    }

    /**
     * Add a new sound to the audio system
     * @param {string} file_name - Name of the audio file
     * @param {string} [category='sfx'] - Category of the sound (music, sfx, ambient)
     * @returns {Promise<AudioBuffer>} The loaded audio buffer
     * @throws {Error} If audio loading or decoding fails
     */
    async addSound(file_name, category = 'sfx') {
        return new Promise((resolve, reject) => {
            if (Object.keys(this.SOUNDS).includes(file_name)) {
                this.categories[category].add(file_name);
                return resolve();
            }

            let xhr = new XMLHttpRequest();
            xhr.onload = (e) => {
                this.ctx.decodeAudioData(
                    e.target.response,
                    (b) => {
                        this.SOUNDS[file_name] = b;
                        this.categories[category].add(file_name);
                        resolve(this.SOUNDS[file_name]);
                    },
                    (e) => {
                        reject(new Error(`Failed to decode audio data: ${e.message}`));
                    }
                );
            };
            xhr.onerror = () => reject(new Error(`Failed to load audio file: ${file_name}`));
            xhr.open("GET", this.AUDIO_ROOT + file_name, true);
            xhr.responseType = "arraybuffer";
            xhr.send();
        });
    }

    /**
     * Stop and cleanup an audio source
     * @param {AudioBufferSourceNode} source - The audio source to stop
     */
    stop(source) {
        if (source.stop) source.stop();
        if (source.disconnect) source.disconnect();
        this.activeSources.delete(source);
    }

    /**
     * Toggle audio muting
     * @returns {boolean} Current mute state
     */
    toggleMute() {
        this.muted = !this.muted;
        this.gainNode.gain.value = this.muted ? 0 : 1;
        return this.muted;
    }

    /**
     * Create an audio buffer source
     * @param {string} name - Name of the sound to play
     * @param {Function} [onended] - Callback when playback ends
     * @returns {AudioBufferSourceNode} The created audio source
     */
    createBuffer(name, onended) {
        const source = this.ctx.createBufferSource();
        source.buffer = this.SOUNDS[name];

        // Connect directly to gain node if filters are not enabled
        if (!this.filtersEnabled) {
            source.connect(this.gainNode);
        } else {
            this.setupFilters();
            source.connect(this.filters.lowpass);
        }

        if (!onended) {
            onended = () => {
                this.stop(source);
            };
        }
        source.onended = () => onended();

        this.activeSources.add(source);
        return source;
    }

    /**
     * Create and start playing an audio buffer
     * @param {string} name - Name of the sound to play
     * @param {Function} [onended] - Callback when playback ends
     * @returns {AudioBufferSourceNode} The playing audio source
     */
    createAndExecute(name, onended) {
        return this.createBuffer(name, onended).start(0);
    }

    /**
     * Smoothly change volume over time
     * @param {number} targetVolume - Target volume level (0-1)
     * @param {number} [duration=1] - Duration of the fade in seconds
     * @returns {Promise<void>}
     */
    async fadeVolume(targetVolume, duration = 1) {
        const startVolume = this.gainNode.gain.value;
        const startTime = this.ctx.currentTime;

        this.gainNode.gain.setTargetAtTime(
            calculateLogarithmicVolume(targetVolume),
            startTime,
            duration
        );
    }

    /**
     * Play background music with fade effects
     * @param {string} name - Name of the music file
     * @param {Object} [options] - Playback options
     * @param {number} [options.fadeIn=2] - Fade-in duration in seconds
     * @param {number} [options.fadeOut=2] - Fade-out duration in seconds
     * @param {number} [options.volume=0.5] - Playback volume (0-1)
     * @param {boolean} [options.loop=true] - Whether to loop the music
     * @returns {Promise<void>}
     */
    async playBackgroundMusic(name, options = {}) {
        const {
            fadeIn = 2,
            fadeOut = 2,
            volume = 0.5,
            loop = true
        } = options;

        if (this.backgroundMusic) {
            await this.fadeOutBackgroundMusic(fadeOut);
        }

        await this.addSound(name, 'music');
        const source = this.createBuffer(name, () => {
            if (loop) {
                this.playBackgroundMusic(name, options);
            }
        });

        source.loop = loop;
        source.start(0);
        this.backgroundMusic = source;
        await this.fadeVolume(volume, fadeIn);
    }

    /**
     * Fade out current background music
     * @param {number} [duration=2] - Fade-out duration in seconds
     * @returns {Promise<void>}
     */
    async fadeOutBackgroundMusic(duration = 2) {
        if (!this.backgroundMusic) return;

        const startVolume = this.gainNode.gain.value;
        const startTime = this.ctx.currentTime;

        this.gainNode.gain.setTargetAtTime(0, startTime, duration);

        await new Promise(resolve => setTimeout(resolve, duration * 1000));
        this.stop(this.backgroundMusic);
        this.backgroundMusic = null;
        this.gainNode.gain.value = startVolume;
    }

    /**
     * Set playback rate for an audio source
     * @param {AudioBufferSourceNode} source - The audio source
     * @param {number} rate - Playback rate multiplier
     */
    setPlaybackRate(source, rate) {
        if (source && source.playbackRate) {
            source.playbackRate.value = rate;
        }
    }

    /**
     * Set stereo panning for an audio source
     * @param {AudioBufferSourceNode} source - The audio source
     * @param {number} pan - Pan value (-1 to 1)
     */
    setStereoPan(source, pan) {
        if (source && source.pan) {
            source.pan.value = Math.max(-1, Math.min(1, pan));
        }
    }

    /**
     * Apply audio filter settings
     * @param {string} type - Filter type (lowpass, highpass, bandpass)
     * @param {number} frequency - Filter frequency
     * @param {number} [Q=1] - Filter Q factor
     */
    setFilter(type, frequency, Q = 1) {
        const filter = this.filters[type];
        if (filter) {
            filter.frequency.value = frequency;
            filter.Q.value = Q;
        }
    }

    /**
     * Play a sound with various options
     * @param {Object} options - Playback options
     * @param {AudioBufferSourceNode} [options.source] - Existing audio source
     * @param {string} options.name - Sound file name
     * @param {boolean} [options.looping=false] - Whether to loop the sound
     * @param {number} [options.delay=0] - Delay before playing
     * @param {number} [options.volume=1] - Playback volume
     * @param {Function} [options.loopOnEnded] - Callback when loop ends
     * @param {number} [options.n=0] - Number of times to loop
     * @param {number} [options.playbackRate=1] - Playback speed
     * @param {number} [options.pan=0] - Stereo panning
     * @param {number} [options.fadeIn=0] - Fade-in duration
     * @param {string} [options.category='sfx'] - Sound category
     * @returns {Promise<AudioBufferSourceNode>} The playing audio source
     */
    async play({ source, name, looping = false, delay = 0, volume = 1, loopOnEnded, n = 0,
        playbackRate = 1, pan = 0, fadeIn = 0, category = 'sfx' } = {}) {
        await this.addSound(name, category);
        volume = this.muted ? 0 : volume;
        if (volume === 0) return;

        if (fadeIn > 0) {
            this.gainNode.gain.value = 0;
            this.gainNode.gain.setTargetAtTime(
                calculateLogarithmicVolume(volume),
                this.ctx.currentTime,
                fadeIn
            );
        } else {
            this.gainNode.gain.value = calculateLogarithmicVolume(volume);
        }

        if (looping || n) {
            looping = true;
            let repeat_count = n-- > 0;
            loopOnEnded = () => {
                if (!looping || (repeat_count && n-- <= 0)) return;
                setTimeout((_) => {
                    source = this.createAndExecute(name, loopOnEnded);
                    this.setPlaybackRate(source, playbackRate);
                    this.setStereoPan(source, pan);
                }, delay);
            };
            source = this.createAndExecute(name, loopOnEnded);
            this.setPlaybackRate(source, playbackRate);
            this.setStereoPan(source, pan);
            return {
                source,
                stop: () => (looping = false),
                setPlaybackRate: (rate) => this.setPlaybackRate(source, rate),
                setPan: (pan) => this.setStereoPan(source, pan),
                setVolume: (vol) => this.fadeVolume(vol)
            };
        } else {
            const newSource = this.createAndExecute(name);
            this.setPlaybackRate(newSource, playbackRate);
            this.setStereoPan(newSource, pan);
            return newSource;
        }
    }

    /**
     * Stop all playing sounds
     * @param {string} [category] - Category of sounds to stop
     */
    stopAll(category = null) {
        if (category) {
            this.categories[category].forEach(name => {
                const source = this.activeSources.find(s => s.buffer === this.SOUNDS[name]);
                if (source) this.stop(source);
            });
        } else {
            this.activeSources.forEach(source => this.stop(source));
        }
    }

    /**
     * Pause all playing sounds
     */
    pauseAll() {
        this.activeSources.forEach(source => {
            if (source.stop) source.stop();
        });
    }

    getCurrentTime(source) {
        return source ? source.context.currentTime - source.startTime : 0;
    }

    seek(source, time) {
        if (source && source.buffer) {
            source.stop();
            source.start(0, time);
        }
    }
}

/**
 * Calculate logarithmic volume
 * @param {number} volume - Volume level (0-1)
 * @returns {number} Logarithmic volume
 */
function calculateLogarithmicVolume(volume) {
    if (volume <= 0) {
        return 0;
    } else if (volume >= 1) {
        return 1;
    } else {
        return Math.pow(volume, 3);
    }
}