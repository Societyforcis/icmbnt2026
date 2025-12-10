import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, Eye, Loader, Search, Award } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AuthorRegistration {
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
    membershipStatus?: {
        isMember: boolean;
        membershipId?: string;
        membershipType?: string;
    };
}

interface ListenerRegistration {
    _id: string;
    name: string;
    email: string;
    institution: string;
    address: string;
    country: string;
    registrationCategory: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paymentScreenshot: string;
    isScisMember: boolean;
    scisMembershipId?: string;
    paymentStatus: 'pending' | 'verified' | 'rejected';
    registrationNumber?: string;
    verifiedAt?: Date;
    verifiedByName?: string;
    rejectionReason?: string;
    createdAt: Date;
}

type Registration = AuthorRegistration | ListenerRegistration;

const isAuthorRegistration = (reg: Registration): reg is AuthorRegistration => {
    return 'authorName' in reg && 'authorEmail' in reg && 'paperTitle' in reg;
};

const AdminPaymentVerification: React.FC = () => {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
    const [registrationType, setRegistrationType] = useState<'authors' | 'listeners' | 'both'>('both');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState<'email' | 'paperId' | 'all'>('all');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchRegistrations();
    }, [filter, registrationType]);

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

            const allRegistrations: Registration[] = [];

            // Fetch author registrations
            if (registrationType === 'authors' || registrationType === 'both') {
                try {
                    const endpoint = filter === 'pending'
                        ? '/api/registration/admin/pending'
                        : `/api/registration/admin/all?status=${filter === 'all' ? '' : filter}`;

                    const response = await axios.get(`${API_URL}${endpoint}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.data.success) {
                        const regs = response.data.registrations;
                        // Fetch membership status for each registration
                        const regsWithMembership = await Promise.all(
                            regs.map(async (reg: AuthorRegistration) => {
                                try {
                                    const membershipResponse = await axios.post(
                                        `${API_URL}/api/membership/check-user-membership`,
                                        { email: reg.authorEmail },
                                        { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                    return {
                                        ...reg,
                                        membershipStatus: membershipResponse.data
                                    };
                                } catch (error) {
                                    console.error(`Error fetching membership for ${reg.authorEmail}:`, error);
                                    return {
                                        ...reg,
                                        membershipStatus: { isMember: false }
                                    };
                                }
                            })
                        );
                        allRegistrations.push(...regsWithMembership);
                    }
                } catch (error) {
                    console.error('Error fetching author registrations:', error);
                }
            }

            // Fetch listener registrations
            if (registrationType === 'listeners' || registrationType === 'both') {
                try {
                    const listenerEndpoint = filter === 'pending'
                        ? '/api/listener/admin/pending'
                        : `/api/listener/admin/all?status=${filter === 'all' ? '' : filter}`;

                    const listenerResponse = await axios.get(`${API_URL}${listenerEndpoint}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (listenerResponse.data.success) {
                        allRegistrations.push(...(listenerResponse.data.registrations || []));
                    }
                } catch (error) {
                    console.error('Error fetching listener registrations:', error);
                }
            }

            setRegistrations(allRegistrations);
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

    const handleVerify = async (id: string, reg?: Registration) => {
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
                
                // Determine if this is an author or listener registration
                const isAuthor = reg ? isAuthorRegistration(reg) : true;
                const endpoint = isAuthor 
                    ? `/api/registration/admin/${id}/verify`
                    : `/api/listener/admin/verify/${id}`;

                console.log('🔄 Verifying registration:', { id, type: isAuthor ? 'author' : 'listener', endpoint });

                const response = await axios.put(
                    `${API_URL}${endpoint}`,
                    { verificationNotes: result.value || 'Payment verified' },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Verified!',
                        html: `
                            <p>Payment verified successfully!</p>
                            <p class="mt-2 text-sm"><strong>Registration ID:</strong> ${id}</p>
                        `,
                        confirmButtonColor: '#10b981',
                    });
                    fetchRegistrations();
                }
            } catch (error: any) {
                console.error('Verification error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to verify payment',
                    confirmButtonColor: '#dc2626',
                });
            }
        }
    };

    const handleReject = async (id: string, reg?: Registration) => {
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
                
                // Determine if this is an author or listener registration
                const isAuthor = reg ? isAuthorRegistration(reg) : true;
                const endpoint = isAuthor 
                    ? `/api/registration/admin/${id}/reject`
                    : `/api/listener/admin/reject/${id}`;

                console.log('🔄 Rejecting registration:', { id, type: isAuthor ? 'author' : 'listener', endpoint });

                await axios.put(
                    `${API_URL}${endpoint}`,
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
                console.error('Rejection error:', error);
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

    // Filter registrations based on search term and search type
    const filteredRegistrations = useMemo(() => {
        if (!searchTerm.trim()) {
            return registrations;
        }

        const lowerSearchTerm = searchTerm.toLowerCase().trim();

        return registrations.filter((reg) => {
            const email = isAuthorRegistration(reg) ? reg.authorEmail : reg.email;
            const name = isAuthorRegistration(reg) ? reg.authorName : reg.name;
            const paperTitle = isAuthorRegistration(reg) ? reg.paperTitle : '';
            const submissionId = isAuthorRegistration(reg) ? reg.submissionId : '';

            switch (searchType) {
                case 'email':
                    return email.toLowerCase().includes(lowerSearchTerm);
                case 'paperId':
                    return submissionId.toLowerCase().includes(lowerSearchTerm);
                case 'all':
                    return (
                        email.toLowerCase().includes(lowerSearchTerm) ||
                        submissionId.toLowerCase().includes(lowerSearchTerm) ||
                        name.toLowerCase().includes(lowerSearchTerm) ||
                        paperTitle.toLowerCase().includes(lowerSearchTerm)
                    );
                default:
                    return true;
            }
        });
    }, [registrations, searchTerm, searchType]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Payment Verification</h1>

                {/* Registration Type Filter */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Registration Type:</p>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setRegistrationType('both')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${registrationType === 'both'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Both
                        </button>
                        <button
                            onClick={() => setRegistrationType('authors')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${registrationType === 'authors'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Authors Only
                        </button>
                        <button
                            onClick={() => setRegistrationType('listeners')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${registrationType === 'listeners'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Listeners Only
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Payment Status:</p>
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

                {/* Search Section */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search registrations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as 'email' | 'paperId' | 'all')}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="all">Search All Fields</option>
                            <option value="email">Email Only</option>
                            <option value="paperId">Paper ID Only</option>
                        </select>
                    </div>
                    {searchTerm && (
                        <div className="mt-3 text-sm text-gray-600">
                            Found <strong>{filteredRegistrations.length}</strong> result{filteredRegistrations.length !== 1 ? 's' : ''}
                            {searchType !== 'all' && ` in ${searchType === 'email' ? 'email' : 'paper ID'}`}
                        </div>
                    )}
                </div>

                {/* Registrations List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="animate-spin h-12 w-12 text-blue-500" />
                    </div>
                ) : filteredRegistrations.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-gray-500">
                            {searchTerm ? 'No registrations found matching your search' : 'No registrations found'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredRegistrations.map((reg) => {
                            const isAuthor = isAuthorRegistration(reg);
                            const name = isAuthor ? reg.authorName : reg.name;
                            const email = isAuthor ? reg.authorEmail : reg.email;
                            const createdDate = isAuthor ? reg.registrationDate : (reg.createdAt || new Date());
                            
                            return (
                                <div key={reg._id} className="bg-white rounded-lg shadow-lg p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column - Details */}
                                        <div className="space-y-3">
                                            {/* Header with type indicator */}
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    isAuthor 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {isAuthor ? 'Author' : 'Listener'}
                                                </span>
                                            </div>

                                            {/* SCIS/Membership Badge */}
                                            {isAuthor && (reg as AuthorRegistration).membershipStatus?.isMember && (
                                                <div className="inline-flex items-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg px-3 py-2">
                                                    <Award className="h-5 w-5 text-green-600 mr-2" />
                                                    <div>
                                                        <p className="text-sm font-bold text-green-800">SCIS Member</p>
                                                        <p className="text-xs text-green-600">ID: {(reg as AuthorRegistration).membershipStatus?.membershipId}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {!isAuthor && (reg as ListenerRegistration).isScisMember && (
                                                <div className="inline-flex items-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg px-3 py-2">
                                                    <Award className="h-5 w-5 text-green-600 mr-2" />
                                                    <div>
                                                        <p className="text-sm font-bold text-green-800">SCIS Member</p>
                                                        <p className="text-xs text-green-600">ID: {(reg as ListenerRegistration).scisMembershipId}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2 text-sm">
                                                <p><strong>Email:</strong> {email}</p>
                                                
                                                {/* Author-specific fields */}
                                                {isAuthor && (
                                                    <>
                                                        <p><strong>Paper Title:</strong> {(reg as AuthorRegistration).paperTitle}</p>
                                                        <p><strong>Submission ID:</strong> {(reg as AuthorRegistration).submissionId}</p>
                                                    </>
                                                )}

                                                {/* Listener-specific fields */}
                                                {!isAuthor && (
                                                    <>
                                                        <p><strong>Institution:</strong> {(reg as ListenerRegistration).institution}</p>
                                                        <p><strong>Address:</strong> {(reg as ListenerRegistration).address}</p>
                                                        <p><strong>Country:</strong> {(reg as ListenerRegistration).country}</p>
                                                    </>
                                                )}

                                                <p><strong>Category:</strong> {reg.registrationCategory}</p>
                                                <p><strong>Payment Method:</strong> {reg.paymentMethod}</p>
                                                <p><strong>Transaction ID:</strong> {reg.transactionId || 'N/A'}</p>

                                                {/* Amount Display */}
                                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <p className="font-semibold text-gray-800 mb-1">Payment Amount:</p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {isAuthor ? '₹' : (reg as ListenerRegistration).currency === 'IDR' ? 'Rp ' : '$'}
                                                        {reg.amount.toLocaleString()}
                                                    </p>
                                                </div>

                                                <p><strong>Submitted:</strong> {new Date(createdDate).toLocaleString()}</p>
                                                {reg.verifiedAt && (
                                                    <p><strong>Verified:</strong> {new Date(reg.verifiedAt).toLocaleString()}</p>
                                                )}
                                                {reg.rejectionReason && (
                                                    <p className="text-red-600"><strong>Rejection Reason:</strong> {reg.rejectionReason}</p>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="mt-4 flex gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                    reg.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    reg.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                    {(reg.paymentStatus as string).toUpperCase()}
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
                                                            className="w-full h-48 object-contain bg-gray-100 rounded cursor-pointer border border-gray-300"
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
                                                        onClick={() => handleVerify(reg._id, reg)}
                                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center"
                                                    >
                                                        <CheckCircle className="h-5 w-5 mr-2" />
                                                        Verify
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(reg._id, reg)}
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
                            );
                        })}
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
