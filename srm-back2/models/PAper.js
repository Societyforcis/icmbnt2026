import mongoose from 'mongoose';

const paperSubmissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    unique: true,
    required: true
  },
  paperTitle: String,
  authorName: String,
  email: String,
  phone: String,
  category: String,
  abstractFileUrl: String,
  status: {
    type: String,
    default: 'Under Review'
  },
  submissionDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const PaperSubmission = mongoose.model('PaperSubmission', paperSubmissionSchema);
export default PaperSubmission;