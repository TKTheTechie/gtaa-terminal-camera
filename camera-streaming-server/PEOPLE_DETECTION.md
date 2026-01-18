# People Detection Setup Guide

## Overview

Your ESP32 video streaming server now includes YOLOv8-based people detection and counting. This provides highly accurate real-time person detection with configurable intervals and confidence thresholds.

## Quick Start

### 1. Export the YOLOv8 Model

The model needs to be exported to ONNX format before first use. Choose a model size based on your accuracy needs:

**Model Sizes (in order of accuracy):**
- `yolov8n` - Nano: Fastest, ~6MB, basic accuracy
- `yolov8s` - Small: Fast, ~22MB, good accuracy  
- `yolov8m` - Medium: Balanced, ~99MB, **RECOMMENDED for best accuracy**
- `yolov8l` - Large: Slower, ~87MB, high accuracy
- `yolov8x` - Extra Large: Slowest, ~136MB, highest accuracy

```bash
# Install Python dependencies (one-time setup)
python3 -m venv venv
source venv/bin/activate
pip install ultralytics

# Export the model (use yolov8m for best balance)
python export-yolo-model.py yolov8m
```

This creates `models/yolov8m.onnx` which is cached for future use.

### 2. Configure Detection

Edit your `.env` file:

```bash
# Enable people detection
ENABLE_PEOPLE_DETECTION=true

# Model size (yolov8n, yolov8s, yolov8m, yolov8l, yolov8x)
# Use yolov8m for best accuracy
YOLO_MODEL_SIZE=yolov8m

# Run detection every 2 seconds (adjust based on your needs)
DETECTION_INTERVAL_MS=2000

# Minimum confidence threshold (0.0-1.0)
# Lower = more detections but more false positives
# Higher = fewer detections but more accurate
DETECTION_CONFIDENCE_THRESHOLD=0.4

# MQTT topic for publishing analytics
ANALYTICS_TOPIC=gtaa/camera/analytics/gate1
```

### 3. Start the Server

```bash
npm start
```

You should see:
```
Initializing YOLOv8 detector...
Found existing yolov8m model: 99.00MB
Loading YOLOV8M ONNX model into runtime...
✓ YOLOV8M model loaded successfully
  Detection interval: 2000ms
  Confidence threshold: 0.4
  Analytics topic: gtaa/camera/analytics/gate1
  Model: yolov8m
```

## How It Works

1. **Video Capture**: Frames are captured from your ESP32 camera
2. **Periodic Detection**: Every N milliseconds (configured by `DETECTION_INTERVAL_MS`), a frame is queued for analysis
3. **YOLOv8 Processing**: The frame is analyzed by YOLOv8 to detect people
4. **Filtering**: Only detections with confidence >= threshold are counted
5. **Analytics Publishing**: Results are published to your configured MQTT topic

## Analytics Output Format

Analytics are published as JSON to your `ANALYTICS_TOPIC`:

```json
{
  "timestamp": "2026-01-16T12:34:56.789Z",
  "peopleCount": 3,
  "detections": [
    {
      "confidence": 0.87,
      "bbox": {
        "x": 120,
        "y": 80,
        "width": 150,
        "height": 320
      }
    },
    {
      "confidence": 0.92,
      "bbox": {
        "x": 350,
        "y": 100,
        "width": 140,
        "height": 310
      }
    },
    {
      "confidence": 0.78,
      "bbox": {
        "x": 550,
        "y": 90,
        "width": 145,
        "height": 305
      }
    }
  ],
  "frameSize": {
    "width": 800,
    "height": 600
  },
  "activeTopic": "aircanada",
  "model": "YOLOv8n-ONNX"
}
```

## Performance Tuning

### Model Selection for Accuracy

**For Maximum Accuracy:**
1. Use `yolov8m` (medium) or larger - significantly more accurate than nano
2. Lower confidence threshold to 0.3-0.4 to catch more people
3. Ensure good lighting and camera positioning

**Model Comparison:**
| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| yolov8n | 6MB | Fastest | Basic | Testing, low-power devices |
| yolov8s | 22MB | Fast | Good | Real-time with decent accuracy |
| yolov8m | 99MB | Medium | **Excellent** | **Production (recommended)** |
| yolov8l | 87MB | Slow | Very High | High accuracy requirements |
| yolov8x | 136MB | Slowest | Highest | Maximum accuracy needed |

**To switch models:**
```bash
# Export the new model
source venv/bin/activate
python export-yolo-model.py yolov8m  # or yolov8l, yolov8x

# Update .env
YOLO_MODEL_SIZE=yolov8m

# Restart server
npm start
```

### Detection Interval

- **Faster (500-1000ms)**: Real-time monitoring, higher CPU usage
- **Balanced (2000ms)**: Good for most use cases
- **Slower (5000ms+)**: Periodic checks, lower CPU usage

### Confidence Threshold

**For Better Accuracy:**
- **0.3-0.4**: Catches more people, some false positives (recommended with yolov8m+)
- **0.5**: Balanced (good for yolov8n/s)
- **0.6-0.7**: Fewer detections, higher precision
- **0.8+**: Very conservative, may miss people

**Tip:** With larger models (yolov8m+), you can use lower thresholds (0.3-0.4) and still maintain high accuracy.

### Camera Setup for Best Results

1. **Lighting**: Ensure adequate, even lighting
2. **Angle**: Position camera to capture full body views when possible
3. **Distance**: Optimal detection at 2-15 meters
4. **Resolution**: Higher resolution = better detection
5. **Avoid**: Extreme angles, backlighting, heavy shadows

### System Impact

- Detection runs asynchronously and won't block video streaming
- Only the latest frame is kept in the detection queue
- Typical detection time: 
  - yolov8n: 100-300ms
  - yolov8m: 300-800ms
  - yolov8l/x: 800-1500ms
- CPU usage depends on detection interval and model size
- Memory usage:
  - yolov8n: ~50MB
  - yolov8m: ~200MB
  - yolov8x: ~400MB

## Troubleshooting

### Model Not Found

If you see "YOLOv8n model not found", run the export script:
```bash
python export-yolo-model.py
```

### Low Accuracy

**Solutions:**
1. **Upgrade model**: Switch from yolov8n to yolov8m or yolov8l
   ```bash
   python export-yolo-model.py yolov8m
   # Update YOLO_MODEL_SIZE=yolov8m in .env
   ```
2. **Lower threshold**: Try 0.3-0.4 instead of 0.5
3. **Improve lighting**: Ensure good, even lighting
4. **Check camera angle**: Avoid extreme angles or obstructions
5. **Verify frame quality**: Check that video frames are clear

### High CPU Usage

- Increase `DETECTION_INTERVAL_MS` (e.g., 5000 for every 5 seconds)
- Consider disabling detection when not needed

### No Detections

- Check that people are clearly visible in the frame
- Lower the confidence threshold
- Verify the model loaded successfully in server logs

## Why YOLOv8?

- **State-of-the-art accuracy**: Best-in-class object detection
- **Fast inference**: Optimized for real-time use
- **Robust**: Works well in various lighting and angles
- **Precise bounding boxes**: Accurate location data
- **Low false positives**: Better at distinguishing people from objects
- **No authentication required**: Uses ONNX Runtime with local model

## Files

- `yolo-detector.js`: YOLOv8 detection implementation
- `export-yolo-model.py`: Script to export model to ONNX
- `models/yolov8n.onnx`: The detection model (created by export script)
- `download-model.js`: Alternative download script (not currently working due to GitHub releases)
