# ozan.cloud - File Sharing Application Prompt

## Overview

A secure, password-protected file sharing application built with React and Cloudflare Pages. Users can upload files via drag-and-drop, receive shareable download links, and manage files through an admin panel. The app features short URL slugs for easy sharing and follows Apple's Human Interface Guidelines for design.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom Apple HIG design system
- **Icons**: react-icons (Material Design icons)
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Storage**: Cloudflare R2 (object storage)
- **Key-Value Store**: Cloudflare KV (for short URL slugs)
- **Authentication**: Custom X-Auth header-based password system
- **Deployment**: Cloudflare Pages

## Design System

The app follows **Apple's Human Interface Guidelines** with:

- **Color Palette**: iOS system colors
  - Primary: `#007AFF` (iOS blue)
  - System grays: `#F2F2F7`, `#E5E5EA`, `#D1D1D6`, `#C7C7CC`
  - Background: `#FFFFFF` (light mode)
  - Error: `#FF3B30`

- **Typography**: SF Pro system font stack
  - Large Title: 34px, weight 700, line-height 41px
  - Title: 28px, weight 700, line-height 34px
  - Headline: 22px, weight 600, line-height 28px
  - Body: 17px, weight 400, line-height 22px
  - Subhead: 15px, weight 400, line-height 20px
  - Caption: 13px, weight 400, line-height 18px

- **Spacing**: Generous whitespace (24px, 32px, 48px)
- **Border Radius**: 12px (xl), 16px (2xl), 20px
- **Shadows**: Subtle multi-layered shadows
- **Glassmorphism**: Backdrop blur effects where appropriate
- **Buttons**: `rounded-xl` (12px) with Apple-style colors

## Features

1. **Password-Protected Authentication**
   - Password input screen on app load
   - X-Auth header validation against `/api/list` endpoint
   - Password stored in memory (localStorage)

2. **File Upload**
   - Drag-and-drop interface
   - Multiple file support
   - Real-time upload progress tracking
   - XMLHttpRequest for progress monitoring
   - Error handling with toast notifications

3. **Short URL Generation**
   - 8-character random slug generation (if KV is configured)
   - Stores slug in R2 customMetadata
   - Landing page at `/s/[slug]` with file preview and download button
   - Direct download at `/d/[key]`

4. **Admin Panel**
   - File listing with search and filtering
   - Grid and list view modes
   - File deletion with confirmation
   - Copy short URL or direct URL
   - Statistics display (total files, size, short URLs)

5. **Toast Notifications**
   - Success and error messages
   - Auto-dismiss after 5 seconds
   - Fixed bottom-right positioning

## Architecture

### Frontend Structure

```
src/
├── App.tsx                 # Main app component with auth and routing
├── components/
│   ├── Dropzone.tsx       # File upload component with drag-and-drop
│   ├── FileRow.tsx        # Individual file display card
│   ├── AdminPanel.tsx     # Admin panel with file management
│   └── Toast.tsx          # Toast notification component
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── utils.ts           # Helper functions (formatBytes, etc.)
│   └── copy.ts            # Clipboard copy functionality
├── styles/
│   └── theme.css          # Apple HIG color system and variables
└── index.css              # Global styles and typography
```

### Backend Structure (Cloudflare Pages Functions)

```
functions/
├── api/
│   ├── upload.ts          # POST /api/upload - Handle file uploads
│   ├── delete.ts          # POST /api/delete - Delete files
│   ├── list.ts            # GET /api/list - List files (auth check)
│   ├── admin/
│   │   ├── files.ts       # GET /api/admin/files - List all files with metadata
│   │   └── kv.ts          # GET /api/admin/kv - List KV entries
│   └── share.ts           # GET /api/share - Generate share URLs
├── d/
│   └── _middleware.ts     # Handle /d/* routes for direct downloads
├── s/
│   └── [slug].ts          # Handle /s/[slug] routes for short URL landing pages
└── types.ts               # TypeScript types for Cloudflare Workers
```

## API Endpoints

### `/api/upload` (POST)
- **Auth**: Required (X-Auth header)
- **Body**: FormData with file
- **Response**: 
  ```json
  {
    "key": "2025-01-01/abc123...",
    "filename": "file.pdf",
    "size": 1024,
    "contentType": "application/pdf",
    "url": "/d/2025-01-01/abc123...",
    "shortUrl": "/s/abc12345",  // if KV configured
    "slug": "abc12345"           // if KV configured
  }
  ```

### `/api/list` (GET)
- **Auth**: Required (X-Auth header)
- **Purpose**: Authentication validation
- **Response**: Array of files or empty array

### `/api/admin/files` (GET)
- **Auth**: Required (X-Auth header)
- **Response**: 
  ```json
  {
    "items": [
      {
        "key": "...",
        "filename": "...",
        "size": 1024,
        "contentType": "...",
        "uploaded": "2025-01-01T00:00:00Z",
        "url": "/d/...",
        "shortUrl": "/s/abc12345",
        "slug": "abc12345"
      }
    ]
  }
  ```

### `/api/delete` (POST)
- **Auth**: Required (X-Auth header)
- **Body**: `{ "key": "file-key" }`
- **Response**: Success message

