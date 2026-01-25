import mongoose from 'mongoose';

const userSubmissionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  submissionId: {
    type: String,
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  bookingId: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

export const UserSubmission = mongoose.model('UserSubmission', userSubmissionSchema);
