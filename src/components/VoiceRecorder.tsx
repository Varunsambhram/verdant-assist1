import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  isProcessing = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check microphone permission status
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then(result => {
        setPermissionStatus(result.state === 'granted' ? 'granted' : 'denied');
        result.onchange = () => {
          setPermissionStatus(result.state === 'granted' ? 'granted' : 'denied');
        };
      })
      .catch(() => setPermissionStatus('unknown'));

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(Math.min(100, average * 2));
      
      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      setPermissionStatus('granted');
      streamRef.current = stream;

      // Setup audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      updateAudioLevel();

      // Setup MediaRecorder with optimal settings
      const options: MediaRecorderOptions = {};
      
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
      } else {
        options.mimeType = 'audio/wav';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        onRecordingComplete(audioBlob);
        cleanup();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setPermissionStatus('denied');
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone access denied. Please allow microphone access.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone.');
        } else {
          throw new Error('Could not access microphone. Please check your device settings.');
        }
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setAudioLevel(0);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch (error) {
        console.error('Recording error:', error);
        // Error will be displayed by parent component
      }
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Main Recording Button */}
      <div className="relative">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`w-24 h-24 rounded-full transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50' 
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {isProcessing ? (
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>

        {/* Audio level visualization ring */}
        {isRecording && audioLevel > 0 && (
          <div 
            className="absolute inset-0 rounded-full border-4 border-white/30 pointer-events-none"
            style={{
              transform: `scale(${1 + (audioLevel / 100) * 0.3})`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="flex flex-col items-center space-y-2">
          <Badge variant="destructive" className="font-mono text-lg px-4 py-2">
            🔴 REC {formatTime(recordingTime)}
          </Badge>
          
          {/* Audio Level Meter */}
          <div className="w-48 space-y-1">
            <Progress value={audioLevel} className="h-2" />
            <div className="text-xs text-center text-muted-foreground">
              Audio Level: {Math.round(audioLevel)}%
            </div>
          </div>
        </div>
      )}

      {/* Permission Status */}
      {permissionStatus === 'denied' && (
        <Badge variant="destructive" className="text-xs">
          Microphone access denied
        </Badge>
      )}
      
      {permissionStatus === 'granted' && !isRecording && (
        <Badge variant="default" className="text-xs">
          Microphone ready
        </Badge>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-xs">
        {isProcessing 
          ? 'Processing your recording...'
          : isRecording 
          ? 'Speak clearly into your microphone. Click the red button to stop.'
          : 'Click the microphone button to start recording your question.'
        }
      </div>
    </div>
  );
};

export default VoiceRecorder;