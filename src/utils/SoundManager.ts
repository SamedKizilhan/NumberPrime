import { Audio, AudioMode, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

class SoundManager {
  private static instance: SoundManager;
  private backgroundMusic: Audio.Sound | null = null;
  private buttonSound: Audio.Sound | null = null;
  private explosionSound: Audio.Sound | null = null;
  private primeExplosionSound: Audio.Sound | null = null;
  private prime2Sound: Audio.Sound | null = null;
  private comboSound: Audio.Sound | null = null;
  private moveSound: Audio.Sound | null = null;
  private dropSound: Audio.Sound | null = null;
  
  private isMuted: boolean = false;
  private musicVolume: number = 0.50; // %45 ses seviyesi
  private effectsVolume: number = 0.65; // %70 ses seviyesi

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
        playThroughEarpieceAndroid: false, // Android için
      } as AudioMode);

      // Ses dosyalarını yükle
      await this.loadSounds();
      
      // Android için ses dosyalarını preload et
      await this.preloadSounds();
    } catch (error) {
      console.log('Ses başlatma hatası:', error);
    }
  }

  // Android için ses dosyalarını önceden hazırla
  private async preloadSounds() {
    try {
      // Kısa bir sessiz çalma ile Android'i hazırla
      if (this.buttonSound) {
        await this.buttonSound.setVolumeAsync(0);
        await this.buttonSound.playAsync();
        await this.buttonSound.stopAsync();
        await this.buttonSound.setVolumeAsync(this.effectsVolume);
      }
      
      if (this.explosionSound) {
        await this.explosionSound.setVolumeAsync(0);
        await this.explosionSound.playAsync();
        await this.explosionSound.stopAsync();
        await this.explosionSound.setVolumeAsync(this.effectsVolume);
      }
      
      if (this.primeExplosionSound) {
        await this.primeExplosionSound.setVolumeAsync(0);
        await this.primeExplosionSound.playAsync();
        await this.primeExplosionSound.stopAsync();
        await this.primeExplosionSound.setVolumeAsync(this.effectsVolume);
      }
      
      console.log('Android ses preload tamamlandı');
    } catch (error) {
      console.log('Preload hatası:', error);
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
        console.log('Background müzik yüklendi');
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
        console.log('Button sesi yüklendi');
      } catch (e) {
        console.log('Button sesi yüklenemedi:', e);
      }

      // Normal patlama sesi yükle - Özel Android işlemi
      try {
        const { sound: explosionSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/explosion.mp3'),
          { 
            volume: this.effectsVolume,
            shouldPlay: false,
            isLooping: false
          }
        );
        this.explosionSound = explosionSfx;
        console.log('Explosion sesi yüklendi');
        
        // Android için hazırlık
        await explosionSfx.setStatusAsync({ shouldPlay: false });
      } catch (e) {
        console.log('Explosion sesi yüklenemedi:', e);
        // Yedek: Button sesini explosion olarak kullan
        this.explosionSound = this.buttonSound;
        console.log('Button sesi explosion olarak atandı');
      }

      // Asal patlama sesi yükle - Özel Android işlemi
      try {
        const { sound: primeExplosionSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/prime_explosion.mp3'),
          { 
            volume: this.effectsVolume,
            shouldPlay: false,
            isLooping: false
          }
        );
        this.primeExplosionSound = primeExplosionSfx;
        console.log('Prime explosion sesi yüklendi');
        
        // Android için hazırlık
        await primeExplosionSfx.setStatusAsync({ shouldPlay: false });
      } catch (e) {
        console.log('Prime explosion sesi yüklenemedi:', e);
        // Yedek: Button sesini prime explosion olarak kullan
        this.primeExplosionSound = this.buttonSound;
        console.log('Button sesi prime explosion olarak atandı');
      }

      // 2 sayısı özel patlama sesi yükle
      try {
        const { sound: prime2Sfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/prime2.mp3'),
          { 
            volume: this.effectsVolume,
            shouldPlay: false,
            isLooping: false
          }
        );
        this.prime2Sound = prime2Sfx;
        console.log('Prime2 sesi yüklendi');
        
        // Android için hazırlık
        await prime2Sfx.setStatusAsync({ shouldPlay: false });
      } catch (e) {
        console.log('Prime2 sesi yüklenemedi:', e);
        // Yedek: Prime explosion sesini kullan
        this.prime2Sound = this.primeExplosionSound;
        console.log('Prime explosion sesi prime2 olarak atandı');
      }

      // Combo sesi yükle
      try {
        const { sound: comboSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/combo.mp3'),
          { 
            volume: this.effectsVolume,
            shouldPlay: false,
            isLooping: false
          }
        );
        this.comboSound = comboSfx;
        console.log('Combo sesi yüklendi');
        
        // Android için hazırlık
        await comboSfx.setStatusAsync({ shouldPlay: false });
      } catch (e) {
        console.log('Combo sesi yüklenemedi:', e);
        // Yedek: Button sesini combo olarak kullan
        this.comboSound = this.buttonSound;
        console.log('Button sesi combo olarak atandı');
      }

      // Hareket sesi yükle
      try {
        const { sound: moveSfx } = await Audio.Sound.createAsync(
          require('../../assets/sounds/move.mp3'),
          { volume: this.effectsVolume * 0.5 }
        );
        this.moveSound = moveSfx;
        console.log('Move sesi yüklendi');
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
        console.log('Drop sesi yüklendi');
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
        const status = await this.buttonSound.getStatusAsync();
        if (status.isLoaded) {
          await this.buttonSound.setPositionAsync(0);
          await this.buttonSound.playAsync();
        }
      } catch (error) {
        console.log('Buton sesi hatası:', error);
      }
    }
  }

  // Hareket sesi çal
  async playMoveSound() {
    if (!this.isMuted && this.moveSound) {
      try {
        const status = await this.moveSound.getStatusAsync();
        if (status.isLoaded) {
          await this.moveSound.setPositionAsync(0);
          await this.moveSound.playAsync();
        }
      } catch (error) {
        console.log('Hareket sesi hatası:', error);
      }
    }
  }

  // Düşürme sesi çal
  async playDropSound() {
    if (!this.isMuted && this.dropSound) {
      try {
        const status = await this.dropSound.getStatusAsync();
        if (status.isLoaded) {
          await this.dropSound.setPositionAsync(0);
          await this.dropSound.playAsync();
        }
      } catch (error) {
        console.log('Düşürme sesi hatası:', error);
      }
    }
  }

  // Normal patlama sesi çal - Android optimize
  async playExplosionSound() {
    if (!this.isMuted && this.explosionSound) {
      try {
        console.log('Explosion sesi çalınıyor...');
        
        // Basit çalma yöntemi - Android için
        await this.explosionSound.stopAsync();
        await this.explosionSound.setPositionAsync(0);
        await this.explosionSound.playAsync();
        
        console.log('Explosion sesi başlatıldı');
      } catch (error) {
        console.log('Explosion sesi hatası:', error);
        
        // Son çare: Button sesini çal
        if (this.buttonSound) {
          try {
            await this.buttonSound.replayAsync();
            console.log('Button sesi explosion yerine çalındı');
          } catch (buttonError) {
            console.log('Button sesi de çalışmadı:', buttonError);
          }
        }
      }
    }
  }

  // Asal patlama sesi çal - Android optimize  
  async playPrimeExplosionSound() {
    if (!this.isMuted && this.primeExplosionSound) {
      try {
        console.log('Prime explosion sesi çalınıyor...');
        
        // Basit çalma yöntemi - Android için
        await this.primeExplosionSound.stopAsync();
        await this.primeExplosionSound.setPositionAsync(0);
        await this.primeExplosionSound.playAsync();
        
        console.log('Prime explosion sesi başlatıldı');
      } catch (error) {
        console.log('Prime explosion sesi hatası:', error);
        
        // Son çare: Button sesini çal
        if (this.buttonSound) {
          try {
            await this.buttonSound.replayAsync();
            console.log('Button sesi prime explosion yerine çalındı');
          } catch (buttonError) {
            console.log('Button sesi de çalışmadı:', buttonError);
          }
        }
      }
    }
  }

  // 2 sayısı özel patlama sesi çal
  async playPrime2Sound() {
    if (!this.isMuted && this.prime2Sound) {
      try {
        console.log('Prime2 sesi çalınıyor...');
        
        await this.prime2Sound.stopAsync();
        await this.prime2Sound.setPositionAsync(0);
        await this.prime2Sound.playAsync();
        
        console.log('Prime2 sesi başlatıldı');
      } catch (error) {
        console.log('Prime2 sesi hatası:', error);
        
        // Son çare: Prime explosion sesini çal
        if (this.primeExplosionSound) {
          try {
            await this.primeExplosionSound.replayAsync();
            console.log('Prime explosion sesi prime2 yerine çalındı');
          } catch (fallbackError) {
            console.log('Prime explosion sesi de çalışmadı:', fallbackError);
          }
        }
      }
    }
  }

  // Combo sesi çal
  async playComboSound() {
    if (!this.isMuted && this.comboSound) {
      try {
        console.log('Combo sesi çalınıyor...');
        
        await this.comboSound.stopAsync();
        await this.comboSound.setPositionAsync(0);
        await this.comboSound.playAsync();
        
        console.log('Combo sesi başlatıldı');
      } catch (error) {
        console.log('Combo sesi hatası:', error);
        
        // Son çare: Button sesini çal
        if (this.buttonSound) {
          try {
            await this.buttonSound.replayAsync();
            console.log('Button sesi combo yerine çalındı');
          } catch (fallbackError) {
            console.log('Button sesi de çalışmadı:', fallbackError);
          }
        }
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
      this.prime2Sound,
      this.comboSound,
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