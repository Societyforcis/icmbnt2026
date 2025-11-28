import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send verification email
export const sendVerificationEmail = async (email, token) => {
    console.log(`Sending verification email to ${email} with token: ${token}`);

    const verificationData = {
        token: token,
        email: email,
        timestamp: Date.now()
    };

    const encodedData = Buffer.from(JSON.stringify(verificationData)).toString('base64');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify?data=${encodedData}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Email - ICMBNT 2026",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #F5A051; text-align: center;">Welcome to ICMBNT 2026!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #F5A051; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
             Verify Email Address
          </a>
        </div>
        <p style="color: #666; text-align: center;">
          This verification link will expire in 48 hours.
        </p>
        <p>
          If the button doesn't work, copy and paste this URL into your browser:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="font-size: 0.8em; color: #666; text-align: center;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Verification email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
    }
};

// Send OTP email for password reset
export const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset OTP - ICMBNT 2026",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F5A051;">Password Reset Request</h2>
        <p>Your OTP for password reset is: <strong style="font-size: 24px; color: #F5A051;">${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
    };
    return transporter.sendMail(mailOptions);
};

// Send paper submission confirmation to author
export const sendPaperSubmissionEmail = async (submissionData) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: submissionData.email,
        subject: `Paper Submission Confirmation - ${submissionData.submissionId}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F5A051;">Paper Submission Confirmation</h2>
        <p>Dear ${submissionData.authorName},</p>
        <p>Your paper has been successfully submitted to ICMBNT 2026.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Submission ID:</strong> ${submissionData.submissionId}</p>
          <p><strong>Paper Title:</strong> ${submissionData.paperTitle}</p>
          <p><strong>Category:</strong> ${submissionData.category}</p>
          <p><strong>Status:</strong> <span style="color: #4CAF50;">Submitted</span></p>
        </div>
        <p>We will review your submission and notify you of any updates through this email address.</p>
        <p>Best regards,<br>ICMBNT 2026 Committee</p>
      </div>
    `
    };

    return transporter.sendMail(mailOptions);
};

// Send paper submission notification to admin
export const sendAdminNotificationEmail = async (submissionData) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: `New Paper Submission - ${submissionData.submissionId}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F5A051;">New Paper Submission Received</h2>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Submission ID:</strong> ${submissionData.submissionId}</p>
          <p><strong>Author:</strong> ${submissionData.authorName}</p>
          <p><strong>Email:</strong> ${submissionData.email}</p>
          <p><strong>Paper Title:</strong> ${submissionData.paperTitle}</p>
          <p><strong>Category:</strong> ${submissionData.category}</p>
          ${submissionData.topic ? `<p><strong>Topic:</strong> ${submissionData.topic}</p>` : ''}
          <p><strong>PDF URL:</strong> <a href="${submissionData.pdfUrl}">View PDF</a></p>
        </div>
        <p>Please assign an editor to review this submission.</p>
      </div>
    `
    };

    return transporter.sendMail(mailOptions);
};

// Send editor assignment notification
export const sendEditorAssignmentEmail = async (editorEmail, editorName, paperData) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: editorEmail,
        subject: `Paper Assigned for Review - ${paperData.submissionId}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F5A051;">Paper Assignment Notification</h2>
        <p>Dear ${editorName},</p>
        <p>A new paper has been assigned to you for editorial review.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Submission ID:</strong> ${paperData.submissionId}</p>
          <p><strong>Paper Title:</strong> ${paperData.paperTitle}</p>
          <p><strong>Author:</strong> ${paperData.authorName}</p>
          <p><strong>Category:</strong> ${paperData.category}</p>
          <p><strong>PDF URL:</strong> <a href="${paperData.pdfUrl}">View PDF</a></p>
        </div>
        <p>Please log in to the editor dashboard to assign reviewers and manage this submission.</p>
        <p>Best regards,<br>ICMBNT 2026 Committee</p>
      </div>
    `
    };

    return transporter.sendMail(mailOptions);
};

