import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { PaperSubmission } from '../models/Paper.js';
import { ReviewerReview } from '../models/ReviewerReview.js';
import { ReviewerMessage } from '../models/ReviewerMessage.js';
import { Revision } from '../models/Revision.js';
import { generateRandomPassword } from '../utils/helpers.js';
import { sendReviewerAssignmentEmail, sendDecisionEmail, sendReviewerCredentialsEmail, sendReviewerReminderEmail, sendAcceptanceEmail } from '../utils/emailService.js';
import { listPdfsFromCloudinary, deletePdfFromCloudinary } from '../config/cloudinary-pdf.js';

// Verify editor access - check if user is an editor
export const verifyEditorAccess = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;

        // Check if user has editor role in token
        if (userRole !== 'Editor' && userRole !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only editors can access this resource.'
            });
        }

        // Verify user exists in database with correct role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role !== 'Editor' && user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'User does not have editor privileges'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Editor access verified',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error verifying editor access:', error);
        return res.status(500).json({
            success: false,
            message: 'Error verifying editor access',
            error: error.message
        });
    }
};

// Get editor's assigned papers
export const getAssignedPapers = async (req, res) => {
    try {
        const editorId = req.user.userId;

        const papers = await PaperSubmission.find({ assignedEditor: editorId })
            .populate('assignedReviewers', 'username email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: papers.length,
            papers
        });
    } catch (error) {
        console.error("Error fetching assigned papers:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching assigned papers",
            error: error.message
        });
    }
};

// Create reviewer account
export const createReviewer = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        // Validate required fields
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Use provided password or generate random one
        const userPassword = password || generateRandomPassword();
        const hash = await bcrypt.hash(userPassword, 10);

        const newReviewer = new User({
            username: username || email.split('@')[0],
            email,
            password: hash,
            tempPassword: userPassword,  // Store unhashed temporary password for email
            role: 'Reviewer',
            verified: true // Reviewers are auto-verified
        });

        await newReviewer.save();

        // Send credentials email
        const loginUrl = `${process.env.FRONTEND_URL}/login?email=${encodeURIComponent(email)}`;
        await sendReviewerCredentialsEmail(email, newReviewer.username, userPassword, loginUrl);

        return res.status(201).json({
            success: true,
            message: "Reviewer account created successfully and credentials sent to email",
            reviewer: {
                id: newReviewer._id,
                email: newReviewer.email,
                username: newReviewer.username,
                role: newReviewer.role
            }
        });
    } catch (error) {
        console.error("Error creating reviewer:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating reviewer account",
            error: error.message
        });
    }
};

// Get all reviewers
export const getAllReviewers = async (req, res) => {
    try {
        const { search } = req.query;

        let query = { role: 'Reviewer' };
        if (search) {
            query.$or = [
                { email: new RegExp(search, 'i') },
                { username: new RegExp(search, 'i') }
            ];
        }

        const reviewers = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 });

        // Enrich reviewers with statistics
        const enrichedReviewers = await Promise.all(
            reviewers.map(async (reviewer) => {
                // Get all papers assigned to this reviewer
                const papers = await PaperSubmission.find({
                    'reviewAssignments.reviewer': reviewer._id
                }).select('reviewAssignments status');

                // Count assigned papers
                const assignedPapersCount = papers.length;

                // Get all reviews by this reviewer
                const reviews = await ReviewerReview.find({ reviewer: reviewer._id });
                const completedReviewsCount = reviews.length;

                // Get pending reviews (assigned but not completed)
                let pendingReviewsCount = 0;
                let overdueReviewsCount = 0;
                const now = new Date();

                papers.forEach(paper => {
                    const assignment = paper.reviewAssignments?.find(
                        a => a.reviewer.toString() === reviewer._id.toString()
                    );
                    if (assignment && assignment.status !== 'Completed') {
                        pendingReviewsCount++;
                        if (assignment.deadline && new Date(assignment.deadline) < now) {
                            overdueReviewsCount++;
                        }
                    }
                });

                // Calculate average rating from reviews
                let averageRating = 0;
                if (reviews.length > 0) {
                    const totalRating = reviews.reduce((sum, review) => {
                        return sum + (review.overallRating || 0);
                    }, 0);
                    averageRating = (totalRating / reviews.length).toFixed(1);
                }

                return {
                    _id: reviewer._id,
                    name: reviewer.username || reviewer.email,
                    email: reviewer.email,
                    username: reviewer.username,
                    assignedPapers: assignedPapersCount,
                    completedReviews: completedReviewsCount,
                    pendingReviews: pendingReviewsCount,
                    overdueReviews: overdueReviewsCount,
                    averageRating: parseFloat(averageRating),
                    expertise: reviewer.expertise || [],
                    createdAt: reviewer.createdAt
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: enrichedReviewers.length,
            reviewers: enrichedReviewers
        });
    } catch (error) {
        console.error("Error fetching reviewers:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching reviewers",
            error: error.message
        });
    }
};

