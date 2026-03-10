import { BlockId } from '../world/BlockTypes';

type AudioNodes = {
  ctx: AudioContext;
  master: GainNode;
};

type WaveType = OscillatorType;

type WindowWithWebkitAudio = Window &
  typeof globalThis & {
    webkitAudioContext?: new () => AudioContext;
  };

export class SfxSystem {
  private readonly domElement: HTMLElement;
  private nodes: AudioNodes | null = null;
  private readonly unlockHandler: () => void;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.unlockHandler = () => {
      this.ensureAudioNodes();
      void this.resumeContext();
    };
    this.installUnlockHandlers();
  }

  playMiningTick(blockId: BlockId): void {
    const nodes = this.ensureAudioNodes();
    if (!nodes) {
      return;
    }
    void this.resumeContext();
    const now = nodes.ctx.currentTime;
    const material = this.materialFor(blockId);

    if (material === 'stone') {
      this.playNoiseBurst(now, 0.045, 0.045, 1400, 0.8);
      this.playTone(now, 1220 + this.jitter(90), 880 + this.jitter(70), 0.05, 'triangle', 0.035);
      return;
    }
    if (material === 'wood') {
      this.playTone(now, 440 + this.jitter(45), 330 + this.jitter(40), 0.06, 'square', 0.04);
      this.playNoiseBurst(now + 0.007, 0.05, 0.03, 850, 0.5);
      return;
    }
    if (material === 'foliage') {
      this.playNoiseBurst(now, 0.03, 0.022, 2200, 1.6);
      return;
    }
    this.playNoiseBurst(now, 0.04, 0.035, 900, 0.9);
    this.playTone(now, 540 + this.jitter(50), 360 + this.jitter(30), 0.05, 'triangle', 0.02);
  }

  playBlockBreak(blockId: BlockId): void {
    const nodes = this.ensureAudioNodes();
    if (!nodes) {
      return;
    }
    void this.resumeContext();
    const now = nodes.ctx.currentTime;
    const material = this.materialFor(blockId);

    if (material === 'stone') {
      this.playNoiseBurst(now, 0.12, 0.1, 1200, 0.7);
      this.playNoiseBurst(now + 0.03, 0.1, 0.08, 700, 0.6);
      this.playTone(now, 280 + this.jitter(25), 150 + this.jitter(16), 0.11, 'triangle', 0.06);
      return;
    }
    if (material === 'wood') {
      this.playTone(now, 260 + this.jitter(30), 190 + this.jitter(22), 0.1, 'square', 0.07);
      this.playTone(now + 0.022, 220 + this.jitter(30), 165 + this.jitter(22), 0.09, 'square', 0.06);
      this.playNoiseBurst(now, 0.08, 0.06, 640, 0.55);
      return;
    }
    if (material === 'foliage') {
      this.playNoiseBurst(now, 0.09, 0.075, 2400, 1.8);
      this.playTone(now, 720 + this.jitter(60), 560 + this.jitter(45), 0.08, 'triangle', 0.03);
      return;
    }
    this.playNoiseBurst(now, 0.11, 0.09, 820, 1);
    this.playTone(now, 330 + this.jitter(34), 210 + this.jitter(20), 0.1, 'triangle', 0.05);
  }

  playBlockPlace(blockId: BlockId): void {
    const nodes = this.ensureAudioNodes();
    if (!nodes) {
      return;
    }
    void this.resumeContext();
    const now = nodes.ctx.currentTime;
    const material = this.materialFor(blockId);

    if (material === 'stone') {
      this.playNoiseBurst(now, 0.055, 0.04, 980, 0.7);
      this.playTone(now, 250 + this.jitter(20), 210 + this.jitter(16), 0.05, 'triangle', 0.04);
      return;
    }
    if (material === 'wood') {
      this.playTone(now, 210 + this.jitter(24), 170 + this.jitter(16), 0.06, 'square', 0.055);
      this.playNoiseBurst(now, 0.05, 0.03, 750, 0.6);
      return;
    }
    if (material === 'foliage') {
      this.playNoiseBurst(now, 0.045, 0.025, 2100, 1.5);
      return;
    }
    this.playNoiseBurst(now, 0.05, 0.035, 760, 0.9);
    this.playTone(now, 300 + this.jitter(25), 250 + this.jitter(20), 0.055, 'triangle', 0.03);
  }

  playAttackSwing(): void {
    const nodes = this.ensureAudioNodes();
    if (!nodes) {
      return;
    }
    void this.resumeContext();
    const now = nodes.ctx.currentTime;
    this.playTone(now, 460 + this.jitter(35), 220 + this.jitter(24), 0.11, 'sawtooth', 0.065);
    this.playNoiseBurst(now + 0.01, 0.07, 0.02, 3000, 2.2);
  }

  playAttackHit(): void {
    const nodes = this.ensureAudioNodes();
    if (!nodes) {
      return;
    }
    void this.resumeContext();
    const now = nodes.ctx.currentTime;
    this.playNoiseBurst(now, 0.08, 0.065, 1300, 1.1);
    this.playTone(now, 200 + this.jitter(20), 120 + this.jitter(14), 0.09, 'square', 0.08);
    this.playTone(now + 0.01, 380 + this.jitter(40), 260 + this.jitter(30), 0.06, 'triangle', 0.03);
  }

  playPlayerHurt(): void {
    const nodes = this.ensureAudioNodes();
    if (!nodes) {
      return;
    }
    void this.resumeContext();
    const now = nodes.ctx.currentTime;
    this.playTone(now, 190 + this.jitter(18), 120 + this.jitter(12), 0.16, 'sawtooth', 0.08);
    this.playTone(now + 0.018, 230 + this.jitter(20), 145 + this.jitter(14), 0.13, 'triangle', 0.05);
    this.playNoiseBurst(now, 0.1, 0.045, 900, 1.5);
  }

  playPlayerEat(withBoost: boolean): void {
    const nodes = this.ensureAudioNodes();
    if (!nodes) {
      return;
    }
    void this.resumeContext();
    const now = nodes.ctx.currentTime;
    this.playTone(now, 640 + this.jitter(30), 430 + this.jitter(24), 0.08, 'triangle', 0.06);
    this.playNoiseBurst(now + 0.01, 0.06, 0.03, 2000, 1.4);
    if (withBoost) {
      this.playTone(now + 0.09, 520 + this.jitter(18), 760 + this.jitter(24), 0.14, 'sine', 0.04);
    }
  }

  playItemPickup(): void {
    const nodes = this.ensureAudioNodes();
    if (!nodes) {
      return;
    }
    void this.resumeContext();
    const now = nodes.ctx.currentTime;
    this.playTone(now, 760 + this.jitter(20), 980 + this.jitter(26), 0.055, 'triangle', 0.045);
    this.playTone(now + 0.03, 920 + this.jitter(20), 1240 + this.jitter(28), 0.07, 'triangle', 0.038);
  }

  private materialFor(blockId: BlockId): 'stone' | 'wood' | 'foliage' | 'soft' {
    if (blockId === BlockId.Stone || blockId === BlockId.Gravel || blockId === BlockId.Clay) {
      return 'stone';
    }
    if (blockId === BlockId.Wood) {
      return 'wood';
    }
    if (
      blockId === BlockId.Leaves ||
      blockId === BlockId.TallGrass ||
      blockId === BlockId.FlowerRed ||
      blockId === BlockId.FlowerYellow
    ) {
      return 'foliage';
    }
    return 'soft';
  }

  private playTone(
    when: number,
    startHz: number,
    endHz: number,
    duration: number,
    wave: WaveType,
    volume: number,
  ): void {
    const nodes = this.nodes;
    if (!nodes) {
      return;
    }
    const oscillator = nodes.ctx.createOscillator();
    const gain = nodes.ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(Math.max(40, startHz), when);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endHz), when + duration);
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(gain);
    gain.connect(nodes.master);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  private playNoiseBurst(
    when: number,
    duration: number,
    volume: number,
    centerHz: number,
    q: number,
  ): void {
    const nodes = this.nodes;
    if (!nodes) {
      return;
    }
    const sampleLength = Math.max(16, Math.floor(nodes.ctx.sampleRate * duration));
    const buffer = nodes.ctx.createBuffer(1, sampleLength, nodes.ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < sampleLength; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / sampleLength);
    }

    const source = nodes.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = nodes.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(Math.max(80, centerHz + this.jitter(centerHz * 0.08)), when);
    filter.Q.setValueAtTime(Math.max(0.1, q), when);
    const gain = nodes.ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(nodes.master);
    source.start(when);
    source.stop(when + duration + 0.01);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private installUnlockHandlers(): void {
    this.domElement.addEventListener('pointerdown', this.unlockHandler, { passive: true });
    window.addEventListener('keydown', this.unlockHandler, { passive: true });
  }

  private async resumeContext(): Promise<void> {
    if (!this.nodes) {
      return;
    }
    if (this.nodes.ctx.state === 'running') {
      return;
    }
    try {
      await this.nodes.ctx.resume();
    } catch {
      // Ignore browser restrictions until next user gesture.
    }
  }

  private ensureAudioNodes(): AudioNodes | null {
    if (this.nodes) {
      return this.nodes;
    }
    const AudioCtor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioCtor) {
      return null;
    }
    const ctx = new AudioCtor();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    this.nodes = { ctx, master };
    return this.nodes;
  }

  private jitter(range: number): number {
    return (Math.random() * 2 - 1) * range;
  }
}
