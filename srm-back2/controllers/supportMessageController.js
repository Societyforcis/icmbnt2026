import { SupportMessage } from '../models/SupportMessage.js';
import { User } from '../models/User.js';
import nodemailer from 'nodemailer';

// Author: Get or Create their support thread
export const getMySupportMessages = async (req, res) => {
    try {
        const authorId = req.user.userId;
        const authorEmail = req.user.email;

        let supportThread = await SupportMessage.findOne({ authorId });

        if (!supportThread) {
            const user = await User.findById(authorId);
            supportThread = await SupportMessage.create({
                authorId,
                authorEmail,
                authorName: user.username || user.email,
                messages: []
            });
        }

        return res.status(200).json({
            success: true,
            data: supportThread
        });
    } catch (error) {
        console.error('Error fetching support messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

// Author/Admin: Send support message
export const sendSupportMessage = async (req, res) => {
    try {
        const { message, authorId: targetAuthorId } = req.body;
        const senderId = req.user.userId;
        const userRole = req.user.role;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message is empty" });
        }

        let authorId = userRole === 'Admin' ? targetAuthorId : senderId;

        let supportThread = await SupportMessage.findOne({ authorId });
        if (!supportThread && userRole === 'Author') {
            const user = await User.findById(authorId);
            supportThread = new SupportMessage({
                authorId,
                authorEmail: user.email,
                authorName: user.username || user.email,
                messages: []
            });
        }

        if (!supportThread) {
            return res.status(404).json({ success: false, message: "Support thread not found" });
        }

        const sender = await User.findById(senderId);

        supportThread.messages.push({
            sender: userRole === 'Admin' ? 'Admin' : 'Author',
            senderId,
            senderName: sender.username || sender.email,
            message,
            timestamp: new Date()
        });

        supportThread.lastMessageAt = new Date();
        supportThread.status = userRole === 'Admin' ? 'Replied' : 'Open';

        await supportThread.save();

        // Send email notification if Admin replies
        if (userRole === 'Admin') {
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: supportThread.authorEmail,
                    subject: 'New Message from ICMBNT 2026 Admin',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                            <h2 style="color: #1a5490;">Message from Admin</h2>
                            <p>Dear ${supportThread.authorName},</p>
                            <p>The conference administrator has replied to your support request:</p>
                            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #1a5490; margin: 20px 0;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                            <p>You can view and reply to this message in your dashboard.</p>
                            <p>Best regards,<br>ICMBNT 2026 Team</p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Error sending email notification to author:', emailError);
            }
        } else if (userRole === 'Author') {
            // Notify Admin
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                // Find admin email (usually from env or first admin user)
                const adminEmail = process.env.ADMIN_EMAIL || 'conference.icmbnt@gmail.com';

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: adminEmail,
                    subject: `Support: New Message from ${supportThread.authorName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                            <h2 style="color: #d9534f;">New Support Message</h2>
                                <p><strong>Author:</strong> ${supportThread.authorName} (${supportThread.authorEmail})</p>
                            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                            <p>Please log in to the Admin Panel to reply.</p>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Error sending email notification to admin:', emailError);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: supportThread
        });
    } catch (error) {
        console.error('Error sending support message:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};

// Admin: Get all support threads
export const getAllSupportThreads = async (req, res) => {
    try {
        const threads = await SupportMessage.find().sort({ lastMessageAt: -1 });
        return res.status(200).json({
            success: true,
            count: threads.length,
            data: threads
        });
    } catch (error) {
        console.error('Error fetching all support threads:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};
