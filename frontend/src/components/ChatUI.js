import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Send, Bot, User, AlertCircle, CheckCircle, Camera, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const ChatUI = ({ 
  messages = [], 
  onSendMessage, 
  onImageUpload,
  isLoading = false,
  placeholder = "Ask me about plant diseases or farming...",
  showImageUpload = true 
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  };

  const MessageBubble = ({ message, isUser }) => (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary/10">
          <AvatarFallback>
            <Bot className="h-4 w-4 text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[70%] rounded-lg p-3",
        isUser 
          ? "bg-primary text-primary-foreground ml-auto" 
          : "bg-muted"
      )}>
        {message.type === 'image' && (
          <div className="mb-2">
            <img 
              src={message.imageUrl} 
              alt="Uploaded for analysis"
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>
        
        {message.confidence && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Confidence</span>
              <span>{Math.round(message.confidence * 100)}%</span>
            </div>
            <Progress value={message.confidence * 100} className="h-1" />
          </div>
        )}
        
        {message.disease && (
          <Badge 
            variant={message.confidence > 0.8 ? "default" : "secondary"}
            className="mt-2"
          >
            {message.disease.replace(/_/g, ' ')}
          </Badge>
        )}
        
        {message.action && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {message.action === 'treat' && <AlertCircle className="h-3 w-3" />}
            {message.action === 'celebrate' && <CheckCircle className="h-3 w-3" />}
            {message.action === 'uncertain' && <AlertCircle className="h-3 w-3" />}
            <span className="capitalize">{message.action}</span>
          </div>
        )}
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 bg-accent">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );

  const LoadingMessage = () => (
    <div className="flex gap-3 mb-4">
      <Avatar className="h-8 w-8 bg-primary/10">
        <AvatarFallback>
          <Bot className="h-4 w-4 text-primary animate-pulse" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-lg p-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Agricultural Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Hi! I'm your AI farming assistant.</p>
                <p className="text-sm">Upload a plant image or ask me any agriculture question!</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <MessageBubble 
                key={index} 
                message={message} 
                isUser={message.isUser} 
              />
            ))}
            
            {isLoading && <LoadingMessage />}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        <div className="flex gap-2 pt-4">
          <div className="flex-1 flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1"
            />
            
            {showImageUpload && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          <Button 
            onClick={handleSend} 
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatUI;