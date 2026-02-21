import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { PaperSubmission } from '../models/Paper.js';
import { MultiplePaperSubmission } from '../models/MultiplePaper.js';
import { Review } from '../models/Review.js';
import { Revision } from '../models/Revision.js';
import { generateRandomPassword } from '../utils/helpers.js';
import {
    sendEditorAssignmentEmail,
    sendEditorCredentialsEmail,
    sendEditorMessageEmail,
    sendSelectionEmail
} from '../utils/emailService.js';

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
        let paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            paper = await MultiplePaperSubmission.findById(paperId);
        }

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

        // Find the paper
        let paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            paper = await MultiplePaperSubmission.findById(paperId);
        }

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
            mainPapers,
            multiPapers,
            mainSubmitted,
            multiSubmitted,
            mainUnderReview,
            multiUnderReview,
            mainAccepted,
            multiAccepted,
            mainRejected,
            multiRejected,
            totalUsers,
            authors,
            editors,
            reviewers
        ] = await Promise.all([
            PaperSubmission.countDocuments(),
            MultiplePaperSubmission.countDocuments(),
            PaperSubmission.countDocuments({ status: 'Submitted' }),
            MultiplePaperSubmission.countDocuments({ status: 'Submitted' }),
            PaperSubmission.countDocuments({ status: 'Under Review' }),
            MultiplePaperSubmission.countDocuments({ status: 'Under Review' }),
            PaperSubmission.countDocuments({ status: 'Accepted' }),
            MultiplePaperSubmission.countDocuments({ status: 'Accepted' }),
            PaperSubmission.countDocuments({ status: 'Rejected' }),
            MultiplePaperSubmission.countDocuments({ status: 'Rejected' }),
            User.countDocuments(),
            User.countDocuments({ role: 'Author' }),
            User.countDocuments({ role: 'Editor' }),
            User.countDocuments({ role: 'Reviewer' })
        ]);

        const totalPapers = mainPapers + multiPapers;
        const submittedPapers = mainSubmitted + multiSubmitted;
        const underReview = mainUnderReview + multiUnderReview;
        const accepted = mainAccepted + multiAccepted;
        const rejected = mainRejected + multiRejected;

        // Get papers by status from both
        const [mainByStatus, multiByStatus] = await Promise.all([
            PaperSubmission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            MultiplePaperSubmission.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
        ]);

        const combinedMap = {};
        [...mainByStatus, ...multiByStatus].forEach(item => {
            combinedMap[item._id] = (combinedMap[item._id] || 0) + item.count;
        });
        const papersByStatus = Object.keys(combinedMap).map(status => ({ _id: status, count: combinedMap[status] }));

        const [recentMain, recentMulti] = await Promise.all([
            PaperSubmission.find()
                .populate('assignedEditor', 'username email')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            MultiplePaperSubmission.find()
                .populate('assignedEditor', 'username email')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean()
        ]);

        const recentSubmissions = [...recentMain, ...recentMulti]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Get monthly submission trends (last 6 months) from both collections
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [mainTrends, multiTrends] = await Promise.all([
            PaperSubmission.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            MultiplePaperSubmission.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        const trendsMap = {};
        [...mainTrends, ...multiTrends].forEach(item => {
            const key = `${item._id.year}-${item._id.month}`;
            if (!trendsMap[key]) {
                trendsMap[key] = { _id: item._id, count: 0 };
            }
            trendsMap[key].count += item.count;
        });

        const monthlyTrends = Object.values(trendsMap).sort((a, b) =>
            (a._id.year - b._id.year) || (a._id.month - b._id.month)
        );

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

// Send selection email to author
export const sendSelectedUserEmail = async (req, res) => {
    try {
        const { submissionId } = req.body;
        const ConferenceSelectedUser = (await import('../models/ConferenceSelectedUser.js')).default;

        const selectedUser = await ConferenceSelectedUser.findOne({ submissionId });
        if (!selectedUser) {
            return res.status(404).json({
                success: false,
                message: 'Selected user not found'
            });
        }

        await sendSelectionEmail(selectedUser.authorEmail, selectedUser.authorName, {
            submissionId: selectedUser.submissionId,
            paperTitle: selectedUser.paperTitle
        });

        return res.status(200).json({
            success: true,
            message: 'Selection email sent successfully'
        });
    } catch (error) {
        console.error('Error sending selection email:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending selection email',
            error: error.message
        });
    }
};

// Get all papers submitted by admins (where paper email belongs to an admin user)
export const getAdminSubmittedPapers = async (req, res) => {
    try {
        // 1. Get all admin emails
        const admins = await User.find({ role: 'Admin' }).select('email');
        const adminEmails = admins.map(a => a.email);

        // 2. Fetch papers from both collections matching these emails
        const [primaryPapers, multiPapers] = await Promise.all([
            PaperSubmission.find({ email: { $in: adminEmails } })
                .select('-pdfBase64 -versions')
                .populate('assignedEditor', 'username email'),
            MultiplePaperSubmission.find({ email: { $in: adminEmails } })
                .select('-pdfBase64 -versions')
                .populate('assignedEditor', 'username email')
        ]);

        const papers = [...primaryPapers, ...multiPapers].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return res.status(200).json({
            success: true,
            count: papers.length,
            papers,
            adminEmails
        });
    } catch (error) {
        console.error("Error fetching admin submitted papers:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching admin submitted papers",
            error: error.message
        });
    }
};

