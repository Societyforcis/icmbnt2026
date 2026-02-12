import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
    LayoutDashboard,
    FileText,
    Users,
    CheckCircle,
    Clock,
    Menu,
    X,
    Eye,
    UserPlus,
    TrendingUp,
    AlertCircle,
    Search,
    Filter,
    Check,
    Cloud,
    MessageSquare,
    Send,
    RefreshCw
} from 'lucide-react';
import ReviewerFilterPanel, { Reviewer } from './ReviewerFilterPanel';
import ReviewerDetailsPanel from './ReviewerDetailsPanel';
import PDFManagement from './PDFManagement';
import ReviewerChat from './ReviewerChat';
import PaperHistoryTimeline from './PaperHistoryTimeline';
import { History } from 'lucide-react';
import AdminSelectedUsers from './AdminSelectedUsers';

interface Paper {
    _id: string;
    submissionId: string;
    paperTitle: string;
    authorName: string;
    email: string;
    category: string;
    status: string;
    pdfUrl: string;
    assignedReviewers: any[];
    reviewAssignments?: any[];
    createdAt: string;
}

interface DashboardStats {
    totalPapers: number;
    pendingReview: number;
    reviewsReceived: number;
    decisionsMade: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const NavItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition mb-2 ${active ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
            }`}
    >
        <Icon className="w-5 h-5" />
        {!collapsed && <span>{label}</span>}
    </button>
);

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        'Submitted': 'bg-blue-100 text-blue-800',
        'Editor Assigned': 'bg-purple-100 text-purple-800',
        'Under Review': 'bg-yellow-100 text-yellow-800',
        'Review Received': 'bg-indigo-100 text-indigo-800',
        'Accepted': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800',
        'Revision Required': 'bg-orange-100 text-orange-800'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

const EditorDashboard = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [papers, setPapers] = useState<Paper[]>([]);
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalPapers: 0,
        pendingReview: 0,
        reviewsReceived: 0,
        decisionsMade: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create reviewer states
    const [showCreateReviewer, setShowCreateReviewer] = useState(false);

    const generateRandomPassword = (length = 10) => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let retVal = '';
        for (let i = 0; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return retVal;
    };

    const [newReviewer, setNewReviewer] = useState({
        email: '',
        username: '',
        password: generateRandomPassword()
    });

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>(''); // Status filter state

    // Paper details view state (instead of modal)
    const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);
    const [paperReviewers, setPaperReviewers] = useState<any[]>([]);
    // @ts-ignore - paperReReviews is used indirectly through reviewer.reReview property
    const [paperReReviews, setPaperReReviews] = useState<any[]>([]); // Re-reviews (Round 2)
    const [reviewerListLoading, setReviewerListLoading] = useState(false);
    const [paperDetailsTab, setPaperDetailsTab] = useState<'details' | 'reviewers'>('details');

    // Review viewing state - REMOVED (Reviews tab removed)
    // const [allReviews, setAllReviews] = useState<any[]>([]);
    // const [viewingReviewId, setViewingReviewId] = useState<string | null>(null);
    // const [viewingSubmissionId, setViewingSubmissionId] = useState<string | null>(null);

    // Reviewer message/details state
    const [selectedReviewForDetails, setSelectedReviewForDetails] = useState<{ reviewId: string; submissionId: string } | null>(null);
    const [activeChat, setActiveChat] = useState<{ submissionId: string; reviewerId: string; reviewerName: string; reviewId?: string | null } | null>(null);

    // Author message state for paper cards
    const [selectedPaperForAuthorMessage, setSelectedPaperForAuthorMessage] = useState<string | null>(null);

    // Message and Reviewer Filter states
    const [, setFilteredReviewers] = useState<any[]>([]);
    const [selectedReviewerFilter, setSelectedReviewerFilter] = useState<any | null>(null);




    // Author message states
    const [authorMessageText, setAuthorMessageText] = useState('');
    const [authorMessageLoading, setAuthorMessageLoading] = useState(false);
    const [showDetailInlineMessage, setShowDetailInlineMessage] = useState(false);


    // Decision-making states
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState<'accept' | 'reject' | 'revision' | null>(null);
    const [revisionMessage, setRevisionMessage] = useState('');
    const [revisionDeadline, setRevisionDeadline] = useState('');  // Add revision deadline state
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionComments, setRejectionComments] = useState('');

    // Assign reviewers states
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedReviewersForAssignment, setSelectedReviewersForAssignment] = useState<string[]>([]);
    const [assignmentDeadline, setAssignmentDeadline] = useState('');
    const [assignmentLoading, setAssignmentLoading] = useState(false);

    // Reviewer management states
    const [reviewerInquiryModal, setReviewerInquiryModal] = useState<{ reviewerId: string; reviewerName: string } | null>(null);
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [inquiryLoading, setInquiryLoading] = useState(false);

    // All Reviewers tab states
    const [allReviewersSearchTerm, setAllReviewersSearchTerm] = useState('');
    const [expandedReviewerId, setExpandedReviewerId] = useState<string | null>(null);

    // Review card expansion state
    const [expandedReviewCards, setExpandedReviewCards] = useState<Set<string>>(new Set());

    // Review editing state
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editReviewData, setEditReviewData] = useState<any>({
        recommendation: '',
        overallRating: 3,
        comments: '',
        commentsToEditor: ''
    });
    const [isLoadingReviewEdit, setIsLoadingReviewEdit] = useState(false);

    // CRUD states for reviewers
    const [editingReviewerId, setEditingReviewerId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState({ username: '', email: '' });
    const [isLoadingReviewerAction, setIsLoadingReviewerAction] = useState(false);
    // const [reviewerAssignedPapers, setReviewerAssignedPapers] = useState<{ [key: string]: Paper[] }>({}); // Not used currently

    // Paper history modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Review search state - REMOVED (Reviews tab removed)
    // const [reviewSearchTerm, setReviewSearchTerm] = useState('');

    useEffect(() => {
        verifyEditorAccess();
    }, []);

    // Fetch reviews and reviewers for the viewing paper
    useEffect(() => {
        if (viewingPaper) {
            // Fetch reviews and reviewers for this paper
            fetchPaperReviewsAndReviewers(viewingPaper._id);
        }
    }, [viewingPaper?._id]);

    const verifyEditorAccess = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                setError('Please login first');
                navigate('/login');
                return;
            }

            // Decode token to get user info
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                setError('Invalid token format');
                navigate('/login');
                return;
            }

            const decoded = JSON.parse(atob(tokenParts[1]));
            const userRole = decoded.role;
            const userEmail = decoded.email;

            console.log('User Role:', userRole, 'User Email:', userEmail);

            // Check if user is Editor or Admin
            if (userRole !== 'Editor' && userRole !== 'Admin') {
                setError('Access denied. Only editors can access this dashboard.');
                setTimeout(() => navigate('/'), 2000);
                return;
            }

            // Verify user exists in database with editor role
            const headers = { Authorization: `Bearer ${token}` };
            try {
                const verifyRes = await axios.get(`${API_URL}/api/editor/verify-access`, { headers });
                if (!verifyRes.data.success) {
                    setError('User verification failed. Access denied.');
                    setTimeout(() => navigate('/'), 2000);
                    return;
                }
            } catch (err: any) {
                console.warn('Could not verify editor access from backend:', err.message);
                // Continue anyway if backend verification fails
            }

            // Access verified, fetch dashboard data
            fetchDashboardData(headers);
        } catch (error: any) {
            console.error('Error verifying editor access:', error);
            setError('Authentication error. Please login again.');
            setTimeout(() => navigate('/login'), 2000);
        }
    };

    const fetchDashboardData = async (headers: any) => {
        try {
            console.log('Fetching editor dashboard data...');

            // Fetch all papers using new editor API
            try {
                const papersRes = await axios.get(
                    `${API_URL}/api/editor/papers`,
                    { headers }
                );
                console.log('Papers Response:', papersRes.data);

                const allPapers = papersRes.data.papers || [];
                console.log('Total Papers:', allPapers.length);

                setPapers(allPapers);

                // Calculate stats from papers
                setStats({
                    totalPapers: allPapers.length,
                    pendingReview: allPapers.filter((p: any) => p.status === 'Submitted' || p.status === 'Under Review' || p.status === 'Editor Assigned').length,
                    reviewsReceived: allPapers.filter((p: any) => p.status === 'Review Received').length,
                    decisionsMade: allPapers.filter((p: any) => p.status === 'Accepted' || p.status === 'Rejected').length
                });
            } catch (err: any) {
                console.error('Papers fetch error:', err.response?.data || err.message);
                if (err.response?.status === 403) {
                    setError('Access denied. Only editors can view papers.');
                } else if (err.code === 'ERR_NETWORK') {
                    setError('Cannot connect to server');
                } else {
                    setError('Failed to load papers. Server may be offline.');
                }
            }

            // Try to fetch reviewers (may not exist yet)
            try {
                const reviewersRes = await axios.get(`${API_URL}/api/editor/reviewers`, { headers });
                console.log('Reviewers Response:', reviewersRes.data);
                const reviewersList = reviewersRes.data.reviewers || [];
                console.log('Total Reviewers:', reviewersList.length);
                setReviewers(reviewersList);
            } catch (err: any) {
                console.error('Reviewers fetch error:', err.response?.data || err.message);
                // Create empty reviewers list if endpoint doesn't exist
                setReviewers([]);
            }

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReviewer = async () => {
        try {
            const token = localStorage.getItem('token');
            const reviewerHeaders = { Authorization: `Bearer ${token}` };
            await axios.post(
                `${API_URL}/api/editor/reviewers`,
                newReviewer,
                { headers: reviewerHeaders }
            );

            alert('Reviewer created successfully! Credentials sent to their email.');
            setShowCreateReviewer(false);
            setNewReviewer({ email: '', username: '', password: generateRandomPassword() });
            fetchDashboardData(reviewerHeaders);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create reviewer');
        }
    };


    // fetchAllReviews removed - Reviews tab removed

    const fetchPaperReviewsAndReviewers = async (paperId: string) => {
        try {
            setReviewerListLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch reviews for this paper
            const reviewsRes = await axios.get(
                `${API_URL}/api/editor/papers/${paperId}/reviews`,
                { headers }
            );

            // Fetch re-reviews (Round 2) for this paper if status is "Revision Required"
            let reReviewsData: any[] = [];
            try {
                const reReviewsRes = await axios.get(
                    `${API_URL}/api/editor/papers/${paperId}/re-reviews`,
                    { headers }
                );
                reReviewsData = reReviewsRes.data.reReviews || [];
            } catch (reReviewError) {
                console.log('No re-reviews found yet:', reReviewError);
            }
            setPaperReReviews(reReviewsData);

            // Fetch reviewers and their assignments for this paper
            const paper = papers.find(p => p._id === paperId);
            if (paper?.assignedReviewers) {
                const reviewersWithStatus = paper.assignedReviewers.map((reviewer: any) => {
                    const review = (reviewsRes.data.reviews || []).find(
                        (r: any) => r.reviewer?._id === reviewer._id || r.reviewer === reviewer._id
                    );
                    // Check if reviewer has submitted re-review
                    const reReview = reReviewsData.find(
                        (rr: any) => rr.reviewerId === reviewer._id || rr.reviewerId?._id === reviewer._id
                    );
                    return {
                        ...reviewer,
                        reviewStatus: review ? 'Submitted' : 'Pending',
                        review: review || null,
                        reReview: reReview || null
                    };
                });
                setPaperReviewers(reviewersWithStatus);
            }
        } catch (error: any) {
            console.error('Error fetching paper reviews and reviewers:', error);
            setPaperReviewers([]);
            setPaperReReviews([]);
        } finally {
            setReviewerListLoading(false);
        }
    };

    // Handle revision request
    const handleRevisionRequest = async () => {
        if (!viewingPaper || !revisionMessage.trim()) {
            alert('Please enter a revision message');
            return;
        }

        if (!revisionDeadline) {
            alert('Please select a revision deadline');
            return;
        }

        setDecisionLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/editor/request-revision`,
                {
                    paperId: viewingPaper._id,
                    revisionMessage,
                    revisionDeadline: revisionDeadline
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                alert('Revision request sent to author successfully!');
                setShowDecisionModal(null);
                setRevisionMessage('');
                setRevisionDeadline('');
                setViewingPaper(null);
                // Refresh papers list by re-fetching
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const papersRes = await axios.get(`${API_URL}/api/editor/papers`, { headers });
                setPapers(papersRes.data.papers || []);
            } else {
                alert('Error: ' + (response.data.message || 'Failed to request revision'));
            }
        } catch (error) {
            console.error('Error requesting revision:', error);
            alert('Error requesting revision');
        } finally {
            setDecisionLoading(false);
        }
    };

    // Handle paper acceptance
    const handleAcceptPaper = async () => {
        if (!viewingPaper) return;

        setDecisionLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/editor/accept-paper`,
                {
                    paperId: viewingPaper._id
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                alert('Paper accepted! Acceptance email sent to author.');
                setViewingPaper(null);
                // Refresh papers list
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const papersRes = await axios.get(`${API_URL}/api/editor/papers`, { headers });
                setPapers(papersRes.data.papers || []);
            } else {
                alert('Error: ' + (response.data.message || 'Failed to accept paper'));
            }
        } catch (error) {
            console.error('Error accepting paper:', error);
            alert('Error accepting paper');
        } finally {
            setDecisionLoading(false);
        }
    };

    // Handle paper rejection
    const handleRejectPaper = async () => {
        if (!viewingPaper) return;

        if (!rejectionReason) {
            alert('Please select a rejection reason');
            return;
        }

        if (!rejectionComments.trim()) {
            alert('Please provide rejection comments');
            return;
        }

        setDecisionLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/api/editor/reject-paper/${viewingPaper._id}`,
                {
                    rejectionReason,
                    rejectionComments
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                alert('Paper rejected successfully. Rejection email sent to author.');
                setShowDecisionModal(null);
                setRejectionReason('');
                setRejectionComments('');
                setViewingPaper(null);
                // Refresh papers list
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const papersRes = await axios.get(`${API_URL}/api/editor/papers`, { headers });
                setPapers(papersRes.data.papers || []);
            } else {
                alert('Error: ' + (response.data.message || 'Failed to reject paper'));
            }
        } catch (error) {
            console.error('Error rejecting paper:', error);
            alert('Error rejecting paper');
        } finally {
            setDecisionLoading(false);
        }
    };

    // Handle assign reviewers
    const handleAssignReviewers = async () => {
        if (!viewingPaper || selectedReviewersForAssignment.length < 1) {
            alert('Please select at least 1 reviewer');
            return;
        }

        if (!assignmentDeadline) {
            alert('Please set a deadline for reviews');
            return;
        }

        setAssignmentLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/editor/assign-reviewers`,
                {
                    paperId: viewingPaper._id,
                    submissionId: viewingPaper.submissionId,
                    reviewerIds: selectedReviewersForAssignment,
                    deadline: assignmentDeadline
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                alert(`${selectedReviewersForAssignment.length} reviewer(s) assigned successfully!`);
                setShowAssignModal(false);
                setSelectedReviewersForAssignment([]);
                setAssignmentDeadline('');
                setViewingPaper(null);
                // Refresh papers list
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const papersRes = await axios.get(`${API_URL}/api/editor/papers`, { headers });
                setPapers(papersRes.data.papers || []);
            } else {
                alert('Error: ' + (response.data.message || 'Failed to assign reviewers'));
            }
        } catch (error) {
            console.error('Error assigning reviewers:', error);
            alert('Error assigning reviewers');
        } finally {
            setAssignmentLoading(false);
        }
    };

    // Handle send inquiry to reviewer
    const handleSendInquiry = async () => {
        if (!reviewerInquiryModal || !inquiryMessage.trim() || !viewingPaper) {
            alert('Please provide a message');
            return;
        }

        setInquiryLoading(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/editor/send-reviewer-inquiry`,
                {
                    paperId: viewingPaper._id,
                    reviewerId: reviewerInquiryModal.reviewerId,
                    message: inquiryMessage
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                alert('Inquiry sent successfully to ' + reviewerInquiryModal.reviewerName);
                setReviewerInquiryModal(null);
                setInquiryMessage('');
            } else {
                alert('Error: ' + (response.data.message || 'Failed to send inquiry'));
            }
        } catch (error) {
            console.error('Error sending inquiry:', error);
            alert('Error sending inquiry');
        } finally {
            setInquiryLoading(false);
        }
    };

    // ========== NEW CRUD FUNCTIONS FOR ALL REVIEWERS PAGE ==========

    // Update reviewer details (Edit)
    const handleEditReviewer = async (reviewerId: string) => {
        if (!editFormData.username || !editFormData.email) {
            alert('Please fill in all fields');
            return;
        }

        setIsLoadingReviewerAction(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/editor/reviewers/${reviewerId}`,
                {
                    username: editFormData.username,
                    email: editFormData.email
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                alert('✅ Reviewer updated successfully!');
                setEditingReviewerId(null);
                setEditFormData({ username: '', email: '' });

                // Refresh reviewers list
                const reviewersRes = await axios.get(`${API_URL}/api/editor/reviewers`, { headers: { Authorization: `Bearer ${token}` } });
                setReviewers(reviewersRes.data.reviewers || []);
            } else {
                alert('❌ Error: ' + (response.data.message || 'Failed to update reviewer'));
            }
        } catch (error: any) {
            console.error('Error updating reviewer:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update reviewer';
            alert('❌ Error: ' + errorMsg);
        } finally {
            setIsLoadingReviewerAction(false);
        }
    };

    // Delete reviewer (Remove from system)
    const handleDeleteReviewerFromSystem = async (reviewerId: string, reviewerName: string) => {
        if (!window.confirm(`Are you sure you want to delete reviewer "${reviewerName}"? This action cannot be undone.`)) {
            return;
        }

        setIsLoadingReviewerAction(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(
                `${API_URL}/api/editor/reviewers/${reviewerId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                alert('✅ Reviewer deleted successfully!');

                // Refresh reviewers list
                const reviewersRes = await axios.get(`${API_URL}/api/editor/reviewers`, { headers: { Authorization: `Bearer ${token}` } });
                setReviewers(reviewersRes.data.reviewers || []);

                // Also refresh papers list to update counts
                const papersRes = await axios.get(`${API_URL}/api/editor/papers`, { headers: { Authorization: `Bearer ${token}` } });
                setPapers(papersRes.data.papers || []);
            } else {
                alert('❌ Error: ' + (response.data.message || 'Failed to delete reviewer'));
            }
        } catch (error: any) {
            console.error('Error deleting reviewer:', error);
            const errorMsg = error.response?.data?.message || 'Failed to delete reviewer';
            alert('❌ Error: ' + errorMsg);
        } finally {
            setIsLoadingReviewerAction(false);
        }
    };

    // Start editing a reviewer
    const startEditReviewer = (reviewer: any) => {
        setEditingReviewerId(reviewer._id);
        setEditFormData({
            username: reviewer.username || '',
            email: reviewer.email || ''
        });
    };

    // Cancel editing
    const cancelEditReviewer = () => {
        setEditingReviewerId(null);
        setEditFormData({ username: '', email: '' });
    };

    // Start editing a review
    const startEditReview = (review: any) => {
        setEditingReviewId(review._id);
        setEditReviewData({
            recommendation: review.recommendation || '',
            overallRating: review.overallRating || 3,
            comments: review.comments || '',
            commentsToEditor: review.commentsToEditor || ''
        });
    };

    // Cancel editing review
    const cancelEditReview = () => {
        setEditingReviewId(null);
        setEditReviewData({
            recommendation: '',
            overallRating: 3,
            comments: '',
            commentsToEditor: ''
        });
    };

    // Update review
    const updateReview = async (reviewId: string) => {
        if (!editReviewData.recommendation || !editReviewData.comments.trim() || !editReviewData.commentsToEditor.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        if (window.confirm('Are you sure you want to update this review?')) {
            setIsLoadingReviewEdit(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.put(
                    `${API_URL}/api/editor/reviews/${reviewId}`,
                    editReviewData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data.success) {
                    alert('✅ Review updated successfully!');
                    setEditingReviewId(null);
                    // Refresh the paper view
                    if (viewingPaper?._id) {
                        await fetchPaperReviewsAndReviewers(viewingPaper._id);
                    }
                } else {
                    alert('❌ Error: ' + (response.data.message || 'Failed to update review'));
                }
            } catch (error: any) {
                console.error('Error updating review:', error);
                alert('❌ Error: ' + (error.response?.data?.message || 'Failed to update review'));
            } finally {
                setIsLoadingReviewEdit(false);
            }
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <h3 className="text-3xl font-bold mt-2">{value}</h3>
                    {trend && (
                        <div className="flex items-center mt-2 text-sm text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-full ${color}`}>
                    <Icon className="w-8 h-8 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Editor Dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error message if access denied or connection error
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="space-y-2">
                        {error.includes('backend') || error.includes('offline') ? (
                            <>
                                <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
                                    Make sure you are connected to internet<br />
                                    {/* <code>npm start</code> in srm-back folder */}
                                </p>
                            </>
                        ) : null}
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mt-4"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 flex flex-col`}>
                {/* Logo */}
                <div className="p-6 flex items-center justify-between border-b border-blue-700">
                    {sidebarOpen && <h1 className="text-xl font-bold">Editor Panel</h1>}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-blue-700 rounded">
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <NavItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        active={activeTab === 'dashboard'}
                        onClick={() => setActiveTab('dashboard')}
                        collapsed={!sidebarOpen}
                    />
                    <NavItem
                        icon={FileText}
                        label="Papers"
                        active={activeTab === 'papers'}
                        onClick={() => setActiveTab('papers')}
                        collapsed={!sidebarOpen}
                    />

                    <NavItem
                        icon={Cloud}
                        label="PDF Management"
                        active={activeTab === 'pdfs'}
                        onClick={() => setActiveTab('pdfs')}
                        collapsed={!sidebarOpen}
                    />

                    <NavItem
                        icon={Users}
                        label="Create Reviewer"
                        active={activeTab === 'createReviewer'}
                        onClick={() => setActiveTab('createReviewer')}
                        collapsed={!sidebarOpen}
                    />

                    <NavItem
                        icon={Users}
                        label="All Reviewers"
                        active={activeTab === 'allReviewers'}
                        onClick={() => setActiveTab('allReviewers')}
                        collapsed={!sidebarOpen}
                    />
                    <NavItem
                        icon={CheckCircle}
                        label="Selected Users"
                        active={activeTab === 'selectedUsers'}
                        onClick={() => setActiveTab('selectedUsers')}
                        collapsed={!sidebarOpen}
                    />
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-blue-700">
                    <button
                        onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-700 rounded-lg transition"
                    >
                        <AlertCircle className="w-5 h-5" />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Header */}
                <div className="bg-white shadow-sm p-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {activeTab === 'dashboard' && 'Dashboard Overview'}
                        {activeTab === 'papers' && 'Manage Papers'}
                        {activeTab === 'pdfs' && 'PDF Management'}
                        {activeTab === 'createReviewer' && 'Create New Reviewer'}
                        {activeTab === 'allReviewers' && 'All Reviewers'}
                        {activeTab === 'selectedUsers' && 'Conference Selected Users'}
                    </h2>
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    title="Total Papers"
                                    value={stats.totalPapers}
                                    icon={FileText}
                                    color="bg-blue-500"
                                    trend="+12% from last month"
                                />
                                <StatCard
                                    title="Pending Review"
                                    value={stats.pendingReview}
                                    icon={Clock}
                                    color="bg-yellow-500"
                                />
                                <StatCard
                                    title="Reviews Received"
                                    value={stats.reviewsReceived}
                                    icon={CheckCircle}
                                    color="bg-green-500"
                                    trend="+8% from last week"
                                />
                                <StatCard
                                    title="Decisions Made"
                                    value={stats.decisionsMade}
                                    icon={TrendingUp}
                                    color="bg-purple-500"
                                />
                            </div>

                            {/* Recent Papers */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold mb-4">Recent Papers</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {papers.slice(0, 5).map((paper) => (
                                                <tr key={paper._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewingPaper(paper)}>
                                                    <td className="px-4 py-3 text-sm">{paper.submissionId}</td>
                                                    <td className="px-4 py-3 text-sm font-medium">{paper.paperTitle}</td>
                                                    <td className="px-4 py-3 text-sm">{paper.authorName}</td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={paper.status} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setViewingPaper(paper);
                                                            }}
                                                            className="text-orange-600 hover:text-orange-800 mr-3"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'selectedUsers' && (
                        <AdminSelectedUsers />
                    )}

                    {activeTab === 'papers' && !viewingPaper && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold">All Papers</h3>
                                </div>

                                {/* Enhanced Search Bar with Multiple Options */}
                                <div className="mb-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                                <Search className="w-4 h-4 inline mr-1" />
                                                Search by any field
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Title, author, ID, category, email..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                                <Filter className="w-4 h-4 inline mr-1" />
                                                Filter by status
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Submitted">Submitted</option>
                                                <option value="Under Review">Under Review</option>
                                                <option value="Review Received">Review Received</option>
                                                <option value="Accepted">Accepted</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {searchTerm ? `Found ${papers.filter(p =>
                                            p.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.submissionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.email.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).length} paper(s)` : `Showing all ${papers.length} paper(s)`}
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {papers.filter(p => {
                                        const matchesSearch = !searchTerm ||
                                            p.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.submissionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.email.toLowerCase().includes(searchTerm.toLowerCase());

                                        const matchesStatus = !statusFilter || p.status === statusFilter;

                                        return matchesSearch && matchesStatus;
                                    }).map((paper) => (
                                        <div key={paper._id}>
                                            <div className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white hover:bg-gray-50"
                                                onClick={() => setViewingPaper(paper)}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-lg text-blue-600 hover:underline">{paper.paperTitle}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span className="font-medium">ID:</span> {paper.submissionId} |
                                                            <span className="font-medium ml-2">Author:</span> {paper.authorName} |
                                                            <span className="font-medium ml-2">Category:</span> {paper.category}
                                                        </p>

                                                        {/* Reviewer Status Information */}
                                                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                                                            {paper.assignedReviewers && paper.assignedReviewers.length > 0 ? (
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                                                        Reviewers: {paper.assignedReviewers.length} assigned
                                                                    </p>
                                                                    <div className="space-y-1">
                                                                        {paper.assignedReviewers.map((reviewer: any, idx: number) => {
                                                                            // Find the assignment to get status
                                                                            const assignment = paper.reviewAssignments?.find(
                                                                                (a: any) => a.reviewer === reviewer._id || a.reviewer?.toString() === reviewer._id?.toString()
                                                                            );
                                                                            const status = assignment?.status || 'Pending';

                                                                            let statusColor = 'bg-yellow-100 text-yellow-800';
                                                                            if (status === 'Submitted') {
                                                                                statusColor = 'bg-green-100 text-green-800';
                                                                            } else if (status === 'Overdue') {
                                                                                statusColor = 'bg-red-100 text-red-800';
                                                                            }

                                                                            return (
                                                                                <div key={idx} className="text-xs flex items-center justify-between">
                                                                                    <span className="text-gray-600">{reviewer.username || reviewer.email}</span>
                                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                                                                        {status}
                                                                                    </span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-gray-600 italic">
                                                                    ⚠️ No reviewers assigned (Total available: {reviewers.length})
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={paper.status} />
                                                </div>

                                                <div className="flex gap-3 mt-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setViewingPaper(paper);
                                                        }}
                                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 flex-1"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPaperForAuthorMessage(selectedPaperForAuthorMessage === paper._id ? null : paper._id);
                                                        }}

                                                        className={`px-4 py-2 rounded flex items-center gap-2 transition ${selectedPaperForAuthorMessage === paper._id
                                                            ? 'bg-blue-700 text-white'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                            }`}
                                                        title="Send message to author"
                                                    >

                                                        <MessageSquare className="w-4 h-4" />
                                                        {selectedPaperForAuthorMessage === paper._id ? 'Close' : 'Message Author'}
                                                    </button>
                                                </div>

                                                {/* Inline Author Message Form */}
                                                {selectedPaperForAuthorMessage === paper._id && (
                                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <h5 className="font-semibold text-blue-900 mb-3">Send Message to {paper.authorName}</h5>
                                                        <div className="space-y-3">
                                                            <textarea
                                                                value={authorMessageText}
                                                                onChange={(e) => setAuthorMessageText(e.target.value)}
                                                                placeholder="Type your message here... (Professional tone recommended)"
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                                rows={5}
                                                            />
                                                            <div className="flex justify-between items-center text-sm text-gray-600">
                                                                <span>{authorMessageText.length} characters</span>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setAuthorMessageText('');
                                                                            setSelectedPaperForAuthorMessage(null);
                                                                        }}
                                                                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                                                                        disabled={authorMessageLoading}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (!authorMessageText.trim()) {
                                                                                alert('Please enter a message');
                                                                                return;
                                                                            }

                                                                            setAuthorMessageLoading(true);
                                                                            try {
                                                                                const response = await axios.post(
                                                                                    `${API_BASE_URL}/api/editor/send-message-to-author`,
                                                                                    {
                                                                                        authorEmail: paper.email,
                                                                                        authorName: paper.authorName,
                                                                                        submissionId: paper.submissionId,
                                                                                        message: authorMessageText
                                                                                    },
                                                                                    {
                                                                                        headers: {
                                                                                            Authorization: `Bearer ${localStorage.getItem('token')}`
                                                                                        }
                                                                                    }
                                                                                );

                                                                                if (response.data.success) {
                                                                                    alert('Message sent to author successfully!');
                                                                                    setAuthorMessageText('');
                                                                                    setSelectedPaperForAuthorMessage(null);
                                                                                } else {
                                                                                    alert('Failed to send message: ' + (response.data.message || 'Unknown error'));
                                                                                }
                                                                            } catch (error) {
                                                                                console.error('Error sending message:', error);
                                                                                alert('Error sending message. Please try again.');
                                                                            } finally {
                                                                                setAuthorMessageLoading(false);
                                                                            }
                                                                        }}
                                                                        disabled={authorMessageLoading || !authorMessageText.trim()}
                                                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 transition flex items-center gap-2"
                                                                    >
                                                                        <Send className="w-4 h-4" />
                                                                        {authorMessageLoading ? 'Sending...' : 'Send Message'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    ))}
                                </div>

                                {papers.filter(p =>
                                    !searchTerm ||
                                    p.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    p.submissionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    p.category.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            {searchTerm ? `No papers found matching "${searchTerm}"` : 'No papers available'}
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}

                    {/* Paper Details View - Side by side layout */}
                    {activeTab === 'papers' && viewingPaper && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setViewingPaper(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 flex items-center gap-2"
                            >
                                ← Back to Papers List
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column - Paper Details & Reviewers */}
                                <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
                                    {/* Paper Header Tabs */}
                                    <div className="flex gap-2 border-b mb-4 pb-2">
                                        <button
                                            onClick={() => setPaperDetailsTab('details')}
                                            className={`px-4 py-2 font-medium text-sm transition ${paperDetailsTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                        >
                                            Paper Details
                                        </button>
                                        <button
                                            onClick={() => setPaperDetailsTab('reviewers')}
                                            className={`px-4 py-2 font-medium text-sm transition ${paperDetailsTab === 'reviewers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                        >
                                            Reviewers ({paperReviewers.length})
                                        </button>
                                    </div>

                                    {/* Paper Details Tab */}
                                    {paperDetailsTab === 'details' && (
                                        <div>
                                            {/* Action Buttons - MOVED TO TOP */}
                                            <div className="flex gap-2 mb-6 flex-wrap">
                                                {/* View PDF Button */}
                                                <button
                                                    onClick={() => {
                                                        // Open PDF in new tab/modal
                                                        if (viewingPaper.pdfUrl) {
                                                            window.open(viewingPaper.pdfUrl, '_blank');
                                                        } else {
                                                            alert('PDF not available');
                                                        }
                                                    }}
                                                    className="flex-1 px-3 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                >
                                                    📄 View PDF
                                                </button>

                                                {/* Message Author Button */}
                                                <button
                                                    onClick={() => setShowDetailInlineMessage(!showDetailInlineMessage)}
                                                    className={`flex-1 px-3 py-3 rounded text-sm flex items-center justify-center gap-2 font-medium transition ${showDetailInlineMessage ? 'bg-cyan-800 text-white' : 'bg-cyan-600 text-white hover:bg-cyan-700'
                                                        }`}
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    {showDetailInlineMessage ? 'Close Message' : 'Message Author'}
                                                </button>



                                                {/* Operation History Button */}
                                                <button
                                                    onClick={() => setShowHistoryModal(true)}
                                                    className="flex-1 px-3 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                >
                                                    <History className="w-4 h-4" />
                                                    View Operation History
                                                </button>

                                                {/* Assign Reviewers Button - Show anytime (no limit) except when Accepted or Rejected */}
                                                {viewingPaper.status !== 'Accepted' && viewingPaper.status !== 'Rejected' && (
                                                    <button
                                                        onClick={() => setShowAssignModal(true)}
                                                        className="flex-1 px-3 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                    >
                                                        👥 Assign Reviewers
                                                    </button>
                                                )}

                                                {/* Re-Review Emails Button - Show when paper is "Revised Submitted" */}
                                                {viewingPaper.status === 'Revised Submitted' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!window.confirm('Send re-review request emails to all reviewers for the revised paper?')) return;

                                                            try {
                                                                setDecisionLoading(true);
                                                                const token = localStorage.getItem('token');
                                                                const response = await axios.post(
                                                                    `${API_URL}/api/editor/send-re-review-emails`,
                                                                    { paperId: viewingPaper._id },
                                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                                );

                                                                if (response.data.success) {
                                                                    alert(`✅ Re-review emails sent to ${response.data.emailsSent} reviewer(s)!`);
                                                                } else {
                                                                    alert('Error: ' + (response.data.message || 'Failed to send re-review emails'));
                                                                }
                                                            } catch (error) {
                                                                console.error('Error sending re-review emails:', error);
                                                                alert('Error: ' + ((error as any).response?.data?.message || 'Failed to send re-review emails'));
                                                            } finally {
                                                                setDecisionLoading(false);
                                                            }
                                                        }}
                                                        disabled={decisionLoading}
                                                        className="flex-1 px-3 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                    >
                                                        {decisionLoading ? 'Sending...' : '📧 Send Re-Review Emails'}
                                                    </button>
                                                )}

                                                {/* Decision Buttons - Only show if paper is NOT yet decided */}
                                                {viewingPaper.status !== 'Accepted' && viewingPaper.status !== 'Rejected' && (
                                                    <>
                                                        {/* For "Revision Required" status - show Re-Review and Assign Reviewers buttons */}
                                                        {viewingPaper.status === 'Revision Required' ? (
                                                            <>
                                                                {/* Send Re-Review Emails Button */}
                                                                <button
                                                                    onClick={async () => {
                                                                        setDecisionLoading(true);
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            await axios.post(
                                                                                `${API_URL}/api/editor/send-re-review-emails`,
                                                                                { paperId: viewingPaper._id },
                                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                                            );
                                                                            alert('✅ Re-review emails sent successfully');
                                                                            if (viewingPaper?._id) {
                                                                                await fetchPaperReviewsAndReviewers(viewingPaper._id);
                                                                            }
                                                                        } catch (error: any) {
                                                                            console.error('Error sending re-review emails:', error);
                                                                            alert('❌ ' + (error.response?.data?.message || 'Failed to send re-review emails'));
                                                                        } finally {
                                                                            setDecisionLoading(false);
                                                                        }
                                                                    }}
                                                                    disabled={decisionLoading}
                                                                    className="flex-1 px-3 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                                >
                                                                    {decisionLoading ? 'Sending...' : '📧 Send Re-Review Emails'}
                                                                </button>

                                                                {/* Assign More Reviewers Button */}
                                                                <button
                                                                    onClick={() => {
                                                                        setShowAssignModal(true);
                                                                        setSelectedReviewersForAssignment([]);
                                                                    }}
                                                                    disabled={!viewingPaper}
                                                                    className="flex-1 px-3 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                                >
                                                                    👥 Assign Reviewers
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* Decision buttons for initial review and revised submission */}
                                                                {/* Check if all reviewers have submitted reviews (for initial review) OR paper is "Revised Submitted" (has revised PDF and re-reviews) */}
                                                                {(() => {
                                                                    const isRevisedSubmitted = viewingPaper.status === 'Revised Submitted';
                                                                    const allReviewsSubmitted = paperReviewers.length >= 3 && paperReviewers.every((r: any) => r.review);
                                                                    const acceptButtonMessage = !allReviewsSubmitted && !isRevisedSubmitted
                                                                        ? `${paperReviewers.filter((r: any) => r.review).length}/3 reviews submitted`
                                                                        : isRevisedSubmitted
                                                                            ? 'Accept revised version'
                                                                            : 'All reviews received';

                                                                    return (
                                                                        <>
                                                                            {/* Accept Button - Show if ≥3 reviews submitted OR paper is "Revised Submitted" */}
                                                                            <div className="relative group">
                                                                                <button
                                                                                    onClick={handleAcceptPaper}
                                                                                    disabled={(!allReviewsSubmitted && !isRevisedSubmitted) || decisionLoading}
                                                                                    className="flex-1 px-3 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                                                >
                                                                                    {decisionLoading ? 'Processing...' : '✓ Accept'}
                                                                                </button>
                                                                                {!allReviewsSubmitted && !isRevisedSubmitted && (
                                                                                    <div className="invisible group-hover:visible absolute z-10 bg-gray-800 text-white text-xs rounded py-2 px-3 bottom-full mb-2 whitespace-nowrap">
                                                                                        {acceptButtonMessage}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Reject Button */}
                                                                            <button
                                                                                onClick={() => setShowDecisionModal('reject')}
                                                                                className="flex-1 px-3 py-3 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                                            >
                                                                                ✗ Reject
                                                                            </button>

                                                                            {/* Revision Button */}
                                                                            <button
                                                                                onClick={() => setShowDecisionModal('revision')}
                                                                                className="flex-1 px-3 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm flex items-center justify-center gap-2 font-medium transition"
                                                                            >
                                                                                ↻ Revision
                                                                            </button>

                                                                            {/* Status Indicator */}
                                                                            {!allReviewsSubmitted && (
                                                                                <div className="col-span-3 flex items-center justify-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs font-medium">
                                                                                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                                                                    Waiting for reviews: {paperReviewers.filter((r: any) => r.review).length}/{paperReviewers.length}
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {/* Status Badge - Show when decision is made */}
                                                {(viewingPaper.status === 'Accepted' || viewingPaper.status === 'Rejected') && (
                                                    <div className="flex-1 px-3 py-3 bg-gray-100 text-gray-800 rounded text-sm flex items-center justify-center gap-2 font-medium border-2 border-gray-300">
                                                        {viewingPaper.status === 'Accepted' ? (
                                                            <>
                                                                <Check className="w-5 h-5 text-green-600" />
                                                                <span className="text-green-700 font-bold">Paper Accepted</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <X className="w-5 h-5 text-red-600" />
                                                                <span className="text-red-700 font-bold">Paper Rejected</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Inline Author Message Form in Detail View */}
                                            {showDetailInlineMessage && viewingPaper && (
                                                <div className="mb-6 p-6 bg-cyan-50 border border-cyan-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h4 className="text-lg font-bold text-cyan-900 flex items-center gap-2">
                                                            <Send className="w-5 h-5" />
                                                            Send Message to {viewingPaper.authorName}
                                                        </h4>
                                                        <button
                                                            onClick={() => setShowDetailInlineMessage(false)}
                                                            className="text-cyan-600 hover:text-cyan-800 transition"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white/50 p-3 rounded-lg border border-cyan-100">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-cyan-800">Email:</span>
                                                                <span className="text-gray-700">{viewingPaper.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-right">
                                                                <span className="font-semibold text-cyan-800 ml-auto">Paper ID:</span>
                                                                <span className="text-gray-700 font-mono">{viewingPaper.submissionId}</span>
                                                            </div>
                                                        </div>

                                                        <div className="relative">
                                                            <textarea
                                                                value={authorMessageText}
                                                                onChange={(e) => setAuthorMessageText(e.target.value)}
                                                                placeholder="Write your message here..."
                                                                className="w-full px-4 py-4 border-2 border-cyan-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all text-gray-800 bg-white placeholder:text-gray-400 shadow-inner"
                                                                rows={6}
                                                            />
                                                            <div className="absolute bottom-3 right-4 text-xs font-medium text-gray-400">
                                                                {authorMessageText.length} characters
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-3 pt-2">
                                                            <button
                                                                onClick={() => {
                                                                    setAuthorMessageText('');
                                                                    setShowDetailInlineMessage(false);
                                                                }}
                                                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold flex items-center gap-2"
                                                                disabled={authorMessageLoading}
                                                            >
                                                                Clear & Cancel
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    if (!authorMessageText.trim()) {
                                                                        alert('Please enter a message');
                                                                        return;
                                                                    }

                                                                    setAuthorMessageLoading(true);
                                                                    try {
                                                                        const response = await axios.post(
                                                                            `${API_BASE_URL}/api/editor/send-message-to-author`,
                                                                            {
                                                                                authorEmail: viewingPaper.email,
                                                                                authorName: viewingPaper.authorName,
                                                                                submissionId: viewingPaper.submissionId,
                                                                                message: authorMessageText
                                                                            },
                                                                            {
                                                                                headers: {
                                                                                    Authorization: `Bearer ${localStorage.getItem('token')}`
                                                                                }
                                                                            }
                                                                        );

                                                                        if (response.data.success) {
                                                                            alert('✅ Message sent to author successfully!');
                                                                            setAuthorMessageText('');
                                                                            setShowDetailInlineMessage(false);
                                                                        } else {
                                                                            alert('❌ Failed to send message: ' + (response.data.message || 'Unknown error'));
                                                                        }
                                                                    } catch (error) {
                                                                        console.error('Error sending message:', error);
                                                                        alert('❌ Error sending message. Please try again.');
                                                                    } finally {
                                                                        setAuthorMessageLoading(false);
                                                                    }
                                                                }}
                                                                disabled={authorMessageLoading || !authorMessageText.trim()}
                                                                className="flex-1 px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-cyan-300 shadow-md shadow-cyan-200 transition-all font-bold flex items-center justify-center gap-2"
                                                            >
                                                                {authorMessageLoading ? (
                                                                    <>
                                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                        Sending...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Send className="w-4 h-4" />
                                                                        Send Message to Author
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}


                                            <div className="border-b pb-6 mb-6">
                                                <h3 className="text-2xl font-bold text-gray-800">{viewingPaper.paperTitle}</h3>
                                                <div className="mt-3 flex items-center gap-2">
                                                    <StatusBadge status={viewingPaper.status} />
                                                    <span className="text-xs text-gray-500">Last updated: {new Date(viewingPaper.createdAt || '').toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {/* Author Information - 3 columns */}
                                            <div className="mb-6">
                                                <p className="text-sm font-semibold text-gray-700 mb-3">Author Information</p>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">Author Name</label>
                                                        <p className="text-gray-800 bg-gray-50 p-3 rounded text-sm font-medium border border-gray-200">{viewingPaper.authorName}</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">Email</label>
                                                        <p className="text-gray-800 bg-gray-50 p-3 rounded text-sm break-all border border-gray-200">{viewingPaper.email}</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">Submission ID</label>
                                                        <p className="text-gray-800 bg-gray-50 p-3 rounded text-sm font-mono font-medium border border-gray-200">{viewingPaper.submissionId}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Paper Information - 3 columns */}
                                            <div className="mb-6">
                                                <p className="text-sm font-semibold text-gray-700 mb-3">Paper Information</p>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">Category</label>
                                                        <p className="text-gray-800 bg-gray-50 p-3 rounded text-sm border border-gray-200">{viewingPaper.category}</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
                                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                            <StatusBadge status={viewingPaper.status} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">Assigned Reviewers</label>
                                                        <p className="text-gray-800 bg-blue-50 p-3 rounded text-sm font-bold text-blue-600 border border-blue-200">{viewingPaper.assignedReviewers?.length || 0} Reviewers</p>
                                                    </div>
                                                </div>
                                            </div>


                                            <div className="mb-6 border-t pt-6">
                                                <p className="text-sm font-semibold text-gray-700 mb-3">Database Information</p>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                                        <p className="text-xs text-gray-600 mb-2 font-medium">Database ID</p>
                                                        <p className="text-sm font-mono text-gray-800 break-all line-clamp-2">{viewingPaper._id}</p>
                                                    </div>
                                                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                                                        <p className="text-xs text-gray-600 mb-2 font-medium">Paper Title</p>
                                                        <p className="text-sm font-medium text-gray-800 line-clamp-2">{viewingPaper.paperTitle}</p>
                                                    </div>
                                                    <div className="bg-green-50 p-4 rounded border border-green-200">
                                                        <p className="text-xs text-gray-600 mb-2 font-medium">Submission Date</p>
                                                        <p className="text-sm text-gray-800">{new Date(viewingPaper.createdAt || '').toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                    {paperDetailsTab === 'reviewers' && (
                                        <div>
                                            {reviewerListLoading ? (
                                                <div className="flex justify-center items-center py-8">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                </div>
                                            ) : paperReviewers.length > 0 ? (
                                                <div>
                                                    {/* Reviewers Header */}
                                                    <div className="border-b pb-4 mb-6">
                                                        <h3 className="text-xl font-bold text-gray-900">Assigned Reviewers ({paperReviewers.length})</h3>
                                                    </div>

                                                    {/* Reviewer Details Panel - Show inline if selected */}
                                                    {selectedReviewForDetails && viewingPaper?.submissionId === selectedReviewForDetails.submissionId && (
                                                        <div className="mb-6 bg-white rounded-lg shadow-md p-6 border-2 border-blue-300">
                                                            <ReviewerDetailsPanel
                                                                reviewId={selectedReviewForDetails.reviewId}
                                                                submissionId={selectedReviewForDetails.submissionId}
                                                                onClose={() => setSelectedReviewForDetails(null)}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Reviewer Chat Panel - Show inline if active */}
                                                    {activeChat && viewingPaper?.submissionId === activeChat.submissionId && (
                                                        <div className="mb-6">
                                                            <ReviewerChat
                                                                submissionId={activeChat.submissionId}
                                                                reviewerId={activeChat.reviewerId}
                                                                reviewerName={activeChat.reviewerName}
                                                                role="editor"
                                                                reviewId={activeChat.reviewId}
                                                                onClose={() => setActiveChat(null)}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Reviewers Grid - 3 columns max */}
                                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                                        {paperReviewers.map((reviewer, idx) => {
                                                            // Determine reviewer status with enhanced details
                                                            let statusBg = 'bg-yellow-200 text-yellow-800';
                                                            let statusText = 'Not Submitted';
                                                            let borderColor = 'border-yellow-200 bg-yellow-50';

                                                            if (reviewer.reviewStatus === 'Submitted') {
                                                                statusBg = 'bg-green-200 text-green-800';
                                                                statusText = 'Submitted';
                                                                borderColor = 'border-green-200 bg-green-50';
                                                            } else if (reviewer.reviewStatus === 'Overtime') {
                                                                statusBg = 'bg-red-200 text-red-800';
                                                                statusText = 'Overtime';
                                                                borderColor = 'border-red-200 bg-red-50';
                                                            }

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`border rounded-lg p-4 flex flex-col h-full ${borderColor}`}
                                                                >
                                                                    {/* Reviewer Name & Email */}
                                                                    <div className="mb-3 pb-3 border-b">
                                                                        <h4 className="font-bold text-gray-900 text-sm truncate">{reviewer.username || reviewer.email}</h4>
                                                                        <p className="text-xs text-gray-600 truncate">{reviewer.email}</p>
                                                                    </div>

                                                                    {/* Status Badge with Enhanced Details */}
                                                                    <div className="mb-3 flex items-center justify-between">
                                                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${statusBg}`}>
                                                                            {statusText}
                                                                        </span>
                                                                    </div>

                                                                    {/* Review Details or Awaiting Message */}
                                                                    {reviewer.review ? (
                                                                        <div className="flex-1 space-y-3 mb-3">
                                                                            {/* Initial Review (Round 1) */}
                                                                            <div className="bg-white rounded border-l-4 border-green-500 p-3 space-y-2">
                                                                                {/* Review Round Indicator with Edit Button */}
                                                                                <div className="mb-2 pb-2 border-b flex justify-between items-center">
                                                                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                                                                                        Review 1 (Initial)
                                                                                    </span>
                                                                                    <div className="flex gap-2 items-center">
                                                                                        {editingReviewId !== reviewer.review._id && (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    startEditReview(reviewer.review);
                                                                                                }}
                                                                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                                                                                title="Edit this review"
                                                                                            >
                                                                                                ✎ Edit
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                const cardId = `${reviewer._id}-round1`;
                                                                                                setExpandedReviewCards(prev => {
                                                                                                    const newSet = new Set(prev);
                                                                                                    if (newSet.has(cardId)) {
                                                                                                        newSet.delete(cardId);
                                                                                                    } else {
                                                                                                        newSet.add(cardId);
                                                                                                    }
                                                                                                    return newSet;
                                                                                                });
                                                                                            }}
                                                                                            className="text-xs text-gray-500 hover:text-gray-700"
                                                                                        >
                                                                                            {expandedReviewCards.has(`${reviewer._id}-round1`) ? '▼ Collapse' : '▶ Expand'}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>

                                                                                {editingReviewId === reviewer.review._id ? (
                                                                                    /* Edit Form */
                                                                                    <div className="space-y-3 bg-blue-50 p-3 rounded" onClick={(e) => e.stopPropagation()}>
                                                                                        <div>
                                                                                            <label className="text-xs font-semibold text-gray-700">Recommendation *</label>
                                                                                            <select
                                                                                                value={editReviewData.recommendation}
                                                                                                onChange={(e) => setEditReviewData({ ...editReviewData, recommendation: e.target.value })}
                                                                                                className="w-full mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            >
                                                                                                <option value="Accept">Accept</option>
                                                                                                <option value="Conditional Accept">Conditional Accept</option>
                                                                                                <option value="Minor Revision">Minor Revision</option>
                                                                                                <option value="Major Revision">Major Revision</option>
                                                                                                <option value="Reject">Reject</option>
                                                                                            </select>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-xs font-semibold text-gray-700">Overall Rating * (1-5)</label>
                                                                                            <input
                                                                                                type="number"
                                                                                                min="1"
                                                                                                max="5"
                                                                                                value={editReviewData.overallRating}
                                                                                                onChange={(e) => setEditReviewData({ ...editReviewData, overallRating: parseInt(e.target.value) })}
                                                                                                className="w-full mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-xs font-semibold text-gray-700">Internal Comments *</label>
                                                                                            <textarea
                                                                                                value={editReviewData.comments}
                                                                                                onChange={(e) => setEditReviewData({ ...editReviewData, comments: e.target.value })}
                                                                                                className="w-full mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                rows={3}
                                                                                                placeholder="Internal comments..."
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-xs font-semibold text-gray-700">Comments to Editor *</label>
                                                                                            <textarea
                                                                                                value={editReviewData.commentsToEditor}
                                                                                                onChange={(e) => setEditReviewData({ ...editReviewData, commentsToEditor: e.target.value })}
                                                                                                className="w-full mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                                rows={3}
                                                                                                placeholder="Comments to editor..."
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex gap-2 pt-2">
                                                                                            <button
                                                                                                onClick={() => updateReview(reviewer.review._id)}
                                                                                                disabled={isLoadingReviewEdit}
                                                                                                className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                                                                                            >
                                                                                                {isLoadingReviewEdit ? 'Updating...' : '✓ Update'}
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={cancelEditReview}
                                                                                                disabled={isLoadingReviewEdit}
                                                                                                className="flex-1 px-3 py-2 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 disabled:bg-gray-300 transition font-medium"
                                                                                            >
                                                                                                ✕ Cancel
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    /* View Mode */
                                                                                    <>
                                                                                        <div>
                                                                                            <label className="text-xs font-semibold text-gray-700">Recommendation</label>
                                                                                            <p className={`font-bold text-sm mt-0.5 ${reviewer.review.recommendation === 'Accept' ? 'text-green-600' :
                                                                                                reviewer.review.recommendation === 'Reject' ? 'text-red-600' : 'text-yellow-600'
                                                                                                }`}>
                                                                                                {reviewer.review.recommendation || 'N/A'}
                                                                                            </p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-xs font-semibold text-gray-700">Overall Rating</label>
                                                                                            <p className="font-bold text-sm text-blue-600 mt-0.5">
                                                                                                {reviewer.review.ratings?.overall || reviewer.review.overallRating || 'N/A'}
                                                                                                {reviewer.review.overallRating && !reviewer.review.ratings?.overall ? '/5' : ''}
                                                                                            </p>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-xs font-semibold text-gray-700">Comments</label>
                                                                                            <p className={`text-xs text-gray-600 mt-0.5 bg-gray-50 p-2 rounded ${expandedReviewCards.has(`${reviewer._id}-round1`)
                                                                                                ? 'max-h-none whitespace-pre-wrap'
                                                                                                : 'max-h-12 overflow-hidden line-clamp-2'
                                                                                                }`}>
                                                                                                {reviewer.review.commentsToEditor || reviewer.review.comments || 'No comments'}
                                                                                            </p>
                                                                                        </div>
                                                                                        <div className="text-xs text-gray-500 pt-1">
                                                                                            {new Date(reviewer.review.submittedAt).toLocaleDateString()}
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>

                                                                            {/* Re-Review (Round 2) if exists */}
                                                                            {reviewer.reReview && (
                                                                                <div className="bg-purple-50 rounded border-l-4 border-purple-500 p-3 space-y-2">
                                                                                    <div className="mb-2 pb-2 border-b flex justify-between items-center">
                                                                                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800">
                                                                                            Review 2 (Re-review)
                                                                                        </span>
                                                                                        <div className="flex gap-2 items-center">
                                                                                            {editingReviewId !== reviewer.reReview._id && (
                                                                                                <button
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        startEditReview(reviewer.reReview);
                                                                                                    }}
                                                                                                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                                                                                                    title="Edit this review"
                                                                                                >
                                                                                                    ✎ Edit
                                                                                                </button>
                                                                                            )}
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    const cardId = `${reviewer._id}-round2`;
                                                                                                    setExpandedReviewCards(prev => {
                                                                                                        const newSet = new Set(prev);
                                                                                                        if (newSet.has(cardId)) {
                                                                                                            newSet.delete(cardId);
                                                                                                        } else {
                                                                                                            newSet.add(cardId);
                                                                                                        }
                                                                                                        return newSet;
                                                                                                    });
                                                                                                }}
                                                                                                className="text-xs text-gray-500 hover:text-gray-700"
                                                                                            >
                                                                                                {expandedReviewCards.has(`${reviewer._id}-round2`) ? '▼ Collapse' : '▶ Expand'}
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>

                                                                                    {editingReviewId === reviewer.reReview._id ? (
                                                                                        /* Edit Form */
                                                                                        <div className="space-y-3 bg-purple-100 p-3 rounded" onClick={(e) => e.stopPropagation()}>
                                                                                            <div>
                                                                                                <label className="text-xs font-semibold text-gray-700">Recommendation *</label>
                                                                                                <select
                                                                                                    value={editReviewData.recommendation}
                                                                                                    onChange={(e) => setEditReviewData({ ...editReviewData, recommendation: e.target.value })}
                                                                                                    className="w-full mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                                                >
                                                                                                    <option value="Accept">Accept</option>
                                                                                                    <option value="Conditional Accept">Conditional Accept</option>
                                                                                                    <option value="Minor Revision">Minor Revision</option>
                                                                                                    <option value="Major Revision">Major Revision</option>
                                                                                                    <option value="Reject">Reject</option>
                                                                                                </select>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-xs font-semibold text-gray-700">Overall Rating * (1-5)</label>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    min="1"
                                                                                                    max="5"
                                                                                                    value={editReviewData.overallRating}
                                                                                                    onChange={(e) => setEditReviewData({ ...editReviewData, overallRating: parseInt(e.target.value) })}
                                                                                                    className="w-full mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-xs font-semibold text-gray-700">Internal Comments *</label>
                                                                                                <textarea
                                                                                                    value={editReviewData.comments}
                                                                                                    onChange={(e) => setEditReviewData({ ...editReviewData, comments: e.target.value })}
                                                                                                    className="w-full mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                                                    rows={3}
                                                                                                    placeholder="Internal comments..."
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-xs font-semibold text-gray-700">Comments to Editor *</label>
                                                                                                <textarea
                                                                                                    value={editReviewData.commentsToEditor}
                                                                                                    onChange={(e) => setEditReviewData({ ...editReviewData, commentsToEditor: e.target.value })}
                                                                                                    className="w-full mt-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                                                    rows={3}
                                                                                                    placeholder="Comments to editor..."
                                                                                                />
                                                                                            </div>
                                                                                            <div className="flex gap-2 pt-2">
                                                                                                <button
                                                                                                    onClick={() => updateReview(reviewer.reReview._id)}
                                                                                                    disabled={isLoadingReviewEdit}
                                                                                                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                                                                                                >
                                                                                                    {isLoadingReviewEdit ? 'Updating...' : '✓ Update'}
                                                                                                </button>
                                                                                                <button
                                                                                                    onClick={cancelEditReview}
                                                                                                    disabled={isLoadingReviewEdit}
                                                                                                    className="flex-1 px-3 py-2 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 disabled:bg-gray-300 transition font-medium"
                                                                                                >
                                                                                                    ✕ Cancel
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        /* View Mode */
                                                                                        <>
                                                                                            <div>
                                                                                                <label className="text-xs font-semibold text-gray-700">Recommendation</label>
                                                                                                <p className={`font-bold text-sm mt-0.5 ${reviewer.reReview.recommendation === 'Accept' ? 'text-green-600' :
                                                                                                    reviewer.reReview.recommendation === 'Reject' ? 'text-red-600' : 'text-yellow-600'
                                                                                                    }`}>
                                                                                                    {reviewer.reReview.recommendation || 'N/A'}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-xs font-semibold text-gray-700">Rating</label>
                                                                                                <p className="font-bold text-sm text-purple-600 mt-0.5">
                                                                                                    {reviewer.reReview.overallRating || 'N/A'}/5
                                                                                                </p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="text-xs font-semibold text-gray-700">Comments</label>
                                                                                                <p className={`text-xs text-gray-600 mt-0.5 bg-white p-2 rounded ${expandedReviewCards.has(`${reviewer._id}-round2`)
                                                                                                    ? 'max-h-none whitespace-pre-wrap'
                                                                                                    : 'max-h-12 overflow-hidden line-clamp-2'
                                                                                                    }`}>
                                                                                                    {reviewer.reReview.commentsToEditor || 'No comments'}
                                                                                                </p>
                                                                                            </div>
                                                                                            <div className="text-xs text-gray-500 pt-1">
                                                                                                {new Date(reviewer.reReview.submittedAt).toLocaleDateString()}
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex-1 bg-white rounded p-3 text-center mb-3">
                                                                            <p className="text-xs text-gray-500 italic">Awaiting review submission...</p>
                                                                        </div>
                                                                    )}

                                                                    {/* Action Buttons - Message, Edit, Delete */}
                                                                    <div className="flex gap-2">
                                                                        {/* Message Button */}
                                                                        <button
                                                                            onClick={() => {
                                                                                if (activeChat?.reviewerId === reviewer._id) {
                                                                                    setActiveChat(null);
                                                                                } else {
                                                                                    setActiveChat({
                                                                                        submissionId: viewingPaper.submissionId,
                                                                                        reviewerId: reviewer._id,
                                                                                        reviewerName: reviewer.username || reviewer.email,
                                                                                        reviewId: reviewer.review?._id
                                                                                    });
                                                                                    // Also close review details if open
                                                                                    setSelectedReviewForDetails(null);
                                                                                }
                                                                            }}
                                                                            className={`flex-1 px-3 py-2 rounded text-xs flex items-center justify-center gap-2 font-medium transition ${activeChat?.reviewerId === reviewer._id
                                                                                ? 'bg-purple-700 text-white'
                                                                                : 'bg-purple-600 text-white hover:bg-purple-700'
                                                                                }`}
                                                                            title="Chat with this reviewer"
                                                                        >
                                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                                            {activeChat?.reviewerId === reviewer._id ? 'Close Chat' : 'Chat'}
                                                                        </button>

                                                                        {/* Edit Button - Allow editing if review exists */}
                                                                        {/* {reviewer.review && (
                                                                    <button
                                                                        onClick={() => {
                                                                            // Will implement in ReviewerDashboard to allow reviewer to update their submission
                                                                            alert(`Edit button will allow reviewer to update their submission. Review ID: ${reviewer.review._id}`);
                                                                        }}
                                                                        className="px-3 py-2 rounded text-xs bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition"
                                                                        title="Allow reviewer to edit this review"
                                                                    >
                                                                        ✎ Edit
                                                                    </button>
                                                                )} */}

                                                                        {/* Delete Reviewer Button - Remove entire reviewer from paper */}
                                                                        {viewingPaper?.status !== 'Accepted' && viewingPaper?.status !== 'Rejected' && (
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (confirm(`Are you sure you want to DELETE ${reviewer.username || reviewer.email} as a reviewer? All their reviews and related data will be permanently removed.`)) {
                                                                                        try {
                                                                                            const token = localStorage.getItem('token');
                                                                                            const response = await axios.post(
                                                                                                `${API_URL}/api/editor/remove-reviewer`,
                                                                                                {
                                                                                                    paperId: viewingPaper._id,
                                                                                                    reviewerId: reviewer._id
                                                                                                },
                                                                                                {
                                                                                                    headers: {
                                                                                                        Authorization: `Bearer ${token}`
                                                                                                    }
                                                                                                }
                                                                                            );

                                                                                            if (response.data.success) {
                                                                                                alert('✅ Reviewer deleted successfully! All related data has been removed.');
                                                                                                if (viewingPaper?._id) {
                                                                                                    await fetchPaperReviewsAndReviewers(viewingPaper._id);
                                                                                                }
                                                                                            } else {
                                                                                                alert('Error: ' + (response.data.message || 'Failed to delete reviewer'));
                                                                                            }
                                                                                        } catch (error: any) {
                                                                                            console.error('Error deleting reviewer:', error);
                                                                                            alert(error.response?.data?.message || 'Failed to delete reviewer');
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="px-3 py-2 rounded text-xs bg-orange-600 text-white hover:bg-orange-700 font-medium transition"
                                                                                title="Remove reviewer from paper (deletes all related data)"
                                                                            >
                                                                                ✕ Remove Reviewer
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                                    <p>No reviewers assigned yet</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}




                    {/* Assign Reviewers Inline Panel */}
                    {showAssignModal && viewingPaper && (
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-purple-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Assign & Manage Reviewers</h3>
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedReviewersForAssignment([]);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                                <p className="text-blue-800 text-sm">
                                    <strong>Paper:</strong> {viewingPaper.paperTitle}
                                </p>
                                <p className="text-blue-800 text-sm">
                                    <strong>Status:</strong> {paperReviewers.length < 3 ? `${paperReviewers.length} of 3 reviewers assigned` : `✅ ${paperReviewers.length} reviewers assigned`}
                                </p>
                            </div>

                            {/* Already Assigned Reviewers Section */}
                            {paperReviewers.length > 0 && (
                                <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
                                    <h4 className="font-semibold text-gray-800 mb-3">Currently Assigned Reviewers ({paperReviewers.length})</h4>
                                    <div className="space-y-2">
                                        {paperReviewers.map((reviewer: any) => {
                                            const deadline = viewingPaper.reviewAssignments?.find((a: any) =>
                                                a.reviewer === reviewer._id || a.reviewer?.toString() === reviewer._id?.toString()
                                            )?.deadline;
                                            const isOverdue = deadline && new Date(deadline) < new Date();
                                            const hasReview = reviewer.review;
                                            const status = hasReview ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending';

                                            return (
                                                <div key={reviewer._id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded hover:shadow-md transition">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-800">{reviewer.username || reviewer.name}</p>
                                                        <p className="text-xs text-gray-500">{reviewer.email}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${hasReview ? 'bg-green-100 text-green-800' :
                                                                isOverdue ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {status}
                                                            </span>
                                                            {isOverdue && !hasReview && (
                                                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">⚠️ Past Deadline</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setReviewerInquiryModal({ reviewerId: reviewer._id, reviewerName: reviewer.username || reviewer.name })}
                                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                                                            title="Send status inquiry"
                                                        >
                                                            ❓ Query
                                                        </button>
                                                        {viewingPaper?.status !== 'Accepted' && viewingPaper?.status !== 'Rejected' && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm(`Are you sure you want to DELETE ${reviewer.username || reviewer.name} as a reviewer? All their reviews and related data will be permanently deleted. This action cannot be undone.`)) {
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            const response = await axios.post(
                                                                                `${API_URL}/api/editor/remove-reviewer`,
                                                                                {
                                                                                    paperId: viewingPaper._id,
                                                                                    reviewerId: reviewer._id
                                                                                },
                                                                                {
                                                                                    headers: {
                                                                                        Authorization: `Bearer ${token}`
                                                                                    }
                                                                                }
                                                                            );

                                                                            if (response.data.success) {
                                                                                alert('✅ Reviewer deleted successfully! All related data has been removed.');
                                                                                if (viewingPaper?._id) {
                                                                                    await fetchPaperReviewsAndReviewers(viewingPaper._id);
                                                                                }
                                                                            } else {
                                                                                alert('Error: ' + (response.data.message || 'Failed to delete reviewer'));
                                                                            }
                                                                        } catch (error: any) {
                                                                            console.error('Error deleting reviewer:', error);
                                                                            alert(error.response?.data?.message || 'Failed to delete reviewer');
                                                                        }
                                                                    }
                                                                }}
                                                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition font-medium"
                                                                title="Delete this reviewer and all related data (not available after paper is accepted/rejected)"
                                                            >
                                                                🗑 Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Add New Reviewers Section - Allow adding reviewers anytime */}
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Review Deadline *
                                    </label>
                                    <input
                                        type="date"
                                        value={assignmentDeadline}
                                        onChange={(e) => setAssignmentDeadline(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Select Reviewers {paperReviewers.length < 3 ? `(add ${3 - paperReviewers.length} to reach minimum 3)` : '(add additional reviewers)'} *
                                    </label>
                                    <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                                        {reviewers.length === 0 ? (
                                            <p className="text-gray-500 text-sm">No reviewers available</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {reviewers.map((reviewer: any) => {
                                                    // Hide reviewers already assigned to this paper
                                                    const alreadyAssigned = paperReviewers.some((pr: any) =>
                                                        pr._id === reviewer._id || pr.reviewer === reviewer._id
                                                    );

                                                    if (alreadyAssigned) return null;

                                                    const isSelected = selectedReviewersForAssignment.includes(reviewer._id);

                                                    return (
                                                        <label key={reviewer._id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedReviewersForAssignment([...selectedReviewersForAssignment, reviewer._id]);
                                                                    } else {
                                                                        setSelectedReviewersForAssignment(
                                                                            selectedReviewersForAssignment.filter(id => id !== reviewer._id)
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                                            />
                                                            <span className="ml-3 text-sm">
                                                                <strong>{reviewer.username}</strong> - {reviewer.email}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>



                                    <p className="text-xs text-gray-500 mt-2">
                                        New selection: {selectedReviewersForAssignment.length} reviewers
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setShowAssignModal(false);
                                            setSelectedReviewersForAssignment([]);
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAssignReviewers}
                                        disabled={assignmentLoading || selectedReviewersForAssignment.length < 1 || !assignmentDeadline}
                                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition font-medium"
                                    >
                                        {assignmentLoading ? 'Assigning...' : `Add ${selectedReviewersForAssignment.length} More Reviewers`}
                                    </button>
                                </div>
                            </>
                        </div>
                    )}

                    {/* Reviewer Inquiry Inline Panel */}
                    {reviewerInquiryModal && (
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Send Review Status Inquiry</h3>
                                <button
                                    onClick={() => {
                                        setReviewerInquiryModal(null);
                                        setInquiryMessage('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-700 mb-3">
                                    <strong>Reviewer:</strong> {reviewerInquiryModal.reviewerName}
                                </p>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Message *
                                </label>
                                <textarea
                                    value={inquiryMessage}
                                    onChange={(e) => setInquiryMessage(e.target.value)}
                                    placeholder="e.g., 'Hi, have you had a chance to review the paper? The deadline is approaching...'"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setReviewerInquiryModal(null);
                                        setInquiryMessage('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendInquiry}
                                    disabled={inquiryLoading || !inquiryMessage.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                                >
                                    {inquiryLoading ? 'Sending...' : 'Send Inquiry'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Revision Request Inline Panel */}
                    {showDecisionModal === 'revision' && viewingPaper && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-lg shadow-md p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                    Request Revision
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDecisionModal(null);
                                        setRevisionMessage('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {paperReviewers.length >= 3 && paperReviewers.every((r: any) => r.review) ? (
                                <>
                                    <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                                        <p className="text-blue-800 text-sm">
                                            <strong>ℹ️ Note:</strong> The author will receive all reviewer comments along with your message.
                                        </p>
                                    </div>

                                    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded border border-gray-200">
                                        <div>
                                            <p className="text-sm text-gray-600"><strong>📄 Paper:</strong></p>
                                            <p className="text-sm text-gray-800">{viewingPaper.paperTitle}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600"><strong>👤 Author:</strong></p>
                                            <p className="text-sm text-gray-800">{viewingPaper.authorName} ({viewingPaper.email})</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600"><strong>👥 Reviewers:</strong></p>
                                            <p className="text-sm text-green-700 font-medium">{paperReviewers.length} reviewers assigned</p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Revision Message *
                                        </label>
                                        <textarea
                                            value={revisionMessage}
                                            onChange={(e) => setRevisionMessage(e.target.value)}
                                            placeholder="Provide feedback and guidance for revision..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                                            rows={5}
                                        />
                                        <p className="text-xs text-gray-500">{revisionMessage.length} characters</p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Revision Deadline *
                                        </label>
                                        <input
                                            type="date"
                                            value={revisionDeadline}
                                            onChange={(e) => setRevisionDeadline(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Select the deadline for author to submit revision</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setShowDecisionModal(null);
                                                setRevisionMessage('');
                                                setRevisionDeadline('');
                                            }}
                                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleRevisionRequest}
                                            disabled={decisionLoading || !revisionMessage.trim() || !revisionDeadline}
                                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition font-medium"
                                        >
                                            {decisionLoading ? 'Sending...' : 'Send Revision Request'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 bg-white rounded border-l-4 border-red-500">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                        <div>
                                            <h4 className="text-lg font-semibold text-red-800 mb-2">Cannot Request Revision</h4>
                                            <p className="text-gray-700 mb-4">
                                                This paper needs at least <strong>3 reviewers with submitted reviews</strong> before you can request revision.
                                            </p>
                                            <p className="text-gray-600 mb-2">
                                                Currently has <strong className="text-orange-600">{paperReviewers.length}</strong> reviewer(s) assigned.
                                            </p>
                                            <p className="text-gray-600 mb-4">
                                                Reviews submitted: <strong className="text-orange-600">{paperReviewers.filter((r: any) => r.review).length}</strong> / {paperReviewers.length}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setShowDecisionModal(null);
                                                    setRevisionMessage('');
                                                    setRevisionDeadline('');
                                                }}
                                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rejection Inline Panel */}
                    {showDecisionModal === 'reject' && viewingPaper && (
                        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg shadow-md p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    Reject Paper
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDecisionModal(null);
                                        setRejectionReason('');
                                        setRejectionComments('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                                <p className="text-red-800 text-sm">
                                    <strong>⚠️ Warning:</strong> Rejection is permanent. The author will be notified via email with your comments and all reviewer feedback.
                                </p>
                            </div>

                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded border border-gray-200">
                                <div>
                                    <p className="text-sm text-gray-600"><strong>📄 Paper:</strong></p>
                                    <p className="text-sm text-gray-800">{viewingPaper.paperTitle}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600"><strong>👤 Author:</strong></p>
                                    <p className="text-sm text-gray-800">{viewingPaper.authorName} ({viewingPaper.email})</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600"><strong>👥 Reviewers:</strong></p>
                                    <p className="text-sm text-gray-700 font-medium">{paperReviewers.length} reviewer(s), {paperReviewers.filter((r: any) => r.review).length} review(s) submitted</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600"><strong>📋 Category:</strong></p>
                                    <p className="text-sm text-gray-800">{viewingPaper.category}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejection Reason *
                                </label>
                                <select
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    required
                                >
                                    <option value="">-- Select Reason --</option>
                                    <option value="Quality Issues">Quality Issues - Below conference standards</option>
                                    <option value="Out of Scope">Out of Scope - Not aligned with conference topics</option>
                                    <option value="Insufficient Novelty">Insufficient Novelty - Lacks original contribution</option>
                                    <option value="Methodology Flaws">Methodology Flaws - Serious issues in approach</option>
                                    <option value="Poor Presentation">Poor Presentation - Unclear writing/structure</option>
                                    <option value="Plagiarism Concerns">Plagiarism Concerns - Ethical issues detected</option>
                                    <option value="Inadequate Literature Review">Inadequate Literature Review - Missing key references</option>
                                    <option value="Multiple Major Issues">Multiple Major Issues - Several critical problems</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rejection Comments to Author *
                                </label>
                                <textarea
                                    value={rejectionComments}
                                    onChange={(e) => setRejectionComments(e.target.value)}
                                    placeholder="Provide detailed feedback explaining the rejection decision. Be professional and constructive..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
                                    rows={6}
                                />
                                <p className="text-xs text-gray-500">{rejectionComments.length} characters</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDecisionModal(null);
                                        setRejectionReason('');
                                        setRejectionComments('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectPaper}
                                    disabled={decisionLoading || !rejectionReason || !rejectionComments.trim()}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                                >
                                    {decisionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviewers' && (
                        <div className="bg-white rounded-lg shadow-md h-full min-h-screen flex flex-col">
                            {/* Header with Add Button */}
                            <div className="border-b border-gray-200 p-6 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Manage Reviewers</h3>
                                    {!showCreateReviewer && (
                                        <button
                                            onClick={() => {
                                                setShowCreateReviewer(true);
                                                setNewReviewer({ ...newReviewer, password: generateRandomPassword() });
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition shadow-md"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Add New Reviewer
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Main Layout - List on Left, Form on Right */}
                            <div className="flex flex-1 overflow-hidden gap-4 p-6">
                                {/* Left Side - Reviewers List */}
                                <div className={`${showCreateReviewer ? 'flex-1' : 'flex-1'} overflow-hidden`}>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
                                        {/* Reviewers Filter Sidebar */}
                                        <div className="flex-1 overflow-hidden">
                                            <ReviewerFilterPanel
                                                reviewers={reviewers}
                                                selectedReviewer={selectedReviewerFilter}
                                                onFilterChange={setFilteredReviewers}
                                                onSelectReviewer={setSelectedReviewerFilter}
                                                onClearSearch={() => setFilteredReviewers(reviewers)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Reviewer Details or Create Form */}
                                {showCreateReviewer ? (
                                    <div className="w-96 flex-shrink-0">
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 h-full overflow-y-auto shadow-lg">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                    <UserPlus className="w-5 h-5 text-green-600" />
                                                    Create Reviewer
                                                </h4>
                                                <button
                                                    onClick={() => {
                                                        setShowCreateReviewer(false);
                                                        setNewReviewer({ email: '', username: '', password: '' });
                                                    }}
                                                    className="text-gray-500 hover:text-gray-700 transition"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                                    <input
                                                        type="email"
                                                        value={newReviewer.email}
                                                        onChange={(e) => setNewReviewer({ ...newReviewer, email: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        placeholder="reviewer@example.com"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Username (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={newReviewer.username}
                                                        onChange={(e) => setNewReviewer({ ...newReviewer, username: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                        placeholder="Auto-generated from email"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={newReviewer.password}
                                                            onChange={(e) => setNewReviewer({ ...newReviewer, password: e.target.value })}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                            placeholder="Min 6 characters"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewReviewer({ ...newReviewer, password: generateRandomPassword() })}
                                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                                            title="Generate random password"
                                                        >
                                                            <RefreshCw className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-600 bg-white p-3 rounded border-l-4 border-blue-400">
                                                    💡 Credentials will be sent to reviewer's email
                                                </p>

                                                <div className="flex flex-col gap-2 pt-4">
                                                    <button
                                                        onClick={handleCreateReviewer}
                                                        disabled={!newReviewer.email || !newReviewer.password}
                                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-medium"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Create Account
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowCreateReviewer(false);
                                                            setNewReviewer({ email: '', username: '', password: '' });
                                                        }}
                                                        className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : selectedReviewerFilter ? (
                                    <div className="w-96 flex-shrink-0">
                                        <div className="bg-white border border-gray-300 rounded-lg p-6 h-full overflow-y-auto shadow-lg space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 mb-1">
                                                    {selectedReviewerFilter.name}
                                                </h3>
                                                <p className="text-sm text-gray-600">{selectedReviewerFilter.email}</p>
                                            </div>

                                            {/* Reviewer Stats */}
                                            <div className="space-y-3">
                                                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                                                    <p className="text-xs text-gray-600 font-medium">Assigned Papers</p>
                                                    <p className="text-2xl font-bold text-blue-600 mt-1">{selectedReviewerFilter.assignedPapers || 0}</p>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                                                    <p className="text-xs text-gray-600 font-medium">Completed</p>
                                                    <p className="text-2xl font-bold text-green-600 mt-1">{selectedReviewerFilter.completedReviews || 0}</p>
                                                </div>
                                                <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                                                    <p className="text-xs text-gray-600 font-medium">Pending</p>
                                                    <p className="text-2xl font-bold text-orange-600 mt-1">{selectedReviewerFilter.pendingReviews || 0}</p>
                                                </div>
                                                <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
                                                    <p className="text-xs text-gray-600 font-medium">Overdue</p>
                                                    <p className="text-2xl font-bold text-red-600 mt-1">{selectedReviewerFilter.overdueReviews || 0}</p>
                                                </div>
                                            </div>

                                            {/* Rating */}
                                            {selectedReviewerFilter.averageRating && (
                                                <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                                                    <p className="text-xs text-gray-600 font-medium">Average Rating</p>
                                                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                                                        {selectedReviewerFilter.averageRating.toFixed(1)} ⭐
                                                    </p>
                                                </div>
                                            )}

                                            {/* Expertise */}
                                            {selectedReviewerFilter.expertise && selectedReviewerFilter.expertise.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Areas of Expertise</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedReviewerFilter.expertise.map((exp: string, idx: number) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                                                            >
                                                                {exp}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-96 flex-shrink-0">
                                        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 h-full flex items-center justify-center">
                                            <div className="text-center text-gray-500">
                                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Select a reviewer</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab - REMOVED */}

                    {activeTab === 'pdfs' && (
                        <div className="h-full flex flex-col">
                            <PDFManagement />
                        </div>
                    )}

                    {/* Create Reviewer Tab */}
                    {activeTab === 'createReviewer' && (
                        <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                                <h3 className="font-semibold text-blue-900 mb-2">📧 Add New Reviewer Account</h3>
                                <p className="text-blue-800 text-sm">
                                    Create a new reviewer account with email, username, and password. Credentials will be used for sending review assignment emails.
                                </p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleCreateReviewer(); }} className="space-y-4">
                                {/* Email Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gmail Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={newReviewer.email}
                                        onChange={(e) => setNewReviewer({ ...newReviewer, email: e.target.value })}
                                        placeholder="reviewer@gmail.com"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Username Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username *
                                    </label>
                                    <input
                                        type="text"
                                        value={newReviewer.username}
                                        onChange={(e) => setNewReviewer({ ...newReviewer, username: e.target.value })}
                                        placeholder="john_doe"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Password *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newReviewer.password}
                                            onChange={(e) => setNewReviewer({ ...newReviewer, password: e.target.value })}
                                            placeholder="Min 6 characters"
                                            required
                                            minLength={6}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setNewReviewer({ ...newReviewer, password: generateRandomPassword() })}
                                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                                            title="Generate random password"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Password will be used in email credentials</p>
                                </div>

                                {/* Error Message */}
                                {/* Success Message */}
                                {showCreateReviewer && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-green-800 text-sm font-medium">
                                            ✅ Reviewer created successfully! Credentials have been sent to their email.
                                        </p>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={showCreateReviewer}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        {showCreateReviewer ? 'Creating...' : 'Create Reviewer Account'}
                                    </button>
                                </div>
                            </form>

                            {/* Recently Created Reviewers */}
                            {reviewers.length > 0 && (
                                <div className="mt-8 pt-6 border-t">
                                    <h4 className="font-semibold text-gray-800 mb-4">📋 All Reviewers ({reviewers.length})</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                        {reviewers.map((reviewer: any) => (
                                            <div key={reviewer._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <p className="font-medium text-gray-900">{reviewer.username}</p>
                                                <p className="text-sm text-gray-600">{reviewer.email}</p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Joined: {new Date(reviewer.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* All Reviewers Tab */}
                    {activeTab === 'allReviewers' && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage All Reviewers</h2>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by email or name..."
                                        value={allReviewersSearchTerm}
                                        onChange={(e) => setAllReviewersSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {reviewers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>No reviewers created yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {reviewers.filter(r =>
                                        !allReviewersSearchTerm ||
                                        r.email.toLowerCase().includes(allReviewersSearchTerm.toLowerCase()) ||
                                        (r.name && r.name.toLowerCase().includes(allReviewersSearchTerm.toLowerCase()))
                                    ).map((reviewer: any) => {
                                        const assignedPapersList = papers.filter(p =>
                                            p.assignedReviewers &&
                                            p.assignedReviewers.some(ar => ar._id === reviewer._id || ar === reviewer._id)
                                        );

                                        const isEditing = editingReviewerId === reviewer._id;

                                        return (
                                            <div key={reviewer._id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                                {/* Reviewer Card - Main View or Edit Mode */}
                                                {!isEditing ? (
                                                    // Display Mode
                                                    <div className="p-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-4 flex-1">
                                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                    <Users className="w-6 h-6 text-blue-600" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-gray-900 truncate">{reviewer.username}</p>
                                                                    <p className="text-sm text-gray-600 truncate">{reviewer.email}</p>
                                                                </div>
                                                                <div className="text-right ml-4 flex-shrink-0">
                                                                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                        {assignedPapersList.length} paper{assignedPapersList.length !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2 mt-4 border-t pt-4">
                                                            <button
                                                                onClick={() => startEditReviewer(reviewer)}
                                                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition flex items-center justify-center gap-2"
                                                                title="Edit reviewer details"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button
                                                                onClick={() => setExpandedReviewerId(
                                                                    expandedReviewerId === reviewer._id ? null : reviewer._id
                                                                )}
                                                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium transition flex items-center justify-center gap-2"
                                                            >
                                                                📄 {expandedReviewerId === reviewer._id ? 'Hide' : 'View'} Papers
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteReviewerFromSystem(reviewer._id, reviewer.username)}
                                                                disabled={isLoadingReviewerAction}
                                                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 text-sm font-medium transition flex items-center justify-center gap-2"
                                                                title="Delete reviewer permanently"
                                                            >
                                                                {isLoadingReviewerAction ? '⏳...' : '🗑️ Delete'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Edit Mode
                                                    <div className="p-6 bg-blue-50 border-2 border-blue-300">
                                                        <h4 className="font-bold text-gray-900 mb-4">Edit Reviewer Details</h4>
                                                        <div className="space-y-4 mb-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                                                <input
                                                                    type="text"
                                                                    value={editFormData.username}
                                                                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Reviewer name"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                                <input
                                                                    type="email"
                                                                    value={editFormData.email}
                                                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="reviewer@example.com"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleEditReviewer(reviewer._id)}
                                                                disabled={isLoadingReviewerAction}
                                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-medium transition"
                                                            >
                                                                {isLoadingReviewerAction ? '⏳ Saving...' : '💾 Save Changes'}
                                                            </button>
                                                            <button
                                                                onClick={cancelEditReviewer}
                                                                disabled={isLoadingReviewerAction}
                                                                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 font-medium transition"
                                                            >
                                                                ✕ Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Assigned Papers Dropdown */}
                                                {expandedReviewerId === reviewer._id && (
                                                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                                                        {assignedPapersList.length === 0 ? (
                                                            <p className="text-gray-500 text-center py-4">No papers assigned to this reviewer</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                <h4 className="font-semibold text-gray-900 mb-4">
                                                                    Assigned Papers ({assignedPapersList.length})
                                                                </h4>
                                                                {assignedPapersList.map((paper) => (
                                                                    <div
                                                                        key={paper._id}
                                                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                                                                        onClick={() => {
                                                                            setViewingPaper(paper);
                                                                            setActiveTab('papers');
                                                                        }}
                                                                    >
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex-1">
                                                                                <p className="font-semibold text-gray-900 line-clamp-2">
                                                                                    {paper.paperTitle}
                                                                                </p>
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                    <strong>ID:</strong> {paper.submissionId}
                                                                                </p>
                                                                                <p className="text-sm text-gray-600">
                                                                                    <strong>Author:</strong> {paper.authorName}
                                                                                </p>
                                                                                <p className="text-sm text-gray-600">
                                                                                    <strong>Category:</strong> {paper.category}
                                                                                </p>
                                                                            </div>
                                                                            <StatusBadge status={paper.status} />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Paper Details Modal - Removed (now using side-by-side view instead) */}
                </div>
            </div>

            {/* Message to Reviewer Modal - REMOVED (showing inline in Reviewers tab instead) */}
            {/* Paper History Modal */}
            {showHistoryModal && viewingPaper && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Paper Operation History
                            </h3>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <PaperHistoryTimeline submissionId={viewingPaper.submissionId} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default EditorDashboard;
