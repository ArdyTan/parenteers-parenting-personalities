/**
 * Audio is the third feedback channel beside the visual pulse and the haptic
 * tick (conventions.md §1). iOS has no `navigator.vibrate`, so for those users
 * this is the only non-visual confirmation that a tap registered — which is why
 * the sound sites are exactly the `triggerHaptic` sites plus the shared press
 * binding.
 *
 * Two rules hold the performance line established when the WebGL layer was
 * removed (plan §6):
 *
 * 1. **Nothing long is ever decoded.** The 152.6s theme would be 55.88 MB of
 *    Float32 PCM — roughly five times the app's entire heap. It streams through
 *    an `<audio>` element, where the decode buffers are native and never enter
 *    the JS heap `perf:probe` measures.
 * 2. **The one-shots are synthesized, not sampled.** No SFX files exist for this
 *    project, and generating them from oscillators costs zero download and a few
 *    hundred bytes of nodes that disconnect on `ended`. To move to recorded
 *    audio later, replace `playVoice` — every call site stays as it is.
 *
 * Everything degrades to a silent no-op: no `AudioContext`, an unsupported
 * browser, sound switched off, or a rejected unlock all leave the app behaving
 * exactly as it did before.
 */

export type SfxName =
  | 'press'
  | 'select'
  | 'swipe'
  | 'boundary'
  | 'confetti'
  | 'reveal';

export type MusicTrack = 'theme' | 'result';

/**
 * Two beds: `theme` carries the quiz, `result` takes over at the reveal. Each
 * lists AAC first because it is supported in every iOS WebView, with an MP3
 * slot that costs nothing while the file is absent.
 */
export const MUSIC_TRACKS: Readonly<Record<MusicTrack, readonly string[]>> = Object.freeze({
  theme: Object.freeze([
    '/audio/ayo-main-bersama-asik.m4a',
    '/audio/ayo-main-bersama-asik.mp3',
  ]),
  result: Object.freeze([
    '/audio/ayo-main-bersama-asik-result.m4a',
    '/audio/ayo-main-bersama-asik-result.mp3',
  ]),
});

/**
 * The theme is mastered at roughly -19 dBFS RMS, i.e. as a foreground piece.
 * Under UI it wants about -13 dB of trim; tune here rather than re-encoding, so
 * the toggle and the result fade keep working off the same node.
 */
export const MUSIC_BED_GAIN = 0.22;

/** Suspends the context after this long with nothing playing, to release the audio hardware. */
const IDLE_SUSPEND_MS = 8_000;

const MUSIC_FADE_IN = 1.2;
const MUSIC_FADE_OUT = 0.9;

/** Exponential ramps cannot touch zero; this is the practical floor. */
const SILENCE = 0.0001;

type Partial = Readonly<{
  freq: number;
  type: OscillatorType;
  peak: number;
  attack: number;
  decay: number;
  delay: number;
  cutoff: number;
}>;

type NoiseSpec = Readonly<{
  from: number;
  to: number;
  q: number;
  peak: number;
  attack: number;
  decay: number;
  delay: number;
}>;

type Voice = Readonly<{
  partials: readonly Partial[];
  noise?: NoiseSpec;
  /** Random pitch spread, in cents, so repeated taps never machine-gun. */
  detuneCents: number;
}>;

/**
 * Tuned to a C major pentatonic so the cues sit inside the theme rather than
 * beside it. Peaks are deliberately timid — these play under music.
 */
