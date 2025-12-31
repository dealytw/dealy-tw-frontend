# Logo Usage & Resolution Guide

## Current Logo Files

### HK Frontend (`dealy-hk-frontend`)
- **File**: `/public/dealyhklogo.svg`
- **Used in**: Header, Navigation Menu, Blog posts, OpenGraph, Structured Data

### TW Frontend (`dealy-tw-frontend`)
- **File**: `/public/dealytwlogo.svg`
- **Used in**: Header, Navigation Menu, Blog posts, OpenGraph, Structured Data

---

## Logo Usage Locations

### 1. **Header Component** (Desktop & Mobile)
**Files:**
- `dealy-hk-frontend/src/components/Header.tsx`
- `dealy-tw-frontend/src/components/Header.tsx`

**Usage:**
- Desktop: Line 21-28 (width={120}, height={32}, className="h-8")
- Mobile: Line 73 (same dimensions)

**Current Display Size:**
- Width: 120px (desktop), 120px (mobile)
- Height: 32px (rendered as h-8 = 32px)
- **Recommended Source Resolution**: **240x64px** (2x for retina) or **SVG** (scalable)

---

### 2. **Navigation Menu** (Mobile Drawer)
**Files:**
- `dealy-hk-frontend/src/components/NavigationMenu.tsx`
- `dealy-tw-frontend/src/components/NavigationMenu.tsx`

**Usage:**
- Line 68-75 (width={120}, height={32}, className="h-8")

**Current Display Size:**
- Width: 120px
- Height: 32px
- **Recommended Source Resolution**: **240x64px** (2x for retina) or **SVG** (scalable)

---

### 3. **Blog Posts** (Author Avatar)
**Files:**
- `dealy-hk-frontend/app/blog/[page_slug]/blog-view.tsx`
- `dealy-tw-frontend/app/blog/[page_slug]/blog-view.tsx`

**Usage:**
- Line 765: `<AvatarImage src="/dealytwlogo.svg" alt="Dealy Team" />`
- Used in Avatar component (typically 40-48px)

**Current Display Size:**
- Avatar size: ~40-48px (circular)
- **Recommended Source Resolution**: **96x96px** (2x for retina) or **SVG** (scalable)

---

### 4. **OpenGraph Images** (Social Media Sharing)
**Files:**
- `dealy-hk-frontend/app/layout.tsx` (Line 38, 44)
- `dealy-tw-frontend/app/layout.tsx` (Line 38, 44)
- `dealy-hk-frontend/app/page.tsx` (Line 22)
- `dealy-tw-frontend/app/page.tsx` (Line 22)
- `dealy-hk-frontend/app/blog/page.tsx` (Line 13)
- `dealy-tw-frontend/app/blog/page.tsx` (Line 13)
- `dealy-hk-frontend/app/shop/[id]/page.tsx` (Line 603)
- `dealy-tw-frontend/app/shop/[id]/page.tsx` (Line 603)
- `dealy-hk-frontend/app/category/[categorySlug]/page.tsx` (Line 22)
- `dealy-tw-frontend/app/category/[categorySlug]/page.tsx` (Line 22)
- `dealy-hk-frontend/app/[slug]/page.tsx` (Line 53)
- `dealy-tw-frontend/app/[slug]/page.tsx` (Line 53)

**Usage:**
- OpenGraph images for Facebook, Twitter, LinkedIn sharing
- Currently using SVG (which may not render well on all platforms)

**Recommended:**
- **PNG format**: **1200x630px** (Facebook/Twitter standard)
- **Minimum**: 600x315px
- **Aspect Ratio**: 1.91:1 (width:height)

---

### 5. **Structured Data (JSON-LD)**
**Files:**
- `dealy-hk-frontend/app/layout.tsx` (Line 272, 286)
- `dealy-tw-frontend/app/layout.tsx` (Line 258, 272)

**Usage:**
- Organization schema logo
- WebSite schema image

**Recommended:**
- **PNG format**: **600x600px** (square, for Organization schema)
- **Minimum**: 112x112px (Google requirement)
- **Maximum**: 600x600px (Google recommendation)

---

## Recommended Logo File Specifications

### **Primary Logo (Header/Navigation)**
**Format**: SVG (preferred) or PNG
**Resolution**: 
- **SVG**: Vector (scalable, best quality)
- **PNG**: 240x64px (2x for retina displays)
- **Aspect Ratio**: ~3.75:1 (width:height)

