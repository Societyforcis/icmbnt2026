import { useState, useEffect } from 'react';
import axios from 'axios';
import PageTransition from './PageTransition';
import {
    CheckCircle,
    FileText,
    MessageCircle,
    Send,
    ExternalLink,
    Search,
    ArrowLeft,
    History
} from 'lucide-react';

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

const AdminCopyrightManagement: React.FC = () => {
    const [copyrights, setCopyrights] = useState<CopyrightData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCopyright, setSelectedCopyright] = useState<CopyrightData | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [adminComment, setAdminComment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'review' | 'history'>('review');
    const [history, setHistory] = useState<any>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchAllCopyrights();
    }, []);

    const fetchPaperHistory = async (submissionId: string) => {
        setLoadingHistory(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/admin/papers/${submissionId}/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setHistory(response.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (selectedCopyright && activeTab === 'history') {
            fetchPaperHistory(selectedCopyright.submissionId);
        }
    }, [selectedCopyright, activeTab]);

    const fetchAllCopyrights = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/copyright/admin/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setCopyrights(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching copyright list:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedCopyright) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/copyright/message`, {
                copyrightId: selectedCopyright._id,
                message: messageInput
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const updatedMessages = response.data.data;
                const updatedCopyright = { ...selectedCopyright, messages: updatedMessages };
                setSelectedCopyright(updatedCopyright);
                setCopyrights(copyrights.map(c => c._id === selectedCopyright._id ? updatedCopyright : c));
                setMessageInput('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleReview = async (status: 'Approved' | 'Rejected') => {
        if (!selectedCopyright) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/copyright/admin/review`, {
                copyrightId: selectedCopyright._id,
                status,
                adminComment: adminComment || `Form ${status.toLowerCase()} by Admin.`
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const updatedCopyright = response.data.data;
                setSelectedCopyright(updatedCopyright);
                setCopyrights(copyrights.map(c => c._id === selectedCopyright._id ? updatedCopyright : c));
                setAdminComment('');
                alert(`Copyright form ${status.toLowerCase()} successfully!`);
            }
        } catch (error) {
            console.error('Error reviewing copyright:', error);
        }
    };

    const filteredCopyrights = copyrights.filter(c => {
        const titleMatch = c.paperTitle?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const authorMatch = c.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const idMatch = c.submissionId?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
        const matchesSearch = titleMatch || authorMatch || idMatch;
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Support panel</h1>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="w-full md:w-1/3 border-r bg-white flex flex-col h-full">
                        <div className="p-4 border-b space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by author, title, ID..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {['all', 'Pending', 'Submitted', 'Approved', 'Rejected'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${statusFilter === status ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y">
                            {filteredCopyrights.map(c => (
                                <div
                                    key={c._id}
                                    onClick={() => setSelectedCopyright(c)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition border-l-4 ${selectedCopyright?._id === c._id ? 'bg-blue-50 border-primary' : 'border-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold">{c.submissionId}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900 truncate">{c.authorName}</h3>
                                    <p className="text-xs text-gray-600 line-clamp-1">{c.paperTitle}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 bg-white flex flex-col relative">
                        {selectedCopyright ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="absolute top-4 right-4 flex bg-gray-100 p-1 rounded-lg z-10">
                                    <button
                                        onClick={() => setActiveTab('review')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'review' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Review
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                                    >
                                        History
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
                                    <div className="flex-1">
                                        {activeTab === 'review' ? (
                                            <div className="space-y-6">
                                                <h2 className="text-2xl font-bold text-gray-900">Review Details</h2>
                                                <div className="bg-gray-50 rounded-xl p-5 border space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="col-span-2">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Paper Title</p>
                                                            <p className="text-sm font-bold">{selectedCopyright.paperTitle}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Author</p>
                                                            <p className="text-sm">{selectedCopyright.authorName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                                                            <p className="text-sm font-bold text-primary">{selectedCopyright.status}</p>
                                                        </div>
                                                    </div>
                                                    {selectedCopyright.copyrightFormUrl && (
                                                        <a href={selectedCopyright.copyrightFormUrl} target="_blank" className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                                            <ExternalLink className="w-4 h-4" /> View PDF
                                                        </a>
                                                    )}
                                                </div>

                                                {selectedCopyright.status !== 'Approved' && (
                                                    <div className="space-y-4">
                                                        <h3 className="font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Decision</h3>
                                                        <textarea
                                                            className="w-full border rounded-xl p-4 text-sm"
                                                            rows={3}
                                                            placeholder="Comments..."
                                                            value={adminComment}
                                                            onChange={(e) => setAdminComment(e.target.value)}
                                                        />
                                                        <div className="flex gap-4">
                                                            <button onClick={() => handleReview('Approved')} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold">Approve</button>
                                                            <button onClick={() => handleReview('Rejected')} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold">Reject</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><History className="w-6 h-6" /> Timeline</h2>
                                                {loadingHistory ? <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div> : history?.timeline?.map((event: any, i: number) => (
                                                    <div key={i} className="flex gap-4 border-l-2 border-gray-100 pl-4 py-2 relative">
                                                        <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-primary"></div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-bold">{new Date(event.date).toLocaleString()}</p>
                                                            <p className="font-bold text-sm">{event.title}</p>
                                                            <p className="text-xs text-gray-600">{event.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full lg:w-80 flex flex-col border rounded-xl overflow-hidden bg-gray-50 h-[500px]">
                                        <div className="p-4 bg-white border-b font-bold flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Chat</div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {selectedCopyright.messages.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.sender === 'Admin' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-3 rounded-xl text-xs ${msg.sender === 'Admin' ? 'bg-primary text-white' : 'bg-white border'}`}>
                                                        <p>{msg.message}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-3 bg-white border-t flex gap-2">
                                            <input
                                                className="flex-1 border rounded-lg px-3 py-2 text-xs"
                                                placeholder="Message..."
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                            />
                                            <button onClick={handleSendMessage} className="bg-primary text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400"><FileText className="w-12 h-12 opacity-20" /></div>
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default AdminCopyrightManagement;
