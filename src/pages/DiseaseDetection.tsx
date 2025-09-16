import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Scan, Camera, FileImage, Bot, User, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface Prediction {
  disease: string;
  disease_name: string;
  confidence: number;
  treatment: string;
  response: {
    message: string;
    action: string;
  };
}

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  image?: string;
  prediction?: Prediction;
  error?: boolean;
}

const DiseaseDetection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: "Hi! I'm your AI plant doctor. Upload a photo of your plant and I'll help identify any diseases and suggest treatments.",
      timestamp: new Date()
    }
  ]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  const processImage = async (file) => {
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Add user message
    const userMessage: Message = {
      type: 'user',
      content: `Uploaded image: ${file.name}`,
      image: URL.createObjectURL(file),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Start prediction
    setLoading(true);
    setSelectedImage(file);

    try {
      const formData = new FormData();
      formData.append('image', file);

const apiBase = (localStorage.getItem('apiBaseUrl') || 'http://localhost:5000/api').replace(/\/$/, '');
      const response = await fetch(`${apiBase}/predict`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setPrediction(result);
        
        // Add bot response
        const botMessage: Message = {
          type: 'bot',
          content: result.response.message,
          prediction: result,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Prediction failed:', error);
      const errorMessage: Message = {
        type: 'bot',
        content: "Sorry, I couldn't analyze your image. Please make sure you have a clear photo and try again.",
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetChat = () => {
    setMessages([
      {
        type: 'bot',
        content: "Hi! I'm your AI plant doctor. Upload a photo of your plant and I'll help identify any diseases and suggest treatments.",
        timestamp: new Date()
      }
    ]);
    setSelectedImage(null);
    setImagePreview(null);
    setPrediction(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              AI Plant Doctor 🌱
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant disease identification and treatment recommendations
            </p>
          </div>

          {/* Chat Interface */}
          <Card className="h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">AI Plant Doctor</span>
                <div className="w-2 h-2 bg-success rounded-full"></div>
              </div>
              <Button variant="outline" size="sm" onClick={resetChat}>
                New Chat
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-2' 
                        : message.error 
                          ? 'bg-destructive/10 text-destructive mr-2'
                          : 'bg-muted mr-2'
                    }`}>
                      {message.image && (
                        <img 
                          src={message.image} 
                          alt="Uploaded plant" 
                          className="max-w-full h-48 object-cover rounded-lg mb-2"
                        />
                      )}
                      <p className="text-sm">{message.content}</p>
                      
                      {message.prediction && (
                        <div className="mt-3 p-3 bg-background rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">Disease: {message.prediction.disease_name}</span>
                            <div className="flex items-center space-x-1">
                              {message.prediction.confidence >= 0.8 ? (
                                <CheckCircle className="w-4 h-4 text-success" />
                              ) : message.prediction.confidence >= 0.6 ? (
                                <AlertTriangle className="w-4 h-4 text-warning" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                              )}
                            </div>
                          </div>
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Confidence</span>
                              <span>{Math.round(message.prediction.confidence * 100)}%</span>
                            </div>
                            <Progress 
                              value={message.prediction.confidence * 100} 
                              className="h-2"
                            />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <strong>Treatment:</strong> {message.prediction.treatment}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`text-xs text-muted-foreground mt-1 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user' ? 'order-1 bg-primary' : 'order-2 bg-muted'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="order-2">
                    <div className="bg-muted rounded-lg p-3 mr-2">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Analyzing your plant...</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center order-1">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="p-4 border-t border-border">
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="hero" 
                  onClick={handleFileSelect}
                  disabled={loading}
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={handleCameraCapture}
                  disabled={loading}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
              
              {/* Hidden file inputs */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={cameraInputRef}
                onChange={handleImageUpload}
              />
            </div>
          </Card>

          {/* How It Works */}
          <Card className="p-8 mt-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Capture Image</h3>
                <p className="text-muted-foreground text-sm">
                  Take a clear photo of the affected plant part
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  Our advanced AI model analyzes the image for diseases
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Get Treatment</h3>
                <p className="text-muted-foreground text-sm">
                  Receive detailed treatment and prevention recommendations
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DiseaseDetection;