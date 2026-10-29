import { signalValue, type SignalValue } from 'reactive-values';
import { MathUtils } from '../core';
import { GameLoader } from '../assets';

/**
 * Centralized audio management for sound effects and background music.
 * @class AudioManager
 */
export default (class {
  /**
   * The single audio service shared by engine clients.
   * @property {AudioManager} instance
   * @public
   * @readonly
   */
  public static readonly instance = new this();

  /**
   * Stores master volume multiplier.
   * @property {SignalValue<number>} masterVolume
   * @public
   * @readonly
   */
  public readonly masterVolume: SignalValue<number> = signalValue(1.0);

  /**
   * Stores sound effects volume multiplier.
   * @property {SignalValue<number>} sfxVolume
   * @public
   * @readonly
   */
  public readonly sfxVolume: SignalValue<number> = signalValue(1.0);

  /**
   * Stores background music volume multiplier.
   * @property {SignalValue<number>} bgmVolume
   * @public
   * @readonly
   */
  public readonly bgmVolume: SignalValue<number> = signalValue(0.7);

  /**
   * Stores whether audio is globally muted.
   * @property {SignalValue<boolean>} muted
   * @public
   * @readonly
   */
  public readonly muted: SignalValue<boolean> = signalValue(false);

  /**
   * Stores the current BGM audio element.
   * @property {SignalValue<HTMLAudioElement | undefined>} currentBgm
   * @private
   * @readonly
   */
  private readonly currentBgm: SignalValue<HTMLAudioElement | undefined> = signalValue<HTMLAudioElement | undefined>(undefined);

  /**
   * Stores the current BGM track name.
   * @property {SignalValue<string | undefined>} currentBgmName
   * @private
   * @readonly
   */
  private readonly currentBgmName: SignalValue<string | undefined> = signalValue<string | undefined>(undefined);

  /**
   * Stores the volume scaling factor for the active BGM.
   * @property {SignalValue<number>} currentBgmScale
   * @private
   * @readonly
   */
  private readonly currentBgmScale: SignalValue<number> = signalValue(1.0);

  /**
   * Stores whether BGM was active before window blur.
   * @property {SignalValue<boolean>} bgmWasPlayingBeforeBlur
   * @private
   * @readonly
   */
  private readonly bgmWasPlayingBeforeBlur: SignalValue<boolean> = signalValue(false);

  /**
   * Creates an audio manager instance.
   * @public
   * @return {void}
   */
  /**
   * Creates the shared audio service.
   * @private
   * @return {void}
   * @constructor
   */
  private constructor() {
    this.installVisibilityListener();
  }

  /**
   * Plays a preloaded sound effect.
   * @public
   * @return {HTMLAudioElement | undefined}
   * @param {string} name Name used to identify or look up this resource.
   * @param {number} [volumeScale] The volume scale supplied to this operation.
   */
  public playSfx(name: string, volumeScale = 1.0): HTMLAudioElement | undefined {
    if (this.muted()) return undefined;

    try {
      const source = GameLoader.getAudio(name);
      const audio = source.cloneNode(true) as HTMLAudioElement;
      audio.currentTime = 0;

      const effectiveVolume = MathUtils.clamp(
        this.masterVolume() * this.sfxVolume() * volumeScale,
        0,
        1
      );
      audio.volume = effectiveVolume;

      const playback = audio.play();
      if (playback) {
        playback.catch((error: unknown) => {
          console.warn(`[AudioManager] Unable to play SFX "${name}":`, error);
        });
      }
      return audio;
    } catch (error) {
      console.warn(`[AudioManager] SFX "${name}" could not be loaded:`, error);
      return undefined;
    }
  }

  /**
   * Starts playing a background music track.
   * @public
   * @return {void}
   * @param {string} name Name used to identify or look up this resource.
   * @param {boolean} [loop] Whether playback repeats after reaching the final frame.
   * @param {number} [volumeScale] The volume scale supplied to this operation.
   */
  public playBgm(name: string, loop = true, volumeScale = 1.0): void {
    const currentBgm = this.currentBgm();
    if (this.currentBgmName() === name && currentBgm && !currentBgm.paused) {
      return;
    }

    this.stopBgm();

    try {
      const source = GameLoader.getAudio(name);
      const audio = source.cloneNode(true) as HTMLAudioElement;
      this.currentBgm.set(audio);
      this.currentBgmName.set(name);
      this.currentBgmScale.set(volumeScale);
      audio.loop = loop;
      this.applyBgmVolume();

      if (!this.muted()) {
        const playback = audio.play();
        if (playback) {
          playback.catch((error: unknown) => {
            console.warn(`[AudioManager] Unable to play BGM "${name}":`, error);
          });
        }
      }
    } catch (error) {
      console.warn(`[AudioManager] BGM "${name}" could not be loaded:`, error);
    }
  }

  /**
   * Stops the active background music track.
   * @public
   * @return {void}
   */
  public stopBgm(): void {
    const currentBgm = this.currentBgm();
    if (currentBgm) {
      currentBgm.pause();
      currentBgm.currentTime = 0;
      this.currentBgm.set(undefined);
      this.currentBgmName.set(undefined);
    }
  }

  /**
   * Pauses the active background music track.
   * @public
   * @return {void}
   */
  public pauseBgm(): void {
    const currentBgm = this.currentBgm();
    if (currentBgm && !currentBgm.paused) {
      currentBgm.pause();
    }
  }

  /**
   * Resumes the paused background music track.
   * @public
   * @return {void}
   */
  public resumeBgm(): void {
    const currentBgm = this.currentBgm();
    if (currentBgm && currentBgm.paused && !this.muted()) {
      const playback = currentBgm.play();
      if (playback) {
        playback.catch((error: unknown) => {
          console.warn(`[AudioManager] Unable to resume BGM "${this.currentBgmName()}":`, error);
        });
      }
    }
  }

  /**
   * Sets the master volume multiplier.
   * @public
   * @return {void}
   * @param {number} volume The volume supplied to this operation.
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume.set(MathUtils.clamp(volume, 0, 1));
    this.applyBgmVolume();
  }

  /**
   * Sets the SFX volume multiplier.
   * @public
   * @return {void}
   * @param {number} volume The volume supplied to this operation.
   */
  public setSfxVolume(volume: number): void {
    this.sfxVolume.set(MathUtils.clamp(volume, 0, 1));
  }

  /**
   * Sets the BGM volume multiplier.
   * @public
   * @return {void}
   * @param {number} volume The volume supplied to this operation.
   */
  public setBgmVolume(volume: number): void {
    this.bgmVolume.set(MathUtils.clamp(volume, 0, 1));
    this.applyBgmVolume();
  }

  /**
   * Sets whether all audio is muted.
   * @public
   * @return {void}
   * @param {boolean} muted The muted supplied to this operation.
   */
  public setMuted(muted: boolean): void {
    this.muted.set(muted);
    if (muted) {
      const currentBgm = this.currentBgm();
      if (currentBgm && !currentBgm.paused) {
        currentBgm.pause();
      }
    } else {
      this.applyBgmVolume();
      const currentBgm = this.currentBgm();
      if (currentBgm && currentBgm.paused) {
        void currentBgm.play().catch(() => {});
      }
    }
  }

  /**
   * Toggles the current muted state.
   * @public
   * @return {boolean}
   */
  public toggleMute(): boolean {
    const next = !this.muted();
    this.setMuted(next);
    return next;
  }

  /**
   * Calculates and applies effective volume to active BGM audio.
   * @private
   * @return {void}
   */
  private applyBgmVolume(): void {
    const currentBgm = this.currentBgm();
    if (currentBgm) {
      const effectiveVolume = this.muted()
        ? 0
        : MathUtils.clamp(this.masterVolume() * this.bgmVolume() * this.currentBgmScale(), 0, 1);
      currentBgm.volume = effectiveVolume;
    }
  }

  /**
   * Attaches window visibility listener.
   * @private
   * @return {void}
   */
  private installVisibilityListener(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        const currentBgm = this.currentBgm();
        if (currentBgm && !currentBgm.paused) {
          this.bgmWasPlayingBeforeBlur.set(true);
          currentBgm.pause();
        } else {
          this.bgmWasPlayingBeforeBlur.set(false);
        }
      } else {
        if (this.bgmWasPlayingBeforeBlur() && !this.muted()) {
          this.resumeBgm();
        }
        this.bgmWasPlayingBeforeBlur.set(false);
      }
    });
  }
}).instance;
