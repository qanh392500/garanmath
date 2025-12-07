import { User } from '../db/models/User.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { GoogleGenAI } from '@google/genai';

export const getApiKey = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('geminiApiKey keyName');
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Decrypt before sending back to user
        const decryptedKey = user.geminiApiKey ? decrypt(user.geminiApiKey) : null;

        res.json({
            apiKey: decryptedKey,
            keyName: user.keyName || null
        });
    } catch (error) {
        console.log("Error in getApiKey:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const saveApiKey = async (req, res) => {
    try {
        const { apiKey, keyName } = req.body;

        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'API Key is required' });
        }

        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Encrypt before saving
        const encryptedKey = encrypt(apiKey);

        user.geminiApiKey = encryptedKey;
        user.keyName = keyName || 'My Gemini Key';
        user.hasApiKey = true;
        await user.save();

        res.json({ success: true, message: 'API Key saved successfully' });
    } catch (error) {
        console.log("Error in saveApiKey:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteApiKey = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.geminiApiKey = null;
        user.keyName = null;
        user.hasApiKey = false;
        await user.save();

        res.json({ success: true, message: 'API Key deleted successfully' });
    } catch (error) {
        console.log("Error in deleteApiKey:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const testApiKey = async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'API Key is required' });
        }

        // Test the API key
        const client = new GoogleGenAI({ apiKey });
        await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: "Hello" }] }]
        });

        res.json({ success: true, message: 'API Key is valid! (Verified with gemini-2.5-flash)' });
    } catch (error) {
        console.log("Error in testApiKey:", error);
        return res.status(400).json({ success: false, error: 'Invalid API Key: ' + error.message });
    }
};