// Send reviewer assignment notification
export const sendReviewerAssignmentEmail = async (reviewerEmail, reviewerName, paperData) => {
    const deadline = new Date(paperData.deadline);
    const deadlineStr = deadline.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reviewerEmail,
        subject: `Paper Review Assignment - ${paperData.submissionId} - Deadline: ${deadlineStr}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="margin: 0 0 10px 0; color: #1a5490; font-size: 20px;">Paper Review Assignment</h2>
                    <p style="margin: 0; color: #666; font-size: 14px;">ICMBNT 2026 Conference</p>
                </div>

                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                    Dear <strong>${reviewerName}</strong>,
                </p>

                <p style="font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 20px;">
                    We invite you to review the following manuscript submitted to ICMBNT 2026. Your expert feedback is valuable to ensure the quality of the conference.
                </p>

                <div style="background-color: #ecf0f6; border-left: 4px solid #1a5490; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #1a5490;">Paper Information</p>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold; width: 120px;">Submission ID:</td>
                            <td style="padding: 5px 0;">${paperData.submissionId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Paper Title:</td>
                            <td style="padding: 5px 0;">${paperData.paperTitle}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Category:</td>
                            <td style="padding: 5px 0;">${paperData.category}</td>
                        </tr>
                        <tr style="background-color: #fff3cd;">
                            <td style="padding: 8px; font-weight: bold; color: #856404;">Review Deadline:</td>
                            <td style="padding: 8px; font-weight: bold; color: #856404;">${deadlineStr}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #cfe9f3; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 15px 0; font-weight: bold; color: #004499; font-size: 15px;">Your Login Credentials</p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #004499; line-height: 1.6;">
                        Use the following credentials to access the review portal:
                    </p>
                    <table style="width: 100%; font-size: 14px; margin: 10px 0; border-collapse: collapse;">
                        <tr style="background-color: #ffffff;">
                            <td style="padding: 8px; font-weight: bold; color: #004499; border: 1px solid #b3d9ff;">Email / Username:</td>
                            <td style="padding: 8px; color: #333; border: 1px solid #b3d9ff; font-family: 'Courier New', monospace;">${reviewerEmail}</td>
                        </tr>
                        <tr style="background-color: #ffffff;">
                            <td style="padding: 8px; font-weight: bold; color: #004499; border: 1px solid #b3d9ff;">Password:</td>
                            <td style="padding: 8px; color: #333; border: 1px solid #b3d9ff; font-family: 'Courier New', monospace;">${paperData.reviewerPassword || 'Not available'}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 15px 0; font-weight: bold; color: #155724; font-size: 15px;">Access the Review Portal</p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #155724; line-height: 1.6;">
                        Click the button below to login and access your review portal:
                    </p>
                    <p style="margin: 0; text-align: center; padding: 15px 0;">
                        <a href="${paperData.loginLink}" style="display: inline-block; background-color: #28a745; color: white; padding: 10px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">Login to Review Portal</a>
                    </p>
                    <p style="margin: 15px 0 0 0; font-size: 12px; color: #155724; border-top: 1px solid #c3e6cb; padding-top: 10px;">
                        Direct link: <a href="${paperData.loginLink}" style="color: #28a745; word-break: break-all; text-decoration: none;">${paperData.loginLink}</a>
                    </p>
                </div>

                <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #666; line-height: 1.6;">
                    <p style="margin: 0 0 10px 0; font-weight: bold;">Review Guidelines:</p>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Evaluate the paper on originality, quality, and clarity</li>
                        <li>Provide constructive comments for the authors</li>
                        <li>Rate the paper on a scale of 1-5</li>
                        <li>Submit your recommendation (Accept / Minor Revision / Major Revision / Reject)</li>
                        <li>Complete your review before the deadline</li>
                    </ul>
                </div>

                <p style="font-size: 13px; color: #888; line-height: 1.5; margin: 20px 0;">
                    If you have any questions, please contact the conference organizers. Thank you for your contribution to ICMBNT 2026.
                </p>

                <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #999;">
                        ICMBNT 2026 Editorial Team<br>
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

// Send review submission confirmation
export const sendReviewSubmissionEmail = async (editorEmail, editorName, reviewData) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: editorEmail,
        subject: `✅ Review Submitted - ${reviewData.submissionId}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">✅ Review Submitted</h1>
                </div>
                
                <div style="background-color: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear <strong>${editorName}</strong>,</p>
                    
                    <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                        A review has been successfully submitted for your paper.
                    </p>
                    
                    <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; border-radius: 5px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #c8e6c9;">
                                <td style="padding: 10px 0; font-weight: bold; color: #333;">Submission ID:</td>
                                <td style="padding: 10px 0; color: #555;">${reviewData.submissionId}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #c8e6c9;">
                                <td style="padding: 10px 0; font-weight: bold; color: #333;">Reviewer:</td>
                                <td style="padding: 10px 0; color: #555;">${reviewData.reviewerName}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #c8e6c9;">
                                <td style="padding: 10px 0; font-weight: bold; color: #333;">Recommendation:</td>
                                <td style="padding: 10px 0; color: #d84315; font-weight: bold;">${reviewData.recommendation}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; font-weight: bold; color: #333;">Overall Rating:</td>
                                <td style="padding: 10px 0; color: #f57c00; font-weight: bold;">⭐ ${reviewData.overallRating}/5</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="font-size: 14px; color: #888; line-height: 1.6; margin: 20px 0;">
                        Log in to your editor dashboard to view the complete review and take further action.
                    </p>
                </div>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

// Send final decision email to author
export const sendDecisionEmail = async (authorEmail, authorName, decisionData) => {
    const statusColors = {
        'Accept': '#4CAF50',
        'Conditionally Accept': '#2196F3',
        'Revise & Resubmit': '#FF9800',
        'Reject': '#f44336'
    };

    const color = statusColors[decisionData.decision] || '#666';

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: authorEmail,
        subject: `Paper Review Decision - ${decisionData.submissionId}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F5A051;">Paper Review Decision</h2>
        <p>Dear ${authorName},</p>
        <p>We have completed the review of your paper submission.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Submission ID:</strong> ${decisionData.submissionId}</p>
          <p><strong>Paper Title:</strong> ${decisionData.paperTitle}</p>
          <p><strong>Decision:</strong> <span style="color: ${color}; font-weight: bold;">${decisionData.decision}</span></p>
        </div>
        ${decisionData.comments ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Editor Comments:</h3>
            <p style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #F5A051;">${decisionData.comments}</p>
          </div>
        ` : ''}
        ${decisionData.corrections ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Required Corrections:</h3>
            <p style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #FF9800;">${decisionData.corrections}</p>
          </div>
        ` : ''}
        <p>Best regards,<br>ICMBNT 2026 Committee</p>
      </div>
    `
    };

    return transporter.sendMail(mailOptions);
};

