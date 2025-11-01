# oksend

A minimal, fast, and secure personal file-sharing site with drag-and-drop uploads, deployed on **Cloudflare Pages** with **Pages Functions** and **R2** storage.

## Features

- 🎯 **Drag-and-drop uploads** - Simple, intuitive file upload interface
- 🔒 **Password protection** - Secure upload/delete operations with X-Auth header
- 📊 **Progress tracking** - Real-time upload progress for each file
- 🔗 **Shareable links** - Direct download links for all uploaded files
- 🛡️ **Size & type limits** - Configurable file size and MIME type restrictions
- 🤖 **Bot protection** - Optional Cloudflare Turnstile integration
- ⚡ **Fast & global** - Powered by Cloudflare's edge network

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Cloudflare Pages Functions (TypeScript)
- **Storage**: Cloudflare R2 bucket
- **Optional**: Cloudflare KV for slug-based links, Turnstile for bot protection

## Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account with:
  - Pages enabled
  - R2 bucket created
  - (Optional) KV namespace for slug links
  - (Optional) Turnstile site keys

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy `.dev.vars.example` to `.dev.vars` and fill in your values:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```env
# Required
UPLOAD_PASSWORD=your-secure-password-here

# Optional
MAX_SIZE_MB=200
ALLOWED_MIME=image/jpeg,image/png,application/pdf
BLOCKED_MIME=application/x-executable
BASE_URL=http://localhost:8788
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET=
```

### 3. Configure Wrangler

Edit `wrangler.toml` and set your R2 bucket name:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "your-bucket-name"
```

If using KV for slug links, uncomment and configure:

```toml
[[kv_namespaces]]
binding = "LINKS"
id = "your-kv-namespace-id"
```

### 4. Run Development Servers

You need to run two servers simultaneously:

**Terminal 1** - Frontend (Vite):
```bash
pnpm dev
```

**Terminal 2** - Backend (Wrangler Pages):
```bash
pnpm wrangler pages dev dist --compatibility-date=2024-10-01
```

Or install wrangler globally and run:
```bash
wrangler pages dev dist
```

The frontend will be available at `http://localhost:5173` and the backend will proxy API requests.

## Building for Production

```bash
pnpm build
```

This generates the production build in the `dist/` directory.

## Deployment to Cloudflare Pages

### 1. Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Create a new bucket (e.g., `oksend-bucket`)
3. Note the bucket name

### 2. Create KV Namespace (Optional, for slug links)

1. Go to Workers & Pages → KV
2. Create a new namespace (e.g., `oksend-links`)
3. Note the namespace ID

### 3. Connect GitHub Repository

1. Go to Workers & Pages → Pages → Create a project
2. Connect your GitHub repository
3. Select the repository and branch

### 4. Configure Build Settings

- **Framework preset**: None
- **Build command**: `pnpm install && pnpm build`
- **Build output directory**: `dist`

### 5. Configure Environment Variables

**Finding Environment Variables in Cloudflare Pages:**

1. Go to https://dash.cloudflare.com and log in
2. Navigate to **Workers & Pages** → **Pages** in the left sidebar
3. Click on your project name (**"oksend"**)
4. Click the **"Settings"** tab at the top
5. Look for **"Environment variables"** in the left sidebar (under Settings) OR scroll down in the Settings page
6. If you still can't see it, make sure you have Admin/Owner permissions on the project

**Alternative - Using Wrangler CLI:**

If you can't access the UI option, use the command line:

```bash
# First, login to Cloudflare (if not already logged in)
npx wrangler login

# Set the secret (will prompt you to enter the password value)
npx wrangler pages secret put UPLOAD_PASSWORD --project-name=oksend
```

**Setting Variables:**

In Pages → Settings → Environment variables (or via CLI above), add:

**Production:**
- `UPLOAD_PASSWORD` (required) - Password for upload/delete operations
- `MAX_SIZE_MB` (optional, default: 200) - Maximum file size in MB
- `ALLOWED_MIME` (optional) - Comma-separated allowed MIME types
- `BLOCKED_MIME` (optional) - Comma-separated blocked MIME types
- `BASE_URL` (optional) - Base URL for share links (e.g., `https://files.example.com`)
- `TURNSTILE_SITE_KEY` (optional) - Cloudflare Turnstile site key
- `TURNSTILE_SECRET` (optional) - Cloudflare Turnstile secret key

### 6. Configure Function Bindings

In Pages → Settings → Functions:

**R2 Bucket Binding:**
- Variable name: `BUCKET`
- Bucket: Select your R2 bucket

**KV Namespace Binding (Required for Short URLs):**
- Variable name: `LINKS`
- KV namespace: Select your KV namespace

**To create a KV namespace:**
1. Go to Cloudflare Dashboard → Workers & Pages → KV
2. Click "Create a namespace"
3. Name it (e.g., "oksend-links")
4. Copy the namespace ID
5. Go back to Pages → Settings → Functions
6. Add KV binding with variable name `LINKS` and select your namespace

**Note:** Short URLs will be automatically generated when KV is configured. Without KV, files will use the full `/d/date/uuid/filename` URLs.

