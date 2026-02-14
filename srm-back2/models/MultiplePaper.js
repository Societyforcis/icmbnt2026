import mongoose from 'mongoose';

const multiplePaperSchema = new mongoose.Schema({
    submissionId: {
        type: String,
        unique: true,
        required: true
    },
    paperTitle: {
        type: String,
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    abstract: {
        type: String,
        required: false,
        default: null
    },
    topic: String,
    pdfUrl: {
        type: String,
        required: false
    },
    pdfPublicId: {
        type: String,
        required: false
    },
    pdfFileName: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: [
            'Submitted',
            'Editor Assigned',
            'Under Review',
            'Review Received',
            'Revision Required',
            'Revised Submitted',
            'Conditionally Accept',
            'Accepted',
            'Rejected',
            'Published'
        ],
        default: 'Submitted'
    },
    assignedEditor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedReviewers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reviewAssignments: [{
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        deadline: Date,
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected', 'Submitted', 'Overdue', 'Review Submitted'],
            default: 'Pending'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        respondedAt: Date,
        review: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }
    }],
    finalDecision: {
        type: String,
        default: null
    },
    editorComments: String,
    editorCorrections: String,
    revisionCount: {
        type: Number,
        default: 0
    },
    revisionRequests: [{
        revisionNumber: Number,
        requestedAt: {
            type: Date,
            default: Date.now
        },
        editorComments: String,
        deadline: Date,
        status: {
            type: String,
            enum: ['Pending', 'Submitted', 'Overdue'],
            default: 'Pending'
        },
        submittedAt: Date,
        pdfUrl: String,
        pdfPublicId: String,
        pdfFileName: String
    }],
    isMultiple: {
        type: Boolean,
        default: true
    },
    versions: [{
        version: Number,
        pdfUrl: String,
        pdfPublicId: String,
        pdfFileName: String,
        submittedAt: Date
    }]
}, { timestamps: true });

export const MultiplePaperSubmission = mongoose.model('MultiplePaperSubmission', multiplePaperSchema);
