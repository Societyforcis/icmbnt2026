import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { PaperSubmission } from './models/Paper.js';  // Note the correct path and import
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UserSubmission } from './models/UserSubmission.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET;


app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json());

app.options('*', cors());


app.options('/signin', cors());
app.options('/login', cors());
app.options('/submit-paper', cors());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Atlas Connected Successfully to database 'SRM'");
  })
  .catch(err => {
    console.error("MongoDB Connection Error Details:", {
      message: err.message,
      stack: err.stack
    });
    process.exit(1);
  });

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Update the sendVerificationEmail function to use the frontend URL from environment
const sendVerificationEmail = async (email, token) => {
  console.log(`Sending verification email to ${email} with token: ${token}`);


  const verificationData = {
    token: token,
    email: email,
    timestamp: Date.now()
  };


  const encodedData = Buffer.from(JSON.stringify(verificationData)).toString('base64');

  // Use frontend URL from environment or default to the deployed URL
  const frontendUrl = process.env.FRONTEND_URL || 'https://societycisicmbnt2025.vercel.app';
  const verificationUrl = `http://localhost:5173/verify?data=${encodedData}`;
  console.log("Verification URL created:", verificationUrl);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email - ICMBNT 2025",
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <h2 style="color: #F5A051; text-align: center;">Welcome to ICMBNT 2025!</h2>
                <p>Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #F5A051; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                       Verify Email Address
                    </a>
                </div>
                <p style="color: #666; text-align: center;">
                    This verification link will expire in 24 hours.
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

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    html: `
            <h2>Password Reset Request</h2>
            <p>Your OTP for password reset is: <strong>${otp}</strong></p>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
  };
  return transporter.sendMail(mailOptions);
};

app.get("/", (req, res) => {
  res.send("In srm backend");
})
// JWT verification middleware
const verifyJWT = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ success: false, message: "A token is required for authentication" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    // Check if the user's email is verified
    if (!user.verified) {
      return res.status(200).json({
        success: false,
        verified: false,
        needsVerification: true,
        message: "Please verify your email before logging in"
      });
    }

    // User is verified and password is correct - create token and log in
    const token = jwt.sign({
      email,
      userId: user._id,
      username: user.username
    }, secret, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      verified: true,
      token,
      email: user.email,
      username: user.username
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login",
      error: error.message
    });
  }
});

// Signin (Registration) route
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      username: email.split('@')[0], // Generate a username from email
      email,
      password: hash,
      verified: false,
      verificationToken,
      verificationExpires: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    });

    await newUser.save();

    try {
      await sendVerificationEmail(email, verificationToken);

      return res.status(201).json({
        success: true,
        message: "Account created. Please check your email to verify your account."
      });
    } catch (emailError) {
      // If email sending fails, still create the account but inform the user
      console.error("Failed to send verification email:", emailError);
      return res.status(201).json({
        success: true,
        message: "Account created, but we couldn't send a verification email. Please contact support."
      });
    }
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration",
      error: error.message
    });
  }
});

// Email verification endpoint (legacy format)
app.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  console.log("Received verification request with token:", token);

  if (!token) {
    console.log("Verification failed: Missing token");
    return res.status(400).json({
      success: false,
      message: "Verification token is missing"
    });
  }

  try {
    console.log("Looking for user with token:", token);

    // First try to find without expiry check to see if token exists at all
    const anyUser = await User.findOne({ verificationToken: token });
    if (!anyUser) {
      console.log("No user found with this token");
      return res.status(400).json({
        success: false,
        message: "Invalid verification token. The token may not exist in our system."
      });
    }

    // Now check with expiry
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() }
    });

    if (!user) {
      console.log("Token exists but may be expired");
      // Check if token is expired
      const expiredUser = await User.findOne({
        verificationToken: token,
        verificationExpires: { $lte: new Date() }
      });

      if (expiredUser) {
        console.log("Token is expired");
        return res.status(400).json({
          success: false,
          message: "Verification token has expired. Please request a new verification email."
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token. Please request a new verification email."
      });
    }

    console.log("Valid token found, updating user verification status");

    // Update user verification status
    user.verified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    console.log("User email verified successfully");

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during verification. Please try again.",
      error: error.message
    });
  }
});

// New verification endpoint for encoded JSON data
app.post('/verify-email-token', async (req, res) => {
  const { token, email } = req.body;

  console.log("Received verification request with token and email:", { token, email });

  if (!token || !email) {
    console.log("Verification failed: Missing token or email");
    return res.status(400).json({
      success: false,
      message: "Verification data is incomplete"
    });
  }

  try {
    // Look for a user with both the token and matching email for added security
    const user = await User.findOne({
      email: email,
      verificationToken: token,
      verificationExpires: { $gt: new Date() }
    });

    if (!user) {
      console.log("Invalid or expired verification data");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token. Please request a new verification email."
      });
    }

    console.log("Valid token found, updating user verification status");

    // Update user verification status
    user.verified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    console.log("User email verified successfully");

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during verification. Please try again.",
      error: error.message
    });
  }
});

// Forgot password route
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    user.resetPasswordOTP = otp;
    user.resetPasswordExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email"
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      error: error.message
    });
  }
});

// Reset password route
app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while resetting your password",
      error: error.message
    });
  }
});

// Resend verification email
app.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ success: false, message: "Email already verified" });
    }

    // Generate a new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Update user with new token and expiry time
    user.verificationToken = verificationToken;
    user.verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
    await user.save();

    // Send the verification email
    await sendVerificationEmail(email, verificationToken);

    return res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox."
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while sending the verification email",
      error: error.message
    });
  }
});

// Protected route example
app.get('/protected', verifyJWT, (req, res) => {
  res.json({ success: true, message: "You have access to protected data", user: req.user });
});

// Collections listing route
app.get('/collections', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json(collections.map(col => col.name));
  } catch (error) {
    res.status(500).json({ error: 'Error fetching collections' });
  }
});

// Debug route to check tokens
app.get('/debug/tokens', async (req, res) => {
  try {
    // Find users with verification tokens
    const users = await User.find({ verificationToken: { $exists: true } })
      .select('email verificationToken verificationExpires')
      .lean();

    return res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        email: u.email,
        tokenExists: !!u.verificationToken,
        tokenLength: u.verificationToken ? u.verificationToken.length : 0,
        expires: u.verificationExpires,
        isExpired: u.verificationExpires < new Date()
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking tokens",
      error: error.message
    });
  }
});
// File storage configuration for uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /doc|docx|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only .doc, .docx, and .pdf files are allowed'));
  }
});

// Improved helper function to generate submission ID
const generateSubmissionId = async (category) => {
  const prefix = category.split(' ')[0].substring(0, 2).toUpperCase();

  // Find the highest existing ID for this category
  const highestSubmission = await PaperSubmission.findOne(
    { submissionId: new RegExp(`^${prefix}\\d{3}$`) },
    { submissionId: 1 }
  ).sort({ submissionId: -1 });

  let nextNum = 1;

  if (highestSubmission) {
    // Extract the number from the highest ID
    const highestNum = parseInt(highestSubmission.submissionId.substring(2));
    nextNum = highestNum + 1;
  }

  // Format with leading zeros
  const paddedNum = nextNum.toString().padStart(3, '0');
  const newId = `${prefix}${paddedNum}`;

  // Check if this ID already exists
  const existingSubmission = await PaperSubmission.findOne({ submissionId: newId });

  if (existingSubmission) {
    console.log(`ID ${newId} already exists, incrementing number...`);
    // Try next number in sequence
    return generateSubmissionIdWithNum(category, nextNum + 1);
  }

  return newId;
};

// Helper function to generate ID with a specific number
const generateSubmissionIdWithNum = async (category, num) => {
  const prefix = category.split(' ')[0].substring(0, 2).toUpperCase();
  const paddedNum = num.toString().padStart(3, '0');
  const newId = `${prefix}${paddedNum}`;

  // Check if this ID already exists
  const existingSubmission = await PaperSubmission.findOne({ submissionId: newId });

  if (existingSubmission) {
    console.log(`ID ${newId} already exists, incrementing number...`);
    // Try next number in sequence
    return generateSubmissionIdWithNum(category, num + 1);
  }

  return newId;
};

// Email sending function to be used by the paper submission route
const sendPaperSubmissionEmails = async (submissionData) => {
  // Create email options for author
  const authorMailOptions = {
    from: process.env.EMAIL_USER,
    to: submissionData.email,
    subject: `Paper Submission Confirmation - ${submissionData.submissionId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F5A051;">Paper Submission Confirmation</h2>
        <p>Dear ${submissionData.authorName},</p>
        <p>Your paper has been successfully submitted to ICMBNT 2025.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <p><strong>Submission ID:</strong> ${submissionData.submissionId}</p>
          <p><strong>Paper Title:</strong> ${submissionData.paperTitle}</p>
          <p><strong>Category:</strong> ${submissionData.category}</p>
          <p><strong>Status:</strong> Under Review</p>
        </div>
        <p>We will review your submission and notify you of any updates through this email address.</p>
        <p>Best regards,<br>ICMBNT 2025 Committee</p>
      </div>
    `
  };

  // Email to admin with submission details
  const adminMailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Paper Submission - ${submissionData.submissionId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F5A051;">New Paper Submission Received</h2>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <p><strong>Submission ID:</strong> ${submissionData.submissionId}</p>
          <p><strong>Author:</strong> ${submissionData.authorName}</p>
          <p><strong>Email:</strong> ${submissionData.email}</p>
          <p><strong>Paper Title:</strong> ${submissionData.paperTitle}</p>
          <p><strong>Category:</strong> ${submissionData.category}</p>
          ${submissionData.topic ? `<p><strong>Topic:</strong> ${submissionData.topic}</p>` : ''}
          <p><strong>Status:</strong> Under Review</p>
        </div>
      </div>
    `
  };

  // Add attachment if file was uploaded
  if (submissionData.filePath && fs.existsSync(submissionData.filePath)) {
    console.log(`Attaching file: ${submissionData.filePath}`);
    // Add attachment to both emails
    adminMailOptions.attachments = [{
      filename: submissionData.fileName,
      path: submissionData.filePath
    }];
    // Also attach to author confirmation if needed
    authorMailOptions.attachments = [{
      filename: submissionData.fileName,
      path: submissionData.filePath
    }];
  } else {
    console.log('No file to attach or file does not exist');
  }

  // Send both emails and handle any errors
  try {
    const [authorEmail, adminEmail] = await Promise.all([
      transporter.sendMail(authorMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);
    return { authorEmail, adminEmail };
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error;
  }
};

// Update the paper submission route with file attachment handling
app.post('/submit-paper', upload.single('abstract'), async (req, res) => {
  console.log('Received paper submission request:', req.body);
  console.log('File:', req.file);

  try {
    const { email } = req.body;

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

    // Validate required fields based on schema
    const requiredFields = ['paperTitle', 'authorName', 'email', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Generate submission ID and booking ID
    const submissionId = await generateSubmissionId(req.body.category);
    const bookingId = generateBookingId();

    console.log('Generated IDs:', { submissionId, bookingId });

    // Get file details for the database and email
    let abstractFileUrl = null;
    let fileName = null;
    let fileData = null;

    if (req.file) {
      fileName = req.file.originalname;
      fileData = req.file.buffer.toString('base64');
      abstractFileUrl = `data:${req.file.mimetype};base64,${fileData}`;
      console.log(`File processed: ${fileName}`);
    }

    // Create new submission object matching the schema
    const newSubmission = new PaperSubmission({
      submissionId,
      paperTitle: req.body.paperTitle,
      authorName: req.body.authorName,
      email: req.body.email,
      category: req.body.category,
      topic: req.body.topic || '', // Optional field
      abstractFileUrl: abstractFileUrl,
      status: 'Under Review' // Default status from schema
    });

    // Create user submission tracking record
    const userSubmission = new UserSubmission({
      email: req.body.email,
      submissionId,
      bookingId
    });

    // Validate submission against schema
    const validationError = newSubmission.validateSync();
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationError.errors
      });
    }

    console.log('Saving submission:', newSubmission);
    await Promise.all([
      newSubmission.save(),
      userSubmission.save()
    ]);
    console.log('Submission saved successfully with booking ID:', bookingId);

    // Send confirmation emails with proper error handling and file attachment
    try {
      // Create email options for author
      const authorMailOptions = {
        from: process.env.EMAIL_USER,
        to: req.body.email,
        subject: `Paper Submission Confirmation - ${submissionId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #F5A051;">Paper Submission Confirmation</h2>
            <p>Dear ${req.body.authorName},</p>
            <p>Your paper has been successfully submitted to ICMBNT 2025.</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              <p><strong>Paper Title:</strong> ${req.body.paperTitle}</p>
              <p><strong>Category:</strong> ${req.body.category}</p>
              <p><strong>Status:</strong> Under Review</p>
            </div>
            <p>We will review your submission and notify you of any updates through this email address.</p>
            <p>Best regards,<br>ICMBNT 2025 Committee</p>
          </div>
        `
      };

      // Email to admin with submission details
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `New Paper Submission - ${submissionId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #F5A051;">New Paper Submission Received</h2>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
              <p><strong>Submission ID:</strong> ${submissionId}</p>
              <p><strong>Author:</strong> ${req.body.authorName}</p>
              <p><strong>Email:</strong> ${req.body.email}</p>
              <p><strong>Paper Title:</strong> ${req.body.paperTitle}</p>
              <p><strong>Category:</strong> ${req.body.category}</p>
              ${req.body.topic ? `<p><strong>Topic:</strong> ${req.body.topic}</p>` : ''}
              <p><strong>Status:</strong> Under Review</p>
            </div>
          </div>
        `
      };

      // Add attachment if file was uploaded
      if (req.file) {
        const attachmentData = {
          filename: fileName,
          content: Buffer.from(fileData, 'base64'),
          encoding: 'base64'
        };

        adminMailOptions.attachments = [attachmentData];
        authorMailOptions.attachments = [attachmentData];
      }

      // Send both emails
      const [authorEmail, adminEmail] = await Promise.all([
        transporter.sendMail(authorMailOptions),
        transporter.sendMail(adminMailOptions)
      ]);

      console.log('Confirmation emails sent successfully');

      // Return success response
      res.status(201).json({
        success: true,
        message: "Paper submitted successfully and confirmation emails sent",
        submissionId,
        bookingId,
        paperDetails: {
          title: req.body.paperTitle,
          category: req.body.category,
          status: 'Under Review'
        }
      });
    } catch (emailError) {
      // Log email error but don't fail the submission
      console.error('Error sending confirmation emails:', emailError);
      res.status(201).json({
        success: true,
        message: "Paper submitted successfully but there was an issue sending confirmation emails",
        submissionId,
        bookingId,
        paperDetails: {
          title: req.body.paperTitle,
          category: req.body.category,
          status: 'Under Review'
        }
      });
    }
  } catch (error) {
    console.error('Error submitting paper:', error);
    res.status(500).json({
      success: false,
      message: "Error processing paper submission",
      error: error.message
    });
  }
});

