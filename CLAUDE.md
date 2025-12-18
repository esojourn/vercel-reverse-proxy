# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vercel-hosted reverse proxy service with password protection. The application consists of:
- A login page for password authentication
- API endpoints for verification and proxying
- Persistent login using localStorage tokens

**Architecture**:
1. **Login Flow**: User submits password → `/api/verify` validates and returns token → Token stored in localStorage
2. **Proxy Flow**: User makes request → `/api/[[...slug]]` checks token validity → Proxies request to target URL
3. The token is checked via HMAC-based validation (stateless)

## Deployment

1. Fork the repository on GitHub
2. Create a new project on [vercel.com](https://vercel.com) and connect it to the fork
3. Set environment variables in Vercel dashboard:
   - `PROXY_PASSWORD`: The password users must enter (default: `password123`)
   - `PROXY_SECRET`: Secret used for token generation (default: same as `PROXY_PASSWORD`)
   - `PROXY_TARGET`: Target URL to proxy to (default: `https://wd.bible`)
4. Push changes to main branch for automatic deployment

## Architecture Details

### Files

- **`api/verify.js`**: Handles password verification and token generation/validation
  - `POST /api/verify` with `password` param → Returns token if password correct
  - `POST /api/verify` with `token` param → Returns `{valid: true/false}`

- **`api/[[...slug]].js`**: Main proxy handler
  - Checks token validity before proxying any requests
  - Returns 401 JSON response if token invalid
  - Filters problematic response headers (content-encoding, transfer-encoding, connection, keep-alive, content-length)
  - Handles binary content correctly using arrayBuffer() for non-HTML responses
  - Injects token into HTML responses for client-side persistence (localStorage)
  - Supports root path proxying (/) without static file interference

- **`public/login.html`**: Login page with password input
  - Stores token in localStorage after successful login
  - Sets cookie (proxy_token) with 7-day max-age for automatic authentication
  - Auto-checks authentication on page load
  - Redirects to requested path (or /) after successful login

- **`vercel.json`**: Defines routes and environment variables

### Token System

Tokens are HMAC-SHA256 signatures encoded in base64. The token format is:
```
base64(JSON: {verified: true, hash: HMAC_SHA256(password)})
```

This is stateless - no database or session storage needed. Token validity is checked by:
1. Decoding the base64 token
2. Computing HMAC of the stored `PROXY_PASSWORD`
3. Comparing with hash in token

## Configuration

### Environment Variables

Set these in Vercel project settings:

- `PROXY_PASSWORD` (required): Password users must enter to access proxy
- `PROXY_SECRET`: Secret key for token generation (optional, defaults to `PROXY_PASSWORD`)
- `PROXY_TARGET`: Target URL to proxy requests to (default: `https://wd.bible`)

### Token Handling

Tokens are checked from (in order of priority):
1. URL parameter: `?token=<token>`
2. Authorization header: `Authorization: Bearer <token>`
3. Cookie: `proxy_token=<token>`

### Proxying

All requests to routes other than `/login.html` and `/api/verify` are proxied to `PROXY_TARGET`.

**Route Examples**:
- Request: `https://yourdomain.com/api/data` → Proxies to: `https://wd.bible/api/data`
- Request: `https://yourdomain.com/` → Proxies to: `https://wd.bible/` (root path)
- Request: `https://yourdomain.com/images/logo.png` → Proxies to: `https://wd.bible/images/logo.png`

**Request Processing Flow**:
1. Token validation from (priority order):
   - URL query parameter: `?token=xxx`
   - Authorization header: `Bearer xxx`
   - Cookie: `proxy_token=xxx`
2. Query parameter `token` is filtered out before proxying
3. `host` header is removed to prevent conflicts
4. Request forwarded with original method (GET, POST, etc.) and body

**Response Processing Flow**:
1. Problematic headers filtered (content-encoding, transfer-encoding, etc.)
2. Content-type checked:
   - `text/html`: Token injection script added, sent as text
   - Other types: Preserved as binary using arrayBuffer()
3. Original status code maintained
4. Response sent to client

**Root Path Handling**:
The catch-all route in `vercel.json` sends all requests (including `/`) to `[[...slug]]`. The slug parameter handling properly constructs the target path, including root (`/`) when slug is empty or undefined.

## Content Type Handling

### Binary vs. Text Content Processing

The proxy uses different processing methods based on content type to prevent data corruption:

**HTML Content** (`content-type` contains `text/html`):
1. Fetched using `response.text()` to get decoded string
2. Token injection script inserted before `</head>` tag:
   ```javascript
   if (typeof localStorage !== 'undefined') {
     localStorage.setItem('proxy_token', 'TOKEN_VALUE');
   }
   ```
3. Modified HTML returned to client

**Binary Content** (images, fonts, videos, PDFs, etc.):
1. Fetched using `response.arrayBuffer()` to preserve byte integrity
2. Converted to Buffer without modification: `Buffer.from(buffer)`
3. Sent to client with exact byte-for-byte accuracy

**Why This Matters**: Previous versions used `response.text()` for all content, which corrupted binary data by attempting UTF-8 decoding. This caused images to return 200 OK but display as broken.

### Response Header Filtering

The following headers are excluded from proxy responses to prevent browser errors:

| Header | Why Filtered |
|--------|-------------|
| `content-encoding` | Fetch API automatically decodes (gzip, deflate, br); forwarding causes `ERR_CONTENT_DECODING_FAILED` |
| `transfer-encoding` | Not applicable to serverless function responses; managed by Vercel |
| `connection`, `keep-alive` | HTTP/1.1 connection management; handled by HTTP layer |
| `content-length` | May be inaccurate after HTML modification (token injection changes byte length) |

Headers are set with try-catch to handle cases where certain headers cannot be set in the Vercel environment (see `api/[[...slug]].js` lines 102-108).

## Common Development Tasks

### Change the proxy password
Update the `PROXY_PASSWORD` environment variable in Vercel dashboard.

### Change the target URL
Update the `PROXY_TARGET` environment variable in Vercel dashboard.

### Test locally
The app doesn't have a local dev server setup currently (it relies on Vercel's serverless functions). To test:
1. Deploy to Vercel with test variables
2. Or manually test the API endpoints

