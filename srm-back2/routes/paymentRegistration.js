import express from 'express';
import PaymentRegistration from '../models/PaymentRegistration.js';
import FinalAcceptance from '../models/FinalAcceptance.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Submit Payment Registration
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        const {
            paymentMethod,
            paymentSubMethod, // 'upi' or 'bank-account'
            transactionId,
            amount,
            paymentScreenshot,
            registrationCategory
        } = req.body;

        const userEmail = req.user.email;

        console.log('📝 Payment registration submission received:', {
            email: userEmail,
            paymentMethod,
            paymentSubMethod,
            hasScreenshot: !!paymentScreenshot,
            registrationCategory
        });

        // Fetch user's accepted paper details
        const acceptedPaper = await FinalAcceptance.findOne({ authorEmail: userEmail })
            .sort({ acceptanceDate: -1 });

        if (!acceptedPaper) {
            return res.status(404).json({
                success: false,
                message: 'No accepted paper found. Only accepted authors can register.'
            });
        }

        // Validate required fields
        if (!paymentMethod || !amount || !registrationCategory) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: paymentMethod, amount, registrationCategory'
            });
        }

        // Validate payment screenshot for bank transfer
        if (paymentMethod === 'bank-transfer' && !paymentScreenshot) {
            return res.status(400).json({
                success: false,
                message: 'Payment screenshot is required for bank transfer'
            });
        }

        // Check if user has already registered
        const existingRegistration = await PaymentRegistration.findOne({ authorEmail: userEmail });
        if (existingRegistration) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted a registration. Please wait for admin verification.',
                existingRegistration: {
                    paymentStatus: existingRegistration.paymentStatus,
                    registrationDate: existingRegistration.registrationDate
                }
            });
        }

        // Upload screenshot to Cloudinary if provided
        let screenshotUrl = '';
        let screenshotPublicId = '';

        if (paymentScreenshot) {
            try {
                console.log('📤 Uploading payment screenshot to Cloudinary...');

                const uploadResult = await cloudinary.uploader.upload(paymentScreenshot, {
                    folder: 'payment-screenshots',
                    resource_type: 'image',
                    transformation: [
                        { width: 1000, height: 1000, crop: 'limit' },
                        { quality: 'auto:good' }
                    ]
                });

                screenshotUrl = uploadResult.secure_url;
                screenshotPublicId = uploadResult.public_id;

                console.log('✅ Screenshot uploaded to Cloudinary:', screenshotPublicId);
            } catch (uploadError) {
                console.error('❌ Cloudinary upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload payment screenshot',
                    error: uploadError.message
                });
            }
        }

        // Create payment registration with auto-filled details
        const paymentRegistration = new PaymentRegistration({
            userId: req.user?.id,
            authorEmail: acceptedPaper.authorEmail,
            authorName: acceptedPaper.authorName,
            paperId: acceptedPaper._id,
            submissionId: acceptedPaper.submissionId,
            paperTitle: acceptedPaper.paperTitle,
            institution: 'To be updated', // Can be updated later if needed
            address: 'To be updated',
            country: 'To be updated',
            paymentMethod: paymentMethod + (paymentSubMethod ? `-${paymentSubMethod}` : ''),
            transactionId,
            amount,
            paymentScreenshot: screenshotUrl,
            paymentScreenshotPublicId: screenshotPublicId,
            registrationCategory,
            paymentStatus: 'pending'
        });

        await paymentRegistration.save();

        // Update FinalAcceptance
        await FinalAcceptance.findByIdAndUpdate(acceptedPaper._id, {
            paymentStatus: 'paid',
            paymentRegistrationId: paymentRegistration._id
        });

        console.log('✅ Payment registration created:', paymentRegistration._id);

        res.status(201).json({
            success: true,
            message: 'Registration submitted successfully! Please wait for admin verification.',
            registration: {
                id: paymentRegistration._id,
                paymentStatus: paymentRegistration.paymentStatus,
                registrationDate: paymentRegistration.registrationDate,
                authorName: paymentRegistration.authorName,
                paperTitle: paymentRegistration.paperTitle
            }
        });

    } catch (error) {
        console.error('❌ Error submitting payment registration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit registration',
            error: error.message
        });
    }
});

// Get My Registration Status
router.get('/my-registration', authMiddleware, async (req, res) => {
    try {
        const userEmail = req.user.email;

        const registration = await PaymentRegistration.findOne({ authorEmail: userEmail })
            .sort({ createdAt: -1 });

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'No registration found'
            });
        }

        res.json({
            success: true,
            registration: {
                id: registration._id,
                authorName: registration.authorName,
                paperTitle: registration.paperTitle,
                institution: registration.institution,
                paymentMethod: registration.paymentMethod,
                transactionId: registration.transactionId,
                amount: registration.amount,
                paymentStatus: registration.paymentStatus,
                registrationDate: registration.registrationDate,
                verifiedAt: registration.verifiedAt,
                verificationNotes: registration.verificationNotes,
                rejectionReason: registration.rejectionReason
            }
        });

    } catch (error) {
        console.error('❌ Error fetching registration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registration',
            error: error.message
        });
    }
});

