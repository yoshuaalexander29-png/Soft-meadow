// Procedural ambient audio generator using Web Audio API
// Synthesizes gentle meadow wind breeze and peaceful anime chime harmonics.

class MeadowAudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private chimeTimer: number | null = null;
  private isMutedState = false;

  private pentatonicFrequencies = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6

  private init() {
    if (this.ctx) return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;

    this.ctx = new AudioCtxClass();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMutedState ? 0 : 0.65, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Wind noise generation
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    // Pink-noise algorithm for warm natural breeze
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Bandpass filter for wind howl & rustle
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'bandpass';
    this.filterNode.frequency.setValueAtTime(420, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // LFO to oscillate wind frequency gently
    this.lfoNode = this.ctx.createOscillator();
    this.lfoNode.type = 'sine';
    this.lfoNode.frequency.setValueAtTime(0.18, this.ctx.currentTime); // slow wind gust cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
    this.lfoNode.connect(lfoGain);
    lfoGain.connect(this.filterNode.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.noiseNode.start();
    this.lfoNode.start();

    // Start periodic gentle chime harmonics
    this.scheduleNextChime();
  }

  private playGentleChime() {
    if (!this.ctx || this.isMutedState) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      const freq = this.pentatonicFrequencies[Math.floor(Math.random() * this.pentatonicFrequencies.length)];
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.08, now + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(chimeGain);
      if (this.masterGain) {
        chimeGain.connect(this.masterGain);
      }

      osc.start(now);
      osc.stop(now + 4.0);
    } catch {
      // Audio node cleanup safeguard
    }
  }

  private scheduleNextChime() {
    if (this.chimeTimer) {
      window.clearTimeout(this.chimeTimer);
    }
    const delay = 4000 + Math.random() * 5500;
    this.chimeTimer = window.setTimeout(() => {
      this.playGentleChime();
      this.scheduleNextChime();
    }, delay);
  }

  public start() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    } else if (!this.ctx) {
      this.init();
    }
  }

  public toggleMute(): boolean {
    if (!this.ctx) {
      this.init();
      this.isMutedState = false;
      return false; // unmuted
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMutedState = !this.isMutedState;

    if (this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.isMutedState ? 0 : 0.65, now, 0.08);
    }

    return this.isMutedState;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public dispose() {
    if (this.chimeTimer) {
      window.clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const meadowAudio = new MeadowAudioSystem();
