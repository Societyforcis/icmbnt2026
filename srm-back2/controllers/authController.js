import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import FinalAcceptance from '../models/FinalAcceptance.js';
import { sendVerificationEmail, sendOTPEmail } from '../utils/emailService.js';

// Register new user
export const register = async (req, res) => {
    const { email, password, role = 'Author' } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            username: email.split('@')[0],
            email,
            password: hash,
            role,
            verified: false,
            verificationToken,
            verificationExpires: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
        });

        await newUser.save();

        try {
            await sendVerificationEmail(email, verificationToken);

            return res.status(201).json({
                success: true,
                message: "Account created. Please check your email to verify your account."
            });
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            return res.status(201).json({
                success: true,
                message: "Account created, but we couldn't send a verification email. Please contact support."
            });
        }
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during registration",
            error: error.message
        });
    }
};

// Login user
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password"
            });
        }

        if (!user.verified) {
            return res.status(200).json({
                success: false,
                verified: false,
                needsVerification: true,
                message: "Please verify your email before logging in"
            });
        }

        const token = jwt.sign({
            email,
            userId: user._id,
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return res.status(200).json({
            success: true,
            verified: true,
            token,
            email: user.email,
            username: user.username,
            role: user.role, // Add role at top level for easy access
            user: {
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during login",
            error: error.message
        });
    }
};

// Verify email with token
export const verifyEmail = async (req, res) => {
    // Support both GET (query params) and POST (body) methods
    const token = req.query.token || req.body.token;
    const email = req.query.email || req.body.email;

    if (!token) {
        return res.status(400).json({
            success: false,
            message: "Verification token is required"
        });
    }

    try {
        // If email is not provided, find user by token alone
        let query = { verificationToken: token, verificationExpires: { $gt: new Date() } };
        
        if (email) {
            query.email = email;
        }

        const user = await User.findOne(query);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token. Please request a new verification email."
            });
        }

        user.verified = true;
        user.verificationToken = undefined;
        user.verificationExpires = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during verification. Please try again.",
            error: error.message
        });
    }
};

// Resend verification email
export const resendVerification = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.verified) {
            return res.status(400).json({
                success: false,
                message: "Email already verified"
            });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(email, verificationToken);

        return res.status(200).json({
            success: true,
            message: "Verification email sent. Please check your inbox."
        });
    } catch (error) {
        console.error("Resend verification error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while sending the verification email",
            error: error.message
        });
    }
};

// Forgot password - send OTP
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

        user.resetPasswordOTP = otp;
        user.resetPasswordExpiry = otpExpiry;
        await user.save();

        await sendOTPEmail(email, otp);

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email"
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error: error.message
        });
    }
};

// Reset password with OTP
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp,
            resetPasswordExpiry: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP"
            });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        user.password = hash;
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful"
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while resetting your password",
            error: error.message
        });
    }
};

// Get current user info
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error("Get current user error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching user data",
            error: error.message
        });
    }
};

// Check if user's email exists in FinalAcceptance (is accepted for registration)
export const checkAcceptanceStatus = async (req, res) => {
    try {
        const email = req.query.email;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                isAccepted: false,
                message: "Email is required"
            });
        }

        // Search for acceptance record with this email
        const acceptanceRecord = await FinalAcceptance.findOne({ authorEmail: email });

        if (acceptanceRecord) {
            return res.status(200).json({
                success: true,
                isAccepted: true,
                message: "User is accepted for registration",
                acceptanceData: {
                    paperTitle: acceptanceRecord.paperTitle,
                    authorName: acceptanceRecord.authorName,
                    acceptanceDate: acceptanceRecord.acceptanceDate
                }
            });
        } else {
            return res.status(200).json({
                success: true,
                isAccepted: false,
                message: "User is not accepted for registration"
            });
        }
    } catch (error) {
        console.error("Check acceptance status error:", error);
        return res.status(500).json({
            success: false,
            isAccepted: false,
            message: "An error occurred while checking acceptance status",
            error: error.message
        });
    }
};
