/**
 * Web Audio API & Haptic Feedback Bridge for Barcode Scanning
 * 100% offline, zero external asset downloads.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Positive high-frequency beep (880 Hz, 80ms) for successful barcode detection
 */
export function playScanSuccessSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Non-blocking fallback if browser forbids audio
  }
}

/**
 * Low-frequency warning double buzz (220 Hz) for unregistered barcode
 */
export function playScanErrorSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playTone = (delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.09);
    };

    playTone(0);
    playTone(0.11);
  } catch {
    // Non-blocking
  }
}

/**
 * Physical vibration feedback on supported mobile/tablet devices
 */
export function triggerHaptic(type: 'success' | 'error' = 'success'): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'success') {
        navigator.vibrate(40);
      } else {
        navigator.vibrate([60, 40, 60]);
      }
    }
  } catch {
    // Non-blocking
  }
}
