import express from 'express';
import { rateLimit } from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { RAGService } from './rag_service.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import crypto from 'crypto';

// Replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Encryption Configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '01234567890123456789012345678901'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text) return null;
    const textParts = text.split(':');
    // Backward compatibility: If no IV (no colon), assume plain text
    if (textParts.length < 2) return text;

    try {
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error("Decryption failed:", error);
        return text; // Fallback to original text if decryption fails
    }
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://www.geogebra.org", "https://aistudiocdn.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:3001", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3001", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
            frameSrc: ["'self'", "https://www.geogebra.org"],
        },
    },
}));
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// --- Rate Limiting ---
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
});
app.use('/api/', generalLimiter);

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    message: { error: "Too many login attempts, please try again later." }
});
app.use('/api/auth/', authLimiter);

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    message: { error: "Too many AI requests, please slow down." }
});
app.use('/api/generate', aiLimiter);
app.use('/api/chat', aiLimiter);

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Usage Tracking Middleware ---
const trackUsage = (req, res, next) => {
    if (req.user && req.user.id) {
        db.run(`UPDATE users SET request_count = COALESCE(request_count, 0) + 1 WHERE id = ?`, [req.user.id], (err) => {
            if (err) console.error("Error tracking usage:", err);
        });
    }
    next();
};

// --- Admin Middleware ---
const authenticateAdmin = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(403).json({ error: "Access denied. Not authenticated." });
    }
    db.get(`SELECT role FROM users WHERE id = ?`, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (row && row.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: "Access denied. Admin only." });
        }
    });
};

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields." });

    // Input Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email format." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`;
        db.run(sql, [name, email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) return res.status(400).json({ error: "Email already exists." });
                return res.status(500).json({ error: "Database error." });
            }
            const token = jwt.sign({ id: this.lastID, email: email }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ token, user: { id: this.lastID, name, email } });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error." });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields." });

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (!user) return res.status(400).json({ error: "Invalid credentials." });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: "Invalid credentials." });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        db.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP, ip_address = ? WHERE id = ?`, [ip, user.id]);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', hasApiKey: !!user.gemini_api_key } });
    });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get(`SELECT id, name, email, role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (!user) return res.status(404).json({ error: "User not found." });

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        db.run(`UPDATE users SET last_login = CURRENT_TIMESTAMP, ip_address = ? WHERE id = ?`, [ip, user.id]);

        res.json({ user });
    });
});

