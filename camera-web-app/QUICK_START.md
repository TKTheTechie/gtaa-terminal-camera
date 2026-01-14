# Quick Start Guide

## Current Status

The application is currently running in **DEMO MODE**. This means:
- ✅ All UI features work
- ✅ Simulated video feeds are displayed
- ❌ Not connected to a real Solace broker

## To Connect to Real Solace Broker

### Option 1: Quick Test (Edit .env)

1. Open `.env` file in the project root
2. Update these lines with your Solace broker details:
   ```env
   VITE_SOLACE_URL=ws://your-broker:8008
   VITE_SOLACE_VPN=your-vpn-name
   VITE_SOLACE_USERNAME=your-username
   VITE_SOLACE_PASSWORD=your-password
   VITE_DEMO_MODE=false
   ```
3. Save the file (server will auto-restart)
4. Refresh your browser

### Option 2: Keep Demo Mode

If you don't have a Solace broker yet, keep `VITE_DEMO_MODE=true` to:
- Test all UI functionality
- See simulated video feeds
- Develop and demo the application

## What You'll See

### In Demo Mode:
- Orange "Demo Mode Active" indicator
- Animated simulated video feeds
- All features work without Solace

### Connected to Solace:
- Green "Connected to Solace PubSub+" indicator
- Real video feeds from your camera system
- Request-reply for camera status
- Live control messages

## Troubleshooting

**Can't connect to Solace?**
1. Check the connection status panel on the user page
2. Open browser console (F12) for detailed logs
3. Verify broker URL, VPN, and credentials
4. See `CONFIGURATION.md` for detailed troubleshooting

**Want to test without Solace?**
- Set `VITE_DEMO_MODE=true` in `.env`
- Restart the dev server
- Everything works with simulated data

## Next Steps

1. **Test Demo Mode**: Login with any credentials (aircanada/aircanada, etc.)
2. **Configure Solace**: Update `.env` with your broker details
3. **Deploy**: Build for production with `npm run build`

For detailed configuration instructions, see `CONFIGURATION.md`.