// Map a paper from an admin email to a real author email
export const mapPaperEmail = async (req, res) => {
    try {
        const { paperId, newEmail } = req.body;

        if (!paperId || !newEmail) {
            return res.status(400).json({
                success: false,
                message: "Paper ID and new author email are required"
            });
        }

        // 1. Verify the new email exists as an Author
        const author = await User.findOne({
            email: newEmail.toLowerCase(),
            role: 'Author'
        });

        if (!author) {
            return res.status(404).json({
                success: false,
                message: "Author with this email not found in the database. Please ensure they are registered as an Author first."
            });
        }

        // 2. Find the paper in either collection
        let paper = await PaperSubmission.findById(paperId);
        let collectionType = 'primary';

        if (!paper) {
            paper = await MultiplePaperSubmission.findById(paperId);
            collectionType = 'multiple';
        }

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        const oldEmail = paper.email;
        const submissionId = paper.submissionId;

  
        paper.email = author.email;
        paper.authorName = author.username || paper.authorName; // Update name if possible, else keep old
        await paper.save();

        // 4. Update related collections
        const { Copyright } = await import('../models/Copyright.js');
        const FinalAcceptance = (await import('../models/FinalAcceptance.js')).default;
        const ConferenceSelectedUser = (await import('../models/ConferenceSelectedUser.js')).default;
        const { UserSubmission } = await import('../models/UserSubmission.js');
        const { Revision } = await import('../models/Revision.js');
        const RejectedPaper = (await import('../models/RejectedPaper.js')).default;
        const { PaperMessage } = await import('../models/PaperMessage.js');
        const PaymentRegistration = (await import('../models/PaymentRegistration.js')).default;
        const PaymentDoneFinalUser = (await import('../models/PaymentDoneFinalUser.js')).default;

     
        await Promise.all([
            // Update Copyright if exists
            Copyright.updateMany(
                { submissionId: submissionId, authorEmail: oldEmail },
                { $set: { authorEmail: author.email, authorName: author.username } }
            ),
            // Update FinalAcceptance if exists
            FinalAcceptance.updateMany(
                { submissionId: submissionId, authorEmail: oldEmail },
                { $set: { authorEmail: author.email, authorName: author.username } }
            ),
            // Update ConferenceSelectedUser if exists
            ConferenceSelectedUser.updateMany(
                { submissionId: submissionId, authorEmail: oldEmail },
                { $set: { authorEmail: author.email, authorName: author.username } }
            ),
            // Update UserSubmission if exists
            UserSubmission.updateMany(
                { submissionId: submissionId, email: oldEmail },
                { $set: { email: author.email } }
            ),
            // Update Revision if exists
            Revision.updateMany(
                { submissionId: submissionId, authorEmail: oldEmail },
                { $set: { authorEmail: author.email, authorName: author.username } }
            ),
            // Update RejectedPaper if exists
            RejectedPaper.updateMany(
                { submissionId: submissionId, authorEmail: oldEmail },
                { $set: { authorEmail: author.email, authorName: author.username } }
            ),
            // Update PaperMessage if exists
            PaperMessage.updateMany(
                { submissionId: submissionId, authorEmail: oldEmail },
                { $set: { authorEmail: author.email } }
            ),
            // Update PaymentRegistration if exists
            PaymentRegistration.updateMany(
                { submissionId: submissionId, authorEmail: oldEmail },
                { $set: { authorEmail: author.email, authorName: author.username, userId: author._id } }
            ),
            // Update PaymentDoneFinalUser if exists
            PaymentDoneFinalUser.updateMany(
                { submissionId: submissionId, authorEmail: oldEmail },
                { $set: { authorEmail: author.email, authorName: author.username, userId: author._id } }
            )
        ]);

        return res.status(200).json({
            success: true,
            message: `Paper ${submissionId} successfully remapped to ${author.email}`,
            updatedDetails: {
                submissionId,
                oldEmail,
                newEmail: author.email,
                authorName: author.username
            }
        });

    } catch (error) {
        console.error("Error remapping paper email:", error);
        return res.status(500).json({
            success: false,
            message: "Error remapping paper email",
            error: error.message
        });
    }
};
