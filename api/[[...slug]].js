import { createHmac } from 'crypto';

const PASSWORD = process.env.PROXY_PASSWORD || 'password123';
const SECRET = process.env.PROXY_SECRET || PASSWORD;
const TARGET_URL = process.env.PROXY_TARGET || 'https://wd.bible';

// 验证token
function verifyToken(token) {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        const expectedHash = createHmac('sha256', SECRET).update(PASSWORD).digest('hex');
        return decoded.verified && decoded.hash === expectedHash;
    } catch {
        return false;
    }
}

// 检查token（从URL参数、header或cookie中获取）
function getToken(req) {
    // 从URL参数获取
    const { query } = req;
    if (query.token) return query.token;

    // 从Authorization header获取
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // 从cookie获取（前缀为proxy_token）
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/proxy_token=([^;]+)/);
    if (match) return match[1];

    return null;
}

export default async function handler(req, res) {
    // 获取token
    const token = getToken(req);

    // 检查token是否有效
    if (!token || !verifyToken(token)) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: '需要登录。请访问 /login.html'
        });
    }

    // 获取目标URL
    const { slug } = req.query;

    // 组合目标URL - 处理根路径情况
    let path = '/';
    if (slug) {
        // slug 可能是字符串或数组
        const slugArray = Array.isArray(slug) ? slug : [slug];
        const filteredSlug = slugArray.filter(s => s); // 过滤掉空字符串
        if (filteredSlug.length > 0) {
            path = '/' + filteredSlug.join('/');
        }
    }
    const queryString = Object.entries(req.query)
        .filter(([key]) => key !== 'slug' && key !== 'token')
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

    const targetUrl = TARGET_URL + path + (queryString ? '?' + queryString : '');

    try {
        // 准备请求body
        let body = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            if (typeof req.body === 'string') {
                body = req.body;
            } else if (req.body) {
                body = JSON.stringify(req.body);
            }
        }

        // 转发请求
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                // 移除host header以避免冲突
                host: undefined,
            },
            body: body,
            redirect: 'follow'
        });

        // 获取响应数据
        const data = await response.text();

        // 复制响应headers - 排除某些不应该转发的headers
        const headersToSkip = [
            'content-encoding',  // 我们已经解码了响应
            'transfer-encoding',
            'connection',
            'keep-alive',
            'content-length'     // 内容可能被修改（注入token），长度会变化
        ];
        response.headers.forEach((value, key) => {
            if (!headersToSkip.includes(key.toLowerCase())) {
                try {
                    res.setHeader(key, value);
                } catch {
                    // 某些header可能无法设置
                }
            }
        });

        // 设置状态码
        res.status(response.status);

        // 如果是HTML内容，注入token到localStorage
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            const modifiedHtml = data.replace(
                '</head>',
                `<script>if (typeof localStorage !== 'undefined') { localStorage.setItem('proxy_token', '${token}'); }</script></head>`
            );
            return res.end(modifiedHtml);
        }

        return res.end(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(502).json({
            error: 'Bad Gateway',
            message: '无法连接到目标服务器'
        });
    }
}
