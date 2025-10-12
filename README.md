# Token Generator MVP

A client-side web app for creating custom character tokens with decorative frames.

## Features

- Load token frames from asset library
- Upload portrait images (PNG/JPG/WebP) with brightness control
- Pan/zoom/rotate portraits within frames
- Mask application for circular/shaped viewports
- Solid color backgrounds with color picker
- Portrait status indicator (Active/No Portrait)
- In-app tutorial text with quick guide
- Export at multiple resolutions (1024/512/256px)
- Export formats: PNG and lossless WebP (styled prominent buttons)
- 100% client-side, no backend required

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Canvas**: Native Canvas 2D API
- **Build**: Static output for deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn

### Installation

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
token-generator/
├── public/
│   └── assets/
│       └── frames/
│           └── <category>/
│               └── <slug>/
│                   ├── frame_1024.png
│                   └── mask_1024.png
├── src/
│   ├── components/
│   │   ├── CanvasComposer.tsx  # Main canvas + interactions
│   │   ├── DropZone.tsx        # File upload
│   │   ├── FrameGrid.tsx       # Frame selector
│   │   ├── Sidebar.tsx         # Left panel
│   │   └── Toolbar.tsx         # Top controls
│   ├── lib/
│   │   ├── assetManifest.ts    # Frame library
│   │   └── canvas.ts           # Canvas utilities
│   ├── store/
│   │   └── useEditorStore.ts   # Zustand state
│   ├── types.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
└── package.json
```

## Adding Frame Assets

### Folder Structure Convention

Frame assets are organized hierarchically by category:

```
/public/assets/frames/
  classes/
    {class}/
      {subclass}/
        {id}_1024.png
        {id}_512.png
        {id}_256.png
        {id}_mask.png
  races/
    {family}/
      {race}/
        {id}_1024.png
        {id}_512.png
        {id}_256.png
        {id}_mask.png
  world/
    {location}/
      {id}_1024.png
      ...
  thematic/
    {theme}/
      {id}_1024.png
      ...
  seasonal/
    {event}/
      {id}_1024.png
      ...
```

**Examples:**
- Classes: `/classes/warlock/hexblade/warlock-hexblade_1024.png`
- Races: `/races/dragonkin/kobold/kobold_1024.png`
- World: `/world/underdark/underdark-cavern_1024.png`
- Thematic: `/thematic/elemental/fire-circle_1024.png`
- Seasonal: `/seasonal/halloween/pumpkin-border_1024.png`

### Adding a New Frame

1. Create the appropriate directory structure based on category
2. Add frame images: `{id}_1024.png`, `{id}_512.png`, `{id}_256.png`
3. Add mask image: `{id}_mask.png` (one for all sizes)
4. The asset manifest is **automatically generated** during build via `scripts/generateManifest.js`
5. No manual manifest editing required!

### Frame Requirements

- **{id}_1024.png**: Visual border, transparent center, 1024x1024px PNG
- **{id}_512.png**: Visual border, transparent center, 512x512px PNG
- **{id}_256.png**: Visual border, transparent center, 256x256px PNG
- **{id}_mask.png**: B&W mask (white=keep, black=cut), 1024x1024px PNG

### Frame Metadata Fields

When adding to `assetManifest.ts`:

```typescript
{
  id: "unique-frame-id",
  name: "Display Name",
  mainCategory: "classes" | "races" | "world" | "thematic" | "seasonal",
  subCategory: "class name" | "race name" | "location" | "theme" | "event",
  subSubCategory?: "subclass name (for classes only)",
  family?: "RaceFamily (for races only)",
  sizes: [1024, 512, 256],
  basePath: "/assets/frames/.../...",
  tags: ["searchable", "keywords", "for", "filtering"]
}
```

**Race Families:**
Humanoid, Beastfolk, Dragonkin, Fey, Undead, Fiendish, Celestial, Construct, Elemental, Giantkin, Plantfolk, Aberration, Ooze, Other

## Usage

1. Select a frame from the sidebar
2. Upload a portrait image
3. Drag to pan, scroll to zoom, use buttons to rotate
4. Export as PNG or WebP at desired size

## Deployment

### Manual Deployment to Vercel

1. **Build the project:**
   ```bash
   cd token-generator
   npm install
   npm run build
   ```

2. **Install Vercel CLI (if not already installed):**
   ```bash
   npm install -g vercel
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Connect Custom Domain:**
   - Go to Vercel dashboard → Project Settings → Domains
   - Add `syntheticoak.com` and follow DNS configuration instructions

### Automated Deployment (GitHub Actions)

The project includes a GitHub Actions workflow for automatic deployment on push.

**Setup Steps:**

1. **Create Vercel Project:**
   - Go to [vercel.com](https://vercel.com) and import your GitHub repository
   - Note the Project ID and Org ID from Project Settings

2. **Add GitHub Secrets:**
   - Go to GitHub repository → Settings → Secrets and Variables → Actions
   - Add these secrets:
     - `VERCEL_TOKEN`: Generate from Vercel account settings
     - `VERCEL_ORG_ID`: From Vercel project settings
     - `VERCEL_PROJECT_ID`: From Vercel project settings

3. **Automatic Deployment:**
   - Push to `main` or `master` branch → automatic build and deployment
   - Pull requests trigger preview deployments

### Adding New Assets to Deployed App

**Workflow:**

1. **Add Asset Files:**
   - Add new frame folders to `/public/assets/frames/{category}/...`
   - Ensure proper naming: `framename_1024.png`, `framename_512.png`, `framename_256.png`, `framename_mask.png`

2. **Commit and Push:**
   ```bash
   git add public/assets/frames
   git commit -m "Add new warlock subclass frames"
   git push origin main
   ```

3. **Automatic Build & Deploy:**
   - GitHub Actions automatically runs `generateManifest.js`
   - Builds the project with new assets
   - Deploys to Vercel
   - Live in 2-5 minutes

**Asset Rollout Strategy:**
- Batch assets by category (e.g., all Wizard subclasses, then Cleric, etc.)
- Maintain consistent folder structure and naming
- Track progress using a checklist or spreadsheet
- Test locally before pushing to production

### Alternative Hosting Options

Build creates static files in `dist/` - also compatible with:
- Cloudflare Pages
- Netlify
- GitHub Pages
- Any static host

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## MVP Acceptance Criteria

✓ Load frames from sidebar  
✓ Upload and transform portraits (pan/zoom/rotate)  
✓ Apply masks correctly (circular viewport)  
✓ Export PNG and WebP at 1024/512/256px  
✓ High-quality runtime scaling  
✓ Static build, no backend

## Category Filter System

The app includes a hierarchical filtering system:

- **Tabs**: Classes, Races, World, Thematic, Seasonal, All
- **Search**: Real-time search across all tags and names (cross-category)
- **Cascading Filters**:
  - **Classes**: Select class → then subclass
  - **Races**: Select family → then race
  - **World/Thematic/Seasonal**: Select subcategory

Tags allow cross-category search (e.g., searching "undead" shows frames from races, thematic, etc.)

## Recent Enhancements

✅ Portrait brightness control (0-200%)  
✅ Solid color background with color picker  
✅ Prominent styled export buttons (green PNG / blue WebP)  
✅ Portrait status indicator (green Active / red No Portrait)  
✅ In-app tutorial text for key features  
✅ Auto-generated asset manifest  
✅ Vercel deployment with GitHub Actions CI/CD

## Future Enhancements

- Lazy loading for large frame libraries
- Keyboard shortcuts (arrows, +/-, [/])
- Preset exports for VTT platforms
- Authentication and premium assets
- Layer blend modes and advanced effects


