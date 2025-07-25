import { Audio } from "expo-av";
import { Platform } from "react-native";

class SoundManager {
  private backgroundMusicResumeTimeout: NodeJS.Timeout | null = null;
  private temporaryPauseTimeout: NodeJS.Timeout | null = null;
  private static instance: SoundManager;
  private backgroundMusic: Audio.Sound | null = null;
  private explosionSound: Audio.Sound | null = null;
  private primeExplosionSound: Audio.Sound | null = null;
  private prime2Sound: Audio.Sound | null = null;
  private comboSound: Audio.Sound | null = null;
  private buttonSound: Audio.Sound | null = null;
  private moveSound: Audio.Sound | null = null;
  private dropSound: Audio.Sound | null = null;
  private failureSound: Audio.Sound | null = null;
  private menuMusic: Audio.Sound | null = null;

  private isMuted: boolean = false;
  private musicVolume: number = 0.2; 
  private effectsVolume: number = 0.9;
  private isInitialized: boolean = false;

  // Android için ek ayarlar
  private isAndroid: boolean = Platform.OS === "android";
  private soundPool: { [key: string]: Audio.Sound[] } = {}; // Sound pool for Android
  private poolSize: number = 3; // Her ses için 3 instance

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async initialize() {
    // Her seferinde yeniden yükle (cache problemini çöz)
    try {
      console.log("SoundManager initialize başlıyor...");

      // Audio modunu ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Background müzik yükle
      if (!this.backgroundMusic) {
        this.backgroundMusic = new Audio.Sound();
        await this.backgroundMusic.loadAsync(
          require("../../assets/sounds/background.mp3")
        );
        await this.backgroundMusic.setIsLoopingAsync(true);
        console.log("Background müzik yüklendi");
      }

      // Menu müzik yükle
      if (!this.menuMusic) {
        this.menuMusic = new Audio.Sound();
        await this.menuMusic.loadAsync(
          require("../../assets/sounds/MenuScreenMusic.mp3")
        );
        await this.menuMusic.setIsLoopingAsync(true);
        console.log("Menu müzik yüklendi");
      }

      // Mevcut sesleri kontrol et ve eksikse yükle
      await this.ensureSoundsLoaded();

      this.isInitialized = true;
      console.log("SoundManager başarıyla initialize edildi");
    } catch (error) {
      console.error("SoundManager initialize hatası:", error);
      this.isInitialized = true;
    }
  }

  // Menu müziği çalma
  async playMenuMusic() {
    if (!this.isMuted && this.menuMusic) {
      try {
        // Önce background müziği durdur
        if (this.backgroundMusic) {
          await this.backgroundMusic.pauseAsync();
        }

        // Menu müziğini çal
        const status = await this.menuMusic.getStatusAsync();
        if (status.isLoaded) {
          if (!status.isPlaying) {
            await this.menuMusic.setVolumeAsync(this.musicVolume);
            await this.menuMusic.playAsync();
            console.log("Menu müzik başlatıldı");
          }
        }
      } catch (error) {
        console.log("Menu müzik çalma hatası:", error);
      }
    }
  }

