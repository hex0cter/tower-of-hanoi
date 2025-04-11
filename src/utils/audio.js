// This file manages all audio-related functionality for the Tower of Hanoi game

class AudioManager {
    constructor() {
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.connect(this.audioContext.destination);
        
        // Create empty sounds object
        this.sounds = {};
        
        // Initialize mute state
        this.muted = localStorage.getItem('hanoi3d_muted') === 'true';
        
        // Create audio controls
        this.createAudioControls();
        
        // Update UI based on mute state
        this.updateMuteState();
        
        // Background music oscillators
        this.backgroundMusic = {
            isPlaying: false,
            oscillators: [],
            gainNode: null
        };
    }
    
    // Create and insert audio controls into the UI
    createAudioControls() {
        const audioControls = document.createElement('div');
        audioControls.id = 'audio-controls';
        audioControls.innerHTML = `
            <button id="toggle-music" class="audio-btn" title="Toggle Music">
                <span class="icon">🎵</span>
            </button>
            <button id="toggle-sound" class="audio-btn" title="Toggle Sound Effects">
                <span class="icon">🔊</span>
            </button>
        `;
        
        // Make sure the controls div exists
        const controlsDiv = document.querySelector('#controls');
        if (controlsDiv) {
            controlsDiv.appendChild(audioControls);
            
            // Add event listeners
            document.getElementById('toggle-music').addEventListener('click', () => this.toggleMusic());
            document.getElementById('toggle-sound').addEventListener('click', () => this.toggleMute());
        } else {
            console.warn('Could not find #controls element to append audio controls');
            // Create the controls div if it doesn't exist
            const gameContainer = document.querySelector('.game-container') || document.body;
            const newControlsDiv = document.createElement('div');
            newControlsDiv.id = 'controls';
            gameContainer.appendChild(newControlsDiv);
            newControlsDiv.appendChild(audioControls);
            
            // Add event listeners
            document.getElementById('toggle-music').addEventListener('click', () => this.toggleMusic());
            document.getElementById('toggle-sound').addEventListener('click', () => this.toggleMute());
        }
    }
    
    // Create a disk move sound (higher pitch)
    playDiskMove() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    // Create a disk place sound (lower pitch with more presence)
    playDiskPlace() {
        if (this.muted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    // Create a victory sound (ascending notes)
    playVictory() {
        if (this.muted) return;
        
        // Temporarily pause background music
        const wasPlaying = this.backgroundMusic.isPlaying;
        if (wasPlaying) {
            this.stopBackgroundMusic();
        }
        
        // Create victory sound
        const notes = [261.63, 329.63, 392.00, 523.25];  // C4, E4, G4, C5
        
        notes.forEach((frequency, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.2);
            gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + index * 0.2 + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.2 + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            oscillator.start(this.audioContext.currentTime + index * 0.2);
            oscillator.stop(this.audioContext.currentTime + index * 0.2 + 0.3);
        });
        
        // Resume background music after victory sound
        if (wasPlaying) {
            setTimeout(() => {
                if (!this.muted) {
                    this.startBackgroundMusic();
                }
            }, 1200);
        }
    }
    
    // Start simple background music
    startBackgroundMusic() {
        if (this.muted || this.backgroundMusic.isPlaying) return;
        
        // Clear any existing oscillators
        this.stopBackgroundMusic();
        
        // Create gain node for background music
        this.backgroundMusic.gainNode = this.audioContext.createGain();
        this.backgroundMusic.gainNode.gain.value = 0.1;
        this.backgroundMusic.gainNode.connect(this.masterGainNode);
        
        // Notes for a simple arpeggio (C major)
        const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];  // C4, E4, G4, C5, G4, E4
        const noteLength = 0.5;  // half second per note
        const totalLength = notes.length * noteLength;
        
        // Function to play the arpeggio pattern continuously
        const playArpeggio = (startTime) => {
            notes.forEach((freq, i) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                
                // Set envelope
                gainNode.gain.setValueAtTime(0, startTime + i * noteLength);
                gainNode.gain.linearRampToValueAtTime(0.1, startTime + i * noteLength + 0.1);
                gainNode.gain.linearRampToValueAtTime(0, startTime + (i + 1) * noteLength);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.backgroundMusic.gainNode);
                
                oscillator.start(startTime + i * noteLength);
                oscillator.stop(startTime + (i + 1) * noteLength);
                
                this.backgroundMusic.oscillators.push(oscillator);
            });
            
            // Schedule the next iteration
            setTimeout(() => {
                if (this.backgroundMusic.isPlaying) {
                    playArpeggio(this.audioContext.currentTime);
                }
            }, totalLength * 1000 - 50);
        };
        
        // Start playing
        this.backgroundMusic.isPlaying = true;
        playArpeggio(this.audioContext.currentTime);
    }
    
    // Stop background music
    stopBackgroundMusic() {
        if (!this.backgroundMusic.isPlaying) return;
        
        this.backgroundMusic.isPlaying = false;
        
        // Fade out any active oscillators
        if (this.backgroundMusic.gainNode) {
            this.fadeAudio(this.backgroundMusic.gainNode, this.backgroundMusic.gainNode.gain.value, 0, 500);
        }
        
        // Clear oscillators array
        this.backgroundMusic.oscillators = [];
    }
    
    // Toggle background music
    toggleMusic() {
        const btn = document.getElementById('toggle-music');
        
        if (this.backgroundMusic.isPlaying) {
            this.stopBackgroundMusic();
            btn.querySelector('.icon').textContent = '🎵❌';
        } else {
            this.startBackgroundMusic();
            btn.querySelector('.icon').textContent = '🎵';
        }
    }
    
    // Toggle all sound effects and music
    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('hanoi3d_muted', this.muted);
        this.updateMuteState();
    }
    
    // Update UI and audio state based on mute setting
    updateMuteState() {
        const soundBtn = document.getElementById('toggle-sound');
        const musicBtn = document.getElementById('toggle-music');
        
        if (!soundBtn || !musicBtn) return;
        
        if (this.muted) {
            soundBtn.querySelector('.icon').textContent = '🔇';
            musicBtn.querySelector('.icon').textContent = '🎵❌';
            this.stopBackgroundMusic();
            this.masterGainNode.gain.value = 0;
        } else {
            soundBtn.querySelector('.icon').textContent = '🔊';
            musicBtn.querySelector('.icon').textContent = '🎵';
            this.masterGainNode.gain.value = 1;
        }
    }
    
    // Utility function to fade audio volume
    fadeAudio(gainNode, startVolume, endVolume, duration, callback) {
        const startTime = this.audioContext.currentTime;
        const endTime = startTime + duration / 1000;
        
        gainNode.gain.setValueAtTime(startVolume, startTime);
        gainNode.gain.linearRampToValueAtTime(endVolume, endTime);
        
        if (callback) {
            setTimeout(callback, duration);
        }
    }
}

// Create a singleton instance
const audioManager = new AudioManager();
export default audioManager;
