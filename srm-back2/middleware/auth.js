import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// JWT verification middleware
export const verifyJWT = (req, res, next) => {
    const token = req.headers["authorization"]?.replace('Bearer ', '');

    if (!token) {
        return res.status(403).json({
            success: false,
            message: "A token is required for authentication"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

// Optional JWT verification (doesn't fail if no token)
export const optionalJWT = (req, res, next) => {
    const token = req.headers["authorization"]?.replace('Bearer ', '');

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token is invalid, but we don't fail the request
            req.user = null;
        }
    }

    next();
};

// Get user from database
export const getUserFromToken = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        req.userDoc = user;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching user data"
        });
    }
};