// Send reviewer credentials email
export const sendReviewerCredentialsEmail = async (reviewerEmail, username, password, loginUrl) => {
    // Use provided loginUrl or construct default
    const finalLoginUrl = loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reviewerEmail,
        subject: "ICMBNT 2026 - Reviewer Account Created",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #F5A051; text-align: center;">Welcome to ICMBNT 2026 Review Committee!</h2>
        
        <p>Dear ${username},</p>
        
        <p>Your reviewer account has been created successfully for the ICMBNT 2026 conference. You can now log in to review assigned papers.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #333; margin-top: 0;">Login Credentials:</h3>
          <p><strong>Email:</strong> ${reviewerEmail}</p>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Password:</strong> <code style="background-color: #eee; padding: 5px 10px; border-radius: 3px; font-family: monospace;">${password}</code></p>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${finalLoginUrl}" 
             style="background-color: #F5A051; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
             Log In to Review Papers
          </a>
        </div>
        
        <div style="background-color: #fffbea; padding: 15px; margin: 20px 0; border-left: 4px solid #FF9800; border-radius: 3px;">
          <p style="margin: 0; color: #333;"><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        </div>
        
        <p style="color: #666; font-size: 0.9em;">
          If you have any questions about the review process, please contact the conference organizers.<br>
          <strong>ICMBNT 2026 Committee</strong>
        </p>
      </div>
    `
    };

    return transporter.sendMail(mailOptions);
};

// Send reviewer reminder email
export const sendReviewerReminderEmail = async (reviewerEmail, reviewerName, paperTitle, reminderCount, reviewLink, daysRemaining) => {
    const reminderTexts = {
        0: `This is a gentle reminder that we're still waiting for your review of the submitted paper.`,
        1: `We haven't received your review yet. This is our second reminder. Your timely feedback is crucial for our review process.`,
        2: `This is our final reminder. We urgently need your review to meet our publication timeline. Please submit your review as soon as possible.`
    };

    const reminderMessage = reminderTexts[Math.min(reminderCount, 2)];
    const urgencyClass = daysRemaining < 0 ? 'critical' : daysRemaining < 3 ? 'high' : 'normal';

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: reviewerEmail,
        subject: `[REMINDER] Review Needed: ${paperTitle.substring(0, 50)}${paperTitle.length > 50 ? '...' : ''}`,
        html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Review Reminder</h1>
          ${reminderCount > 0 ? `<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-top: 10px; background-color: ${urgencyClass === 'critical' ? 'rgba(239, 68, 68, 0.3)' : urgencyClass === 'high' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(59, 130, 246, 0.3)'}; color: ${urgencyClass === 'critical' ? '#dc2626' : urgencyClass === 'high' ? '#ea580c' : '#2563eb'};">Reminder #${reminderCount + 1}</span>` : ''}
        </div>
        <div style="padding: 30px;">
          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; color: #555;">Dear ${reviewerName},</p>
          </div>

          <div style="padding: 15px; background-color: ${urgencyClass === 'critical' ? '#fee2e2' : urgencyClass === 'high' ? '#fed7aa' : '#dbeafe'}; border-left: 4px solid ${urgencyClass === 'critical' ? '#dc2626' : urgencyClass === 'high' ? '#ea580c' : '#2563eb'}; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: ${urgencyClass === 'critical' ? '#991b1b' : urgencyClass === 'high' ? '#92400e' : '#1e40af'}; font-weight: 500;">${reminderMessage}</p>
          </div>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 10px 0; color: #374151; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Paper Under Review</h3>
            <p style="margin: 0; color: #1f2937; font-weight: 600; font-size: 15px; word-break: break-word;">${paperTitle}</p>
          </div>

          ${daysRemaining < 0 
            ? `<div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;"><strong style="color: #dc2626;">STATUS: OVERDUE</strong></p>
                <p style="margin: 5px 0 0 0; color: #92400e;">The review deadline was ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ago. Your review is urgently needed.</p>
              </div>`
            : `<div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;"><strong>Time Remaining: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong></p>
                <p style="margin: 5px 0 0 0; color: #92400e;">Please submit your review before the deadline to ensure timely publication.</p>
              </div>`
          }

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewLink}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Submit Your Review
            </a>
            <div style="word-break: break-all; padding: 10px; background-color: #f3f4f6; border-radius: 4px; font-size: 12px; margin: 10px 0;">
              Or copy this link: ${reviewLink}
            </div>
          </div>

          <div style="height: 1px; background-color: #e5e7eb; margin: 20px 0;"></div>

          <p style="color: #6b7280; font-size: 14px;">
            Your expert evaluation is crucial for maintaining the quality of our publication process. We appreciate your time and effort in reviewing this submission.
          </p>

          ${reminderCount >= 2 
            ? `<div style="padding: 15px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #991b1b; font-weight: 500;">
                  If you have any concerns about completing this review or need an extension, please contact the editor immediately.
                </p>
              </div>`
            : ''
          }

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Thank you for your continued support of our publication.
          </p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0;">This is an automated reminder. Please do not reply to this email.</p>
          <p style="margin: 0;">© 2025 ICMBNT Conference. All rights reserved.</p>
        </div>
      </div>
    `
    };

    return transporter.sendMail(mailOptions);
};

// Send editor credentials email
export const sendEditorCredentialsEmail = async (email, username, password) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginUrl = `${frontendUrl}/login`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Editor Account Credentials - ICMBNT 2026",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
          <h2 style="color: #F5A051; margin: 0; text-align: center;">Welcome to ICMBNT 2026!</h2>
          <p style="color: #666; margin: 10px 0 0 0;">Editor Account Setup</p>
        </div>
        
        <div style="padding: 20px 0;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Dear Editor,
          </p>
          
          <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 20px;">
            Your editor account has been successfully created by the ICMBNT 2026 administration team. You can now log in to the editor dashboard to manage paper submissions and assign reviewers.
          </p>

          <div style="background-color: #f5f5f5; padding: 20px; border-left: 4px solid #F5A051; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0 0 15px 0; font-weight: bold; color: #333; font-size: 16px;">Your Login Credentials:</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-bottom: 15px; font-family: monospace;">
              <p style="margin: 0 0 10px 0; color: #666;">
                <strong>Email/Username:</strong><br>
                <span style="color: #333; word-break: break-all;">${email}</span>
              </p>
              <p style="margin: 0; color: #666;">
                <strong>Password:</strong><br>
                <span style="color: #333; word-break: break-all;">${password}</span>
              </p>
            </div>

            <p style="margin: 0; font-size: 12px; color: #F5A051; font-weight: bold;">
              ⚠️  For your security, please change your password after your first login.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #F5A051; color: white; padding: 12px 32px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 16px;">
               Go to Login
            </a>
          </div>

          <div style="background-color: #ecf3ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #1a5490;">
              <strong>📋 Your Role:</strong><br>
              As an Editor, you will be able to:
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>View and manage paper submissions</li>
                <li>Assign papers to reviewers</li>
                <li>Track review progress</li>
                <li>Communicate with reviewers and authors</li>
                <li>Make final decisions on paper acceptance/rejection</li>
              </ul>
            </p>
          </div>

          <p style="font-size: 13px; color: #666; line-height: 1.6; margin-top: 20px;">
            If you did not expect this email or have any questions about your account, please contact the ICMBNT 2026 administration team.
          </p>

          <p style="font-size: 13px; color: #666;">
            Best regards,<br>
            <strong>ICMBNT 2026 Committee</strong>
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; border-radius: 0 0 5px 5px;">
          <p style="margin: 0 0 8px 0;">This is an automated email. Please do not reply to this message.</p>
          <p style="margin: 0;">© 2025 ICMBNT Conference. All rights reserved.</p>
        </div>
      </div>
    `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Editor credentials email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending editor credentials email:", error);
        throw error;
    }
};

