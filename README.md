# vercel-reverse-proxy
[English README](./README_EN.md)

本项目是一个带密码保护的 Vercel 反向代理。完全免费，万能代理，可代理全网一切接口，包括 OpenAI、GitHub、Google 等等。HTTP 和 HTTPS 接口、单页面均可代理。内置密码验证，验证一次后持久有效，无需每次都重新输入。

## 特性

- ✅ **密码保护** - 使用密码保护你的代理，防止被他人滥用
- ✅ **持久登录** - 验证后保存在本地，除非手动清除否则永久有效
- ✅ **无状态验证** - 使用 HMAC-SHA256 签名，不需要服务器存储会话
- ✅ **万能代理** - 可代理任何 HTTPS/HTTP 接口
- ✅ **完全免费** - 部署在 Vercel 免费层
- ✅ **自定义目标** - 灵活配置代理目标 URL
- ✅ **二进制内容支持** - 完美处理图片、字体、视频等二进制资源
- ✅ **Cookie 认证** - 登录后自动设置 Cookie，提升兼容性
- ✅ **根路径代理** - 支持代理到目标站点的根路径（/）
- ✅ **智能头部过滤** - 自动过滤问题响应头，避免浏览器解码错误

## 快速开始

### 1. 部署到 Vercel

点击下方按钮一键部署：

