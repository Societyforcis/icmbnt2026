import { PaperSubmission } from '../models/Paper.js';
import { UserSubmission } from '../models/UserSubmission.js';
import { generateSubmissionId, generateBookingId } from '../utils/helpers.js';
import { sendPaperSubmissionEmail, sendAdminNotificationEmail } from '../utils/emailService.js';
import { uploadPdfToCloudinary, deletePdfFromCloudinary } from '../config/cloudinary-pdf.js';

// Submit new paper
export const submitPaper = async (req, res) => {
    console.log('Received paper submission request:', req.body);
    console.log('File received:', req.file ? 'Yes, ' + req.file.originalname : 'No file');

    try {
        // Get email from request body or from JWT token
        let { email, paperTitle, authorName, category, topic, abstract } = req.body;
        
        // If email not provided in request, get it from JWT token
        if (!email && req.user && req.user.email) {
            email = req.user.email;
            console.log('Email extracted from token:', email);
        }

        // Check if user has already submitted a paper
        const existingSubmission = await UserSubmission.findOne({ email });
        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted a paper. Please use the edit option in your dashboard if you need to make changes.",
                existingSubmission: {
                    submissionId: existingSubmission.submissionId,
                    bookingId: existingSubmission.bookingId
                }
            });
        }

        // Validate required fields
        if (!paperTitle || !authorName || !email || !category) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: paperTitle, authorName, email, category"
            });
        }

        // Check if PDF file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "PDF file is required"
            });
        }

        // Generate submission ID and booking ID
        const submissionId = await generateSubmissionId(category);
        const bookingId = generateBookingId();

        console.log('Generated IDs:', { submissionId, bookingId });

        // Upload PDF to Cloudinary
        let pdfUrl, pdfPublicId, pdfFileName;
        try {
            const cloudinaryResult = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);
            pdfUrl = cloudinaryResult.url;
            pdfPublicId = cloudinaryResult.publicId;
            pdfFileName = cloudinaryResult.fileName;
            
            console.log('PDF uploaded to Cloudinary:', { 
                fileName: pdfFileName, 
                url: pdfUrl,
                publicId: pdfPublicId
            });
        } catch (uploadError) {
            console.error('Failed to upload PDF to Cloudinary:', uploadError.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload PDF: ' + uploadError.message
            });
        }

        // Create new submission with Cloudinary URL
        const newSubmission = new PaperSubmission({
            submissionId,
            paperTitle,
            authorName,
            email,
            category,
            abstract: abstract || null,
            pdfUrl,
            pdfPublicId,
            pdfFileName,
            status: 'Submitted',
            versions: [{
                version: 1,
                pdfUrl,
                pdfPublicId,
                pdfFileName,
                submittedAt: new Date()
            }]
        });

        // Create user submission tracking record
        const userSubmission = new UserSubmission({
            email,
            submissionId,
            bookingId
        });

        // Save both documents
        await Promise.all([
            newSubmission.save(),
            userSubmission.save()
        ]);

        console.log('Submission saved successfully with booking ID:', bookingId);

        // Send confirmation emails
        try {
            await Promise.all([
                sendPaperSubmissionEmail({
                    email,
                    authorName,
                    submissionId,
                    paperTitle,
                    category
                }),
                sendAdminNotificationEmail({
                    submissionId,
                    authorName,
                    email,
                    paperTitle,
                    category,
                    topic
                })
            ]);

            console.log('Confirmation emails sent successfully');
        } catch (emailError) {
            console.error('Error sending confirmation emails:', emailError);
            // Don't fail the submission if email fails
        }

        // Return success response
        return res.status(201).json({
            success: true,
            message: "Paper submitted successfully",
            submissionId,
            bookingId,
            paperDetails: {
                title: paperTitle,
                category,
                status: 'Submitted',
                fileName: pdfFileName
            }
        });
    } catch (error) {
        console.error('Error submitting paper:', error);

        return res.status(500).json({
            success: false,
            message: "Error processing paper submission",
            error: error.message
        });
    }
};


export const getUserSubmission = async (req, res) => {
    try {
        const { email } = req.user;

        const userSubmission = await UserSubmission.findOne({ email });
        if (!userSubmission) {
            return res.status(200).json({
                success: true,
                hasSubmission: false
            });
        }

        const paperSubmission = await PaperSubmission.findOne({
            submissionId: userSubmission.submissionId
        }).populate('assignedEditor', 'username email')
            .populate('assignedReviewers', 'username email');

        return res.status(200).json({
            success: true,
            hasSubmission: true,
            submission: {
                ...paperSubmission.toObject(),
                bookingId: userSubmission.bookingId,
                submissionDate: userSubmission.submissionDate
            }
        });
    } catch (error) {
        console.error("Error fetching user submission:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching submission details",
            error: error.message
        });
    }
};

