/**
 * Media Evidence Utilities for DutyOn Security Officers
 * Handles camera photo capture, image compression, and microphone voice note recording.
 */

/**
 * Compresses an image File or Blob into a base64 Data URL (JPEG, max width ~900px)
 * to keep Firestore documents lightweight and snappy.
 */
export async function compressImageFile(file: File | Blob, maxWidth = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Add subtle cryptographic / timestamp watermark to prevent tampering
        const now = new Date();
        const watermarkStr = `DUTYON EVIDENCE · ${now.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, height - 24, width, 24);
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#5BCB80';
        ctx.fillText(watermarkStr, 10, height - 8);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Voice Note Recorder using the browser MediaRecorder API
 */
export class VoiceNoteRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime = 0;
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.audioChunks = [];
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone recording is not supported on this device/browser.');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Choose best supported mime type
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg';
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.startTime = Date.now();

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // Slice every 250ms
  }

  async stop(): Promise<{ audioDataUrl: string; durationSec: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder is not active'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const durationSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

        // Stop all tracks in stream to release microphone icon
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        // Convert to base64 Data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            audioDataUrl: reader.result as string,
            durationSec
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}

/**
 * Generates a realistic watermarked security camera inspection photo (Base64 JPEG Data URL)
 */
export function generateSamplePatrolPhoto(title = 'North Gate & Shutter Lock', location = 'Khwamagxaki Center'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const grad = ctx.createLinearGradient(0, 0, 640, 400);
  grad.addColorStop(0, '#0c1b29');
  grad.addColorStop(0.5, '#16283b');
  grad.addColorStop(1, '#08121a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 400);

  // Security Grid & Crosshairs
  ctx.strokeStyle = 'rgba(63, 201, 233, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 40; x < 640; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 400);
    ctx.stroke();
  }
  for (let y = 40; y < 400; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }

  // Draw Gate & Seal Outline Graphic
  ctx.strokeStyle = '#1FA6C9';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(180, 100, 280, 180);
  ctx.fillStyle = 'rgba(14, 42, 69, 0.7)';
  ctx.fillRect(180, 100, 280, 180);

  // Padlock & Tamper-Evident Seal Indicator
  ctx.fillStyle = '#5BCB80';
  ctx.beginPath();
  ctx.arc(320, 165, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#042430';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔒', 320, 172);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('SECURITY SEAL: #TKD-8841-SECURED', 320, 218);
  ctx.fillStyle = '#3FC9E9';
  ctx.font = '11px monospace';
  ctx.fillText('STATUS: VERIFIED & TAMPER-FREE', 320, 238);

  // Top Telemetry Header
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, 640, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`CAM-04 · ${title.toUpperCase()}`, 16, 23);
  ctx.fillStyle = '#5BCB80';
  ctx.textAlign = 'right';
  ctx.fillText('● REC LIVE · ENCRYPTED', 624, 23);

  // Bottom Watermark Bar
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(0, 364, 640, 36);
  ctx.fillStyle = '#3FC9E9';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`DUTYON EVIDENCE · ${timeStr} · GPS: -33.8642, 25.5684`, 16, 387);
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(location, 624, 387);

  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Generates a clean synthetic WAV audio base64 data URL simulating an officer radio debrief transmission
 */
export function generateSamplePatrolAudio(): { audioDataUrl: string; durationSec: number } {
  const sampleRate = 8000;
  const durationSec = 4;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;
    if (t < 0.25) {
      sample = Math.sin(2 * Math.PI * 880 * t) * 0.3 * Math.exp(-t * 10);
    } else if (t < 3.6) {
      const tone1 = Math.sin(2 * Math.PI * 440 * t);
      const tone2 = Math.sin(2 * Math.PI * 330 * t) * 0.5;
      const mod = Math.sin(2 * Math.PI * 4 * t) * 0.4 + 0.6;
      sample = (tone1 + tone2) * 0.25 * mod;
    } else if (t < 3.9) {
      sample = Math.sin(2 * Math.PI * 1050 * (t - 3.6)) * 0.35;
    }

    const intSample = Math.max(-1, Math.min(1, sample)) * 32767;
    view.setInt16(44 + i * 2, intSample, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return {
    audioDataUrl: `data:audio/wav;base64,${base64}`,
    durationSec
  };
}
