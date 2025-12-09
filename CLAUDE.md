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
  - Redirects to `/login.html` if token invalid
  - Forwards authenticated requests to `PROXY_TARGET`
  - Injects token into HTML responses for client-side persistence

- **`public/login.html`**: Login page with password input
  - Stores token in localStorage after successful login
  - Auto-checks authentication on page load

- **`public/index.html`**: Redirect page that checks auth status

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

Example: Request to `https://yourdomain.com/api/data` → Proxies to `https://wd.bible/api/data`

## Common Development Tasks

### Change the proxy password
Update the `PROXY_PASSWORD` environment variable in Vercel dashboard.

### Change the target URL
Update the `PROXY_TARGET` environment variable in Vercel dashboard.

### Test locally
The app doesn't have a local dev server setup currently (it relies on Vercel's serverless functions). To test:
1. Deploy to Vercel with test variables
2. Or manually test the API endpoints

## Project Structure

```
vercel-reverse-proxy/
├── api/
│   ├── verify.js           # Password verification & token handling
│   └── [[...slug]].js      # Main proxy handler
├── public/
│   ├── login.html          # Login page
│   ├── index.html          # Redirect/auth check page
├── vercel.json             # Routes & env variable definitions
├── README.md               # Chinese documentation
├── README_EN.md            # English documentation
├── CLAUDE.md               # This file
└── img/                    # Demo and documentation images
```

## Security Notes

- Token is generated using HMAC-SHA256 for signature verification
- Token does not contain the actual password, only a hash
- The secret key should be different from the password in production (set `PROXY_SECRET` env var)
- Passwords and secrets are stored in Vercel environment variables (encrypted)
- All requests are checked for token validity before proxying