// Get paper status by submission ID
export const getPaperStatus = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const submission = await PaperSubmission.findOne({ submissionId })
            .populate('assignedEditor', 'username email')
            .populate('assignedReviewers', 'username email');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        return res.json({
            success: true,
            submission
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error retrieving submission status",
            error: error.message
        });
    }
};

// Edit/Update submission
export const editSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { email } = req.user;

        // Verify the submission belongs to the user
        const userSubmission = await UserSubmission.findOne({
            email,
            submissionId
        });

        if (!userSubmission) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to edit this submission"
            });
        }

        // Get the existing submission
        const paperSubmission = await PaperSubmission.findOne({ submissionId });
        if (!paperSubmission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        // Update the fields
        if (req.body.paperTitle) paperSubmission.paperTitle = req.body.paperTitle;
        if (req.body.category) paperSubmission.category = req.body.category;
        if (req.body.topic) paperSubmission.topic = req.body.topic;
        if (req.body.authorName) paperSubmission.authorName = req.body.authorName;
        if (req.body.abstract) paperSubmission.abstract = req.body.abstract;

        // Handle file upload if new file provided
        if (req.file) {
            try {
                // Upload new PDF to Cloudinary
                const { url: pdfUrl, publicId: pdfPublicId } = await uploadPdfToCloudinary(
                    req.file.buffer,
                    req.file.originalname
                );

                // Delete old PDF from Cloudinary if it exists
                if (paperSubmission.pdfPublicId) {
                    try {
                        await deletePdfFromCloudinary(paperSubmission.pdfPublicId);
                    } catch (deleteError) {
                        console.warn('Warning: Could not delete old PDF from Cloudinary:', deleteError.message);
                    }
                }

                // Update with new file
                paperSubmission.pdfUrl = pdfUrl;
                paperSubmission.pdfPublicId = pdfPublicId;
                paperSubmission.pdfFileName = req.file.originalname;

                // Add to versions
                paperSubmission.revisionCount += 1;
                paperSubmission.versions.push({
                    version: paperSubmission.revisionCount + 1,
                    pdfUrl,
                    pdfPublicId,
                    pdfFileName: req.file.originalname,
                    submittedAt: new Date()
                });
            } catch (uploadError) {
                console.error('Failed to upload updated PDF to Cloudinary:', uploadError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload PDF: ' + uploadError.message
                });
            }
        }

        // Save the updated submission
        await paperSubmission.save();

        return res.status(200).json({
            success: true,
            message: "Submission updated successfully",
            submission: paperSubmission
        });
    } catch (error) {
        console.error("Error updating submission:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating submission",
            error: error.message
        });
    }
};

// Get all papers (for admin/editor)
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

        const papers = await PaperSubmission.find(query)
            .populate('assignedEditor', 'username email')
            .populate('assignedReviewers', 'username email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: papers.length,
            papers
        });
    } catch (error) {
        console.error("Error fetching papers:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching papers",
            error: error.message
        });
    }
};

// Get paper by ID
export const getPaperById = async (req, res) => {
    try {
        const { id } = req.params;

        const paper = await PaperSubmission.findById(id)
            .populate('assignedEditor', 'username email role')
            .populate('assignedReviewers', 'username email role');

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        return res.status(200).json({
            success: true,
            paper
        });
    } catch (error) {
        console.error("Error fetching paper:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching paper",
            error: error.message
        });
    }
};

