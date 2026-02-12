import { useState, useEffect } from 'react';
import { FileText, Calendar, Mail, User, ExternalLink, Download, Send } from 'react-feather';
import axios from 'axios';
import Swal from 'sweetalert2';

interface SelectedUser {
    _id: string;
    authorName: string;
    authorEmail: string;
    paperTitle: string;
    submissionId: string;
    registrationNumber?: string;
    selectionDate: string;
    status: string;
    paperUrl: string;
    copyrightUrl: string;
    finalDocUrl?: string;
    finalDocSubmittedAt?: string;
}

const AdminSelectedUsers = () => {
    const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSelectedUsers();
    }, []);

    const fetchSelectedUsers = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/selected-users`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSelectedUsers(response.data.users);
            }
        } catch (error) {
            console.error('Error fetching selected users:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load conference selected users'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendSelectionEmail = async (submissionId: string) => {
        try {
            const result = await Swal.fire({
                title: 'Send Selection Email?',
                text: 'This will notify the author and request final document upload (.doc format).',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#F5A051',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, Send Email'
            });

            if (result.isConfirmed) {
                const token = localStorage.getItem('token');
                const apiUrl = localStorage.getItem('role') === 'Admin'
                    ? `${import.meta.env.VITE_API_URL}/api/admin/selected-users/send-email`
                    : `${import.meta.env.VITE_API_URL}/api/editor/selected-users/send-email`;

                const response = await axios.post(
                    apiUrl,
                    { submissionId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Sent!',
                        text: 'Selection email has been sent successfully.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            }
        } catch (error: any) {
            console.error('Error sending selection email:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to send email'
            });
        }
    };

    const filteredUsers = selectedUsers.filter(user =>
        user.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.authorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.paperTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.submissionId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (date: string | number | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Conference Selected Users</h2>
                <p className="text-gray-600 mb-4">
                    Users who have completed the full conference process (paper submission, review, copyright, and payment)
                </p>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by name, email, paper title, or submission ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#F5A051] focus:ring-4 focus:ring-[#F5A051]/10"
                    />
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-900">
                        Total Selected: <span className="text-[#F5A051]">{selectedUsers.length}</span>
                    </span>
                    {searchTerm && (
                        <span className="text-gray-600">
                            Filtered: <span className="font-semibold">{filteredUsers.length}</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Users List */}
            {isLoading ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A051] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading selected users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">
                        {searchTerm ? 'No users found matching your search' : 'No selected users yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredUsers.map((user) => (
                        <div
                            key={user._id}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{user.authorName}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            {user.authorEmail}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Paper Title:</p>
                                        <p className="text-gray-900 font-semibold">{user.paperTitle}</p>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FileText className="w-4 h-4" />
                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                                {user.submissionId}
                                            </span>
                                        </div>
                                        {user.registrationNumber && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <span className="font-medium">Reg#:</span>
                                                <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                                                    {user.registrationNumber}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-600" />
                                        <span className="text-gray-600">Selected:</span>
                                        <span className="font-semibold text-gray-900">
                                            {formatDate(user.selectionDate)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            ✓ {user.status}
                                        </span>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Documents:</p>
                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={user.paperUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Paper
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            <a
                                                href={user.copyrightUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                                            >
                                                <Download className="w-4 h-4" />
                                                Copyright
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            {user.finalDocUrl && (
                                                <a
                                                    href={user.finalDocUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Final Doc (DOC)
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleSendSelectionEmail(user.submissionId)}
                                                className="inline-flex items-center gap-2 px-3 py-2 bg-[#F5A051] text-white rounded-lg hover:bg-[#e69040] transition-colors text-sm font-medium"
                                            >
                                                <Send className="w-4 h-4" />
                                                Upload Final Docs
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminSelectedUsers;
