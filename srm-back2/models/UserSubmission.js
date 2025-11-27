import mongoose from 'mongoose';

const userSubmissionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
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

// Create a compound unique index to ensure one submission per email
userSubmissionSchema.index({ email: 1 }, { unique: true });

export const UserSubmission = mongoose.model('UserSubmission', userSubmissionSchema);
