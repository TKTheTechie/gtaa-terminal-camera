# GTAA Camera Streaming System

A real-time camera streaming system that captures video from ESP32 cameras and streams them over Solace PubSub+ to a web application with admin controls.

## System Overview

This system consists of two main components:

1. **Camera Streaming Server** - Node.js server that connects to ESP32 cameras and publishes video streams to Solace PubSub+
2. **Camera Web App** - SvelteKit web application that displays video feeds with airline-specific dashboards and admin controls

## Architecture

### High-Level System Architecture

```
┌─────────────────┐
│   ESP32 Camera  │
│   (MJPEG Stream)│
└────────┬────────┘
         │ HTTP Stream
         │ (MJPEG frames)
         ▼
┌─────────────────────────────────────────────────────────────┐
│           Camera Streaming Server (Node.js)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Consumes MJPEG stream from ESP32                  │   │
│  │  • Extracts individual JPEG frames                   │   │
│  │  • Publishes frames to Solace (binary format)        │   │
│  │  • Listens for control messages                      │   │
│  │  • Dynamic topic switching                           │   │
│  │  • REST API for management                           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────────────────────────────┘
         │ MQTT over Solace PubSub+
         │ (Binary JPEG frames)
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Solace PubSub+ Event Broker                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Topics:                                             │   │
│  │  • gtaa/terminal1/camera/gate1/{airline}/stream      │   │
│  │    (video frames)                                    │   │
│  │  • gtaa/terminal1/camera/gate1/control               │   │
│  │    (control messages)                                │   │
│  │  • gtaa/terminal1/camera/gate1/control/notifications │   │
│  │    (events)                                          │   │
│  └──────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────────────────────────────┘
         │ WebSocket (Solace JS API)
         │ (Subscriptions & Messages)
         ▼
┌─────────────────────────────────────────────────────────────┐
│         Camera Web App (SvelteKit + TypeScript)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  User Dashboards:                                    │   │
│  │  • Airline-specific feeds (Air Canada, WestJet, etc) │   │
│  │  • Real-time video display                           │   │
│  │  • FPS monitoring                                    │   │
│  │                                                      │   │
│  │  Admin Dashboard:                                    │   │
│  │  • View all camera feeds                             │   │
│  │  • Switch publisher topics dynamically               │   │
│  │  • Monitor system status                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ HTTPS
         │
    ┌────┴─────┐
    │  Users   │
    │ (Browser)│
    └──────────┘
```

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         VIDEO STREAMING FLOW                         │
└──────────────────────────────────────────────────────────────────────┘

ESP32 Camera                Streaming Server              Solace Broker
     │                             │                            │
     │  1. HTTP MJPEG Stream       │                            │
     │────────────────────────────>│                            │
     │    (Continuous frames)      │                            │
     │                             │                            │
     │                             │  2. Extract JPEG frames    │
     │                             │     Parse boundaries       │
     │                             │     (0xFF 0xD8 → 0xFF 0xD9)│
     │                             │                            │
     │                             │  3. Publish binary frame   │
     │                             │────────────────────────────>│
     │                             │    Topic: gtaa/terminal1/  │
     │                             │           camera/gate1/    │
     │                             │           {airline}/stream │
     │                             │    Format: frameId|        │
     │                             │            timestamp|      │
     │                             │            size|<JPEG>     │
     │                             │                            │
     │                             │                            │  4. Route to
     │                             │                            │     subscribers
     │                             │                            │
                                                                 │
                                                                 ▼
                                                          Web App Client
                                                                 │
                                                                 │  5. Receive frame
                                                                 │     Parse header
                                                                 │     Extract JPEG
                                                                 │     Convert to base64
                                                                 │     Display image
                                                                 │
                                                                 ▼
                                                            User Browser
                                                         (Real-time video)
```

### Admin Control Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ADMIN TOPIC SWITCHING FLOW                        │
└──────────────────────────────────────────────────────────────────────┘

Admin Dashboard          Solace Broker           Streaming Server
     │                        │                         │
     │  1. User selects       │                         │
     │     new airline        │                         │
     │     (e.g., "westjet")  │                         │
     │                        │                         │
     │  2. Publish control    │                         │
     │     message            │                         │
     │───────────────────────>│                         │
     │  Topic: gtaa/terminal1/│                         │
     │         camera/gate1/  │                         │
     │         control        │                         │
     │  Payload:              │                         │
     │  {                     │                         │
     │    "controlTopic":     │                         │
     │    "westjet"           │                         │
     │  }                     │                         │
     │                        │                         │
     │                        │  3. Route to subscriber │
     │                        │────────────────────────>│
     │                        │                         │
     │                        │                         │  4. Send INACTIVE
     │                        │                         │     to old topic
     │                        │<────────────────────────│
     │                        │  Topic: gtaa/terminal1/ │
     │                        │         camera/gate1/   │
     │                        │         aircanada/stream│
     │                        │                         │
     │                        │                         │  5. Switch to
     │                        │                         │     new topic
     │                        │                         │     (westjet)
     │                        │                         │
     │                        │  6. Publish notification│
     │                        │<────────────────────────│
     │  7. Receive            │  Topic: gtaa/terminal1/ │
     │     notification       │         camera/gate1/   │
     │<───────────────────────│         control/        │
     │                        │         notifications   │
     │                        │                         │
     │  8. Update UI          │                         │
     │     Show new topic     │                         │
     │                        │                         │
     │                        │  9. Publish frames to   │
     │                        │     new topic           │
     │                        │<────────────────────────│
     │                        │  Topic: gtaa/terminal1/ │
     │                        │         camera/gate1/   │
     │                        │         westjet/stream  │
     │                        │                         │
```

