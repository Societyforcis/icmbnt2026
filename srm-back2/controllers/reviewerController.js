import { PaperSubmission } from '../models/Paper.js';
import { ReviewerReview } from '../models/ReviewerReview.js';
import { User } from '../models/User.js';
import { ReviewerAssignment } from '../models/ReviewerAssignment.js';
import { sendReviewerAcceptanceEmail, sendReviewerRejectionNotification, sendReviewerAssignmentEmail } from '../utils/emailService.js';
import { generateRandomPassword } from '../utils/helpers.js';

// Get reviewer's assigned papers with deadline tracking
export const getAssignedPapers = async (req, res) => {
    try {
        const reviewerId = req.user.userId;

        // Find all papers assigned to this reviewer
        const papers = await PaperSubmission.find({
            'reviewAssignments.reviewer': reviewerId
        })
            .populate('assignedEditor', 'username email')
            .select('-pdfBase64')
            .sort({ createdAt: -1 });

        // Enrich with review assignment details
        const enrichedPapers = papers.map(paper => {
            const assignment = paper.reviewAssignments.find(
                a => a.reviewer.toString() === reviewerId
            );
            return {
                ...paper.toObject(),
                reviewAssignment: assignment
            };
        });

        return res.status(200).json({
            success: true,
            count: enrichedPapers.length,
            papers: enrichedPapers
        });
    } catch (error) {
        console.error('Error fetching assigned papers:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching assigned papers',
            error: error.message
        });
    }
};

// Get paper details for review
export const getPaperForReview = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const reviewerId = req.user.userId;

        const paper = await PaperSubmission.findOne({ submissionId })
            .populate('assignedEditor', 'username email')
            .populate('assignedReviewers', 'username email');

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        // Check if this reviewer is assigned
        const isAssigned = paper.reviewAssignments.some(
            a => a.reviewer.toString() === reviewerId
        );

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: 'You are not assigned to review this paper'
            });
        }

        const assignment = paper.reviewAssignments.find(
            a => a.reviewer.toString() === reviewerId
        );

        // Check if already reviewed
        const existingReview = await ReviewerReview.findOne({
            paper: paper._id,
            reviewer: reviewerId
        });

        return res.status(200).json({
            success: true,
            paper: {
                _id: paper._id,
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                authorName: paper.authorName,
                email: paper.email,
                category: paper.category,
                pdfUrl: paper.pdfUrl || (paper.pdfBase64 ? `data:application/pdf;base64,${paper.pdfBase64}` : null),
                pdfFileName: paper.pdfFileName,
                status: paper.status,
                createdAt: paper.createdAt
            },
            assignment: {
                deadline: assignment.deadline,
                status: assignment.status,
                assignedAt: assignment.assignedAt
            },
            existingReview: existingReview ? {
                id: existingReview._id,
                status: existingReview.status
            } : null
        });
    } catch (error) {
        console.error('Error fetching paper for review:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching paper',
            error: error.message
        });
    }
};

// Submit review
export const submitReview = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const reviewerId = req.user.userId;
        const {
            comments,
            strengths,
            weaknesses,
            overallRating,
            noveltyRating,
            qualityRating,
            clarityRating,
            recommendation,
            commentsToReviewer,
            commentsToEditor
        } = req.body;

        // Validate required fields
        if (!comments || !overallRating || !recommendation) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: comments, overallRating, recommendation'
            });
        }

        // Find paper
        const paper = await PaperSubmission.findOne({ submissionId });
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        // Check if reviewer is assigned
        const assignment = paper.reviewAssignments.find(
            a => a.reviewer.toString() === reviewerId
        );

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'You are not assigned to review this paper'
            });
        }

        // Check if review already submitted
        let review = await ReviewerReview.findOne({
            paper: paper._id,
            reviewer: reviewerId
        });

        if (review) {
            // Update existing review
            review.comments = comments;
            // preserve/overwrite confidential and editor-facing comments
            if (typeof commentsToReviewer !== 'undefined') review.commentsToReviewer = commentsToReviewer;
            if (typeof commentsToEditor !== 'undefined') review.commentsToEditor = commentsToEditor;
            review.strengths = strengths;
            review.weaknesses = weaknesses;
            review.overallRating = overallRating;
            review.noveltyRating = noveltyRating;
            review.qualityRating = qualityRating;
            review.clarityRating = clarityRating;
            review.recommendation = recommendation;
            review.submittedAt = new Date();
            review.status = 'Submitted';
        } else {
            // Create new review
            review = new ReviewerReview({
                paper: paper._id,
                reviewer: reviewerId,
                comments,
                commentsToReviewer: commentsToReviewer || '',
                commentsToEditor: commentsToEditor || '',
                strengths,
                weaknesses,
                overallRating,
                noveltyRating,
                qualityRating,
                clarityRating,
                recommendation,
                status: 'Submitted',
                deadline: assignment.deadline,
                assignedAt: assignment.assignedAt
            });
        }

        await review.save();

        // Update paper review assignment status
        assignment.status = 'Submitted';
        assignment.review = review._id;
        await paper.save();

        // Update paper status if all reviewers have submitted
        const allReviewsSubmitted = paper.reviewAssignments.every(
            a => a.status === 'Submitted'
        );

        if (allReviewsSubmitted && paper.status === 'Under Review') {
            paper.status = 'Review Received';
            await paper.save();
        }

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: {
                id: review._id,
                status: review.status,
                submittedAt: review.submittedAt
            }
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting review',
            error: error.message
        });
    }
};

