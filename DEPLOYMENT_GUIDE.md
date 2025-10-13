# Deployment Guide for Token Generator

## Quick Start: Deploy to Vercel

### Option 1: Manual Deployment (Fastest to Get Started)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to project directory:**
   ```bash
   cd token-generator
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```
   - Follow the prompts to log in or create account
   - Choose project name
   - Accept default settings

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

5. **Access your deployed app:**
   - Vercel will provide you with a URL (e.g., `token-generator-xxx.vercel.app`)

### Option 2: Vercel Dashboard Import

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `token-generator`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click "Deploy"

### Connect Custom Domain (syntheticoak.com)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add domain: `syntheticoak.com`
4. Follow DNS configuration instructions:
   - Add A record or CNAME record as directed
   - DNS propagation takes 24-48 hours

## Automated Deployment with GitHub Actions

### Setup GitHub Actions (One-time Setup)

1. **Get Vercel credentials:**
   - Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Create a new token and save it

2. **Get Project IDs:**
   - Deploy your project once manually (using Option 1 or 2 above)
   - Run: `vercel inspect` in project directory
   - Note the `Project ID` and `Org ID`

3. **Add GitHub Secrets:**
   - Go to your GitHub repository
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Add three secrets:
     - `VERCEL_TOKEN`: Your Vercel token
     - `VERCEL_ORG_ID`: Your organization ID
     - `VERCEL_PROJECT_ID`: Your project ID

4. **Test automated deployment:**
   ```bash
   git add .
   git commit -m "Test automated deployment"
   git push origin main
   ```
   - Check the **Actions** tab in GitHub to watch the deployment

## Adding New Assets

### Workflow After Deployment

1. **Add new frame assets:**
   ```bash
   # Add your new frames to the appropriate category
   # Example: adding a new warlock subclass
   cp -r new_frames/* public/assets/frames/classes/warlock/
   ```

2. **Commit and push:**
   ```bash
   git add public/assets/frames
   git commit -m "Add fiend warlock frames"
   git push origin main
   ```

3. **Automatic deployment:**
   - If GitHub Actions is configured: Deployment happens automatically
   - If manual: Run `vercel --prod` to redeploy

4. **Verify:**
   - Wait 2-5 minutes for deployment
   - Visit your site and check the new frames appear in the sidebar

### Asset Naming Convention

Ensure all frames follow this structure:
```
public/assets/frames/
  classes/
    {class-name}/
      {subclass-name}/
        {id}_1024.png
        {id}_512.png
        {id}_256.png
        {id}_mask.png
```

The manifest generator will automatically detect and add them!

## Troubleshooting

### Build Fails on Vercel

- Check build logs in Vercel dashboard
- Ensure `scripts/generateManifest.js` runs successfully
- Verify all asset paths are correct

### Assets Not Appearing

- Clear browser cache
- Check that asset files are in `/public/assets/frames/`
- Verify naming convention matches: `{id}_1024.png`, etc.
- Check that manifest was regenerated (build logs)

### GitHub Actions Not Triggering

- Verify secrets are set correctly in GitHub
- Check workflow file is in `.github/workflows/deploy.yml`
- Ensure pushing to `main` or `master` branch

## WIX Integration Note

WIX doesn't natively host static apps like Vercel does. Options:

1. **Deploy to Vercel (Recommended):** Point `syntheticoak.com` to Vercel
2. **Embed via iframe:** Deploy to Vercel, embed in WIX site via iframe
3. **Use subdomain:** Use `app.syntheticoak.com` for the token generator

## Next Steps

1. Deploy to Vercel using Option 1 or 2
2. Test the deployed app
3. Set up GitHub Actions for automated deployment
4. Connect custom domain
5. Start adding your asset library in batches

Happy deploying! 🚀



