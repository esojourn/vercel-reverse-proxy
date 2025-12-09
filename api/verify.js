import { createHmac } from 'crypto';

const PASSWORD = process.env.PROXY_PASSWORD || 'password123';
const SECRET = process.env.PROXY_SECRET || PASSWORD;

// 生成token
function generateToken(password) {
    const hash = createHmac('sha256', SECRET).update(password).digest('hex');
    return Buffer.from(JSON.stringify({ verified: true, hash })).toString('base64');
}

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

export default function handler(req, res) {
    // 设置CORS头允许跨域
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password, token } = req.body;

    // 如果提供了token，验证token
    if (token) {
        const valid = verifyToken(token);
        return res.status(200).json({ valid });
    }

    // 如果提供了password，验证password
    if (password) {
        if (password === PASSWORD) {
            const newToken = generateToken(password);
            return res.status(200).json({
                success: true,
                message: '密码正确',
                token: newToken
            });
        } else {
            return res.status(401).json({
                success: false,
                message: '密码错误'
            });
        }
    }

    return res.status(400).json({ error: 'Missing password or token' });
}
