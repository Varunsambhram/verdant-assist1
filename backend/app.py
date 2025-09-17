"""
Flask Backend for AgroConnect+ Agricultural AI Assistant
Handles disease detection and multilingual voice assistant
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import base64
from backend.disease_model import DiseaseDetector
from backend.voice_assistant import VoiceAssistant
import traceback

app = Flask(__name__)
CORS(app)

# Initialize services
disease_detector = DiseaseDetector()
voice_assistant = VoiceAssistant()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'AgroConnect+ Backend is running'
    })

@app.route('/api/predict', methods=['POST'])
def predict_disease():
    """Disease detection endpoint"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        image_file = request.files['image']
        
        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Save uploaded image temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            image_file.save(temp_file.name)
            
            # Predict disease
            result = disease_detector.predict(temp_file.name)
            
            # Clean up
            os.unlink(temp_file.name)
            
            return jsonify(result)
    
    except Exception as e:
        print(f"Error in disease prediction: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/diseases', methods=['GET'])
def get_diseases():
    """Get list of detectable diseases"""
    return jsonify(disease_detector.get_class_names())

@app.route('/api/treatments', methods=['GET'])
def get_treatments():
    """Get treatment information for diseases"""
    disease = request.args.get('disease')
    treatments = disease_detector.get_treatments(disease)
    return jsonify(treatments)

@app.route('/api/voice/process', methods=['POST'])
def process_voice():
    """Process voice input for agricultural AI assistant"""
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file uploaded'}), 400
        
        audio_file = request.files['audio']
        language = request.form.get('language', 'en')
        
        # Save audio temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
            audio_file.save(temp_file.name)
            
            # Get additional context
            user_location = request.form.get('location', 'India')
            season = request.form.get('season', 'current')
            
            # Process voice query with enhanced context
            result = voice_assistant.process_voice_query(temp_file.name, language, user_location, season)
            
            # Clean up
            os.unlink(temp_file.name)
            
            return jsonify(result)
    
    except Exception as e:
        print(f"Error in voice processing: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/voice/text-query', methods=['POST'])
def process_text_query():
    """Process text input for agricultural AI assistant"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({'error': 'No query provided'}), 400
        
        query = data['query']
        language = data.get('language', 'en')
        user_location = data.get('location', 'India')
        season = data.get('season', 'current')
        
        # Process text query with enhanced context
        result = voice_assistant.process_text_query(query, language, user_location, season)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in text processing: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/voice/languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported languages"""
    return jsonify(voice_assistant.supported_languages)

@app.route('/api/voice/sample-questions', methods=['GET'])
def get_sample_questions():
    """Get sample questions in specified language"""
    language = request.args.get('language', 'en')
    questions = voice_assistant.get_sample_questions(language)
    return jsonify({'questions': questions})

@app.route('/api/voice/tts', methods=['POST'])
def text_to_speech():
    """Convert text to speech"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400
        
        text = data['text']
        language = data.get('language', 'en')
        
        # Generate speech
        audio_path = voice_assistant.text_to_speech(text, language)
        
        if audio_path and os.path.exists(audio_path):
            # Read audio file and encode as base64
            with open(audio_path, 'rb') as audio_file:
                audio_data = audio_file.read()
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Clean up
            os.unlink(audio_path)
            
            return jsonify({
                'audio_data': audio_base64,
                'audio_type': 'wav'
            })
        else:
            return jsonify({'error': 'Failed to generate speech'}), 500
    
    except Exception as e:
        print(f"Error in TTS: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/upload-feedback', methods=['POST'])
def upload_feedback():
    """Handle user feedback submission"""
    try:
        data = request.get_json()
        
        # Here you would typically save to database
        # For now, just log the feedback
        print(f"Feedback received: {data}")
        
        return jsonify({
            'message': 'Feedback received successfully',
            'status': 'success'
        })
    
    except Exception as e:
        print(f"Error saving feedback: {e}")
        return jsonify({'error': 'Failed to save feedback'}), 500

if __name__ == '__main__':
    print("Starting AgroConnect+ Backend...")
    print("Available endpoints:")
    print("- /api/health (GET) - Health check")
    print("- /api/predict (POST) - Disease detection")
    print("- /api/voice/process (POST) - Voice input processing")
    print("- /api/voice/text-query (POST) - Text input processing")
    print("- /api/voice/languages (GET) - Supported languages")
    print("- /api/voice/sample-questions (GET) - Sample questions")
    print("- /api/voice/tts (POST) - Text to speech")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
