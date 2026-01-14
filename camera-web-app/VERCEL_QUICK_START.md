# 🚀 Deploy to Vercel in 5 Minutes

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## Step 2: Import to Vercel

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Sign Up"** or **"Login"** (use GitHub)
3. Click **"Add New..."** → **"Project"**
4. Find your repository and click **"Import"**

## Step 3: Configure (Optional)

### For Demo Mode (No Solace Broker Required)

Add this environment variable:
- **Name:** `VITE_DEMO_MODE`
- **Value:** `true`

### For Production (With Solace Broker)

Add these environment variables:
- `VITE_SOLACE_URL` = `wss://your-broker.solace.cloud:443`
- `VITE_SOLACE_VPN` = `your-vpn-name`
- `VITE_SOLACE_USERNAME` = `your-username`
- `VITE_SOLACE_PASSWORD` = `your-password`
- `VITE_VIDEO_FEED_TOPIC` = `gtaa/camera/feed`
- `VITE_VIDEO_FEED_CONTROL_TOPIC` = `gtaa/camera/control`
- `VITE_DEMO_MODE` = `false`

## Step 4: Deploy

Click **"Deploy"** and wait ~1-2 minutes.

## Step 5: Access Your App

Your app will be live at:
```
https://your-project-name.vercel.app
```

## 🎉 Done!

### What Happens Next?

- **Automatic Deployments:** Every push to `main` deploys automatically
- **Preview Deployments:** Every pull request gets a unique preview URL
- **Custom Domain:** Add your own domain in Settings → Domains

### Useful Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from terminal
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

### Need Help?

See `VERCEL_DEPLOYMENT.md` for detailed documentation.

### Test Locally First

```bash
npm run build
npm run preview
```

Visit: http://localhost:4173
