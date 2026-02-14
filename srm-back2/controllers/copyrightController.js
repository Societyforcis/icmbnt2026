import { Copyright } from '../models/Copyright.js';
import PaymentDoneFinalUser from '../models/PaymentDoneFinalUser.js';
import FinalAcceptance from '../models/FinalAcceptance.js';
import ConferenceSelectedUser from '../models/ConferenceSelectedUser.js';
import { PaperSubmission } from '../models/Paper.js';

// Author access check middleware/helper
const checkAuthorEligibility = async (email) => {
    // Check if the author has a verified payment
    const payment = await PaymentDoneFinalUser.findOne({
        authorEmail: email
    });
    return payment;
};

// Author: Get Dashboard Data
export const getAuthorCopyrightDashboard = async (req, res) => {
    try {
        const authorEmail = req.user.email;

        // 1. Get all paper submissions
        const { PaperSubmission } = await import('../models/Paper.js');
        const { MultiplePaperSubmission } = await import('../models/MultiplePaper.js');

        const [mainPapers, multiPapers] = await Promise.all([
            PaperSubmission.find({ email: authorEmail }),
            MultiplePaperSubmission.find({ email: authorEmail })
        ]);

        const allPapers = [...mainPapers, ...multiPapers];

        if (allPapers.length === 0) {
            return res.status(200).json({
                success: true,
                hasPaper: false,
                message: "No paper submission found."
            });
        }

        // For backward compatibility, the frontend might expect a single 'paper' object.
        const payment = await PaymentDoneFinalUser.findOne({ authorEmail });

        const papersWithCopyright = await Promise.all(allPapers.map(async (p) => {
            // Get or create copyright record if paper is in acceptable status
            if (p.status === 'Accepted' || p.status === 'Published') {
                let copyright = await Copyright.findOne({ submissionId: p.submissionId });
                if (!copyright) {
                    copyright = await Copyright.create({
                        paperId: p._id,
                        submissionId: p.submissionId,
                        authorEmail: authorEmail,
                        authorName: p.authorName,
                        paperTitle: p.paperTitle,
                        status: 'Pending'
                    });
                }
                const pobj = p.toObject ? p.toObject() : p;
                return { ...pobj, copyright };
            }
            return p.toObject ? p.toObject() : p;
        }));

        const paper = papersWithCopyright[0];
        const copyright = paper.copyright || null;

        return res.status(200).json({
            success: true,
            hasPaper: true,
            data: {
                payment,
                paper,
                allPapers: papersWithCopyright,
                copyright
            }
        });
    } catch (error) {
        console.error('Error in getAuthorCopyrightDashboard:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching copyright dashboard',
            error: error.message
        });
    }
};

// Author: Upload Copyright Form
export const uploadCopyrightForm = async (req, res) => {
    try {
        const authorEmail = req.user.email;
        let { copyrightFormUrl, copyrightFormPublicId } = req.body;

        // If a file is uploaded via multer, use it
        if (req.file) {
            const { uploadPdfToCloudinary } = await import('../config/cloudinary-pdf.js');
            try {
                const cloudinaryResult = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);
                copyrightFormUrl = cloudinaryResult.url;
                copyrightFormPublicId = cloudinaryResult.publicId;
            } catch (uploadError) {
                console.error('Failed to upload Copyright to Cloudinary:', uploadError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload Copyright form to Cloudinary'
                });
            }
        }

        if (!copyrightFormUrl) {
            return res.status(400).json({
                success: false,
                message: 'Copyright form URL or file is required'
            });
        }

        const { submissionId } = req.body;

        // Find copyright by both email and submissionId to be safe
        const copyright = await Copyright.findOne({ authorEmail, submissionId });
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Copyright record not found for this submission'
            });
        }

        copyright.copyrightFormUrl = copyrightFormUrl;
        copyright.copyrightFormPublicId = copyrightFormPublicId;
        copyright.status = 'Submitted';
        copyright.submittedAt = new Date();
        await copyright.save();

        return res.status(200).json({
            success: true,
            message: 'Copyright form uploaded successfully',
            data: copyright
        });
    } catch (error) {
        console.error('Error in uploadCopyrightForm:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading copyright form',
            error: error.message
        });
    }
};