**Why SVG?**
- ✅ Scalable to any size without quality loss
- ✅ Smaller file size
- ✅ Works on all displays (1x, 2x, 3x)
- ✅ Current implementation already uses SVG

---

### **OpenGraph Image (Social Media)**
**Format**: PNG or JPG
**Resolution**: **1200x630px**
**Aspect Ratio**: 1.91:1
**File Size**: < 1MB (optimized)

**Why separate file?**
- Social media platforms prefer raster images (PNG/JPG)
- SVG may not render correctly on all platforms
- Better control over appearance in social feeds

**Recommended File Names:**
- `dealy-hk-frontend/public/og-image.png`
- `dealy-tw-frontend/public/og-image.png`

---

### **Structured Data Logo (Organization Schema)**
**Format**: PNG
**Resolution**: **600x600px** (square)
**File Size**: < 200KB (optimized)

**Why square?**
- Google's Organization schema recommends square logos
- Better for Knowledge Graph display
- Works in various contexts

**Recommended File Names:**
- `dealy-hk-frontend/public/logo-square.png`
- `dealy-tw-frontend/public/logo-square.png`

---

### **Blog Avatar Logo**
**Format**: SVG or PNG
**Resolution**: 
- **SVG**: Vector (preferred)
- **PNG**: 96x96px (2x for retina)
**Shape**: Square (will be cropped to circle in Avatar component)

---

## Summary: Recommended Files

### For HK Frontend (`dealy-hk-frontend/public/`)
1. **`dealyhklogo.svg`** ✅ (Keep - already exists)
   - Primary logo for header/navigation
   - Current: SVG (perfect!)
   - **Action**: Update with new design if needed

2. **`og-image.png`** ⚠️ (Create new)
   - OpenGraph image for social sharing
   - **Resolution**: 1200x630px
   - **Format**: PNG
   - **Purpose**: Facebook, Twitter, LinkedIn previews

3. **`logo-square.png`** ⚠️ (Create new)
   - Structured data (Organization schema)
   - **Resolution**: 600x600px
   - **Format**: PNG
   - **Purpose**: Google Knowledge Graph, structured data

### For TW Frontend (`dealy-tw-frontend/public/`)
1. **`dealytwlogo.svg`** ✅ (Keep - already exists)
   - Primary logo for header/navigation
   - Current: SVG (perfect!)
   - **Action**: Update with new design if needed

2. **`og-image.png`** ⚠️ (Create new)
   - OpenGraph image for social sharing
   - **Resolution**: 1200x630px
   - **Format**: PNG
   - **Purpose**: Facebook, Twitter, LinkedIn previews

3. **`logo-square.png`** ⚠️ (Create new)
   - Structured data (Organization schema)
   - **Resolution**: 600x600px
   - **Format**: PNG
   - **Purpose**: Google Knowledge Graph, structured data

---

## Design Guidelines

### **Header Logo (SVG)**
- **Aspect Ratio**: ~3.75:1 (e.g., 240x64px)
- **Colors**: Should work on white background
- **Text**: Should be readable at 32px height
- **Style**: Horizontal layout (text + icon side-by-side)

### **OpenGraph Image (PNG)**
- **Aspect Ratio**: 1.91:1 (1200x630px)
- **Colors**: Vibrant, eye-catching
- **Text**: Large, readable (logo + tagline)
- **Style**: Marketing/branding focused
- **Background**: Can be colored/gradient (not just white)

### **Square Logo (PNG)**
- **Aspect Ratio**: 1:1 (600x600px)
- **Colors**: Should work on white/transparent background
- **Style**: Icon or logo mark (centered)
- **Padding**: Leave ~20% padding around edges

---

## Next Steps

1. **Design new logos** in the recommended resolutions
2. **Replace existing SVG files** (`dealyhklogo.svg`, `dealytwlogo.svg`)
3. **Create new PNG files** for OpenGraph and structured data
4. **Update code** to use new OpenGraph images (if creating separate files)
5. **Test** on all platforms (Facebook, Twitter, Google Search)

---

## File Size Recommendations

- **SVG**: < 50KB (optimized)
- **OpenGraph PNG**: < 1MB (optimized, compressed)
- **Square Logo PNG**: < 200KB (optimized, compressed)

**Tools for Optimization:**
- SVG: SVGO, SVGOMG
- PNG: TinyPNG, ImageOptim, Squoosh

