import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from './PageTransition';
import { CheckCircle, Clock, FileText, Users, AlertCircle, XCircle, X } from 'lucide-react';
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
      }
    } catch (error) {
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
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

                  {/* Actions */}
                  <div className="flex gap-4">
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
                              <span className="font-medium text-red-600">25 March 2026</span>
                            </div>
                          </li>
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="flex-1 w-0 truncate">Acceptance Notification</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="font-medium">5 April 2026</span>
                            </div>
                          </li>
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="flex-1 w-0 truncate">Registration Deadline</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="font-medium">12 April 2026</span>
                            </div>
                          </li>
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="flex-1 w-0 truncate">Conference Dates</span>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <span className="font-medium">13-14 March 2026</span>
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
      </div>
    </PageTransition>
  );
};

export default Dashboard;
