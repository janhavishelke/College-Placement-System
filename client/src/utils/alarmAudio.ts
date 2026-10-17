/**
 * Web Audio API Study Alarm Synthesizer
 * Generates an audible multi-frequency alarm chime without needing external mp3 files.
 */

let audioCtx: AudioContext | null = null;
let currentOscillators: OscillatorNode[] = [];
let isRinging = false;
let ringInterval: any = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a single pleasant 4-tone melodic chime sequence (e.g., C5 -> E5 -> G5 -> C6)
 */
export function playChimeSequence() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

      // Smooth attack and decay envelope
      gain.gain.setValueAtTime(0, startTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, startTime + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.12);
      osc.stop(startTime + idx * 0.12 + 0.38);
    });
  } catch (err) {
    console.warn('Audio alarm synthesis notice:', err);
  }
}

/**
 * Starts continuous alarm ringing (repeats chime every 1.5s until dismissed)
 */
export function startAlarmRinging() {
  if (isRinging) return;
  isRinging = true;

  playChimeSequence();
  ringInterval = setInterval(() => {
    if (isRinging) {
      playChimeSequence();
    }
  }, 1600);
}

/**
 * Stops continuous alarm ringing
 */
export function stopAlarmRinging() {
  isRinging = false;
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

export function isAlarmRingingActive(): boolean {
  return isRinging;
}
