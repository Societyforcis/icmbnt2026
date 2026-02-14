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
  const [submissions, setSubmissions] = useState<PaperSubmission[]>([]);
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0);
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

  useEffect(() => {
    if (submissions.length > 0) {
      checkSelectionStatus();
    }
  }, [selectedPaperIndex, submissions]);

  const fetchSubmission = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/papers/my-submission`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.hasSubmission) {
        const subs = response.data.submissions || [response.data.submission];
        setSubmissions(subs);
        setSubmission(subs[selectedPaperIndex] || subs[0]);
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
        const selectedUsers = response.data.selectedUsers || [response.data.selectedUser];
        const currentPaper = submissions[selectedPaperIndex];

        const matchingSelection = selectedUsers.find((s: any) =>
          s.submissionId?.toLowerCase() === currentPaper?.submissionId?.toLowerCase()
        );

        if (matchingSelection) {
          setIsFinalSelected(true);
          setSelectedUserData(matchingSelection);
        } else {
          setIsFinalSelected(false);
          setSelectedUserData(null);
        }
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
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getWorkflowProgress = (status: string) => {
    const workflow = [
      'Submitted',
      'Under Review',
      'Review Received',
      'Decision Made',
      'Finalized'
    ];

    let currentIndex = 0;
    if (['Submitted', 'Editor Assigned'].includes(status)) currentIndex = 0;
    else if (status === 'Under Review') currentIndex = 1;
    else if (status === 'Review Received') currentIndex = 2;
    else if (['Revision Required', 'Revised Submitted', 'Conditionally Accept'].includes(status)) currentIndex = 3;
    else if (['Accepted', 'Rejected', 'Published'].includes(status)) currentIndex = 4;

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
          <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-8 h-8 text-blue-600" />
                Author Dashboard
              </h1>
              <p className="text-gray-500 mt-1 font-medium">Welcome back, <span className="text-blue-600">{user.username || 'Author'}</span>! Managing {submissions.length} paper(s)</p>
            </div>
            <button
              onClick={() => navigate('/paper-submission')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2 font-bold shadow-md active:scale-95"
            >
              <Upload className="w-5 h-5 font-bold" />
              Submit Another Paper
            </button>
          </div>

          {hasSubmission && submission ? (
            <div className="space-y-6">
              {/* Paper Selection Tabs if multiple papers */}
              {submissions.length > 1 && (
                <div className="bg-white p-2 rounded-xl shadow-sm flex gap-2 overflow-x-auto border border-gray-100 mb-6">
                  {submissions.map((p, idx) => (
                    <button
                      key={p._id}
                      onClick={() => {
                        setSelectedPaperIndex(idx);
                        setSubmission(p);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${selectedPaperIndex === idx
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      {p.submissionId} - {p.paperTitle.substring(0, 20)}...
                    </button>
                  ))}
                </div>
              )}

              {/* Status Card */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-[#F5A051] px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">Your Paper Submission</h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{submission.paperTitle}</h3>
                      <p className="text-gray-600">Submission ID: <span className="font-semibold text-blue-600">{submission.submissionId}</span></p>
                      <p className="text-gray-600">Category: <span className="font-semibold">{submission.category}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(submission.status)}
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(submission.status)} shadow-sm`}>
                        {submission.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress workflow */}
                  <div className="mb-10 px-4">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Review Progress</h4>
                    <div className="relative">
                      {(() => {
                        const { workflow, currentIndex } = getWorkflowProgress(submission.status);
                        return (
                          <div className="flex items-center justify-between">
                            {workflow.map((step, index) => (
                              <div key={step} className="flex flex-col items-center flex-1 relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${index <= currentIndex
                                  ? 'bg-green-500 text-white ring-4 ring-green-100'
                                  : 'bg-gray-200 text-gray-500'
                                  }`}>
                                  {index < currentIndex ? (
                                    <CheckCircle className="w-6 h-6" />
                                  ) : index === currentIndex ? (
                                    <Clock className="w-6 h-6 animate-pulse" />
                                  ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                  )}
                                </div>
                                <p className={`mt-3 text-xs font-bold text-center ${index <= currentIndex ? 'text-gray-900' : 'text-gray-400'
                                  }`}>
                                  {step}
                                </p>
                                {index < workflow.length - 1 && (
                                  <div className={`absolute top-5 left-[50%] w-full h-1 -z-10 transition-all duration-500 ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                                    }`} />
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Editor/Reviewer info */}
                    <div className="space-y-4">
                      {submission.assignedEditor && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <h5 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Assigned Editor
                          </h5>
                          <p className="text-blue-800 font-medium">{submission.assignedEditor.username}</p>
                        </div>
                      )}
                      {submission.assignedReviewers && submission.assignedReviewers.length > 0 && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                          <h5 className="text-sm font-bold text-orange-900 mb-1 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Peer Reviewers
                          </h5>
                          <p className="text-orange-800 font-medium">
                            {submission.status === 'Under Review' ? 'Your paper is being reviewed by experts.' : `${submission.assignedReviewers.length} Reviewer(s) assigned.`}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Decision info */}
                    {submission.finalDecision && (
                      <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 h-full">
                        <h5 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" /> Editor Decision
                        </h5>
                        <div className="space-y-4">
                          <p className="text-indigo-800 font-bold bg-white px-4 py-2 rounded-lg border border-indigo-200 inline-block">
                            {submission.finalDecision}
                          </p>
                          {submission.editorComments && (
                            <div>
                              <p className="text-sm font-bold text-indigo-900">Editor Feedback:</p>
                              <p className="text-indigo-800 mt-1 italic">"{submission.editorComments}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedPdfUrl(submission.pdfUrl);
                        setShowPdfModal(true);
                      }}
                      className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md active:scale-95"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      View Paper
                    </button>
                    <button
                      onClick={() => setShowHistoryModal(true)}
                      className="inline-flex items-center px-6 py-2.5 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition shadow-md active:scale-95"
                    >
                      <History className="w-5 h-5 mr-2" />
                      History
                    </button>
                    {['Revision Required', 'Decision Made'].includes(submission.status) && (
                      <button
                        onClick={() => navigate(`/edit-submission/${submission.submissionId}`)}
                        className="inline-flex items-center px-6 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition shadow-md active:scale-95 animate-pulse"
                      >
                        Submit Revision
                      </button>
                    )}
                    {['Submitted', 'Editor Assigned', 'Review Received'].includes(submission.status) && (
                      <button
                        onClick={() => setShowReuploadModal(true)}
                        className="inline-flex items-center px-6 py-2.5 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition shadow-md active:scale-95"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Re-upload
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Final Selected Next Steps Section */}
              {isFinalSelected && (
                <div className="bg-white shadow-lg rounded-2xl overflow-hidden border-2 border-green-500 transition-all hover:shadow-2xl">
                  <div className="bg-green-600 px-6 py-5 flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Paper Selected for Conference</h2>
                      <p className="text-green-100 text-sm opacity-90">Please complete the final document submission below</p>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      {/* Instructions */}
                      <div className="lg:col-span-5 space-y-6">
                        <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                          <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6" /> Instructions
                          </h3>
                          <ul className="space-y-4">
                            <li className="flex gap-3 text-green-800">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                              <p className="text-sm">Download your reviewed paper and verify all expert comments are addressed items.</p>
                            </li>
                            <li className="flex gap-3 text-green-800">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                              <p className="text-sm font-bold">The final document MUST be in Microsoft Word (.doc or .docx) format.</p>
                            </li>
                            <li className="flex gap-3 text-green-800">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                              <p className="text-sm">Ensure your contact info and author list are final and correct before uploading.</p>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Upload Interface */}
                      <div className="lg:col-span-7">
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-8 relative hover:border-blue-400 transition-colors">
                          <form onSubmit={handleFinalDocUpload} className="space-y-6">
                            <div className="flex flex-col items-center justify-center text-center">
                              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                <Upload className="w-10 h-10 text-blue-500" />
                              </div>
                              <h4 className="text-xl font-bold text-gray-900 mb-2">Upload Camera Ready Version</h4>
                              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Click below to select your final Word document (.doc, .docx)</p>

                              <input
                                type="file"
                                accept=".doc,.docx,.pdf"
                                onChange={(e) => setFinalDocFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-500 
                                        file:mr-4 file:py-3 file:px-8
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-bold
                                        file:bg-blue-600 file:text-white
                                        hover:file:bg-blue-700
                                        cursor-pointer
                                        border border-gray-100 p-2 rounded-2xl bg-gray-50 mb-4"
                              />

                              {finalDocFile && (
                                <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg mb-4">
                                  <FileText className="w-4 h-4" />
                                  {finalDocFile.name}
                                </div>
                              )}

                              <button
                                type="submit"
                                disabled={isUploadingFinal || !finalDocFile}
                                className={`w-full py-4 px-8 rounded-2xl text-white font-extrabold shadow-xl transition-all ${isUploadingFinal || !finalDocFile
                                  ? 'bg-gray-300 pointer-events-none'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-blue-200 hover:-translate-y-1'
                                  } flex items-center justify-center gap-3`}
                              >
                                {isUploadingFinal ? (
                                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : <CheckCircle className="w-6 h-6" />}
                                {isUploadingFinal ? 'Processing Upload...' : 'CONFIRM AND UPLOAD FINAL VERSION'}
                              </button>
                            </div>
                          </form>

                          {selectedUserData?.finalDocUrl && (
                            <div className="mt-8 pt-8 border-t border-gray-100">
                              <div className="flex items-center justify-between bg-green-50 p-4 rounded-2xl border border-green-100">
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="text-green-600" />
                                  <div>
                                    <p className="text-green-900 font-bold mb-0.5">Previously Uploaded</p>
                                    <p className="text-green-700 text-xs">ID: {selectedUserData.submissionId}</p>
                                  </div>
                                </div>
                                <a
                                  href={selectedUserData.finalDocUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white text-green-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition"
                                >
                                  Download
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-10 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Submissions Found</h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                You haven't submitted any papers yet. Start by submitting your research abstract for ICMBNT 2026.
              </p>
              <button
                onClick={() => navigate('/paper-submission')}
                className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-200 active:scale-95"
              >
                Submit Your First Paper
              </button>
            </div>
          )}
        </div>

        {/* PDF Modal */}
        {showPdfModal && selectedPdfUrl && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl h-[95vh] rounded-2xl overflow-hidden flex flex-col relative">
              <div className="bg-gray-100 p-4 border-b flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white rounded-lg shadow disabled:opacity-50"
                  >◀</button>
                  <span className="font-bold text-gray-700">Page {currentPage} of {numPages || '?'}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(numPages || prev, prev + 1))}
                    disabled={currentPage === numPages}
                    className="p-2 bg-white rounded-lg shadow disabled:opacity-50"
                  >▶</button>
                </div>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
                ><X /></button>
              </div>
              <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center">
                <Document
                  file={selectedPdfUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<div className="animate-pulse text-blue-600 font-bold">Rendering Document...</div>}
                >
                  <Page
                    pageNumber={currentPage}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-2xl"
                    width={800}
                  />
                </Document>
              </div>
            </div>
          </div>
        )}

        {/* Paper History Modal */}
        {showHistoryModal && submission && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate__animated animate__fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
              <div className="p-6 border-b flex items-center justify-between bg-gray-50 rounded-t-3xl">
                <h3 className="text-2xl font-extrabold text-blue-900 flex items-center gap-3">
                  <History className="text-blue-500" /> Paper History
                </h3>
                <button onClick={() => setShowHistoryModal(false)} className="bg-white p-2 rounded-full shadow-sm hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                  <X />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-white">
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
