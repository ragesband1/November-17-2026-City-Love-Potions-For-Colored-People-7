class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.1,
    delay = 0
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playPotionCollect() {
    this.tone(587.33, 0.12, 'triangle', 0.1, 0);
    this.tone(880, 0.18, 'sine', 0.1, 0.06);
  }

  playFriendSuccess(isBonus: boolean) {
    this.tone(523.25, 0.14, 'sine', 0.09, 0);
    this.tone(659.25, 0.14, 'sine', 0.09, 0.07);
    this.tone(783.99, 0.22, 'triangle', 0.1, 0.14);
    if (isBonus) {
      this.tone(1046.5, 0.25, 'sine', 0.1, 0.21);
    }
  }

  playRoomToggle(sealed: boolean) {
    if (sealed) {
      this.tone(320, 0.08, 'square', 0.05, 0);
      this.tone(240, 0.1, 'triangle', 0.07, 0.05);
    } else {
      this.tone(240, 0.07, 'triangle', 0.05, 0);
      this.tone(360, 0.09, 'triangle', 0.06, 0.05);
    }
  }

  playConflictPenalty() {
    this.tone(210, 0.18, 'sawtooth', 0.09, 0);
    this.tone(165, 0.24, 'sawtooth', 0.09, 0.1);
  }

  playSparkWarning() {
    this.tone(920, 0.08, 'sawtooth', 0.07, 0);
    this.tone(740, 0.08, 'sawtooth', 0.07, 0.12);
  }

  playGameOver() {
    this.tone(392, 0.2, 'sawtooth', 0.09, 0);
    this.tone(311.13, 0.22, 'sawtooth', 0.09, 0.18);
    this.tone(233.08, 0.4, 'sawtooth', 0.1, 0.36);
  }

  playLevelUp() {
    this.tone(523.25, 0.12, 'triangle', 0.1, 0);
    this.tone(659.25, 0.12, 'triangle', 0.1, 0.09);
    this.tone(783.99, 0.12, 'triangle', 0.1, 0.18);
    this.tone(1046.5, 0.3, 'sine', 0.12, 0.27);
  }
}

export const soundEngine = new SoundEngine();
