# Vercel Deployment Guide

## Configuration

The app is configured to deploy to Vercel using SvelteKit's `adapter-auto`, which automatically detects the Vercel environment.

### Files Configured

- `vercel.json` - Minimal Vercel configuration
- `svelte.config.js` - Uses `@sveltejs/adapter-auto`

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. From the `camera-web-app` directory, run:
   ```bash
   vercel
   ```

3. Follow the prompts to link your project

4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Set the **Root Directory** to `camera-web-app`
5. Vercel will auto-detect SvelteKit
6. Configure environment variables (see below)
7. Click "Deploy"

## Environment Variables

Configure these in your Vercel project settings:

### Required Variables

```
VITE_SOLACE_URL=wss://your-solace-broker:443
VITE_SOLACE_VPN=your-vpn-name
VITE_SOLACE_USERNAME=your-username
VITE_SOLACE_PASSWORD=your-password
VITE_VIDEO_FEED_TOPIC=video/esp32
VITE_VIDEO_FEED_CONTROL_TOPIC=video/esp32/control
VITE_DEMO_MODE=false
```

### For Demo Mode (No Solace Broker)

```
VITE_DEMO_MODE=true
```

## Important Notes

1. **Root Directory**: Make sure to set the root directory to `camera-web-app` in Vercel project settings

2. **Framework Preset**: Vercel should auto-detect "SvelteKit"

3. **Build Command**: Should be automatically set to `npm run build`

4. **Output Directory**: Managed automatically by adapter-auto (no need to specify)

5. **Node Version**: The project is configured to use Node.js 20
   - `.node-version` file specifies Node 20
   - `package.json` engines field enforces Node 18-20
   - If you need to manually set it in Vercel, go to Project Settings → General → Node.js Version → 20.x

## Troubleshooting

### "No Output Directory named 'public' found"

This error occurs when:
- The root directory is not set correctly (should be `camera-web-app`)
- The `vercel.json` has incorrect `outputDirectory` setting
- The adapter is not properly configured

**Solution**: Ensure `vercel.json` only contains:
```json
{
  "framework": "sveltekit",
  "buildCommand": "node --version && npm run build"
}
```

### "Unsupported Node.js version"

If you see an error about Node.js v24 not being supported:

**Solution**: The project includes a `.node-version` file set to Node 20. If this doesn't work:
1. Go to Vercel Project Settings
2. Navigate to General → Node.js Version
3. Select "20.x" from the dropdown
4. Redeploy

### Build Fails

1. Check that all dependencies are in `package.json`
2. Verify environment variables are set
3. Check build logs for specific errors
4. Ensure Node version compatibility

### Environment Variables Not Working

- Make sure all variables start with `VITE_` prefix
- Redeploy after adding/changing environment variables
- Check that variables are set for the correct environment (Production/Preview)

## Vercel-Specific Features

### Preview Deployments

Every push to a branch creates a preview deployment with a unique URL.

### Production Deployments

Pushes to the `main` branch (or your configured production branch) trigger production deployments.

### Custom Domains

Add custom domains in Vercel project settings under "Domains".

## Performance Optimization

The app is optimized for Vercel with:
- Automatic code splitting
- Edge caching for static assets
- Serverless function support (if needed)
- Automatic HTTPS

## Monitoring

View deployment logs and analytics in the Vercel dashboard:
- Real-time logs during deployment
- Runtime logs for debugging
- Analytics for traffic and performance

## Rollback

If a deployment has issues:
1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find a previous working deployment
4. Click "Promote to Production"
