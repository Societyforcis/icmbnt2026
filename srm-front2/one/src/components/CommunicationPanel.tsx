import React, { useState } from 'react';
import { Mail, FileText } from 'lucide-react';
import SendReplyModal from './SendReplyModal';
import FinalDecisionModal from './FinalDecisionModal';

interface MessagePanelProps {
    submissionId: string;
    reviewId: string;
    reviewerName: string;
    reviewerEmail: string;
    authorName: string;
    authorEmail: string;
    paperTitle: string;
    category: string;
    reviewerComments: string;
}

type ModalType = 'reply-reviewer' | 'reply-author' | 'final-decision' | null;

const CommunicationPanel: React.FC<MessagePanelProps> = ({
    submissionId,
    reviewId,
    reviewerName,
    reviewerEmail,
    authorName,
    authorEmail,
    paperTitle,
    category,
    reviewerComments
}) => {
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    return (
        <>
            {/* Communication Actions */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-indigo-600" />
                    Communication & Decisions
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Reply to Reviewer */}
                    <button
                        onClick={() => setActiveModal('reply-reviewer')}
                        className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition font-medium"
                    >
                        <Mail className="w-5 h-5" />
                        <div className="text-left">
                            <p className="text-sm">Reply to Reviewer</p>
                            <p className="text-xs text-gray-600">{reviewerName}</p>
                        </div>
                    </button>

                    {/* Reply to Author */}
                    <button
                        onClick={() => setActiveModal('reply-author')}
                        className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition font-medium"
                    >
                        <Mail className="w-5 h-5" />
                        <div className="text-left">
                            <p className="text-sm">Reply to Author</p>
                            <p className="text-xs text-gray-600">{authorName}</p>
                        </div>
                    </button>

                    {/* Make Final Decision */}
                    <button
                        onClick={() => setActiveModal('final-decision')}
                        className="md:col-span-2 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg hover:from-green-500 hover:to-emerald-600 transition font-medium"
                    >
                        <FileText className="w-5 h-5" />
                        <div className="text-left">
                            <p className="text-sm">Make Final Decision</p>
                            <p className="text-xs opacity-90">Accept, Reject, or Request Revision</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Modals */}
            {activeModal === 'reply-reviewer' && (
                <SendReplyModal
                    submissionId={submissionId}
                    reviewId={reviewId}
                    recipientType="reviewer"
                    recipientName={reviewerName}
                    recipientEmail={reviewerEmail}
                    paperTitle={paperTitle}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {activeModal === 'reply-author' && (
                <SendReplyModal
                    submissionId={submissionId}
                    reviewId={reviewId}
                    recipientType="author"
                    recipientName={authorName}
                    recipientEmail={authorEmail}
                    paperTitle={paperTitle}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {activeModal === 'final-decision' && (
                <FinalDecisionModal
                    submissionId={submissionId}
                    paperId={submissionId}
                    authorName={authorName}
                    authorEmail={authorEmail}
                    paperTitle={paperTitle}
                    category={category}
                    reviewerComments={reviewerComments}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </>
    );
};

export default CommunicationPanel;
