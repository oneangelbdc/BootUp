import { Audio } from 'expo-av';

const AudioManager = {
  sfxVolume: 0.8,
  bgmVolume: 0.35,
  bgmSound: null,
  currentBGM: null,

  async playSFX(source) {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        source,
        { volume: this.sfxVolume, shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          try { await sound.unloadAsync(); } catch (_) {}
        }
      });
    } catch (e) {
      console.log('SFX error:', e);
    }
  },

  async playBGM(source, options = {}) {
    try {
      if (this.currentBGM === source && this.bgmSound) {
        const status = await this.bgmSound.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await this.bgmSound.playAsync();
        }
        return;
      }

      if (this.bgmSound) {
        await this.stopBGM();
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        source,
        { isLooping: true, shouldPlay: true, volume: this.bgmVolume, ...options }
      );

      this.bgmSound = sound;
      this.currentBGM = source;
    } catch (e) {
      console.log('BGM error:', e);
    }
  },

  async stopBGM() {
    if (!this.bgmSound) return;
    try {
      await this.bgmSound.stopAsync();
      await this.bgmSound.unloadAsync();
    } catch (_) {}
    this.bgmSound = null;
    this.currentBGM = null;
  },

  async pauseBGM() {
    if (!this.bgmSound) return;
    try { await this.bgmSound.pauseAsync(); } catch (_) {}
  },

  async resumeBGM() {
    if (!this.bgmSound) return;
    try { await this.bgmSound.playAsync(); } catch (_) {}
  },

  async setBgmVolume(value) {
    this.bgmVolume = Math.max(0, Math.min(1, value));
    if (this.bgmSound) {
      try { await this.bgmSound.setVolumeAsync(this.bgmVolume); } catch (_) {}
    }
  },

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(1, value));
  },

  playTap()      { this.playSFX(require('../assets/sounds/sfx_tap.mp3')); },
  playCorrect()  { this.playSFX(require('../assets/sounds/sfx_correct.mp3')); },
  playWrong()    { this.playSFX(require('../assets/sounds/sfx_wrong.mp3')); },
  playComplete() { this.playSFX(require('../assets/sounds/sfx_complete.mp3')); },
};

export default AudioManager;