// Assign reviewers to paper with deadline tracking
export const assignReviewers = async (req, res) => {
    try {
        const { paperId, reviewerIds, deadlineDays, deadline: deadlineStr } = req.body;

        // Find the paper
        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        // Verify editor owns this paper (skip check if assignedEditor is not set yet)
        if (paper.assignedEditor && paper.assignedEditor.toString() !== req.user.userId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to assign reviewers to this paper"
            });
        }

        // Verify all reviewers exist
        const reviewers = await User.find({
            _id: { $in: reviewerIds },
            role: 'Reviewer'
        });

        if (reviewers.length !== reviewerIds.length) {
            return res.status(400).json({
                success: false,
                message: "One or more reviewer IDs are invalid"
            });
        }

        // Check if any reviewers are already assigned to this paper
        const alreadyAssigned = paper.reviewAssignments || [];
        const alreadyAssignedIds = alreadyAssigned.map(a => a.reviewer?.toString());
        const duplicates = reviewerIds.filter(id => 
            alreadyAssignedIds.includes(id.toString())
        );

        if (duplicates.length > 0) {
            return res.status(400).json({
                success: false,
                message: `${duplicates.length} reviewer(s) already assigned to this paper`
            });
        }

        // Calculate deadline - accept either deadlineDays or deadline date string
        let deadline;
        if (deadlineStr) {
            // Frontend sends date string (YYYY-MM-DD format)
            deadline = new Date(deadlineStr);
            // Set to end of day
            deadline.setHours(23, 59, 59, 999);
        } else {
            // Calculate from days
            deadline = new Date();
            deadline.setDate(deadline.getDate() + (deadlineDays || 14)); // Default 14 days
        }

        // Create review assignments for NEW reviewers only
        const newAssignments = reviewerIds.map(reviewerId => ({
            reviewer: reviewerId,
            deadline,
            status: 'Pending',
            emailSent: false,
            emailResent: false
        }));

        // ADD to existing assignments (not replace)
        const updatedPaper = await PaperSubmission.findByIdAndUpdate(
            paperId,
            {
                $push: {
                    reviewAssignments: { $each: newAssignments }
                },
                $addToSet: {
                    assignedReviewers: { $each: reviewerIds }
                },
                $set: {
                    status: 'Under Review'
                }
            },
            { new: true }
        );

        // Send emails to reviewers AFTER successful database update
        const emailPromises = reviewers.map(reviewer => {
            const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?email=${encodeURIComponent(reviewer.email)}`;

            return sendReviewerAssignmentEmail(
                reviewer.email,
                reviewer.username,
                {
                    submissionId: paper.submissionId,
                    paperTitle: paper.paperTitle,
                    category: paper.category,
                    deadline,
                    deadlineDays: Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)), // Calculate days from deadline
                    loginLink,
                    reviewerName: reviewer.username,
                    reviewerPassword: reviewer.tempPassword || 'Password will be sent separately'
                }
            );
        });

        // Send emails (don't wait for them to complete the request)
        Promise.all(emailPromises)
            .then(() => console.log('Confirmation emails sent successfully'))
            .catch(emailError => console.error("Error sending reviewer assignment emails:", emailError));

        return res.status(200).json({
            success: true,
            message: `${reviewerIds.length} reviewer(s) added successfully. Total: ${updatedPaper.reviewAssignments.length}`,
            paper: {
                submissionId: updatedPaper.submissionId,
                paperTitle: updatedPaper.paperTitle,
                status: updatedPaper.status,
                totalReviewers: updatedPaper.reviewAssignments.length,
                reviewAssignments: updatedPaper.reviewAssignments.map(a => ({
                    reviewer: a.reviewer,
                    deadline: a.deadline,
                    status: a.status
                }))
            }
        });
    } catch (error) {
        console.error("Error assigning reviewers:", error);
        return res.status(500).json({
            success: false,
            message: "Error assigning reviewers",
            error: error.message
        });
    }
};

// Get reviews for a paper
export const getPaperReviews = async (req, res) => {
    try {
        const { paperId } = req.params;

        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        // Verify editor owns this paper (or is Admin)
        if (paper.assignedEditor && paper.assignedEditor.toString() !== req.user.userId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view reviews for this paper"
            });
        }

        const reviews = await ReviewerReview.find({ paper: paperId })
            .populate('reviewer', 'username email');

        return res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching reviews",
            error: error.message
        });
    }
};

// Make final decision on paper
export const makeFinalDecision = async (req, res) => {
    try {
        const { paperId, decision, comments, corrections } = req.body;

        // Validate decision
        const validDecisions = ['Accept', 'Conditionally Accept', 'Revise & Resubmit', 'Reject'];
        if (!validDecisions.includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Invalid decision. Must be one of: " + validDecisions.join(', ')
            });
        }

        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        // Verify editor owns this paper
        if (paper.assignedEditor.toString() !== req.user.userId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to make decisions on this paper"
            });
        }

        // Update paper with decision
        paper.finalDecision = decision;
        paper.editorComments = comments || '';
        paper.editorCorrections = corrections || '';

        // Update status based on decision
        const statusMap = {
            'Accept': 'Accepted',
            'Conditionally Accept': 'Conditionally Accept',
            'Revise & Resubmit': 'Revision Required',
            'Reject': 'Rejected'
        };

        paper.status = statusMap[decision];
        await paper.save();

        // Send decision email to author
        try {
            await sendDecisionEmail(paper.email, paper.authorName, {
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                decision,
                comments,
                corrections
            });
        } catch (emailError) {
            console.error("Error sending decision email:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Decision submitted successfully",
            paper
        });
    } catch (error) {
        console.error("Error making final decision:", error);
        return res.status(500).json({
            success: false,
            message: "Error making final decision",
            error: error.message
        });
    }
};

// Get editor dashboard statistics
export const getEditorDashboardStats = async (req, res) => {
    try {
        const editorId = req.user.userId;

        const totalAssigned = await PaperSubmission.countDocuments({ assignedEditor: editorId });
        const needsAssignment = await PaperSubmission.countDocuments({
            assignedEditor: editorId,
            assignedReviewers: { $size: 0 }
        });
        const underReview = await PaperSubmission.countDocuments({
            assignedEditor: editorId,
            status: 'Under Review'
        });
        const awaitingDecision = await PaperSubmission.countDocuments({
            assignedEditor: editorId,
            status: 'Review Received'
        });

        // Get papers by status
        const papersByStatus = await PaperSubmission.aggregate([
            {
                $match: { assignedEditor: editorId }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get papers requiring action
        const papersRequiringAction = await PaperSubmission.find({
            assignedEditor: editorId,
            $or: [
                { assignedReviewers: { $size: 0 } },
                { status: 'Review Received' }
            ]
        }).limit(10);

        return res.status(200).json({
            success: true,
            stats: {
                totalAssigned,
                needsAssignment,
                underReview,
                awaitingDecision,
                papersByStatus,
                papersRequiringAction
            }
        });
    } catch (error) {
        console.error("Error fetching editor dashboard stats:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard statistics",
            error: error.message
        });
    }
};

// ✅ Get ALL papers (not just assigned) - for editor dashboard
export const getAllPapers = async (req, res) => {
    try {
        const { status, category, search } = req.query;
        let query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { submissionId: new RegExp(search, 'i') },
                { paperTitle: new RegExp(search, 'i') },
                { authorName: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }

        // Exclude pdfBase64 and versions from list view (too large)
        const papers = await PaperSubmission.find(query)
            .select('-pdfBase64 -versions')
            .populate('assignedEditor', 'username email')
            .populate('assignedReviewers', 'username email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: papers.length,
            papers
        });
    } catch (error) {
        console.error("Error fetching all papers:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching papers",
            error: error.message
        });
    }
};

// ✅ Get PDF as Base64 for viewing
export const getPdfBase64 = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const editorId = req.user.userId;

        // Find paper by submission ID
        const paper = await PaperSubmission.findOne({ submissionId });

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        // Support both Cloudinary URLs (new) and Base64 (legacy)
        const pdfUrl = paper.pdfUrl || (paper.pdfBase64 ? `data:application/pdf;base64,${paper.pdfBase64}` : null);
        
        if (!pdfUrl) {
            return res.status(404).json({
                success: false,
                message: 'PDF not found for this paper'
            });
        }

        // Return PDF URL (Cloudinary or Base64 data URL for backward compatibility)
        return res.status(200).json({
            success: true,
            submissionId,
            pdfUrl,
            pdfFileName: paper.pdfFileName,
            paperTitle: paper.paperTitle,
            authorName: paper.authorName,
            email: paper.email,
            category: paper.category,
            topic: paper.topic,
            status: paper.status,
            message: 'PDF fetched successfully'
        });
    } catch (error) {
        console.error('Error getting PDF:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching PDF',
            error: error.message
        });
    }
};

// Get reviewer details with all submitted reviews
export const getReviewerDetails = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const editorId = req.user.userId;

        // Get review with reviewer details
        const review = await ReviewerReview.findById(reviewId)
            .populate('reviewer', 'username email')
            .populate('paper', 'submissionId authorName email title paperTitle');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        return res.status(200).json({
            success: true,
            review,
            paper: review.paper,
            reviewer: review.reviewer
        });
    } catch (error) {
        console.error('Error getting reviewer details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching reviewer details',
            error: error.message
        });
    }
};

// Send message to reviewer or author
export const sendMessage = async (req, res) => {
    try {
        const { submissionId, reviewId, recipientType, message } = req.body;
        // recipientType: 'reviewer' or 'author'
        const editorId = req.user.userId;
        const editor = await User.findById(editorId);

        if (!editor || (editor.role !== 'Editor' && editor.role !== 'Admin')) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Get review and paper (submissionId is a string like "BU001")
        const review = await ReviewerReview.findById(reviewId);
        const paper = await PaperSubmission.findOne({ submissionId });

        if (!review || !paper) {
            return res.status(404).json({ success: false, message: 'Review or paper not found' });
        }

        // Find or create message thread
        let messageThread = await ReviewerMessage.findOne({
            submissionId,
            reviewId
        });

        if (!messageThread) {
            messageThread = new ReviewerMessage({
                submissionId,
                reviewId,
                reviewerId: review.reviewer,
                editorId,
                authorId: paper.authorId || paper.email
            });
        }

        // Add message to conversation
        const newMessage = {
            sender: 'editor',
            senderId: editorId,
            senderName: editor.username || editor.email,
            senderEmail: editor.email,
            message
        };

        messageThread.conversation.push(newMessage);

        // Mark which conversation is active
        if (recipientType === 'reviewer') {
            messageThread.editorReviewerConversation = true;
        } else if (recipientType === 'author') {
            messageThread.editorAuthorConversation = true;
        }

        messageThread.lastMessageAt = new Date();
        await messageThread.save();

        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            messageThread
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};

// Get message thread for a review
export const getMessageThread = async (req, res) => {
    try {
        const { submissionId, reviewId } = req.params;

        const messageThread = await ReviewerMessage.findOne({
            submissionId,
            reviewId
        })
            .populate('reviewerId', 'username email')
            .populate('editorId', 'username email')
            .populate('authorId', 'username email');

        if (!messageThread) {
            // Return empty thread if not found yet
            return res.status(200).json({
                success: true,
                messageThread: {
                    conversation: [],
                    editorReviewerConversation: false,
                    editorAuthorConversation: false
                }
            });
        }

        return res.status(200).json({
            success: true,
            messageThread
        });
    } catch (error) {
        console.error('Error getting message thread:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

// Get all message threads for a paper
export const getPaperMessages = async (req, res) => {
    try {
        const { paperId } = req.params;

        const messages = await ReviewerMessage.find({ submissionId: paperId })
            .populate('reviewerId', 'username email')
            .populate('editorId', 'username email')
            .sort({ lastMessageAt: -1 });

        return res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error getting paper messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

// Get all messages for the editor (for Messages tab)
export const getAllMessages = async (req, res) => {
    try {
        const editorId = req.user.userId;

        // Get all message threads
        const messages = await ReviewerMessage.find()
            .populate('reviewerId', 'username email')
            .populate('editorId', 'username email')
            .populate('reviewId', 'comments')
            .sort({ lastMessageAt: -1 })
            .limit(100);

        // Get paper details for each message based on submissionId
        const enrichedMessages = await Promise.all(
            messages.map(async (msg) => {
                const paper = await PaperSubmission.findOne({ submissionId: msg.submissionId })
                    .select('submissionId paperTitle');
                return {
                    ...msg.toObject(),
                    paperDetails: paper || null
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: enrichedMessages.length,
            messages: enrichedMessages
        });
    } catch (error) {
        console.error('Error getting all messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

// Get non-responding reviewers
export const getNonRespondingReviewers = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get all papers assigned to this editor
        const papers = await PaperSubmission.find({ assignedEditor: userId })
            .populate('reviewAssignments')
            .select('submissionId paperTitle reviewAssignments');

        if (!papers || papers.length === 0) {
            return res.status(200).json({
                success: true,
                reviewers: []
            });
        }

        const nonResponders = [];

        for (const paper of papers) {
            if (!paper.reviewAssignments) continue;

            for (const assignment of paper.reviewAssignments) {
                // Check if this reviewer has submitted a review
                const review = await ReviewerReview.findOne({
                    paper: paper._id,
                    reviewer: assignment.reviewerId
                });

                if (!review) {
                    // This reviewer hasn't responded yet
                    const reviewer = await User.findById(assignment.reviewerId);
                    if (reviewer) {
                        const now = new Date();
                        const deadline = new Date(assignment.deadline || Date.now() + 14 * 24 * 60 * 60 * 1000);
                        const daysUntilDeadline = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));

                        nonResponders.push({
                            _id: assignment._id,
                            submissionId: paper.submissionId,
                            paperTitle: paper.paperTitle,
                            reviewerId: reviewer._id,
                            reviewerName: reviewer.username || reviewer.email,
                            reviewerEmail: reviewer.email,
                            daysUntilDeadline,
                            reminderCount: assignment.reminderCount || 0,
                            lastReminderSent: assignment.lastReminderSent
                        });
                    }
                }
            }
        }

        // Sort by daysUntilDeadline (overdue first)
        nonResponders.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);

        return res.status(200).json({
            success: true,
            reviewers: nonResponders
        });
    } catch (error) {
        console.error('Error getting non-responding reviewers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching non-responding reviewers',
            error: error.message
        });
    }
};

// Send reminder email to a reviewer
export const sendReviewerReminder = async (req, res) => {
    try {
        const { submissionId, reviewerId, reviewerEmail } = req.body;

        if (!submissionId || !reviewerId || !reviewerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get paper submission
        const paper = await PaperSubmission.findOne({ submissionId })
            .populate('reviewAssignments');

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        // Find the specific assignment
        let assignment = paper.reviewAssignments?.find(
            a => a.reviewerId?.toString() === reviewerId.toString()
        );

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Reviewer assignment not found'
            });
        }

        // Get reviewer details
        const reviewer = await User.findById(reviewerId);
        if (!reviewer) {
            return res.status(404).json({
                success: false,
                message: 'Reviewer not found'
            });
        }

        // Calculate days remaining
        const now = new Date();
        const deadline = new Date(assignment.deadline || Date.now() + 14 * 24 * 60 * 60 * 1000);
        const daysRemaining = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));

        // Build review link
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const reviewLink = `${frontendUrl}/review/${paper._id}`;

        // Send reminder email
        await sendReviewerReminderEmail(
            reviewerEmail,
            reviewer.username || reviewer.email,
            paper.paperTitle,
            assignment.reminderCount || 0,
            reviewLink,
            daysRemaining
        );

        // Update assignment with reminder count and timestamp
        assignment.reminderCount = (assignment.reminderCount || 0) + 1;
        assignment.lastReminderSent = now;

        // Update the paper with the modified assignment
        await PaperSubmission.findByIdAndUpdate(
            paper._id,
            { reviewAssignments: paper.reviewAssignments },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Reminder sent successfully',
            reminderCount: assignment.reminderCount,
            lastReminderSent: assignment.lastReminderSent
        });
    } catch (error) {
        console.error('Error sending reminder:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending reminder',
            error: error.message
        });
    }
};

// Send bulk reminders to multiple reviewers
export const sendBulkReminders = async (req, res) => {
    try {
        const { reminders } = req.body;

        if (!reminders || !Array.isArray(reminders) || reminders.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reminders array'
            });
        }

        const results = {
            success: [],
            failed: []
        };

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        for (const reminder of reminders) {
            try {
                const { submissionId, reviewerId, reviewerEmail } = reminder;

                // Get paper submission
                const paper = await PaperSubmission.findOne({ submissionId })
                    .populate('reviewAssignments');

                if (!paper) {
                    results.failed.push({
                        submissionId,
                        reviewerId,
                        reason: 'Paper not found'
                    });
                    continue;
                }

                // Find the specific assignment
                let assignment = paper.reviewAssignments?.find(
                    a => a.reviewerId?.toString() === reviewerId.toString()
                );

                if (!assignment) {
                    results.failed.push({
                        submissionId,
                        reviewerId,
                        reason: 'Assignment not found'
                    });
                    continue;
                }

                // Get reviewer details
                const reviewer = await User.findById(reviewerId);
                if (!reviewer) {
                    results.failed.push({
                        submissionId,
                        reviewerId,
                        reason: 'Reviewer not found'
                    });
                    continue;
                }

                // Calculate days remaining
                const now = new Date();
                const deadline = new Date(assignment.deadline || Date.now() + 14 * 24 * 60 * 60 * 1000);
                const daysRemaining = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));

                // Build review link
                const reviewLink = `${frontendUrl}/review/${paper._id}`;

                // Send reminder email
                await sendReviewerReminderEmail(
                    reviewerEmail,
                    reviewer.username || reviewer.email,
                    paper.paperTitle,
                    assignment.reminderCount || 0,
                    reviewLink,
                    daysRemaining
                );

                // Update assignment
                assignment.reminderCount = (assignment.reminderCount || 0) + 1;
                assignment.lastReminderSent = now;

                // Update the paper
                await PaperSubmission.findByIdAndUpdate(
                    paper._id,
                    { reviewAssignments: paper.reviewAssignments },
                    { new: true }
                );

                results.success.push({
                    submissionId,
                    reviewerId,
                    reminderCount: assignment.reminderCount
                });
            } catch (error) {
                results.failed.push({
                    submissionId: reminder.submissionId,
                    reviewerId: reminder.reviewerId,
                    reason: error.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Sent ${results.success.length} reminders, ${results.failed.length} failed`,
            results
        });
    } catch (error) {
        console.error('Error sending bulk reminders:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending bulk reminders',
            error: error.message
        });
    }
};

