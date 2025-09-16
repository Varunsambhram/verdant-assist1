"""
Plant Disease Detection Model
EfficientNetB0-based transfer learning for crop disease classification
"""

import tensorflow as tf
import numpy as np
import json
import os
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

class PlantDiseaseModel:
    def __init__(self, num_classes=38, input_shape=(224, 224, 3)):
        self.num_classes = num_classes
        self.input_shape = input_shape
        self.model = None
        self.history = None
        
    def build_model(self):
        """Build EfficientNetB0-based model for plant disease detection"""
        
        # Load pre-trained EfficientNetB0
        base_model = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=self.input_shape
        )
        
        # Freeze base model initially
        base_model.trainable = False
        
        # Add custom classification head
        x = base_model.output
        x = GlobalAveragePooling2D()(x)
        x = Dropout(0.5)(x)
        x = Dense(512, activation='relu', name='dense_1')(x)
        x = Dropout(0.3)(x)
        predictions = Dense(self.num_classes, activation='softmax', name='predictions')(x)
        
        self.model = Model(inputs=base_model.input, outputs=predictions)
        
        return self.model
    
    def compile_model(self, learning_rate=0.001):
        """Compile the model with optimizer and loss function"""
        
        self.model.compile(
            optimizer=Adam(learning_rate=learning_rate),
            loss='categorical_crossentropy',
            metrics=['accuracy', 'top_3_accuracy']
        )
    
    def train_initial(self, train_data, val_data, epochs=10):
        """Initial training with frozen base model"""
        
        callbacks = [
            EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True),
            ModelCheckpoint('models/initial_model.h5', save_best_only=True, monitor='val_accuracy'),
            ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=2, min_lr=0.0001)
        ]
        
        self.history = self.model.fit(
            train_data,
            validation_data=val_data,
            epochs=epochs,
            callbacks=callbacks,
            verbose=1
        )
        
        return self.history
    
    def fine_tune(self, train_data, val_data, epochs=10, unfreeze_layers=50):
        """Fine-tune model by unfreezing top layers"""
        
        # Unfreeze top layers of base model
        base_model = self.model.layers[0]
        base_model.trainable = True
        
        # Freeze bottom layers
        for layer in base_model.layers[:-unfreeze_layers]:
            layer.trainable = False
        
        # Lower learning rate for fine-tuning
        self.model.compile(
            optimizer=Adam(learning_rate=0.0001/10),
            loss='categorical_crossentropy',
            metrics=['accuracy', 'top_3_accuracy']
        )
        
        callbacks = [
            EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
            ModelCheckpoint('models/fine_tuned_model.h5', save_best_only=True, monitor='val_accuracy'),
            ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=0.00001)
        ]
        
        fine_tune_history = self.model.fit(
            train_data,
            validation_data=val_data,
            epochs=epochs,
            callbacks=callbacks,
            verbose=1
        )
        
        return fine_tune_history
    
    def predict_disease(self, image_array, class_names):
        """Make prediction on preprocessed image"""
        
        prediction = self.model.predict(image_array)
        predicted_class_idx = np.argmax(prediction[0])
        confidence = float(prediction[0][predicted_class_idx])
        predicted_class = class_names[predicted_class_idx]
        
        return predicted_class, confidence, prediction[0]
    
    def save_model(self, filepath='models/plant_disease_model.h5'):
        """Save the trained model"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        self.model.save(filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='models/plant_disease_model.h5'):
        """Load a saved model"""
        self.model = tf.keras.models.load_model(filepath)
        print(f"Model loaded from {filepath}")
        return self.model
    
    def convert_to_tflite(self, model_path='models/plant_disease_model.h5', 
                         output_path='models/plant_disease_model.tflite'):
        """Convert Keras model to TensorFlow Lite"""
        
        converter = tf.lite.TFLiteConverter.from_keras_model(self.model)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        tflite_model = converter.convert()
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(tflite_model)
        
        print(f"TensorFlow Lite model saved to {output_path}")
        return output_path
    
    def evaluate_model(self, test_data, class_names):
        """Comprehensive model evaluation"""
        
        # Get predictions
        y_pred = self.model.predict(test_data)
        y_pred_classes = np.argmax(y_pred, axis=1)
        
        # Get true labels
        y_true = []
        for images, labels in test_data:
            y_true.extend(np.argmax(labels, axis=1))
        
        y_true = np.array(y_true)
        
        # Classification report
        report = classification_report(y_true, y_pred_classes, 
                                     target_names=class_names, 
                                     output_dict=True)
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred_classes)
        
        return report, cm
    
    def plot_training_history(self):
        """Plot training history"""
        
        if self.history is None:
            print("No training history available")
            return
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        # Accuracy plot
        ax1.plot(self.history.history['accuracy'], label='Training Accuracy')
        ax1.plot(self.history.history['val_accuracy'], label='Validation Accuracy')
        ax1.set_title('Model Accuracy')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Accuracy')
        ax1.legend()
        
        # Loss plot
        ax2.plot(self.history.history['loss'], label='Training Loss')
        ax2.plot(self.history.history['val_loss'], label='Validation Loss')
        ax2.set_title('Model Loss')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Loss')
        ax2.legend()
        
        plt.tight_layout()
        plt.savefig('models/training_history.png')
        plt.show()

def create_demo_model():
    """Create a demo model for testing"""
    
    # Demo class names (subset for testing)
    demo_classes = [
        "Apple___healthy",
        "Apple___Apple_scab", 
        "Tomato___healthy",
        "Tomato___Early_blight",
        "Tomato___Late_blight",
        "Potato___healthy",
        "Potato___Early_blight",
        "Potato___Late_blight"
    ]
    
    print("Creating demo plant disease detection model...")
    
    # Initialize model
    model = PlantDiseaseModel(num_classes=len(demo_classes))
    model.build_model()
    model.compile_model()
    
    # Save model
    os.makedirs('models', exist_ok=True)
    model.save_model('models/plant_disease_model.h5')
    
    # Convert to TensorFlow Lite
    model.convert_to_tflite()
    
    # Save class names
    with open('backend/utils/class_names.json', 'w') as f:
        json.dump(demo_classes, f, indent=2)
    
    print(f"Demo model created with {len(demo_classes)} classes")
    return model

if __name__ == "__main__":
    create_demo_model()