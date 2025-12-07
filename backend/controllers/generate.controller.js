import { User } from '../db/models/User.js';
import { decrypt } from '../utils/encryption.js';
import { getAIClient, getResponseText, cleanJson } from '../utils/aiHelpers.js';

// RAG Service (optional - can be imported from server/rag_service.js if needed)
let ragService = null;

export const generate = async (req, res) => {
    try {
        const { problemText, imageBase64 } = req.body;
        const trace = { planner: [], rag: [] };

        // Get user's API key
        const user = await User.findById(req.userId).select('geminiApiKey');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userKey = user.geminiApiKey ? decrypt(user.geminiApiKey) : null;
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
            if (matches) {
                plannerParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
            } else {
                plannerParts.push({ inlineData: { mimeType: "image/png", data: imageBase64 } });
            }
        }

        const plannerResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: plannerParts }],
            config: { responseMimeType: "application/json" }
        });
        
        const plannerText = await getResponseText(plannerResponse);
        if (!plannerText) {
            console.error("Planner response structure:", JSON.stringify(plannerResponse, null, 2));
            return res.status(500).json({ success: false, error: 'Failed to get response from AI. Please check API key and quota.' });
        }
        
        let plannerResult;
        try {
            plannerResult = JSON.parse(cleanJson(plannerText));
        } catch (parseError) {
            console.error("Failed to parse planner response:", plannerText);
            return res.status(500).json({ success: false, error: 'Failed to parse AI response. Please try again.' });
        }
        
        if (plannerResult.error) {
            return res.status(400).json({ success: false, error: plannerResult.error });
        }
        const steps = plannerResult.steps || [];
        trace.planner = steps;

        // RAG (optional - can be added later)
        let ragContext = "";
        if (ragService && steps.length > 0) {
            try {
                const searchResults = await ragService.searchBatch(steps, ai, 3);
                const uniqueCmds = new Map();
                searchResults.flat().forEach(cmd => uniqueCmds.set(cmd.cmd, cmd));
                if (uniqueCmds.size > 0) {
                    ragContext = `\n### CÁC LỆNH GEOGEBRA CÓ SẴN:\n` + Array.from(uniqueCmds.values()).map(c => `- ${c.cmd}: ${c.desc}`).join('\n');
                    trace.rag = Array.from(uniqueCmds.values()).map(c => c.cmd);
                }
            } catch (ragError) {
                console.log("RAG error (non-critical):", ragError);
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
            if (matches) {
                contentParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
            } else {
                contentParts.push({ inlineData: { mimeType: "image/png", data: imageBase64 } });
            }
        }
        contentParts.push({ text: `Thực hiện kế hoạch:\n${steps.join('\n')}` });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: contentParts }],
            config: { systemInstruction, responseMimeType: "application/json" }
        });

        const responseText = await getResponseText(response);
        if (!responseText) {
            console.error("Final response structure:", JSON.stringify(response, null, 2));
            return res.status(500).json({ success: false, error: 'Failed to get response from AI. Please check API key and quota.' });
        }
        
        let finalResult;
        try {
            finalResult = JSON.parse(cleanJson(responseText));
        } catch (parseError) {
            console.error("Failed to parse final response:", responseText);
            return res.status(500).json({ success: false, error: 'Failed to parse AI response. Please try again.' });
        }
        finalResult.trace = trace;
        res.json(finalResult);

    } catch (error) {
        console.error("Generate Error:", error);
        
        // Handle Gemini API errors
        if (error.error && error.error.code) {
            const apiError = error.error;
            if (apiError.code === 429) {
                return res.status(429).json({ 
                    success: false, 
                    error: 'API quota exceeded. Please check your Gemini API quota or wait a moment.' 
                });
            }
            return res.status(apiError.code || 500).json({ 
                success: false, 
                error: apiError.message || 'AI API error' 
            });
        }
        
        // Handle JSON parse errors
        if (error instanceof SyntaxError) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to parse AI response. Please try again.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
};

export const chat = async (req, res) => {
    try {
        const { message, currentCommands, history } = req.body;
        const trace = { planner: [], rag: [] };

        // Get user's API key
        const user = await User.findById(req.userId).select('geminiApiKey');
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userKey = user.geminiApiKey ? decrypt(user.geminiApiKey) : null;
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
        
        const plannerText = await getResponseText(plannerResponse);
        if (!plannerText) {
            console.error("Chat planner response structure:", JSON.stringify(plannerResponse, null, 2));
            return res.status(500).json({ success: false, error: 'Failed to get response from AI. Please check API key and quota.' });
        }
        
        let plannerResult;
        try {
            plannerResult = JSON.parse(cleanJson(plannerText));
        } catch (parseError) {
            console.error("Failed to parse chat planner response:", plannerText);
            return res.status(500).json({ success: false, error: 'Failed to parse AI response. Please try again.' });
        }
        const steps = plannerResult.steps || [];
        trace.planner = steps;

        // RAG (optional)
        let ragContext = "";
        if (ragService && steps.length > 0) {
            try {
                const searchResults = await ragService.searchBatch(steps, ai, 3);
                const uniqueCmds = new Map();
                searchResults.flat().forEach(cmd => uniqueCmds.set(cmd.cmd, cmd));
                if (uniqueCmds.size > 0) {
                    ragContext = `\n### CÁC LỆNH GEOGEBRA CÓ SẴN:\n` + Array.from(uniqueCmds.values()).map(c => `- ${c.cmd}: ${c.desc}`).join('\n');
                    trace.rag = Array.from(uniqueCmds.values()).map(c => c.cmd);
                }
            } catch (ragError) {
                console.log("RAG error (non-critical):", ragError);
            }
        }

        // Assistant
        const systemInstruction = `
        Bạn là Trợ lý GeoGebra 3D.
        NHIỆM VỤ: Sửa đổi/Thêm lệnh vào Script hiện tại.
        
        QUY TẮC:
        1. APPEND-ONLY: Không xóa, dùng Delete(). Sửa = Ghi đè.
        2. Tọa độ 3D.
        Output JSON: { "message": "...", "commands": ["...Script cũ...", "Lệnh mới"] }
        `;

        const prompt = `
        Script cũ: ${currentCommands?.join('\n') || ''}
        Lịch sử: ${history?.map(h => h.text).join('\n') || ''}
        Kế hoạch: ${steps.join('\n')}
        Yêu cầu: "${message}"
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: { systemInstruction, responseMimeType: "application/json" }
        });

        const responseText = await getResponseText(response);
        if (!responseText) {
            console.error("Chat final response structure:", JSON.stringify(response, null, 2));
            return res.status(500).json({ success: false, error: 'Failed to get response from AI. Please check API key and quota.' });
        }
        
        let finalResult;
        try {
            finalResult = JSON.parse(cleanJson(responseText));
        } catch (parseError) {
            console.error("Failed to parse chat final response:", responseText);
            return res.status(500).json({ success: false, error: 'Failed to parse AI response. Please try again.' });
        }
        finalResult.trace = trace;
        res.json(finalResult);

    } catch (error) {
        console.error("Chat Error:", error);
        
        // Handle Gemini API errors
        if (error.error && error.error.code) {
            const apiError = error.error;
            if (apiError.code === 429) {
                return res.status(429).json({ 
                    success: false, 
                    error: 'API quota exceeded. Please check your Gemini API quota or wait a moment.' 
                });
            }
            return res.status(apiError.code || 500).json({ 
                success: false, 
                error: apiError.message || 'AI API error' 
            });
        }
        
        // Handle JSON parse errors
        if (error instanceof SyntaxError) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to parse AI response. Please try again.' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error' 
        });
    }
};

