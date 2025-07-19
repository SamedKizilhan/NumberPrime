import { Audio, AudioMode, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

class SoundManager {
  private static instance: SoundManager;
  private backgroundMusic: Audio.Sound | null = null;
  private buttonSound: Audio.Sound | null = null;
  private explosionSound: Audio.Sound | null = null;
  private primeExplosionSound: Audio.Sound | null = null;
  private moveSound: Audio.Sound | null = null;
  private dropSound: Audio.Sound | null = null;
  
  private isMuted: boolean = false;
  private musicVolume: number = 0.3; // %30 ses seviyesi
  private effectsVolume: number = 0.9; // %90 ses seviyesi

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async initialize() {
    try {
      // Audio modunu ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      } as AudioMode);

      // Ses dosyalarını yükle
      await this.loadSounds();
    } catch (error) {
      console.log('Ses başlatma hatası:', error);
    }
  }

  private async loadSounds() {
    try {
      // Arka plan müziği yükle
      try {
        const { sound: bgMusic } = await Audio.Sound.createAsync(
          require('../../assets/sounds/background.mp3'),
          { 
            isLooping: true, 
            volume: this.musicVolume,
            shouldPlay: false 
          }
        );
        this.backgroundMusic = bgMusic;
      } catch (e) {
        console.log('Background müzik yüklenemedi:', e);
      }

      // Buton sesi yükle
      try {
        const { sound: buttonSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/button.mp3'),
          { volume: this.effectsVolume }
        );
        this.buttonSound = buttonSfx;
      } catch (e) {
        console.log('Button sesi yüklenemedi:', e);
      }

      // Patlama sesi yükle
      try {
        const { sound: explosionSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/explosion.mp3'),
          { volume: this.effectsVolume }
        );
        this.explosionSound = explosionSfx;
      } catch (e) {
        console.log('Explosion sesi yüklenemedi:', e);
      }

      // Asal patlama sesi yükle
      try {
        const { sound: primeExplosionSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/prime_explosion.mp3'),
          { volume: this.effectsVolume }
        );
        this.primeExplosionSound = primeExplosionSfx;
      } catch (e) {
        console.log('Prime explosion sesi yüklenemedi:', e);
      }

      // Hareket sesi yükle
      try {
        const { sound: moveSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/move.mp3'),
          { volume: this.effectsVolume * 0.5 } // Hareket sesi daha sessiz
        );
        this.moveSound = moveSfx;
      } catch (e) {
        console.log('Move sesi yüklenemedi:', e);
      }

      // Düşürme sesi yükle
      try {
        const { sound: dropSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/drop.mp3'),
          { volume: this.effectsVolume }
        );
        this.dropSound = dropSfx;
      } catch (e) {
        console.log('Drop sesi yüklenemedi:', e);
      }

    } catch (error) {
      console.log('Ses dosyası yükleme hatası:', error);
    }
  }

  // Arka plan müziği başlat
  async playBackgroundMusic() {
    if (!this.isMuted && this.backgroundMusic) {
      try {
        await this.backgroundMusic.playAsync();
      } catch (error) {
        console.log('Müzik başlatma hatası:', error);
      }
    }
  }

  // Arka plan müziği durdur
  async pauseBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.pauseAsync();
      } catch (error) {
        console.log('Müzik durdurma hatası:', error);
      }
    }
  }

  // Arka plan müziği durdur ve başa sar
  async stopBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.stopAsync();
      } catch (error) {
        console.log('Müzik durdurma hatası:', error);
      }
    }
  }

  // Buton sesi çal
  async playButtonSound() {
    if (!this.isMuted && this.buttonSound) {
      try {
        await this.buttonSound.replayAsync();
      } catch (error) {
        console.log('Buton sesi hatası:', error);
      }
    }
  }

  // Hareket sesi çal
  async playMoveSound() {
    if (!this.isMuted && this.moveSound) {
      try {
        await this.moveSound.replayAsync();
      } catch (error) {
        console.log('Hareket sesi hatası:', error);
      }
    }
  }

  // Düşürme sesi çal
  async playDropSound() {
    if (!this.isMuted && this.dropSound) {
      try {
        await this.dropSound.replayAsync();
      } catch (error) {
        console.log('Düşürme sesi hatası:', error);
      }
    }
  }

  // Normal patlama sesi çal
  async playExplosionSound() {
    if (!this.isMuted && this.explosionSound) {
      try {
        await this.explosionSound.replayAsync();
      } catch (error) {
        console.log('Patlama sesi hatası:', error);
      }
    }
  }

  // Asal patlama sesi çal
  async playPrimeExplosionSound() {
    if (!this.isMuted && this.primeExplosionSound) {
      try {
        await this.primeExplosionSound.replayAsync();
      } catch (error) {
        console.log('Asal patlama sesi hatası:', error);
      }
    }
  }

  // Ses açık/kapalı toggle
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.pauseBackgroundMusic();
    } else {
      this.playBackgroundMusic();
    }
    return this.isMuted;
  }

  // Ses durumu kontrol et
  getMuteStatus() {
    return this.isMuted;
  }

  // Müzik ses seviyesi ayarla
  async setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.setVolumeAsync(this.musicVolume);
      } catch (error) {
        console.log('Ses seviyesi ayarlama hatası:', error);
      }
    }
  }

  // Efekt ses seviyesi ayarla
  async setEffectsVolume(volume: number) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
    // Tüm efekt seslerinin seviyesini güncelle
    const sounds = [
      this.buttonSound,
      this.explosionSound,
      this.primeExplosionSound,
      this.dropSound
    ];

    for (const sound of sounds) {
      if (sound) {
        try {
          await sound.setVolumeAsync(this.effectsVolume);
        } catch (error) {
          console.log('Efekt ses seviyesi ayarlama hatası:', error);
        }
      }
    }

    // Hareket sesi daha sessiz
    if (this.moveSound) {
      try {
        await this.moveSound.setVolumeAsync(this.effectsVolume * 0.5);
      } catch (error) {
        console.log('Hareket ses seviyesi ayarlama hatası:', error);
      }
    }
  }

  // Temizlik (component unmount)
  async cleanup() {
    const sounds = [
      this.backgroundMusic,
      this.buttonSound,
      this.explosionSound,
      this.primeExplosionSound,
      this.moveSound,
      this.dropSound
    ];

    for (const sound of sounds) {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.log('Ses temizleme hatası:', error);
        }
      }
    }
  }
}

export default SoundManager;