// Submit revised paper
export const submitRevision = async (req, res) => {
    console.log('Received revision submission request:', req.body);
    console.log('File received:', req.file ? 'Yes, ' + req.file.originalname : 'No file');

    try {
        const { submissionId, paperTitle, authorName, email, category, topic, abstract, revisionNotes } = req.body;

        // Validate required fields
        if (!submissionId || !paperTitle || !authorName || !email || !category || !revisionNotes) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: submissionId, paperTitle, authorName, email, category, revisionNotes"
            });
        }

        // Check if PDF file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Revised PDF file is required"
            });
        }

        // Find the original submission
        const paper = await PaperSubmission.findOne({ submissionId });
        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        // Verify the user is the author
        if (paper.email !== email) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can only revise your own paper"
            });
        }

        // Delete old PDF from Cloudinary before uploading new one
        if (paper.pdfPublicId) {
            try {
                await deletePdfFromCloudinary(paper.pdfPublicId);
                console.log('Old PDF deleted from Cloudinary:', paper.pdfPublicId);
            } catch (deleteError) {
                console.warn('Warning: Could not delete old PDF from Cloudinary:', deleteError.message);
                // Continue with upload even if delete fails
            }
        }

        // Upload revised PDF to Cloudinary
        let revisionPdfUrl, revisionPdfPublicId, revisionPdfFileName;
        try {
            const cloudinaryResult = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);
            revisionPdfUrl = cloudinaryResult.url;
            revisionPdfPublicId = cloudinaryResult.publicId;
            revisionPdfFileName = cloudinaryResult.fileName;
            
            console.log('Revised PDF uploaded to Cloudinary:', { 
                fileName: revisionPdfFileName, 
                url: revisionPdfUrl,
                publicId: revisionPdfPublicId
            });
        } catch (uploadError) {
            console.error('Failed to upload revised PDF to Cloudinary:', uploadError.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload revised PDF: ' + uploadError.message
            });
        }

        // Update the paper with new revision
        paper.paperTitle = paperTitle;
        paper.authorName = authorName;
        paper.category = category;
        if (topic) {
            paper.topic = topic;
        }
        if (abstract) {
            paper.abstract = abstract;
        }

        // Add to versions history
        const nextVersion = (paper.versions && paper.versions.length > 0) ? paper.versions.length + 1 : 1;
        
        if (!paper.versions) {
            paper.versions = [];
        }

        paper.versions.push({
            version: nextVersion,
            pdfUrl: revisionPdfUrl,
            pdfPublicId: revisionPdfPublicId,
            pdfFileName: revisionPdfFileName,
            submittedAt: new Date()
        });

        // Update main PDF to the latest revision
        paper.pdfUrl = revisionPdfUrl;
        paper.pdfPublicId = revisionPdfPublicId;
        paper.pdfFileName = revisionPdfFileName;

        // Increment revision count
        paper.revisionCount = (paper.revisionCount || 0) + 1;

        // Update status to show revision submitted
        if (paper.status === 'Revision Required') {
            paper.status = 'Revised Submitted';
        }

        // Update the corresponding revision request status (if using new revision requests array)
        if (paper.revisionRequests && paper.revisionRequests.length > 0) {
            // Find the latest pending revision request and mark it as submitted
            const latestRevision = paper.revisionRequests[paper.revisionRequests.length - 1];
            if (latestRevision && latestRevision.status === 'Pending') {
                latestRevision.status = 'Submitted';
                latestRevision.submittedAt = new Date();
                latestRevision.pdfUrl = revisionPdfUrl;
                latestRevision.pdfPublicId = revisionPdfPublicId;
                latestRevision.pdfFileName = revisionPdfFileName;
            }
        }

        // Store revision notes (add to editorComments or create new field)
        if (!paper.editorComments) {
            paper.editorComments = '';
        }
        paper.editorComments += `\n\n[AUTHOR REVISION ${nextVersion}]: ${revisionNotes}`;

        // Save the updated paper
        await paper.save();

        console.log('Paper revision saved successfully:', {
            submissionId,
            revisionVersion: nextVersion,
            revisionCount: paper.revisionCount
        });

        // Send email notification to admin/editor
        try {
            await sendAdminNotificationEmail({
                subject: `Revised Paper Submitted - ${submissionId}`,
                message: `${authorName} has submitted a revised version of their paper.\n\nSubmission ID: ${submissionId}\nTitle: ${paperTitle}\nRevision Version: ${nextVersion}\n\nRevision Notes:\n${revisionNotes}`,
                recipientEmail: process.env.ADMIN_EMAIL || 'admin@example.com'
            });
        } catch (emailError) {
            console.error('Failed to send admin notification email:', emailError);
            // Don't fail the submission if email fails
        }

        return res.status(200).json({
            success: true,
            message: 'Revised paper submitted successfully',
            paper: {
                submissionId: paper.submissionId,
                paperTitle: paper.paperTitle,
                status: paper.status,
                revisionVersion: nextVersion,
                revisionCount: paper.revisionCount
            }
        });

    } catch (error) {
        console.error("Error submitting revision:", error);
        return res.status(500).json({
            success: false,
            message: "Error submitting revision",
            error: error.message
        });
    }
};