### Message Format Specifications

#### Video Frame Message (Binary)
```
┌─────────────────────────────────────────────────────────────┐
│                    Binary Frame Format                      │
├─────────────────────────────────────────────────────────────┤
│  Header (UTF-8 String):                                     │
│    frameId|timestamp|frameSize|                             │
│                                                              │
│  Example:                                                    │
│    1705267890541|2024-01-14T22:31:30.541Z|15234|            │
│                                                              │
│  Body (Binary JPEG):                                        │
│    <raw JPEG bytes starting with 0xFF 0xD8>                 │
│    <ending with 0xFF 0xD9>                                  │
└─────────────────────────────────────────────────────────────┘

Benefits:
• ~33% smaller than base64 encoding
• Direct binary transmission
• Minimal parsing overhead
• Maximum throughput
```

#### Control Message (JSON)
```json
{
  "controlTopic": "westjet"
}
```

#### Notification Message (JSON)
```json
{
  "type": "topic_changed",
  "oldActiveTopic": "aircanada",
  "newActiveTopic": "westjet",
  "oldVideoTopic": "gtaa/terminal1/camera/gate1/aircanada",
  "newVideoTopic": "gtaa/terminal1/camera/gate1/westjet",
  "videoTopicPrefix": "gtaa/terminal1/camera/gate1",
  "timestamp": "2024-01-14T22:31:30.541Z"
}
```

#### Inactive Frame Message (JSON)
```json
{
  "frameId": "1705267890541",
  "timestamp": "2024-01-14T22:31:30.541Z",
  "frameSize": 635,
  "type": "inactive",
  "message": "INACTIVE",
  "data": "<base64 encoded 1x1 black JPEG>"
}
```

## Component Details

### Camera Streaming Server

**Technology Stack:**
- Node.js with Express
- MQTT client for Solace connectivity
- HTTP client for ESP32 communication

**Key Features:**
- MJPEG stream parsing with frame boundary detection
- Binary frame publishing (no base64 overhead)
- Configurable frame rate throttling (MAX_FPS or MIN_FRAME_INTERVAL_MS)
- Dynamic topic switching via MQTT control messages
- RESTful API for stream management
- Health monitoring and statistics reporting
- Graceful handling of topic changes with INACTIVE frames

**Configuration:**
```env
# Solace PubSub+ MQTT Configuration
SOLACE_MQTT_HOST=tcp://localhost:1883
SOLACE_USERNAME=default
SOLACE_PASSWORD=default
SOLACE_CLIENT_ID=gtaa-video-streamer

# ESP32 Camera Configuration
ESP32_CAMERA_IP=192.168.40.169
ESP32_STREAM_PORT=81
ESP32_STREAM_PATH=/stream

# Server Configuration
SERVER_PORT=3000
VIDEO_TOPIC_PREFIX=gtaa/terminal1/camera/gate1
ACTIVE_TOPIC=aircanada
CONTROL_TOPIC=gtaa/terminal1/camera/gate1/control
CHUNK_SIZE=8192
MIN_FRAME_INTERVAL_MS=0
MAX_FPS=10
```

**API Endpoints:**
- `GET /health` - Server health check
- `POST /stream/start` - Start video streaming
- `POST /stream/stop` - Stop video streaming
- `GET /stream/status` - Get current stream status
- `POST /stream/topic` - Change active topic

### Camera Web App

**Technology Stack:**
- SvelteKit with TypeScript
- Solace JavaScript API v10.18.2
- Tailwind CSS for styling
- Vite for build tooling

**Key Features:**
- Secure authentication with static credentials
- Real-time video feed display with FPS monitoring
- Airline-specific dashboards (Air Canada, Lufthansa, WestJet)
- Admin dashboard with multi-feed monitoring
- Dynamic topic switching from admin panel
- Binary frame parsing and base64 conversion
- Connection status monitoring
- Demo mode for development without Solace broker

**User Roles:**
- **Airlines**: View their specific camera feed
  - `aircanada` / `aircanada`
  - `lufthansa` / `lufthansa`
  - `westjet` / `westjet`
- **Admin**: View all feeds and control topic routing
  - `admin` / `admin`

**Routes:**
- `/` - Login page
- `/{username}` - Airline dashboard
- `/admin` - Admin control panel

## Topic Structure

