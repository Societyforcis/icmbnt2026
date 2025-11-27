import { useState, useEffect } from 'react';
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
    strengths: string;
    weaknesses: string;
    overallRating: number;
    noveltyRating: number;
    qualityRating: number;
    clarityRating: number;
    recommendation: string;
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
    
    const [formData, setFormData] = useState<ReviewFormData>({
        comments: '',
        strengths: '',
        weaknesses: '',
        overallRating: 3,
        noveltyRating: 3,
        qualityRating: 3,
        clarityRating: 3,
        recommendation: 'Major Revision'
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
        if (selectedPaper?.pdfUrl) {
            // Use Cloudinary URL directly
            setPdfUrl(selectedPaper.pdfUrl);
        }
    }, [selectedPaper]);

    const verifyReviewerAccess = async () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || role !== 'Reviewer') {
            alert('Access denied. Reviewer login required.');
            navigate('/login');
            return;
        }
    };

    const fetchAssignedPapers = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.get(`${API_URL}/api/reviewer/papers`, { headers });
            setPapers(response.data.papers || []);
            
            // Auto-select first paper if available
            if (response.data.papers && response.data.papers.length > 0) {
                loadPaperForReview(response.data.papers[0].submissionId);
            }
        } catch (error: any) {
            console.error('Error fetching papers:', error);
            alert(error.response?.data?.message || 'Failed to load assigned papers');
        } finally {
            setLoading(false);
        }
    };

    const loadPaperForReview = async (submissionId: string) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.get(
                `${API_URL}/api/reviewer/papers/${submissionId}`,
                { headers }
            );
            
            setSelectedPaper(response.data.paper);
            
            // Load existing draft if available
            try {
                const draftResponse = await axios.get(
                    `${API_URL}/api/reviewer/papers/${submissionId}/draft`,
                    { headers }
                );
                
                if (draftResponse.data.review) {
                    const draft = draftResponse.data.review;
                    setFormData({
                        comments: draft.comments || '',
                        strengths: draft.strengths || '',
                        weaknesses: draft.weaknesses || '',
                        overallRating: draft.overallRating || 3,
                        noveltyRating: draft.noveltyRating || 3,
                        qualityRating: draft.qualityRating || 3,
                        clarityRating: draft.clarityRating || 3,
                        recommendation: draft.recommendation || 'Major Revision'
                    });
                } else {
                    console.log('No existing draft found - starting fresh');
                }
            } catch (draftError: any) {
                // Handle any unexpected errors
                console.warn('Could not load draft:', draftError?.message);
            }
        } catch (error: any) {
            console.error('Error loading paper:', error);
            alert(error.response?.data?.message || 'Failed to load paper details');
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedPaper) return;

        if (!formData.comments.trim()) {
            alert('Please provide review comments');
            return;
        }

        if (window.confirm('Are you sure you want to submit this review? You cannot edit it after submission.')) {
            setSubmitting(true);
            try {
                const token = localStorage.getItem('token');
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
                    strengths: '',
                    weaknesses: '',
                    overallRating: 3,
                    noveltyRating: 3,
                    qualityRating: 3,
                    clarityRating: 3,
                    recommendation: 'Major Revision'
                });
                
                // Refresh papers list
                fetchAssignedPapers();
            } catch (error: any) {
                console.error('Error submitting review:', error);
                alert(error.response?.data?.message || 'Failed to submit review');
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
                {papers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Papers Assigned</h3>
                        <p className="text-gray-600">You don't have any papers assigned for review yet.</p>
                    </div>
                ) : !selectedPaper ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Paper</h3>
                        <p className="text-gray-600">Choose a paper from your assigned list to review.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side - PDF Viewer (60%) */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
                            <div className="mb-4 border-b pb-3">
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
                            </div>

                            {/* PDF Viewer */}
                            <div className="bg-gray-200 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
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

                            {/* Comments */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Review Comments <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Provide detailed review comments..."
                                    required
                                />
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
                                disabled={submitting || !formData.comments.trim()}
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

                {/* Paper List Below (if multiple papers and not direct link) */}
                {papers.length > 1 && !isDirectReviewLink && (
                    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Assigned Papers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {papers.map((paper) => (
                                <div
                                    key={paper._id}
                                    onClick={() => loadPaperForReview(paper.submissionId)}
                                    className={`p-3 border rounded-lg cursor-pointer hover:shadow-md transition ${
                                        selectedPaper?.submissionId === paper.submissionId
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:border-blue-300'
                                    }`}
                                >
                                    <h4 className="font-semibold text-sm text-gray-800 mb-1">{paper.paperTitle}</h4>
                                    <p className="text-xs text-gray-600 mb-2">
                                        <strong>ID:</strong> {paper.submissionId} | <strong>Category:</strong> {paper.category}
                                    </p>
                                    {paper.assignmentDetails && (
                                        <div className="flex items-center gap-1 text-xs">
                                            <Clock className="w-3 h-3" />
                                            <span className={getDeadlineStatus(paper.assignmentDetails.deadline).color}>
                                                {getDeadlineStatus(paper.assignmentDetails.deadline).text}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewerDashboard;
