import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Import pages
import Index from './pages/Index';
import DiseaseDetection from './pages/DiseaseDetection';
import VoiceAssistant from './pages/VoiceAssistant'; 
import Marketplace from './pages/Marketplace';
import IoTDashboard from './pages/IoTDashboard';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/disease-detection" element={<DiseaseDetection />} />
          <Route path="/voice-assistant" element={<VoiceAssistant />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/iot-dashboard" element={<IoTDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;