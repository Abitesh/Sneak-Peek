import { mergeTranscriptChunks } from '../../src/lib/transcriptMerge.mjs';

export type ListenSpeaker = 'user' | 'interviewer';
export type ListenTranscript = { speaker: ListenSpeaker; text: string; final: boolean };
export type ListenRecognizer = {
  start(): void;
  stop(): void;
  cancel?(): void;
  finalize?(): void;
  notifySpeechEnded?(): void;
  setSampleRate(rate: number): void;
  setAudioChannelCount?(count: number): void;
  write(pcm: Buffer): void;
};

export type ListenHistory = { user: string; interviewer: string };

/** Text already recognized by the opted-in meeting stream. Never stores PCM. */
export class RecentListenTranscript {
  private events: Array<ListenTranscript & { at: number }> = [];
  private static readonly windowMs = 8_000;

  add(event: ListenTranscript, at = performance.now()): void {
    if (!event.text.trim()) return;
    this.events = this.events.filter(item =>
      at - item.at <= RecentListenTranscript.windowMs && (item.speaker !== event.speaker || item.final));
    this.events.push({ ...event, text: event.text.slice(-600), at });
    if (this.events.length > 6) this.events.shift();
  }

  take(at = performance.now()): ListenHistory {
    const history: ListenHistory = { user: '', interviewer: '' };
    for (const item of this.events) {
      if (at - item.at <= RecentListenTranscript.windowMs) {
        history[item.speaker] = mergeTranscriptChunks(history[item.speaker], item.text);
      }
    }
    this.clear();
    return history;
  }

  clear(): void {
    this.events = [];
  }
}

type Channel = { recognizer: ListenRecognizer; rate: number; final: string; partial: string; pending: boolean };

/** A Listen turn exclusively owns its recognizers, their results and their finalization. */
export class ListenSession {
  private channels = new Map<ListenSpeaker, Channel>();
  private state: 'recording' | 'finalizing' | 'closed' = 'recording';
  private settle: (() => void) | undefined;
  private lastInterim: Partial<Record<ListenSpeaker, number>> = {};

  constructor(
    readonly id: string,
    readonly owner: number,
    private readonly deliver: (event: ListenTranscript) => void,
    private leadIn: ListenHistory = { user: '', interviewer: '' },
  ) {}

  add(speaker: ListenSpeaker, recognizer: ListenRecognizer, rate: number): void {
    if (this.state !== 'recording') return;
    this.channels.set(speaker, { recognizer, rate, final: '', partial: '', pending: false });
    recognizer.setAudioChannelCount?.(1);
    recognizer.setSampleRate(rate);
    recognizer.start();
  }

  write(speaker: ListenSpeaker, pcm: Buffer, rate: number): void {
    const channel = this.channels.get(speaker);
    if (this.state !== 'recording' || !channel) return;
    if (channel.rate !== rate) {
      channel.rate = rate;
      channel.recognizer.setSampleRate(rate);
    }
    channel.pending = true;
    channel.recognizer.write(pcm);
  }

  speechEnded(speaker: ListenSpeaker): void {
    if (this.state === 'recording') this.channels.get(speaker)?.recognizer.notifySpeechEnded?.();
  }

  accept(event: ListenTranscript): void {
    const channel = this.channels.get(event.speaker);
    if (this.state === 'closed' || !channel || !event.text.trim()) return;
    if (event.final) {
      channel.final = mergeTranscriptChunks(channel.final, event.text);
      channel.partial = '';
      channel.pending = false;
      this.deliver(event);
      if (![...this.channels.values()].some(item => item.pending)) this.settle?.();
    } else {
      channel.partial = event.text;
      const now = performance.now();
      if (now - (this.lastInterim[event.speaker] ?? -Infinity) >= 80) {
        this.lastInterim[event.speaker] = now;
        this.deliver(event);
      }
    }
  }

  async finish(waitMs = 1_200): Promise<ListenHistory | null> {
    if (this.state !== 'recording') return null;
    this.state = 'finalizing';
    try {
      if ([...this.channels.values()].some(channel => channel.pending)) {
        await new Promise<void>(resolve => {
          const timer = setTimeout(() => this.settle?.(), waitMs);
          this.settle = () => {
            clearTimeout(timer);
            this.settle = undefined;
            resolve();
          };
          try {
            for (const channel of this.channels.values()) channel.recognizer.finalize?.();
          } catch {
            this.settle?.();
          }
        });
      }
      if (this.state !== 'finalizing') return null;
      const transcript = (speaker: ListenSpeaker) => {
        const channel = this.channels.get(speaker);
        const live = channel ? mergeTranscriptChunks(channel.final, channel.partial) : '';
        return mergeTranscriptChunks(this.leadIn[speaker], live).trim();
      };
      return { user: transcript('user'), interviewer: transcript('interviewer') };
    } finally {
      this.cancel();
    }
  }

  cancel(): void {
    if (this.state === 'closed') return;
    this.state = 'closed';
    this.settle?.();
    for (const { recognizer } of this.channels.values()) {
      try {
        if (recognizer.cancel) recognizer.cancel();
        else recognizer.stop();
      } catch {
        // Closing one recognizer must still close the other.
      }
    }
    this.channels.clear();
    this.leadIn = { user: '', interviewer: '' };
  }
}
