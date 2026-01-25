import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: String,
        enum: ['Author', 'Admin'],
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const copyrightSchema = new mongoose.Schema({
    paperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FinalAcceptance',
        required: true
    },
    submissionId: {
        type: String,
        required: true
    },
    authorEmail: {
        type: String,
        required: true,
        index: true
    },
    authorName: {
        type: String,
        required: true
    },
    paperTitle: {
        type: String,
        required: true
    },
    copyrightFormUrl: {
        type: String,
        default: null
    },
    copyrightFormPublicId: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Submitted', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    submittedAt: {
        type: Date
    },
    messages: [messageSchema],
}, { timestamps: true });

export const Copyright = mongoose.model('Copyright', copyrightSchema);