// Get review draft for editing
export const getReviewDraft = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const reviewerId = req.user.userId;

        const paper = await PaperSubmission.findOne({ submissionId });
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        const review = await ReviewerReview.findOne({
            paper: paper._id,
            reviewer: reviewerId
        });

        // Return 200 with null if no draft exists (not an error)
        return res.status(200).json({
            success: true,
            review: review || null,
            message: review ? 'Draft found' : 'No draft exists'
        });
    } catch (error) {
        console.error('Error fetching review draft:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching review',
            error: error.message
        });
    }
};

// Get reviewer dashboard statistics
export const getReviewerDashboardStats = async (req, res) => {
    try {
        const reviewerId = req.user.userId;

        const totalAssigned = await PaperSubmission.countDocuments({
            assignedReviewers: reviewerId
        });

        const pendingReviews = await Review.countDocuments({
            reviewer: reviewerId,
            status: 'Pending'
        });

        const submittedReviews = await Review.countDocuments({
            reviewer: reviewerId,
            status: 'Submitted'
        });

        // Get reviews by recommendation
        const reviewsByRecommendation = await Review.aggregate([
            {
                $match: {
                    reviewer: reviewerId,
                    status: 'Submitted'
                }
            },
            {
                $group: {
                    _id: '$recommendation',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get pending papers
        const pendingPapers = await PaperSubmission.find({
            assignedReviewers: reviewerId
        }).limit(10);

        const pendingPapersWithStatus = await Promise.all(
            pendingPapers.map(async (paper) => {
                const review = await Review.findOne({
                    paper: paper._id,
                    reviewer: reviewerId
                });

                return {
                    ...paper.toObject(),
                    reviewStatus: review ? review.status : 'Pending'
                };
            })
        );

        const actualPendingPapers = pendingPapersWithStatus.filter(
            p => p.reviewStatus === 'Pending'
        );

        return res.status(200).json({
            success: true,
            stats: {
                totalAssigned,
                pendingReviews,
                submittedReviews,
                reviewsByRecommendation,
                pendingPapers: actualPendingPapers
            }
        });
    } catch (error) {
        console.error("Error fetching reviewer dashboard stats:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard statistics",
            error: error.message
        });
    }
};

// Accept reviewer assignment
export const acceptReviewerAssignment = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Acceptance token is required'
            });
        }

        // Find the assignment by token
        const assignment = await ReviewerAssignment.findOne({
            acceptanceToken: token,
            acceptanceTokenExpires: { $gt: Date.now() },
            status: 'Pending'
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired acceptance token'
            });
        }

        // Update assignment status to Accepted
        assignment.status = 'Accepted';
        assignment.acceptedAt = new Date();
        assignment.acceptanceToken = null;
        assignment.acceptanceTokenExpires = null;
        await assignment.save();

        console.log(`✅ Reviewer ${assignment.reviewerEmail} accepted assignment for paper ${assignment.submissionId}`);

        return res.status(200).json({
            success: true,
            message: 'Assignment accepted successfully',
            assignment: {
                submissionId: assignment.submissionId,
                paperTitle: assignment.paperTitle,
                reviewDeadline: assignment.reviewDeadline
            }
        });
    } catch (error) {
        console.error('Error accepting reviewer assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error accepting assignment',
            error: error.message
        });
    }
};