```
gtaa/terminal1/camera/gate1/
├── {airline}/
│   └── stream              # Video frames (binary)
├── control                 # Control messages (JSON)
└── control/
    └── notifications       # System events (JSON)
```

**Topic Hierarchy:**
- **Base Path**: `gtaa/terminal1/camera/gate1`
  - Represents: GTAA (Greater Toronto Airport Authority) → Terminal 1 → Camera at Gate 1
- **Airline Streams**: `{base}/{airline}/stream`
  - Dynamic airline identifier (aircanada, westjet, lufthansa, etc.)
- **Control**: `{base}/control`
  - Commands to switch active airline topic
- **Notifications**: `{base}/control/notifications`
  - System events and topic change notifications

**Examples:**
- `gtaa/terminal1/camera/gate1/aircanada/stream` - Air Canada video feed
- `gtaa/terminal1/camera/gate1/westjet/stream` - WestJet video feed
- `gtaa/terminal1/camera/gate1/lufthansa/stream` - Lufthansa video feed
- `gtaa/terminal1/camera/gate1/control` - Control topic for all commands
- `gtaa/terminal1/camera/gate1/control/notifications` - System notifications

**Topic Design Benefits:**
- **Hierarchical**: Clear organizational structure (airport → terminal → camera → airline)
- **Scalable**: Easy to add more terminals, cameras, or gates
- **Filterable**: Subscribers can use wildcards (e.g., `gtaa/terminal1/camera/+/aircanada/stream`)
- **Semantic**: Topic names are self-documenting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- ESP32 camera module with MJPEG streaming capability
- Solace PubSub+ broker (or use demo mode)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Set up Camera Streaming Server**
   ```bash
   cd camera-streaming-server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Set up Camera Web App**
   ```bash
   cd camera-web-app
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

4. **Access the application**
   - Open browser to `http://localhost:5173`
   - Login with airline credentials or admin account
   - View real-time camera feeds

### Demo Mode

To run without a Solace broker:

1. In `camera-web-app/.env`, set:
   ```env
   VITE_DEMO_MODE=true
   ```

2. Start the web app:
   ```bash
   npm run dev
   ```

The app will simulate video feeds and Solace connectivity for testing.

## Deployment

### Camera Streaming Server

Deploy to any Node.js hosting platform:
- Configure environment variables
- Ensure network access to ESP32 camera
- Ensure network access to Solace broker
- Run `npm start`

### Camera Web App

**GitHub Pages:**
- Configured for automatic deployment
- Push to `main` branch triggers build
- Available at `https://{username}.github.io/{repo-name}/`

**Other Platforms:**
```bash
npm run build
npm run preview
```

Deploy the `build` directory to your hosting platform.

## Performance Considerations

### Frame Rate Control

The streaming server supports multiple frame rate control methods:

1. **MAX_FPS**: Set desired frames per second
   ```env
   MAX_FPS=10  # Limit to 10 fps
   ```

2. **MIN_FRAME_INTERVAL_MS**: Set minimum milliseconds between frames
   ```env
   MIN_FRAME_INTERVAL_MS=100  # Max 10 fps
   ```

3. **Unlimited**: Set both to 0 for maximum throughput
   ```env
   MAX_FPS=0
   MIN_FRAME_INTERVAL_MS=0
   ```

### Binary Format Benefits

- **33% size reduction** compared to base64 encoding
- **Lower CPU usage** - no encoding/decoding overhead
- **Higher throughput** - more frames per second possible
- **Lower latency** - faster frame transmission

### Connection Management

- Automatic reconnection with configurable retry logic
- Graceful degradation when broker is unavailable
- Queue management to prevent memory overflow
- Frame dropping when publish queue backs up

## Monitoring and Debugging

### Streaming Server Logs

```
Stats: 1250 frames, Avg: 10.02 fps, Current: 10.01 fps, Queue: 0
Receiving 125.34 KB/s from ESP32
```

### Web App Console

- Solace connection events
- Frame reception statistics
- FPS counter in UI
- Connection status indicator

### Health Checks

```bash
# Check streaming server
curl http://localhost:3000/health

# Check stream status
curl http://localhost:3000/stream/status
```

## Troubleshooting

### No Video Feed

1. Check ESP32 camera is accessible
2. Verify Solace broker connection
3. Confirm topic names match between publisher and subscriber
4. Check browser console for errors
5. Enable demo mode to isolate issues

### Connection Issues

1. Verify Solace broker URL and credentials
2. Check firewall rules for WebSocket ports
3. Ensure VPN name is correct
4. Review Solace broker logs

### Performance Issues

1. Adjust MAX_FPS to reduce load
2. Check network bandwidth
3. Monitor CPU usage on streaming server
4. Review frame drop statistics

## Security Considerations

- Use WSS (secure WebSocket) in production
- Store credentials securely (not in committed .env files)
- Implement proper authentication for production
- Use Solace ACLs to restrict topic access
- Enable TLS for MQTT connections

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions:
- Check the troubleshooting section
- Review component-specific READMEs
- Open a GitHub issue