// Get submission status route
app.get('/paper-status/:submissionId', async (req, res) => {
  try {
    const submission = await PaperSubmission.findOne({
      submissionId: req.params.submissionId
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found"
      });
    }

    res.json({
      success: true,
      submission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving submission status",
      error: error.message
    });
  }
});

// Add this route to test email functionality
app.get('/test-email', async (req, res) => {
  try {
    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email',
      text: 'This is a test email to verify the configuration is working.'
    };

    console.log('Sending test email...');
    const info = await transporter.sendMail(testMailOptions);
    console.log('Test email sent:', info);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/user-submission', verifyJWT, async (req, res) => {
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
    });

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
});

// Get all papers (for editor dashboard)
app.get('/api/papers', verifyJWT, async (req, res) => {
  try {
    const papers = await PaperSubmission.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: papers.length,
      papers: papers
    });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching papers",
      error: error.message
    });
  }
});

app.put('/edit-submission/:submissionId', verifyJWT, upload.single('abstract'), async (req, res) => {
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

    // Handle file upload if new file provided
    if (req.file) {
      // If there's an existing file, you might want to delete it
      // Delete old file code would go here

      paperSubmission.abstractFileUrl = `/uploads/${req.file.filename}`;

      // Get file details for the email
      filePath = req.file.path;
      fileName = req.file.originalname;
    }

    // Save the updated submission
    await paperSubmission.save();

    // Send confirmation email for the update
    try {
      await sendUpdateConfirmationEmail({
        submissionId,
        bookingId: userSubmission.bookingId,
        paperTitle: paperSubmission.paperTitle,
        authorName: paperSubmission.authorName,
        email,
        category: paperSubmission.category,
        filePath: req.file ? req.file.path : null,
        fileName: req.file ? req.file.originalname : null
      });
    } catch (emailError) {
      console.error("Failed to send update confirmation:", emailError);
    }

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
});

