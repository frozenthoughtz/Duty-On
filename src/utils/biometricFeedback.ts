// Biometric Audio & Haptic Feedback Engine
// Provides high-fidelity sensory feedback for security officer biometric authentication,
// checkpoint scans, and lone-worker health monitoring.

class BiometricFeedbackEngine {
  private audioCtx: AudioContext | null = null;
  private hapticsEnabled: boolean = true;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      } catch (err) {
        console.warn('Biometric Web Audio unavailable', err);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Haptic vibration feedback (mobile devices)
  triggerHaptic(type: 'scan' | 'verified' | 'warning' | 'error') {
    if (typeof window === 'undefined' || !this.hapticsEnabled) return;
    if ('vibrate' in navigator) {
      try {
        switch (type) {
          case 'scan':
            navigator.vibrate(35);
            break;
          case 'verified':
            // Double pleasant pulse
            navigator.vibrate([40, 50, 60]);
            break;
          case 'warning':
            navigator.vibrate([80, 50, 80]);
            break;
          case 'error':
            navigator.vibrate([100, 40, 100, 40, 120]);
            break;
        }
      } catch {
        // Ignore devices with restricted vibration permissions
      }
    }
  }

  // Synthetic acoustic chime for biometric actions
  playAudioChime(type: 'scan' | 'verified' | 'warning' | 'heartbeat') {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'verified') {
        // High-tech ascending dual harmonic chime (PSIRA match)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.46);
      } else if (type === 'scan') {
        // Crisp laser chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'heartbeat') {
        // Subtle low acoustic thump
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.07);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'warning') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.12);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.start(now);
        osc.stop(now + 0.29);
      }
    } catch {
      // Audio context policy blocked
    }
  }

  // Combined multimodal sensory feedback
  feedback(type: 'scan' | 'verified' | 'warning' | 'heartbeat') {
    this.triggerHaptic(type === 'heartbeat' ? 'scan' : type);
    this.playAudioChime(type);
  }

  setHapticsEnabled(enabled: boolean) {
    this.hapticsEnabled = enabled;
  }
}

export const biometricFeedback = new BiometricFeedbackEngine();
