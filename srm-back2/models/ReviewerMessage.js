import mongoose from 'mongoose';

const reviewerMessageSchema = new mongoose.Schema(
    {
        submissionId: {
            type: String,
            required: true
        },
        reviewId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ReviewerReview',
            required: false // Changed to false to support chat before review
        },
        reviewerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        editorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        authorId: {
            type: String,  // Can be ObjectId or email string
            required: true
        },
        conversation: [
            {
                sender: {
                    type: String,
                    enum: ['editor', 'reviewer', 'author'],
                    required: true
                },
                senderId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                senderName: String,
                senderEmail: String,
                message: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        // Track which conversations exist
        editorReviewerConversation: {
            type: Boolean,
            default: false
        },
        editorAuthorConversation: {
            type: Boolean,
            default: false
        },
        // Last message for sorting
        lastMessageAt: {
            type: Date,
            default: Date.now
        },
        // Status tracking
        status: {
            type: String,
            enum: ['active', 'closed'],
            default: 'active'
        }
    },
    { timestamps: true }
);


export const ReviewerMessage = mongoose.model('ReviewerMessage', reviewerMessageSchema);
