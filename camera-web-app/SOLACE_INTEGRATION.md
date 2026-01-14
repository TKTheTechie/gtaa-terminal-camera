# Solace PubSub+ Integration Guide

## Overview

This application uses the Solace JavaScript API v10.18.2 to handle real-time video streaming over Solace PubSub+.

## Implementation Details

### SolaceVideoClient Class

Located in `src/lib/solace.ts`, this class handles all Solace interactions:

#### Connection
```typescript
const client = new SolaceVideoClient(config);
await client.connect();
```

The client:
- Initializes the Solace factory with version 10 profile
- Creates a session with connection properties (URL, VPN, credentials)
- Handles session events (UP_NOTICE, CONNECT_FAILED_ERROR, DISCONNECTED)
- Implements automatic reconnection logic

#### Subscription
```typescript
client.subscribe(topic, (imageData: string) => {
  // Handle received frame
});
```

Subscribes to the video stream topic: `{topic}/stream`

#### Message Handling

**Video Stream Message (Binary Format):**

The stream uses a binary format with a header followed by JPEG data:
```
frameId|timestamp|frameSize|<binary JPEG data>
```

Example header: `1234567890|2026-01-13T22:00:00.000Z|50000|`

**Inactive Message (JSON Format):**
```json
{
  "type": "inactive"
}
```

#### Frame Processing

1. Receive binary message on `{topic}/stream`
2. Parse header (frameId, timestamp, frameSize)
3. Extract JPEG binary data after the third pipe character
4. Convert binary string to base64
5. Create data URL and display image

#### Publishing Control Messages
```typescript
client.publishControl(controlTopic, {
  topic: username,
  timestamp: new Date().toISOString(),
  action: 'control_signal'
});
```

#### Cleanup
```typescript
client.unsubscribe(topic);
client.disconnect();
```

## Configuration

### Environment Variables

```env
# Solace Broker Connection
VITE_SOLACE_URL=ws://your-broker:8008
VITE_SOLACE_VPN=your-vpn-name
VITE_SOLACE_USERNAME=your-username
VITE_SOLACE_PASSWORD=your-password

# Topic Configuration
VITE_VIDEO_FEED_TOPIC=gtaa/camera/feed
VITE_VIDEO_FEED_CONTROL_TOPIC=gtaa/camera/control

# Demo Mode
VITE_DEMO_MODE=false
```

### Session Properties

The client configures:
- `connectRetries: 3` - Initial connection attempts
- `reconnectRetries: 3` - Reconnection attempts after disconnect
- `reconnectRetryWaitInMsecs: 3000` - Wait time between retries

## Demo Mode

When `VITE_DEMO_MODE=true`:
- Simulates Solace connection without requiring a broker
- Generates animated video feeds for testing
- All publish/subscribe operations are logged but not sent
- Perfect for development and UI testing

## Error Handling

The implementation handles:
- Connection failures with user-friendly error messages
- Missing or incomplete frame data
- Session disconnections with reconnection capability
- Subscription errors with detailed logging

## Topic Structure

### Video Feeds
```
gtaa/camera/feed/{username}/stream  → Video stream (binary format)
```

### Control Messages
```
gtaa/camera/control  → Camera control signals
```

## Performance Considerations

- Binary format reduces message overhead compared to chunked approach
- Direct base64 conversion for efficient image rendering
- FPS counter tracks rendering performance
- Connection status is displayed in real-time

## Testing

1. **With Solace Broker**: Set `VITE_DEMO_MODE=false` and configure connection
2. **Without Broker**: Set `VITE_DEMO_MODE=true` for simulated feeds
3. **Check Console**: All Solace events are logged for debugging

## Troubleshooting

### Connection Issues
- Verify Solace broker URL and port
- Check VPN name and credentials
- Ensure WebSocket port (8008) is accessible
- Review browser console for Solace API errors

### No Video Feed
- Confirm topics match publisher configuration
- Check that frames are being published
- Verify frame format matches expected binary structure
- Enable demo mode to test UI independently

### Performance Issues
- Monitor FPS counter in UI
- Check browser console for frame processing errors
- Verify binary format is correct (header with three pipes)
- Consider adjusting reconnection parameters