const VOICES: Readonly<Record<SfxName, Voice>> = Object.freeze({
  press: {
    detuneCents: 25,
    partials: [
      { freq: 523.25, type: 'triangle', peak: 0.07, attack: 0.003, decay: 0.055, delay: 0, cutoff: 2200 },
    ],
  },
  select: {
    detuneCents: 15,
    partials: [
      { freq: 783.99, type: 'triangle', peak: 0.085, attack: 0.004, decay: 0.13, delay: 0, cutoff: 3400 },
      { freq: 1046.5, type: 'triangle', peak: 0.07, attack: 0.004, decay: 0.2, delay: 0.05, cutoff: 3400 },
    ],
  },
  swipe: {
    detuneCents: 0,
    partials: [],
    noise: { from: 600, to: 2400, q: 1.1, peak: 0.05, attack: 0.012, decay: 0.16, delay: 0 },
  },
  boundary: {
    detuneCents: 0,
    partials: [
      { freq: 174.61, type: 'sine', peak: 0.09, attack: 0.004, decay: 0.1, delay: 0, cutoff: 700 },
    ],
  },
  confetti: {
    detuneCents: 10,
    partials: [
      { freq: 523.25, type: 'triangle', peak: 0.075, attack: 0.004, decay: 0.42, delay: 0, cutoff: 5200 },
      { freq: 659.25, type: 'triangle', peak: 0.072, attack: 0.004, decay: 0.42, delay: 0.05, cutoff: 5200 },
      { freq: 783.99, type: 'triangle', peak: 0.068, attack: 0.004, decay: 0.42, delay: 0.1, cutoff: 5200 },
      { freq: 1046.5, type: 'triangle', peak: 0.062, attack: 0.004, decay: 0.42, delay: 0.15, cutoff: 5200 },
      { freq: 1318.51, type: 'triangle', peak: 0.055, attack: 0.004, decay: 0.42, delay: 0.21, cutoff: 5200 },
    ],
  },
  reveal: {
    detuneCents: 0,
    partials: [
      { freq: 261.63, type: 'sine', peak: 0.06, attack: 0.07, decay: 1.1, delay: 0, cutoff: 1500 },
      { freq: 392.0, type: 'sine', peak: 0.05, attack: 0.07, decay: 1.05, delay: 0.03, cutoff: 1500 },
      { freq: 523.25, type: 'triangle', peak: 0.045, attack: 0.06, decay: 0.9, delay: 0.07, cutoff: 2400 },
      { freq: 1318.51, type: 'triangle', peak: 0.03, attack: 0.05, decay: 0.7, delay: 0.16, cutoff: 4000 },
    ],
  },
});

export type AudioEngineOptions = Readonly<{
  createContext?: () => AudioContext | null;
  createMusicElement?: (track: MusicTrack) => HTMLAudioElement | null;
  random?: () => number;
}>;

export interface AudioEngine {
  readonly supported: boolean;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  /** Must be called from inside a real user gesture, or the context stays suspended. */
  unlock(): void;
  play(name: SfxName): void;
  /** Crossfades if another track is already running. */
  startMusic(track: MusicTrack): void;
  stopMusic(fadeSeconds?: number): void;
  /** Page hidden: release the audio hardware without forgetting the preference. */
  pauseForHidden(): void;
  resumeFromHidden(): void;
  destroy(): void;
}

