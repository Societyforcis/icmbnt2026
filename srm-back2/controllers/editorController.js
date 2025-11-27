import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { PaperSubmission } from '../models/Paper.js';
import { ReviewerReview } from '../models/ReviewerReview.js';
import { ReviewerMessage } from '../models/ReviewerMessage.js';
import { generateRandomPassword } from '../utils/helpers.js';
import { sendReviewerAssignmentEmail, sendDecisionEmail, sendReviewerCredentialsEmail, sendReviewerReminderEmail } from '../utils/emailService.js';
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
        const { paperId, reviewerIds, deadlineDays } = req.body;

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

        // Calculate deadline
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + (deadlineDays || 3)); // Default 3 days

        // Create review assignments
        const newAssignments = reviewerIds.map(reviewerId => ({
            reviewer: reviewerId,
            deadline,
            status: 'Pending',
            emailSent: false,
            emailResent: false
        }));

        // Update paper atomically to avoid version conflicts
        const updatedPaper = await PaperSubmission.findByIdAndUpdate(
            paperId,
            {
                $set: {
                    reviewAssignments: newAssignments,
                    assignedReviewers: reviewerIds,
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
                    deadlineDays: deadlineDays || 3,
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
            message: "Reviewers assigned successfully with deadline",
            paper: {
                submissionId: updatedPaper.submissionId,
                paperTitle: updatedPaper.paperTitle,
                status: updatedPaper.status,
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
