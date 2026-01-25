import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { PaperSubmission } from '../models/Paper.js';
import { Review } from '../models/Review.js';
import { Revision } from '../models/Revision.js';
import { generateRandomPassword } from '../utils/helpers.js';
import { sendEditorAssignmentEmail, sendEditorCredentialsEmail, sendEditorMessageEmail } from '../utils/emailService.js';

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

        console.log(`📧 Sending credentials email to ${email}...`);

        // Send credentials email
        try {
            await sendEditorCredentialsEmail(email, username || email.split('@')[0], userPassword);
            console.log(`✅ Credentials email sent successfully to ${email}`);
        } catch (emailError) {
            console.error(`⚠️  Failed to send credentials email to ${email}:`, emailError);
            // Don't fail the entire operation if email fails
        }

        return res.status(201).json({
            success: true,
            message: "Editor account created successfully",
            editor: {
                id: newEditor._id,
                email: newEditor.email,
                username: newEditor.username,
                role: newEditor.role
            },
            temporaryPassword: password ? null : userPassword,
            emailSent: true
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
        console.log('📋 Fetching all editors from database...');

        // Query all users and check their roles
        const allUsers = await User.find({});
        console.log(`Total users in database: ${allUsers.length}`);
        console.log('User roles:', allUsers.map(u => ({ email: u.email, role: u.role })));

        // Find editors - handle case sensitivity
        const editors = await User.find({
            role: { $in: ['Editor', 'editor', 'EDITOR'] }
        })
            .select('-password')
            .sort({ createdAt: -1 });

        console.log(`✓ Found ${editors.length} editor(s)`);

        return res.status(200).json({
            success: true,
            count: editors.length,
            editors,
            debug: {
                totalUsers: allUsers.length,
                rolesInDB: [...new Set(allUsers.map(u => u.role))]
            }
        });
    } catch (error) {
        console.error("❌ Error fetching editors:", error);
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
            .sort({ createdAt: -1 })
            .lean();

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
        // Use Promise.all for parallel count queries
        const [
            totalPapers,
            submittedPapers,
            underReview,
            accepted,
            rejected,
            totalUsers,
            authors,
            editors,
            reviewers
        ] = await Promise.all([
            PaperSubmission.countDocuments(),
            PaperSubmission.countDocuments({ status: 'Submitted' }),
            PaperSubmission.countDocuments({ status: 'Under Review' }),
            PaperSubmission.countDocuments({ status: 'Accepted' }),
            PaperSubmission.countDocuments({ status: 'Rejected' }),
            User.countDocuments(),
            User.countDocuments({ role: 'Author' }),
            User.countDocuments({ role: 'Editor' }),
            User.countDocuments({ role: 'Reviewer' })
        ]);

        // Get papers by status
        const papersByStatus = await PaperSubmission.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get recent submissions in parallel with other aggregate tasks if possible,
        // but here we just optimize the query itself
        const recentSubmissions = await PaperSubmission.find()
            .populate('assignedEditor', 'username email')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

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
// Send message to editor
export const sendMessageToEditor = async (req, res) => {
    try {
        const { editorId, message } = req.body;

        if (!editorId || !message) {
            return res.status(400).json({
                success: false,
                message: "Editor ID and message are required"
            });
        }

        const editor = await User.findById(editorId);
        if (!editor || editor.role !== 'Editor') {
            return res.status(404).json({
                success: false,
                message: "Editor not found"
            });
        }

        // For now, we send an email notification. 
        // We could also store this in a Message collection if needed.
        await sendEditorMessageEmail(editor.email, editor.username, message);

        return res.status(200).json({
            success: true,
            message: "Message sent successfully to the editor"
        });
    } catch (error) {
        console.error("Error sending message to editor:", error);
        return res.status(500).json({
            success: false,
            message: "Error sending message",
            error: error.message
        });
    }
};

// Get all conference selected users (users who completed the full process)
export const getConferenceSelectedUsers = async (req, res) => {
    try {
        const ConferenceSelectedUser = (await import('../models/ConferenceSelectedUser.js')).default;

        const selectedUsers = await ConferenceSelectedUser.find()
            .sort({ selectionDate: -1 })
            .populate('paymentId');

        return res.status(200).json({
            success: true,
            message: `Found ${selectedUsers.length} selected users`,
            users: selectedUsers,
            total: selectedUsers.length
        });
    } catch (error) {
        console.error('Error fetching conference selected users:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching selected users',
            error: error.message
        });
    }
};

// Get all PDFs from Cloudinary (admin version with delete capability)
export const getAllPdfsAdmin = async (req, res) => {
    try {
        const { listPdfsFromCloudinary } = await import('../config/cloudinary-pdf.js');
        const pdfs = await listPdfsFromCloudinary();

        // Enrich with local database info if available
        const enrichedPdfs = pdfs.map(pdf => {
            const fileName = pdf.public_id.split('/').pop();
            return {
                publicId: pdf.public_id,
                fileName: fileName,
                url: pdf.secure_url,
                size: pdf.bytes,
                uploadedAt: pdf.created_at,
                version: pdf.version
            };
        });

        return res.status(200).json({
            success: true,
            message: `Found ${enrichedPdfs.length} PDFs in Cloudinary`,
            pdfs: enrichedPdfs,
            total: enrichedPdfs.length
        });
    } catch (error) {
        console.error('Error fetching PDFs from Cloudinary:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching PDFs from Cloudinary',
            error: error.message
        });
    }
};

// Delete PDF from Cloudinary (admin only)
export const deletePdfAdmin = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'PDF public ID is required'
            });
        }

        const { deletePdfFromCloudinary } = await import('../config/cloudinary-pdf.js');
        await deletePdfFromCloudinary(publicId);

        return res.status(200).json({
            success: true,
            message: 'PDF deleted successfully from Cloudinary'
        });
    } catch (error) {
        console.error('Error deleting PDF:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting PDF',
            error: error.message
        });
    }
};
