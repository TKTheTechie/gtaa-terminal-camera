#!/usr/bin/env python3
"""
Export YOLOv8 model to ONNX format for use with Node.js
Requires: pip install ultralytics

Usage:
  python export-yolo-model.py [model_size]
  
Model sizes:
  - yolov8n: Nano (fastest, ~6MB, least accurate)
  - yolov8s: Small (~22MB)
  - yolov8m: Medium (~50MB, balanced) - RECOMMENDED
  - yolov8l: Large (~87MB)
  - yolov8x: Extra Large (~136MB, most accurate)
"""

import os
import sys

# Get model size from command line or default to medium
model_size = sys.argv[1] if len(sys.argv) > 1 else 'yolov8m'

valid_sizes = ['yolov8n', 'yolov8s', 'yolov8m', 'yolov8l', 'yolov8x']
if model_size not in valid_sizes:
    print(f"Error: Invalid model size '{model_size}'")
    print(f"Valid sizes: {', '.join(valid_sizes)}")
    sys.exit(1)

try:
    from ultralytics import YOLO
except ImportError:
    print("Error: ultralytics package not found")
    print("Install it with: pip install ultralytics")
    sys.exit(1)

# Create models directory
models_dir = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(models_dir, exist_ok=True)

print(f"Loading {model_size.upper()} model...")
model = YOLO(f'{model_size}.pt')  # This will download the model if not present

print("Exporting to ONNX format...")
model.export(format='onnx', simplify=True)

# Move the exported model to the models directory
import shutil
source = f'{model_size}.onnx'
destination = os.path.join(models_dir, f'{model_size}.onnx')

if os.path.exists(source):
    shutil.move(source, destination)
    print(f"✓ Model exported successfully to: {destination}")
    
    # Print file size
    size_mb = os.path.getsize(destination) / (1024 * 1024)
    print(f"  Model size: {size_mb:.2f}MB")
    
    # Print accuracy info
    accuracy_info = {
        'yolov8n': 'Fastest, least accurate',
        'yolov8s': 'Fast, good accuracy',
        'yolov8m': 'Balanced speed and accuracy (RECOMMENDED)',
        'yolov8l': 'Slower, high accuracy',
        'yolov8x': 'Slowest, highest accuracy'
    }
    print(f"  Profile: {accuracy_info.get(model_size, 'Unknown')}")
else:
    print("Error: Export failed, model file not found")
    sys.exit(1)
