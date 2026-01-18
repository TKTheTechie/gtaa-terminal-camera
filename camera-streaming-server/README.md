# ESP32 Video Stream Server

A Node.js server that consumes video streams from ESP32 camera modules and publishes them over Solace PubSub using MQTT.

## Features

- Connects to ESP32 camera module via HTTP stream
- Processes MJPEG video frames
- Publishes video data to Solace PubSub+ via MQTT
- RESTful API for stream control
- Chunked frame transmission for large video frames
- Health monitoring and status endpoints
- **Real-time people detection and counting using YOLOv8**
- **Periodic analytics publishing with person count and bounding boxes**

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
   - `SOLACE_MQTT_HOST`: Your Solace PubSub+ MQTT broker URL
   - `SOLACE_USERNAME/PASSWORD`: Solace credentials
   - `ESP32_CAMERA_IP`: IP address of your ESP32 camera
   - `VIDEO_TOPIC_PREFIX`: Base prefix for video topics
   - `ACTIVE_TOPIC`: Current active topic suffix (default: aircanada)
   - `MAX_FPS`: Maximum frames per second (0 = unlimited, e.g., 10 for 10 fps)
   - `MIN_FRAME_INTERVAL_MS`: Minimum milliseconds between frames (0 = no throttling, overridden by MAX_FPS)
   - `ENABLE_PEOPLE_DETECTION`: Enable/disable people detection (true/false)
   - `DETECTION_INTERVAL_MS`: How often to run detection in milliseconds (e.g., 2000 for every 2 seconds)
   - `DETECTION_CONFIDENCE_THRESHOLD`: Minimum confidence score for person detection (0.0-1.0, default: 0.5)
   - `ANALYTICS_TOPIC`: MQTT topic for publishing analytics data
   - Other configuration as needed

The video topic will be constructed as `{VIDEO_TOPIC_PREFIX}/{ACTIVE_TOPIC}` (e.g., `video/esp32/aircanada`)

### Frame Rate Control

You can control the frame rate using either:
- **MAX_FPS**: Set desired frames per second (e.g., `MAX_FPS=10` for 10 fps)
- **MIN_FRAME_INTERVAL_MS**: Set minimum milliseconds between frames (e.g., `MIN_FRAME_INTERVAL_MS=100` for max 10 fps)
- Set both to `0` for unlimited frame rate (publishes as fast as ESP32 sends frames)

## Usage

### Start the server:
```bash
npm start
```

### API Endpoints

- `GET /health` - Server health check
- `POST /stream/start` - Start video streaming
- `POST /stream/stop` - Stop video streaming  
- `GET /stream/status` - Get current stream status
- `POST /stream/topic` - Change video topic (body: `{"topic": "new/topic/path"}`)

### MQTT Topics

The server publishes to these topics:
- `{VIDEO_TOPIC_PREFIX}/{ACTIVE_TOPIC}/stream` - Complete video frames with metadata and data
- `{ANALYTICS_TOPIC}` - People detection analytics (when enabled)

The server subscribes to:
- `video/esp32/control` - Control topic for dynamic configuration
- `video/esp32/request` - Request topic for client queries

**Default Topic Structure:**
- Video Topic Prefix: `video/esp32`
- Active Topic: `aircanada`
- Full Video Stream Topic: `video/esp32/aircanada/stream`

### Request-Response Pattern

Clients can send requests to query server information:

**Request Format:**
```json
{
  "requestId": "unique-request-id",
  "requestType": "get_active_topic|get_status|get_config",
  "replyTo": "optional/custom/response/topic"
}
```

**Supported Request Types:**

1. **get_active_topic** - Get current video topic and streaming status
2. **get_status** - Get comprehensive server status
3. **get_config** - Get server configuration details

**Response Format:**
```json
{
  "requestId": "unique-request-id",
  "requestType": "get_active_topic",
  "status": "success|error",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "error": "error message if status is error"
}
```

