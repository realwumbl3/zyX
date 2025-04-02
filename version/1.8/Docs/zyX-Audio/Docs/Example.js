// Example usage of zyX-Audio

// Initialize audio system
const audio = new ZyXAudio('/audio/');

// Example 1: Basic sound playback
async function playSound() {
    await audio.addSound('click.mp3', 'sfx');
    audio.play({ name: 'click.mp3', volume: 0.5 });
}

// Example 2: Background music with fade effects
async function playBackgroundMusic() {
    await audio.playBackgroundMusic('background.mp3', {
        fadeIn: 2,
        fadeOut: 2,
        volume: 0.3,
        loop: true
    });
}

// Example 3: Sound effects with various options
async function playSoundEffect() {
    const source = await audio.play({
        name: 'explosion.mp3',
        volume: 0.8,
        playbackRate: 1.2,
        pan: -0.5, // Left side
        fadeIn: 0.1
    });
}

// Example 4: Looping sound with controls
async function playLoopingSound() {
    const sound = await audio.play({
        name: 'ambient.mp3',
        looping: true,
        volume: 0.4,
        category: 'ambient'
    });

    // Control the sound
    sound.setVolume(0.6);
    sound.setPlaybackRate(1.5);
    sound.setPan(0.5);
    sound.stop(); // Stop the loop
}

// Example 5: Audio filters
function setupAudioFilters() {
    audio.setupFilters();
    audio.setFilter('lowpass', 1000, 1);
    audio.setFilter('highpass', 100, 1);
    audio.setFilter('bandpass', 500, 2);
}

// Example 6: Volume control
async function controlVolume() {
    await audio.fadeVolume(0.5, 1); // Fade to 50% volume over 1 second
    audio.toggleMute(); // Mute/unmute
}

// Example 7: Category-based sound management
async function manageSounds() {
    // Stop all music
    audio.stopAll('music');
    
    // Stop all sound effects
    audio.stopAll('sfx');
    
    // Stop all ambient sounds
    audio.stopAll('ambient');
    
    // Stop all sounds
    audio.stopAll();
} 