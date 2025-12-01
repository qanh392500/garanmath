import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBtTY99Us-lvQSTFMmU5ZG6PmN823f06XA';
const client = new GoogleGenAI({ apiKey });

async function testGenAIWithSchema() {
    console.log("Testing API Key with model: gemini-2.0-flash AND SCHEMA");

    const schema = {
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
            }
        },
        required: ["description", "points"]
    };

    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: "Generate a cube with points." }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        console.log("✅ API Call Success!");
        console.log("Response text type:", typeof response.text);
        console.log("Response text content:", response.text);
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

testGenAIWithSchema();