[![Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/gaboolic/vercel-reverse-proxy)

或者手动部署：
1. Fork 本项目到你的 GitHub 账户
2. 登录 [Vercel](https://vercel.com/)
3. 选择「Add New」→「Project」
4. 导入你 Fork 的项目
5. 按下方说明配置环境变量

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例 | 必需 |
|-------|------|------|------|
| `PROXY_PASSWORD` | 登录密码 | `MySecurePassword123` | ✅ 是 |
| `PROXY_TARGET` | 代理目标 URL | `https://wd.bible` | ❌ 否（默认：https://wd.bible） |
| `PROXY_SECRET` | Token 签名密钥 | `MySecretKey` | ❌ 否（默认：同密码） |

**示例**：
- 如果要代理 OpenAI API，设置 `PROXY_TARGET=https://api.openai.com`
- 如果要代理其他网站，设置对应的 URL

### 3. 绑定自定义域名（可选）

1. 在 Vercel 项目设置中添加自定义域名
2. 按照 Vercel 的说明配置 DNS CNAME 记录
3. 域名配置完成后即可使用

## 使用方法

### 登录

1. 访问你的域名（例如 `https://yourdomain.com`）
2. 输入你设置的密码
3. 点击「登录」
4. 验证成功后，token 会保存到本地浏览器

### 访问代理

登录后，你可以直接访问任何 URL：

```
https://yourdomain.com/api/openai.com/v1/chat/completions
https://yourdomain.com/raw.githubusercontent.com/user/repo/main/file.txt
https://yourdomain.com/www.google.com/search?q=test
```

代理会自动将请求转发到目标 URL：
```
https://api.openai.com/v1/chat/completions
https://raw.githubusercontent.com/user/repo/main/file.txt
https://www.google.com/search?q=test
```

### 使用 API（编程方式）

如果你想用代码调用代理，可以通过三种方式传递 token：

**方法 1：URL 参数**
```bash
curl "https://yourdomain.com/api/example.com/data?token=YOUR_TOKEN"
```

**方法 2：Authorization Header**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourdomain.com/api/example.com/data
```

**方法 3：Cookie**
```bash
curl -H "Cookie: proxy_token=YOUR_TOKEN" https://yourdomain.com/api/example.com/data
```

**注意**: 登录后，Cookie 会自动设置并在浏览器请求中携带。通常情况下，浏览器访问无需手动传递 token。上述三种方式主要用于 API 编程调用。

## 技术特性

### 二进制内容处理
代理能够正确处理各种内容类型：
- **HTML 页面**: 自动注入 token 到 localStorage，实现持久登录
- **图片资源**: PNG、JPG、GIF、WebP 等保持完整性
- **字体文件**: WOFF、WOFF2、TTF 等二进制资源
- **视频和音频**: MP4、WebM、MP3 等流媒体文件
- **其他二进制**: PDF、ZIP 等文档和压缩文件

所有二进制数据使用 `arrayBuffer()` 处理，确保数据完整性不被破坏。

### 响应头智能过滤
代理自动过滤以下可能引起问题的响应头：
- `content-encoding`: fetch API 已自动解码响应
- `transfer-encoding`: 不需要转发到客户端
- `connection`、`keep-alive`: 由 HTTP 层自动管理
- `content-length`: HTML 注入 token 后长度会变化

这避免了 `ERR_CONTENT_DECODING_FAILED` 等浏览器错误。

### Cookie 认证机制
登录成功后，系统同时使用两种方式存储 token：
1. **localStorage**: `proxy_token` 键值对
2. **Cookie**: `proxy_token` Cookie（7天有效期）

这确保了最大兼容性：
- 浏览器访问: 自动携带 Cookie
- API 调用: 可使用 Header 或 URL 参数
- 跨域请求: 支持 Authorization Bearer 方式

## 应用场景

### OpenAI API 加速
```
原始：https://api.openai.com/v1/chat/completions
代理：https://yourdomain.com/api.openai.com/v1/chat/completions
```

### GitHub 下载加速
```
原始：https://objects.githubusercontent.com/github-production-release-asset-xxx
代理：https://yourdomain.com/objects.githubusercontent.com/github-production-release-asset-xxx
```

### Google 搜索
```
原始：https://www.google.com/search?q=test
代理：https://yourdomain.com/www.google.com/search?q=test
```

### 网页访问
```
原始：https://example.com
代理：https://yourdomain.com/example.com
```

## 项目结构

```
vercel-reverse-proxy/
├── api/
│   ├── verify.js           # 密码验证 API
│   └── [[...slug]].js      # 反向代理处理器
├── public/
│   └── login.html          # 登录页面
├── vercel.json             # Vercel 配置
├── CLAUDE.md               # Claude Code 开发指南
├── README.md               # 中文说明（本文件）
└── README_EN.md            # 英文说明
```

## 安全说明

- Token 采用 HMAC-SHA256 签名，无法篡改
- Token 中不包含实际密码，只包含签名
- 密码和密钥在 Vercel 中加密存储
- 每次请求都会验证 token 有效性
- 支持不同的密码和密钥配置

## 常见问题

**Q: 忘记密码了怎么办？**
A: 在 Vercel 项目设置中修改 `PROXY_PASSWORD` 环境变量，然后清除浏览器本地存储的 token（localStorage 中的 `proxy_token`）。

**Q: 如何让多个用户都能使用？**
A: 目前只支持单一密码。如果需要多用户，可以在 Vercel 项目设置中修改密码来重置所有人的登录状态。

**Q: 可以代理 WebSocket 吗？**
A: 当前不支持 WebSocket。目前只支持 HTTP/HTTPS 请求。

**Q: 如何修改代理的目标？**
A: 在 Vercel 项目设置中修改 `PROXY_TARGET` 环境变量即可。

**Q: Token 会过期吗？**
A: 不会。Token 保存在浏览器本地存储，除非手动清除或浏览器数据被清空，否则永久有效。

**Q: 为什么图片或其他资源无法加载？**
A: 请确保使用最新版本的代码。旧版本可能存在二进制内容处理问题。最新版本已正确处理所有类型的二进制资源（图片、字体、视频等）。

**Q: 出现 ERR_CONTENT_DECODING_FAILED 错误怎么办？**
A: 这个问题已在最新版本中修复。代理现在会自动过滤问题响应头。如果仍然遇到此问题，请尝试重新部署。

**Q: 根路径（/）访问会发生什么？**
A: 验证 token 后，根路径请求会被代理到 `PROXY_TARGET` 的根路径。不再显示静态首页，而是直接展示目标网站内容。

## 许可证

MIT

## 相关链接

- [Vercel](https://vercel.com/)
- [Node.js](https://nodejs.org/)
