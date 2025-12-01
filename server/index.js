import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.warn("⚠️ Auth Middleware: No token provided");
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("❌ Auth Middleware: JWT verification error:", err.message);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing fields: name, email, and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`;
        db.run(sql, [name, email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: "Email already exists." });
                }
                console.error("Database error during registration:", err.message);
                return res.status(500).json({ error: "Failed to register user due to a database error." });
            }

            const token = jwt.sign({ id: this.lastID, email: email }, JWT_SECRET, { expiresIn: '24h' });
            res.status(201).json({ token, user: { id: this.lastID, name, email } });
        });
    } catch (error) {
        console.error("Server error during registration:", error);
        res.status(500).json({ error: "Server error during registration." });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing fields: email and password are required." });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) {
            console.error("Database error during login:", err.message);
            return res.status(500).json({ error: "Failed to login due to a database error." });
        }
        if (!user) return res.status(400).json({ error: "Invalid credentials." });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ error: "Invalid credentials." });

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
});

// Get Current User
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const sql = `SELECT id, name, email FROM users WHERE id = ?`;
    db.get(sql, [req.user.id], (err, user) => {
        if (err) {
            console.error("Database error fetching user:", err.message);
            return res.status(500).json({ error: "Failed to fetch user data." });
        }
        if (!user) return res.status(404).json({ error: "User not found." });
        res.json({ user });
    });
});

// Health Check
app.get('/', (req, res) => {
    res.send('✅ GeoGebra AI Builder API is running!');
});

// Helper: Get AI Client safely
const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        console.error("❌ API Key is missing. Please check your .env file.");
        throw new Error("API Key not found in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

// ------------------------------------------------------------------
// ENDPOINT 1: /api/generate
// Converts Text/Image -> GeoGebra Construction JSON
// ------------------------------------------------------------------
app.post('/api/generate', authenticateToken, async (req, res) => {
    try {
        const { problemText, imageBase64 } = req.body;

        console.log("--- [POST /api/generate] ---");
        console.log("User:", req.user?.email);
        console.log("Text:", problemText ? problemText.substring(0, 50) + "..." : "None");
        console.log("Image:", imageBase64 ? "Yes (Base64)" : "No");

        const ai = getAIClient();

        const systemInstruction = `
    You are an expert Mathematics Teacher and GeoGebra Specialist.
    Your task is to analyze a spatial geometry problem (in Vietnamese) and convert it into a sequence of GeoGebra 5.0 Scripting commands to construct the figure in 3D.

    ### Guidelines:
    1. **Analyze the Input**: 
       - If an image is provided, Extract the text AND analyze any geometric diagrams in the image.
       - Identify the main shape (Cube, Pyramid, Prism, Tetrahedron, etc.) and special properties.
    2. **Assign Coordinates (VITAL STEP: ALL POINTS MUST HAVE CONCRETE COORDINATES)**: 
       - Create a concrete visual representation by assigning specific 3D coordinates to the vertices. **DO NOT SKIP THIS STEP.**
       - Use reasonable default sizes (e.g., side length = 3 or 4) if not specified.
       - Center the figure or place the base on the z=0 plane (e.g., A=(0,0,0)).
       - For a pyramid S.ABC with equilateral base: Place A, B, C in z=0. S should have a z-value > 0 directly above the geometric center of the base.
    3. **Generate Commands**:
       - Remember to create the lateral faces of the solids 
       - Provide a list of valid GeoGebra commands.
       - Define points first: "A = (0, 0, 0)"
       - Define segments/edges: "Segment(A, B)"
       - Define polygons (faces) where appropriate for visibility: "Polygon(A, B, C)"
       - Labeling: Ensure labels are visible if important.
       - assign names to the objects you create (for example: c = Segment(A, B)
       - **Projections (Important)**: 
         - If the problem involves an orthogonal projection (hình chiếu vuông góc) of a point A onto a line d (or segment), use: \`H = ClosestPoint(d, A)\`.
         - If the problem involves an orthogonal projection of a point A onto a plane P (or face), use: \`H = ClosestPoint(P, A)\`.
    4. **Output Format**: Return valid JSON adhering to the schema.
    `;

        const contentParts = [];

        // Add image part if exists
        if (imageBase64) {
            const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                contentParts.push({
                    inlineData: { mimeType: matches[1], data: matches[2] }
                });
            } else {
                contentParts.push({
                    inlineData: { mimeType: "image/png", data: imageBase64 }
                });
            }
        }

        // Add text part
        const promptText = (problemText && problemText.trim())
            ? problemText
            : "Analyze this geometry problem image and generate the 3D construction.";

        contentParts.push({ text: promptText });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: contentParts },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        description: { type: "STRING" },
                        points: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    name: { type: "STRING" },
                                    coords: { type: "ARRAY", items: { type: "NUMBER" } }
                                },
                                required: ["name", "coords"]
                            }
                        },
                        segments: {
                            type: "ARRAY",
                            items: { type: "ARRAY", items: { type: "STRING" } }
                        },
                        rawCommands: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        }
                    },
                    required: ["description", "points", "segments", "rawCommands"]
                }
            }
        });

        // Defensive handling for response.text
        let responseText;
        if (typeof response.text === 'function') {
            responseText = response.text();
        } else {
            responseText = response.text;
        }

        if (!responseText) throw new Error("Empty response from Gemini.");

        res.json(JSON.parse(responseText));

    } catch (error) {
        console.error("❌ Generate Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

// ------------------------------------------------------------------
// ENDPOINT 2: /api/chat
// Modify Existing Construction (Context Aware)
// ------------------------------------------------------------------
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        // IMPORTANT: originalProblem is now required for full context
        const { message, currentCommands, originalProblem, history } = req.body;

        console.log("--- [POST /api/chat] ---");
        console.log("User:", req.user?.email);
        console.log("Message:", message);
        console.log("Current State Lines:", currentCommands?.length || 0);
        console.log("History Length:", history?.length || 0);

        const ai = getAIClient();

        const systemInstruction = `
    You are a smart GeoGebra Assistant. The user has an existing 3D geometry construction.
    
    YOUR GOAL:
    Interpret the user's request and generate **NEW** GeoGebra 5.0 Scripting commands to modify the construction.
    
    CRITICAL CONTEXT RULES:
    1. **Original Problem**: Understand the geometric properties implied (e.g., "Regular pyramid", "Equilateral triangle").
    2. **Current Script**: This is the EXACT code currently running in GeoGebra. It may have been manually edited by the user. Use it to find existing point names (A, B, C...) and coordinates.
    3. **Chat History**: Review previous interactions to understand context (e.g., "Undo that", "Why did you do X?").
    
    RULES:
    1. **Do Not Duplicate**: DO NOT redefine points that already exist in the Current Script.
    2. **Use Existing Objects**: Refer to points/lines by their names found in the Current Script.
    3. **assign names to the objects you create (for example: c = Segment(A, B)**
    4. **Commands**:
       - Connect: \`Segment(A, B)\`
       - Midpoint: \`M = Midpoint(A, B)\`
       - Centroid: \`G = Centroid(Polygon(A, B, C))\`
       - Style: \`SetColor(A, 255, 0, 0)\`
    5. **Response**: JSON with "message" (Vietnamese explanation) and "commands" (array of strings).

    USER LANGUAGE: Vietnamese.
    `;

        const contextString = currentCommands && currentCommands.length > 0
            ? currentCommands.join('\n')
            : "(Empty Script)";

        // Format history
        const historyString = history && history.length > 0
            ? history.map(h => `${h.role === 'user' ? 'USER' : 'ASSISTANT'}: ${h.text}`).join('\n')
            : "(No History)";

        // Construct the Context-Aware Prompt
        const prompt = `
    --- ORIGINAL PROBLEM DEFINITION ---
    ${originalProblem || "No description provided."}

    --- CURRENT GEOGEBRA SCRIPT (STATE) ---
    ${contextString}

    --- CHAT HISTORY ---
    ${historyString}

    --- USER REQUEST ---
    "${message}"
    `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        message: { type: "STRING" },
                        commands: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        }
                    },
                    required: ["message", "commands"]
                }
            }
        });

        // Defensive handling for response.text
        let text;
        if (typeof response.text === 'function') {
            text = response.text();
        } else {
            text = response.text;
        }

        if (!text) throw new Error("No response from AI.");

        res.json(JSON.parse(text));

    } catch (error) {
        console.error("❌ Chat Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