// Author/Admin: Send Message
export const sendCopyrightMessage = async (req, res) => {
    try {
        const { copyrightId, message } = req.body;
        const senderRole = req.user.role === 'Admin' ? 'Admin' : 'Author';
        const senderId = req.user.id;

        const copyright = await Copyright.findById(copyrightId);
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Copyright record not found'
            });
        }

        // Check permission: Admin can message anyone, Author can only message their own
        if (senderRole === 'Author' && copyright.authorEmail !== req.user.email) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        copyright.messages.push({
            sender: senderRole,
            senderId,
            message,
            timestamp: new Date()
        });

        await copyright.save();

        return res.status(200).json({
            success: true,
            message: 'Message sent successfully',
            data: copyright.messages
        });
    } catch (error) {
        console.error('Error in sendCopyrightMessage:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};

// Admin: Get All Copyright Forms
export const getAllCopyrightForms = async (req, res) => {
    try {
        const copyrights = await Copyright.find().sort({ updatedAt: -1 });
        return res.status(200).json({
            success: true,
            count: copyrights.length,
            data: copyrights
        });
    } catch (error) {
        console.error('Error in getAllCopyrightForms:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching copyright forms',
            error: error.message
        });
    }
};

// Admin: Review Copyright Form
export const reviewCopyrightForm = async (req, res) => {
    try {
        const { copyrightId, status, adminComment } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const copyright = await Copyright.findById(copyrightId);
        if (!copyright) {
            return res.status(404).json({
                success: false,
                message: 'Copyright record not found'
            });
        }

        copyright.status = status;
        if (adminComment) {
            copyright.messages.push({
                sender: 'Admin',
                senderId: req.user.id,
                message: `Review: ${status}. Comment: ${adminComment}`,
                timestamp: new Date()
            });
        }

        await copyright.save();

        // If approved, create or update record in ConferenceSelectedUser
        if (status === 'Approved') {
            try {
                // Find paper and payment details for rich metadata
                let paper = await PaperSubmission.findOne({ submissionId: copyright.submissionId })
                    .populate('assignedEditor', 'email username')
                    .populate('reviewAssignments.reviewer', 'email username');

                if (!paper) {
                    const { MultiplePaperSubmission } = await import('../models/MultiplePaper.js');
                    paper = await MultiplePaperSubmission.findOne({ submissionId: copyright.submissionId })
                        .populate('assignedEditor', 'email username')
                        .populate('reviewAssignments.reviewer', 'email username');
                }

                const payment = await PaymentDoneFinalUser.findOne({ authorEmail: copyright.authorEmail });

                // Extract reviewer names/emails
                const reviewersList = paper?.reviewAssignments?.map(a =>
                    `${a.reviewer?.username || 'Unknown'} (${a.reviewer?.email || 'N/A'})`
                ) || [];

                await ConferenceSelectedUser.findOneAndUpdate(
                    { submissionId: copyright.submissionId },
                    {
                        authorEmail: copyright.authorEmail,
                        authorName: copyright.authorName,
                        paperTitle: copyright.paperTitle,
                        submissionId: copyright.submissionId,
                        paperUrl: paper?.pdfUrl || 'N/A',
                        copyrightUrl: copyright.copyrightFormUrl,
                        paymentId: payment?._id,
                        registrationNumber: payment?.registrationNumber,
                        category: paper?.category,
                        abstract: paper?.abstract,
                        editorEmail: paper?.assignedEditor?.email,
                        reviewers: reviewersList,
                        revisionRounds: paper?.revisionCount || 0,
                        paperSubmittedAt: paper?.createdAt,
                        copyrightSubmittedAt: copyright.submittedAt || copyright.updatedAt,
                        selectionDate: new Date(),
                        status: 'Confirmed'
                    },
                    { upsert: true, new: true }
                );
                console.log(`✅ User ${copyright.authorEmail} added to ConferenceSelectedUser`);
            } catch (selectedUserError) {
                console.error('Error saving to ConferenceSelectedUser:', selectedUserError);
                // We don't fail the main request if this secondary storage fails, 
                // but we log it.
            }
        }

        return res.status(200).json({
            success: true,
            message: `Copyright form ${status.toLowerCase()} successfully`,
            data: copyright
        });
    } catch (error) {
        console.error('Error in reviewCopyrightForm:', error);
        return res.status(500).json({
            success: false,
            message: 'Error reviewing copyright form',
            error: error.message
        });
    }
};