// Get all PDFs from Cloudinary
export const getAllPdfs = async (req, res) => {
    try {
        const pdfs = await listPdfsFromCloudinary();
        
        // Enrich with local database info if available
        const enrichedPdfs = pdfs.map(pdf => {
            const fileName = pdf.public_id.split('/').pop(); // Extract filename from public_id
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

// Delete PDF from Cloudinary
export const deletePdf = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'publicId is required'
            });
        }

        // Delete from Cloudinary
        await deletePdfFromCloudinary(publicId);

        // Also remove from database if it exists
        try {
            await PaperSubmission.updateMany(
                { pdfPublicId: publicId },
                { $unset: { pdfUrl: "", pdfPublicId: "" } }
            );
        } catch (dbError) {
            console.log('Note: PDF not found in database, but deleted from Cloudinary');
        }

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

// Send message to reviewer via email
export const sendMessageToReviewer = async (req, res) => {
    try {
        const { reviewerEmail, reviewerName, submissionId, message } = req.body;
        const editorId = req.user.userId;

        // Validate inputs
        if (!reviewerEmail || !message || !submissionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: reviewerEmail, message, submissionId'
            });
        }

        // Get editor info
        const editor = await User.findById(editorId);
        if (!editor || (editor.role !== 'Editor' && editor.role !== 'Admin')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get paper info
        const paper = await PaperSubmission.findOne({ submissionId });
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        // Send email to reviewer with editor's message
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: reviewerEmail,
            subject: `Message from Editor - Paper ${submissionId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #1a5490;">Message from Editor</h2>
                        <p style="margin: 5px 0 0 0; color: #666;">ICMBNT 2026 Conference</p>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Dear <strong>${reviewerName}</strong>,
                    </p>

                    <p style="font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 15px;">
                        The editor has sent you a message regarding your review:
                    </p>

                    <div style="background-color: #e8f4f8; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; line-height: 1.8; color: #333;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>

                    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 3px solid #999;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #666;">Paper Information:</p>
                        <table style="width: 100%; font-size: 13px;">
                            <tr>
                                <td style="padding: 5px 0; font-weight: bold; width: 120px;">Submission ID:</td>
                                <td style="padding: 5px 0;">${submissionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; font-weight: bold;">Paper Title:</td>
                                <td style="padding: 5px 0;">${paper.paperTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; font-weight: bold;">Editor:</td>
                                <td style="padding: 5px 0;">${editor.username || editor.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; font-weight: bold;">Editor Email:</td>
                                <td style="padding: 5px 0;">${editor.email}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size: 13px; color: #666; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd;">
                        If you have any questions, please feel free to reply to this email or contact the editor directly.
                    </p>

                    <p style="font-size: 12px; color: #999; margin-top: 15px;">
                        Best regards,<br>
                        ICMBNT 2026 Conference Management System
                    </p>
                </div>
            `
        };

        // Import nodemailer
        const { sendReviewerAssignmentEmail } = await import('../utils/emailService.js');
        
        // Send using direct nodemailer setup from emailService
        const nodemailer = (await import('nodemailer')).default;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Message sent to reviewer successfully',
            reviewerEmail
        });
    } catch (error) {
        console.error('Error sending message to reviewer:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending message to reviewer',
            error: error.message
        });
    }
};

