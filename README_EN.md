# vercel-reverse-proxy
[简体中文](./README.md)

A Vercel-hosted reverse proxy with password protection. Completely free, versatile proxy that can handle all interfaces on the internet, including OpenAI, GitHub, Google, and more. Both HTTP and HTTPS interfaces as well as single pages can be proxied. Built-in password authentication with persistent login - verify once and use indefinitely without re-entering the password.

## Features

- ✅ **Password Protection** - Secure your proxy with a password to prevent unauthorized usage
- ✅ **Persistent Login** - Once verified, the token is saved locally and remains valid until manually cleared
- ✅ **Stateless Verification** - Uses HMAC-SHA256 signatures, no server-side session storage required
- ✅ **Universal Proxy** - Can proxy any HTTPS/HTTP interface
- ✅ **Completely Free** - Deployed on Vercel's free tier
- ✅ **Flexible Configuration** - Easily configure the proxy target URL

## Quick Start

### 1. Deploy to Vercel

Click the button below for one-click deployment:

[![Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/gaboolic/vercel-reverse-proxy)

Or deploy manually:
1. Fork this project to your GitHub account
2. Log in to [Vercel](https://vercel.com/)
3. Select "Add New" → "Project"
4. Import your forked project
5. Configure environment variables as described below

### 2. Configure Environment Variables

Add the following environment variables in your Vercel project settings:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `PROXY_PASSWORD` | Login password | `MySecurePassword123` | ✅ Yes |
| `PROXY_TARGET` | Proxy target URL | `https://wd.bible` | ❌ No (Default: https://wd.bible) |
| `PROXY_SECRET` | Token signing secret | `MySecretKey` | ❌ No (Default: same as password) |

**Examples**:
- To proxy OpenAI API, set `PROXY_TARGET=https://api.openai.com`
- To proxy other websites, set the corresponding URL

### 3. Bind Custom Domain (Optional)

1. Add a custom domain in your Vercel project settings
2. Configure the DNS CNAME record according to Vercel's instructions
3. Once domain configuration is complete, you can start using it

## Usage

### Login

1. Visit your domain (e.g., `https://yourdomain.com`)
2. Enter your configured password
3. Click "Login"
4. Upon successful verification, the token will be saved in your local browser

### Access the Proxy

After login, you can directly access any URL:

```
https://yourdomain.com/api.openai.com/v1/chat/completions
https://yourdomain.com/raw.githubusercontent.com/user/repo/main/file.txt
https://yourdomain.com/www.google.com/search?q=test
```

The proxy will automatically forward requests to the target URL:
```
https://api.openai.com/v1/chat/completions
https://raw.githubusercontent.com/user/repo/main/file.txt
https://www.google.com/search?q=test
```

### API Usage (Programmatic Access)

If you want to call the proxy programmatically, you can pass the token in three ways:

**Method 1: URL Parameter**
```bash
curl "https://yourdomain.com/api/example.com/data?token=YOUR_TOKEN"
```

**Method 2: Authorization Header**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourdomain.com/api/example.com/data
```

**Method 3: Cookie**
```bash
curl -H "Cookie: proxy_token=YOUR_TOKEN" https://yourdomain.com/api/example.com/data
```

## Use Cases

### OpenAI API Acceleration
```
Original: https://api.openai.com/v1/chat/completions
Proxy: https://yourdomain.com/api.openai.com/v1/chat/completions
```

### GitHub Download Acceleration
```
Original: https://objects.githubusercontent.com/github-production-release-asset-xxx
Proxy: https://yourdomain.com/objects.githubusercontent.com/github-production-release-asset-xxx
```

### Google Search
```
Original: https://www.google.com/search?q=test
Proxy: https://yourdomain.com/www.google.com/search?q=test
```

### Web Page Access
```
Original: https://example.com
Proxy: https://yourdomain.com/example.com
```

## Project Structure

```
vercel-reverse-proxy/
├── api/
│   ├── verify.js           # Password verification API
│   └── [[...slug]].js      # Reverse proxy handler
├── public/
│   ├── login.html          # Login page
│   └── index.html          # Home page redirect
├── vercel.json             # Vercel configuration
├── CLAUDE.md               # Claude Code development guide
├── README.md               # Chinese documentation
└── README_EN.md            # English documentation (this file)
```

## Security

- Token is generated using HMAC-SHA256 signature and cannot be tampered with
- Token does not contain the actual password, only a signature
- Passwords and secrets are stored encrypted in Vercel environment variables
- Every request is validated for token validity before proxying
- Supports different password and secret configurations for enhanced security

## FAQ

**Q: What if I forget my password?**
A: Modify the `PROXY_PASSWORD` environment variable in your Vercel project settings, then clear the token stored in your browser's local storage (the `proxy_token` entry in localStorage).

**Q: How can multiple users use this?**
A: Currently, only a single password is supported. If you need multi-user access, you can change the password in the Vercel environment variables to reset everyone's login status.

**Q: Does this support WebSocket proxying?**
A: No, WebSocket is not currently supported. The proxy only supports HTTP/HTTPS requests.

**Q: How do I change the proxy target?**
A: Simply modify the `PROXY_TARGET` environment variable in your Vercel project settings.

**Q: Do tokens expire?**
A: No, tokens are stored in your browser's local storage and remain valid indefinitely unless you manually clear them or clear your browser data.

## License

MIT

## Links

- [Vercel](https://vercel.com/)
- [Node.js](https://nodejs.org/)

