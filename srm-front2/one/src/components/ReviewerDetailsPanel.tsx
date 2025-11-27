import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Send, X, Loader } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ReviewDetail {
    _id: string;
    comments: string;
    strengths: string;
    weaknesses: string;
    overallRating: number;
    noveltyRating?: number;
    qualityRating?: number;
    clarityRating?: number;
    recommendation: string;
    submittedAt: string;
    reviewer?: {
        username: string;
        email: string;
    };
}

interface Message {
    sender: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    message: string;
    createdAt: string;
}

interface ReviewerDetailsProps {
    reviewId: string;
    submissionId: string;
    onClose: () => void;
}

const ReviewerDetailsPanel: React.FC<ReviewerDetailsProps> = ({
    reviewId,
    submissionId,
    onClose
}) => {
    const [review, setReview] = useState<ReviewDetail | null>(null);
    const [messageThread, setMessageThread] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [selectedRecipient, setSelectedRecipient] = useState<'reviewer' | 'author'>('reviewer');
    const [activeTab, setActiveTab] = useState<'review' | 'messages'>('review');

    useEffect(() => {
        fetchReviewDetails();
        fetchMessages();
    }, [reviewId, submissionId]);

    const fetchReviewDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/editor/review/${reviewId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setReview(response.data.review);
        } catch (error: any) {
            console.error('Error fetching review:', error);
            Swal.fire('Error', 'Failed to load review details', 'error');
        }
    };

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/editor/messages/${submissionId}/${reviewId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setMessageThread(response.data.messageThread);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) {
            Swal.fire('Warning', 'Please enter a message', 'warning');
            return;
        }

        setSendingMessage(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/editor/send-message`,
                {
                    submissionId,
                    reviewId,
                    recipientType: selectedRecipient,
                    message: messageText
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setMessageText('');
            await fetchMessages(); // Refresh messages
            Swal.fire('Success', `Message sent to ${selectedRecipient}`, 'success');
        } catch (error: any) {
            console.error('Error sending message:', error);
            Swal.fire('Error', 'Failed to send message', 'error');
        } finally {
            setSendingMessage(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-96">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="text-xl font-semibold text-gray-800">Reviewer Details & Communication</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded transition"
                >
                    <X className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('review')}
                    className={`px-4 py-2 font-medium transition ${
                        activeTab === 'review'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    📋 Review Details
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
                        activeTab === 'messages'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Messages
                </button>
            </div>

            {/* Review Details Tab */}
            {activeTab === 'review' && review && (
                <div className="space-y-6">
                    {/* Reviewer Information */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Reviewer Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Name</p>
                                <p className="text-gray-800">{review.reviewer?.username || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Email</p>
                                <p className="text-gray-800 break-all">{review.reviewer?.email || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Submitted On</p>
                                <p className="text-gray-800">{new Date(review.submittedAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Recommendation</p>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    review.recommendation === 'Accept' ? 'bg-green-200 text-green-800' :
                                    review.recommendation === 'Reject' ? 'bg-red-200 text-red-800' :
                                    review.recommendation === 'Major Revision' ? 'bg-yellow-200 text-yellow-800' :
                                    review.recommendation === 'Minor Revision' ? 'bg-orange-200 text-orange-800' :
                                    'bg-blue-200 text-blue-800'
                                }`}>
                                    {review.recommendation}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ratings */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-gray-800 mb-3">Ratings</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 font-medium mb-2">Overall</p>
                                <div className="flex justify-center">
                                    {'⭐'.repeat(review.overallRating || 0)}
                                </div>
                                <p className="text-lg font-bold text-gray-800 mt-1">{review.overallRating || 0}/5</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 font-medium mb-2">Novelty</p>
                                <div className="flex justify-center">
                                    {'⭐'.repeat(review.noveltyRating || 0)}
                                </div>
                                <p className="text-lg font-bold text-gray-800 mt-1">{review.noveltyRating || 0}/5</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 font-medium mb-2">Quality</p>
                                <div className="flex justify-center">
                                    {'⭐'.repeat(review.qualityRating || 0)}
                                </div>
                                <p className="text-lg font-bold text-gray-800 mt-1">{review.qualityRating || 0}/5</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 font-medium mb-2">Clarity</p>
                                <div className="flex justify-center">
                                    {'⭐'.repeat(review.clarityRating || 0)}
                                </div>
                                <p className="text-lg font-bold text-gray-800 mt-1">{review.clarityRating || 0}/5</p>
                            </div>
                        </div>
                    </div>

                    {/* Review Comments */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-gray-800 mb-2">Comments</h4>
                        <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{review.comments}</p>
                    </div>

                    {/* Strengths */}
                    {review.strengths && (
                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
                            <h4 className="font-semibold text-gray-800 mb-2">✓ Strengths</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{review.strengths}</p>
                        </div>
                    )}

                    {/* Weaknesses */}
                    {review.weaknesses && (
                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-gray-800 mb-2">✗ Weaknesses</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded border">{review.weaknesses}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <div className="space-y-4">
                    {/* Message Thread */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto space-y-3">
                        {messageThread?.conversation && messageThread.conversation.length > 0 ? (
                            messageThread.conversation.map((msg: Message, index: number) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg ${
                                        msg.sender === 'editor'
                                            ? 'bg-blue-100 border-l-4 border-blue-600 ml-4'
                                            : msg.sender === 'reviewer'
                                            ? 'bg-green-100 border-l-4 border-green-600 mr-4'
                                            : 'bg-orange-100 border-l-4 border-orange-600 mr-4'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="font-semibold text-sm text-gray-800">
                                            {msg.sender === 'editor' ? '📝 Editor' : msg.sender === 'reviewer' ? '👁️ Reviewer' : '✍️ Author'}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{msg.senderName} ({msg.senderEmail})</p>
                                    <p className="text-gray-800">{msg.message}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No messages yet. Start a conversation!</p>
                            </div>
                        )}
                    </div>

                    {/* Message Input */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Send Reply To</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recipient"
                                        value="reviewer"
                                        checked={selectedRecipient === 'reviewer'}
                                        onChange={(e) => setSelectedRecipient(e.target.value as 'reviewer' | 'author')}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700">👁️ Reviewer</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="recipient"
                                        value="author"
                                        checked={selectedRecipient === 'author'}
                                        onChange={(e) => setSelectedRecipient(e.target.value as 'reviewer' | 'author')}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700">✍️ Author</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder={`Type your message to ${selectedRecipient}...`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                            />
                        </div>

                        <button
                            onClick={handleSendMessage}
                            disabled={sendingMessage || !messageText.trim()}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2"
                        >
                            {sendingMessage ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Send to {selectedRecipient === 'reviewer' ? 'Reviewer' : 'Author'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewerDetailsPanel;
