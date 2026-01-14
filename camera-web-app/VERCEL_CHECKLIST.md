# Vercel Deployment Checklist

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] Build works locally: `npm run build`
- [ ] Preview works locally: `npm run preview`
- [ ] All features tested in demo mode

## Vercel Setup

- [ ] Created Vercel account (or logged in)
- [ ] Connected GitHub account to Vercel
- [ ] Imported project from GitHub

## Configuration

### Required
- [ ] Framework preset: SvelteKit (auto-detected)
- [ ] Build command: `npm run build` (auto-detected)
- [ ] Output directory: `.svelte-kit` (auto-detected)

### Optional - Demo Mode
- [ ] Added `VITE_DEMO_MODE=true` environment variable

### Optional - Production Mode
- [ ] Added `VITE_SOLACE_URL` environment variable
- [ ] Added `VITE_SOLACE_VPN` environment variable
- [ ] Added `VITE_SOLACE_USERNAME` environment variable
- [ ] Added `VITE_SOLACE_PASSWORD` environment variable
- [ ] Added `VITE_VIDEO_FEED_TOPIC` environment variable
- [ ] Added `VITE_VIDEO_FEED_CONTROL_TOPIC` environment variable
- [ ] Set `VITE_DEMO_MODE=false` environment variable

## Deployment

- [ ] Clicked "Deploy" button
- [ ] Waited for build to complete (~1-2 minutes)
- [ ] Deployment successful (green checkmark)
- [ ] Received deployment URL

## Post-Deployment Testing

- [ ] Visited deployment URL
- [ ] Login page loads correctly
- [ ] Can log in with test credentials
- [ ] User dashboard loads
- [ ] Admin dashboard loads (admin user)
- [ ] Video feeds display (or show INACTIVE in demo mode)
- [ ] "Make Camera Active" button works (admin only)
- [ ] Active camera badge shows correctly
- [ ] No console errors

## Optional Enhancements

- [ ] Added custom domain
- [ ] Configured DNS for custom domain
- [ ] Enabled Vercel Analytics
- [ ] Set up deployment notifications
- [ ] Configured branch deployments

## Cleanup (Optional)

- [ ] Removed `.github/workflows/deploy.yml` (GitHub Pages workflow)
- [ ] Removed `GITHUB_PAGES_SETUP.md`
- [ ] Removed old deployment documentation

## Automatic Deployments

- [ ] Verified: Push to `main` triggers production deployment
- [ ] Verified: Pull requests create preview deployments
- [ ] Tested: Rollback to previous deployment works

## Documentation

- [ ] Updated README with deployment URL
- [ ] Shared deployment URL with team
- [ ] Documented environment variables
- [ ] Added deployment notes to project docs

## Troubleshooting Checklist

If deployment fails:
- [ ] Check build logs in Vercel Dashboard
- [ ] Verify `npm run build` works locally
- [ ] Check all dependencies are in `package.json`
- [ ] Verify environment variables are set correctly
- [ ] Check for typos in variable names

If app doesn't work after deployment:
- [ ] Check browser console for errors
- [ ] Verify environment variables are set
- [ ] Check that variables start with `VITE_` prefix
- [ ] Redeploy after changing environment variables
- [ ] Check Vercel function logs

## Success Criteria

✅ App is live at Vercel URL
✅ All pages load without errors
✅ Authentication works
✅ Video feeds display correctly
✅ Admin controls work
✅ Automatic deployments configured

---

**Deployment URL:** `https://your-project-name.vercel.app`

**Status:** 🟢 Live | 🟡 In Progress | 🔴 Issues

**Last Updated:** [Date]
