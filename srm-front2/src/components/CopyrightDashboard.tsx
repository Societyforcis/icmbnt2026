import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from './PageTransition';
import {
    CheckCircle,
    FileText,
    MessageCircle,
    Send,
    Upload,
    AlertTriangle,
    Clock,
    User,
    Download,
    Loader2
} from 'lucide-react';
import AuthorSupportChat from './AuthorSupportChat';

interface Message {
    sender: 'Author' | 'Admin';
    message: string;
    timestamp: string;
}

interface CopyrightData {
    _id: string;
    paperId: string;
    submissionId: string;
    authorEmail: string;
    authorName: string;
    paperTitle: string;
    copyrightFormUrl: string | null;
    status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
    messages: Message[];
}

const CopyrightDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [eligible, setEligible] = useState(false);
    const [dashboardData, setDashboardData] = useState<{
        payment: any;
        paper: any;
        copyright: CopyrightData | null;
    } | null>(null);
    const [hasPaper, setHasPaper] = useState<boolean | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    // Final Selection & Document Upload states
    const [isFinalSelected, setIsFinalSelected] = useState(false);
    const [selectedUserData, setSelectedUserData] = useState<any>(null);
    const [isUploadingFinal, setIsUploadingFinal] = useState(false);
    const [finalDocFile, setFinalDocFile] = useState<File | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_URL}/api/copyright/author/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setHasPaper(response.data.hasPaper);
                setDashboardData(response.data.data || null);
                setEligible(true);
                // Also check selection status
                checkSelectionStatus();
            }
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            if (error.response?.status === 403) {
                setEligible(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !dashboardData || !dashboardData.copyright) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/copyright/message`, {
                copyrightId: dashboardData.copyright._id,
                message: messageInput
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && dashboardData && dashboardData.copyright) {
                setDashboardData({
                    ...dashboardData,
                    copyright: {
                        ...dashboardData.copyright,
                        messages: response.data.data
                    }
                });
                setMessageInput('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleFileUpload = async () => {
        if (!file || !dashboardData) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('token');

            // 1. Upload to Cloudinary (Simulated for this tool, assuming Cloudinary logic is handled elsewhere or via standard upload)
            // For now, I'll use a placeholder or assume the backend handles it.
            // Since I don't see a specific upload endpoint with Cloudinary in copyrightController, 
            // I'll simulate the upload and send the URL.

            const formData = new FormData();
            formData.append('file', file);

            // 2. Update backend (Backend now handles the Cloudinary upload securely)
            const response = await axios.post(`${API_URL}/api/copyright/author/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                setDashboardData({
                    ...dashboardData,
                    copyright: response.data.data
                });
                setFile(null);
                alert('Copyright form uploaded successfully!');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
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
                console.log('Final selection data loaded:', response.data.selectedUser);
            }
        } catch (error) {
            console.error('Error checking selection status:', error);
        }
    };

    const handleFinalDocUpload = async () => {
        console.log('handleFinalDocUpload called');
        console.log('finalDocFile:', finalDocFile);
        console.log('dashboardData.paper:', dashboardData?.paper);

        if (!finalDocFile || !dashboardData?.paper?.submissionId) {
            alert('Please select a document first or submission info missing.');
            return;
        }

        const allowedTypes = [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/pdf'
        ];

        const fileName = finalDocFile.name.toLowerCase();
        const isWordDoc = allowedTypes.includes(finalDocFile.type) ||
            fileName.endsWith('.doc') ||
            fileName.endsWith('.docx');

        console.log('Validating file:', fileName, 'Type:', finalDocFile.type);

        if (!isWordDoc) {
            alert('Please upload a Microsoft Word (.doc, .docx) file.');
            return;
        }

        console.log('Validation passed, starting upload...');
        setIsUploadingFinal(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('finalDoc', finalDocFile);

            const targetUrl = `${API_URL}/api/papers/upload-final-doc/${dashboardData.paper.submissionId}`;
            console.log('Final upload URL:', targetUrl);

            const response = await axios.post(
                targetUrl,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            console.log('Upload response status:', response.status);
            console.log('Upload response data:', response.data);

            if (response.data.success) {
                console.log('Upload successful, updating state...');
                // Use the returned user object or update manually
                if (response.data.selectedUser) {
                    setSelectedUserData(response.data.selectedUser);
                } else {
                    setSelectedUserData((prev: any) => ({
                        ...prev,
                        finalDocUrl: response.data.finalDocUrl,
                        status: 'Final Version Submitted'
                    }));
                }
                setFinalDocFile(null);
                alert('Final document uploaded successfully! You can see it in your dashboard.');
            }
        } catch (error: any) {
            console.error('--- UPLOAD FAILED ---');
            console.error('Error message:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
                alert(`Upload failed: ${error.response.data.message || 'Server error'}`);
            } else if (error.request) {
                console.error('No response received from server');
                alert('No response from server. Check if backend is running.');
            } else {
                console.error('Error setting up request:', error.message);
                alert(`Error: ${error.message}`);
            }
        } finally {
            setIsUploadingFinal(false);
            console.log('--- UPLOAD PROCESS ENDED ---');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-gray-500 font-medium tracking-wide">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!eligible && hasPaper !== false) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-red-500">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                        <p className="text-gray-600 mb-6">
                            There was an error accessing your dashboard. Please try again later.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition"
                        >
                            Return to Main Dashboard
                        </button>
                    </div>
                </div>
            </PageTransition>
        );
    }

    // 1. Case: No paper submitted
    if (hasPaper === false) {
        return (
            <PageTransition>
                <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="bg-white rounded-2xl shadow-xl p-10 border-t-8 border-primary">
                            <FileText className="w-20 h-20 text-blue-200 mx-auto mb-6" />
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-4">No Paper Submission Found</h1>
                            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                                You haven't submitted any research papers yet. To access the copyright dashboard and other features, please submit your paper first.
                            </p>
                            <button
                                onClick={() => navigate('/paper-submission')}
                                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg transform hover:-translate-y-1"
                            >
                                <Upload className="w-5 h-5" /> Submit Research Paper
                            </button>

                            <div className="mt-12 text-left">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Need Help?</h3>
                                <p className="text-gray-500 text-sm mb-6">Contact the administration team if you have issues with submission or registration.</p>
                                <AuthorSupportChat />
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    const paper = dashboardData?.paper;
    const copyright = dashboardData?.copyright;

    // 2. Case: Paper submitted but not accepted or revised submitted
    if (paper && paper.status !== 'Accepted' && paper.status !== 'Published' && paper.status !== 'Revised Submitted') {
        return (
            <PageTransition>
                <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-gradient-to-r from-blue-900 to-primary p-8 text-white relative">
                                <h1 className="text-3xl font-bold mb-2">Submission Status</h1>
                                <p className="opacity-80">Track your research paper evaluation progress.</p>
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block opacity-20">
                                    <Clock className="w-24 h-24" />
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex flex-col md:flex-row items-center gap-6 mb-10 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="bg-white p-4 rounded-full shadow-sm">
                                        <Clock className="w-10 h-10 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-1">Current Status</p>
                                        <h2 className={`text-2xl font-black ${paper.status === 'Rejected' ? 'text-red-600' : 'text-primary'
                                            }`}>
                                            {paper.status}
                                        </h2>
                                    </div>
                                    <div className="md:ml-auto">
                                        <button
                                            onClick={() => navigate('/paper-submission')}
                                            className="text-primary hover:underline font-bold"
                                        >
                                            View Submission Details
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="p-6 bg-gray-50 rounded-xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Paper Title</p>
                                        <p className="text-lg font-bold text-gray-800">{paper.paperTitle}</p>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-xl">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Submission ID</p>
                                        <p className="text-lg font-mono font-bold text-gray-800">{paper.submissionId}</p>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl">
                                    <div className="flex gap-4">
                                        <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                                        <p className="text-yellow-800">
                                            <strong>Copyright submission is not yet available.</strong> Your paper is currently being processed. Once it is accepted by the review committee, you will be notified to upload the signed copyright form here.
                                        </p>
                                    </div>
                                </div>

                                <AuthorSupportChat />
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        );
    }

    // 3. Case: Paper Accepted (Show copyright dashboard)
    if (!paper || !copyright) return null;

    return (
        <PageTransition>
            <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between border-l-4 border-primary">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Author Dashboard</h1>
                            <p className="text-gray-600 mt-1">Manage your copyright submission and communicate with admins.</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Status:</span>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${copyright.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                                copyright.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                                    copyright.status === 'Submitted' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}>
                                {copyright.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content: Upload & Info */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Paper Info Card */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-900 to-primary p-4">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5" /> Paper Information
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Paper Title</p>
                                        <p className="text-lg font-bold text-gray-900">{copyright.paperTitle}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Submission ID</p>
                                        <p className="text-lg font-bold text-gray-900">{copyright.submissionId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Author Name</p>
                                        <p className="text-lg font-bold text-gray-900">{copyright.authorName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Contact Email</p>
                                        <p className="text-lg font-bold text-gray-900">{copyright.authorEmail}</p>
                                    </div>
                                    {paper?.pdfUrl && (
                                        <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100 flex justify-between items-center">
                                            <p className="text-sm font-medium text-gray-500">Submitted Manuscript</p>
                                            <a
                                                href={paper.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-primary font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded-lg transition"
                                            >
                                                <FileText className="w-4 h-4" /> View Paper
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Final Selected Next Steps - Show if author is selected for conference publication */}
                            {isFinalSelected && (
                                <div className="bg-white shadow-lg rounded-xl overflow-hidden border-2 border-green-500 animate__animated animate__fadeIn">
                                    <div className="bg-green-600 p-4 text-white flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 p-2 rounded-lg">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold">Congratulations!</h3>
                                                <p className="text-sm opacity-90 font-medium">Your paper is selected for ICBNT 2026 Conference Publication</p>
                                            </div>
                                        </div>
                                        <div className="hidden md:block">
                                            <span className="bg-green-700/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">Final Selection</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <span className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                                    Submit Final Camera-Ready Paper
                                                </h4>
                                                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                                    Please upload the final version of your paper (Camera-Ready version) in <strong>.doc / .docx</strong> format. Ensure all reviewer comments have been addressed and the format strictly follows the conference guidelines.
                                                </p>

                                                {!selectedUserData?.finalDocUrl ? (
                                                    <div className="space-y-4">
                                                        <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-green-500 transition-colors bg-gray-50/50">
                                                            <div className="flex flex-col items-center text-center pointer-events-none">
                                                                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                                                                <p className="text-sm font-bold text-gray-700">
                                                                    {finalDocFile ? finalDocFile.name : "Select Word file (.doc, .docx)"}
                                                                </p>
                                                                <p className="text-xs text-gray-500">Max size 25MB</p>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                onChange={(e) => {
                                                                    const selectedFile = e.target.files?.[0] || null;
                                                                    console.log('File selected for upload:', selectedFile);
                                                                    setFinalDocFile(selectedFile);
                                                                }}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                                                accept=".doc,.docx"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={handleFinalDocUpload}
                                                            disabled={isUploadingFinal || !finalDocFile}
                                                            className="w-full py-4 bg-green-600 text-white rounded-xl font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:bg-gray-300 disabled:shadow-none"
                                                        >
                                                            {isUploadingFinal ? (
                                                                <>
                                                                    <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></div>
                                                                    Uploading Final Document...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="w-5 h-5" />
                                                                    Upload Final Version
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="bg-green-100 p-2 rounded-lg">
                                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-green-800 font-bold">Final Doc Uploaded</p>
                                                                <p className="text-xs text-green-600">Successfully submitted for review</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex bg-white rounded-lg p-3 border border-green-100 justify-between items-center mb-4">
                                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">Camera-Ready-Paper.docx</span>
                                                            <a
                                                                href={selectedUserData.finalDocUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary hover:underline text-sm font-bold flex items-center gap-2"
                                                            >
                                                                <Download className="w-4 h-4" /> View
                                                            </a>
                                                        </div>

                                                        <div className="pt-4 border-t border-green-100">
                                                            <p className="text-xs text-gray-500 mb-2">Want to update the file?</p>
                                                            <div className="relative border border-dashed border-green-300 rounded-lg p-3 bg-white mb-3 text-center cursor-pointer hover:bg-green-50 transition">
                                                                <div className="flex flex-col items-center pointer-events-none">
                                                                    <p className="text-xs font-bold text-green-700 flex items-center justify-center gap-2">
                                                                        <Upload className="w-3 h-3" />
                                                                        {finalDocFile ? finalDocFile.name : "Select new version (.doc, .docx)"}
                                                                    </p>
                                                                </div>
                                                                <input
                                                                    type="file"
                                                                    onChange={(e) => {
                                                                        const selectedFile = e.target.files?.[0] || null;
                                                                        console.log('Update file selected:', selectedFile);
                                                                        setFinalDocFile(selectedFile);
                                                                    }}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                                                                    accept=".doc,.docx"
                                                                />
                                                            </div>

                                                            {finalDocFile && (
                                                                <button
                                                                    onClick={handleFinalDocUpload}
                                                                    disabled={isUploadingFinal}
                                                                    className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-black shadow-md hover:bg-green-700 transition flex items-center justify-center gap-2"
                                                                >
                                                                    {isUploadingFinal ? (
                                                                        <Loader2 className="animate-spin w-4 h-4" />
                                                                    ) : (
                                                                        <Send className="w-4 h-4" />
                                                                    )}
                                                                    Confirm & Re-upload
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 h-full flex flex-col justify-center">
                                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                                    Next Steps
                                                </h4>
                                                <ul className="space-y-4">
                                                    <li className="flex gap-3">
                                                        <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <CheckCircle className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                        <p className="text-xs text-gray-600"><strong className="text-gray-900">Final Review:</strong> Our editorial team will perform a final check on your camera-ready paper format.</p>
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <CheckCircle className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                        <p className="text-xs text-gray-600"><strong className="text-gray-900">Registration:</strong> Ensure your conference registration is complete if not already done.</p>
                                                    </li>
                                                    <li className="flex gap-3">
                                                        <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <CheckCircle className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                        <p className="text-xs text-gray-600"><strong className="text-gray-900">Presentation:</strong> You will receive details about the oral/poster presentation schedule soon.</p>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Upload Section */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-900 to-primary p-4 text-white font-semibold flex items-center gap-2">
                                    <Upload className="w-5 h-5" /> Copyright Form Submission
                                </div>
                                <div className="p-6 text-center">
                                    {copyright.status === 'Approved' ? (
                                        <div className="py-12 flex flex-col items-center">
                                            <div className="bg-green-100 p-6 rounded-full mb-6 animate-bounce">
                                                <CheckCircle className="w-16 h-16 text-green-600" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Copyright Process Done</h3>
                                            <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed px-4">
                                                Soon we will inform you for the presentation, venue and time on conference.
                                                <br />
                                                <span className="font-bold text-primary italic mt-4 block">All the best!</span>
                                            </p>
                                            <div className="flex flex-wrap justify-center gap-4 mt-8">
                                                {copyright.copyrightFormUrl && (
                                                    <a
                                                        href={copyright.copyrightFormUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg hover:scale-105 active:scale-95"
                                                    >
                                                        <Download className="w-5 h-5" /> View Final Form
                                                    </a>
                                                )}
                                                {paper?.pdfUrl && (
                                                    <a
                                                        href={paper.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:scale-105 active:scale-95"
                                                    >
                                                        <FileText className="w-5 h-5" /> View Final Paper
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {copyright.copyrightFormUrl ? (
                                                <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg inline-flex items-center gap-3">
                                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                                    <div className="text-left">
                                                        <p className="text-green-800 font-bold">Form Already Submitted</p>
                                                        <a
                                                            href={copyright.copyrightFormUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline text-sm flex items-center gap-1 font-medium"
                                                        >
                                                            <Download className="w-4 h-4" /> View Submitted Form
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg inline-flex items-center gap-3">
                                                    <Clock className="w-6 h-6 text-yellow-500" />
                                                    <div className="text-left">
                                                        <p className="text-yellow-800 font-bold">Pending Submission</p>
                                                        <p className="text-sm text-yellow-700">Please sign the copyright form and upload it here.</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 max-w-lg mx-auto border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-primary transition cursor-pointer group relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                    accept=".pdf,.doc,.docx"
                                                />
                                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4 group-hover:text-primary transition" />
                                                <p className="text-gray-700 font-semibold">{file ? file.name : 'Click or Drag form here to upload'}</p>
                                                <p className="text-gray-500 text-xs mt-2">Accepted formats: PDF, DOCX (Max 10MB)</p>
                                            </div>

                                            {file && (
                                                <button
                                                    onClick={handleFileUpload}
                                                    disabled={uploading}
                                                    className="mt-6 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg flex items-center gap-2 mx-auto"
                                                >
                                                    {uploading ? (
                                                        <>
                                                            <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-5 h-5" /> Submit Copyright Form
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {copyright.status === 'Rejected' && (
                                                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                                                    <p className="text-red-700 font-bold flex items-center justify-center gap-2">
                                                        <AlertTriangle className="w-5 h-5" /> Re-upload required due to mistakes.
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Communication */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[700px]">
                            <div className="bg-gradient-to-r from-blue-900 to-primary p-4 text-white font-semibold flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" /> Communication View
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {copyright.messages.length === 0 ? (
                                    <div className="text-center py-20 opacity-40">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                                        <p>No messages yet.<br />Start communication with admin.</p>
                                    </div>
                                ) : (
                                    copyright.messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.sender === 'Author' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.sender === 'Author'
                                                ? 'bg-primary text-white rounded-tr-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                                }`}>
                                                <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                                    <User className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{msg.sender}</span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                <p className={`text-[9px] mt-1.5 text-right font-medium opacity-60`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t bg-white">
                                <div className="flex gap-2">
                                    <textarea
                                        placeholder="Type your message here..."
                                        rows={2}
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        className="flex-1 border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim()}
                                        className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50 h-fit self-end shadow-md"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default CopyrightDashboard;