// Send paper acceptance email to author
export const sendAcceptanceEmail = async (authorEmail, authorName, paperTitle, submissionId) => {
    // Fetch the PDF from the backend public documents folder
    let attachments = [];
    try {
        const fs = (await import('fs')).default;
        const path = (await import('path')).default;
        
        // Try to attach the copyright form PDF
        const copyrightFormPath = path.join(process.cwd(), 'public', 'documents', 'ICMBNT_Copyright_Form.pdf');
        
        if (fs.existsSync(copyrightFormPath)) {
            attachments.push({
                filename: 'ICMBNT_Copyright_Form.pdf',
                path: copyrightFormPath
            });
            console.log('📎 Copyright form PDF attached to acceptance email');
        } else {
            console.warn('⚠️ Copyright form PDF not found at:', copyrightFormPath);
        }
    } catch (attachmentError) {
        console.warn('⚠️ Could not attach PDF:', attachmentError.message);
        // Continue without attachment - don't fail
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: authorEmail,
        subject: `🎉 Paper Accepted - ICMBNT 2026`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
                    <h2 style="margin: 0; color: #155724;">🎉 Congratulations!</h2>
                    <p style="margin: 5px 0 0 0; color: #155724; font-weight: bold;">Your Paper Has Been Accepted</p>
                </div>

                <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
                    Dear <strong>${authorName}</strong>,
                </p>

                <p style="font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 20px;">
                    We are delighted to inform you that your paper has been <strong style="color: #28a745;">accepted</strong> 
                    for presentation at the <strong>ICMBNT 2026</strong> conference.
                </p>

                <div style="background-color: #cfe2ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #0066cc;">📋 Paper Details:</p>
                    <table style="width: 100%; font-size: 13px;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold; width: 130px;">Submission ID:</td>
                            <td style="padding: 8px 0; color: #333;">${submissionId}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Paper Title:</td>
                            <td style="padding: 8px 0; color: #333;">${paperTitle}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Author:</td>
                            <td style="padding: 8px 0; color: #333;">${authorName}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">📅 Conference Schedule:</p>
                    <div style="font-size: 14px; color: #333;">
                        <p style="margin: 5px 0;"><strong>📌 Conference Dates:</strong> March 13-14, 2026</p>
                        <p style="margin: 5px 0;"><strong>🏛️ Venue:</strong> KPR Institute of Technology, Coimbatore</p>
                    </div>
                </div>

                <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #2e7d32;">✅ Next Steps:</p>
                    <ol style="margin: 0; padding-left: 20px; color: #333; font-size: 13px;">
                        <li style="margin: 5px 0;">Review and sign the attached Copyright Form</li>
                        <li style="margin: 5px 0;">Prepare your presentation slides</li>
                        <li style="margin: 5px 0;">Ensure you have a valid travel document for the conference</li>
                        <li style="margin: 5px 0;"><strong><a href="https://icmbnt2026-yovz.vercel.app/Registrations" style="color: #0066cc; text-decoration: none;">Click here to register for the conference</a></strong></li>
                        <li style="margin: 5px 0;">Plan your presence for March 13-14, 2026</li>
                    </ol>
                </div>

                <p style="font-size: 13px; line-height: 1.6; color: #666; margin-top: 25px; margin-bottom: 10px;">
                    If you have any questions or need further information, please don't hesitate to contact us.
                </p>

                <p style="font-size: 13px; color: #999; margin: 15px 0 0 0; border-top: 1px solid #ddd; padding-top: 15px;">
                    <strong>ICMBNT 2026 Organizing Committee</strong><br>
                    KPR Institute of Technology, Coimbatore<br>
                    Email: icmbnt2026@kpriet.ac.in
                </p>
            </div>
        `,
        attachments: attachments
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("📧 Acceptance email sent to:", authorEmail, "- Message ID:", info.messageId);
        if (attachments.length > 0) {
            console.log("📎 PDF attachment(s) included in email");
        }
        return info;
    } catch (error) {
        console.error("❌ Error sending acceptance email:", error);
        throw error;
    }
};

export default transporter;
