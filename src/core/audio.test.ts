import { describe, expect, it, vi } from 'vitest';

import { createAudioEngine, MUSIC_BED_GAIN } from './audio';

class FakeParam {
  value = 0;
  readonly calls: string[] = [];
  setValueAtTime(value: number): this {
    this.value = value;
    this.calls.push('setValueAtTime');
    return this;
  }
  linearRampToValueAtTime(value: number): this {
    this.value = value;
    this.calls.push('linearRampToValueAtTime');
    return this;
  }
  exponentialRampToValueAtTime(value: number): this {
    this.value = value;
    this.calls.push('exponentialRampToValueAtTime');
    return this;
  }
  cancelScheduledValues(): this {
    this.calls.push('cancelScheduledValues');
    return this;
  }
}

class FakeNode {
  readonly connected: unknown[] = [];
  disconnected = 0;
  connect(target: unknown): unknown {
    this.connected.push(target);
    return target;
  }
  disconnect(): void {
    this.disconnected += 1;
  }
}

class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
}

class FakeOscillator extends FakeNode {
  type = 'sine';
  readonly frequency = new FakeParam();
  readonly detune = new FakeParam();
  started: number | null = null;
  stopped: number | null = null;
  onended: (() => void) | null = null;
  start(at: number): void {
    this.started = at;
  }
  stop(at: number): void {
    this.stopped = at;
  }
}

class FakeBufferSource extends FakeNode {
  buffer: unknown = null;
  started: number | null = null;
  stopped: number | null = null;
  onended: (() => void) | null = null;
  start(at: number): void {
    this.started = at;
  }
  stop(at: number): void {
    this.stopped = at;
  }
}

class FakeFilter extends FakeNode {
  type = 'lowpass';
  readonly frequency = new FakeParam();
  readonly Q = new FakeParam();
}

class FakeContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  readonly sampleRate = 48_000;
  readonly destination = new FakeNode();
  readonly oscillators: FakeOscillator[] = [];
  readonly sources: FakeBufferSource[] = [];
  readonly gains: FakeGain[] = [];
  mediaRoutes = 0;
  buffersCreated = 0;
  resumed = 0;
  suspended = 0;
  closed = 0;
  /** Deliberately present so a test can prove we never call it. */
  readonly decodeAudioData = vi.fn();

  createGain(): FakeGain {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }
  createOscillator(): FakeOscillator {
    const osc = new FakeOscillator();
    this.oscillators.push(osc);
    return osc;
  }
  createBufferSource(): FakeBufferSource {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source;
  }
  createBiquadFilter(): FakeFilter {
    return new FakeFilter();
  }
  createBuffer(_channels: number, frames: number): { getChannelData: () => Float32Array } {
    this.buffersCreated += 1;
    const data = new Float32Array(frames);
    return { getChannelData: () => data };
  }
  createMediaElementSource(): FakeNode {
    this.mediaRoutes += 1;
    return new FakeNode();
  }
  async resume(): Promise<void> {
    this.resumed += 1;
    this.state = 'running';
  }
  async suspend(): Promise<void> {
    this.suspended += 1;
    this.state = 'suspended';
  }
  async close(): Promise<void> {
    this.closed += 1;
    this.state = 'closed';
  }
}

class FakeAudioElement {
  /** Matches what `defaultMusicElementFactory` ships. */
  preload = 'none';
  loop = false;
  played = 0;
  paused = 0;
  removed = 0;
  play(): Promise<void> {
    this.played += 1;
    return Promise.resolve();
  }
  pause(): void {
    this.paused += 1;
  }
  remove(): void {
    this.removed += 1;
  }
}

function harness() {
  const context = new FakeContext();
  const tracks = { theme: new FakeAudioElement(), result: new FakeAudioElement() };
  const engine = createAudioEngine({
    createContext: () => context as unknown as AudioContext,
    createMusicElement: (track) => tracks[track] as unknown as HTMLAudioElement,
    random: () => 0.5,
  });
  // Gains are created in order: master, sfx, then one per music voice.
  const gainFor = (index: number) => context.gains[2 + index];
  return { context, tracks, music: tracks.theme, engine, gainFor };
}

