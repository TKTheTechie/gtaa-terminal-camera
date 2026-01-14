# ESP32 Video Stream Server

A Node.js server that consumes video streams from ESP32 camera modules and publishes them over Solace PubSub using MQTT.

## Features

- Connects to ESP32 camera module via HTTP stream
- Processes MJPEG video frames
- Publishes video data to Solace PubSub+ via MQTT
- RESTful API for stream control
- Chunked frame transmission for large video frames
- Health monitoring and status endpoints

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