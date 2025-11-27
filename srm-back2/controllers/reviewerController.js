import { PaperSubmission } from '../models/Paper.js';
import { ReviewerReview } from '../models/ReviewerReview.js';
import { User } from '../models/User.js';

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
            recommendation
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
