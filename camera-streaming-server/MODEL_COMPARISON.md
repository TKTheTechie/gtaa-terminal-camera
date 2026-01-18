# YOLOv8 Model Comparison for People Detection

## Quick Recommendation

**For best accuracy: Use YOLOv8m (Medium)**

Your `.env` is already configured with `YOLO_MODEL_SIZE=yolov8m` which provides excellent accuracy while maintaining reasonable performance.

## Detailed Comparison

### YOLOv8n (Nano) - Currently NOT Recommended
- **Size**: 6MB
- **Speed**: ~100-300ms per frame
- **Accuracy**: Basic (37.3% mAP)
- **Use Case**: Testing only, not accurate enough for production
- **Memory**: ~50MB

### YOLOv8s (Small)
- **Size**: 22MB  
- **Speed**: ~200-400ms per frame
- **Accuracy**: Good (44.9% mAP)
- **Use Case**: Real-time with decent accuracy
- **Memory**: ~100MB

### YOLOv8m (Medium) ⭐ RECOMMENDED
- **Size**: 99MB
- **Speed**: ~300-800ms per frame
- **Accuracy**: Excellent (50.2% mAP) - **34% more accurate than nano**
- **Use Case**: Production environments, best balance
- **Memory**: ~200MB
- **Why**: Significantly better at detecting people in various conditions

### YOLOv8l (Large)
- **Size**: 87MB
- **Speed**: ~800-1200ms per frame
- **Accuracy**: Very High (52.9% mAP)
- **Use Case**: High accuracy requirements, can tolerate slower detection
- **Memory**: ~300MB

### YOLOv8x (Extra Large)
- **Size**: 136MB
- **Speed**: ~1000-1500ms per frame
- **Accuracy**: Highest (53.9% mAP)
- **Use Case**: Maximum accuracy, offline processing
- **Memory**: ~400MB

## Real-World Performance

### Detection Quality Improvements (vs YOLOv8n)

**YOLOv8m advantages:**
- ✅ Better detection of partially occluded people
- ✅ More accurate in low-light conditions
- ✅ Better handling of people at various distances
- ✅ Fewer false positives
- ✅ More precise bounding boxes
- ✅ Better detection of people in groups/crowds

### Recommended Settings by Model

```bash
# YOLOv8n (not recommended for accuracy)
YOLO_MODEL_SIZE=yolov8n
DETECTION_CONFIDENCE_THRESHOLD=0.5
DETECTION_INTERVAL_MS=1000

# YOLOv8s
YOLO_MODEL_SIZE=yolov8s
DETECTION_CONFIDENCE_THRESHOLD=0.45
DETECTION_INTERVAL_MS=1500

# YOLOv8m (RECOMMENDED) ⭐
YOLO_MODEL_SIZE=yolov8m
DETECTION_CONFIDENCE_THRESHOLD=0.4
DETECTION_INTERVAL_MS=2000

# YOLOv8l
YOLO_MODEL_SIZE=yolov8l
DETECTION_CONFIDENCE_THRESHOLD=0.35
DETECTION_INTERVAL_MS=3000

# YOLOv8x
YOLO_MODEL_SIZE=yolov8x
DETECTION_CONFIDENCE_THRESHOLD=0.3
DETECTION_INTERVAL_MS=4000
```

## How to Switch Models

### 1. Export the desired model

```bash
source venv/bin/activate

# For medium (recommended)
python export-yolo-model.py yolov8m

# For large (if you need even more accuracy)
python export-yolo-model.py yolov8l

# For extra large (maximum accuracy)
python export-yolo-model.py yolov8x
```

### 2. Update your .env file

```bash
YOLO_MODEL_SIZE=yolov8m  # or yolov8l, yolov8x
DETECTION_CONFIDENCE_THRESHOLD=0.4  # adjust based on model
```

### 3. Restart the server

```bash
npm start
```

## Performance vs Accuracy Trade-off

```
Accuracy ↑
│
│  yolov8x ●
│  yolov8l ●
│  yolov8m ● ← RECOMMENDED (best balance)
│  yolov8s ●
│  yolov8n ●
│
└──────────────────→ Speed ↑
```

## When to Use Each Model

### Use YOLOv8m when:
- ✅ You need reliable people counting
- ✅ Detection accuracy is important
- ✅ You can tolerate 2-3 second detection intervals
- ✅ You have moderate CPU resources
- ✅ **This is the recommended default**

### Use YOLOv8l/x when:
- ✅ Maximum accuracy is critical
- ✅ You can tolerate slower detection (3-5 seconds)
- ✅ You have powerful CPU resources
- ✅ False negatives are unacceptable

### Use YOLOv8s when:
- ✅ You need faster detection (<1 second)
- ✅ Moderate accuracy is acceptable
- ✅ CPU resources are limited

### Avoid YOLOv8n when:
- ❌ You need accurate people counting
- ❌ Detection quality matters
- ❌ You're in production

## Testing Your Model

After switching models, test with various scenarios:

1. **Single person**: Should detect reliably
2. **Multiple people**: Should count accurately
3. **Partial occlusion**: Should still detect visible people
4. **Various distances**: Should work at different ranges
5. **Different lighting**: Should handle various conditions

Monitor the console output to see detection confidence scores and adjust threshold accordingly.
