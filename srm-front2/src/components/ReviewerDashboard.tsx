import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FileText, Send, Clock, AlertCircle, CheckCircle, LogOut, Home, ArrowLeft } from 'lucide-react';

interface Paper {
    _id: string;
    submissionId: string;
    paperTitle: string;
    authorName: string;
    email: string;
    category: string;
    pdfUrl: string;
    pdfFileName: string;
    assignmentDetails?: {
        deadline: string;
        status: string;
        assignedAt: string;
    };
}

interface ReviewFormData {
    comments: string;
    commentsToReviewer: string;  // Internal comments (shown only in system)
    commentsToEditor: string;     // Comments sent to author in decision email
    strengths: string;
    weaknesses: string;
    overallRating: number;
    noveltyRating: number;
    qualityRating: number;
    clarityRating: number;
    recommendation: string;
    round: number;  // Review round (1, 2, 3, etc.)
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ReviewerDashboard = () => {
    const navigate = useNavigate();
    const { submissionId } = useParams<{ submissionId?: string }>();
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [isDirectReviewLink, setIsDirectReviewLink] = useState(false);
    const [paperRevisionData, setPaperRevisionData] = useState<any>(null);  // Store revision info (includes highlighted PDF for round 2)
    const [totalRevisions, setTotalRevisions] = useState(0);  // Total number of revisions for this paper
    const [showBothPdfsModal, setShowBothPdfsModal] = useState(false);  // Toggle for showing both PDFs side-by-side
    const [activePdfInModal, setActivePdfInModal] = useState<'highlighted' | 'response'>('highlighted');  // Which PDF to show in modal
    const [previousReviews, setPreviousReviews] = useState<any[]>([]);  // Store all previous reviews by this reviewer
    const lastLoadedDraft = useRef<{submissionId: string, round: number} | null>(null);  // Track last loaded draft to prevent duplicates
    
    const [formData, setFormData] = useState<ReviewFormData>({
        comments: '',
        commentsToReviewer: '',
        commentsToEditor: '',
        strengths: '',
        weaknesses: '',
        overallRating: 3,
        noveltyRating: 3,
        qualityRating: 3,
        clarityRating: 3,
        recommendation: 'Major Revision',
        round: 1
    });

    useEffect(() => {
        verifyReviewerAccess();
        
        // If accessing via direct review link (e.g., /reviewer/review/ME001)
        if (submissionId) {
            setIsDirectReviewLink(true);
            loadPaperForReview(submissionId);
        } else {
            // Otherwise, load all assigned papers
            fetchAssignedPapers();
        }
    }, [submissionId]);

    useEffect(() => {
        if (selectedPaper) {
            // AUTO-DETECT ROUND: Check if revision exists
            // If revision with highlighted PDF exists -> Round 2, else -> Round 1
            const autoDetectedRound = paperRevisionData?.highlightedPdfUrl ? 2 : 1;
            setFormData(prev => ({ ...prev, round: autoDetectedRound }));
        }
    }, [selectedPaper, paperRevisionData]);

    // Separate useEffect to handle PDF URL changes based on round selection
    useEffect(() => {
        if (selectedPaper && formData.round) {
            // Round 1: Always show original submission PDF
            if (formData.round === 1) {
                setPdfUrl(selectedPaper.pdfUrl);
            } 
            // Round 2+: Show highlighted PDF if available, otherwise show original
            else if (formData.round > 1) {
                if (paperRevisionData?.highlightedPdfUrl) {
                    setPdfUrl(paperRevisionData.highlightedPdfUrl);
                } else {
                    // No revision data, fallback to original
                    setPdfUrl(selectedPaper.pdfUrl);
                }
            }

            // Load draft for the selected round
            loadDraftForRound(selectedPaper.submissionId, formData.round);
        }
    }, [formData.round, selectedPaper?.submissionId]);  // Only trigger when round or paper changes

    const loadDraftForRound = async (submissionId: string, round: number) => {
        // Prevent loading the same draft multiple times
        if (lastLoadedDraft.current?.submissionId === submissionId && lastLoadedDraft.current?.round === round) {
            console.log(`⏭️ Skipping duplicate draft load for ${submissionId} Round ${round}`);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const headers = { Authorization: `Bearer ${token}` };
            const draftResponse = await axios.get(
                `${API_URL}/api/reviewer/papers/${submissionId}/draft?round=${round}`,
                { headers }
            );

            if (draftResponse.data.review && draftResponse.data.review.status === 'Draft') {
                const draft = draftResponse.data.review;
                console.log(`📝 Loaded DRAFT for Round ${round}:`, draft);
                lastLoadedDraft.current = { submissionId, round };
                setFormData(prev => ({
                    ...prev,
                    comments: draft.comments || '',
                    commentsToReviewer: draft.commentsToReviewer || '',
                    commentsToEditor: draft.commentsToEditor || '',
                    strengths: draft.strengths || '',
                    weaknesses: draft.weaknesses || '',
                    overallRating: draft.overallRating || 3,
                    noveltyRating: draft.noveltyRating || 3,
                    qualityRating: draft.qualityRating || 3,
                    clarityRating: draft.clarityRating || 3,
                    recommendation: draft.recommendation || 'Major Revision',
                }));
            } else {
                console.log(`📝 No draft found for Round ${round} - resetting form`);
                lastLoadedDraft.current = { submissionId, round };
                // Reset form if no draft for this round (or if it's already submitted)
                setFormData(prev => ({
                    ...prev,
                    comments: '',
                    commentsToReviewer: '',
                    commentsToEditor: '',
                    strengths: '',
                    weaknesses: '',
                    overallRating: 3,
                    noveltyRating: 3,
                    qualityRating: 3,
                    clarityRating: 3,
                    recommendation: 'Major Revision',
                }));
            }
        } catch (error) {
            console.log(`⚠️ No draft for Round ${round}`);
            lastLoadedDraft.current = { submissionId, round };
            // Reset form on error
            setFormData(prev => ({
                ...prev,
                comments: '',
                commentsToReviewer: '',
                commentsToEditor: '',
                strengths: '',
                weaknesses: '',
                overallRating: 3,
                noveltyRating: 3,
                qualityRating: 3,
                clarityRating: 3,
                recommendation: 'Major Revision',
            }));
        }
    };

    const verifyReviewerAccess = async () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'Reviewer') {
            // Redirect to login if not authenticated
            navigate('/login');
            return;
        }
    };

    const fetchAssignedPapers = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }
            
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.get(`${API_URL}/api/reviewer/papers`, { headers });
            setPapers(response.data.papers || []);
            
            // Don't auto-select - let reviewer choose from list
            // If no paper selected and user visits this route, they'll see the list
        } catch (error: any) {
            console.error('Error fetching papers:', error);
            if (error.response?.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                navigate('/login');
            } else {
                alert(error.response?.data?.message || 'Failed to load assigned papers');
            }
        } finally {
            setLoading(false);
        }
    };

    const loadPaperForReview = async (submissionId: string) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }
            
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.get(
                `${API_URL}/api/reviewer/papers/${submissionId}`,
                { headers }
            );
            
            setSelectedPaper(response.data.paper);
            
            // Store previous reviews
            if (response.data.previousReviews) {
                setPreviousReviews(response.data.previousReviews);
                console.log(`📋 Loaded ${response.data.previousReviews.length} previous reviews:`, response.data.previousReviews);
            }
            
            // Fetch all revisions to know how many revisions exist
            try {
                const revisionsResponse = await axios.get(
                    `${API_URL}/api/papers/revisions/${submissionId}`,
                    { headers }
                );
                const totalRevs = revisionsResponse.data.totalRevisions || 0;
                setTotalRevisions(totalRevs);
                
                // Load the latest revision data
                if (totalRevs > 0) {
                    // Load the latest revision (Revision 1 for first revision, Revision 2 for second, etc.)
                    const latestRevisionNumber = totalRevs;
                    
                    const revisionResponse = await axios.get(
                        `${API_URL}/api/papers/revision/${submissionId}?revisionNumber=${latestRevisionNumber}`,
                        { headers }
                    );
                    console.log('📦 Revision Response:', revisionResponse.data);
                    if (revisionResponse.data.revision) {
                        console.log('✅ Revision found! Highlighted PDF:', revisionResponse.data.revision.highlightedPdfUrl);
                        setPaperRevisionData(revisionResponse.data.revision);
                    } else {
                        console.log('⚠️ No revision data in response');
                        setPaperRevisionData(null);
                    }
                } else {
                    // No revisions - reviewing initial submission
                    setPaperRevisionData(null);
                }
            } catch (err: any) {
                console.log('⚠️ Error fetching revisions:', err.response?.status, err.message);
                setTotalRevisions(0);
                setPaperRevisionData(null);
            }
            
            // Note: Draft will be loaded by useEffect when round is determined
        } catch (error: any) {
            console.error('Error loading paper:', error);
            if (error.response?.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                navigate('/login');
            } else if (error.response?.status === 403) {
                // Paper not accepted yet
                alert('⚠️ You need to accept this assignment via the confirmation email link before you can view the paper.');
            } else {
                alert(error.response?.data?.message || 'Failed to load paper details');
            }
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedPaper) return;

        if (!formData.comments.trim()) {
            alert('Please provide internal review comments');
            return;
        }

        if (!formData.commentsToEditor.trim()) {
            alert('Please provide comments for the editor/author decision');
            return;
        }

        if (window.confirm('Are you sure you want to submit this review? You cannot edit it after submission.')) {
            setSubmitting(true);
            try {
                const token = localStorage.getItem('token');
                
                if (!token) {
                    navigate('/login');
                    return;
                }
                
                const headers = { Authorization: `Bearer ${token}` };

                await axios.post(
                    `${API_URL}/api/reviewer/papers/${selectedPaper.submissionId}/submit-review`,
                    formData,
                    { headers }
                );

                alert('Review submitted successfully!');
                
                // Reset form
                setFormData({
                    comments: '',
                    commentsToReviewer: '',
                    commentsToEditor: '',
                    strengths: '',
                    weaknesses: '',
                    overallRating: 3,
                    noveltyRating: 3,
                    qualityRating: 3,
                    clarityRating: 3,
                    recommendation: 'Major Revision',
                    round: 1
                });
                
                // Refresh papers list
                fetchAssignedPapers();
            } catch (error: any) {
                console.error('Error submitting review:', error);
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    navigate('/login');
                } else {
                    alert(error.response?.data?.message || 'Failed to submit review');
                }
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const getDeadlineStatus = (deadline: string) => {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) {
            return { status: 'overdue', text: `Overdue by ${Math.abs(daysLeft)} day(s)`, color: 'text-red-600' };
        } else if (daysLeft === 0) {
            return { status: 'today', text: 'Due today', color: 'text-orange-600' };
        } else if (daysLeft <= 1) {
            return { status: 'urgent', text: `Due in ${daysLeft} day`, color: 'text-orange-600' };
        } else {
            return { status: 'ok', text: `Due in ${daysLeft} days`, color: 'text-green-600' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading assigned papers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="max-w-full mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {isDirectReviewLink ? 'Paper Review' : 'Reviewer Dashboard'}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {isDirectReviewLink ? 'Review this paper' : 'Review assigned papers'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isDirectReviewLink && (
                                <button
                                    onClick={() => navigate('/reviewer')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Dashboard
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Home
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-full mx-auto px-6 py-6">
                {/* Papers List - Always visible at top */}
                {papers.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-blue-600" />
                            Your Assigned Papers ({papers.length})
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {papers.map((paper) => {
                                // Debug: Log paper details
                                console.log('Paper Card:', {
                                    submissionId: paper.submissionId,
                                    assignmentDetails: paper.assignmentDetails,
                                    status: paper.assignmentDetails?.status
                                });
                                
                                return (
                                    <button
                                        key={paper._id}
                                        onClick={() => {
                                            // Check if reviewer has accepted this assignment
                                            const assignmentStatus = paper.assignmentDetails?.status;
                                            console.log('🔍 Clicked paper:', paper.submissionId, 'Status:', assignmentStatus);
                                            
                                            if (assignmentStatus === 'Accepted') {
                                                // If accepted, load the paper for review
                                                console.log('✅ Status is Accepted - Loading paper...');
                                                loadPaperForReview(paper.submissionId);
                                            } else {
                                                // If not accepted, show message
                                                console.log('⚠️ Status is NOT Accepted:', assignmentStatus);
                                                alert(`⚠️ Please accept this assignment via the confirmation email link before you can view the paper. Current status: ${assignmentStatus || 'Unknown'}`);
                                            }
                                        }}
                                        className={`p-4 rounded-lg text-left transition border-2 ${
                                            selectedPaper?._id === paper._id
                                                ? 'bg-blue-100 border-blue-600 shadow-lg scale-105'
                                                : 'bg-gray-50 border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                        }`}
                                    >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-800">
                                                {paper.submissionId}
                                            </p>
                                            <p className="text-sm font-medium text-gray-700 mt-1 line-clamp-2">
                                                {paper.paperTitle}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Author: {paper.authorName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Category: {paper.category}
                                            </p>
                                        </div>
                                        {selectedPaper?._id === paper._id && (
                                            <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                        )}
                                    </div>
                                    {paper.assignmentDetails && (
                                        <div className="mt-3 space-y-2">
                                            <div className={`text-xs font-medium ${getDeadlineStatus(paper.assignmentDetails.deadline).color}`}>
                                                {getDeadlineStatus(paper.assignmentDetails.deadline).text}
                                            </div>
                                            {/* Show Assignment Status */}
                                            <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                                paper.assignmentDetails.status === 'Accepted'
                                                    ? 'bg-green-100 text-green-800'
                                                    : paper.assignmentDetails.status === 'Rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {paper.assignmentDetails.status === 'Accepted' && '✅ Accepted'}
                                                {paper.assignmentDetails.status === 'Pending' && '⏳ Pending Acceptance'}
                                                {paper.assignmentDetails.status === 'Rejected' && '❌ Rejected'}
                                                {paper.assignmentDetails.status === 'Review Submitted' && '✓ Review Submitted'}
                                            </div>
                                        </div>
                                    )}
                                </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* No Papers Message */}
                {papers.length === 0 && (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Papers Assigned</h3>
                        <p className="text-gray-600">You don't have any papers assigned for review yet.</p>
                    </div>
                )}

                {/* Review Section - Show after paper is selected */}
                {selectedPaper && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side - PDF Viewer (60%) */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
                            <div className="mb-4 border-b pb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        onClick={() => setSelectedPaper(null)}
                                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center gap-2 text-sm"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to List
                                    </button>

                                    {/* View Author Response Button - Show only for Round 2+ */}
                                    {formData.round > 1 && paperRevisionData?.responsePdfUrl && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                window.open(paperRevisionData.responsePdfUrl, '_blank');
                                            }}
                                            className="px-3 py-1 bg-green-50 border border-green-300 text-green-700 rounded hover:bg-green-100 font-semibold text-sm flex items-center gap-1"
                                        >
                                            📝 View Author Response PDF
                                        </button>
                                    )}

                                    {/* View Both PDFs Button - Show only for Round 2+ AND if BOTH PDFs exist */}
                                    {formData.round > 1 && paperRevisionData?.highlightedPdfUrl && paperRevisionData?.responsePdfUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setShowBothPdfsModal(!showBothPdfsModal)}
                                            className={`px-3 py-1 border rounded font-semibold text-sm flex items-center gap-1 ${
                                                showBothPdfsModal 
                                                    ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700' 
                                                    : 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                                            }`}
                                        >
                                            {showBothPdfsModal ? '✕ Close' : '📄📄 Compare PDFs'}
                                        </button>
                                    )}

                                    {/* Review Round Indicator */}
                                    <div className="ml-auto bg-blue-100 px-3 py-1 rounded-full text-sm font-semibold text-blue-800">
                                        📋 Review Round {formData.round}
                                    </div>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">{selectedPaper.paperTitle}</h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <span><strong>ID:</strong> {selectedPaper.submissionId}</span>
                                    <span><strong>Author:</strong> {selectedPaper.authorName}</span>
                                    <span><strong>Category:</strong> {selectedPaper.category}</span>
                                </div>
                                {selectedPaper.assignmentDetails && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Clock className="w-4 h-4" />
                                        <span className={`text-sm font-medium ${getDeadlineStatus(selectedPaper.assignmentDetails.deadline).color}`}>
                                            {getDeadlineStatus(selectedPaper.assignmentDetails.deadline).text}
                                        </span>
                                    </div>
                                )}
                                {/* PDF Type Indicator */}
                                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    {formData.round === 1 ? (
                                        '📄 Reviewing: Original submission'
                                    ) : paperRevisionData ? (
                                        '📝 Reviewing: Author\'s revised version (Highlighted PDF) + Response PDF available below'
                                    ) : (
                                        '⚠️ No revision data available for this round'
                                    )}
                                </div>
                            </div>

                            {/* Inline PDF Comparison - Show only for Round 2+ AND if revision data exists */}
                            {formData.round > 1 && showBothPdfsModal && paperRevisionData && paperRevisionData.highlightedPdfUrl && paperRevisionData.responsePdfUrl && (
                                <div className="mb-4 border-2 border-purple-300 rounded-lg overflow-hidden">
                                    {/* PDF Tabs */}
                                    <div className="flex border-b bg-gray-50">
                                        <button
                                            onClick={() => setActivePdfInModal('highlighted')}
                                            className={`flex-1 px-4 py-3 font-semibold text-center transition ${
                                                activePdfInModal === 'highlighted'
                                                    ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            📝 Highlighted PDF (Author's Changes)
                                        </button>
                                        <button
                                            onClick={() => setActivePdfInModal('response')}
                                            className={`flex-1 px-4 py-3 font-semibold text-center transition ${
                                                activePdfInModal === 'response'
                                                    ? 'border-b-2 border-green-600 text-green-600 bg-white'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            📄 Author Response Document
                                        </button>
                                    </div>

                                    {/* PDF Viewer */}
                                    <div className="bg-gray-100" style={{ height: '60vh' }}>
                                        {activePdfInModal === 'highlighted' && paperRevisionData.highlightedPdfUrl ? (
                                            <iframe
                                                src={paperRevisionData.highlightedPdfUrl}
                                                className="w-full h-full"
                                                title="Highlighted PDF"
                                            />
                                        ) : activePdfInModal === 'response' && paperRevisionData.responsePdfUrl ? (
                                            <iframe
                                                src={paperRevisionData.responsePdfUrl}
                                                className="w-full h-full"
                                                title="Response PDF"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-500">PDF not available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* PDF Viewer */}
                            <div className="bg-gray-200 rounded-lg overflow-hidden" style={{ height: showBothPdfsModal ? 'calc(50vh - 140px)' : 'calc(100vh - 280px)' }}>
                                {pdfUrl ? (
                                    <iframe
                                        src={pdfUrl}
                                        className="w-full h-full"
                                        title="PDF Viewer"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-500">Loading PDF...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Review Form (40%) */}
                        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4" style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Send className="w-5 h-5 text-blue-600" />
                                Submit Review
                            </h3>

                            {/* Review Round Selector with Dynamic Rounds based on Revision */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Review Round
                                </label>
                                <select
                                    value={formData.round}
                                    onChange={(e) => {
                                      const selectedRound = parseInt(e.target.value);
                                      setFormData({ ...formData, round: selectedRound });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {/* Always show Round 1 for initial review */}
                                    <option value="1">Round 1 - Initial Review</option>
                                    
                                    {/* Show Round 2 if at least 1 revision exists */}
                                    {totalRevisions >= 1 && (
                                        <option value="2">Round 2 - After Revision 1</option>
                                    )}
                                    
                                    {/* Show Round 3 if at least 2 revisions exist */}
                                    {totalRevisions >= 2 && (
                                        <option value="3">Round 3 - After Revision 2</option>
                                    )}
                                    
                                    {/* Show Round 4+ for additional revisions */}
                                    {totalRevisions >= 3 && (
                                        <option value="4">Round 4 - After Revision 3</option>
                                    )}
                                </select>
                                <p className="text-xs text-gray-600 mt-1">
                                    {formData.round === 1 
                                        ? '📄 Reviewing original submission' 
                                        : `📝 Reviewing Revision ${formData.round - 1} (Author's revised version)`}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Total revisions: {totalRevisions}
                                </p>
                            </div>

                            {/* Previous Reviews - Show if any exist */}
                            {previousReviews.length > 0 && (
                                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                                        📜 Your Previous Reviews for This Paper
                                    </h4>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {previousReviews.map((review, index) => (
                                            <div key={index} className="p-3 bg-white rounded border border-amber-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-blue-700">
                                                        Round {review.round} Review
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(review.submittedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-xs">
                                                    <p>
                                                        <strong>Recommendation:</strong>{' '}
                                                        <span className={`font-semibold ${
                                                            review.recommendation === 'Accept' ? 'text-green-600' :
                                                            review.recommendation === 'Reject' ? 'text-red-600' :
                                                            'text-orange-600'
                                                        }`}>
                                                            {review.recommendation}
                                                        </span>
                                                    </p>
                                                    <p><strong>Overall Rating:</strong> {review.overallRating}/5</p>
                                                    {review.strengths && (
                                                        <p className="mt-2">
                                                            <strong>Strengths:</strong> {review.strengths}
                                                        </p>
                                                    )}
                                                    {review.weaknesses && (
                                                        <p className="mt-1">
                                                            <strong>Weaknesses:</strong> {review.weaknesses}
                                                        </p>
                                                    )}
                                                    {review.commentsToEditor && (
                                                        <p className="mt-1">
                                                            <strong>Comments to Editor:</strong> {review.commentsToEditor}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-amber-700 mt-2">
                                        ℹ️ These are your previously submitted reviews. Use them as reference when evaluating revisions.
                                    </p>
                                </div>
                            )}

                            {/* Comments */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Review Comments (Internal - Not Sent to Author) <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Internal comments for your records..."
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">These comments are for system tracking only and won't be sent to the author.</p>
                            </div>

                            {/* Comments to Editor */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Private Comments to Editor (Will Not Be Shared to Author) <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.commentsToEditor}
                                    onChange={(e) => setFormData({ ...formData, commentsToEditor: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows={3}
                                    placeholder="Your private comments and observations for the editor only (confidential)..."
                                    required
                                />
                                <p className="text-xs text-red-600 mt-1">These comments are PRIVATE and will NOT be sent to the author. Only the editor will see these.</p>
                            </div>

                            {/* Strengths */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Strengths
                                </label>
                                <textarea
                                    value={formData.strengths}
                                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                    placeholder="What are the paper's strengths?"
                                />
                            </div>

                            {/* Weaknesses */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Weaknesses
                                </label>
                                <textarea
                                    value={formData.weaknesses}
                                    onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                    placeholder="What are the paper's weaknesses?"
                                />
                            </div>

                            {/* Ratings */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3">Ratings (1-5)</h4>
                                
                                {/* Overall Rating */}
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Overall Rating
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={formData.overallRating}
                                            onChange={(e) => setFormData({ ...formData, overallRating: parseInt(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-bold text-blue-600 w-6">{formData.overallRating}</span>
                                    </div>
                                </div>

                                {/* Novelty Rating */}
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Novelty/Originality
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={formData.noveltyRating}
                                            onChange={(e) => setFormData({ ...formData, noveltyRating: parseInt(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-bold text-blue-600 w-6">{formData.noveltyRating}</span>
                                    </div>
                                </div>

                                {/* Quality Rating */}
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Technical Quality
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={formData.qualityRating}
                                            onChange={(e) => setFormData({ ...formData, qualityRating: parseInt(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-bold text-blue-600 w-6">{formData.qualityRating}</span>
                                    </div>
                                </div>

                                {/* Clarity Rating */}
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Clarity/Presentation
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={formData.clarityRating}
                                            onChange={(e) => setFormData({ ...formData, clarityRating: parseInt(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <span className="text-sm font-bold text-blue-600 w-6">{formData.clarityRating}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recommendation <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.recommendation}
                                    onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="Accept">✅ Accept</option>
                                    <option value="Conditional Accept">✔️ Conditional Accept</option>
                                    <option value="Minor Revision">📝 Minor Revision</option>
                                    <option value="Major Revision">📋 Major Revision</option>
                                    <option value="Reject">❌ Reject</option>
                                </select>
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmitReview}
                                disabled={submitting || !formData.comments.trim() || !formData.commentsToEditor.trim()}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Submit Review
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-500 mt-2 text-center">
                                ⚠️ Review cannot be edited after submission
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewerDashboard;
