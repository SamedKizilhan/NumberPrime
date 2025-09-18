import { Audio } from "expo-av";
import { Platform } from "react-native";

class SoundManager {
  private isGamePaused: boolean = false;
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
  private musicVolume: number = 0.2; // MenuScreenMusic için
  private backgroundMusicVolume: number = 0.35; // background.mp3 için
  private effectsVolume: number = 0.7;
  private isInitialized: boolean = false;

  // Android için ek ayarlar
  private isAndroid: boolean = Platform.OS === "android";
  private soundPool: { [key: string]: Audio.Sound[] } = {}; // Sound pool for Android

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async initialize() {
    try {
      console.log("SoundManager initialize başlıyor...");

      // Audio mode setup
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // ÖNCE sadece menu müziği yükle (hızlı başlangıç için)
      await this.loadCriticalSounds();

      // Sonra diğer sesleri arka planda yükle
      this.loadRemainingSounds(); // await YOK - paralel yükleme

      this.isInitialized = true;
      console.log("Critical sounds yüklendi");
    } catch (error) {
      console.error("SoundManager initialize hatası:", error);
      this.isInitialized = true;
    }
  }

  private async loadCriticalSounds() {
    try {
      // Menu müziği yükle
      if (!this.menuMusic) {
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/MenuScreenMusic.mp3")
        );
        await sound.setIsLoopingAsync(true);
        this.menuMusic = sound;
        console.log("Menu music critical yüklendi");
      }
    } catch (error) {
      console.log("Critical sounds yükleme hatası:", error);
    }
  }

  private loadRemainingSounds() {
    // Diğer sesleri arka planda yükle (async ama await yok)
    setTimeout(async () => {
      await this.loadBackgroundMusic();
      await this.loadSingleEffectSounds(); // Pool sistemi kaldırıldı
      console.log("Tüm geri kalan sesler yüklendi");
    }, 100);
  }

  public isBackgroundMusicReady(): boolean {
    return this.backgroundMusic !== null;
  }

  public async ensureBackgroundMusicReady(): Promise<void> {
    if (!this.backgroundMusic) {
      console.log("Background music yükleniyor...");
      await this.loadBackgroundMusic();
    }
  }

  // Menu müziği çalma
  async playMenuMusic() {
    if (!this.isMuted && this.menuMusic) {
      try {
        // Önce background müziği durdur
        if (this.backgroundMusic) {
          const bgStatus = await this.backgroundMusic.getStatusAsync();
          if (bgStatus.isLoaded && bgStatus.isPlaying) {
            await this.backgroundMusic.pauseAsync();
          }
        }

        // Menu müziğini çal
        const status = await this.menuMusic.getStatusAsync();
        if (status.isLoaded) {
          if (!status.isPlaying) {
            await this.menuMusic.setVolumeAsync(this.musicVolume);
            await this.menuMusic.playAsync();
            console.log("Menu müzik başlatıldı");
          } else {
            console.log("Menu müzik zaten çalıyor");
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

  // Pause durumunu set et
  setGamePaused(paused: boolean) {
    this.isGamePaused = paused;
    console.log(`Game pause durumu: ${paused}`);
  }

  // Pause durumunu kontrol et
  isGameCurrentlyPaused(): boolean {
    return this.isGamePaused;
  }

  // Background müziği pause et (oyun içi kullanım için)
  async pauseBackgroundMusicForGame() {
    if (!this.backgroundMusic) {
      console.log("Background music henüz yüklenmemiş - pause atlanıyor");
      return;
    }

    try {
      // Önce tüm timeout'ları iptal et
      this.cancelPendingBackgroundMusicResume();

      // Game pause durumunu set et
      this.setGamePaused(true);

      const status = await this.backgroundMusic.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await this.backgroundMusic.pauseAsync();
        console.log("Background müzik oyun için pause edildi");
      }
    } catch (error) {
      console.log("Background müzik pause hatası:", error);
    }
  }

  // Background müziği resume et (oyun içi kullanım için)
  async resumeBackgroundMusicForGame() {
    if (!this.backgroundMusic) {
      console.log("Background music henüz yüklenmemiş - resume atlanıyor");
      return;
    }

    if (this.isMuted) return;

    try {
      // Game pause durumunu set et
      this.setGamePaused(false);

      const status = await this.backgroundMusic.getStatusAsync();
      if (status.isLoaded && !status.isPlaying) {
        await this.backgroundMusic.playAsync();
        console.log("Background müzik oyun için resume edildi");
      }
    } catch (error) {
      console.log("Background müzik resume hatası:", error);
    }
  }

  // Menu müziğini baştan başlat (ana menüye dönünce)
  async restartMenuMusic() {
    if (!this.isMuted && this.menuMusic) {
      try {
        // Önce background müziği tamamen durdur
        await this.pauseBackgroundMusic();

        // Menu müziğini dur ve baştan başlat
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

    // Effect sesler kontrolü - hem Android hem iOS için tekli sistem
    const sounds = [
      { prop: "explosionSound", name: "explosion" },
      { prop: "buttonSound", name: "button" },
      { prop: "moveSound", name: "move" },
      { prop: "dropSound", name: "drop" },
      { prop: "primeExplosionSound", name: "primeExplosion" },
      { prop: "prime2Sound", name: "prime2" },
      { prop: "comboSound", name: "combo" },
      { prop: "failureSound", name: "failure" },
    ];

    let needReload = false;
    for (const soundCheck of sounds) {
      if (!(this as any)[soundCheck.prop]) {
        needReload = true;
        console.log(`${soundCheck.name} sesi eksik`);
        break;
      }
    }

    if (needReload) {
      console.log("Sesler eksik, yeniden yükleniyor...");
      await this.loadSingleEffectSounds();
    }
  }

  private async loadBackgroundMusic() {
    if (this.backgroundMusic) return; // Zaten yüklüyse çık

    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/background.mp3"),
        {
          volume: this.isAndroid
            ? this.backgroundMusicVolume * 0.9
            : this.backgroundMusicVolume,
          shouldPlay: false,
          isLooping: true,
        }
      );

      this.backgroundMusic = sound;
      console.log("Background müzik yüklendi ve hazır");
    } catch (error) {
      console.log("Background müzik yükleme hatası:", error);
      this.backgroundMusic = null;
    }
  }

  private async loadEffectSounds() {
    await this.loadSingleEffectSounds();
  }

  private async loadSingleEffectSounds() {
    // iOS için tüm efekt seslerini yükle
    try {
      // Button sesi yükle - Ses seviyesi daha da düşürüldü
      const { sound: buttonSfx } = await Audio.Sound.createAsync(
        require("../../assets/sounds/button.mp3"),
        { volume: this.effectsVolume * 0.2 }
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
        { volume: this.effectsVolume * 0.9 }
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
        { volume: this.effectsVolume * 0.45 } // Hareket sesi daha yumuşak
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
        { volume: this.effectsVolume * 0.25 }
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
    if (this.isMuted) return;

    // Android için de tekli sistem kullan
    const soundMapping: { [key: string]: Audio.Sound | null } = {
      explosion: this.explosionSound,
      primeExplosion: this.primeExplosionSound,
      prime2: this.prime2Sound,
      combo: this.comboSound,
      button: this.buttonSound,
      move: this.moveSound,
      drop: this.dropSound,
      failure: this.failureSound,
    };

    const sound = soundMapping[poolKey];
    if (!sound) {
      console.log(`${poolKey} sesi yüklü değil`);
      return;
    }

    try {
      await sound.replayAsync();
      console.log(`${poolKey} sesi çalındı (tekli sistem)`);
    } catch (error) {
      console.log(`${poolKey} sesi çalma hatası:`, error);

      // Hata durumunda sesi yeniden yüklemeyi dene
      try {
        await this.loadSingleEffectSounds();
        const reloadedSound = soundMapping[poolKey];
        if (reloadedSound) {
          await reloadedSound.replayAsync();
          console.log(`${poolKey} sesi yeniden yüklendi ve çalındı`);
        }
      } catch (retryError) {
        console.log(`${poolKey} sesi retry hatası:`, retryError);
      }
    }
  }

  // Background müzik kontrolleri
  async playBackgroundMusic() {
    if (!this.isMuted && this.backgroundMusic) {
      try {
        const status = await this.backgroundMusic.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          const finalVolume = this.isAndroid
            ? this.backgroundMusicVolume * 0.9
            : this.backgroundMusicVolume;
          await this.backgroundMusic.setVolumeAsync(finalVolume);
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
        await this.backgroundMusic.stopAsync();
        await this.backgroundMusic.setPositionAsync(0);
        const finalVolume = this.isAndroid
          ? this.backgroundMusicVolume * 0.9
          : this.backgroundMusicVolume;
        await this.backgroundMusic.setVolumeAsync(finalVolume);
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
    await this.ensureSoundsLoaded();
    await this.restartBackgroundMusic();
  }

  // Yeni fonksiyon: Ana menü için müzik (kaldığı yerden devam)
  async startMenuMusic() {
    await this.playMenuMusic();
  }

  // Tüm effect sesler yüklenmiş mi kontrol et
  public areEffectSoundsReady(): boolean {
    const requiredSounds = [
      this.explosionSound,
      this.buttonSound,
      this.moveSound,
      this.dropSound,
      this.primeExplosionSound,
      this.prime2Sound,
      this.comboSound,
      this.failureSound,
    ];

    return requiredSounds.every((sound) => sound !== null);
  }

  // Tüm effect sesler hazır olana kadar bekle
  public async ensureAllSoundsReady(): Promise<void> {
    if (!this.backgroundMusic) {
      console.log("Background music yükleniyor...");
      await this.loadBackgroundMusic();
    }

    if (!this.areEffectSoundsReady()) {
      console.log("Effect sesler yükleniyor...");
      await this.loadSingleEffectSounds();
    }

    console.log("Tüm sesler hazır!");
  }

  // Loading durumunu kontrol et
  public isFullyReady(): boolean {
    return this.backgroundMusic !== null && this.areEffectSoundsReady();
  }

  // Mevcut müziğin çalıp çalmadığını kontrol et
  async isBackgroundMusicPlaying(): Promise<boolean> {
    if (this.backgroundMusic) {
      try {
        const status = await this.backgroundMusic.getStatusAsync();
        return status.isLoaded && status.isPlaying;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  async isMenuMusicPlaying(): Promise<boolean> {
    if (this.menuMusic) {
      try {
        const status = await this.menuMusic.getStatusAsync();
        return status.isLoaded && status.isPlaying;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  // Güvenli müzik başlatma (çoklu çağrı koruması ile)
  async safePlayBackgroundMusic() {
    if (!this.isMuted && !(await this.isBackgroundMusicPlaying())) {
      await this.playBackgroundMusic();
    }
  }

  async safePlayMenuMusic() {
    if (!this.isMuted && !(await this.isMenuMusicPlaying())) {
      await this.playMenuMusic();
    }
  }

  // YENİ FONKSİYON: Menu müziği devam ettir (pause etmeden)
  async ensureMenuMusicPlaying() {
    if (!this.isMuted && this.menuMusic) {
      try {
        const status = await this.menuMusic.getStatusAsync();

        if (status.isLoaded && !status.isPlaying) {
          // Background müziği durdur
          if (this.backgroundMusic) {
            const bgStatus = await this.backgroundMusic.getStatusAsync();
            if (bgStatus.isLoaded && bgStatus.isPlaying) {
              await this.backgroundMusic.pauseAsync();
            }
          }

          // Menu müziği başlat
          await this.menuMusic.setVolumeAsync(this.musicVolume);
          await this.menuMusic.playAsync();
          console.log("Menu müzik devam ettirildi");
        } else if (!status.isLoaded) {
          console.log("Menu müzik yüklü değil, yeniden yükleniyor...");
          await this.playMenuMusic();
        }
      } catch (error) {
        console.log("Menu müzik devam ettirme hatası:", error);
        // Hata durumunda yeniden yüklemeyi dene
        try {
          await this.playMenuMusic();
        } catch (retryError) {
          console.log("Menu müzik retry hatası:", retryError);
        }
      }
    }
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

    // Menu müziği için normal volume
    if (this.menuMusic) {
      this.menuMusic.setVolumeAsync(this.musicVolume);
    }

    // Background müziği için ayrı volume kontrolü
    if (this.backgroundMusic) {
      const finalVolume = this.isAndroid
        ? this.backgroundMusicVolume * 0.9
        : this.backgroundMusicVolume;
      this.backgroundMusic.setVolumeAsync(finalVolume);
    }
  }

  setBackgroundMusicVolume(volume: number) {
    this.backgroundMusicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic) {
      const finalVolume = this.isAndroid
        ? this.backgroundMusicVolume * 0.9
        : this.backgroundMusicVolume;
      this.backgroundMusic.setVolumeAsync(finalVolume);
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
