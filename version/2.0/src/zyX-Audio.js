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
        this.backgroundMusicPosition = 0;  // Store current playback position for pausing/resuming
        this.isChangingBackgroundMusic = false;  // Flag to track if we're in the middle of changing music
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
     * @returns {Promise<AudioBuffer>} The loaded audio buffer
     * @throws {Error} If audio loading or decoding fails
     */
    async addSound(file_name) {
        return new Promise((resolve, reject) => {
            if (Object.keys(this.SOUNDS).includes(file_name)) {
                return resolve();
            }

            let xhr = new XMLHttpRequest();
            xhr.onload = (e) => {
                this.ctx.decodeAudioData(
                    e.target.response,
                    (b) => {
                        this.SOUNDS[file_name] = b;
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

        // If we're already changing music, cancel the request
        if (this.isChangingBackgroundMusic) {
            console.log("Already changing background music, ignoring new request");
            return;
        }

        this.isChangingBackgroundMusic = true;

        try {
            // Fade out and stop current music if it exists
            if (this.backgroundMusic) {
                console.log("Fading out background music", fadeOut);

                // Directly fade out using the gain node
                const startTime = this.ctx.currentTime;
                this.gainNode.gain.setTargetAtTime(0, startTime, fadeOut / 3); // Time constant is duration/3 for ~95% completion

                // Wait for fade out
                await new Promise(resolve => setTimeout(resolve, fadeOut * 1000));

                // Now stop the old music
                if (this.backgroundMusic) {
                    this.stop(this.backgroundMusic);
                    this.backgroundMusic = null;
                }
            }

            // Load the sound if needed
            await this.addSound(name);

            // Create a new buffer source with NO onended callback that would trigger recursion
            const source = this.ctx.createBufferSource();
            source.buffer = this.SOUNDS[name];

            // Connect to gain node
            if (!this.filtersEnabled) {
                source.connect(this.gainNode);
            } else {
                this.setupFilters();
                source.connect(this.filters.lowpass);
            }

            // Add to active sources
            this.activeSources.add(source);

            // Configure looping on the source itself (Web Audio API handles this internally)
            source.loop = loop;

            // Set initial volume to 0 for fade-in
            this.gainNode.gain.value = 0;

            // Start playback
            source.start(0);
            this.backgroundMusic = source;

            // Fade in the volume
            console.log("Fading in background music", fadeIn);
            const startTime = this.ctx.currentTime;
            this.gainNode.gain.setTargetAtTime(
                calculateLogarithmicVolume(volume),
                startTime,
                fadeIn / 3 // Time constant is duration/3 for ~95% completion
            );

            // Wait for fade in to complete
            await new Promise(resolve => setTimeout(resolve, fadeIn * 1000));
        } finally {
            // Reset the flag when we're done
            this.isChangingBackgroundMusic = false;
        }
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
     * @param {Function} [options.onEnded] - Callback when sound playback ends
     * @returns {Promise<AudioBufferSourceNode>} The playing audio source
     */
    async play({ source, name, looping = false, delay = 0, volume = 1, n = 0,
        playbackRate = 1, pan = 0, fadeIn = 0, onEnded = null } = {}) {
        await this.addSound(name);
        volume = this.muted ? 0 : volume;
        if (volume === 0) return;

        // Set initial volume based on fadeIn parameter
        if (fadeIn > 0) {
            // Start with zero volume if fading in
            this.gainNode.gain.value = 0;
        } else {
            // Set to target volume immediately if not fading
            this.gainNode.gain.value = calculateLogarithmicVolume(volume);
        }

        if (looping || n) {
            looping = true;
            let repeat_count = n-- > 0;
            let internalLoopOnEnded = () => {
                // Call user's onEnded callback if provided
                if (onEnded) {
                    onEnded();
                }

                if (!looping || (repeat_count && n-- <= 0)) {
                    // If we're done looping, call onEnded one last time
                    if (onEnded && (repeat_count && n < 0)) {
                        onEnded(true); // Pass true to indicate final loop ended
                    }
                    return;
                }

                setTimeout((_) => {
                    source = this.createAndExecute(name, internalLoopOnEnded);
                    this.setPlaybackRate(source, playbackRate);
                    this.setStereoPan(source, pan);
                }, delay);
            };
            source = this.createAndExecute(name, internalLoopOnEnded);
            this.setPlaybackRate(source, playbackRate);
            this.setStereoPan(source, pan);

            // Apply fade-in if needed
            if (fadeIn > 0) {
                this.fadeVolume(volume, fadeIn);
            }

            return {
                source,
                stop: () => (looping = false),
                setPlaybackRate: (rate) => this.setPlaybackRate(source, rate),
                setPan: (pan) => this.setStereoPan(source, pan),
                setVolume: (vol) => this.fadeVolume(vol)
            };
        } else {
            // Set up the onended handler that incorporates the user callback
            const handleOnEnded = () => {
                if (onEnded) {
                    onEnded();
                }
                this.stop(newSource);
            };

            // Create the source with our wrapped callback
            const newSource = this.createBuffer(name, handleOnEnded);
            newSource.start(0);

            this.setPlaybackRate(newSource, playbackRate);
            this.setStereoPan(newSource, pan);

            // Apply fade-in if needed
            if (fadeIn > 0) {
                this.fadeVolume(volume, fadeIn);
            }

            return newSource;
        }
    }

    /**
     * Stop all playing sounds
     */
    stopAll() {
        this.activeSources.forEach(source => this.stop(source));
    }

    /**
     * Pause all playing sounds
     */
    pauseAll() {
        this.activeSources.forEach(source => {
            if (source.stop) source.stop();
        });
    }

    /**
     * Pause the currently playing background music
     * @param {number} [fadeOut=0.5] - Fade-out duration in seconds before pausing
     * @returns {Promise<boolean>} True if music was paused, false if no music was playing
     */
    async pauseBackgroundMusic(fadeOut = 0.5) {
        if (!this.backgroundMusic || this.isChangingBackgroundMusic) {
            return false;
        }

        this.isChangingBackgroundMusic = true;

        try {
            // Store the current time position for potential resume later
            this.backgroundMusicPosition = this.ctx.currentTime - this.backgroundMusic.startTime;

            // Fade out smoothly
            if (fadeOut > 0) {
                const startTime = this.ctx.currentTime;
                this.gainNode.gain.setTargetAtTime(0, startTime, fadeOut / 3);
                await new Promise(resolve => setTimeout(resolve, fadeOut * 1000));
            }

            // Suspend the audio context to "pause" all audio
            if (this.ctx.state === 'running') {
                await this.ctx.suspend();
            }

            return true;
        } finally {
            this.isChangingBackgroundMusic = false;
        }
    }

    /**
     * Resume the previously paused background music
     * @param {number} [fadeIn=0.5] - Fade-in duration in seconds
     * @param {number} [volume=0.5] - Target volume to fade in to
     * @returns {Promise<boolean>} True if music was resumed, false if no music was paused
     */
    async resumeBackgroundMusic(fadeIn = 0.5, volume = 0.5) {
        if (!this.backgroundMusic || this.isChangingBackgroundMusic) {
            return false;
        }

        this.isChangingBackgroundMusic = true;

        try {
            // Resume the audio context
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }

            // Reset volume and fade in
            if (fadeIn > 0) {
                this.gainNode.gain.value = 0;
                const startTime = this.ctx.currentTime;
                this.gainNode.gain.setTargetAtTime(
                    calculateLogarithmicVolume(volume),
                    startTime,
                    fadeIn / 3
                );
                await new Promise(resolve => setTimeout(resolve, fadeIn * 1000));
            } else {
                this.gainNode.gain.value = calculateLogarithmicVolume(volume);
            }

            return true;
        } finally {
            this.isChangingBackgroundMusic = false;
        }
    }

    /**
     * Stop the currently playing background music
     * @param {number} [fadeOut=0.5] - Fade-out duration in seconds before stopping
     * @returns {Promise<boolean>} True if music was stopped, false if no music was playing
     */
    async stopBackgroundMusic(fadeOut = 0.5) {
        if (!this.backgroundMusic || this.isChangingBackgroundMusic) {
            return false;
        }

        this.isChangingBackgroundMusic = true;

        try {
            // Fade out smoothly
            if (fadeOut > 0) {
                const startTime = this.ctx.currentTime;
                this.gainNode.gain.setTargetAtTime(0, startTime, fadeOut / 3);
                await new Promise(resolve => setTimeout(resolve, fadeOut * 1000));
            }

            // Stop and clean up the background music source
            this.stop(this.backgroundMusic);
            this.backgroundMusic = null;
            this.backgroundMusicPosition = 0;

            return true;
        } finally {
            this.isChangingBackgroundMusic = false;
        }
    }

    /**
     * Check if background music is currently playing
     * @returns {boolean} True if music is playing, false otherwise
     */
    isMusicPlaying() {
        // Check if we have a background music source and the audio context is running
        return this.backgroundMusic !== null && this.ctx.state === 'running';
    }

    /**
     * Check the state of background music
     * @returns {string} 'playing', 'paused', or 'stopped'
     */
    getMusicState() {
        if (!this.backgroundMusic) {
            return 'stopped';
        }

        return this.ctx.state === 'running' ? 'playing' : 'paused';
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