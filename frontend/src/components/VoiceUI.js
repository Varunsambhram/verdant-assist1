import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, VolumeX, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const VoiceUI = ({ 
  onVoiceMessage,
  onTextToSpeech,
  isListening = false,
  isProcessing = false,
  selectedLanguage = 'en',
  onLanguageChange,
  supportedLanguages = {},
  className
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Setup audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        setAudioLevel(average);
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      // Setup media recorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        onVoiceMessage?.(audioBlob, selectedLanguage);
        stream.getTracks().forEach(track => track.stop());
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        setAudioLevel(0);
        setRecordingTime(0);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);

      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playTextToSpeech = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
      onTextToSpeech?.(text);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Voice Assistant
          </div>
          
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(supportedLanguages).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Recording Visualization */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className={cn(
                "w-20 h-20 rounded-full relative overflow-hidden transition-all duration-300",
                isRecording && "animate-pulse"
              )}
              onClick={toggleRecording}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
              
              {/* Audio level visualization */}
              {isRecording && (
                <div 
                  className="absolute inset-0 bg-white/20 transition-all duration-100 ease-out"
                  style={{
                    transform: `scale(${1 + audioLevel / 255 * 0.3})`
                  }}
                />
              )}
            </Button>
            
            {/* Pulse animation for recording */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-destructive/30 animate-ping" />
            )}
          </div>
          
          <div className="text-center space-y-2">
            {isRecording ? (
              <>
                <Badge variant="destructive">Recording {formatTime(recordingTime)}</Badge>
                <p className="text-sm text-muted-foreground">
                  Tap the microphone to stop recording
                </p>
              </>
            ) : isProcessing ? (
              <>
                <Badge variant="secondary">Processing...</Badge>
                <p className="text-sm text-muted-foreground">
                  Analyzing your voice message
                </p>
              </>
            ) : (
              <>
                <Badge variant="outline">Ready to listen</Badge>
                <p className="text-sm text-muted-foreground">
                  Tap the microphone to start recording
                </p>
              </>
            )}
          </div>
        </div>

        {/* Audio Level Meter */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Audio Level</span>
              <span>{Math.round(audioLevel / 255 * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel / 255 * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Text to Speech Controls */}
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            onClick={isSpeaking ? stopSpeaking : () => playTextToSpeech("Hello! I'm ready to help you with farming questions.")}
            disabled={isRecording || isProcessing}
            className="gap-2"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="h-4 w-4" />
                Stop Speaking
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Test Voice
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 text-center">
          <p>• Speak clearly and hold the device close</p>
          <p>• Ask about crops, diseases, or farming tips</p>
          <p>• Support for multiple languages available</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceUI;