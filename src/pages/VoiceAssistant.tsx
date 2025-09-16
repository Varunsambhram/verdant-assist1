import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Languages, MessageCircle, Send, Type, Play, Pause, RotateCcw, AlertCircle, Settings, Headphones } from 'lucide-react';
import { toast } from 'sonner';

import { voiceApi, healthApi, getApiBaseUrl, setApiBaseUrl } from '@/lib/api';

const VoiceAssistant = () => {
  // Core states
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [inputMode, setInputMode] = useState('voice');
  const [textQuery, setTextQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Enhanced states
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [userLocation, setUserLocation] = useState('India');
  const [currentSeason, setCurrentSeason] = useState('current');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Enhanced language support with native scripts
  const supportedLanguages = {
    'en': '🇬🇧 English',
    'hi': '🇮🇳 हिंदी (Hindi)',
    'kn': '🇮🇳 ಕನ್ನಡ (Kannada)',
    'ta': '🇮🇳 தமிழ் (Tamil)',
    'te': '🇮🇳 తెలుగు (Telugu)',
    'bn': '🇮🇳 বাংলা (Bengali)',
    'mr': '🇮🇳 मराठी (Marathi)',
    'gu': '🇮🇳 ગુજરાતી (Gujarati)',
    'pa': '🇮🇳 ਪੰਜਾਬੀ (Punjabi)',
    'ml': '🇮🇳 മലയാളം (Malayalam)'
  };

// Sample questions fetched from backend

  // Check backend health on component mount
useEffect(() => {
    checkBackendHealth();
    detectUserLocation();
    detectCurrentSeason();
  }, []);

  const [apiUrlInput, setApiUrlInput] = useState(getApiBaseUrl());
  const [sampleQuestions, setSampleQuestions] = useState<string[]>([]);

  const checkBackendHealth = async () => {
    const isHealthy = await healthApi.check();
    setBackendStatus(isHealthy ? 'connected' : 'disconnected');
    if (!isHealthy) {
      toast.error('Backend server is not reachable. Configure API URL or start the Flask server.');
    }
  };

  useEffect(() => {
    if (backendStatus === 'connected') {
      voiceApi.getSampleQuestions(selectedLanguage)
        .then(setSampleQuestions)
        .catch(() => setSampleQuestions([]));
    } else {
      setSampleQuestions([]);
    }
  }, [selectedLanguage, backendStatus]);

  const detectUserLocation = () => {
    // Simple location detection - can be enhanced
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Asia/Kolkata') || timezone.includes('Asia/Calcutta')) {
      setUserLocation('India');
    }
  };

  const detectCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 9) setCurrentSeason('Monsoon/Kharif');
    else if (month >= 10 && month <= 3) setCurrentSeason('Rabi');
    else setCurrentSeason('Zaid/Summer');
  };

  // Enhanced voice recording with audio visualization
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      setPermissionGranted(true);
      
      // Setup audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel(Math.min(100, average * 2));
        
        if (isListening) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // Setup MediaRecorder with optimal settings
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        await processVoiceInput(audioBlob);
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      // Start recording and timer
      mediaRecorder.start(100); // Collect data every 100ms
      setIsListening(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started - speak clearly!');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionGranted(false);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.');
      } else {
        toast.error('Could not access microphone. Please check your device settings.');
      }
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setAudioLevel(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      toast.success('Recording stopped - processing...');
    }
  };

  const processVoiceInput = async (audioBlob) => {
    setIsLoading(true);
    try {
      const result = await voiceApi.processVoice(audioBlob, selectedLanguage, userLocation, currentSeason);
      
      if (result.success) {
        addToConversation('user', result.user_query, 'voice');
        addToConversation('assistant', result.ai_response, 'text');
        
        if (speechEnabled) {
          await speakText(result.ai_response);
        }
        
        toast.success('Voice processed successfully!');
      } else {
        const errorMsg = result.error || 'Sorry, I could not understand your voice.';
        addToConversation('assistant', errorMsg, 'text');
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMsg = 'Sorry, there was an error processing your voice. Please check your connection.';
      addToConversation('assistant', errorMsg, 'text');
      toast.error(errorMsg);
    }
    setIsLoading(false);
  };

  const processTextInput = async () => {
    if (!textQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const result = await voiceApi.processText(textQuery, selectedLanguage, userLocation, currentSeason);
      
      if (result.success) {
        addToConversation('user', textQuery, 'text');
        addToConversation('assistant', result.ai_response, 'text');
        
        if (speechEnabled) {
          await speakText(result.ai_response);
        }
        
        toast.success('Question processed successfully!');
      } else {
        const errorMsg = result.error || 'Sorry, I could not process your question.';
        addToConversation('assistant', errorMsg, 'text');
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Text processing error:', error);
      const errorMsg = 'Sorry, there was an error processing your question. Please check your connection.';
      addToConversation('assistant', errorMsg, 'text');
      toast.error(errorMsg);
    }
    
    setTextQuery('');
    setIsLoading(false);
  };

  const addToConversation = (sender, message, type) => {
    setConversation(prev => [...prev, {
      id: Date.now(),
      sender,
      message,
      type,
      timestamp: new Date()
    }]);
  };

  // Enhanced text-to-speech with better language support
  const speakText = async (text) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      setIsPlayingAudio(true);
      
      // Stop any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice selection
      const voices = speechSynthesis.getVoices();
      let voice = voices.find(v => v.lang.startsWith(selectedLanguage));
      
      // Fallback voice selection
      if (!voice) {
        voice = voices.find(v => v.lang.includes('en')) || voices[0];
      }
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPlayingAudio(false);
      };
      
      utterance.onerror = (error) => {
        console.error('TTS Error:', error);
        setIsSpeaking(false);
        setIsPlayingAudio(false);
        toast.error('Speech synthesis failed');
      };
      
      speechSynthesis.speak(utterance);
    } else {
      toast.error('Text-to-speech not supported in this browser');
    }
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPlayingAudio(false);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const handleSampleQuestion = (question) => {
    setTextQuery(question);
    setInputMode('text');
  };

  const clearConversation = () => {
    setConversation([]);
    toast.success('Conversation cleared');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

// Sample questions loaded from backend for current language
const currentSampleQuestions = sampleQuestions;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              AgroConnect+ Multilingual Voice AI Assistant
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ask farming questions in your local language and get expert advice 
              through natural voice or text interactions powered by advanced AI.
            </p>
            
            {/* Status indicators */}
            <div className="flex justify-center gap-4 mt-6">
              <Badge variant={backendStatus === 'connected' ? 'default' : 'destructive'}>
                {backendStatus === 'connected' ? '🟢 Backend Connected' : '🔴 Backend Offline'}
              </Badge>
              <Badge variant={permissionGranted ? 'default' : 'secondary'}>
                {permissionGranted ? '🎤 Microphone Ready' : '🎤 Microphone Access Needed'}
              </Badge>
              <Badge variant="outline">
                📍 {userLocation} • 🌤️ {currentSeason}
              </Badge>
            </div>
          </div>

          {/* Connection Alert */}
{backendStatus === 'disconnected' && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Backend is offline. Set API URL and retry. Current: {getApiBaseUrl()}
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="http://localhost:5000/api"
                    value={apiUrlInput}
                    onChange={(e) => setApiUrlInput(e.target.value)}
                  />
                  <Button
                    onClick={async () => { setApiBaseUrl(apiUrlInput); await checkBackendHealth(); }}
                  >Save & Retry</Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Interface */}
            <div className="lg:col-span-2 space-y-6">
              {/* Language & Mode Selection */}
              <Card className="p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Languages className="w-5 h-5 text-muted-foreground" />
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg">
                        {Object.entries(supportedLanguages).map(([code, name]) => (
                          <SelectItem key={code} value={code} className="hover:bg-muted">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={inputMode === 'voice' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('voice')}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Voice
                    </Button>
                    <Button
                      variant={inputMode === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('text')}
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSpeechEnabled(!speechEnabled)}
                      title={speechEnabled ? 'Disable speech output' : 'Enable speech output'}
                    >
                      {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    {isSpeaking && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={stopSpeaking}
                        title="Stop speaking"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Input Interface */}
              {inputMode === 'voice' ? (
                <Card className="p-8 text-center">
                  <div className="mb-8">
                    <div className={`w-40 h-40 rounded-full flex items-center justify-center mx-auto transition-all duration-300 relative ${
                      isListening 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse shadow-lg shadow-red-500/50' 
                        : isLoading
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse'
                        : 'bg-gradient-to-r from-muted to-muted/80 hover:from-muted/80 hover:to-muted cursor-pointer'
                    }`}>
                      {/* Audio level visualization */}
                      {isListening && audioLevel > 0 && (
                        <div 
                          className="absolute inset-0 rounded-full border-4 border-white/30"
                          style={{
                            transform: `scale(${1 + (audioLevel / 100) * 0.3})`,
                            transition: 'transform 0.1s ease-out'
                          }}
                        />
                      )}
                      
                      {isLoading ? (
                        <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isListening ? (
                        <MicOff className="w-20 h-20 text-white" />
                      ) : (
                        <Mic className="w-20 h-20 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Recording timer and audio level */}
                    {isListening && (
                      <div className="mt-4 space-y-2">
                        <div className="text-lg font-mono text-red-600">
                          🔴 {formatTime(recordingTime)}
                        </div>
                        <div className="w-full max-w-xs mx-auto">
                          <Progress value={audioLevel} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            Audio Level: {Math.round(audioLevel)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {isLoading ? 'Processing Your Voice...' : isListening ? 'Listening - Speak Now' : 'Press to Start Voice Chat'}
                  </h2>
                  
                  <p className="text-muted-foreground mb-8">
                    {isLoading 
                      ? 'AI is processing your voice input with advanced agricultural knowledge'
                      : isListening 
                      ? `Speak your farming question clearly in ${supportedLanguages[selectedLanguage]}` 
                      : 'Click the microphone and ask your question in any supported language'
                    }
                  </p>

                  <Button
                    variant={isListening ? "destructive" : "default"}
                    size="lg"
                    onClick={handleVoiceToggle}
                    disabled={isLoading || backendStatus === 'disconnected'}
                    className="mb-6 px-8 py-3 text-lg"
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-5 h-5 mr-2" />
                        Stop Listening
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        Start Voice Chat
                      </>
                    )}
                  </Button>

                  {!permissionGranted && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please allow microphone access for voice functionality.
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>
              ) : (
                <Card className="p-6">
                  <div className="space-y-4">
                    <Textarea
                      placeholder={`Type your farming question in ${supportedLanguages[selectedLanguage]}...`}
                      value={textQuery}
                      onChange={(e) => setTextQuery(e.target.value)}
                      rows={4}
                      className="resize-none text-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.ctrlKey) {
                          processTextInput();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Press Ctrl+Enter to send
                      </span>
                      <Button
                        onClick={processTextInput}
                        disabled={!textQuery.trim() || isLoading || backendStatus === 'disconnected'}
                        className="min-w-32"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Ask Question
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Conversation History */}
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Conversation History
                  </h3>
                  {conversation.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearConversation}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {conversation.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4" />
                      <p>Your conversation will appear here</p>
                      <p className="text-sm mt-2">Ask questions about farming, crops, soil, irrigation, or pest control</p>
                    </div>
                  ) : (
                    conversation.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-4 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                          <div className="flex items-center justify-between mt-3 text-xs opacity-70">
                            <span>{message.type === 'voice' ? '🎤 Voice' : '💬 Text'}</span>
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {isSpeaking && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Volume2 className="w-4 h-4 animate-pulse" />
                          <span className="text-sm">AI is speaking...</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={stopSpeaking}
                            className="h-6 w-6 p-0"
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Sample Questions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Try Asking About ({supportedLanguages[selectedLanguage]})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentSampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuestion(question)}
                      className="w-full text-left text-sm text-muted-foreground hover:text-foreground p-3 rounded-md hover:bg-muted transition-colors border border-transparent hover:border-border"
                    >
                      <span className="font-medium">"{question}"</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* System Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Backend Connection</span>
                    <Badge variant={backendStatus === 'connected' ? 'default' : 'destructive'}>
                      {backendStatus === 'connected' ? 'Connected' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Microphone Access</span>
                    <Badge variant={permissionGranted ? 'default' : 'secondary'}>
                      {permissionGranted ? 'Granted' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Speech Output</span>
                    <Badge variant={speechEnabled ? 'default' : 'secondary'}>
                      {speechEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Conversations</span>
                    <Badge variant="outline">
                      {conversation.length}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Voice Tips */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Tips for Better Results
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 🎤 Speak clearly and at normal pace</li>
                  <li>• 🌾 Ask specific questions about your crops</li>
                  <li>• 📍 Mention your location for regional tips</li>
                  <li>• 💰 Include budget for cost-effective solutions</li>
                  <li>• 📱 Use text mode for complex queries</li>
                  <li>• 🔄 Try both voice and text for best results</li>
                  <li>• 📚 Ask about government schemes and subsidies</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VoiceAssistant;