# GTAA Camera Feed System

A professional Svelte TypeScript web application for the Greater Toronto Airport Authority (GTAA) that displays camera feeds published over Solace PubSub+.

## Features

- **Secure Authentication**: Static user credentials for airlines and admin access
- **Real-time Video Feeds**: Camera feeds streamed via Solace PubSub+ with chunked frame delivery
- **Solace JavaScript API Integration**: Full implementation using Solace JavaScript API v10.18.2
- **Multi-user Support**: Separate dashboards for different airlines
- **Admin Dashboard**: Centralized monitoring of all camera feeds
- **Professional UI**: Clean, responsive design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Demo Mode**: Fallback simulation when Solace broker is unavailable

## User Credentials

### Airlines
- `aircanada` / `aircanada`
- `lufthansa` / `lufthansa` 
- `westjet` / `westjet`

### Admin
- `admin` / `admin`

## Routes

- `/` - Login page
- `/{username}` - Individual airline camera feed dashboard
- `/admin` - Admin dashboard with all camera feeds

## Solace Integration

The application implements the full Solace JavaScript API v10.18.2 with:

### Video Feed Protocol
- **Stream Topic**: `{VITE_VIDEO_FEED_TOPIC}/{username}/stream`
  - Binary format with header: `frameId|timestamp|frameSize|<JPEG data>`
- **Control Topic**: `{VITE_VIDEO_FEED_CONTROL_TOPIC}`
  - Control messages for camera operations

### Frame Processing
The client handles video frames in binary format:
1. Receives binary message on stream topic
2. Parses header (frameId, timestamp, frameSize)
3. Extracts JPEG binary data
4. Converts to base64 and displays the frame

### Connection Management
- Automatic reconnection with configurable retry logic
- Proper session lifecycle management
- Graceful error handling and fallback to demo mode

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Update `.env` with your Solace PubSub+ configuration:
```env
# Production Solace Configuration
VITE_SOLACE_URL=ws://your-solace-broker:8008
VITE_SOLACE_VPN=your-vpn-name
VITE_SOLACE_USERNAME=your-username
VITE_SOLACE_PASSWORD=your-password
VITE_VIDEO_FEED_TOPIC=gtaa/camera/feed
VITE_VIDEO_FEED_CONTROL_TOPIC=gtaa/camera/control
VITE_DEMO_MODE=false

# Development/Demo Mode (no Solace broker required)
VITE_DEMO_MODE=true
```

4. Start the development server:
```bash
npm run dev
```

## Demo Mode

Set `VITE_DEMO_MODE=true` to run the application without a Solace broker. This mode:
- Simulates Solace connection and messaging
- Generates animated demo video feeds
- Allows testing all UI functionality
- Perfect for development and demonstrations

## Production Deployment

### Vercel (Recommended)

This app is optimized for Vercel deployment with full SvelteKit support and environment variables.

**Quick Deploy:**

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New..." → "Project"
   - Import your repository
   - Click "Deploy"

3. **Configure Environment Variables (Optional):**
   - Go to Settings → Environment Variables
   - Add your Solace configuration or set `VITE_DEMO_MODE=true`

4. **Access your app:**
   - `https://your-project.vercel.app`

**Features:**
- ✅ Automatic deployments on push
- ✅ Preview deployments for pull requests
- ✅ Environment variables support
- ✅ Custom domains
- ✅ Global CDN
- ✅ One-click rollbacks

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

### Other Platforms

The app uses `@sveltejs/adapter-auto` which automatically detects and configures for:
- Vercel
- Netlify
- Cloudflare Pages
- AWS Amplify

For production use with a real Solace PubSub+ broker:
1. Set `VITE_DEMO_MODE=false`
2. Configure proper Solace connection details
3. Build and deploy:

```bash
npm run build
npm run preview
```

## Video Feed Integration

The application subscribes to video feeds on topics following the pattern:
- Stream: `{VITE_VIDEO_FEED_TOPIC}/{username}/stream`

Control messages are published to:
- `{VITE_VIDEO_FEED_CONTROL_TOPIC}`

The video feed implementation handles binary JPEG frames with a simple header format for real-time display.

## Technology Stack

- **Frontend**: Svelte + SvelteKit
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Messaging**: Solace PubSub+ JavaScript API v10.18.2
- **Build Tool**: Vite

## Architecture

- **Authentication**: Client-side validation with static credentials
- **State Management**: Svelte stores for user session
- **Video Streaming**: Real-time frame assembly from chunked Solace messages
- **Connection Management**: Robust Solace session handling with reconnection
- **Responsive Design**: Mobile-first approach with professional styling