// Reject reviewer assignment
export const rejectReviewerAssignment = async (req, res) => {
    try {
        const { token, reason } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Rejection token is required'
            });
        }

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for rejection (at least 10 characters)'
            });
        }

        // Find the assignment by token
        const assignment = await ReviewerAssignment.findOne({
            acceptanceToken: token,
            acceptanceTokenExpires: { $gt: Date.now() },
            status: 'Pending'
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired rejection token'
            });
        }

        // Update assignment status to Rejected
        assignment.status = 'Rejected';
        assignment.rejectionReason = reason;
        assignment.rejectedAt = new Date();
        assignment.acceptanceToken = null;
        assignment.acceptanceTokenExpires = null;
        await assignment.save();

        console.log(`❌ Reviewer ${assignment.reviewerEmail} rejected assignment for paper ${assignment.submissionId}`);

        return res.status(200).json({
            success: true,
            message: 'Assignment rejection recorded successfully'
        });
    } catch (error) {
        console.error('Error rejecting reviewer assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error rejecting assignment',
            error: error.message
        });
    }
};

// Get rejection form data
export const getRejectionForm = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Find the assignment by token
        const assignment = await ReviewerAssignment.findOne({
            acceptanceToken: token,
            acceptanceTokenExpires: { $gt: Date.now() },
            status: 'Pending'
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                token,
                reviewerName: assignment.reviewerName,
                paperTitle: assignment.paperTitle,
                submissionId: assignment.submissionId
            }
        });
    } catch (error) {
        console.error('Error fetching rejection form:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching form data',
            error: error.message
        });
    }
};

// Get assignment details for confirmation page
export const getAssignmentDetails = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { email } = req.query;

        console.log(`Fetching assignment: ID=${assignmentId}, Email=${email}`);

        if (!assignmentId || !email) {
            return res.status(400).json({
                success: false,
                message: 'Assignment ID and email are required'
            });
        }

        // Check if assignmentId is a valid ObjectId
        if (!assignmentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID format'
            });
        }

        const assignment = await ReviewerAssignment.findOne({
            _id: assignmentId,
            reviewerEmail: email,
            status: 'Pending'
        }).populate('paperId', 'submissionId paperTitle category authorName deadline');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found or already responded'
            });
        }

        const paper = assignment.paperId;
        return res.status(200).json({
            success: true,
            assignment: {
                _id: assignment._id,
                paperId: paper._id,
                paperTitle: paper.paperTitle,
                submissionId: paper.submissionId,
                category: paper.category,
                authorName: paper.authorName,
                reviewerEmail: assignment.reviewerEmail,
                reviewerName: assignment.reviewerName,
                status: assignment.status,
                deadline: assignment.deadline || assignment.reviewDeadline || paper.deadline
            }
        });
    } catch (error) {
        console.error('Error fetching assignment details:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching assignment details',
            error: error.message
        });
    }
};

