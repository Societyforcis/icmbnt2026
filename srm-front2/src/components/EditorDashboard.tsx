import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
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
    Send,
    BarChart3,
    TrendingUp,
    AlertCircle,
    ZoomIn,
    ZoomOut,
    Download,
    MessageSquare,
    Search,
    Filter,
    Check,
    Cloud
} from 'lucide-react';
import ReviewerDetailsPanel from './ReviewerDetailsPanel';
import ConversationMessaging from './ConversationMessaging';
import ReviewerFilterPanel, { Reviewer } from './ReviewerFilterPanel';
import PDFManagement from './PDFManagement';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

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

    // Reviewer assignment states (inline - no modal)
    const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);
    const [selectedReviewers, setSelectedReviewers] = useState<Record<string, string[]>>({});
    const [deadlineDays, setDeadlineDays] = useState<Record<string, number>>({});

    // Create reviewer states
    const [showCreateReviewer, setShowCreateReviewer] = useState(false);
    const [newReviewer, setNewReviewer] = useState({ email: '', username: '', password: '' });

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');

    // Paper details view state (instead of modal)
    const [viewingPaper, setViewingPaper] = useState<Paper | null>(null);

    // Review viewing state
    const [allReviews, setAllReviews] = useState<any[]>([]);
    const [viewingReviewId, setViewingReviewId] = useState<string | null>(null);
    const [viewingSubmissionId, setViewingSubmissionId] = useState<string | null>(null);

    // PDF viewer states - Chrome-like continuous scroll
    const [zoom, setZoom] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    const [renderedPages, setRenderedPages] = useState<number[]>([1]);
    const [signedPdfUrl, setSignedPdfUrl] = useState<string>('');

    // Message and Reviewer Filter states
    const [messages, setMessages] = useState<any[]>([]);
    const [, setFilteredReviewers] = useState<any[]>([]);
    const [selectedReviewerFilter, setSelectedReviewerFilter] = useState<any | null>(null);

    // Review search state
    const [reviewSearchTerm, setReviewSearchTerm] = useState('');

    useEffect(() => {
        verifyEditorAccess();
    }, []);

    // Fetch signed PDF URL when viewing paper changes
    useEffect(() => {
        const fetchPdfUrl = async () => {
            if (!viewingPaper || !viewingPaper.submissionId) {
                setSignedPdfUrl('');
                setPdfError(null);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setPdfError('No token found');
                    return;
                }

                console.log('Fetching PDF for:', viewingPaper.submissionId);
                const response = await axios.get(
                    `${API_URL}/api/editor/pdf/${viewingPaper.submissionId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                
                if (response.data.success && response.data.pdfUrl) {
                    // Use Cloudinary URL directly
                    console.log('✓ Got PDF URL from Cloudinary:', response.data.pdfUrl);
                    setSignedPdfUrl(response.data.pdfUrl);
                    setPdfError(null);
                } else {
                    console.error('Failed to get PDF:', response.data);
                    setPdfError('Could not load PDF');
                    setSignedPdfUrl('');
                }
            } catch (error: any) {
                console.error('Error fetching PDF:', error);
                setPdfError(error.response?.data?.message || 'Failed to fetch PDF');
                setSignedPdfUrl('');
            }
        };

        fetchPdfUrl();
    }, [viewingPaper?.submissionId]);

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
                    setError('Cannot connect to server. Please ensure the backend is running on port 5000.');
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
            setNewReviewer({ email: '', username: '', password: '' });
            fetchDashboardData(reviewerHeaders);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create reviewer');
        }
    };

    const handleAssignReviewers = async (paperId: string) => {
        const reviewerIds = selectedReviewers[paperId] || [];
        const days = deadlineDays[paperId] || 3;

        if (reviewerIds.length === 0) {
            alert('Please select at least one reviewer');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.post(
                `${API_URL}/api/editor/assign-reviewers`,
                {
                    paperId,
                    reviewerIds,
                    deadlineDays: days
                },
                { headers }
            );

            alert(`Reviewers assigned successfully with ${days}-day deadline!`);
            // Clear selections for this paper
            setSelectedReviewers(prev => ({ ...prev, [paperId]: [] }));
            setDeadlineDays(prev => ({ ...prev, [paperId]: 3 }));
            setExpandedPaperId(null);
            fetchDashboardData(headers);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to assign reviewers');
        }
    };

    const fetchAllReviews = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            // Fetch reviews for each paper
            const reviewsPromises = papers.map(paper =>
                axios.get(`${API_URL}/api/editor/papers/${paper._id}/reviews`, { headers })
                    .then(res => ({
                        ...res.data,
                        paperId: paper._id,
                        paperTitle: paper.paperTitle,
                        submissionId: paper.submissionId
                    }))
                    .catch(() => ({ paperId: paper._id, reviews: [], paperTitle: paper.paperTitle, submissionId: paper.submissionId }))
            );
            const allReviewsData = await Promise.all(reviewsPromises);
            const flattenedReviews = allReviewsData.flatMap(r => 
                (r.reviews || []).map((review: any) => ({
                    ...review,
                    paperId: r.paperId,
                    paperTitle: r.paperTitle,
                    submissionId: r.submissionId
                }))
            );
            
            setAllReviews(flattenedReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.get(`${API_URL}/api/editor/messages`, { headers });
            const messagesList = response.data.messages || [];
            setMessages(messagesList);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
            // If endpoint doesn't exist, show empty list
            setMessages([]);
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
                                    Make sure backend is running:<br/>
                                    <code>npm start</code> in srm-back folder
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
                        icon={Users}
                        label="Reviewers"
                        active={activeTab === 'reviewers'}
                        onClick={() => setActiveTab('reviewers')}
                        collapsed={!sidebarOpen}
                    />
                    <NavItem
                        icon={MessageSquare}
                        label="Messages"
                        active={activeTab === 'messages'}
                        onClick={() => {
                            setActiveTab('messages');
                            fetchMessages();
                        }}
                        collapsed={!sidebarOpen}
                    />
                    <NavItem
                        icon={MessageSquare}
                        label="Reviews"
                        active={activeTab === 'reviews'}
                        onClick={() => {
                            setActiveTab('reviews');
                            fetchAllReviews();
                        }}
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
                        icon={BarChart3}
                        label="Analytics"
                        active={activeTab === 'analytics'}
                        onClick={() => setActiveTab('analytics')}
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
                        {activeTab === 'reviewers' && 'Manage Reviewers'}
                        {activeTab === 'messages' && 'Reviewer Messages'}
                        {activeTab === 'reviews' && 'Reviews'}
                        {activeTab === 'pdfs' && 'PDF Management'}
                        {activeTab === 'analytics' && 'Analytics & Reports'}
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

                    {activeTab === 'papers' && !viewingPaper && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-semibold">All Papers</h3>
                                </div>

                                {/* Search Bar */}
                                <div className="mb-6">
                                    <input
                                        type="text"
                                        placeholder="Search by title, author, submission ID, or category..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        {searchTerm ? `Found ${papers.filter(p => 
                                            p.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.submissionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.category.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).length} paper(s)` : `Showing all ${papers.length} paper(s)`}
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {papers.filter(p => 
                                        !searchTerm || 
                                        p.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.submissionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        p.category.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((paper) => (
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
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Reviewers: {paper.assignedReviewers?.length || 0}
                                                        </p>
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
                                                            setExpandedPaperId(expandedPaperId === paper._id ? null : paper._id);
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                        {expandedPaperId === paper._id ? 'Close' : 'Assign'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Inline Reviewer Assignment Section */}
                                            {expandedPaperId === paper._id && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                        <UserPlus className="w-5 h-5 text-blue-600" />
                                                        Assign Reviewers - {paper.submissionId}
                                                    </h4>

                                                    {/* Deadline Input */}
                                                    <div className="mb-4">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Review Deadline (Days)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="365"
                                                            value={deadlineDays[paper._id] || 3}
                                                            onChange={(e) => setDeadlineDays(prev => ({ ...prev, [paper._id]: parseInt(e.target.value) || 3 }))}
                                                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="3"
                                                        />
                                                        <span className="text-sm text-gray-500 ml-2">days from now</span>
                                                    </div>

                                                    {/* Reviewer Selection */}
                                                    <div className="mb-4">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Select Reviewers
                                                        </label>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto bg-white p-3 rounded-lg border">
                                                            {reviewers.map((reviewer) => (
                                                                <label key={reviewer._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={(selectedReviewers[paper._id] || []).includes(reviewer._id)}
                                                                        onChange={(e) => {
                                                                            const current = selectedReviewers[paper._id] || [];
                                                                            if (e.target.checked) {
                                                                                setSelectedReviewers(prev => ({
                                                                                    ...prev,
                                                                                    [paper._id]: [...current, reviewer._id]
                                                                                }));
                                                                            } else {
                                                                                setSelectedReviewers(prev => ({
                                                                                    ...prev,
                                                                                    [paper._id]: current.filter(id => id !== reviewer._id)
                                                                                }));
                                                                            }
                                                                        }}
                                                                        className="w-4 h-4 text-blue-600"
                                                                    />
                                                                    <span className="text-sm">
                                                                        {reviewer.name} ({reviewer.email})
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        {(selectedReviewers[paper._id] || []).length > 0 && (
                                                            <p className="text-sm text-blue-600 mt-2">
                                                                Selected: {(selectedReviewers[paper._id] || []).length} reviewer(s)
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleAssignReviewers(paper._id)}
                                                            disabled={(selectedReviewers[paper._id] || []).length === 0}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                            Assign & Send Emails
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setExpandedPaperId(null);
                                                                setSelectedReviewers(prev => ({ ...prev, [paper._id]: [] }));
                                                            }}
                                                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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
                                {/* Left Column - Paper Details */}
                                <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 max-h-[85vh] overflow-y-auto">
                                    <div className="border-b pb-4 mb-4">
                                        <h3 className="text-xl font-semibold text-gray-800">{viewingPaper.paperTitle}</h3>
                                        <div className="mt-3 flex items-center gap-2">
                                            <StatusBadge status={viewingPaper.status} />
                                            <span className="text-xs text-gray-500">Last updated: {new Date(viewingPaper.createdAt || '').toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Author Information */}
                                    <div className="space-y-3 mb-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Author Name</label>
                                            <p className="text-gray-800 bg-gray-50 p-2 rounded text-sm">{viewingPaper.authorName}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                                            <p className="text-gray-800 bg-gray-50 p-2 rounded text-sm break-all">{viewingPaper.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Submission ID</label>
                                            <p className="text-gray-800 bg-gray-50 p-2 rounded text-sm font-mono">{viewingPaper.submissionId}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                                            <p className="text-gray-800 bg-gray-50 p-2 rounded text-sm">{viewingPaper.category}</p>
                                        </div>
                                    </div>

                                    {/* Database Information */}
                                    <div className="border-t pt-4">
                                        <label className="block text-xs font-medium text-gray-600 mb-3">Database Information</label>
                                        <div className="space-y-2">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded border border-blue-200">
                                                <p className="text-xs text-gray-600 mb-1">Database ID</p>
                                                <p className="text-sm font-mono text-gray-800 break-all">{viewingPaper._id}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded border border-purple-200">
                                                <p className="text-xs text-gray-600 mb-1">Submission ID</p>
                                                <p className="text-sm font-semibold text-gray-800">{viewingPaper.submissionId}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-3 rounded border border-green-200">
                                                <p className="text-xs text-gray-600 mb-1">Paper Title</p>
                                                <p className="text-sm font-medium text-gray-800">{viewingPaper.paperTitle}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded border border-orange-200">
                                                <p className="text-xs text-gray-600 mb-1">Status</p>
                                                <p className="text-sm font-semibold">
                                                    <StatusBadge status={viewingPaper.status} />
                                                </p>
                                            </div>
                                            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded border border-red-200">
                                                <p className="text-xs text-gray-600 mb-1">Author Name</p>
                                                <p className="text-sm text-gray-800">{viewingPaper.authorName}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-3 rounded border border-cyan-200">
                                                <p className="text-xs text-gray-600 mb-1">Author Email</p>
                                                <p className="text-sm text-gray-800 break-all">{viewingPaper.email}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded border border-indigo-200">
                                                <p className="text-xs text-gray-600 mb-1">Category</p>
                                                <p className="text-sm text-gray-800">{viewingPaper.category}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-3 rounded border border-slate-200">
                                                <p className="text-xs text-gray-600 mb-1">Submission Date</p>
                                                <p className="text-sm text-gray-800">{new Date(viewingPaper.createdAt || '').toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-lime-50 to-green-50 p-3 rounded border border-lime-200">
                                                <p className="text-xs text-gray-600 mb-1">Assigned Reviewers Count</p>
                                                <p className="text-sm font-semibold text-gray-800">{viewingPaper.assignedReviewers?.length || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reviewer Assignments Section */}
                                    {viewingPaper.assignedReviewers && viewingPaper.assignedReviewers.length > 0 && (
                                        <div className="mt-6 pt-6 border-t">
                                            <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-blue-600" />
                                                Assigned Reviewers ({viewingPaper.assignedReviewers.length})
                                            </h4>
                                            <div className="space-y-2">
                                                {viewingPaper.assignedReviewers.map((reviewer: any, idx: number) => {
                                                    const assignment = viewingPaper.reviewAssignments?.find((a: any) => a.reviewer === reviewer._id);
                                                    const hasResponded = assignment?.review ? true : false;
                                                    
                                                    return (
                                                        <div key={idx} className={`p-3 rounded-lg border-l-4 ${
                                                            hasResponded 
                                                                ? 'bg-green-50 border-green-500' 
                                                                : assignment?.status === 'Overdue'
                                                                ? 'bg-red-50 border-red-500'
                                                                : 'bg-yellow-50 border-yellow-500'
                                                        }`}>
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-sm text-gray-800">
                                                                        {reviewer.username || reviewer.email}
                                                                    </p>
                                                                    <p className="text-xs text-gray-600">{reviewer.email}</p>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                    hasResponded
                                                                        ? 'bg-green-200 text-green-800'
                                                                        : assignment?.status === 'Overdue'
                                                                        ? 'bg-red-200 text-red-800'
                                                                        : 'bg-yellow-200 text-yellow-800'
                                                                }`}>
                                                                    {hasResponded ? '✓ Responded' : assignment?.status || 'Pending'}
                                                                </span>
                                                            </div>
                                                            {assignment && (
                                                                <div className="text-xs text-gray-600 mt-2">
                                                                    Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                                                                    {assignment.emailSent && ' • Email sent'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Summary Stats */}
                                            <div className="mt-4 grid grid-cols-3 gap-2">
                                                <div className="bg-blue-50 p-2 rounded text-center border border-blue-200">
                                                    <p className="text-xs text-gray-600">Total</p>
                                                    <p className="text-lg font-bold text-blue-600">{viewingPaper.assignedReviewers?.length || 0}</p>
                                                </div>
                                                <div className="bg-green-50 p-2 rounded text-center border border-green-200">
                                                    <p className="text-xs text-gray-600">Responded</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {viewingPaper.assignedReviewers?.filter((r: any) => 
                                                            viewingPaper.reviewAssignments?.find((a: any) => a.reviewer === r._id && a.review)
                                                        ).length || 0}
                                                    </p>
                                                </div>
                                                <div className="bg-yellow-50 p-2 rounded text-center border border-yellow-200">
                                                    <p className="text-xs text-gray-600">Pending</p>
                                                    <p className="text-lg font-bold text-yellow-600">
                                                        {viewingPaper.assignedReviewers?.filter((r: any) => 
                                                            !viewingPaper.reviewAssignments?.find((a: any) => a.reviewer === r._id && a.review)
                                                        ).length || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-4 pt-4 border-t">
                                        <button
                                            onClick={() => {
                                                setExpandedPaperId(expandedPaperId === viewingPaper._id ? null : viewingPaper._id);
                                            }}
                                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            {expandedPaperId === viewingPaper._id ? 'Close Assignment' : 'Assign Reviewers'}
                                        </button>
                                    </div>

                                    {/* Inline Assignment Section in Paper Details */}
                                    {expandedPaperId === viewingPaper._id && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                            <h5 className="font-semibold text-gray-800 mb-3 text-sm">Assign Reviewers</h5>

                                            {/* Deadline Input */}
                                            <div className="mb-3">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Review Deadline (Days)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    value={deadlineDays[viewingPaper._id] || 3}
                                                    onChange={(e) => setDeadlineDays(prev => ({ ...prev, [viewingPaper._id]: parseInt(e.target.value) || 3 }))}
                                                    className="w-28 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="3"
                                                />
                                                <span className="text-xs text-gray-500 ml-2">days</span>
                                            </div>

                                            {/* Reviewer Selection */}
                                            <div className="mb-3">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Select Reviewers
                                                </label>
                                                <div className="space-y-1 max-h-40 overflow-y-auto bg-white p-2 rounded border">
                                                    {reviewers.map((reviewer) => (
                                                        <label key={reviewer._id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={(selectedReviewers[viewingPaper._id] || []).includes(reviewer._id)}
                                                                onChange={(e) => {
                                                                    const current = selectedReviewers[viewingPaper._id] || [];
                                                                    if (e.target.checked) {
                                                                        setSelectedReviewers(prev => ({
                                                                            ...prev,
                                                                            [viewingPaper._id]: [...current, reviewer._id]
                                                                        }));
                                                                    } else {
                                                                        setSelectedReviewers(prev => ({
                                                                            ...prev,
                                                                            [viewingPaper._id]: current.filter(id => id !== reviewer._id)
                                                                        }));
                                                                    }
                                                                }}
                                                                className="w-3 h-3 text-blue-600"
                                                            />
                                                            <span className="truncate">{reviewer.name} ({reviewer.email})</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {(selectedReviewers[viewingPaper._id] || []).length > 0 && (
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        Selected: {(selectedReviewers[viewingPaper._id] || []).length} reviewer(s)
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAssignReviewers(viewingPaper._id)}
                                                    disabled={(selectedReviewers[viewingPaper._id] || []).length === 0}
                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                >
                                                    <Send className="w-3 h-3" />
                                                    Assign & Send Emails
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setExpandedPaperId(null);
                                                        setSelectedReviewers(prev => ({ ...prev, [viewingPaper._id]: [] }));
                                                    }}
                                                    className="px-3 py-1.5 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-xs"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column - Chrome-like PDF Viewer */}
                                <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-0 max-h-[85vh] flex flex-col overflow-hidden">
                                    {/* PDF Toolbar */}
                                    <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center gap-3 flex-shrink-0">
                                        <h4 className="font-semibold text-gray-800">PDF Viewer</h4>
                                        <div className="flex items-center gap-2">
                                            {/* Zoom Controls */}
                                            <div className="flex items-center gap-1 bg-white border rounded">
                                                <button 
                                                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                                                    className="p-2 hover:bg-gray-100 transition"
                                                    title="Zoom Out"
                                                >
                                                    <ZoomOut className="w-4 h-4 text-gray-700" />
                                                </button>
                                                <input 
                                                    type="number" 
                                                    min="50" 
                                                    max="200" 
                                                    step="10"
                                                    value={zoom}
                                                    onChange={(e) => setZoom(Number(e.target.value))}
                                                    className="w-14 text-center text-sm border-l border-r px-1 py-1"
                                                />
                                                <span className="text-xs text-gray-600 px-1">%</span>
                                                <button 
                                                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                                                    className="p-2 hover:bg-gray-100 transition"
                                                    title="Zoom In"
                                                >
                                                    <ZoomIn className="w-4 h-4 text-gray-700" />
                                                </button>
                                            </div>

                                            {/* Fullscreen Button */}
                                            <button 
                                                onClick={() => {
                                                    const element = document.getElementById('pdf-viewer-fullscreen');
                                                    if (!isFullscreen && element) {
                                                        element.requestFullscreen?.().catch(() => {});
                                                        setIsFullscreen(true);
                                                    } else {
                                                        document.exitFullscreen?.().catch(() => {});
                                                        setIsFullscreen(false);
                                                    }
                                                }}
                                                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs font-medium flex items-center gap-1"
                                                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                                            >
                                                {isFullscreen ? '⛶ Exit' : '⛶ Full'}
                                            </button>

                                            {/* Download Button */}
                                            {signedPdfUrl && (
                                                <button 
                                                    onClick={() => {
                                                        const link = document.createElement('a');
                                                        link.href = signedPdfUrl;
                                                        link.download = `${viewingPaper?.submissionId || 'paper'}.pdf`;
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                    }}
                                                    className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                                                    title="Download PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* PDF Continuous Scroll Viewer */}
                                    <div 
                                        id="pdf-viewer-fullscreen"
                                        className={`flex-1 overflow-y-auto bg-gray-100 flex items-center justify-center ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
                                        style={{
                                            background: isFullscreen ? '#000' : '#f3f4f6'
                                        }}
                                    >
                                        {signedPdfUrl ? (
                                            <div className="flex flex-col items-center gap-2 py-4 w-full">
                                                <Document
                                                    file={signedPdfUrl}
                                                    onLoadSuccess={({ numPages }) => {
                                                        setPdfError(null);
                                                        // Render all pages for continuous scroll
                                                        setRenderedPages(Array.from({ length: numPages }, (_, i) => i + 1));
                                                        console.log('✓ PDF loaded successfully:', numPages, 'pages');
                                                    }}
                                                    onError={(error) => {
                                                        console.error('PDF Load Error:', error);
                                                        setPdfError(`Failed to load PDF: ${error.message}`);
                                                    }}
                                                    loading={
                                                        <div className="flex items-center justify-center h-96 bg-gray-50 rounded">
                                                            <div className="text-center">
                                                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-3"></div>
                                                                <p className="text-gray-600">Loading PDF...</p>
                                                                <p className="text-xs text-gray-500 mt-2">Reading from database</p>
                                                            </div>
                                                        </div>
                                                    }
                                                    error={
                                                        <div className="flex items-center justify-center h-96 bg-gray-50 rounded">
                                                            <div className="text-center">
                                                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                                                <p className="text-red-600 font-medium">Failed to load PDF</p>
                                                                <p className="text-sm text-gray-600 mt-1">{pdfError}</p>
                                            </div>
                                        </div>
                                                    }
                                                >
                                                    {/* Render all pages continuously */}
                                                    {renderedPages.map((pageNum) => (
                                                        <div 
                                                            key={pageNum} 
                                                            className="mb-2 bg-white shadow-md rounded overflow-hidden"
                                                            style={{
                                                                transform: `scale(${zoom / 100})`,
                                                                transformOrigin: 'top center',
                                                                width: 'fit-content'
                                                            }}
                                                        >
                                                            <Page 
                                                                pageNumber={pageNum}
                                                                renderTextLayer={true}
                                                                renderAnnotationLayer={true}
                                                                width={600}
                                                            />
                                                        </div>
                                                    ))}
                                                </Document>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p>No PDF available for this paper</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <ConversationMessaging 
                            messages={messages}
                            onRefresh={fetchMessages}
                        />
                    )}

                    {activeTab === 'reviewers' && (
                        <div className="bg-white rounded-lg shadow-md h-full min-h-screen flex flex-col">
                            {/* Header with Add Button */}
                            <div className="border-b border-gray-200 p-6 flex-shrink-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Manage Reviewers</h3>
                                    {!showCreateReviewer && (
                                        <button
                                            onClick={() => setShowCreateReviewer(true)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition shadow-md"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Add New Reviewer
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Create Reviewer Form - Inline */}
                            {showCreateReviewer && (
                                <div className="border-b border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 flex-shrink-0">
                                    <div className="max-w-2xl">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                                <UserPlus className="w-5 h-5 text-green-600" />
                                                Create New Reviewer
                                            </h4>
                                            <button
                                                onClick={() => {
                                                    setShowCreateReviewer(false);
                                                    setNewReviewer({ email: '', username: '', password: '' });
                                                }}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-6">
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
                                                <input
                                                    type="password"
                                                    value={newReviewer.password}
                                                    onChange={(e) => setNewReviewer({ ...newReviewer, password: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                                    placeholder="Strong password"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-600 mb-4 bg-white p-3 rounded border-l-4 border-blue-400">
                                            💡 The email address and password will be sent to the reviewer's email for login.
                                        </p>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleCreateReviewer}
                                                disabled={!newReviewer.email || !newReviewer.password}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 font-medium shadow-md"
                                            >
                                                <Check className="w-4 h-4" />
                                                Create & Send Credentials
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowCreateReviewer(false);
                                                    setNewReviewer({ email: '', username: '', password: '' });
                                                }}
                                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 font-medium"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Main Content */}
                            <div className="flex flex-1 overflow-hidden">
                                {/* Reviewers Filter Sidebar */}
                                <div className="w-1/3 border-r border-gray-200 overflow-hidden">
                                    <ReviewerFilterPanel
                                        reviewers={reviewers}
                                        selectedReviewer={selectedReviewerFilter}
                                        onFilterChange={setFilteredReviewers}
                                        onSelectReviewer={setSelectedReviewerFilter}
                                        onClearSearch={() => setFilteredReviewers(reviewers)}
                                    />
                                </div>

                            {/* Reviewers Content */}
                            <div className="w-2/3 p-6 overflow-y-auto space-y-6">
                                {selectedReviewerFilter ? (
                                    <div>
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                                {selectedReviewerFilter.name}
                                            </h3>
                                            <p className="text-gray-600">{selectedReviewerFilter.email}</p>
                                        </div>

                                        {/* Reviewer Stats */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400 shadow-sm">
                                                <p className="text-sm text-gray-600 font-medium">Assigned Papers</p>
                                                <p className="text-3xl font-bold text-blue-600 mt-1">{selectedReviewerFilter.assignedPapers || 0}</p>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400 shadow-sm">
                                                <p className="text-sm text-gray-600 font-medium">Completed</p>
                                                <p className="text-3xl font-bold text-green-600 mt-1">{selectedReviewerFilter.completedReviews || 0}</p>
                                            </div>
                                            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400 shadow-sm">
                                                <p className="text-sm text-gray-600 font-medium">Pending</p>
                                                <p className="text-3xl font-bold text-orange-600 mt-1">{selectedReviewerFilter.pendingReviews || 0}</p>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400 shadow-sm">
                                                <p className="text-sm text-gray-600 font-medium">Overdue</p>
                                                <p className="text-3xl font-bold text-red-600 mt-1">{selectedReviewerFilter.overdueReviews || 0}</p>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        {selectedReviewerFilter.averageRating && (
                                            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 shadow-sm">
                                                <p className="text-sm text-gray-600 font-medium">Average Rating</p>
                                                <p className="text-2xl font-bold text-yellow-600 mt-1">
                                                    {selectedReviewerFilter.averageRating.toFixed(1)} ⭐
                                                </p>
                                            </div>
                                        )}

                                        {/* Expertise */}
                                        {selectedReviewerFilter.expertise && selectedReviewerFilter.expertise.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-gray-800 mb-3">Areas of Expertise</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedReviewerFilter.expertise.map((exp: string, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                                                        >
                                                            {exp}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-500">
                                            <Users className="w-16 h-16 mx-auto mb-3 opacity-50" />
                                            <p>Select a reviewer to view details</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            </div>
                        </div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="space-y-6">
                                {/* Reviews List */}
                                {viewingReviewId ? (
                                    <ReviewerDetailsPanel
                                        reviewId={viewingReviewId}
                                        submissionId={viewingSubmissionId || ''}
                                        onClose={() => {
                                            setViewingReviewId(null);
                                            setViewingSubmissionId(null);
                                        }}
                                    />
                                ) : (
                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <MessageSquare className="w-6 h-6 text-blue-600" />
                                            All Submitted Reviews ({allReviews.length})
                                        </h3>

                                        {/* Search Bar */}
                                        <div className="mb-6">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by reviewer name, email, paper title, or submission ID..."
                                                    value={reviewSearchTerm}
                                                    onChange={(e) => setReviewSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                />
                                                {reviewSearchTerm && (
                                                    <button
                                                        onClick={() => setReviewSearchTerm('')}
                                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                                <Filter className="w-4 h-4" />
                                                {reviewSearchTerm ? (
                                                    <>
                                                        Found {allReviews.filter(review => {
                                                            const searchLower = reviewSearchTerm.toLowerCase();
                                                            const reviewerName = review.reviewer?.username?.toLowerCase() || '';
                                                            const reviewerEmail = review.reviewer?.email?.toLowerCase() || '';
                                                            const paperTitle = review.paperTitle?.toLowerCase() || '';
                                                            const submissionId = review.submissionId?.toLowerCase() || '';
                                                            return reviewerName.includes(searchLower) ||
                                                                   reviewerEmail.includes(searchLower) ||
                                                                   paperTitle.includes(searchLower) ||
                                                                   submissionId.includes(searchLower);
                                                        }).length} review(s) matching "{reviewSearchTerm}"
                                                    </>
                                                ) : (
                                                    `Showing all ${allReviews.length} review(s)`
                                                )}
                                            </p>
                                        </div>

                                        {allReviews.filter(review => {
                                            if (!reviewSearchTerm) return true;
                                            const searchLower = reviewSearchTerm.toLowerCase();
                                            const reviewerName = review.reviewer?.username?.toLowerCase() || '';
                                            const reviewerEmail = review.reviewer?.email?.toLowerCase() || '';
                                            const paperTitle = review.paperTitle?.toLowerCase() || '';
                                            const submissionId = review.submissionId?.toLowerCase() || '';
                                            return reviewerName.includes(searchLower) ||
                                                   reviewerEmail.includes(searchLower) ||
                                                   paperTitle.includes(searchLower) ||
                                                   submissionId.includes(searchLower);
                                        }).length > 0 ? (
                                            <div className="space-y-3">
                                                {allReviews.filter(review => {
                                                    if (!reviewSearchTerm) return true;
                                                    const searchLower = reviewSearchTerm.toLowerCase();
                                                    const reviewerName = review.reviewer?.username?.toLowerCase() || '';
                                                    const reviewerEmail = review.reviewer?.email?.toLowerCase() || '';
                                                    const paperTitle = review.paperTitle?.toLowerCase() || '';
                                                    const submissionId = review.submissionId?.toLowerCase() || '';
                                                    return reviewerName.includes(searchLower) ||
                                                           reviewerEmail.includes(searchLower) ||
                                                           paperTitle.includes(searchLower) ||
                                                           submissionId.includes(searchLower);
                                                }).map((review, index) => (
                                                    <div
                                                        key={index}
                                                        className="border rounded-lg p-4 hover:shadow-md transition bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer"
                                                        onClick={() => {
                                                            setViewingReviewId(review._id);
                                                            setViewingSubmissionId(review.submissionId);
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-800">
                                                                    Paper: {review.paperTitle || 'Unknown'}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    Submission ID: {review.submissionId}
                                                                </p>
                                                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                                                    <span className="text-sm">
                                                                        <strong>Reviewer:</strong> {review.reviewer?.username || 'Unknown'}
                                                                    </span>
                                                                    {review.reviewer?.email && (
                                                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                            📧 {review.reviewer.email}
                                                                        </span>
                                                                    )}
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                        review.recommendation === 'Accept' ? 'bg-green-200 text-green-800' :
                                                                        review.recommendation === 'Reject' ? 'bg-red-200 text-red-800' :
                                                                        review.recommendation === 'Major Revision' ? 'bg-yellow-200 text-yellow-800' :
                                                                        review.recommendation === 'Minor Revision' ? 'bg-orange-200 text-orange-800' :
                                                                        'bg-blue-200 text-blue-800'
                                                                    }`}>
                                                                        {review.recommendation}
                                                                    </span>
                                                                    <span className="text-sm">
                                                                        Rating: {'⭐'.repeat(review.overallRating || 0)} ({review.overallRating || 0}/5)
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    Submitted: {new Date(review.submittedAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                            <button
                                                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2 flex-shrink-0 ml-4"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                Show
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p>
                                                    {reviewSearchTerm 
                                                        ? `No reviews found matching "${reviewSearchTerm}"`
                                                        : 'No reviews submitted yet'
                                                    }
                                                </p>
                                                {reviewSearchTerm && (
                                                    <button
                                                        onClick={() => setReviewSearchTerm('')}
                                                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                                    >
                                                        Clear Search
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'pdfs' && (
                        <div className="h-full flex flex-col">
                            <PDFManagement />
                        </div>
                    )}

            {/* Paper Details Modal - Removed (now using side-by-side view instead) */}
                </div>
            </div>
        </div>
    );
};


export default EditorDashboard;
