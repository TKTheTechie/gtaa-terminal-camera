# GitHub Pages Quick Setup

## 🚀 Quick Start (5 minutes)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment":
   - **Source**: Select **GitHub Actions** (not "Deploy from a branch")
5. Click **Save** if prompted

### Step 3: Wait for Deployment

1. Go to the **Actions** tab
2. You should see a workflow running called "Deploy to GitHub Pages"
3. Wait for it to complete (usually 2-3 minutes)
4. Once complete, your site is live! 🎉

### Step 4: Access Your Site

Your site will be available at:
```
https://YOUR-USERNAME.github.io/gtaa-camera-app/
```

Replace `YOUR-USERNAME` with your GitHub username.

## 📝 Important Notes

### Repository Name

If your repository is named something other than `gtaa-camera-app`, you need to update `svelte.config.js`:

```javascript
// Change this line:
base: process.env.NODE_ENV === 'production' ? '/gtaa-camera-app' : ''

// To match your repo name:
base: process.env.NODE_ENV === 'production' ? '/your-repo-name' : ''
```

Then commit and push the change.

### First Deployment

The first deployment might take a few extra minutes as GitHub sets up the Pages environment.

### Checking Deployment Status

- **Actions Tab**: Shows build and deployment progress
- **Green checkmark**: Deployment successful ✅
- **Red X**: Deployment failed ❌ (click to see error logs)

## 🔧 Troubleshooting

### "Deploy to GitHub Pages" workflow not running?

1. Make sure you pushed to the `main` branch
2. Check that `.github/workflows/deploy.yml` exists in your repo
3. Verify GitHub Actions are enabled in Settings → Actions

### Getting 404 errors?

1. Check that the base path in `svelte.config.js` matches your repo name
2. Wait a few minutes - DNS propagation can take time
3. Try clearing your browser cache

### Build failing?

1. Run `npm install` locally to ensure all dependencies are installed
2. Run `npm run build` locally to test the build
3. Check the Actions tab for specific error messages

## 🎯 Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages** (left sidebar)
3. Click **Run workflow** button (right side)
4. Click the green **Run workflow** button

## 📚 More Information

See `DEPLOYMENT.md` for detailed deployment documentation.
