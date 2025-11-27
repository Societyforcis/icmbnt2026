import React, { useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ConversationMessagingProps {
    messages: any[];
    onRefresh?: () => void;
}

const ConversationMessaging: React.FC<ConversationMessagingProps> = ({ messages = [], onRefresh }) => {
    const [view, setView] = useState<'filter' | 'list' | 'conversation'>('filter');
    const [filterType, setFilterType] = useState<'reviewer' | 'author'>('reviewer');
    const [selectedPerson, setSelectedPerson] = useState<any | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Organize messages by participant type and email
    const getUniqueParticipants = (type: 'reviewer' | 'author') => {
        const participants = new Map();

        messages.forEach((msg: any) => {
            if (type === 'reviewer') {
                const key = msg.reviewerEmail;
                if (!participants.has(key)) {
                    participants.set(key, {
                        email: msg.reviewerEmail,
                        name: msg.reviewerName,
                        submissionId: msg.submissionId,
                        paperTitle: msg.paperTitle,
                        lastMessage: msg.conversation?.[msg.conversation.length - 1]?.message || 'No messages',
                        lastMessageTime: msg.conversation?.[msg.conversation.length - 1]?.createdAt,
                        totalMessages: msg.conversation?.length || 0,
                    });
                }
            } else {
                const key = msg.authorEmail;
                if (!participants.has(key)) {
                    participants.set(key, {
                        email: msg.authorEmail,
                        name: msg.authorName,
                        submissionId: msg.submissionId,
                        paperTitle: msg.paperTitle,
                        lastMessage: msg.conversation?.[msg.conversation.length - 1]?.message || 'No messages',
                        lastMessageTime: msg.conversation?.[msg.conversation.length - 1]?.createdAt,
                        totalMessages: msg.conversation?.length || 0,
                    });
                }
            }
        });

        return Array.from(participants.values());
    };

    const participants = getUniqueParticipants(filterType);

    const handleSelectPerson = (person: any) => {
        setSelectedPerson(person);
        setView('conversation');
        setNewMessage('');
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        if (!selectedPerson) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const relatedMessage = messages.find(
                (msg: any) =>
                    (filterType === 'reviewer' && msg.reviewerEmail === selectedPerson.email) ||
                    (filterType === 'author' && msg.authorEmail === selectedPerson.email)
            );

            if (!relatedMessage) throw new Error('Cannot find related message');

            await axios.post(
                `${API_URL}/api/editor/send-message`,
                {
                    submissionId: selectedPerson.submissionId,
                    reviewId: relatedMessage._id,
                    recipientType: filterType,
                    recipientEmail: selectedPerson.email,
                    message: newMessage,
                    isTemplate: false,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setNewMessage('');
            if (onRefresh) {
                onRefresh();
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    // FILTER VIEW - Choose Reviewers or Authors
    if (view === 'filter') {
        const reviewerCount = getUniqueParticipants('reviewer').length;
        const authorCount = getUniqueParticipants('author').length;
        
        return (
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-lg shadow-lg h-full min-h-screen flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-t-lg shadow-md">
                    <h2 className="text-4xl font-bold mb-2">💬 Messages Center</h2>
                    <p className="text-blue-100 text-base">Communicate with reviewers and authors about their submissions</p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-12">
                    {reviewerCount === 0 && authorCount === 0 ? (
                        <div className="text-center">
                            <MessageSquare className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                            <p className="text-xl text-gray-500 font-semibold">No messages yet</p>
                            <p className="text-gray-400 mt-2">Once you assign reviewers, you can start messaging</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl">
                            <p className="text-gray-700 text-center mb-10 font-semibold text-lg">Select a category to view conversations:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Reviewers Card */}
                                <button
                                    onClick={() => {
                                        setFilterType('reviewer');
                                        setView('list');
                                    }}
                                    className="group p-8 bg-white border-3 border-blue-200 rounded-xl hover:border-blue-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer text-center"
                                >
                                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📋</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Reviewers</h3>
                                    <div className="bg-blue-100 text-blue-700 rounded-full py-2 px-4 inline-block mb-3 font-semibold text-lg">
                                        {reviewerCount} {reviewerCount === 1 ? 'reviewer' : 'reviewers'}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4">Send messages and updates to your assigned reviewers</p>
                                    <span className="text-blue-600 font-bold text-base group-hover:text-blue-800">View conversations →</span>
                                </button>

                                {/* Authors Card */}
                                <button
                                    onClick={() => {
                                        setFilterType('author');
                                        setView('list');
                                    }}
                                    className="group p-8 bg-white border-3 border-blue-200 rounded-xl hover:border-blue-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer text-center"
                                >
                                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👤</div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Authors</h3>
                                    <div className="bg-blue-100 text-blue-700 rounded-full py-2 px-4 inline-block mb-3 font-semibold text-lg">
                                        {authorCount} {authorCount === 1 ? 'author' : 'authors'}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4">Communicate with paper authors about submissions</p>
                                    <span className="text-blue-600 font-bold text-base group-hover:text-blue-800">View conversations →</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // LIST VIEW - Show participants with Gmail
    if (view === 'list') {
        return (
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-lg shadow-lg h-full min-h-screen flex flex-col">
                {/* Header with Back Button */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg shadow-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                setView('filter');
                                setFilterType('reviewer');
                            }}
                            className="hover:bg-blue-700 p-2 rounded-lg transition duration-200 hover:shadow-lg"
                        >
                            <ArrowLeft className="w-7 h-7" />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold">
                                {filterType === 'reviewer' ? '📋 Reviewers' : '👤 Authors'}
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">
                                Click on any {filterType} to open conversation
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold">{participants.length}</div>
                            <p className="text-blue-100 text-xs">{filterType}s</p>
                        </div>
                    </div>
                </div>

                {/* Participants List - Vertical Stack */}
                <div className="flex-1 overflow-y-auto p-6">
                    {participants.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                                <p className="text-xl text-gray-600 font-semibold">No {filterType}s to message yet</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-4xl">
                            {participants.map((person, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectPerson(person)}
                                    className="w-full p-5 border-2 border-blue-200 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:border-blue-500 hover:shadow-md transition-all duration-200 text-left group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-700 transition">{person.name}</h3>
                                            <p className="text-sm text-gray-600 font-mono mt-1">📧 {person.email}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 ml-4">
                                            <span className="px-4 py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap border border-blue-200">
                                                {person.totalMessages} messages
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">📄</span>
                                        <p className="text-sm text-gray-700 font-semibold">{person.paperTitle}</p>
                                    </div>
                                    <div className="bg-gray-100 p-3 rounded-lg">
                                        <p className="text-sm text-gray-700 italic line-clamp-2">"{person.lastMessage}"</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // CONVERSATION VIEW - Full chat thread
    if (view === 'conversation' && selectedPerson) {
        const conversation = messages.find(
            (msg: any) =>
                (filterType === 'reviewer' && msg.reviewerEmail === selectedPerson.email) ||
                (filterType === 'author' && msg.authorEmail === selectedPerson.email)
        );

        return (
            <div className="bg-white rounded-lg shadow-lg h-full min-h-screen flex flex-col">
                {/* Header with Blue Background */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b-4 border-blue-800 rounded-t-lg shadow-lg">
                    <div className="flex items-center gap-4 mb-5">
                        <button
                            onClick={() => {
                                setView('list');
                                setSelectedPerson(null);
                            }}
                            className="hover:bg-blue-700 p-2 rounded-lg transition duration-200 hover:shadow-lg"
                        >
                            <ArrowLeft className="w-7 h-7" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-3xl font-bold truncate">{selectedPerson.name}</h2>
                            <p className="text-blue-100 text-sm font-mono mt-1">📧 {selectedPerson.email}</p>
                        </div>
                    </div>

                    {/* Paper Info Section - Enhanced */}
                    <div className="bg-blue-700 bg-opacity-60 p-4 rounded-lg border-2 border-blue-400 shadow-md">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">📄</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-blue-100 font-semibold mb-1">PAPER SUBMISSION ID: {selectedPerson.submissionId}</p>
                                <p className="font-bold text-lg text-white truncate">{selectedPerson.paperTitle}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversation Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-gray-50">
                    {conversation?.conversation && conversation.conversation.length > 0 ? (
                        conversation.conversation.map((msg: any, idx: number) => (
                            <div
                                key={idx}
                                className={`flex ${
                                    msg.sender === 'editor' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                <div
                                    className={`max-w-sm lg:max-w-md px-5 py-4 rounded-2xl shadow-sm ${
                                        msg.sender === 'editor'
                                            ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white rounded-br-none border border-blue-700'
                                            : 'bg-white text-gray-800 rounded-bl-none border-2 border-gray-200'
                                    }`}
                                >
                                    <p className={`text-xs font-bold mb-2 opacity-85 ${
                                        msg.sender === 'editor' ? 'text-blue-100' : 'text-gray-600'
                                    }`}>
                                        {msg.sender === 'editor'
                                            ? '✎ YOU (Editor)'
                                            : filterType === 'reviewer'
                                            ? '📋 REVIEWER'
                                            : '👤 AUTHOR'}
                                    </p>
                                    <p className="text-base break-words leading-relaxed font-medium">{msg.message}</p>
                                    <p
                                        className={`text-xs mt-3 font-semibold ${
                                            msg.sender === 'editor' ? 'text-blue-200' : 'text-gray-500'
                                        }`}
                                    >
                                        {new Date(msg.createdAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                                <p className="text-lg text-gray-600 font-semibold">No messages yet</p>
                                <p className="text-gray-500 mt-1">Start the conversation by typing a message below</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Message Input */}
                <div className="border-t-4 border-gray-200 p-6 bg-gradient-to-t from-blue-50 to-white rounded-b-lg shadow-xl">
                    <div className="flex gap-3 items-end">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey && !sending) {
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Type your message here... (Ctrl+Enter to send)"
                            rows={3}
                            className="flex-1 px-5 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none shadow-sm transition-all"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="px-7 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-bold shadow-md"
                        >
                            <Send className="w-5 h-5" />
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default ConversationMessaging;
