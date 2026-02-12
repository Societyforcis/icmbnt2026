import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import PageTransition from './PageTransition';
import { CheckCircle, Clock, FileText, Users, AlertCircle, XCircle, X, History, Upload } from 'lucide-react';
import ReuploadPaperModal from './ReuploadPaperModal';
import PaperHistoryTimeline from './PaperHistoryTimeline';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PaperSubmission {
  _id: string;
  submissionId: string;
  paperTitle: string;
  category: string;
  status: string;
  pdfUrl: string;
  assignedEditor?: {
    username: string;
    email: string;
  };
  assignedReviewers?: Array<{
    username: string;
    email: string;
  }>;
  finalDecision?: string;
  editorComments?: string;
  editorCorrections?: string;
  createdAt: string;
  updatedAt: string;
  versions?: Array<{
    version: number;
    pdfUrl: string;
    pdfFileName: string;
    submittedAt: string;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email?: string, username?: string, role?: string }>({});
  const [submission, setSubmission] = useState<PaperSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmission, setHasSubmission] = useState(false);

  // PDF Modal states
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // History and Reupload states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReuploadModal, setShowReuploadModal] = useState(false);

  // Final Selection & Document Upload states
  const [isFinalSelected, setIsFinalSelected] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<any>(null);
  const [isUploadingFinal, setIsUploadingFinal] = useState(false);
  const [finalDocFile, setFinalDocFile] = useState<File | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Redirect based on role
        if (parsedUser.role === 'Admin') {
          navigate('/admin-dashboard');
          return;
        } else if (parsedUser.role === 'Editor') {
          navigate('/editor-dashboard');
          return;
        } else if (parsedUser.role === 'Reviewer') {
          navigate('/reviewer-dashboard');
          return;
        }
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    fetchSubmission();
  }, [navigate]);

  const fetchSubmission = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/papers/my-submission`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.hasSubmission) {
        setSubmission(response.data.submission);
        setHasSubmission(true);
        // Once we have submission, also check selection status
        checkSelectionStatus();
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSelectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/papers/check-selection`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.isSelected) {
        setIsFinalSelected(true);
        setSelectedUserData(response.data.selectedUser);
      }
    } catch (error) {
      console.error('Error checking selection status:', error);
    }
  };

  const handleFinalDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalDocFile || !submission) return;

    setIsUploadingFinal(true);
    try {
      const formData = new FormData();
      formData.append('finalDoc', finalDocFile);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/papers/upload-final-doc/${submission.submissionId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Final document uploaded successfully!',
          confirmButtonColor: '#F5A051'
        });
        setFinalDocFile(null);
        checkSelectionStatus(); // Refresh to show new URL
      }
    } catch (error: any) {
      console.error('Error uploading final doc:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.response?.data?.message || 'Error uploading document'
      });
    } finally {
      setIsUploadingFinal(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'Submitted': 'bg-blue-100 text-blue-800',
      'Editor Assigned': 'bg-purple-100 text-purple-800',
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Review Received': 'bg-indigo-100 text-indigo-800',
      'Revision Required': 'bg-orange-100 text-orange-800',
      'Revised Submitted': 'bg-cyan-100 text-cyan-800',
      'Conditionally Accept': 'bg-teal-100 text-teal-800',
      'Accepted': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Published': 'bg-emerald-100 text-emerald-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Accepted':
      case 'Published':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Under Review':
      case 'Review Received':
        return <Users className="w-5 h-5 text-yellow-600" />;
      case 'Revision Required':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getWorkflowProgress = (status: string) => {
    const workflow = [
      'Submitted',
      'Editor Assigned',
      'Under Review',
      'Review Received',
      'Decision Made'
    ];

    const statusIndex: Record<string, number> = {
      'Submitted': 0,
      'Editor Assigned': 1,
      'Under Review': 2,
      'Review Received': 3,
      'Revision Required': 3,
      'Revised Submitted': 2,
      'Conditionally Accept': 4,
      'Accepted': 4,
      'Rejected': 4,
      'Published': 4
    };

    const currentIndex = statusIndex[status] || 0;
    return { workflow, currentIndex };
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Author Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">
              Welcome back, {user.username || 'User'}!
            </p>
          </header>

          {/* Paper Submission Status */}
          {hasSubmission && submission ? (
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-[#F5A051] px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">Your Paper Submission</h2>
                </div>

                <div className="p-6">
                  {/* Paper Details */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{submission.paperTitle}</h3>
                        <p className="text-gray-600">Submission ID: <span className="font-semibold text-blue-600">{submission.submissionId}</span></p>
                        <p className="text-gray-600">Category: <span className="font-semibold">{submission.category}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(submission.status)}
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Progress */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Review Progress</h4>
                    <div className="relative">
                      {(() => {
                        const { workflow, currentIndex } = getWorkflowProgress(submission.status);
                        return (
                          <div className="flex items-center justify-between">
                            {workflow.map((step, index) => (
                              <div key={step} className="flex flex-col items-center flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index <= currentIndex
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-600'
                                  }`}>
                                  {index < currentIndex ? (
                                    <CheckCircle className="w-6 h-6" />
                                  ) : index === currentIndex ? (
                                    <Clock className="w-6 h-6" />
                                  ) : (
                                    <span>{index + 1}</span>
                                  )}
                                </div>
                                <p className={`mt-2 text-xs text-center ${index <= currentIndex ? 'text-gray-900 font-semibold' : 'text-gray-500'
                                  }`}>
                                  {step}
                                </p>
                                {index < workflow.length - 1 && (
                                  <div className={`absolute top-5 h-0.5 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-300'
                                    }`} style={{
                                      left: `${(index + 1) * (100 / workflow.length)}%`,
                                      width: `${100 / workflow.length}%`
                                    }} />
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Editor & Reviewers Info */}
                  {(submission.assignedEditor || submission.assignedReviewers) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {submission.assignedEditor && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">Assigned Editor</h5>
                          <p className="text-gray-700">{submission.assignedEditor.username}</p>
                        </div>
                      )}
                      {submission.assignedReviewers && submission.assignedReviewers.length > 0 && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2">
                            Reviewers ({submission.assignedReviewers.length})
                          </h5>
                          <p className="text-gray-700">
                            {submission.status === 'Under Review'
                              ? 'Review in progress...'
                              : `${submission.assignedReviewers.length} reviewer(s) assigned`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Decision & Comments */}
                  {submission.finalDecision && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                      <h5 className="font-semibold text-gray-900 mb-2">Editor Decision: {submission.finalDecision}</h5>
                      {submission.editorComments && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700">Comments:</p>
                          <p className="text-gray-700 mt-1">{submission.editorComments}</p>
                        </div>
                      )}
                      {submission.editorCorrections && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700">Required Corrections:</p>
                          <p className="text-gray-700 mt-1">{submission.editorCorrections}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => {
                        setShowPdfModal(true);
                        setSelectedPdfUrl(submission.pdfUrl);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View PDF
                    </button>

                    <button
                      onClick={() => setShowHistoryModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                    >
                      <History className="w-4 h-4 mr-2" />
                      View History
                    </button>

                    {submission.status !== 'Accepted' && submission.status !== 'Rejected' && (
                      <button
                        onClick={() => setShowReuploadModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Re-upload Paper
                      </button>
                    )}

                    {submission.status === 'Revision Required' && (
                      <button
                        onClick={() => navigate(`/edit-submission/${submission.submissionId}`)}
                        className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
                      >
                        Submit Revision
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Final Selected Next Steps */}
              {isFinalSelected && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden border-2 border-green-500 animate__animated animate__fadeIn">
                  <div className="bg-green-600 px-6 py-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-semibold text-white">Congratulations! You are Final Selected</h2>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 mb-6 font-medium">
                      Your paper has been final selected for the conference. As a final step, please upload the conference selected paper in <strong>.doc or .docx</strong> format.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Upload Form */}
                      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Upload className="w-5 h-5 text-[#F5A051]" />
                          Upload Final Document (.doc / .docx)
                        </h3>
                        <form onSubmit={handleFinalDocUpload} className="space-y-4">
                          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                            <input
                              type="file"
                              accept=".doc,.docx,.pdf"
                              onChange={(e) => setFinalDocFile(e.target.files?.[0] || null)}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              required
                            />
                            <p className="mt-2 text-xs text-gray-500">Supported formats: .doc, .docx (Max 15MB)</p>
                          </div>
                          <button
                            type="submit"
                            disabled={isUploadingFinal || !finalDocFile}
                            className={`w-full py-2 px-4 rounded-md text-white font-semibold shadow-md transition ${isUploadingFinal || !finalDocFile ? 'bg-gray-400' : 'bg-[#F5A051] hover:bg-[#e08c3e]'
                              } flex items-center justify-center gap-2`}
                          >
                            {isUploadingFinal ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : null}
                            {isUploadingFinal ? 'Uploading...' : (selectedUserData?.finalDocUrl ? 'Re-upload Document' : 'Upload Final Document')}
                          </button>
                        </form>
                      </div>

                      {/* Status & Download */}
                      <div className="flex flex-col justify-center bg-green-50 p-6 rounded-lg border border-green-100">
                        <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Submission Status
                        </h3>
                        {selectedUserData?.finalDocUrl ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-700 font-bold bg-white p-3 rounded border border-green-200">
                              <CheckCircle className="w-5 h-5" />
                              <span>Final Document Uploaded Successfully</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Submitted on: <span className="font-semibold text-gray-800">{new Date(selectedUserData.finalDocSubmittedAt).toLocaleString()}</span>
                            </p>
                            <a
                              href={selectedUserData.finalDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full justify-center font-bold shadow-md"
                            >
                              <FileText className="w-5 h-4 mr-2" />
                              View Uploaded Document
                            </a>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center py-4 bg-white rounded-lg border border-orange-100 p-6">
                            <Clock className="w-12 h-12 text-orange-400 mb-2 animate-pulse" />
                            <p className="text-gray-700 font-medium">Waiting for your final document submission</p>
                            <p className="text-xs text-gray-500 mt-2">Please upload your paper in .doc format above</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* No Submission - Show Quick Actions */
            <div className="space-y-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    Conference Information
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Important dates and submission guidelines for ICMBNT 2026
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Paper Status</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          No submission yet
                        </span>
                      </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Important Dates</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="flex-1 w-0 truncate">Manuscript Submission Deadline</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="font-medium text-red-600">10 February 2026</span>
                            </div>
                          </li>
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="flex-1 w-0 truncate">Acceptance Notification</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="font-medium">12 February 2026</span>
                            </div>
                          </li>
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="flex-1 w-0 truncate">Registration Deadline</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="font-medium">15 February 2026</span>
                            </div>
                          </li>
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="flex-1 w-0 truncate">Conference Dates</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="font-medium">12-13 March 2026</span>
                            </div>
                          </li>
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-lg font-medium text-gray-900 truncate">Submit a Paper</dt>
                        <dd className="mt-1 text-sm text-gray-500">
                          Submit your research paper
                        </dd>
                      </div>
                    </div>
                    <div className="mt-4">
                      <a href="/paper-submission" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        Submit now &rarr;
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-lg font-medium text-gray-900 truncate">Paper Guidelines</dt>
                        <dd className="mt-1 text-sm text-gray-500">View submission requirements</dd>
                      </div>
                    </div>
                    <div className="mt-4">
                      <a href="/call-for-papers" className="text-sm font-medium text-green-600 hover:text-green-500">
                        View guidelines &rarr;
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-[#F5A051] rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-lg font-medium text-gray-900 truncate">Register for Event</dt>
                        <dd className="mt-1 text-sm text-gray-500">
                          Complete conference registration
                        </dd>
                      </div>
                    </div>
                    <div className="mt-4">
                      <a href="/registrations" className="text-sm font-medium text-[#F5A051] hover:text-[#e08c3e]">
                        Register now &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PDF Modal Viewer */}
        {showPdfModal && selectedPdfUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Paper PDF Viewer</h3>
                <div className="flex items-center gap-4">
                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ◀ Prev
                    </button>
                    <span className="text-sm font-medium">
                      Page {currentPage} / {numPages || '?'}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(numPages || 1, currentPage + 1))}
                      disabled={currentPage >= (numPages || 1)}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next ▶
                    </button>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowPdfModal(false);
                      setSelectedPdfUrl(null);
                      setCurrentPage(1);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* PDF Display */}
              <div className="flex-1 overflow-auto p-4 bg-gray-100">
                <div className="flex justify-center">
                  <Document
                    file={selectedPdfUrl}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={<div className="text-center py-8">Loading PDF...</div>}
                    error={<div className="text-center py-8 text-red-600">Failed to load PDF</div>}
                  >
                    <Page
                      pageNumber={currentPage}
                      className="shadow-lg"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Paper History Modal */}
        {showHistoryModal && submission && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Paper Submission History
                </h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <PaperHistoryTimeline submissionId={submission.submissionId} />
              </div>
            </div>
          </div>
        )}

        {/* Re-upload Modal */}
        {showReuploadModal && submission && (
          <ReuploadPaperModal
            submissionId={submission.submissionId}
            onSuccess={fetchSubmission}
            onClose={() => setShowReuploadModal(false)}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default Dashboard;
