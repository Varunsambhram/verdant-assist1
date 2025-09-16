"""
Image preprocessing utilities for plant disease detection
"""

import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageFilter
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import albumentations as A

class ImagePreprocessor:
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size
        
    def preprocess_image(self, image, normalize=True):
        """
        Preprocess image for model prediction
        
        Args:
            image: PIL Image or numpy array
            normalize: Whether to normalize pixel values
            
        Returns:
            Preprocessed image array ready for model
        """
        
        # Convert to PIL Image if numpy array
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        
        # Resize to target size
        image = image.resize(self.target_size, Image.Resampling.LANCZOS)
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Normalize pixel values
        if normalize:
            img_array = img_array.astype('float32') / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def enhance_image_quality(self, image):
        """
        Enhance image quality for better disease detection
        """
        
        # Convert to PIL if numpy array
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)
        
        # Enhance color
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.1)
        
        return image
    
    def remove_background(self, image):
        """
        Simple background removal to focus on plant
        """
        
        # Convert PIL to OpenCV format
        if isinstance(image, Image.Image):
            image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Convert to HSV for better plant segmentation
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Define range for green colors (plants)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        
        # Create mask
        mask = cv2.inRange(hsv, lower_green, upper_green)
        
        # Apply morphological operations to clean mask
        kernel = np.ones((5,5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        # Apply mask
        result = cv2.bitwise_and(image, image, mask=mask)
        
        # Convert back to PIL
        result = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
        return Image.fromarray(result)

def create_data_generators(train_dir, val_dir, test_dir, batch_size=32, target_size=(224, 224)):
    """
    Create data generators with augmentation for training
    """
    
    # Training data generator with augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest',
        brightness_range=[0.8, 1.2]
    )
    
    # Validation and test data generators (no augmentation)
    val_test_datagen = ImageDataGenerator(rescale=1./255)
    
    # Create generators
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=True
    )
    
    val_generator = val_test_datagen.flow_from_directory(
        val_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )
    
    test_generator = val_test_datagen.flow_from_directory(
        test_dir,
        target_size=target_size,
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, val_generator, test_generator

def advanced_augmentation():
    """
    Advanced augmentation using Albumentations
    """
    
    transform = A.Compose([
        A.RandomRotate90(),
        A.Flip(),
        A.Transpose(),
        A.OneOf([
            A.IAAAdditiveGaussianNoise(),
            A.GaussNoise(),
        ], p=0.2),
        A.OneOf([
            A.MotionBlur(p=.2),
            A.MedianBlur(blur_limit=3, p=0.1),
            A.Blur(blur_limit=3, p=0.1),
        ], p=0.2),
        A.ShiftScaleRotate(shift_limit=0.0625, scale_limit=0.2, rotate_limit=45, p=0.2),
        A.OneOf([
            A.OpticalDistortion(p=0.3),
            A.GridDistortion(p=.1),
            A.IAAPiecewiseAffine(p=0.3),
        ], p=0.2),
        A.OneOf([
            A.CLAHE(clip_limit=2),
            A.IAASharpen(),
            A.IAAEmboss(),
            A.RandomBrightnessContrast(),
        ], p=0.3),
        A.HueSaturationValue(p=0.3),
    ])
    
    return transform

def crop_leaf_region(image, margin=0.1):
    """
    Crop image to focus on leaf regions
    """
    
    # Convert to numpy if PIL
    if isinstance(image, Image.Image):
        img_array = np.array(image)
    else:
        img_array = image
    
    # Convert to grayscale for edge detection
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    
    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Find edges
    edges = cv2.Canny(blurred, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Find the largest contour (likely the leaf)
        largest_contour = max(contours, key=cv2.contourArea)
        
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(largest_contour)
        
        # Add margin
        margin_x = int(w * margin)
        margin_y = int(h * margin)
        
        x = max(0, x - margin_x)
        y = max(0, y - margin_y)
        w = min(img_array.shape[1] - x, w + 2 * margin_x)
        h = min(img_array.shape[0] - y, h + 2 * margin_y)
        
        # Crop image
        cropped = img_array[y:y+h, x:x+w]
        
        return Image.fromarray(cropped)
    
    return image

def normalize_image_histogram(image):
    """
    Normalize image histogram for better contrast
    """
    
    if isinstance(image, Image.Image):
        img_array = np.array(image)
    else:
        img_array = image
    
    # Convert to LAB color space
    lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
    
    # Apply CLAHE to L channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    lab[:,:,0] = clahe.apply(lab[:,:,0])
    
    # Convert back to RGB
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    
    return Image.fromarray(enhanced)

# Utility functions for data preprocessing
def split_dataset(data_dir, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15):
    """
    Split dataset into train/validation/test sets
    """
    import os
    import shutil
    from sklearn.model_selection import train_test_split
    
    # Create output directories
    for split in ['train', 'val', 'test']:
        os.makedirs(f"{data_dir}_{split}", exist_ok=True)
    
    # Process each class
    for class_name in os.listdir(data_dir):
        class_path = os.path.join(data_dir, class_name)
        if not os.path.isdir(class_path):
            continue
        
        # Get all images in class
        images = [f for f in os.listdir(class_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        # Split dataset
        train_imgs, temp_imgs = train_test_split(images, test_size=(1-train_ratio), random_state=42)
        val_imgs, test_imgs = train_test_split(temp_imgs, test_size=(test_ratio/(val_ratio+test_ratio)), random_state=42)
        
        # Create class directories in splits
        for split in ['train', 'val', 'test']:
            os.makedirs(f"{data_dir}_{split}/{class_name}", exist_ok=True)
        
        # Copy files
        for img in train_imgs:
            shutil.copy2(os.path.join(class_path, img), f"{data_dir}_train/{class_name}/{img}")
        
        for img in val_imgs:
            shutil.copy2(os.path.join(class_path, img), f"{data_dir}_val/{class_name}/{img}")
        
        for img in test_imgs:
            shutil.copy2(os.path.join(class_path, img), f"{data_dir}_test/{class_name}/{img}")
    
    print(f"Dataset split completed:")
    print(f"Train: {len(train_imgs)} images per class")
    print(f"Validation: {len(val_imgs)} images per class") 
    print(f"Test: {len(test_imgs)} images per class")