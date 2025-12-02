import mongoose from 'mongoose';

const finalAcceptanceSchema = new mongoose.Schema({
    // Paper Information
    paperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaperSubmission',
        required: true
    },
    submissionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    paperTitle: {
        type: String,
        required: true
    },
    
    // Author Information
    authorName: {
        type: String,
        required: true
    },
    authorEmail: {
        type: String,
        required: true,
        index: true
    },
    
    // Paper Link/URL
    pdfUrl: {
        type: String,
        required: true
    },
    pdfPublicId: {
        type: String,
        required: false
    },
    pdfFileName: {
        type: String,
        required: false
    },
    
    // Category and Topic
    category: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: false
    },
    
    // Reviewers Information
    reviewers: [{
        reviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewerName: String,
        reviewerEmail: {
            type: String,
            required: true
        },
        overallRating: Number,
        recommendation: String,
        submittedAt: Date
    }],
    
    // Total Reviewers Count
    totalReviewers: {
        type: Number,
        default: 0
    },
    
    // Average Rating (calculated from all reviews)
    averageRating: {
        type: Number,
        default: 0
    },
    
    // Final Decision Info
    finalDecision: {
        type: String,
        enum: ['Accept', 'Reject', 'Revision Required'],
        default: 'Accept'
    },
    
    // Editor who made the decision
    editorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    editorEmail: String,
    
    // Decision Date/Time
    acceptanceDate: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    // Additional Info
    revisionCount: {
        type: Number,
        default: 0,
        description: 'Number of revisions requested before acceptance'
    },
    
    // Acceptance Certificate/Number (optional)
    acceptanceCertificateNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    
    // Conference/Event Info
    conferenceYear: {
        type: Number,
        default: 2025
    },
    conferenceName: {
        type: String,
        default: 'ICMBNT 2025'
    },
    
    // Status
    status: {
        type: String,
        enum: ['Accepted', 'Certificate Generated', 'Published'],
        default: 'Accepted'
    },
    
    // Additional Metadata
    metadata: {
        originalSubmissionDate: Date,
        firstReviewDate: Date,
        revisionRequestDate: Date,
        lastRevisionDate: Date,
        notes: String
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
finalAcceptanceSchema.index({ authorEmail: 1, acceptanceDate: -1 });
finalAcceptanceSchema.index({ category: 1 });
finalAcceptanceSchema.index({ status: 1 });
finalAcceptanceSchema.index({ acceptanceDate: -1 });

// Pre-save middleware to calculate average rating
finalAcceptanceSchema.pre('save', function (next) {
    if (this.reviewers && this.reviewers.length > 0) {
        const ratings = this.reviewers
            .map(r => r.overallRating)
            .filter(r => r !== undefined && r !== null);
        
        if (ratings.length > 0) {
            this.averageRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
        }
        
        this.totalReviewers = this.reviewers.length;
    }
    next();
});

// Method to generate acceptance certificate number
finalAcceptanceSchema.methods.generateCertificateNumber = function () {
    const year = this.conferenceYear;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.acceptanceCertificateNumber = `ICMBNT-${year}-${timestamp}-${random}`;
    return this.acceptanceCertificateNumber;
};

// Static method to get accepted papers by author
finalAcceptanceSchema.statics.getByAuthorEmail = function (email) {
    return this.find({ authorEmail: email }).sort({ acceptanceDate: -1 });
};

// Static method to get all accepted papers by category
finalAcceptanceSchema.statics.getByCategory = function (category) {
    return this.find({ category }).sort({ acceptanceDate: -1 });
};

// Static method to get accepted papers with average rating above threshold
finalAcceptanceSchema.statics.getHighRatedPapers = function (minRating = 4) {
    return this.find({ averageRating: { $gte: minRating } }).sort({ averageRating: -1 });
};

const FinalAcceptance = mongoose.model('FinalAcceptance', finalAcceptanceSchema);

export default FinalAcceptance;