// Get User's Accepted Paper Details (for auto-filling registration)
router.get('/my-paper-details', authMiddleware, async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Find accepted paper for this user
        const acceptedPaper = await FinalAcceptance.findOne({ authorEmail: userEmail })
            .sort({ acceptanceDate: -1 });

        if (!acceptedPaper) {
            return res.status(404).json({
                success: false,
                message: 'No accepted paper found for this user'
            });
        }

        res.json({
            success: true,
            paperDetails: {
                submissionId: acceptedPaper.submissionId,
                paperTitle: acceptedPaper.paperTitle,
                authorName: acceptedPaper.authorName,
                authorEmail: acceptedPaper.authorEmail,
                category: acceptedPaper.category,
                acceptanceDate: acceptedPaper.acceptanceDate,
                paymentStatus: acceptedPaper.paymentStatus
            }
        });

    } catch (error) {
        console.error('❌ Error fetching paper details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch paper details',
            error: error.message
        });
    }
});

// ADMIN ROUTES

// Get All Pending Registrations (Admin Only)
router.get('/admin/pending', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const pendingRegistrations = await PaymentRegistration.find({ paymentStatus: 'pending' })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: pendingRegistrations.length,
            registrations: pendingRegistrations
        });

    } catch (error) {
        console.error('❌ Error fetching pending registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending registrations',
            error: error.message
        });
    }
});

// Get All Registrations (Admin Only)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.query;

        const query = status ? { paymentStatus: status } : {};
        const registrations = await PaymentRegistration.find(query)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: registrations.length,
            registrations
        });

    } catch (error) {
        console.error('❌ Error fetching registrations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations',
            error: error.message
        });
    }
});

// Verify Payment (Admin Only)
router.put('/admin/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { verificationNotes } = req.body;

        const registration = await PaymentRegistration.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Check if already verified
        if (registration.paymentStatus === 'verified') {
            return res.status(400).json({
                success: false,
                message: 'Payment already verified'
            });
        }

        // Update registration status
        registration.paymentStatus = 'verified';
        registration.verifiedBy = req.user.userId;  // Use userId from JWT
        registration.verifiedAt = new Date();
        registration.verificationNotes = verificationNotes || 'Payment verified by admin';
        await registration.save();

        // Update FinalAcceptance if linked
        if (registration.paperId) {
            await FinalAcceptance.findByIdAndUpdate(registration.paperId, {
                paymentStatus: 'verified'
            });
        }

        // Create final user record in PaymentDoneFinalUser collection
        const PaymentDoneFinalUser = (await import('../models/PaymentDoneFinalUser.js')).default;

        const finalUser = new PaymentDoneFinalUser({
            userId: registration.userId,
            authorEmail: registration.authorEmail,
            authorName: registration.authorName,
            paperId: registration.paperId,
            submissionId: registration.submissionId,
            paperTitle: registration.paperTitle,
            institution: registration.institution,
            address: registration.address,
            country: registration.country,
            paymentMethod: registration.paymentMethod,
            transactionId: registration.transactionId,
            amount: registration.amount,
            currency: registration.currency,
            paymentRegistrationId: registration._id,
            registrationCategory: registration.registrationCategory,
            verifiedBy: req.user.userId,  // Use userId from JWT
            verifiedByName: req.user.username,
            verifiedByEmail: req.user.email,
            verifiedAt: new Date(),
            verificationNotes: registration.verificationNotes,
            registrationDate: registration.registrationDate
        });

        await finalUser.save();

        console.log('✅ Payment verified and final user created:', {
            registrationId: id,
            finalUserId: finalUser._id,
            registrationNumber: finalUser.registrationNumber
        });

        res.json({
            success: true,
            message: 'Payment verified successfully',
            registration,
            finalUser: {
                id: finalUser._id,
                registrationNumber: finalUser.registrationNumber,
                authorName: finalUser.authorName,
                authorEmail: finalUser.authorEmail
            }
        });

    } catch (error) {
        console.error('❌ Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
});

// Reject Payment (Admin Only)
router.put('/admin/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const registration = await PaymentRegistration.findById(id);
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        // Update registration status
        registration.paymentStatus = 'rejected';
        registration.verifiedBy = req.user.id;
        registration.verifiedAt = new Date();
        registration.rejectionReason = rejectionReason;
        await registration.save();

        // Update FinalAcceptance if linked
        if (registration.paperId) {
            await FinalAcceptance.findByIdAndUpdate(registration.paperId, {
                paymentStatus: 'pending'
            });
        }

        console.log('❌ Payment rejected for registration:', id);

        res.json({
            success: true,
            message: 'Payment rejected',
            registration
        });

    } catch (error) {
        console.error('❌ Error rejecting payment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject payment',
            error: error.message
        });
    }
});

export default router;
