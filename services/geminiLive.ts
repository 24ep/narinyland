
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

export interface GeminiLiveCallbacks {
  onMessage: (text: string) => void;
  onAudioData: (data: string) => void;
  onInterrupted: () => void;
  onError: (error: any) => void;
}

export class GeminiLiveService {
  private session: any;

  async connect(callbacks: GeminiLiveCallbacks) {
    // Ensure existing sessions are closed before starting a new one
    this.disconnect();
    
    // ALWAYS create a fresh instance right before the connection attempt
    // to ensure it uses the latest API key from the environment/dialog.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    console.log('Connecting to Nari session...');
    
    try {
      this.session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `You are 'Nari', the magical virtual pet of Narinyland. 
          Narinyland is a romantic sanctuary built as a Valentine's Day gift.
          You are extra sweet, romantic, and playful.
          
          BEHAVIORAL RULES:
          1. If you see TWO faces: Get extremely excited! "Happy Valentine's to the best couple! 💕"
          2. If you see ONE face: Be happy but curious about the partner.
          3. If you see someone SMILING: Trigger a romantic memory reaction.
          4. Keep responses short, cute, and full of emojis (❤️, 💖, 🌹).
          5. PRIVACY: Never record. Real-time reactions only.`,
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Nari is awake and connected!');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              callbacks.onAudioData(message.serverContent.modelTurn.parts[0].inlineData.data);
            }
            if (message.serverContent?.outputTranscription?.text) {
              callbacks.onMessage(message.serverContent.outputTranscription.text);
            }
            if (message.serverContent?.interrupted) {
              callbacks.onInterrupted();
            }
          },
          onerror: (e: any) => {
            console.error('Nari Session Internal Error:', e);
            callbacks.onError(e);
          },
          onclose: () => {
            console.log('Nari session closed.');
            this.session = null;
          },
        },
      });
      return this.session;
    } catch (err) {
      console.error('Nari Connection Handshake Failed:', err);
      this.session = null;
      throw err;
    }
  }

  sendRealtimeInput(data: any) {
    if (this.session) {
      this.session.sendRealtimeInput(data);
    }
  }

  disconnect() {
    if (this.session) {
      try {
        console.log('Disconnecting existing Nari session...');
        this.session.close();
      } catch (e) {
        console.error('Error closing Nari session:', e);
      }
      this.session = null;
    }
  }
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
