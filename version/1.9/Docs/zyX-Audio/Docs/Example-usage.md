# zyX-Audio Module Documentation

## Overview
The zyX-Audio module provides a comprehensive audio management system for web applications, supporting sound effects, background music, audio filters, and advanced playback controls.

## Class: ZyXAudio

### Constructor
```javascript
new ZyXAudio(audio_root)
```
**Parameters:**
- `audio_root` (string): Base URL for audio files

### Methods

#### Sound Management
- `addSound(file_name, category = 'sfx')`: Add a new sound to the audio system
- `stop(source)`: Stop and cleanup an audio source
- `stopAll(category = null)`: Stop all playing sounds, optionally filtered by category
- `pauseAll()`: Pause all playing sounds
- `resumeAll()`: Resume all paused sounds

#### Playback Control
- `createBuffer(name, onended)`: Create an audio buffer source
- `createAndExecute(name, onended)`: Create and start playing an audio buffer
- `play(options)`: Play a sound with various options
  - `source`: Existing audio source
  - `name`: Sound file name
  - `looping`: Whether to loop the sound
  - `delay`: Delay before playing
  - `volume`: Playback volume
  - `playbackRate`: Playback speed
  - `pan`: Stereo panning
  - `fadeIn`: Fade-in duration
  - `category`: Sound category

#### Background Music
- `playBackgroundMusic(name, options)`: Play background music with fade effects
- `fadeOutBackgroundMusic(duration = 2)`: Fade out current background music

#### Volume Control
- `toggleMute()`: Toggle audio muting
- `fadeVolume(targetVolume, duration = 1)`: Smoothly change volume

#### Audio Effects
- `setPlaybackRate(source, rate)`: Change playback speed
- `setStereoPan(source, pan)`: Adjust stereo panning
- `setFilter(type, frequency, Q = 1)`: Apply audio filters
- `setupFilters()`: Initialize audio filter chain

#### Time Control
- `getCurrentTime(source)`: Get current playback position
- `seek(source, time)`: Seek to specific time in audio

### Categories
Sounds can be categorized as:
- `music`: Background music
- `sfx`: Sound effects
- `ambient`: Ambient sounds

## Usage Examples

See `Example.js` for working code examples of each function. 