// Send message to author via email
export const sendMessageToAuthor = async (req, res) => {
    try {
        const { submissionId, authorEmail, authorName, message } = req.body;
        const editorId = req.user.userId;

        // Validate inputs
        if (!authorEmail || !message || !submissionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: authorEmail, message, submissionId'
            });
        }

        // Get editor info
        const editor = await User.findById(editorId);
        if (!editor || (editor.role !== 'Editor' && editor.role !== 'Admin')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get paper info
        const paper = await PaperSubmission.findOne({ submissionId });
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        // Send email to author with editor's message
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: authorEmail,
            subject: `Message from Editor - Paper ${submissionId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #1a5490;">Message from Editor</h2>
                        <p style="margin: 5px 0 0 0; color: #666;">ICMBNT 2026 Conference</p>
                    </div>

                    <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                        Dear <strong>${authorName}</strong>,
                    </p>

                    <p style="font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 15px;">
                        The editor has sent you a message regarding your submission:
                    </p>

                    <div style="background-color: #e8f4f8; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; line-height: 1.8; color: #333;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>

                    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 3px solid #999;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #666;">Paper Information:</p>
                        <table style="width: 100%; font-size: 13px;">
                            <tr>
                                <td style="padding: 5px 0; font-weight: bold; width: 120px;">Submission ID:</td>
                                <td style="padding: 5px 0;">${submissionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; font-weight: bold;">Paper Title:</td>
                                <td style="padding: 5px 0;">${paper.paperTitle}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; font-weight: bold;">Editor:</td>
                                <td style="padding: 5px 0;">${editor.username || editor.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0; font-weight: bold;">Editor Email:</td>
                                <td style="padding: 5px 0;">${editor.email}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="font-size: 13px; color: #666; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd;">
                        If you have any questions or need clarification, please feel free to reply to this email or contact the editor directly.
                    </p>

                    <p style="font-size: 12px; color: #999; margin-top: 15px;">
                        Best regards,<br>
                        ICMBNT 2026 Conference Management System
                    </p>
                </div>
            `
        };

        // Send using nodemailer
        const nodemailer = (await import('nodemailer')).default;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Message sent to author successfully',
            authorEmail
        });
    } catch (error) {
        console.error('Error sending message to author:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending message to author',
            error: error.message
        });
    }
};

