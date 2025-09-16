import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const ImageUpload = ({ 
  onImageSelect, 
  previewImage, 
  onClear,
  className,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;
    
    if (!acceptedTypes.includes(file.type)) {
      setError(`Please upload a valid image file (${acceptedTypes.join(', ')})`);
      return false;
    }
    
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleFileSelect = (file) => {
    if (validateFile(file)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelect?.(file, e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = [...e.dataTransfer.files];
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  const handleClear = () => {
    setError('');
    onClear?.();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInput}
        accept={acceptedTypes.join(',')}
        className="hidden"
      />
      
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileInput}
        accept={acceptedTypes.join(',')}
        capture="environment"
        className="hidden"
      />

      {previewImage ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={previewImage}
                alt="Upload preview"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={triggerFileInput}
                  className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleClear}
                  className="h-8 w-8 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer",
            dragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50",
            error && "border-destructive bg-destructive/5"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <CardContent className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Upload Plant Image</h3>
              <p className="text-sm text-muted-foreground">
                Drop your image here or click to browse
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={triggerFileInput}>
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
              <Button variant="outline" size="sm" onClick={triggerCameraInput}>
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Supports JPEG, PNG, WebP up to {maxSize / (1024 * 1024)}MB
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mt-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;