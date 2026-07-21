import { Track } from '../types';

export class AudioEngine {
  context: AudioContext;
  audioElement: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode | null = null;
  eqNodes: BiquadFilterNode[] = [];
  reverbNode: ConvolverNode;
  gainNode: GainNode;
  
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;

  private objectUrl: string | null = null;
  private animationFrameId: number | null = null;
  public analyser: AnalyserNode;

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    // Core nodes
    this.gainNode = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.reverbNode = this.context.createConvolver();
    
    // Set up EQ (10 bands)
    const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.eqNodes = frequencies.map((freq) => {
      const filter = this.context.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });

    // We can't connect sourceNode until we resume context, but we will do it on first play
    
    // Event listeners
    this.audioElement.addEventListener('ended', () => this.onEnded?.());
    this.audioElement.addEventListener('timeupdate', () => this.onTimeUpdate?.(this.audioElement.currentTime));
    this.audioElement.addEventListener('durationchange', () => this.onDurationChange?.(this.audioElement.duration));
  }

  private connectNodes() {
    if (this.sourceNode) return;
    this.sourceNode = this.context.createMediaElementSource(this.audioElement);
    
    let currentNode: AudioNode = this.sourceNode;
    
    // Chain EQ
    this.eqNodes.forEach(node => {
      currentNode.connect(node);
      currentNode = node;
    });
    
    // Split for reverb vs dry
    const dryGain = this.context.createGain();
    const wetGain = this.context.createGain();
    
    // Default to dry only for now
    dryGain.gain.value = 1;
    wetGain.gain.value = 0;
    // We can adjust reverb wetness when a preset is selected
    (this as any).wetGain = wetGain;
    
    currentNode.connect(dryGain);
    currentNode.connect(this.reverbNode);
    this.reverbNode.connect(wetGain);
    
    dryGain.connect(this.gainNode);
    wetGain.connect(this.gainNode);
    
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  async playTrack(track: Track) {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    
    this.connectNodes();

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
    
    if (track.fileHandle) {
      // It's a local file
      try {
        const file = await track.fileHandle.getFile();
        this.objectUrl = URL.createObjectURL(file);
        this.audioElement.src = this.objectUrl;
      } catch (e) {
        console.error("Failed to read file", e);
      }
    } else {
      // Temporary fallback: use filePath as the direct URL
      this.audioElement.src = track.filePath;
    }
    
    this.audioElement.load();
    await this.audioElement.play();
  }

  async loadTrackOnly(track: Track, seekTo: number = 0) {
    this.connectNodes();

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
    
    if (track.fileHandle) {
      try {
        const file = await track.fileHandle.getFile();
        this.objectUrl = URL.createObjectURL(file);
        this.audioElement.src = this.objectUrl;
      } catch (e) {
        console.error("Failed to read file", e);
      }
    } else {
      this.audioElement.src = track.filePath;
    }
    
    this.audioElement.load();
    this.audioElement.currentTime = seekTo;
  }

  pause() {
    this.audioElement.pause();
  }

  resume() {
    this.audioElement.play().catch(e => console.warn("Resume failed:", e));
  }

  seek(time: number) {
    this.audioElement.currentTime = time;
  }

  setVolume(vol: number) {
    this.gainNode.gain.value = vol;
  }
  
  setPlaybackRate(rate: number) {
    this.audioElement.playbackRate = rate;
  }

  setEqBands(gains: number[]) {
    if (gains.length !== this.eqNodes.length) return;
    this.eqNodes.forEach((node, i) => {
      node.gain.value = gains[i];
    });
  }

  async setReverbPreset(preset: string) {
    // In a real app we'd load impulse responses (IR) for convolutions.
    // For this prototype, we'll generate simple synthetic IRs or just adjust wet gain.
    const wet = (this as any).wetGain as GainNode;
    if (!wet) return;
    
    if (preset === 'none') {
      wet.gain.value = 0;
      return;
    }
    
    // Generate synthetic IR for demo
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * 2; // 2 seconds
    const impulse = this.context.createBuffer(2, length, sampleRate);
    
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.5));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    
    this.reverbNode.buffer = impulse;
    wet.gain.value = 0.3; // 30% wet mix
  }

  getAnalyserData(): Uint8Array {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const engine = new AudioEngine();