### `/d/[key]` (GET)
- **Purpose**: Direct file download
- **Middleware**: `functions/d/_middleware.ts`
- **Behavior**: Serves file from R2 with proper headers

### `/s/[slug]` (GET)
- **Purpose**: Short URL landing page
- **Handler**: `functions/s/[slug].ts`
- **Behavior**: 
  - Looks up slug in KV to get R2 key
  - Fetches file metadata from R2
  - Displays landing page with file info and download button
  - Uses Material Icons for file type visualization

## Key Components

### App.tsx
- Main application component
- Handles authentication state
- Manages view switching (upload/admin)
- Password validation on submit
- Toast notification management
- File upload state management

**Key Features:**
- Password validation via `/api/list` endpoint
- Two views: 'upload' and 'admin'
- Hero section with file upload area
- File list display after uploads

### Dropzone.tsx
- Drag-and-drop file upload component
- Glassmorphism effect with backdrop blur
- Apple-style design with subtle borders
- Real-time upload progress
- Compact variant for hero section

**Props:**
- `onFilesUploaded: (files: UploadedFile[]) => void`
- `onError: (message: string) => void`
- `variant?: 'default' | 'compact'`

**Features:**
- Drag-and-drop support
- Click to browse files
- Multiple file selection
- Upload progress tracking
- Error handling

### AdminPanel.tsx
- File management interface
- Search and filter functionality
- Grid and list view modes
- File deletion
- URL copying (short URL or direct URL)
- Statistics display

**Features:**
- Search by filename or slug
- Filter by short URLs only
- View mode toggle (grid/list)
- File deletion with confirmation
- Copy URL to clipboard
- Statistics cards

### FileRow.tsx
- Individual file display card
- Status indicators (uploading/success/error)
- File metadata display
- Action buttons (open/copy/delete)
- Progress bar for uploads

## Environment Variables

Required:
- `UPLOAD_PASSWORD` - Password for upload/delete operations

Optional:
- `MAX_SIZE_MB` - Maximum file size in MB (default: 200)
- `ALLOWED_MIME` - Comma-separated allowed MIME types
- `BLOCKED_MIME` - Comma-separated blocked MIME types
- `BASE_URL` - Base URL for share links (e.g., `https://ozan.cloud`)
- `TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key
- `TURNSTILE_SECRET` - Cloudflare Turnstile secret

## Cloudflare Bindings

Required:
- `BUCKET` - R2 bucket binding for file storage

Optional:
- `LINKS` - KV namespace binding for short URL slugs

## Short URL System

If KV is configured:
1. On upload, generates random 8-character slug
2. Stores mapping: `slug -> R2 key` in KV
3. Stores slug in R2 customMetadata
4. Returns short URL: `/s/[slug]`
5. Landing page at `/s/[slug]` shows file info and download button
6. Direct download still available at `/d/[key]`

## Styling Guidelines

### Colors
- Use `apple-primary` for primary actions
- Use `apple-gray-*` for backgrounds and borders
- Use `apple-label` for primary text
- Use `apple-label-secondary` for secondary text
- Use `apple-error` for error states

### Typography
- Use semantic classes: `text-large-title`, `text-title`, `text-headline`, `text-body`, `text-subhead`, `text-caption`
- Font stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif`

### Spacing
- Use generous spacing: `gap-6`, `gap-8`, `px-8 py-12`, etc.
- Cards: `rounded-2xl` with `shadow-apple-md`
- Buttons: `rounded-xl` with `px-6 py-3`

### Shadows
- `shadow-apple-sm` - Subtle shadows
- `shadow-apple-md` - Medium shadows
- `shadow-apple-lg` - Large shadows
- `shadow-apple-xl` - Extra large shadows

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint

# Format
pnpm format
```

## Deployment

- **Platform**: Cloudflare Pages
- **Build Command**: `pnpm install && pnpm build`
- **Output Directory**: `dist`
- **Framework**: None (custom Vite build)

## Key Implementation Details

1. **Authentication**: Password stored in localStorage, validated via API call
2. **File Upload**: Uses XMLHttpRequest for progress tracking
3. **Short URLs**: Generated only if KV namespace is configured
4. **Error Handling**: Toast notifications for user feedback
5. **File Management**: Admin panel for viewing, copying, and deleting files
6. **Design**: Follows Apple HIG with SF Pro typography and system colors
7. **Responsive**: Mobile-first design with Tailwind breakpoints
8. **Accessibility**: ARIA labels, keyboard navigation, focus states

## Usage Example

When implementing new features or modifying existing ones:

1. **Maintain Apple HIG design principles**
2. **Use semantic typography classes** from `index.css`
3. **Follow spacing guidelines** (24px, 32px, 48px)
4. **Use Apple color system** from `theme.css`
5. **Keep shadows subtle** and multi-layered
6. **Use glassmorphism** where appropriate (backdrop blur)
7. **Maintain responsive design** with mobile-first approach
8. **Follow existing component patterns** for consistency

## Notes for AI Assistants

- All components use TypeScript with strict typing
- React hooks for state management
- Tailwind CSS for styling with custom Apple design tokens
- Cloudflare Pages Functions for serverless backend
- R2 for object storage
- KV for short URL slug mapping
- Material Design icons from react-icons
- Authentication via X-Auth header
- Error handling with toast notifications
- File upload progress tracking
- Responsive design with mobile support