describe('audio engine', () => {
  it('stays completely inert while sound is off', () => {
    const context = new FakeContext();
    const createContext = vi.fn(() => context as unknown as AudioContext);
    const createMusicElement = vi.fn(() => null);
    const engine = createAudioEngine({ createContext, createMusicElement });

    engine.play('press');
    engine.startMusic('theme');
    engine.unlock();

    // No context means no audio hardware, and no <audio> element means the
    // ~1.75 MB theme is never requested for the default-off visitor.
    expect(createContext).not.toHaveBeenCalled();
    expect(createMusicElement).not.toHaveBeenCalled();
    expect(engine.isEnabled()).toBe(false);
  });

  it('builds the graph and resumes a suspended context on the first cue', () => {
    const { context, engine } = harness();
    engine.setEnabled(true);
    engine.play('press');

    expect(context.resumed).toBeGreaterThan(0);
    expect(context.state).toBe('running');
    expect(context.oscillators).toHaveLength(1);

    const [osc] = context.oscillators;
    expect(osc?.started).not.toBeNull();
    // Every voice is bounded — nothing is left running to leak.
    expect(osc?.stopped).toBeGreaterThan(osc?.started ?? 0);
  });

  it('gives each cue its own voice shape', () => {
    const { context, engine } = harness();
    engine.setEnabled(true);

    engine.play('select');
    expect(context.oscillators).toHaveLength(2);

    engine.play('confetti');
    expect(context.oscillators).toHaveLength(7);

    engine.play('reveal');
    expect(context.oscillators).toHaveLength(11);
  });

  it('synthesizes the swipe from a reusable noise buffer instead of oscillators', () => {
    const { context, engine } = harness();
    engine.setEnabled(true);

    engine.play('swipe');
    engine.play('swipe');

    expect(context.oscillators).toHaveLength(0);
    expect(context.sources).toHaveLength(2);
    // One buffer, reused: the second swipe allocates nothing.
    expect(context.buffersCreated).toBe(1);
  });

  it('releases every node when a voice ends', () => {
    const { context, engine } = harness();
    engine.setEnabled(true);
    engine.play('press');

    const osc = context.oscillators[0];
    expect(osc?.disconnected).toBe(0);
    osc?.onended?.();
    expect(osc?.disconnected).toBe(1);
  });

  it('streams the theme rather than decoding it', () => {
    const { context, music, engine } = harness();
    engine.setEnabled(true);
    engine.startMusic('theme');

    expect(context.mediaRoutes).toBe(1);
    expect(music.played).toBe(1);
    expect(music.loop).toBe(true);
    // A 152.6s decode would be 55.88 MB of Float32 in the JS heap.
    expect(context.decodeAudioData).not.toHaveBeenCalled();
  });

  it('buffers ahead only once someone has opted in', () => {
    const { music, engine } = harness();
    engine.setEnabled(true);
    // The factory ships `none`; nothing downloads for a default-off visitor.
    expect(music.preload).toBe('none');

    engine.startMusic('theme');
    // A returning visitor's first tap should not also pay for the fetch.
    expect(music.preload).toBe('auto');
  });

  it('hands the quiz bed over to the result bed instead of cutting', () => {
    const { context, tracks, engine, gainFor } = harness();
    engine.setEnabled(true);
    engine.startMusic('theme');
    expect(tracks.theme.played).toBe(1);

    engine.startMusic('result');

    expect(tracks.result.played).toBe(1);
    // Separate elements, routes and gains, so the handover is a crossfade.
    expect(context.mediaRoutes).toBe(2);
    expect(gainFor(0)?.gain.calls).toContain('exponentialRampToValueAtTime');
    expect(gainFor(0)?.gain.value).toBeLessThan(MUSIC_BED_GAIN);
    expect(gainFor(1)?.gain.value).toBe(MUSIC_BED_GAIN);
  });

  it('does not restart a bed that is already the one playing', () => {
    const { tracks, engine } = harness();
    engine.setEnabled(true);

    engine.startMusic('theme');
    engine.startMusic('theme');
    engine.startMusic('theme');

    // Re-entering a question must not rewind the quiz bed to zero.
    expect(tracks.theme.played).toBe(1);
  });

  it('fades the bed up to the trimmed level and back down on stop', () => {
    const { context, engine } = harness();
    engine.setEnabled(true);
    engine.startMusic('theme');

    const musicBus = context.gains[2];
    expect(musicBus?.gain.value).toBe(MUSIC_BED_GAIN);

    engine.stopMusic(0);
    expect(musicBus?.gain.calls).toContain('exponentialRampToValueAtTime');
    expect(musicBus?.gain.value).toBeLessThan(MUSIC_BED_GAIN);
  });

  it('silences and suspends the moment sound is switched off', () => {
    const { context, music, engine } = harness();
    engine.setEnabled(true);
    engine.startMusic('theme');

    engine.setEnabled(false);

    expect(music.paused).toBeGreaterThan(0);
    expect(context.suspended).toBeGreaterThan(0);
    expect(engine.isEnabled()).toBe(false);
  });

  it('releases the audio hardware while the page is hidden', () => {
    const { context, music, engine } = harness();
    engine.setEnabled(true);
    engine.startMusic('theme');

    engine.pauseForHidden();
    expect(music.paused).toBeGreaterThan(0);
    expect(context.suspended).toBeGreaterThan(0);

    // Cues raised while hidden must not queue up and fire on return.
    const before = context.oscillators.length;
    engine.play('press');
    expect(context.oscillators).toHaveLength(before);

    engine.resumeFromHidden();
    expect(context.state).toBe('running');
  });

  it('tears the graph down on destroy and takes the media element with it', () => {
    const { context, music, engine } = harness();
    engine.setEnabled(true);
    engine.play('press');
    engine.startMusic('theme');

    engine.destroy();

    expect(context.closed).toBe(1);
    expect(engine.isEnabled()).toBe(false);
    // The element is appended to the document, so it has to be removed too.
    expect(music.removed).toBe(1);
  });

  it('survives a browser that refuses to build a context', () => {
    const engine = createAudioEngine({
      createContext: () => {
        throw new Error('AudioContext unavailable');
      },
    });
    engine.setEnabled(true);

    expect(() => {
      engine.play('press');
      engine.startMusic('theme');
      engine.unlock();
      engine.destroy();
    }).not.toThrow();
  });
});
