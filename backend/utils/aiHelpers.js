import { GoogleGenAI } from '@google/genai';

export const getAIClient = (userApiKey = null) => {
    const apiKey = userApiKey;
    if (!apiKey) throw new Error("API Key not found. Please set your Gemini API Key in Settings.");
    return new GoogleGenAI({ apiKey });
};

export const getResponseText = async (response) => {
    try {
        // GoogleGenAI response structure
        // Method 1: Try response.text() if it's a function (may be async or sync)
        if (typeof response.text === 'function') {
            try {
                const text = response.text();
                // If it returns a Promise, await it
                if (text && typeof text.then === 'function') {
                    return await text;
                }
                return text;
            } catch (e) {
                // If sync call fails, try async
                try {
                    return await response.text();
                } catch (e2) {
                    // Ignore and try next method
                }
            }
        }
        
        // Method 2: Direct access to candidates structure
        if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
            return response.candidates[0].content.parts[0].text;
        }
        
        // Method 3: Try response.text as property
        if (response.text && typeof response.text === 'string') {
            return response.text;
        }
        
        // Method 4: Try to get text from response object directly
        if (response.response && response.response.text) {
            if (typeof response.response.text === 'function') {
                const text = response.response.text();
                return typeof text.then === 'function' ? await text : text;
            }
            return response.response.text;
        }
        
        console.warn("Could not extract text from response:", Object.keys(response));
        return "";
    } catch (error) {
        console.error("Error extracting text from response:", error);
        return "";
    }
};

export const cleanJson = (text) => {
    if (!text) return "";
    return text.replace(/```json\s*|\s*```/g, "").trim();
};