// Request revision from author with all reviewer comments
export const requestRevision = async (req, res) => {
    try {
        const { paperId, revisionMessage } = req.body;
        const editorId = req.user.userId;

        console.log('📋 Request Revision - Input:', { paperId, editorId, messageLength: revisionMessage?.length });
        console.log('🔐 User info:', { role: req.user.role, userId: req.user.userId, email: req.user.email });

        // Validate inputs
        if (!paperId || !revisionMessage) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: paperId, revisionMessage'
            });
        }

        // Get paper
        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        console.log('📄 Paper found:', { paperId, title: paper.paperTitle, authorEmail: paper.email, assignedEditor: paper.assignedEditor });

        // Verify editor has permission
        console.log('🔍 Permission check:', { 
            hasAssignedEditor: !!paper.assignedEditor, 
            editorIdMatch: paper.assignedEditor?.toString() === editorId,
            isAdmin: req.user.role === 'Admin'
        });

        if (paper.assignedEditor && paper.assignedEditor.toString() !== editorId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to request revision for this paper'
            });
        }

        // Check if paper has at least 3 reviews
        console.log('🔍 Searching for reviews with paperId:', paperId);
        const reviews = await ReviewerReview.find({ paper: paperId })
            .populate('reviewer', 'username email');

        console.log(`✓ Found ${reviews.length} review(s)`);

        if (reviews.length < 3) {
            return res.status(400).json({
                success: false,
                message: `Cannot request revision. Paper needs 3 reviews minimum. Currently has ${reviews.length} review(s).`
            });
        }

        // Log review details
        reviews.forEach((r, i) => {
            console.log(`  Review ${i + 1}: ${r.reviewer.username} - ${r.recommendation}`);
        });

        // Get editor info
        const editor = await User.findById(editorId);
        if (!editor) {
            return res.status(404).json({
                success: false,
                message: 'Editor not found'
            });
        }

        console.log('👤 Editor:', editor.username);

        // Create or update revision record
        let revision = await Revision.findOne({ paperId });

        if (!revision) {
            // Calculate revision deadline (14 days from now)
            const revisionDeadline = new Date();
            revisionDeadline.setDate(revisionDeadline.getDate() + 14);

            revision = new Revision({
                submissionId: paper.submissionId,
                paperId: paper._id,
                authorEmail: paper.email,
                authorName: paper.authorName,
                editorEmail: editor.email,
                editorName: editor.username,
                revisionDeadline,
                revisionMessage,
                reviewerComments: reviews.map(review => ({
                    reviewerId: review.reviewer._id,
                    reviewerName: review.reviewer.username || 'Reviewer',
                    reviewerEmail: review.reviewer.email,
                    comments: review.comments || '',
                    strengths: review.strengths || '',
                    weaknesses: review.weaknesses || '',
                    overallRating: review.overallRating || 0,
                    noveltyRating: review.noveltyRating || 0,
                    qualityRating: review.qualityRating || 0,
                    clarityRating: review.clarityRating || 0,
                    recommendation: review.recommendation || ''
                }))
            });
        } else {
            // Update existing revision
            revision.revisionMessage = revisionMessage;
            revision.reviewerComments = reviews.map(review => ({
                reviewerId: review.reviewer._id,
                reviewerName: review.reviewer.username || 'Reviewer',
                reviewerEmail: review.reviewer.email,
                comments: review.comments || '',
                strengths: review.strengths || '',
                weaknesses: review.weaknesses || '',
                overallRating: review.overallRating || 0,
                noveltyRating: review.noveltyRating || 0,
                qualityRating: review.qualityRating || 0,
                clarityRating: review.clarityRating || 0,
                recommendation: review.recommendation || ''
            }));
            revision.revisionRound = (revision.revisionRound || 1) + 1;
        }

        await revision.save();
        console.log('✅ Revision record saved');

        // Update paper status
        paper.status = 'Revision Required';
        paper.finalDecision = 'Revise & Resubmit';
        await paper.save();
        console.log('✅ Paper status updated to "Revision Required"');

        // Send revision request email to author with all reviewer comments
        try {
            const nodemailer = (await import('nodemailer')).default;
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            // Build reviewer comments HTML
            let reviewerCommentsHtml = '';
            revision.reviewerComments.forEach((comment, index) => {
                reviewerCommentsHtml += `
                    <div style="margin-bottom: 25px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #0066cc; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #0066cc;">Reviewer ${index + 1} Comments:</p>
                        
                        <div style="margin: 10px 0;">
                            <strong>Recommendation:</strong> ${comment.recommendation || 'N/A'}<br>
                            <strong>Overall Rating:</strong> ${comment.overallRating || 'N/A'} / 5
                        </div>
                        
                        <div style="margin: 10px 0;">
                            <strong>Strengths:</strong><br>
                            ${comment.strengths ? comment.strengths.replace(/\n/g, '<br>') : 'N/A'}
                        </div>
                        
                        <div style="margin: 10px 0;">
                            <strong>Weaknesses:</strong><br>
                            ${comment.weaknesses ? comment.weaknesses.replace(/\n/g, '<br>') : 'N/A'}
                        </div>
                        
                        <div style="margin: 10px 0;">
                            <strong>Detailed Comments:</strong><br>
                            ${comment.comments ? comment.comments.replace(/\n/g, '<br>') : 'N/A'}
                        </div>
                    </div>
                `;
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: paper.email,
                subject: `Revision Required - Paper ${paper.submissionId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #333;">
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #d9534f;">Revision Required</h2>
                            <p style="margin: 5px 0 0 0; color: #666;">ICMBNT 2026 Conference</p>
                        </div>

                        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                            Dear <strong>${paper.authorName}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 15px;">
                            Thank you for submitting your paper to ICMBNT 2026. After careful review by our expert panel, 
                            we have decided that your paper requires <strong>revision before it can be accepted</strong>.
                        </p>

                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; font-weight: bold; color: #856404;">Revision Deadline: ${new Date(revision.revisionDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>

                        <h3 style="color: #0066cc; margin-top: 25px; margin-bottom: 15px;">Editor's Message:</h3>
                        <div style="background-color: #e8f4f8; border-left: 4px solid #0066cc; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 14px; line-height: 1.8; color: #333;">
                            ${revisionMessage.replace(/\n/g, '<br>')}
                        </div>

                        <h3 style="color: #0066cc; margin-top: 25px; margin-bottom: 15px;">Reviewer Comments & Feedback:</h3>
                        ${reviewerCommentsHtml}

                        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 3px solid #999;">
                            <p style="margin: 0 0 10px 0; font-weight: bold; color: #666;">Paper Information:</p>
                            <table style="width: 100%; font-size: 13px;">
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold; width: 130px;">Submission ID:</td>
                                    <td style="padding: 5px 0;">${paper.submissionId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Paper Title:</td>
                                    <td style="padding: 5px 0;">${paper.paperTitle}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Revision Round:</td>
                                    <td style="padding: 5px 0;">${revision.revisionRound}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="font-size: 14px; line-height: 1.6; color: #555; margin: 20px 0;">
                            Please submit your revised paper through the conference management system before the deadline.
                            When submitting, please include a response document addressing all reviewer comments.
                        </p>

                        <p style="font-size: 13px; color: #666; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd;">
                            If you have any questions, please reply to this email or contact the editor.
                        </p>

                        <p style="font-size: 12px; color: #999; margin-top: 15px;">
                            Best regards,<br>
                            <strong>${editor.username}</strong><br>
                            Editor, ICMBNT 2026 Conference<br>
                            <a href="mailto:${editor.email}">${editor.email}</a>
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log('📧 Revision request email sent to:', paper.email);
        } catch (emailError) {
            console.error('⚠️ Error sending revision request email:', emailError);
            // Don't fail if email fails
        }

        return res.status(200).json({
            success: true,
            message: 'Revision request sent to author successfully',
            revision
        });
    } catch (error) {
        console.error('❌ Error requesting revision:', error);
        return res.status(500).json({
            success: false,
            message: 'Error requesting revision',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Accept paper - Send acceptance email with conference dates
export const acceptPaper = async (req, res) => {
    try {
        const { paperId } = req.body;
        const editorId = req.user.userId;

        // Validate paper exists
        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        // Update paper status to Accepted
        paper.status = 'Accepted';
        paper.decisionDate = new Date();
        await paper.save();

        console.log('✅ Paper accepted:', {
            paperId,
            title: paper.paperTitle,
            authorEmail: paper.email
        });

        // Send acceptance email to author
        try {
            await sendAcceptanceEmail(paper.email, paper.authorName, paper.paperTitle, paper.submissionId);
        } catch (emailError) {
            console.error('⚠️ Error sending acceptance email:', emailError);
            // Don't fail if email fails
        }

        return res.status(200).json({
            success: true,
            message: 'Paper accepted successfully. Acceptance email sent to author.',
            paper: {
                _id: paper._id,
                submissionId: paper.submissionId,
                title: paper.paperTitle,
                status: paper.status
            }
        });
    } catch (error) {
        console.error('❌ Error accepting paper:', error);
        return res.status(500).json({
            success: false,
            message: 'Error accepting paper',
            error: error.message
        });
    }
};

// Get revision status for author
export const getRevisionStatus = async (req, res) => {
    try {
        const authorEmail = req.user.email;

        const revision = await Revision.findOne({ authorEmail })
            .populate('reviewerComments.reviewerId', 'username email');

        if (!revision) {
            return res.status(404).json({
                success: false,
                message: 'No revision found'
            });
        }

        return res.status(200).json({
            success: true,
            revision
        });
    } catch (error) {
        console.error('Error fetching revision status:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching revision status',
            error: error.message
        });
    }
};

// Submit revised paper
export const submitRevisedPaper = async (req, res) => {
    try {
        const { submissionId, revisedPdfUrl, revisedPdfPublicId, revisedPdfFileName, authorResponse } = req.body;
        const authorEmail = req.user.email;

        // Validate inputs
        if (!submissionId || !revisedPdfUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: submissionId, revisedPdfUrl'
            });
        }

        // Get revision record
        const revision = await Revision.findOne({ submissionId, authorEmail });
        if (!revision) {
            return res.status(404).json({
                success: false,
                message: 'Revision record not found'
            });
        }

        // Update revision with revised paper
        revision.revisedPdfUrl = revisedPdfUrl;
        revision.revisedPdfPublicId = revisedPdfPublicId;
        revision.revisedPdfFileName = revisedPdfFileName;
        revision.authorResponse = authorResponse || '';
        revision.revisedPaperSubmittedAt = new Date();
        revision.revisionStatus = 'Resubmitted';
        await revision.save();

        // Update paper with revised PDF
        const paper = await PaperSubmission.findOne({ submissionId });
        if (paper) {
            paper.pdfUrl = revisedPdfUrl;
            paper.pdfPublicId = revisedPdfPublicId;
            paper.pdfFileName = revisedPdfFileName;
            paper.status = 'Revised Submitted';
            paper.revisionCount = (paper.revisionCount || 0) + 1;
            await paper.save();
        }

        // Send confirmation email
        try {
            const nodemailer = (await import('nodemailer')).default;
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: authorEmail,
                subject: `Revised Paper Received - ${submissionId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #28a745;">Revised Paper Received</h2>
                            <p style="margin: 5px 0 0 0; color: #666;">ICMBNT 2026 Conference</p>
                        </div>

                        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                            Dear <strong>${revision.authorName}</strong>,
                        </p>

                        <p style="font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 15px;">
                            Thank you for submitting your revised paper. We have received it and it is now under review.
                            Our editorial team will review your revisions and provide further updates.
                        </p>

                        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 3px solid #999;">
                            <p style="margin: 0 0 10px 0; font-weight: bold; color: #666;">Paper Information:</p>
                            <table style="width: 100%; font-size: 13px;">
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold; width: 130px;">Submission ID:</td>
                                    <td style="padding: 5px 0;">${submissionId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Status:</td>
                                    <td style="padding: 5px 0;">Revised Submitted</td>
                                </tr>
                                <tr>
                                    <td style="padding: 5px 0; font-weight: bold;">Received At:</td>
                                    <td style="padding: 5px 0;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="font-size: 14px; line-height: 1.6; color: #555; margin: 20px 0;">
                            You will receive another update once the review process is complete.
                        </p>

                        <p style="font-size: 13px; color: #666; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd;">
                            Best regards,<br>
                            ICMBNT 2026 Conference Management System
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
        }

        return res.status(200).json({
            success: true,
            message: 'Revised paper submitted successfully',
            revision
        });
    } catch (error) {
        console.error('Error submitting revised paper:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting revised paper',
            error: error.message
        });
    }
};

// Delete/Remove a reviewer from paper assignment
export const removeReviewerFromPaper = async (req, res) => {
    try {
        const { paperId, reviewerId } = req.body;

        if (!paperId || !reviewerId) {
            return res.status(400).json({
                success: false,
                message: "Paper ID and Reviewer ID are required"
            });
        }

        // Find the paper
        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        // Verify editor owns this paper
        if (paper.assignedEditor && paper.assignedEditor.toString() !== req.user.userId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to modify reviewers for this paper"
            });
        }

        // Remove reviewer from assignment
        paper.reviewAssignments = paper.reviewAssignments.filter(
            a => a.reviewer.toString() !== reviewerId
        );
        paper.assignedReviewers = paper.assignedReviewers.filter(
            r => r.toString() !== reviewerId
        );

        await paper.save();

        // Delete associated review if exists
        const review = await ReviewerReview.findOneAndDelete({
            paper: paperId,
            reviewer: reviewerId
        });

        // Send notification email to editor
        try {
            const editor = await User.findById(paper.assignedEditor);
            const reviewer = await User.findById(reviewerId);
            
            if (editor && reviewer) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: editor.email,
                    subject: `Reviewer Removed - ${paper.paperTitle}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Reviewer Removed from Paper Assignment</h2>
                            <p>A reviewer has been removed from the following paper:</p>
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Reviewer:</td>
                                    <td style="padding: 8px;">${reviewer.username} (${reviewer.email})</td>
                                </tr>
                                <tr style="background-color: #f5f5f5;">
                                    <td style="padding: 8px; font-weight: bold;">Paper:</td>
                                    <td style="padding: 8px;">${paper.paperTitle}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Submission ID:</td>
                                    <td style="padding: 8px;">${paper.submissionId}</td>
                                </tr>
                                <tr style="background-color: #f5f5f5;">
                                    <td style="padding: 8px; font-weight: bold;">Remaining Reviewers:</td>
                                    <td style="padding: 8px;">${paper.reviewAssignments.length}</td>
                                </tr>
                            </table>
                            <p style="color: #666; font-size: 13px;">If a review was already submitted, it has been deleted from the system.</p>
                        </div>
                    `
                };
                
                const transporter = require('nodemailer').createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });
                
                await transporter.sendMail(mailOptions);
            }
        } catch (emailError) {
            console.error('Error sending reviewer removal notification:', emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Reviewer removed successfully",
            remainingReviewers: paper.reviewAssignments.length,
            updatedPaper: paper
        });
    } catch (error) {
        console.error('Error removing reviewer:', error);
        return res.status(500).json({
            success: false,
            message: "Error removing reviewer",
            error: error.message
        });
    }
};

