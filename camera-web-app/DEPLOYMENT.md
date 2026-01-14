# Deployment Guide

## GitHub Pages Deployment

This application is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Prerequisites

1. A GitHub repository for this project
2. GitHub Pages enabled in repository settings

### Setup Steps

#### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**

#### 2. Configure Repository Name

If your repository name is different from `gtaa-camera-app`, update the base path in `svelte.config.js`:

```javascript
paths: {
  base: process.env.NODE_ENV === 'production' ? '/your-repo-name' : ''
}
```

#### 3. Install Dependencies

Before deploying, make sure to install the static adapter:

```bash
npm install
```

#### 4. Deploy

**Automatic Deployment:**
- Push your code to the `main` branch
- GitHub Actions will automatically build and deploy
- Check the "Actions" tab to monitor deployment progress

**Manual Deployment:**
1. Go to the **Actions** tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click **Run workflow** → **Run workflow**

#### 5. Access Your Site

Once deployed, your site will be available at:
```
https://your-username.github.io/your-repo-name/
```

### Workflow Details

The deployment workflow (`.github/workflows/deploy.yml`) performs these steps:

1. **Build Job:**
   - Checks out the code
   - Sets up Node.js 20
   - Installs dependencies with `npm ci`
   - Builds the static site with `npm run build`
   - Uploads the build artifact

2. **Deploy Job:**
   - Deploys the artifact to GitHub Pages
   - Requires the build job to complete successfully

### Configuration Files

- **`.github/workflows/deploy.yml`**: GitHub Actions workflow
- **`svelte.config.js`**: SvelteKit adapter configuration
- **`static/.nojekyll`**: Prevents Jekyll processing
- **`src/routes/+layout.ts`**: Enables prerendering

### Troubleshooting

**Build Fails:**
- Check the Actions tab for error logs
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally

**404 Errors:**
- Verify the base path in `svelte.config.js` matches your repo name
- Check that GitHub Pages is enabled and set to "GitHub Actions"
- Ensure `.nojekyll` file exists in the `static` folder

**Assets Not Loading:**
- Confirm the base path is correctly configured
- Check browser console for 404 errors
- Verify asset paths are relative, not absolute

**Environment Variables:**
- GitHub Pages deployments use the values from `svelte.config.js` and defaults in your code
- For production Solace configuration, you may need to hardcode values or use a different deployment method

### Local Testing

Test the production build locally before deploying:

```bash
# Build the site
npm run build

# Preview the build
npm run preview
```

### Alternative Deployment

If you need environment variables or server-side features, consider these alternatives:

- **Vercel**: Automatic deployments with environment variables
- **Netlify**: Similar to Vercel with form handling
- **Cloudflare Pages**: Fast global CDN with Workers support
- **AWS Amplify**: Full AWS integration

For these platforms, you can use `@sveltejs/adapter-auto` which will automatically detect the platform.

## Environment Configuration

For production deployments with real Solace connections:

1. Set `VITE_DEMO_MODE=false` in your environment
2. Configure Solace connection details:
   ```env
   VITE_SOLACE_URL=wss://your-broker.solace.cloud:443
   VITE_SOLACE_VPN=your-vpn
   VITE_SOLACE_USERNAME=your-username
   VITE_SOLACE_PASSWORD=your-password
   ```

Note: GitHub Pages doesn't support environment variables at build time. You'll need to either:
- Hardcode production values in the code
- Use a different deployment platform that supports build-time environment variables
- Load configuration from a separate config file at runtime
