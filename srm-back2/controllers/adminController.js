import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { PaperSubmission } from '../models/Paper.js';
import { Review } from '../models/Review.js';
import { generateRandomPassword } from '../utils/helpers.js';
import { sendEditorAssignmentEmail } from '../utils/emailService.js';

// Create editor account
export const createEditor = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Generate password if not provided
        const userPassword = password || generateRandomPassword();
        const hash = await bcrypt.hash(userPassword, 10);

        const newEditor = new User({
            username: username || email.split('@')[0],
            email,
            password: hash,
            role: 'Editor',
            verified: true // Editors are auto-verified
        });

        await newEditor.save();

        return res.status(201).json({
            success: true,
            message: "Editor account created successfully",
            editor: {
                id: newEditor._id,
                email: newEditor.email,
                username: newEditor.username,
                role: newEditor.role
            },
            temporaryPassword: password ? null : userPassword
        });
    } catch (error) {
        console.error("Error creating editor:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating editor account",
            error: error.message
        });
    }
};

// Get all editors
export const getAllEditors = async (req, res) => {
    try {
        const editors = await User.find({ role: 'Editor' })
            .select('-password')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: editors.length,
            editors
        });
    } catch (error) {
        console.error("Error fetching editors:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching editors",
            error: error.message
        });
    }
};

// Assign editor to paper
export const assignEditor = async (req, res) => {
    try {
        const { paperId, editorId } = req.body;

        // Find the paper
        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        // Find the editor
        const editor = await User.findById(editorId);
        if (!editor || editor.role !== 'Editor') {
            return res.status(404).json({
                success: false,
                message: "Editor not found"
            });
        }

        // Assign editor
        paper.assignedEditor = editorId;
        paper.status = 'Editor Assigned';
        await paper.save();

        // Send notification email to editor
        try {
            await sendEditorAssignmentEmail(editor.email, editor.username, {
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                authorName: paper.authorName,
                category: paper.category,
                pdfUrl: paper.pdfUrl
            });
        } catch (emailError) {
            console.error("Error sending editor assignment email:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Editor assigned successfully",
            paper
        });
    } catch (error) {
        console.error("Error assigning editor:", error);
        return res.status(500).json({
            success: false,
            message: "Error assigning editor",
            error: error.message
        });
    }
};

// Reassign editor
export const reassignEditor = async (req, res) => {
    try {
        const { paperId, newEditorId } = req.body;

        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        const newEditor = await User.findById(newEditorId);
        if (!newEditor || newEditor.role !== 'Editor') {
            return res.status(404).json({
                success: false,
                message: "Editor not found"
            });
        }

        paper.assignedEditor = newEditorId;
        await paper.save();

        // Send notification email
        try {
            await sendEditorAssignmentEmail(newEditor.email, newEditor.username, {
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                authorName: paper.authorName,
                category: paper.category,
                pdfUrl: paper.pdfUrl
            });
        } catch (emailError) {
            console.error("Error sending reassignment email:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Editor reassigned successfully",
            paper
        });
    } catch (error) {
        console.error("Error reassigning editor:", error);
        return res.status(500).json({
            success: false,
            message: "Error reassigning editor",
            error: error.message
        });
    }
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        let query = {};
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { email: new RegExp(search, 'i') },
                { username: new RegExp(search, 'i') }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message
        });
    }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Get paper statistics
        const totalPapers = await PaperSubmission.countDocuments();
        const submittedPapers = await PaperSubmission.countDocuments({ status: 'Submitted' });
        const underReview = await PaperSubmission.countDocuments({ status: 'Under Review' });
        const accepted = await PaperSubmission.countDocuments({ status: 'Accepted' });
        const rejected = await PaperSubmission.countDocuments({ status: 'Rejected' });

        // Get user statistics
        const totalUsers = await User.countDocuments();
        const authors = await User.countDocuments({ role: 'Author' });
        const editors = await User.countDocuments({ role: 'Editor' });
        const reviewers = await User.countDocuments({ role: 'Reviewer' });

        // Get papers by status
        const papersByStatus = await PaperSubmission.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent submissions
        const recentSubmissions = await PaperSubmission.find()
            .populate('assignedEditor', 'username email')
            .sort({ createdAt: -1 })
            .limit(10);

        // Get monthly submission trends (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrends = await PaperSubmission.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                papers: {
                    total: totalPapers,
                    submitted: submittedPapers,
                    underReview,
                    accepted,
                    rejected
                },
                users: {
                    total: totalUsers,
                    authors,
                    editors,
                    reviewers
                },
                papersByStatus,
                recentSubmissions,
                monthlyTrends
            }
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard statistics",
            error: error.message
        });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting user",
            error: error.message
        });
    }
};
