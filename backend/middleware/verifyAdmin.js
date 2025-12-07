import { User } from '../db/models/User.js';

export const verifyAdmin = async (req, res, next) => {
    try {
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Forbidden - Admin access required" });
        }

        next();
    } catch (error) {
        console.log("Error in verifyAdmin:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