const sendUpdateConfirmationEmail = async (submissionData) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: submissionData.email,
    subject: `Paper Submission Update - ${submissionData.submissionId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F5A051;">Paper Submission Update</h2>
        <p>Dear ${submissionData.authorName},</p>
        <p>Your paper submission has been successfully updated.</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <p><strong>Submission ID:</strong> ${submissionData.submissionId}</p>
          <p><strong>Booking ID:</strong> ${submissionData.bookingId}</p>
          <p><strong>Paper Title:</strong> ${submissionData.paperTitle}</p>
          <p><strong>Category:</strong> ${submissionData.category}</p>
          <p><strong>Status:</strong> Under Review</p>
        </div>
        <p>Best regards,<br>ICMBNT 2025 Committee</p>
      </div>
    `
  };

  // Add attachment if file was uploaded
  if (submissionData.filePath && fs.existsSync(submissionData.filePath)) {
    mailOptions.attachments = [{
      filename: submissionData.fileName,
      path: submissionData.filePath
    }];
  }

  return transporter.sendMail(mailOptions);
};

// Add this function in the server.js file if missing

// Generate booking ID
const generateBookingId = () => {
  const timestamp = Date.now().toString().substring(6);
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BK${timestamp}${randomNum}`;
};

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // console.log('Allowed origins for CORS:', allowedOrigins);
});