// Accept assignment
export const acceptAssignment = async (req, res) => {
    try {
        const { assignmentId, reviewerEmail, paperId } = req.body;

        console.log(`Accepting assignment: ID=${assignmentId}, Email=${reviewerEmail}, PaperId=${paperId}`);

        if (!assignmentId || !reviewerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Assignment ID and reviewer email are required'
            });
        }

        // Update assignment status to "Accepted"
        const assignment = await ReviewerAssignment.findByIdAndUpdate(
            assignmentId,
            { status: 'Accepted', respondedAt: Date.now() },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Get the paper from the assignment (use paperId from body or from assignment.paperId)
        const finalPaperId = paperId || assignment.paperId;
        const paper = await PaperSubmission.findById(finalPaperId);
        const reviewer = await User.findById(assignment.reviewerId);

        if (paper && reviewer) {
            // Generate temp password for reviewer if needed
            const reviewerPassword = reviewer.tempPassword || generateRandomPassword();
            
            const paperData = {
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                category: paper.category,
                deadline: assignment.reviewDeadline || paper.deadline,
                reviewerPassword: reviewerPassword,
                loginLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reviewer-dashboard`
            };

            try {
                // Send assignment email with credentials
                await sendReviewerAssignmentEmail(
                    reviewerEmail,
                    assignment.reviewerName,
                    paperData
                );
                console.log(`✅ Assignment credentials email sent to ${reviewerEmail}`);
            } catch (emailError) {
                console.error('Error sending credentials email:', emailError);
                // Don't fail the request, just log the error
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Assignment accepted successfully. Login credentials have been sent to your email.',
            assignment
        });
    } catch (error) {
        console.error('Error accepting assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error accepting assignment',
            error: error.message
        });
    }
};

// Reject assignment
export const rejectAssignment = async (req, res) => {
    try {
        const { assignmentId, reviewerEmail, paperId, rejectionReason, alternativeReviewerEmail, alternativeReviewerName } = req.body;

        console.log(`Rejecting assignment: ID=${assignmentId}, Email=${reviewerEmail}, Reason=${rejectionReason}`);

        if (!assignmentId || !reviewerEmail || !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Assignment ID, email, and rejection reason are required'
            });
        }

        // Update assignment status to "Rejected"
        const assignment = await ReviewerAssignment.findByIdAndUpdate(
            assignmentId,
            {
                status: 'Rejected',
                rejectionReason,
                alternativeReviewerEmail: alternativeReviewerEmail || null,
                alternativeReviewerName: alternativeReviewerName || null,
                respondedAt: Date.now()
            },
            { new: true }
        );

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Send rejection notification to editor
        const finalPaperId = paperId || assignment.paperId;
        const paper = await PaperSubmission.findById(finalPaperId);
        if (paper) {
            const editor = await User.findById(paper.assignedEditor);
            if (editor && editor.email) {
                try {
                    const { sendReviewerRejectionNotification } = await import('../utils/emailService.js');
                    const rejectionData = {
                        submissionId: paper.submissionId,
                        paperTitle: paper.paperTitle,
                        reviewerName: assignment.reviewerName,
                        reviewerEmail: reviewerEmail,
                        rejectionReason,
                        alternativeReviewerEmail,
                        alternativeReviewerName
                    };
                    await sendReviewerRejectionNotification(editor.email, rejectionData);
                    console.log(`✅ Rejection notification sent to editor ${editor.email}`);
                } catch (emailError) {
                    console.error('Error sending rejection notification:', emailError);
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Rejection submitted successfully. The editor will find an alternative reviewer.',
            assignment
        });
    } catch (error) {
        console.error('Error rejecting assignment:', error);
        return res.status(500).json({
            success: false,
            message: 'Error rejecting assignment',
            error: error.message
        });
    }
};

// Submit re-review (Round 2) for papers with revision requests
export const submitReReview = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const reviewerId = req.user.userId;
        const {
            recommendation,
            overallRating,
            noveltyRating,
            qualityRating,
            clarityRating,
            commentsToEditor,
            commentsToReviewer,
            strengths,
            weaknesses
        } = req.body;

        // Validate required fields
        if (!recommendation || !overallRating) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: recommendation, overallRating'
            });
        }

        // Find paper
        const paper = await PaperSubmission.findOne({ submissionId });
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: 'Paper not found'
            });
        }

        // Check if reviewer is assigned
        const assignment = paper.reviewAssignments.find(
            a => a.reviewer.toString() === reviewerId
        );

        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'You are not assigned to review this paper'
            });
        }

        // Import ReReview model
        const { ReReview } = await import('../models/ReReview.js');

        // Check if re-review already submitted
        let reReview = await ReReview.findOne({
            paperId: paper._id,
            reviewerId: reviewerId
        });

        if (reReview) {
            // Update existing re-review
            reReview.recommendation = recommendation;
            reReview.overallRating = overallRating;
            reReview.noveltyRating = noveltyRating;
            reReview.qualityRating = qualityRating;
            reReview.clarityRating = clarityRating;
            reReview.commentsToEditor = commentsToEditor || '';
            reReview.commentsToReviewer = commentsToReviewer || '';
            reReview.strengths = strengths || '';
            reReview.weaknesses = weaknesses || '';
            reReview.updatedAt = new Date();
            reReview.status = 'Submitted';
        } else {
            // Create new re-review
            const reviewer = await User.findById(reviewerId);
            reReview = new ReReview({
                paperId: paper._id,
                submissionId: paper.submissionId,
                reviewerId: reviewerId,
                reviewerEmail: reviewer.email,
                reviewerName: reviewer.username || reviewer.name,
                recommendation,
                overallRating,
                noveltyRating,
                qualityRating,
                clarityRating,
                commentsToEditor: commentsToEditor || '',
                commentsToReviewer: commentsToReviewer || '',
                strengths: strengths || '',
                weaknesses: weaknesses || '',
                submittedAt: new Date(),
                status: 'Submitted',
                reviewRound: 2
            });
        }

        await reReview.save();

        console.log(`✅ Re-review (Round 2) submitted for paper ${paper.submissionId} by reviewer ${reviewerId}`);

        return res.status(201).json({
            success: true,
            message: 'Re-review submitted successfully',
            reReview: reReview
        });
    } catch (error) {
        console.error('Error submitting re-review:', error);
        return res.status(500).json({
            success: false,
            message: 'Error submitting re-review',
            error: error.message
        });
    }
};

