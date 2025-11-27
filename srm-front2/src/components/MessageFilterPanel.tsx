import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Message {
    _id: string;
    submissionId: string;
    paperTitle: string;
    reviewerName: string;
    reviewerEmail: string;
    authorName: string;
    authorEmail: string;
    editorId: string;
    lastMessageAt: Date;
    conversation?: Array<{
        sender: 'editor' | 'reviewer' | 'author';
        senderId: string;
        message: string;
        createdAt: Date;
    }>;
}

interface MessageFilterPanelProps {
    messages: Message[];
    selectedMessage: Message | null;
    onFilterChange: (filtered: Message[]) => void;
    onSelectMessage: (message: Message) => void;
    onClearSearch: () => void;
}

const MessageFilterPanel: React.FC<MessageFilterPanelProps> = ({
    messages,
    selectedMessage,
    onFilterChange,
    onSelectMessage,
    onClearSearch
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

    // Filtering and sorting logic
    const filteredMessages = useMemo(() => {
        let result = [...messages];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(msg => 
                msg.paperTitle?.toLowerCase().includes(query) ||
                msg.reviewerEmail?.toLowerCase().includes(query) ||
                msg.reviewerName?.toLowerCase().includes(query) ||
                msg.authorEmail?.toLowerCase().includes(query) ||
                msg.authorName?.toLowerCase().includes(query) ||
                msg.submissionId?.toLowerCase().includes(query)
            );
        }

        // Sorting
        result.sort((a, b) => {
            const dateA = new Date(a.lastMessageAt).getTime();
            const dateB = new Date(b.lastMessageAt).getTime();
            return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [messages, searchQuery, sortBy]);

    // Update parent with filtered messages
    React.useEffect(() => {
        onFilterChange(filteredMessages);
    }, [filteredMessages, onFilterChange]);

    // Statistics
    const stats = useMemo(() => {
        const unreadCount = messages.filter(msg =>
            msg.conversation?.some(c => c.sender === 'reviewer' && !msg.conversation?.some(x => x.sender === 'editor'))
        ).length;

        const reviewerMessagesCount = messages.filter(msg =>
            msg.conversation?.some(c => c.sender === 'reviewer')
        ).length;

        const authorMessagesCount = messages.filter(msg =>
            msg.conversation?.some(c => c.sender === 'author')
        ).length;

        const repliedCount = messages.filter(msg =>
            msg.conversation?.some(c => c.sender === 'editor')
        ).length;

        return {
            total: messages.length,
            unread: unreadCount,
            reviewerMessages: reviewerMessagesCount,
            authorMessages: authorMessagesCount,
            replied: repliedCount
        };
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Messages ({filteredMessages.length})
                </h3>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search papers, reviewers, authors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                onClearSearch();
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Sort Options */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Sort:</span>
                <button
                    onClick={() => setSortBy('recent')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        sortBy === 'recent'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Recent
                </button>
                <button
                    onClick={() => setSortBy('oldest')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        sortBy === 'oldest'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Oldest
                </button>
            </div>

            {/* Statistics */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                        <div className="font-bold text-blue-700">{stats.unread}</div>
                        <div className="text-gray-600">Unread</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-purple-700">{stats.reviewerMessages}</div>
                        <div className="text-gray-600">From Reviewers</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-green-700">{stats.authorMessages}</div>
                        <div className="text-gray-600">From Authors</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-orange-700">{stats.replied}</div>
                        <div className="text-gray-600">Replied</div>
                    </div>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto">
                {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No messages found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
                    </div>
                ) : (
                    <div className="space-y-2 p-3">
                        {filteredMessages.map((message) => {
                            const isSelected = selectedMessage?._id === message._id;
                            const hasUnreadReviewer = message.conversation?.some(
                                c => c.sender === 'reviewer' && !message.conversation?.some(x => x.sender === 'editor')
                            );
                            const messageDate = new Date(message.lastMessageAt);
                            const isToday = messageDate.toDateString() === new Date().toDateString();
                            const timeStr = isToday 
                                ? messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                            return (
                                <button
                                    key={message._id}
                                    onClick={() => onSelectMessage(message)}
                                    className={`w-full p-3 rounded-lg text-left transition-all ${
                                        isSelected
                                            ? 'bg-blue-100 border border-blue-300'
                                            : hasUnreadReviewer
                                            ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-800 text-sm truncate">
                                                {message.paperTitle}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                ID: {message.submissionId}
                                            </p>
                                        </div>
                                        {hasUnreadReviewer && (
                                            <div className="ml-2 w-3 h-3 bg-red-500 rounded-full flex-shrink-0 mt-1" />
                                        )}
                                    </div>

                                    <div className="space-y-1 mb-2">
                                        <p className="text-xs text-gray-600 truncate">
                                            <span className="font-medium">Reviewer:</span> {message.reviewerEmail}
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">
                                            <span className="font-medium">Author:</span> {message.authorEmail}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {message.conversation?.some(c => c.sender === 'editor') ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                    <span>Replied</span>
                                                </>
                                            ) : message.conversation?.some(c => c.sender === 'reviewer') ? (
                                                <>
                                                    <AlertCircle className="w-3 h-3 text-orange-600" />
                                                    <span>Awaiting Response</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-3 h-3 text-gray-500" />
                                                    <span>No Messages</span>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 flex-shrink-0">{timeStr}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageFilterPanel;
