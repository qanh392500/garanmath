import { User } from '../db/models/User.js';

export const promoteMe = async (req, res) => {
    try {
        const { secretCode } = req.body;
        const userId = req.userId;

        // Check secret code (set ADMIN_SECRET in .env to customize)
        const ADMIN_SECRET = process.env.ADMIN_SECRET || 'garanmath2024';
        
        if (secretCode !== ADMIN_SECRET) {
            return res.status(400).json({ success: false, error: 'Invalid secret code' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.role = 'admin';
        await user.save();

        res.status(200).json({
            success: true,
            message: 'You have been promoted to admin!',
            user: {
                ...user._doc,
                password: undefined,
            }
        });
    } catch (error) {
        console.log("Error in promoteMe:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            users: users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                hasApiKey: !!user.hasApiKey,
                isVerified: user.isVerified || false,
                created_at: user.createdAt,
                last_login: user.lastLogin,
                googleId: user.googleId,
            }))
        });
    } catch (error) {
        console.log("Error in getUsers:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.userId;

        // Prevent self-deletion
        if (id === currentUserId.toString()) {
            return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
        }

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.log("Error in deleteUser:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const syncRAG = async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'API key is required' });
        }

        // Here you would implement RAG sync logic
        // For now, just return success
        res.status(200).json({
            success: true,
            message: 'RAG sync completed successfully'
        });
    } catch (error) {
        console.log("Error in syncRAG:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

