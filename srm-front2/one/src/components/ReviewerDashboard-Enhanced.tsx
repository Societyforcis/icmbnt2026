import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Send, LogOut, Home, Menu, X } from 'lucide-react';
import SearchFilterPanel from './SearchFilterPanel';
import Swal from 'sweetalert2';

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
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
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
        fetchAssignedPapers();
    }, []);

    useEffect(() => {
        if (selectedPaper?.pdfUrl) {
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
            const papersList = response.data.papers || [];
            setPapers(papersList);
            
            if (papersList.length > 0) {
                loadPaperForReview(papersList[0].submissionId);
            }
        } catch (error: any) {
            console.error('Error fetching papers:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to load assigned papers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadPaperForReview = async (submissionId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/reviewer/papers/${submissionId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const paperData = response.data.paper;
            const fullPaper = papers.find(p => p.submissionId === submissionId) || paperData;
            setSelectedPaper(fullPaper);
        } catch (error) {
            console.error('Error loading paper:', error);
        }
    };

    const handleFormChange = (field: keyof ReviewFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmitReview = async () => {
        if (!selectedPaper) {
            Swal.fire('Warning', 'Please select a paper first', 'warning');
            return;
        }

        if (!formData.comments.trim()) {
            Swal.fire('Warning', 'Please provide comments', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/reviewer/papers/${selectedPaper.submissionId}/submit-review`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire('Success', 'Review submitted successfully!', 'success');
            
            // Reset form and fetch papers again
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
            
            fetchAssignedPapers();
        } catch (error: any) {
            console.error('Error submitting review:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to submit review', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading assigned papers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">📋 Papers to Review</h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <SearchFilterPanel
                        papers={papers}
                        selectedPaper={selectedPaper}
                        onFilterChange={() => {}}
                        onSelectPaper={(paper) => {
                            setSelectedPaper(paper);
                            loadPaperForReview(paper.submissionId);
                            setSidebarOpen(false);
                        }}
                        onClearSearch={() => {}}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation */}
                <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden text-gray-600 hover:text-gray-800"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Reviewer Dashboard</h1>
                            <p className="text-sm text-gray-500">Review papers assigned to you</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            <Home className="w-5 h-5" />
                            Home
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6">
                    {selectedPaper ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                            {/* PDF Viewer - 2 columns */}
                            <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-800 text-sm truncate">
                                        {selectedPaper.paperTitle}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ID: {selectedPaper.submissionId} | Author: {selectedPaper.authorName}
                                    </p>
                                </div>
                                <div className="flex-1 overflow-auto bg-gray-100">
                                    {pdfUrl ? (
                                        <iframe
                                            src={pdfUrl}
                                            title="Paper PDF"
                                            className="w-full h-full border-none"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            <p>PDF not available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Review Form - 1 column */}
                            <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto flex flex-col">
                                <div className="mb-6 pb-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-gray-800">📝 Submission Review</h3>
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            In Progress
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-gray-600">
                                            <strong>Category:</strong> {selectedPaper.category}
                                        </p>
                                        <p className="text-gray-600">
                                            <strong>Author:</strong> {selectedPaper.authorName}
                                        </p>
                                        <p className="text-gray-600">
                                            <strong>Email:</strong> {selectedPaper.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Ratings */}
                                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                                            Overall Rating (1-5)
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            value={formData.overallRating}
                                            onChange={(e) => handleFormChange('overallRating', parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="text-sm text-gray-600 mt-1 text-center">
                                            {'⭐'.repeat(formData.overallRating)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Novelty', key: 'noveltyRating' },
                                            { label: 'Quality', key: 'qualityRating' },
                                            { label: 'Clarity', key: 'clarityRating' }
                                        ].map(({ label, key }) => (
                                            <div key={key}>
                                                <label className="text-xs font-semibold text-gray-700 block mb-1">
                                                    {label}
                                                </label>
                                                <select
                                                    value={formData[key as keyof ReviewFormData]}
                                                    onChange={(e) => handleFormChange(key as keyof ReviewFormData, parseInt(e.target.value))}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <option key={n} value={n}>{n}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Comments */}
                                <div className="mb-4">
                                    <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                                        📋 General Comments
                                    </label>
                                    <textarea
                                        value={formData.comments}
                                        onChange={(e) => handleFormChange('comments', e.target.value)}
                                        placeholder="Enter your detailed comments..."
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                    />
                                </div>

                                {/* Strengths & Weaknesses */}
                                <div className="mb-4">
                                    <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                                        ✅ Strengths
                                    </label>
                                    <textarea
                                        value={formData.strengths}
                                        onChange={(e) => handleFormChange('strengths', e.target.value)}
                                        placeholder="Key strengths of the paper..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                                        ❌ Weaknesses
                                    </label>
                                    <textarea
                                        value={formData.weaknesses}
                                        onChange={(e) => handleFormChange('weaknesses', e.target.value)}
                                        placeholder="Areas for improvement..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                    />
                                </div>

                                {/* Recommendation */}
                                <div className="mb-6">
                                    <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                                        🎯 Recommendation
                                    </label>
                                    <select
                                        value={formData.recommendation}
                                        onChange={(e) => handleFormChange('recommendation', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option>Accept</option>
                                        <option>Minor Revision</option>
                                        <option>Major Revision</option>
                                        <option>Reject</option>
                                    </select>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submitting}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2 mt-auto"
                                >
                                    <Send className="w-5 h-5" />
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-white rounded-lg">
                            <div className="text-center">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No paper selected</p>
                                <p className="text-gray-400 text-sm mt-2">Select a paper from the sidebar to begin reviewing</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewerDashboard;
