/**
 * API service for AgroConnect+ frontend
 * Handles all backend communication
 */

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Remove Content-Type for FormData requests
    if (options.body instanceof FormData) {
      delete mergedOptions.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Disease Detection APIs
  async predictDisease(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.request('/predict', {
      method: 'POST',
      body: formData,
    });
  }

  async getDiseases() {
    return this.request('/diseases');
  }

  async getTreatments(disease = null) {
    const query = disease ? `?disease=${encodeURIComponent(disease)}` : '';
    return this.request(`/treatments${query}`);
  }

  // Voice Assistant APIs
  async processVoiceQuery(audioBlob, language = 'en') {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_query.webm');
    formData.append('language', language);

    return this.request('/voice/process', {
      method: 'POST',
      body: formData,
    });
  }

  async processTextQuery(query, language = 'en') {
    return this.request('/voice/text-query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        language,
      }),
    });
  }

  async getSupportedLanguages() {
    return this.request('/voice/languages');
  }

  async getSampleQuestions(language = 'en') {
    return this.request(`/voice/sample-questions?language=${language}`);
  }

  // Feedback APIs
  async submitFeedback(feedbackData) {
    return this.request('/upload-feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  // Marketplace APIs (placeholder for future implementation)
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.request(`/marketplace/products${query}`);
  }

  async createProduct(productData) {
    return this.request('/marketplace/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  // IoT APIs (placeholder for future implementation)
  async getIoTDevices(farmerId) {
    return this.request(`/iot/devices/${farmerId}`);
  }

  async getSensorData(deviceId, timeRange = '24h') {
    return this.request(`/iot/sensor-data/${deviceId}?range=${timeRange}`);
  }

  async controlPump(deviceId, action) {
    return this.request('/iot/control-pump', {
      method: 'POST',
      body: JSON.stringify({
        device_id: deviceId,
        action: action, // 'on' or 'off'
      }),
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

// Helper functions for easier usage
export const diseaseApi = {
  predict: (imageFile) => apiService.predictDisease(imageFile),
  getDiseases: () => apiService.getDiseases(),
  getTreatments: (disease) => apiService.getTreatments(disease),
};

export const voiceApi = {
  processVoice: (audioBlob, language) => apiService.processVoiceQuery(audioBlob, language),
  processText: (query, language) => apiService.processTextQuery(query, language),
  getLanguages: () => apiService.getSupportedLanguages(),
  getSampleQuestions: (language) => apiService.getSampleQuestions(language),
};

export const feedbackApi = {
  submit: (data) => apiService.submitFeedback(data),
};

export const marketplaceApi = {
  getProducts: (filters) => apiService.getProducts(filters),
  createProduct: (data) => apiService.createProduct(data),
};

export const iotApi = {
  getDevices: (farmerId) => apiService.getIoTDevices(farmerId),
  getSensorData: (deviceId, timeRange) => apiService.getSensorData(deviceId, timeRange),
  controlPump: (deviceId, action) => apiService.controlPump(deviceId, action),
};

// Export default service
export default apiService;

// Utility functions
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const downloadResult = (result, filename = 'disease_analysis') => {
  const data = {
    timestamp: new Date().toISOString(),
    disease: result.disease,
    confidence: result.confidence,
    treatment: result.treatment,
    analysis: result.response,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const shareResult = async (result) => {
  const shareData = {
    title: 'Plant Disease Analysis - AgroConnect+',
    text: `Disease detected: ${result.disease_name} (${Math.round(result.confidence * 100)}% confidence)`,
    url: window.location.href,
  };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
    } catch (error) {
      console.log('Share cancelled or failed');
    }
  } else {
    // Fallback to copying to clipboard
    const text = `Plant Disease Analysis:\n${shareData.text}\n\nAnalyzed with AgroConnect+ AI Assistant`;
    
    try {
      await navigator.clipboard.writeText(text);
      // You might want to show a toast notification here
      console.log('Result copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard', error);
    }
  }
};