### 7. Deploy

After configuration, each push to your connected branch will automatically trigger a deployment.

## Cloudflare Turnstile Setup (Optional)

Turnstile adds bot protection to uploads:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Turnstile
2. Create a new site
3. Copy the **Site Key** and **Secret Key**
4. Add them as environment variables:
   - `TURNSTILE_SITE_KEY` = Your site key
   - `TURNSTILE_SECRET` = Your secret key
5. Update the frontend to render the Turnstile widget (TODO: add widget to upload form)

## Environment Variables Reference

### Required

- `UPLOAD_PASSWORD` - Password required for upload, delete, and list operations. Sent via `X-Auth` header.

### Optional

- `MAX_SIZE_MB` - Maximum file size in megabytes (default: `200`)
- `ALLOWED_MIME` - Comma-separated list of allowed MIME types (e.g., `image/jpeg,image/png`)
- `BLOCKED_MIME` - Comma-separated list of blocked MIME types (e.g., `application/x-executable`)
- `BASE_URL` - Base URL for generating share links (e.g., `https://files.example.com`). If not set, relative URLs are used.
- `TURNSTILE_SITE_KEY` - Cloudflare Turnstile site key for bot protection
- `TURNSTILE_SECRET` - Cloudflare Turnstile secret key

## API Endpoints

### `POST /api/upload`

Upload a file to R2.

**Headers:**
- `X-Auth: <UPLOAD_PASSWORD>` (required)

**Body:**
- `multipart/form-data` with `file` field

**Response:**
```json
{
  "key": "2024-01-01/uuid/filename.ext",
  "filename": "filename.ext",
  "size": 1024,
  "contentType": "image/jpeg",
  "url": "/d/2024-01-01/uuid/filename.ext"
}
```

### `GET /api/list`

List recently uploaded files (requires authentication).

**Headers:**
- `X-Auth: <UPLOAD_PASSWORD>` (required)

**Query Parameters:**
- `limit` (optional, default: 100) - Maximum number of files to return

**Response:**
```json
{
  "items": [
    {
      "key": "2024-01-01/uuid/filename.ext",
      "size": 1024,
      "contentType": "image/jpeg",
      "lastModified": "2024-01-01T12:00:00.000Z",
      "url": "/d/2024-01-01/uuid/filename.ext",
      "originalFilename": "filename.ext"
    }
  ]
}
```

### `POST /api/delete`

Delete a file by key (requires authentication).

**Headers:**
- `X-Auth: <UPLOAD_PASSWORD>` (required)

**Body:**
```json
{
  "key": "2024-01-01/uuid/filename.ext"
}
```

**Response:**
```json
{
  "ok": true
}
```

### `GET /d/:key`

Download a file by key.

**Query Parameters:**
- `download=1` - Force download (sets `Content-Disposition: attachment`)

**Response:**
- Streams the file with appropriate `Content-Type` header

### `POST /api/share` (Optional, requires KV)

Create a short slug link for a file.

**Headers:**
- `X-Auth: <UPLOAD_PASSWORD>` (required)

**Body:**
```json
{
  "key": "2024-01-01/uuid/filename.ext",
  "ttl": 86400
}
```

**Response:**
```json
{
  "slug": "abc12345",
  "key": "2024-01-01/uuid/filename.ext",
  "url": "/s/abc12345",
  "expiresIn": 86400
}
```

### `GET /s/:slug` (Optional, requires KV)

Redirect to download URL via short slug.

**Response:**
- 302 redirect to `/d/:key`

## Project Structure

```
.
├── functions/          # Cloudflare Pages Functions
│   ├── api/
│   │   ├── upload.ts   # File upload endpoint
│   │   ├── list.ts     # List files endpoint
│   │   ├── delete.ts   # Delete file endpoint
│   │   ├── sign.ts     # Presigned upload stub (v1.1)
│   │   └── share.ts    # Slug link creation (optional)
│   ├── d/
│   │   └── [key].ts    # Download endpoint
│   └── s/
│       └── [slug].ts   # Slug redirect endpoint
├── src/                # React frontend
│   ├── components/     # React components
│   ├── lib/            # Utility functions
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── wrangler.toml       # Wrangler configuration
└── package.json        # Dependencies
```

## Security Considerations

- **Authentication**: All write operations require `X-Auth` header with `UPLOAD_PASSWORD`
- **CORS**: Configured to only allow same-origin requests
- **CSP**: Content Security Policy headers configured for secure defaults
- **File Validation**: Size and MIME type validation on upload
- **R2 Keys**: Files stored with date-prefixed UUID keys to avoid collisions

## Limitations

- **Worker Body Limit**: Cloudflare Workers have a 100MB body size limit. For larger files, presigned direct-to-R2 uploads will be implemented in v1.1.
- **Streaming**: Current implementation buffers files in memory. For very large files, consider implementing presigned uploads.

## Future Enhancements (v1.1)

- [ ] Presigned direct-to-R2 uploads (bypass Worker limits)
- [ ] Expiring share links with TTL
- [ ] Image thumbnail previews
- [ ] File management UI (list, delete from interface)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
