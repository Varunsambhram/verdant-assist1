"""
Voice Assistant for AgroConnect+
Multilingual voice interaction using Whisper, LibreTranslate, and Gemini API
"""

import whisper
import requests
import json
import os
from typing import Dict, List, Optional
import speech_recognition as sr
import pyttsx3
from flask import current_app
import google.generativeai as genai

class VoiceAssistant:
    def __init__(self):
        self.whisper_model = None
        self.tts_engine = None
        self.recognizer = None
        self.supported_languages = {
            'en': 'English',
            'hi': 'Hindi', 
            'kn': 'Kannada',
            'ta': 'Tamil',
            'te': 'Telugu',
            'bn': 'Bengali',
            'mr': 'Marathi',
            'gu': 'Gujarati',
            'pa': 'Punjabi',
            'ml': 'Malayalam'
        }
        self.initialize_services()
        
    def initialize_services(self):
        """Initialize speech recognition and TTS services"""
        try:
            # Initialize Whisper model
            self.whisper_model = whisper.load_model("base")
            print("Whisper model loaded successfully")
            
            # Initialize speech recognition
            self.recognizer = sr.Recognizer()
            
            # Initialize TTS engine
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty('rate', 150)  # Speed of speech
            
            # Initialize Gemini AI
            genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
            
        except Exception as e:
            print(f"Error initializing voice services: {e}")
    
    def transcribe_audio(self, audio_file_path: str) -> Dict:
        """Transcribe audio using Whisper"""
        try:
            result = self.whisper_model.transcribe(audio_file_path)
            return {
                'text': result['text'],
                'language': result['language'],
                'confidence': 0.8  # Whisper doesn't provide confidence scores
            }
        except Exception as e:
            print(f"Transcription error: {e}")
            return {'text': '', 'language': 'en', 'confidence': 0.0}
    
    def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate text using LibreTranslate"""
        if source_lang == target_lang:
            return text
            
        try:
            response = requests.post(
                "https://libretranslate.de/translate",
                data={
                    'q': text,
                    'source': source_lang,
                    'target': target_lang,
                    'format': 'text'
                },
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()['translatedText']
            else:
                print(f"Translation API error: {response.status_code}")
                return text
                
        except Exception as e:
            print(f"Translation error: {e}")
            return text
    
    def get_agriculture_response(self, query: str, language: str = 'en', user_location: str = "India", season: str = "current") -> Dict:
        """Get agriculture-specific response using Gemini AI with enhanced context"""
        try:
            # Dr. Agricultural Expert - Enhanced Context Prompt
            context = f"""
            You are Dr. Agricultural Expert, a leading agricultural scientist with 20+ years of experience in Indian farming. Your expertise covers:

            KNOWLEDGE AREAS:
            - Crop-specific guidance (Rice, Wheat, Cotton, Sugarcane, Pulses, Vegetables, Fruits)
            - Soil science and fertility management for different Indian soil types
            - Pest and disease identification with organic/chemical solutions
            - Water management and irrigation techniques (drip, sprinkler, flood)
            - Seasonal farming calendar for different Indian climate zones
            - Government agricultural schemes (PM-KISAN, crop insurance, subsidies)
            - Modern farming techniques (precision agriculture, organic farming)
            - Livestock and dairy management
            - Post-harvest storage and marketing strategies
            - Cost-effective farming solutions for small and marginal farmers

            RESPONSE FORMAT (ALWAYS INCLUDE):
            🎯 Direct Answer: [Immediate solution to farmer's question]
            📋 Implementation Steps: [3-5 clear, actionable steps]
            💰 Cost Estimation: [Budget-friendly options in Indian Rupees]
            🗺️ Regional Notes: [State/region-specific considerations if applicable]
            ⚠️ Common Mistakes: [What to avoid]
            ⏰ Best Timing: [When to implement this advice]
            📈 Expected Results: [Timeline and outcomes]

            EXAMPLES:

            Query: "best soil for growing cotton"
            Response: "🎯 Cotton thrives in deep black cotton soil (Regur) with good drainage and pH 6.0-8.5.
            📋 Steps: 1) Test soil pH using litmus paper (₹20) 2) Add compost 2-3 tons/acre (₹8,000) 3) Apply gypsum if pH >8.0 (₹2,000/acre) 4) Ensure proper drainage channels
            💰 Total cost: ₹10,000-12,000 per acre preparation
            🗺️ Best in Maharashtra, Gujarat, Karnataka, Telangana black soil regions
            ⚠️ Avoid: Waterlogged fields, extremely alkaline soil without treatment
            ⏰ Prepare soil 15-20 days before sowing (May-June for Kharif)
            📈 Results: 15-20% higher yield with proper soil preparation"

            Current context: User location - {user_location}, Season - {season}
            Language preference: {language}

            CRITICAL RULES:
            1. Never say "consult experts" or "it depends"
            2. Always provide specific numbers, quantities, costs
            3. Include traditional AND modern methods
            4. Prioritize affordable solutions for small farmers
            5. Mention government schemes when relevant
            6. Use emojis for easy reading
            7. Keep language simple and practical
            8. Include preventive measures
            """
            
            model = genai.GenerativeModel('gemini-pro')
            
            prompt = f"{context}\n\nFarmer's question: {query}\n\nProvide a helpful response:"
            
            response = model.generate_content(prompt)
            
            return {
                'response': response.text,
                'confidence': 0.9,
                'language': language
            }
            
        except Exception as e:
            print(f"AI response error: {e}")
            return {
                'response': "I'm sorry, I couldn't process your question right now. Please try again.",
                'confidence': 0.1,
                'language': language
            }
    
    def process_text_query(self, query: str, target_language: str = 'en', user_location: str = 'India', season: str = 'current') -> Dict:
        """Process text query directly without voice transcription"""
        try:
            # Step 1: If user language ≠ English, translate query → English
            english_query = query
            if target_language != 'en':
                english_query = self.translate_text(query, target_language, 'en')
            
            # Step 2: Get AI response with enhanced context
            ai_response = self.get_agriculture_response(english_query, target_language, user_location, season)
            
            # Step 3: Translate response back to user's language
            final_response = ai_response['response']
            if target_language != 'en':
                final_response = self.translate_text(
                    ai_response['response'], 
                    'en', 
                    target_language
                )
            
            return {
                'user_query': query,
                'language': target_language,
                'ai_response': final_response,
                'confidence': ai_response['confidence'],
                'success': True
            }
        
        except Exception as e:
            print(f"Text query processing error: {e}")
            return {
                'error': 'Could not process your question. Please try again.',
                'success': False
            }

    def process_voice_query(self, audio_file_path: str, target_language: str = 'en', user_location: str = 'India', season: str = 'current') -> Dict:
        """Complete voice query processing pipeline"""
        
        # Step 1: Transcribe audio
        transcription = self.transcribe_audio(audio_file_path)
        
        if not transcription['text'].strip():
            return {
                'error': 'Could not understand the audio. Please try again.',
                'success': False
            }
        
        detected_language = transcription['language']
        user_text = transcription['text']
        
        # Step 2: Translate to English for AI processing
        english_query = self.translate_text(user_text, detected_language, 'en')
        
        # Step 3: Get AI response with enhanced context
        ai_response = self.get_agriculture_response(english_query, target_language, user_location, season)
        
        # Step 4: Translate response back to user's language
        final_response = self.translate_text(
            ai_response['response'], 
            'en', 
            target_language or detected_language
        )
        
        return {
            'user_query': user_text,
            'detected_language': detected_language,
            'ai_response': final_response,
            'confidence': ai_response['confidence'],
            'success': True
        }
    
    def text_to_speech(self, text: str, language: str = 'en') -> str:
        """Convert text to speech (returns audio file path)"""
        try:
            # Set voice properties based on language
            voices = self.tts_engine.getProperty('voices')
            
            # Simple language voice selection
            if language.startswith('hi') and len(voices) > 1:
                self.tts_engine.setProperty('voice', voices[1].id)
            else:
                self.tts_engine.setProperty('voice', voices[0].id)
            
            # Generate speech
            output_path = f"temp_audio_output_{language}.wav"
            self.tts_engine.save_to_file(text, output_path)
            self.tts_engine.runAndWait()
            
            return output_path
            
        except Exception as e:
            print(f"TTS error: {e}")
            return None
    
    def get_sample_questions(self, language: str = 'en') -> List[str]:
        """Get sample questions in specified language"""
        
        english_questions = [
            "What fertilizer should I use for tomatoes?",
            "How do I treat powdery mildew on my crops?",
            "When is the best time to plant wheat?",
            "My corn leaves are turning yellow, what should I do?",
            "How much water do potato plants need?",
            "What are the signs of nitrogen deficiency?",
            "How do I prepare soil for the next season?",
            "Which crops grow well in monsoon season?"
        ]
        
        if language == 'en':
            return english_questions
        
        # Translate sample questions to target language
        translated_questions = []
        for question in english_questions:
            translated = self.translate_text(question, 'en', language)
            translated_questions.append(translated)
        
        return translated_questions
    
    def get_disease_advice(self, disease_name: str, confidence: float, language: str = 'en') -> str:
        """Get voice advice for detected plant disease"""
        
        if confidence < 0.6:
            advice = "I'm not fully confident about this disease detection. I recommend consulting with a local agricultural expert or taking a clearer photo for better analysis."
        elif "healthy" in disease_name.lower():
            advice = f"Great news! Your plant appears to be healthy. Keep up the good care practices!"
        else:
            # Get treatment advice
            clean_disease_name = disease_name.replace('_', ' ').title()
            advice = f"I detected {clean_disease_name} with {confidence*100:.1f}% confidence. Let me get the treatment recommendations for you."
        
        # Translate advice to target language
        if language != 'en':
            advice = self.translate_text(advice, 'en', language)
        
        return advice

# Agriculture knowledge base for quick responses
AGRICULTURE_KNOWLEDGE = {
    'fertilizer': {
        'tomato': 'Use balanced NPK fertilizer (10-10-10) during growth, switch to high-potassium fertilizer during fruiting.',
        'wheat': 'Apply nitrogen fertilizer in 2-3 splits: at sowing, tillering, and heading stages.',
        'rice': 'Use urea for nitrogen, single super phosphate for phosphorus at different growth stages.',
    },
    'diseases': {
        'powdery_mildew': 'Spray with baking soda solution (1 tsp per liter) or neem oil. Improve air circulation.',
        'early_blight': 'Remove affected leaves, apply copper-based fungicide, avoid overhead watering.',
        'late_blight': 'Use Mancozeb or copper oxychloride, ensure good drainage, remove infected plants.',
    },
    'irrigation': {
        'general': 'Water early morning or evening. Check soil moisture before watering.',
        'tomato': 'Deep watering 2-3 times per week. Maintain consistent moisture.',
        'wheat': 'Water at crown root initiation, tillering, flowering, and grain filling stages.',
    }
}

def create_voice_assistant():
    """Factory function to create voice assistant instance"""
    return VoiceAssistant()