import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Send, Copy, Check, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { emailTemplates, replaceTemplateVariables } from '../services/emailTemplates';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface MessagingPanelProps {
    submissionId: string;
    reviewId: string;
    reviewerName: string;
    reviewerEmail: string;
    authorName: string;
    authorEmail: string;
    paperTitle: string;
    onSuccess?: () => void;
}

const MessagingPanel: React.FC<MessagingPanelProps> = ({
    submissionId,
    reviewId,
    reviewerName,
    reviewerEmail,
    authorName,
    authorEmail,
    paperTitle,
    onSuccess
}) => {
    const [activeTab, setActiveTab] = useState<'reviewer' | 'author'>('reviewer');
    const [useTemplate, setUseTemplate] = useState(true);
    const [customMessage, setCustomMessage] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [copied, setCopied] = useState(false);

    const getTemplate = () => {
        if (activeTab === 'reviewer') {
            return emailTemplates.replyToReviewer.defaultTemplate;
        } else {
            return emailTemplates.replyToAuthor.defaultTemplate;
        }
    };

    const getPreviewContent = () => {
        if (useTemplate) {
            return replaceTemplateVariables(getTemplate(), {
                '{reviewerName}': reviewerName,
                '{authorName}': authorName,
                '{submissionId}': submissionId,
                '{paperTitle}': paperTitle,
                '{userMessage}': customMessage,
                '{editorName}': localStorage.getItem('userName') || 'Editor',
            });
        } else {
            return customMessage;
        }
    };

    const handleSend = async () => {
        if (useTemplate && !customMessage.trim()) {
            Swal.fire('Warning', 'Please add your message to the template', 'warning');
            return;
        }
        if (!useTemplate && !customMessage.trim()) {
            Swal.fire('Warning', 'Please enter your message', 'warning');
            return;
        }

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const recipientEmail = activeTab === 'reviewer' ? reviewerEmail : authorEmail;
            const recipientName = activeTab === 'reviewer' ? reviewerName : authorName;

            const messageContent = getPreviewContent();

            await axios.post(
                `${API_URL}/api/editor/send-message`,
                {
                    submissionId,
                    reviewId,
                    recipientType: activeTab,
                    recipientEmail,
                    message: messageContent,
                    isTemplate: useTemplate
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire('Success', `Message sent to ${recipientName}`, 'success');
            setCustomMessage('');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(getPreviewContent());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Send Message</h3>
                </div>
                <p className="text-purple-100 text-sm mt-1">Professional email communication</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                    onClick={() => setActiveTab('reviewer')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                        activeTab === 'reviewer'
                            ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    📧 Reply to Reviewer
                    <div className="text-xs text-gray-500 mt-1">{reviewerEmail}</div>
                </button>
                <button
                    onClick={() => setActiveTab('author')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition ${
                        activeTab === 'author'
                            ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    📝 Reply to Author
                    <div className="text-xs text-gray-500 mt-1">{authorEmail}</div>
                </button>
            </div>

            <div className="p-6">
                {/* Template Toggle */}
                <div className="mb-6 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                        type="checkbox"
                        checked={useTemplate}
                        onChange={(e) => setUseTemplate(e.target.checked)}
                        id="useTemplate"
                        className="w-4 h-4 rounded cursor-pointer"
                    />
                    <label htmlFor="useTemplate" className="cursor-pointer flex-1">
                        <div className="font-medium text-gray-700">Use Professional Template</div>
                        <div className="text-xs text-gray-600">
                            {useTemplate ? 'Template-based message' : 'Completely custom message'}
                        </div>
                    </label>
                </div>

                {/* Message Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {useTemplate ? 'Add Your Message to Template' : 'Compose Message'}
                    </label>
                    <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder={
                            useTemplate
                                ? 'Add additional context or request...'
                                : 'Type your complete message here...'
                        }
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <div className="text-xs text-gray-500 mt-2">
                        {customMessage.length} characters
                    </div>
                </div>

                {/* Preview Section */}
                <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                {showPreview ? 'Hide' : 'Show'} Email Preview
                            </button>
                        </div>
                        {showPreview && (
                            <button
                                onClick={handleCopyToClipboard}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        )}
                    </div>

                    {showPreview && (
                        <div className="bg-white p-6 max-h-96 overflow-y-auto">
                            <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: getPreviewContent()
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Info Box */}
                {useTemplate && (
                    <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                        <div className="font-medium mb-1">📋 Template Features:</div>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Professional HTML formatting</li>
                            <li>Auto-inserted recipient name and paper details</li>
                            <li>Your custom message integrated into template</li>
                            <li>Maintains brand consistency</li>
                        </ul>
                    </div>
                )}

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={sending || (!useTemplate && !customMessage.trim()) || (useTemplate && !customMessage.trim())}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:from-gray-400 disabled:to-gray-400 flex items-center justify-center gap-2"
                >
                    <Send className="w-5 h-5" />
                    {sending ? 'Sending...' : 'Send Message'}
                </button>

                {/* Recipient Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700">
                        <div className="font-medium mb-2">📬 Sending to:</div>
                        <div className="space-y-1">
                            <div>
                                <strong>{activeTab === 'reviewer' ? 'Reviewer' : 'Author'}:</strong>{' '}
                                {activeTab === 'reviewer' ? reviewerName : authorName}
                            </div>
                            <div>
                                <strong>Email:</strong> {activeTab === 'reviewer' ? reviewerEmail : authorEmail}
                            </div>
                            <div>
                                <strong>Paper:</strong> {paperTitle}
                            </div>
                            <div>
                                <strong>Submission ID:</strong> {submissionId}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagingPanel;