## Common Issues and Solutions

### Issue: Images/Binary Files Corrupted (200 OK but Broken Display)

**Symptoms**:
- Images return HTTP 200 but don't display
- Fonts fail to load despite successful response
- Videos or PDFs appear corrupted

**Root Cause**: Binary data being processed as UTF-8 text, corrupting byte sequences

**Solution**: Fixed in commit 4dcee2c
- HTML responses: Use `response.text()` (lines 119-124 in `api/[[...slug]].js`)
- Binary responses: Use `response.arrayBuffer()` (lines 128-129 in `api/[[...slug]].js`)

**Code Location**: `/api/[[...slug]].js` lines 114-129

---

### Issue: Browser Error ERR_CONTENT_DECODING_FAILED

**Symptoms**:
- Browser console shows `ERR_CONTENT_DECODING_FAILED`
- Content fails to load despite successful proxy request
- Happens especially with gzip/br compressed responses

**Root Cause**: `content-encoding` header indicates compression, but fetch API already decoded the response. Browser tries to decode again and fails.

**Solution**: Fixed in commit 557a644
- Filter out `content-encoding` and related headers (lines 94-109 in `api/[[...slug]].js`)
- Only forward safe headers to client

**Code Location**: `/api/[[...slug]].js` lines 94-109

---

### Issue: Root Path (/) Shows "正在加载..." Indefinitely

**Symptoms**:
- After login, redirecting to `/` shows loading page forever
- Static content displays instead of proxied target site

**Root Cause**: Static `public/index.html` file intercepted requests before Vercel routing rules could apply

**Solution**: Fixed in commit 507adf0
- Deleted `public/index.html` entirely
- Catch-all route in `vercel.json` now handles `/` correctly

**Routing Config**: `/vercel.json` line 5 - `{ "source": "/(.*)", "destination": "/api/[[...slug]]?slug=$1" }`

---

### Issue: Token Not Persisting Across Page Navigations

**Symptoms**:
- User must re-login when navigating within proxied site
- Token exists in localStorage but not sent with requests

**Root Cause**: Only localStorage was set; cookies were not configured

**Solution**: Fixed in commit 4fa0297
- Login sets both localStorage AND cookie (with 7-day max-age)
- Cookie automatically included in browser requests

**Code Location**: `/public/login.html` lines 210-211

**Cookie Configuration**:
```javascript
document.cookie = `proxy_token=${token}; path=/; max-age=604800; SameSite=Lax`;
```

## Security Notes

- Token is generated using HMAC-SHA256 for signature verification
- Token does not contain the actual password, only a hash
- The secret key should be different from the password in production (set `PROXY_SECRET` env var)
- Passwords and secrets are stored in Vercel environment variables (encrypted)
- All requests are checked for token validity before proxying