  // Menu müziği durdurma
  async pauseMenuMusic() {
    if (this.menuMusic) {
      try {
        const status = await this.menuMusic.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await this.menuMusic.pauseAsync();
          console.log("Menu müzik duraklatıldı");
        }
      } catch (error) {
        console.log("Menu müzik durdurma hatası:", error);
      }
    }
  }

  // Menu müziği baştan başlatma
  async restartMenuMusic() {
    if (!this.isMuted && this.menuMusic) {
      try {
        await this.menuMusic.stopAsync();
        await this.menuMusic.setVolumeAsync(this.musicVolume);
        await this.menuMusic.playAsync();
        console.log("Menu müzik baştan başlatıldı");
      } catch (error) {
        console.log("Menu müzik restart hatası:", error);
      }
    }
  }
  // Yeni fonksiyon: Sesler yüklenmiş mi kontrol et ve eksikse yükle
  private async ensureSoundsLoaded() {
    // Background müzik kontrolü
    if (!this.backgroundMusic) {
      await this.loadBackgroundMusic();
    }

    // Effect sesler kontrolü
    if (this.isAndroid) {
      // Android pool kontrolü
      const requiredPools = [
        "explosion",
        "primeExplosion",
        "prime2",
        "combo",
        "button",
        "move",
        "drop",
        "failure",
      ];

      for (const poolKey of requiredPools) {
        if (!this.soundPool[poolKey] || this.soundPool[poolKey].length === 0) {
          console.log(`${poolKey} pool eksik, yeniden oluşturuluyor...`);
          await this.createSoundPools();
          break; // Bir tane eksikse hepsini yeniden oluştur
        }
      }
    } else {
      // iOS ses kontrolü
      const sounds = [
        { prop: "explosionSound", loader: () => this.loadSingleEffectSounds() },
        { prop: "buttonSound", loader: () => this.loadSingleEffectSounds() },
        // Diğer sesler de aynı loader'ı kullanır
      ];

      let needReload = false;
      for (const soundCheck of sounds) {
        if (!(this as any)[soundCheck.prop]) {
          needReload = true;
          break;
        }
      }

      if (needReload) {
        console.log("iOS sesler eksik, yeniden yükleniyor...");
        await this.loadSingleEffectSounds();
      }
    }
  }

  private async loadBackgroundMusic() {
    try {
      const { sound: bgMusic } = await Audio.Sound.createAsync(
        require("../../assets/sounds/background.mp3"),
        {
          volume: this.musicVolume,
          shouldPlay: false,
          isLooping: true,
          // Android için ek ayarlar
          ...(this.isAndroid && {
            progressUpdateIntervalMillis: 500,
          }),
        }
      );
      this.backgroundMusic = bgMusic;
      console.log("Background müzik yüklendi");

      // Android için hazırlık
      if (this.isAndroid) {
        await bgMusic.setStatusAsync({ shouldPlay: false });
      }
    } catch (e) {
      console.log("Background müzik yüklenemedi:", e);
    }
  }

  private async loadEffectSounds() {
    // Android için sound pool oluştur
    if (this.isAndroid) {
      await this.createSoundPools();
    } else {
      await this.loadSingleEffectSounds();
    }
  }

  private async createSoundPools() {
    console.log("Android sound pool oluşturuluyor...");

    // Her efekt sesi için pool oluştur
    const soundFiles = [
      {
        key: "explosion",
        file: require("../../assets/sounds/explosion.mp3"),
        volume: 0.9,
      },
      {
        key: "primeExplosion",
        file: require("../../assets/sounds/prime_explosion.mp3"),
        volume: 1.0,
      },
      {
        key: "prime2",
        file: require("../../assets/sounds/prime2.mp3"),
        volume: 0.7,
      },
      {
        key: "combo",
        file: require("../../assets/sounds/combo.mp3"),
        volume: 0.9,
      },
      {
        key: "button",
        file: require("../../assets/sounds/button.mp3"),
        volume: 0.3,
      }, // Düşük ses
      {
        key: "move",
        file: require("../../assets/sounds/move.mp3"),
        volume: 0.75,
      },
      {
        key: "drop",
        file: require("../../assets/sounds/drop.mp3"),
        volume: 0.4,
      },
      {
        key: "failure",
        file: require("../../assets/sounds/failure.mp3"),
        volume: 0.8,
      },
    ];

    for (const soundFile of soundFiles) {
      this.soundPool[soundFile.key] = [];

      for (let i = 0; i < this.poolSize; i++) {
        try {
          const { sound } = await Audio.Sound.createAsync(soundFile.file, {
            volume: this.effectsVolume * (soundFile.volume || 0.7), // Her ses için özel volume
            shouldPlay: false,
            isLooping: false,
          });

          await sound.setStatusAsync({ shouldPlay: false });
          this.soundPool[soundFile.key].push(sound);
        } catch (error) {
          console.log(`${soundFile.key} pool item ${i} yüklenemedi:`, error);
        }
      }

      console.log(
        `${soundFile.key} pool oluşturuldu: ${
          this.soundPool[soundFile.key].length
        } item`
      );
    }
  }

  private async loadSingleEffectSounds() {
    // iOS için tüm efekt seslerini yükle
    try {
      // Button sesi yükle - Ses seviyesi daha da düşürüldü
      const { sound: buttonSfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/button.mp3"),
        { volume: this.effectsVolume * 0.3 } // 0.5'ten 0.3'e düşürüldü
      );
      this.buttonSound = buttonSfx;
      console.log("Button sesi yüklendi");
    } catch (e) {
      console.log("Button sesi yüklenemedi:", e);
    }

    try {
      // Explosion sesi yükle
      const { sound: explosionSfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/explosion.mp3"),
        { volume: this.effectsVolume * 0.8 }
      );
      this.explosionSound = explosionSfx;
      console.log("Explosion sesi yüklendi");
    } catch (e) {
      console.log("Explosion sesi yüklenemedi:", e);
    }

    try {
      // Prime explosion sesi yükle
      const { sound: primeExplosionSfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/prime_explosion.mp3"),
        { volume: this.effectsVolume * 0.9 }
      );
      this.primeExplosionSound = primeExplosionSfx;
      console.log("Prime explosion sesi yüklendi");
    } catch (e) {
      console.log("Prime explosion sesi yüklenemedi:", e);
    }

    try {
      // Prime2 sesi yükle
      const { sound: prime2Sfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/prime2.mp3"),
        { volume: this.effectsVolume * 0.7 }
      );
      this.prime2Sound = prime2Sfx;
      console.log("Prime2 sesi yüklendi");
    } catch (e) {
      console.log("Prime2 sesi yüklenemedi:", e);
    }

    try {
      // Combo sesi yükle
      const { sound: comboSfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/combo.mp3"),
        { volume: this.effectsVolume * 0.8 }
      );
      this.comboSound = comboSfx;
      console.log("Combo sesi yüklendi");
    } catch (e) {
      console.log("Combo sesi yüklenemedi:", e);
    }

    try {
      // Move sesi yükle
      const { sound: moveSfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/move.mp3"),
        { volume: this.effectsVolume * 0.5 } // Hareket sesi daha yumuşak
      );
      this.moveSound = moveSfx;
      console.log("Move sesi yüklendi");
    } catch (e) {
      console.log("Move sesi yüklenemedi:", e);
    }

    try {
      // Drop sesi yükle
      const { sound: dropSfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/drop.mp3"),
        { volume: this.effectsVolume * 0.45 }
      );
      this.dropSound = dropSfx;
      console.log("Drop sesi yüklendi");
    } catch (e) {
      console.log("Drop sesi yüklenemedi:", e);
    }

    try {
      // Failure sesi yükle
      const { sound: failureSfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/failure.mp3"),
        { volume: this.effectsVolume * 0.8 }
      );
      this.failureSound = failureSfx;
      console.log("Failure sesi yüklendi");
    } catch (e) {
      console.log("Failure sesi yüklenemedi:", e);
    }
  }

  private async playFromPool(poolKey: string): Promise<void> {
    if (!this.isMuted && this.soundPool[poolKey]) {
      // Boş bir ses bul
      for (const sound of this.soundPool[poolKey]) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) {
            await sound.replayAsync();
            return;
          }
        } catch (error) {
          console.log(`Pool ses ${poolKey} çalma hatası:`, error);
        }
      }

      // Hepsi meşgulse ilkini kullan
      try {
        const firstSound = this.soundPool[poolKey][0];
        await firstSound.stopAsync();
        await firstSound.replayAsync();
      } catch (error) {
        console.log(`Pool ses ${poolKey} fallback hatası:`, error);
      }
    }
  }

  // Background müzik kontrolleri
  async playBackgroundMusic() {
    if (!this.isMuted && this.backgroundMusic) {
      try {
        const status = await this.backgroundMusic.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await this.backgroundMusic.playAsync();
          console.log("Background müzik başlatıldı");
        }
      } catch (error) {
        console.log("Background müzik çalma hatası:", error);
      }
    }
  }

  // Yeni fonksiyon: Müziği baştan başlat
  async restartBackgroundMusic() {
    if (!this.isMuted && this.backgroundMusic) {
      try {
        // Müziği durdur ve başa sar
        await this.backgroundMusic.stopAsync();
        await this.backgroundMusic.setPositionAsync(0);
        await this.backgroundMusic.playAsync();
        console.log("Background müzik baştan başlatıldı");
      } catch (error) {
        console.log("Background müzik restart hatası:", error);
      }
    }
  }

  // Yeni fonksiyon: Müziği geçici durdur ve sonra devam ettir
  async pauseBackgroundMusicTemporarily(durationMs: number = 3000) {
    if (this.backgroundMusic) {
      try {
        // Önceki timeout'ları iptal et
        this.cancelPendingBackgroundMusicResume();

        await this.backgroundMusic.pauseAsync();
        console.log(`Background müzik ${durationMs}ms için duraklatıldı`);

        // Belirtilen süre sonra tekrar başlat
        this.temporaryPauseTimeout = setTimeout(async () => {
          try {
            await this.playBackgroundMusic();
            console.log("Background müzik otomatik olarak devam etti");
            this.temporaryPauseTimeout = null;
          } catch (error) {
            console.log("Background müzik otomatik devam hatası:", error);
          }
        }, durationMs);
      } catch (error) {
        console.log("Background müzik geçici durdurma hatası:", error);
      }
    }
  }

  async pauseBackgroundMusic() {
    // Pending timeout'u iptal et
    this.cancelPendingBackgroundMusicResume();

    if (this.backgroundMusic) {
      try {
        const status = await this.backgroundMusic.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await this.backgroundMusic.pauseAsync();
          console.log("Background müzik duraklatıldı");
        }
      } catch (error) {
        console.log("Background müzik durdurma hatası:", error);
      }
    }
  }

  // Efekt sesi metodları - Android pool kullanımı
  async playExplosionSound() {
    if (this.isAndroid) {
      await this.playFromPool("explosion");
    } else {
      // iOS için eski yöntem
      if (!this.isMuted && this.explosionSound) {
        try {
          await this.explosionSound.replayAsync();
        } catch (error) {
          console.log("Explosion sesi hatası:", error);
        }
      }
    }
  }

  async playPrimeExplosionSound() {
    if (this.isAndroid) {
      await this.playFromPool("primeExplosion");
    } else {
      if (!this.isMuted && this.primeExplosionSound) {
        try {
          await this.primeExplosionSound.replayAsync();
        } catch (error) {
          console.log("Prime explosion sesi hatası:", error);
        }
      }
    }
  }

  async playPrime2Sound() {
    if (this.isAndroid) {
      await this.playFromPool("prime2");
    } else {
      if (!this.isMuted && this.prime2Sound) {
        try {
          await this.prime2Sound.replayAsync();
        } catch (error) {
          console.log("Prime2 sesi hatası:", error);
        }
      }
    }
  }

  async playComboSound() {
    if (this.isAndroid) {
      await this.playFromPool("combo");
    } else {
      if (!this.isMuted && this.comboSound) {
        try {
          await this.comboSound.replayAsync();
        } catch (error) {
          console.log("Combo sesi hatası:", error);
        }
      }
    }
  }

  async playButtonSound() {
    if (this.isAndroid) {
      await this.playFromPool("button");
    } else {
      if (!this.isMuted && this.buttonSound) {
        try {
          await this.buttonSound.replayAsync();
        } catch (error) {
          console.log("Button sesi hatası:", error);
        }
      }
    }
  }

  async playMoveSound() {
    if (this.isAndroid) {
      await this.playFromPool("move");
    } else {
      if (!this.isMuted && this.moveSound) {
        try {
          await this.moveSound.replayAsync();
        } catch (error) {
          console.log("Move sesi hatası:", error);
        }
      }
    }
  }

  async playDropSound() {
    if (this.isAndroid) {
      await this.playFromPool("drop");
    } else {
      if (!this.isMuted && this.dropSound) {
        try {
          await this.dropSound.replayAsync();
        } catch (error) {
          console.log("Drop sesi hatası:", error);
        }
      }
    }
  }

  async playFailureSound() {
    if (this.isAndroid) {
      // Android için - müziği kısa süre durdur
      await this.pauseBackgroundMusicTemporarily(2000); // 2 saniye
      await this.playFromPool("failure");
    } else {
      // iOS için - kontrol edilebilir timeout
      if (!this.isMuted && this.failureSound) {
        try {
          // Önceki timeout varsa iptal et
          this.cancelPendingBackgroundMusicResume();

          await this.pauseBackgroundMusic();
          await this.failureSound.replayAsync();

          // iOS için otomatik resume - kontrol edilebilir timeout
          this.backgroundMusicResumeTimeout = setTimeout(() => {
            this.playBackgroundMusic();
            this.backgroundMusicResumeTimeout = null;
          }, 2500);
        } catch (error) {
          console.log("Failure sesi hatası:", error);
        }
      }
    }
  }

  // Yeni fonksiyon: Pending background music resume'ları iptal et
  cancelPendingBackgroundMusicResume() {
    if (this.backgroundMusicResumeTimeout) {
      clearTimeout(this.backgroundMusicResumeTimeout);
      this.backgroundMusicResumeTimeout = null;
      console.log("iOS background music resume timeout iptal edildi");
    }

    if (this.temporaryPauseTimeout) {
      clearTimeout(this.temporaryPauseTimeout);
      this.temporaryPauseTimeout = null;
      console.log("Android temporary pause timeout iptal edildi");
    }
  }

  // Yeni fonksiyon: Oyun için müzik başlat (her zaman baştan)
  async startGameMusic() {
    await this.restartBackgroundMusic();
  }

  // Yeni fonksiyon: Ana menü için müzik (kaldığı yerden devam)
  async startMenuMusic() {
    await this.playBackgroundMusic();
  }

  // Ses kontrolü
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.pauseBackgroundMusic();
      this.pauseMenuMusic();
    } else {
      // Hangi müziğin çalacağına ilgili ekran karar verecek
      console.log("Ses açıldı - müzik kontrolü ilgili ekrana bırakıldı");
    }
    return this.isMuted;
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolumeAsync(this.musicVolume);
    }
  }

  setEffectsVolume(volume: number) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
    // Pool'daki seslerin volumunu güncelle
    if (this.isAndroid) {
      Object.values(this.soundPool).forEach((sounds) => {
        sounds.forEach((sound) => {
          sound.setVolumeAsync(this.effectsVolume);
        });
      });
    }
  }

  async cleanup() {
    try {
      // Pending timeout'u iptal et
      this.cancelPendingBackgroundMusicResume();

      // Background müziği sadece durdur, unload etme
      if (this.backgroundMusic) {
        await this.backgroundMusic.pauseAsync();
        console.log("Background müzik duraklatıldı (cleanup)");
      }

      // Menu müziği sadece durdur
      if (this.menuMusic) {
        await this.menuMusic.pauseAsync();
        console.log("Menu müzik duraklatıldı (cleanup)");
      }

      // Efekt seslerini unload etme, sadece durdur
      if (this.isAndroid) {
        for (const sounds of Object.values(this.soundPool)) {
          for (const sound of sounds) {
            try {
              await sound.stopAsync();
            } catch (e) {
              // Ses zaten durmuş olabilir
            }
          }
        }
      } else {
        // iOS seslerini durdur
        const sounds = [
          this.explosionSound,
          this.primeExplosionSound,
          this.prime2Sound,
          this.comboSound,
          this.buttonSound,
          this.moveSound,
          this.dropSound,
          this.failureSound,
        ];

        for (const sound of sounds) {
          if (sound) {
            try {
              await sound.stopAsync();
            } catch (e) {
              // Ses zaten durmuş olabilir
            }
          }
        }
      }

      console.log("SoundManager cleanup tamamlandı (sesler korundu)");
    } catch (error) {
      console.log("SoundManager cleanup hatası:", error);
    }
  }

  async fullCleanup() {
    try {
      // Background müziği unload et
      if (this.backgroundMusic) {
        await this.backgroundMusic.unloadAsync();
        this.backgroundMusic = null;
      }

      if (this.menuMusic) {
        await this.menuMusic.unloadAsync();
        this.menuMusic = null;
        console.log("Menu müzik tamamen temizlendi");
      }

      // Android pool temizle
      if (this.isAndroid) {
        for (const sounds of Object.values(this.soundPool)) {
          for (const sound of sounds) {
            await sound.unloadAsync();
          }
        }
        this.soundPool = {};
      } else {
        // iOS seslerini tamamen temizle
        const sounds = [
          this.explosionSound,
          this.primeExplosionSound,
          this.prime2Sound,
          this.comboSound,
          this.buttonSound,
          this.moveSound,
          this.dropSound,
          this.failureSound,
        ];

        for (const sound of sounds) {
          if (sound) {
            await sound.unloadAsync();
          }
        }

        // Referansları temizle
        this.explosionSound = null;
        this.primeExplosionSound = null;
        this.prime2Sound = null;
        this.comboSound = null;
        this.buttonSound = null;
        this.moveSound = null;
        this.dropSound = null;
        this.failureSound = null;
      }

      this.isInitialized = false;
      console.log("SoundManager tamamen temizlendi");
    } catch (error) {
      console.log("SoundManager fullCleanup hatası:", error);
    }
  }
}

export default SoundManager;
