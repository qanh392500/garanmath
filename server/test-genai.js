import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBtTY99Us-lvQSTFMmU5ZG6PmN823f06XA';
const client = new GoogleGenAI({ apiKey });

async function testGenAI() {
    console.log("Testing API Key with model: gemini-2.0-flash");
    try {
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: { parts: [{ text: "Hello" }] }
        });
        console.log("✅ API Call Success!");
        console.log("Response keys:", Object.keys(response));
        console.log("Type of response.text:", typeof response.text);
        if (typeof response.text === 'function') {
            console.log("response.text() result:", response.text());
        } else {
            console.log("response.text value:", response.text);
        }
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

testGenAI();