// Send query/inquiry to reviewer
export const sendReviewerInquiry = async (req, res) => {
    try {
        const { paperId, reviewerId, message } = req.body;

        if (!paperId || !reviewerId || !message) {
            return res.status(400).json({
                success: false,
                message: "Paper ID, Reviewer ID, and message are required"
            });
        }

        const paper = await PaperSubmission.findById(paperId);
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        // Verify editor owns this paper
        if (paper.assignedEditor && paper.assignedEditor.toString() !== req.user.userId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to send inquiries for this paper"
            });
        }

        const reviewer = await User.findById(reviewerId);
        if (!reviewer) {
            return res.status(404).json({
                success: false,
                message: "Reviewer not found"
            });
        }

        const editor = await User.findById(paper.assignedEditor);

        // Send email to reviewer
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: reviewer.email,
                subject: `Review Status Inquiry - ${paper.paperTitle}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Review Status Inquiry</h2>
                        <p>Hello ${reviewer.username},</p>
                        <p>The editor has sent you the following message regarding your review assignment:</p>
                        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                            <p style="margin: 0; color: #333;">${message.replace(/\n/g, '<br>')}</p>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr>
                                <td style="padding: 8px; font-weight: bold;">Paper:</td>
                                <td style="padding: 8px;">${paper.paperTitle}</td>
                            </tr>
                            <tr style="background-color: #f5f5f5;">
                                <td style="padding: 8px; font-weight: bold;">Submission ID:</td>
                                <td style="padding: 8px;">${paper.submissionId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold;">Editor:</td>
                                <td style="padding: 8px;">${editor?.username || 'ICMBNT 2026 Editor'}</td>
                            </tr>
                        </table>
                        <p style="color: #666; font-size: 13px;">Please login to the system to submit your review or contact the editor if you have questions.</p>
                    </div>
                `
            };

            const transporter = require('nodemailer').createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Error sending inquiry email:', emailError);
        }

        return res.status(200).json({
            success: true,
            message: "Inquiry sent to reviewer successfully",
            reviewerEmail: reviewer.email
        });
    } catch (error) {
        console.error('Error sending inquiry:', error);
        return res.status(500).json({
            success: false,
            message: "Error sending inquiry",
            error: error.message
        });
    }
};