// --- Admin Routes ---
app.get('/api/admin/users', authenticateToken, authenticateAdmin, (req, res) => {
    db.all(`SELECT id, name, email, role, gemini_api_key, created_at, last_login, ip_address, request_count FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        // Don't send API keys to admin, just boolean
        const users = rows.map(u => ({ ...u, hasApiKey: !!u.gemini_api_key, gemini_api_key: undefined }));
        res.json({ users });
    });
});

app.delete('/api/admin/users/:id', authenticateToken, authenticateAdmin, (req, res) => {
    const userId = req.params.id;
    if (parseInt(userId) === req.user.id) return res.status(400).json({ error: "Cannot delete yourself." });
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json({ success: true });
    });
});

app.post('/api/admin/promote-me', authenticateToken, (req, res) => {
    const { secretCode } = req.body;
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'garanmath2024';
    if (secretCode !== ADMIN_SECRET) return res.status(403).json({ error: "Invalid Admin Secret Code." });
    db.run(`UPDATE users SET role = 'admin' WHERE id = ?`, [req.user.id], function (err) {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json({ success: true, message: "You are now an Admin. Please re-login." });
    });
});

app.post('/api/admin/rag/sync', authenticateToken, authenticateAdmin, async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key is required." });

    try {
        // If the key looks encrypted (contains :), decrypt it. Otherwise use as is.
        // NOTE: Frontend usually sends raw key for sync, but if we change to use stored key:
        const finalKey = apiKey.includes(':') ? decrypt(apiKey) : apiKey;

        const client = new GoogleGenAI({ apiKey: finalKey });
        await ragService.sync(client);
        res.json({ success: true, message: "RAG Knowledge Base synced successfully." });
    } catch (error) {
        console.error("RAG Sync Error:", error);
        res.status(500).json({ error: "Failed to sync RAG: " + error.message });
    }
});

// --- User API Key Routes ---
app.get('/api/user/apikey', authenticateToken, (req, res) => {
    db.get(`SELECT gemini_api_key, key_name FROM users WHERE id = ?`, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });

        // Decrypt before sending back to user
        const decryptedKey = row && row.gemini_api_key ? decrypt(row.gemini_api_key) : null;

        res.json({
            apiKey: decryptedKey,
            keyName: row ? row.key_name : null
        });
    });
});

app.post('/api/user/apikey', authenticateToken, (req, res) => {
    const { apiKey, keyName } = req.body;

    // Encrypt before saving
    const encryptedKey = encrypt(apiKey);

    db.run(`UPDATE users SET gemini_api_key = ?, key_name = ? WHERE id = ?`, [encryptedKey, keyName, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json({ success: true });
    });
});

app.delete('/api/user/apikey', authenticateToken, (req, res) => {
    db.run(`UPDATE users SET gemini_api_key = NULL, key_name = NULL WHERE id = ?`, [req.user.id], function (err) {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json({ success: true });
    });
});

app.post('/api/test-apikey', async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key is required." });

    try {
        // Test endpoint receives raw key from frontend input, so no decryption needed usually.
        // But if we reuse this for stored keys, we might need it. 
        // For now, assume raw key from input.
        const client = new GoogleGenAI({ apiKey });
        await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        res.json({ success: true, message: "API Key is valid! (Verified with gemini-2.5-flash)" });
    } catch (error) {
        res.status(400).json({ success: false, error: "Invalid API Key: " + error.message });
    }
});

// --- AI & RAG ---
const getAIClient = (userApiKey = null) => {
    const apiKey = userApiKey;
    if (!apiKey) throw new Error("API Key not found. Please set your Gemini API Key in Settings.");
    return new GoogleGenAI({ apiKey });
};

const getResponseText = (response) => {
    if (typeof response.text === 'function') return response.text();
    if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) return response.candidates[0].content.parts[0].text;
    return "";
};

const cleanJson = (text) => text ? text.replace(/```json\s*|\s*```/g, "").trim() : "";

const ragService = new RAGService();
ragService.load().catch(console.error);

app.post('/api/generate', authenticateToken, aiLimiter, trackUsage, async (req, res) => {
    try {
        const { problemText, imageBase64 } = req.body;
        const trace = { planner: [], rag: [] };

        const userKey = await new Promise((resolve) => {
            db.get(`SELECT gemini_api_key FROM users WHERE id = ?`, [req.user.id], (err, row) => {
                // Decrypt key here
                const key = row && row.gemini_api_key ? decrypt(row.gemini_api_key) : null;
                resolve(key);
            });
        });

        const ai = getAIClient(userKey);

        // Planner
        const plannerPrompt = `
        Bạn là một Chuyên gia Phân tích Bài toán Hình học Không gian (3D Planner).
        NHIỆM VỤ: Phân tích yêu cầu "${problemText}" thành các bước dựng hình 3D.
        QUY TẮC:
        1. Hệ Tọa Độ 3D (x,y,z).
        2. Dùng giá trị chính xác (sqrt, pi).
        3. Dùng lệnh quan hệ (Midpoint, Intersect).
        4. Tạo khối (Pyramid, Prism).
        5. Mặt phẳng dùng Polygon, Cạnh dùng Segment.
        Output JSON: { "steps": ["step1", "step2"] }
        `;

        const plannerParts = [{ text: plannerPrompt }];
        if (imageBase64) {
            const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
            if (matches) plannerParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
            else plannerParts.push({ inlineData: { mimeType: "image/png", data: imageBase64 } });
        }

        const plannerResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: plannerParts }],
            config: { responseMimeType: "application/json" }
        });
        const plannerResult = JSON.parse(cleanJson(getResponseText(plannerResponse)));
        if (plannerResult.error) return res.status(400).json({ error: plannerResult.error });
        const steps = plannerResult.steps || [];
        trace.planner = steps;

        // RAG
        let ragContext = "";
        if (ragService && steps.length > 0) {
            const searchResults = await ragService.searchBatch(steps, ai, 3);
            const uniqueCmds = new Map();
            searchResults.flat().forEach(cmd => uniqueCmds.set(cmd.cmd, cmd));
            if (uniqueCmds.size > 0) {
                ragContext = `\n### CÁC LỆNH GEOGEBRA CÓ SẴN:\n` + Array.from(uniqueCmds.values()).map(c => `- ${c.cmd}: ${c.desc}`).join('\n');
                trace.rag = Array.from(uniqueCmds.values()).map(c => c.cmd);
            }
        }

        // Assistant
        const systemInstruction = `
        Bạn là Trợ lý GeoGebra 3D.
        NHIỆM VỤ: Tạo Script GeoGebra 3D từ Kế hoạch và RAG.
        ${ragContext}
        QUY TẮC:
        1. CHỈ DÙNG LỆNH CÓ TRONG RAG HOẶC CƠ BẢN.
        2. Tọa độ 3D.
        3. Giá trị chính xác.
        Output JSON: { "description": "...", "rawCommands": ["..."], "message": "..." }
        `;

        const contentParts = [];
        if (imageBase64) {
            const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
            if (matches) contentParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
            else contentParts.push({ inlineData: { mimeType: "image/png", data: imageBase64 } });
        }
        contentParts.push({ text: `Thực hiện kế hoạch:\n${steps.join('\n')}` });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: contentParts }],
            config: { systemInstruction, responseMimeType: "application/json" }
        });

        const finalResult = JSON.parse(cleanJson(getResponseText(response)));
        finalResult.trace = trace;
        res.json(finalResult);

    } catch (error) {
        console.error("Generate Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/chat', authenticateToken, aiLimiter, trackUsage, async (req, res) => {
    try {
        const { message, currentCommands, history } = req.body;
        const trace = { planner: [], rag: [] };

        const userKey = await new Promise((resolve) => {
            db.get(`SELECT gemini_api_key FROM users WHERE id = ?`, [req.user.id], (err, row) => {
                // Decrypt key here
                const key = row && row.gemini_api_key ? decrypt(row.gemini_api_key) : null;
                resolve(key);
            });
        });
        const ai = getAIClient(userKey);

        // Planner
        const plannerPrompt = `
        Bạn là 3D Planner.
        Context: ${currentCommands?.join('\n') || "Trống"}
        Request: "${message}"
        Phân tích yêu cầu chỉnh sửa/vẽ thêm.
        Output JSON: { "steps": ["..."] }
        `;
        const plannerResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: plannerPrompt }] }],
            config: { responseMimeType: "application/json" }
        });
        const plannerResult = JSON.parse(cleanJson(getResponseText(plannerResponse)));
        const steps = plannerResult.steps || [];
        trace.planner = steps;

        // RAG
        let ragContext = "";
        if (ragService && steps.length > 0) {
            const searchResults = await ragService.searchBatch(steps, ai, 3);
            const uniqueCmds = new Map();
            searchResults.flat().forEach(cmd => uniqueCmds.set(cmd.cmd, cmd));
            if (uniqueCmds.size > 0) {
                ragContext = `\n### CÁC LỆNH GEOGEBRA CÓ SẴN:\n` + Array.from(uniqueCmds.values()).map(c => `- ${c.cmd}: ${c.desc}`).join('\n');
                trace.rag = Array.from(uniqueCmds.values()).map(c => c.cmd);
            }
        }

        // Assistant
        const systemInstruction = `
        Bạn là Trợ lý GeoGebra 3D.
        NHIỆM VỤ: Sửa đổi/Thêm lệnh vào Script hiện tại.
        ${ragContext}
        QUY TẮC:
        1. APPEND-ONLY: Không xóa, dùng Delete(). Sửa = Ghi đè.
        2. Tọa độ 3D.
        Output JSON: { "message": "...", "commands": ["...Script cũ...", "Lệnh mới"] }
        `;

        const prompt = `
        Script cũ: ${currentCommands?.join('\n')}
        Lịch sử: ${history?.map(h => h.text).join('\n')}
        Kế hoạch: ${steps.join('\n')}
        Yêu cầu: "${message}"
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: { systemInstruction, responseMimeType: "application/json" }
        });

        const finalResult = JSON.parse(cleanJson(getResponseText(response)));
        finalResult.trace = trace;
        res.json(finalResult);

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => res.send('✅ GeoGebra AI Builder API is running!'));

app.listen(port, async () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
