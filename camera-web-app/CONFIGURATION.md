# Configuration Guide

## Connecting to Solace PubSub+

The application currently runs in **Demo Mode** by default. To connect to a real Solace PubSub+ broker, follow these steps:

### Step 1: Get Your Solace Broker Details

You'll need the following information from your Solace PubSub+ broker:

- **Broker URL**: WebSocket URL (e.g., `ws://your-broker.solace.cloud:8008`)
- **Message VPN Name**: The VPN you want to connect to
- **Username**: Your Solace client username
- **Password**: Your Solace client password

### Step 2: Update Environment Variables

Edit your `.env` file in the project root:

```env
# Solace PubSub+ Configuration
VITE_SOLACE_URL=ws://your-solace-broker-host:8008
VITE_SOLACE_VPN=your-message-vpn-name
VITE_SOLACE_USERNAME=your-solace-username
VITE_SOLACE_PASSWORD=your-solace-password

# Video Feed Topics
VITE_VIDEO_FEED_TOPIC=gtaa/camera/feed
VITE_VIDEO_FEED_CONTROL_TOPIC=gtaa/camera/control
VITE_REQUEST_TOPIC=gtaa/camera/request

# IMPORTANT: Set to false to connect to real Solace broker
VITE_DEMO_MODE=false
```

### Step 3: Restart the Development Server

After updating the `.env` file, restart the development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

The application will now attempt to connect to your Solace broker.

## Demo Mode

Demo mode is useful for:
- Testing the UI without a Solace broker
- Development and demonstrations
- Verifying the application works before configuring Solace

When `VITE_DEMO_MODE=true`:
- No real Solace connection is made
- Simulated video feeds are generated
- All Solace operations are logged to console
- Status requests return mock data

## Troubleshooting Connection Issues

### 1. Check Broker Accessibility

Ensure your Solace broker is accessible from your machine:

```bash
# Test WebSocket connection (if you have wscat installed)
wscat -c ws://your-broker:8008

# Or use curl to check if the port is open
curl -v telnet://your-broker:8008
```

### 2. Verify Credentials

- Ensure your username and password are correct
- Check that the user has permissions on the Message VPN
- Verify the Message VPN name is spelled correctly

### 3. Check Browser Console

Open your browser's developer console (F12) and look for:
- Solace connection logs
- Error messages
- WebSocket connection attempts

### 4. Firewall and Network

- Ensure port 8008 (or your broker's WebSocket port) is not blocked
- Check if you need to use WSS (secure WebSocket) instead of WS
- Verify no proxy is interfering with WebSocket connections

### 5. Solace Broker Configuration

Ensure your Solace broker has:
- WebSocket service enabled
- Client connections allowed
- Proper ACL permissions for your topics

## Connection Status Indicator

The application shows a connection status panel that displays:
- Whether you're in Demo Mode or connected to real Solace
- Connection errors if any
- Broker URL, VPN, and username being used

This helps diagnose connection issues quickly.

## Common Error Messages

### "Solace JavaScript API not loaded"
- The Solace library failed to load from CDN
- Check your internet connection
- Verify the CDN URL in `src/app.html` is accessible

### "Connection failed: [error details]"
- Check your broker URL, VPN name, and credentials
- Verify the broker is running and accessible
- Check firewall and network settings

### "Request timeout"
- The status request didn't receive a response within 10 seconds
- Verify the request topic is correct
- Ensure a service is listening on the request topic
- Check that reply topics are properly configured

## Production Deployment

For production:

1. Use environment-specific configuration files
2. Store credentials securely (not in `.env` files committed to git)
3. Use WSS (secure WebSocket) for production brokers
4. Set `VITE_DEMO_MODE=false`
5. Configure proper topic names for your environment

Example production configuration:

```env
VITE_SOLACE_URL=wss://production-broker.solace.cloud:443
VITE_SOLACE_VPN=production-vpn
VITE_SOLACE_USERNAME=${SOLACE_USERNAME}
VITE_SOLACE_PASSWORD=${SOLACE_PASSWORD}
VITE_VIDEO_FEED_TOPIC=gtaa/camera/feed
VITE_VIDEO_FEED_CONTROL_TOPIC=gtaa/camera/control
VITE_REQUEST_TOPIC=gtaa/camera/request
VITE_DEMO_MODE=false
```