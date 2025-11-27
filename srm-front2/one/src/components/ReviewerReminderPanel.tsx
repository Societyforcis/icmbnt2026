import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Clock, AlertCircle, Send, Eye } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface NonRespondingReviewer {
    _id: string;
    submissionId: string;
    paperTitle: string;
    reviewerId: string;
    reviewerName: string;
    reviewerEmail: string;
    daysUntilDeadline: number;
    reminderCount: number;
    lastReminderSent?: string;
}

const ReviewerReminderPanel: React.FC = () => {
    const [nonResponders, setNonResponders] = useState<NonRespondingReviewer[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState<string | null>(null);
    const [selectedReviewers, setSelectedReviewers] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchNonResponders();
    }, []);

    const fetchNonResponders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/editor/non-responding-reviewers`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNonResponders(response.data.reviewers);
        } catch (error) {
            console.error('Error fetching non-responding reviewers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSelect = (reviewerId: string) => {
        const newSet = new Set(selectedReviewers);
        if (newSet.has(reviewerId)) {
            newSet.delete(reviewerId);
        } else {
            newSet.add(reviewerId);
        }
        setSelectedReviewers(newSet);
    };

    const handleSendReminder = async (reviewerId: string) => {
        setSending(reviewerId);
        try {
            const token = localStorage.getItem('token');
            const reviewer = nonResponders.find(r => r._id === reviewerId);

            if (!reviewer) return;

            await axios.post(
                `${API_URL}/api/editor/send-reminder`,
                {
                    submissionId: reviewer.submissionId,
                    reviewerId: reviewer.reviewerId,
                    reviewerEmail: reviewer.reviewerEmail
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire('Success', `Reminder sent to ${reviewer.reviewerName}`, 'success');
            fetchNonResponders();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to send reminder', 'error');
        } finally {
            setSending(null);
        }
    };

    const handleBulkSendReminders = async () => {
        if (selectedReviewers.size === 0) {
            Swal.fire('Warning', 'Please select reviewers', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: 'Send Reminders?',
            text: `Send reminders to ${selectedReviewers.size} reviewers?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, send',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        setSending('bulk');
        try {
            const token = localStorage.getItem('token');
            const selectedData = nonResponders.filter(r => selectedReviewers.has(r._id));

            await axios.post(
                `${API_URL}/api/editor/send-bulk-reminders`,
                {
                    reminders: selectedData.map(r => ({
                        submissionId: r.submissionId,
                        reviewerId: r.reviewerId,
                        reviewerEmail: r.reviewerEmail
                    }))
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Swal.fire('Success', `Reminders sent to ${selectedReviewers.size} reviewers`, 'success');
            setSelectedReviewers(new Set());
            fetchNonResponders();
        } catch (error: any) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to send reminders', 'error');
        } finally {
            setSending(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-orange-600" />
                <div>
                    <h3 className="text-xl font-semibold text-gray-800">Reviewer Reminders</h3>
                    <p className="text-sm text-gray-600">Send reminders to reviewers who haven't responded</p>
                </div>
            </div>

            {nonResponders.length === 0 ? (
                <div className="text-center py-12">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">All reviewers have responded! 🎉</p>
                </div>
            ) : (
                <>
                    {/* Bulk Actions */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-blue-900">
                                {selectedReviewers.size} reviewer{selectedReviewers.size !== 1 ? 's' : ''} selected
                            </p>
                            <p className="text-sm text-blue-700">
                                {nonResponders.length} reviewer{nonResponders.length !== 1 ? 's' : ''} need reminders
                            </p>
                        </div>
                        <button
                            onClick={handleBulkSendReminders}
                            disabled={selectedReviewers.size === 0 || sending === 'bulk'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2 font-medium"
                        >
                            <Mail className="w-4 h-4" />
                            {sending === 'bulk' ? 'Sending...' : 'Send Selected'}
                        </button>
                    </div>

                    {/* Reviewers List */}
                    <div className="space-y-3">
                        {nonResponders.map((reviewer) => (
                            <div
                                key={reviewer._id}
                                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedReviewers.has(reviewer._id)}
                                            onChange={() => handleToggleSelect(reviewer._id)}
                                            className="w-5 h-5 mt-1 rounded cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">{reviewer.reviewerName}</p>
                                            <p className="text-sm text-gray-600">{reviewer.reviewerEmail}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                    {reviewer.submissionId}
                                                </span>
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                    {reviewer.paperTitle}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-3">
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Clock className="w-4 h-4 text-orange-600" />
                                                    <span className={reviewer.daysUntilDeadline < 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                                        {reviewer.daysUntilDeadline < 0
                                                            ? `Overdue ${Math.abs(reviewer.daysUntilDeadline)} days`
                                                            : `${reviewer.daysUntilDeadline} days left`}
                                                    </span>
                                                </div>
                                                {reviewer.reminderCount > 0 && (
                                                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                                                        {reviewer.reminderCount} reminder{reviewer.reminderCount !== 1 ? 's' : ''} sent
                                                    </span>
                                                )}
                                                {reviewer.reminderCount >= 2 && (
                                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Multiple reminders sent
                                                    </span>
                                                )}
                                            </div>
                                            {reviewer.lastReminderSent && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Last reminder: {new Date(reviewer.lastReminderSent).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSendReminder(reviewer._id)}
                                        disabled={sending === reviewer._id}
                                        className="px-3 py-2 ml-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap font-medium text-sm"
                                    >
                                        <Send className="w-4 h-4" />
                                        {sending === reviewer._id ? 'Sending...' : 'Send Reminder'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Stats */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <p className="text-sm text-red-600 font-medium">Overdue</p>
                            <p className="text-2xl font-bold text-red-800">
                                {nonResponders.filter(r => r.daysUntilDeadline < 0).length}
                            </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                            <p className="text-sm text-orange-600 font-medium">Due Soon</p>
                            <p className="text-2xl font-bold text-orange-800">
                                {nonResponders.filter(r => r.daysUntilDeadline >= 0 && r.daysUntilDeadline < 3).length}
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-600 font-medium">Reminders Sent</p>
                            <p className="text-2xl font-bold text-yellow-800">
                                {nonResponders.reduce((sum, r) => sum + r.reminderCount, 0)}
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReviewerReminderPanel;