export function createAudioEngine(options: AudioEngineOptions = {}): AudioEngine {
  const createContext = options.createContext ?? defaultContextFactory;
  const createMusicElement = options.createMusicElement ?? defaultMusicElementFactory;
  const random = options.random ?? Math.random;

  type MusicVoice = Readonly<{
    element: HTMLAudioElement;
    gain: GainNode;
    route: MediaElementAudioSourceNode | null;
  }>;

  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  // One voice per track, each with its own gain, so a crossfade is just two
  // ramps rather than a shared bus fighting itself.
  const voices = new Map<MusicTrack, MusicVoice>();
  let musicWanted: MusicTrack | null = null;
  let hidden = false;
  let enabled = false;
  let destroyed = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const supported = typeof createContext === 'function';

  function ensureGraph(): AudioContext | null {
    if (destroyed || !enabled) return null;
    if (context) return context;

    const created = safely(createContext);
    if (!created) return null;

    context = created;
    master = created.createGain();
    master.gain.value = 1;
    master.connect(created.destination);

    sfxBus = created.createGain();
    sfxBus.gain.value = 1;
    sfxBus.connect(master);

    return context;
  }

  function resumeIfNeeded(ctx: AudioContext): void {
    if (ctx.state === 'suspended') void ctx.resume?.().catch(() => undefined);
  }

  function scheduleIdleSuspend(): void {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      idleTimer = null;
      // Music holds the context open; only silence releases the hardware.
      if (!context || musicWanted || destroyed) return;
      if (context.state === 'running') void context.suspend?.().catch(() => undefined);
    }, IDLE_SUSPEND_MS);
  }

  function ensureNoiseBuffer(ctx: AudioContext): AudioBuffer | null {
    if (noiseBuffer) return noiseBuffer;
    const frames = Math.floor(ctx.sampleRate * 0.35);
    const buffer = safely(() => ctx.createBuffer(1, frames, ctx.sampleRate));
    if (!buffer) return null;
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) {
      channel[index] = random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return noiseBuffer;
  }

  function playVoice(ctx: AudioContext, bus: GainNode, voice: Voice): void {
    const start = ctx.currentTime + 0.001;
    const detune = voice.detuneCents === 0 ? 0 : (random() * 2 - 1) * voice.detuneCents;

    for (const partial of voice.partials) {
      const at = start + partial.delay;
      const osc = ctx.createOscillator();
      osc.type = partial.type;
      osc.frequency.setValueAtTime(partial.freq, at);
      if (detune !== 0 && osc.detune) osc.detune.setValueAtTime(detune, at);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(partial.cutoff, at);

      const envelope = ctx.createGain();
      shapeEnvelope(envelope.gain, at, partial.peak, partial.attack, partial.decay);

      osc.connect(filter);
      filter.connect(envelope);
      envelope.connect(bus);

      const stop = at + partial.attack + partial.decay + 0.02;
      osc.start(at);
      osc.stop(stop);
      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        envelope.disconnect();
      };
    }

    const noise = voice.noise;
    if (!noise) return;

    const buffer = ensureNoiseBuffer(ctx);
    if (!buffer) return;

    const at = start + noise.delay;
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(noise.q, at);
    filter.frequency.setValueAtTime(noise.from, at);
    filter.frequency.exponentialRampToValueAtTime(noise.to, at + noise.attack + noise.decay);

    const envelope = ctx.createGain();
    shapeEnvelope(envelope.gain, at, noise.peak, noise.attack, noise.decay);

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(bus);

    const stop = at + noise.attack + noise.decay + 0.02;
    source.start(at);
    source.stop(stop);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
    };
  }

  function ensureVoice(ctx: AudioContext, track: MusicTrack): MusicVoice | null {
    const existing = voices.get(track);
    if (existing) return existing;

    const element = safely(() => createMusicElement(track));
    if (!element) return null;
    // Both beds are ambient loops. Set this at the engine boundary as well as
    // in the browser factory so injected/custom media elements keep the same
    // playback contract.
    element.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    if (master) gain.connect(master);

    // `createMediaElementSource` streams: the decode buffers stay native, so a
    // 150s track never becomes ~55 MB of Float32 in the JS heap.
    const route = safely(() => ctx.createMediaElementSource(element)) ?? null;
    if (route) route.connect(gain);

    const voice: MusicVoice = { element, gain, route };
    voices.set(track, voice);
    return voice;
  }

  function fadeVoice(voice: MusicVoice, target: number, seconds: number): void {
    if (!context) return;
    const now = context.currentTime;
    const gain = voice.gain.gain;
    gain.cancelScheduledValues?.(now);
    gain.setValueAtTime(Math.max(gain.value, SILENCE), now);
    if (target <= 0) gain.exponentialRampToValueAtTime(SILENCE, now + seconds);
    else gain.linearRampToValueAtTime(target, now + seconds);
  }

  /** Rings down every voice except `keep`, pausing each once its ramp lands. */
  function retireOtherVoices(keep: MusicTrack | null, seconds: number): void {
    for (const [name, voice] of voices) {
      if (name === keep) continue;
      if (voice.element.paused && voice.gain.gain.value <= SILENCE) continue;
      fadeVoice(voice, 0, seconds);
      setTimeout(() => {
        if (musicWanted !== name) voice.element.pause();
      }, Math.ceil(seconds * 1000));
    }
  }

  const engine: AudioEngine = {
    supported,

    isEnabled: () => enabled,

    setEnabled(next: boolean): void {
      if (enabled === next) return;
      enabled = next;
      if (next) return;

      musicWanted = null;
      for (const voice of voices.values()) {
        voice.element.pause();
        voice.gain.gain.value = 0;
      }
      if (context?.state === 'running') void context.suspend?.().catch(() => undefined);
    },

    unlock(): void {
      const ctx = ensureGraph();
      if (ctx) resumeIfNeeded(ctx);
    },

    play(name: SfxName): void {
      if (hidden) return;
      const ctx = ensureGraph();
      const bus = sfxBus;
      if (!ctx || !bus) return;

      resumeIfNeeded(ctx);
      const voice = VOICES[name];
      safely(() => {
        playVoice(ctx, bus, voice);
        return true;
      });
      scheduleIdleSuspend();
    },

    startMusic(track: MusicTrack): void {
      const ctx = ensureGraph();
      if (!ctx || hidden) return;

      const already = musicWanted === track;
      musicWanted = track;
      resumeIfNeeded(ctx);

      // The outgoing bed rings down while the new one swells, so the reveal
      // reads as a handover rather than a cut.
      retireOtherVoices(track, MUSIC_FADE_OUT);

      const voice = ensureVoice(ctx, track);
      if (!voice) return;

      // When sound is enabled, buffer ahead. Holding `preload="none"` until the
      // first gesture would make that gesture pay for both the fetch and the
      // start. Promoting it here lets a fresh or returning visitor hear the bed
      // as soon as autoplay permits it.
      if (voice.element.preload !== 'auto') voice.element.preload = 'auto';

      if (already && !voice.element.paused) return;

      // `play()` rejects outside a gesture; that is an expected outcome, not an
      // error, so the bed simply stays silent until the next toggle or tap.
      const started = safely(() => voice.element.play());
      if (started && typeof started.catch === 'function') {
        started.catch(() => {
          if (musicWanted === track) musicWanted = null;
        });
      }
      fadeVoice(voice, MUSIC_BED_GAIN, MUSIC_FADE_IN);
    },

    stopMusic(fadeSeconds: number = MUSIC_FADE_OUT): void {
      if (musicWanted === null && voices.size === 0) return;
      musicWanted = null;
      retireOtherVoices(null, fadeSeconds);
    },

    pauseForHidden(): void {
      hidden = true;
      for (const voice of voices.values()) voice.element.pause();
      if (context?.state === 'running') void context.suspend?.().catch(() => undefined);
    },

    resumeFromHidden(): void {
      hidden = false;
      if (!enabled) return;
      const ctx = context;
      if (!ctx) return;
      resumeIfNeeded(ctx);
      const resuming = musicWanted === null ? null : voices.get(musicWanted);
      if (resuming) void resuming.element.play?.()?.catch?.(() => undefined);
    },

    destroy(): void {
      destroyed = true;
      enabled = false;
      musicWanted = null;
      if (idleTimer !== null) clearTimeout(idleTimer);
      idleTimer = null;
      for (const voice of voices.values()) {
        voice.element.pause();
        voice.element.remove();
        voice.route?.disconnect();
        voice.gain.disconnect();
      }
      voices.clear();
      sfxBus?.disconnect();
      master?.disconnect();
      void context?.close?.().catch(() => undefined);
      context = null;
      master = null;
      sfxBus = null;
      noiseBuffer = null;
    },
  };

  return engine;
}

