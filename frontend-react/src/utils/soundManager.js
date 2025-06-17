// frontend-react/src/utils/soundManager.js
// Handles loading and playing UI sounds
class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.volume = 0.5;
    this.loadSounds();
  }

  loadSounds() {
    const soundFiles = {
      // Move sounds
      'move': '/assets/sounds/moves/move.mp3',
      'capture': '/assets/sounds/moves/capture.mp3',
      'castle': '/assets/sounds/moves/castle.mp3',
      'check': '/assets/sounds/moves/check.mp3',
      'checkmate': '/assets/sounds/moves/checkmate.mp3',
      'promotion': '/assets/sounds/moves/promotion.mp3',
      
      // UI sounds
      'click': '/assets/sounds/ui/click.mp3',
      'hover': '/assets/sounds/ui/hover.mp3',
      'success': '/assets/sounds/notifications/success.mp3',
      'error': '/assets/sounds/notifications/error.mp3',
      'notification': '/assets/sounds/notifications/notification.mp3',
      
      // Game sounds
      'gameStart': '/assets/sounds/game/start.mp3',
      'gameEnd': '/assets/sounds/game/end.mp3',
      'draw': '/assets/sounds/game/draw.mp3'
    };

    // Preload all sounds
    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = this.volume;
      
      // Handle loading errors gracefully
      audio.addEventListener('error', () => {
        console.warn(`Failed to load sound: ${name}`);
      });
      
      this.sounds.set(name, audio);
    });
  }

  play(soundName, volume = null) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(soundName);
    if (!sound) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    try {
      // Clone the audio to allow overlapping sounds
      const audioClone = sound.cloneNode();
      audioClone.volume = volume !== null ? volume : this.volume;
      
      // Reset to beginning if already playing
      audioClone.currentTime = 0;
      
      const playPromise = audioClone.play();
      
      // Handle autoplay restrictions
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Audio playback failed:', error);
        });
      }
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Chess-specific sound helpers
  playMoveSound(moveType, isCapture = false) {
    if (isCapture) {
      this.play('capture');
    } else {
      switch (moveType) {
        case 'castle':
          this.play('castle');
          break;
        case 'promotion':
          this.play('promotion');
          break;
        case 'check':
          this.play('check');
          break;
        case 'checkmate':
          this.play('checkmate');
          break;
        default:
          this.play('move');
      }
    }
  }

  playUISound(type) {
    this.play(type);
  }

  playGameSound(type) {
    this.play(type);
  }
}

// Create singleton instance
export const soundManager = new SoundManager();
export default soundManager;