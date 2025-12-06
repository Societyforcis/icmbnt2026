import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Registration {
    _id: string;
    authorName: string;
    authorEmail: string;
    paperTitle: string;
    submissionId: string;
    paymentMethod: string;
    transactionId: string;
    amount: number;
    paymentScreenshot: string;
    registrationCategory: string;
    paymentStatus: string;
    registrationDate: string;
    verifiedAt?: string;
    rejectionReason?: string;
}

const AdminPaymentVerification: React.FC = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchRegistrations();
    }, [filter]);

    const fetchRegistrations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                Swal.fire({
                    icon: 'error',
                    title: 'Not Logged In',
                    text: 'Please log in to access this page',
                    confirmButtonColor: '#dc2626',
                });
                return;
            }

            const endpoint = filter === 'pending'
                ? '/api/registration/admin/pending'
                : `/api/registration/admin/all?status=${filter === 'all' ? '' : filter}`;

            const response = await axios.get(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setRegistrations(response.data.registrations);
            }
        } catch (error: any) {
            console.error('Error fetching registrations:', error);

            if (error.response?.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Unauthorized',
                    text: 'Please log in as an admin to access this page',
                    confirmButtonColor: '#dc2626',
                });
            } else if (error.response?.status === 403) {
                Swal.fire({
                    icon: 'error',
                    title: 'Access Denied',
                    text: 'You need admin privileges to access this page',
                    confirmButtonColor: '#dc2626',
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to fetch registrations',
                    confirmButtonColor: '#dc2626',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string) => {
        const result = await Swal.fire({
            title: 'Verify Payment?',
            text: 'This will approve the registration and notify the user.',
            icon: 'question',
            input: 'textarea',
            inputLabel: 'Verification Notes (optional)',
            inputPlaceholder: 'Enter any notes...',
            showCancelButton: true,
            confirmButtonText: 'Verify',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.put(
                    `${API_URL}/api/registration/admin/${id}/verify`,
                    { verificationNotes: result.value || 'Payment verified' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Verified!',
                        html: `
                            <p>Payment verified successfully!</p>
                            <p class="mt-2 text-sm"><strong>Registration Number:</strong> ${response.data.finalUser.registrationNumber}</p>
                        `,
                        confirmButtonColor: '#10b981',
                    });
                    fetchRegistrations();
                }
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to verify payment',
                    confirmButtonColor: '#dc2626',
                });
            }
        }
    };

    const handleReject = async (id: string) => {
        const result = await Swal.fire({
            title: 'Reject Payment?',
            text: 'Please provide a reason for rejection.',
            icon: 'warning',
            input: 'textarea',
            inputLabel: 'Rejection Reason',
            inputPlaceholder: 'Enter reason for rejection...',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide a reason!';
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Reject',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.put(
                    `${API_URL}/api/registration/admin/${id}/reject`,
                    { rejectionReason: result.value },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                Swal.fire({
                    icon: 'success',
                    title: 'Rejected',
                    text: 'Payment has been rejected.',
                    confirmButtonColor: '#dc2626',
                });
                fetchRegistrations();
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to reject payment',
                    confirmButtonColor: '#dc2626',
                });
            }
        }
    };

    const viewScreenshot = (url: string) => {
        setSelectedImage(url);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment Verification</h1>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter('verified')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'verified'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Verified
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'rejected'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Rejected
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            All
                        </button>
                    </div>
                </div>

                {/* Registrations List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="animate-spin h-12 w-12 text-blue-500" />
                    </div>
                ) : registrations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">No registrations found</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {registrations.map((reg) => (
                            <div key={reg._id} className="bg-white rounded-lg shadow-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left Column - Details */}
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-bold text-gray-900">{reg.authorName}</h3>
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Email:</strong> {reg.authorEmail}</p>
                                            <p><strong>Paper:</strong> {reg.paperTitle}</p>
                                            <p><strong>Submission ID:</strong> {reg.submissionId}</p>
                                            <p><strong>Category:</strong> {reg.registrationCategory}</p>
                                            <p><strong>Payment Method:</strong> {reg.paymentMethod}</p>
                                            <p><strong>Transaction ID:</strong> {reg.transactionId || 'N/A'}</p>
                                            <p><strong>Amount:</strong> ₹{reg.amount}</p>
                                            <p><strong>Submitted:</strong> {new Date(reg.registrationDate).toLocaleString()}</p>
                                            {reg.verifiedAt && (
                                                <p><strong>Verified:</strong> {new Date(reg.verifiedAt).toLocaleString()}</p>
                                            )}
                                            {reg.rejectionReason && (
                                                <p className="text-red-600"><strong>Rejection Reason:</strong> {reg.rejectionReason}</p>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mt-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${reg.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                reg.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {reg.paymentStatus.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right Column - Screenshot & Actions */}
                                    <div className="space-y-4">
                                        {reg.paymentScreenshot && (
                                            <div>
                                                <p className="font-semibold mb-2">Payment Screenshot:</p>
                                                <div className="relative">
                                                    <img
                                                        src={reg.paymentScreenshot}
                                                        alt="Payment Screenshot"
                                                        className="w-full h-48 object-contain bg-gray-100 rounded cursor-pointer"
                                                        onClick={() => viewScreenshot(reg.paymentScreenshot)}
                                                    />
                                                    <button
                                                        onClick={() => viewScreenshot(reg.paymentScreenshot)}
                                                        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100"
                                                    >
                                                        <Eye className="h-5 w-5 text-gray-700" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {reg.paymentStatus === 'pending' && (
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => handleVerify(reg._id)}
                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center"
                                                >
                                                    <CheckCircle className="h-5 w-5 mr-2" />
                                                    Verify
                                                </button>
                                                <button
                                                    onClick={() => handleReject(reg._id)}
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center"
                                                >
                                                    <XCircle className="h-5 w-5 mr-2" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="max-w-4xl max-h-full">
                        <img
                            src={selectedImage}
                            alt="Payment Screenshot Full View"
                            className="max-w-full max-h-screen object-contain"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPaymentVerification;