function shapeEnvelope(
  gain: AudioParam,
  at: number,
  peak: number,
  attack: number,
  decay: number,
): void {
  gain.setValueAtTime(SILENCE, at);
  gain.linearRampToValueAtTime(peak, at + attack);
  gain.exponentialRampToValueAtTime(SILENCE, at + attack + decay);
}

function defaultContextFactory(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return typeof Ctor === 'function' ? new Ctor() : null;
}

function defaultMusicElementFactory(track: MusicTrack): HTMLAudioElement | null {
  if (typeof document === 'undefined') return null;
  const element = document.createElement('audio');
  // An explicit sound-off preference still costs zero bytes: neither track is
  // requested while the engine is disabled.
  element.preload = 'none';
  element.loop = true;
  element.setAttribute('playsinline', '');
  for (const src of MUSIC_TRACKS[track]) {
    const source = document.createElement('source');
    source.src = src;
    source.type = src.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';
    element.append(source);
  }
  // Attached rather than detached: in-app WebViews are inconsistent about
  // resource selection on a media element that is not in the document, and an
  // uncontrolled <audio> has no box, so this costs no layout.
  element.dataset.appMusic = track;
  document.body.append(element);
  return element;
}

function safely<T>(action: () => T): T | null {
  try {
    return action();
  } catch {
    return null;
  }
}

let shared: AudioEngine | null = null;

/** The app-wide engine. Scenes call `playSfx`; only `app.ts` touches the rest. */
export function audioEngine(): AudioEngine {
  shared ??= createAudioEngine();
  return shared;
}

/** Fire-and-forget cue for scene code — silent unless sound is on and unlocked. */
export function playSfx(name: SfxName): void {
  audioEngine().play(name);
}

/** Test seam: drops the shared engine so the next call builds a fresh one. */
export function resetAudioEngine(): void {
  shared?.destroy();
  shared = null;
}
