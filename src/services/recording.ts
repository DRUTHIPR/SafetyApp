// Recording service for video/audio evidence
let Camera: any = null;
let Audio: any = null;

try {
  Camera = require('expo-camera');
  Audio = require('expo-audio');
} catch (error) {
  console.log('Camera/Audio not available on web');
}

export interface RecordingState {
  isRecording: boolean;
  recordingUri?: string;
  duration: number;
}

export const startVideoRecording = async (): Promise<RecordingState> => {
  if (Camera) {
    try {
      // Real camera recording would go here
      console.log('📹 Starting video recording...');
      return {
        isRecording: true,
        duration: 0,
      };
    } catch (error) {
      throw new Error('Failed to start video recording');
    }
  } else {
    // Web fallback - simulate recording
    console.log('📹 Video recording started (web simulation)');
    return {
      isRecording: true,
      duration: 0,
    };
  }
};

export const startAudioRecording = async (): Promise<RecordingState> => {
  if (Audio) {
    try {
      console.log('🎤 Starting audio recording...');
      return {
        isRecording: true,
        duration: 0,
      };
    } catch (error) {
      throw new Error('Failed to start audio recording');
    }
  } else {
    // Web fallback
    console.log('🎤 Audio recording started (web simulation)');
    return {
      isRecording: true,
      duration: 0,
    };
  }
};

export const stopRecording = async (): Promise<{ uri: string; duration: number }> => {
  console.log('⏹️ Recording stopped');
  return {
    uri: 'mock-recording-' + Date.now(),
    duration: Math.floor(Math.random() * 60) + 10, // 10-70 seconds
  };
};

// Emergency detection using Web Audio API + Speech Recognition
export class EmergencyDetector {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recognition: any = null;
  private isListening = false;
  private onEmergencyDetected: () => void;
  private emergencyWordCount = 0;
  private lastEmergencyTime = 0;
  private currentVolume = 0;

  constructor(onEmergencyDetected: () => void) {
    this.onEmergencyDetected = onEmergencyDetected;
  }

  async start(): Promise<void> {
    try {
      // Check if we're on mobile or web
      const isWeb = typeof window !== 'undefined' && typeof navigator !== 'undefined';
      
      if (isWeb && navigator.mediaDevices) {
        // Request microphone permission explicitly
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        source.connect(this.analyser);
        
        this.analyser.fftSize = 256;
        this.isListening = true;
        
        // Start speech recognition
        this.startSpeechRecognition();
        
        console.log('🔊 Emergency detection started');
        this.detectScream();
      } else {
        // Mobile fallback - just speech recognition
        console.log('🔊 Starting speech-only detection on mobile');
        this.isListening = true;
        this.startSpeechRecognition();
      }
    } catch (error) {
      console.error('Emergency detection error:', error);
      // Try speech-only mode as fallback
      try {
        console.log('🔊 Falling back to speech-only detection');
        this.isListening = true;
        this.startSpeechRecognition();
      } catch (speechError) {
        console.error('Speech recognition also failed:', speechError);
        throw new Error('Microphone access denied. Please enable microphone permissions.');
      }
    }
  }

  private startSpeechRecognition(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('Speech recognition not available on this platform');
        return;
      }
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
          console.log('🎤 Speech recognition started successfully');
        };
        
        this.recognition.onresult = (event: any) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript.toLowerCase();
          
          console.log('🎤 Heard:', transcript);
          
          // Emergency keywords
          const emergencyWords = ['help', 'emergency', 'danger', 'police', 'fire', 'ambulance', 'sos'];
          const hasEmergencyWord = emergencyWords.some(word => transcript.includes(word));
          
          if (hasEmergencyWord) {
            console.log('🚨 EMERGENCY WORD DETECTED! TRIGGERING SOS!');
            console.log('🚨 Detected word in:', transcript);
            this.onEmergencyDetected();
          }
        };
        
        this.recognition.onerror = (event: any) => {
          console.log('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            console.log('Microphone permission denied');
          }
        };
        
        this.recognition.onend = () => {
          if (this.isListening) {
            console.log('Speech recognition ended, restarting...');
            setTimeout(() => {
              if (this.isListening) {
                this.recognition.start();
              }
            }, 1000);
          }
        };
        
        this.recognition.start();
      } else {
        console.log('Speech recognition not supported in this browser');
      }
    } catch (error) {
      console.log('Speech recognition error:', error);
    }
  }

  private detectScream(): void {
    if (!this.isListening || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let volumeHistory: number[] = [];
    
    const checkAudio = () => {
      if (!this.isListening) return;
      
      this.analyser!.getByteFrequencyData(dataArray);
      
      // Calculate average volume with noise filtering
      const rawAverage = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      // Add to history for smoothing
      volumeHistory.push(rawAverage);
      if (volumeHistory.length > 5) volumeHistory.shift();
      
      // Use smoothed average to reduce noise
      const smoothedAverage = volumeHistory.reduce((sum, val) => sum + val, 0) / volumeHistory.length;
      
      // Apply noise gate - ignore very low levels
      this.currentVolume = smoothedAverage > 30 ? smoothedAverage : 0;
      
      // Only log when there's actual audio
      if (this.currentVolume > 35) {
        console.log(`🎤 Filtered Audio: ${this.currentVolume.toFixed(1)} dB`);
      }
      
      requestAnimationFrame(checkAudio);
    };
    
    checkAudio();
  }

  stop(): void {
    this.isListening = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.recognition) {
      this.recognition.stop();
    }
    console.log('🔇 Emergency detection stopped');
  }
}