**Example Request/Response:**
```bash
# Request (publish to video/esp32/request)
{
  "requestId": "req-123",
  "requestType": "get_active_topic"
}

# Response (received on video/esp32/response)
{
  "requestId": "req-123",
  "requestType": "get_active_topic",
  "status": "success",
  "data": {
    "videoTopicPrefix": "video/esp32",
    "activeTopic": "aircanada",
    "fullVideoTopic": "video/esp32/aircanada",
    "controlTopic": "video/esp32/control",
    "streamActive": true
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Dynamic Topic Control

You can change the active topic (which changes the video publishing topic) at runtime:

**Via MQTT:**
```json
{
  "controlTopic": "westjet"
}
```
This changes the video topic from `video/esp32/aircanada` to `video/esp32/westjet`

**Via REST API:**
```bash
curl -X POST http://localhost:3000/stream/topic \
  -H "Content-Type: application/json" \
  -d '{"topic": "westjet"}'
```

When the topic changes, a notification is published to `video/esp32/control/notifications`.

## ESP32 Camera Setup

Your ESP32 should be configured to serve MJPEG stream on the specified endpoint (default: `/stream`).

## Message Format

### Frame Message (Published to stream topic)

Frames are published as binary buffers for maximum performance:

**Format:** `frameId|timestamp|frameSize|<binary JPEG data>`

**Example Header:** `1768395249541|2024-01-01T00:00:00.000Z|15234|`

The message is a Buffer containing:
1. UTF-8 encoded header with pipe-delimited metadata
2. Raw JPEG binary data (no encoding overhead)

To parse in subscriber:
```javascript
const message = Buffer.from(payload);
const headerEnd = message.indexOf(Buffer.from('|'), message.lastIndexOf(Buffer.from('|')) + 1);
const header = message.subarray(0, headerEnd).toString('utf8');
const [frameId, timestamp, frameSize] = header.split('|');
const jpegData = message.subarray(headerEnd + 1);
```

This binary format eliminates base64 encoding overhead (~33% size reduction) for maximum throughput.

## People Detection & Analytics

When enabled, the server uses **YOLOv8** (You Only Look Once v8) for accurate real-time person detection and counting. YOLOv8 is significantly more accurate than COCO-SSD and provides better performance in various lighting conditions and angles.

### Setup

**First, you need to export the YOLOv8 model to ONNX format:**

```bash
# Install Python dependencies
pip install ultralytics

# Export the model (this will download and convert YOLOv8n to ONNX)
python export-yolo-model.py
```

This will create `models/yolov8n.onnx` (~6MB) which the server will use for detection.

### Configuration

```bash
ENABLE_PEOPLE_DETECTION=true
DETECTION_INTERVAL_MS=2000          # Run detection every 2 seconds
DETECTION_CONFIDENCE_THRESHOLD=0.5  # Minimum confidence (0.0-1.0)
ANALYTICS_TOPIC=gtaa/camera/analytics/gate1
```

### Analytics Message Format

Analytics are published to the configured `ANALYTICS_TOPIC` as JSON:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
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
    }
  ],
  "frameSize": {
    "width": 640,
    "height": 480
  },
  "activeTopic": "aircanada"
}
```

### How It Works

1. Video frames are captured from the ESP32 camera
2. At the configured interval (e.g., every 2 seconds), a frame is queued for detection
3. The YOLOv8 model analyzes the frame and identifies people with high accuracy
4. Only detections with confidence >= threshold are counted
5. Analytics with person count and bounding boxes are published to MQTT
6. Detection runs asynchronously to avoid blocking video streaming

### Why YOLOv8?

- **Higher Accuracy**: YOLOv8 is state-of-the-art for object detection
- **Better Performance**: Optimized for real-time detection
- **Robust Detection**: Works well in various lighting conditions, angles, and occlusions
- **Precise Bounding Boxes**: More accurate location data for each person
- **Lower False Positives**: Better at distinguishing people from other objects
- **No Authentication Required**: Uses ONNX Runtime with direct model download from Ultralytics

### Performance Notes

- Detection runs on a separate queue to prevent blocking video streaming
- Only the latest frame is kept in the detection queue
- Model downloads automatically on first run (~6MB, cached in `models/` directory)
- Detection typically takes 200-800ms per frame depending on image size
- Adjust `DETECTION_INTERVAL_MS` based on your performance requirements
- Recommended threshold: 0.4-0.6 for best balance of accuracy and false positives