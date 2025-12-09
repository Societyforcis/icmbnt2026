import React, { useState, useEffect } from 'react';
import { CreditCard, Building, CheckCircle, Globe, Check, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import upiqr from "./images/bali/qr2.png"
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedBase64);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

interface PaperDetails {
    submissionId: string;
    paperTitle: string;
    authorName: string;
    authorEmail: string;
    category: string;
    paymentStatus: string;
}

const SimplifiedRegistrationForm: React.FC = () => {
    const [paperDetails, setPaperDetails] = useState<PaperDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'bank-transfer' | 'paypal' | ''>('');
    const [paymentSubMethod, setPaymentSubMethod] = useState<'upi' | 'bank-account' | ''>('');
    const [transactionId, setTransactionId] = useState('');
    const [paymentScreenshot, setPaymentScreenshot] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [amount, setAmount] = useState(0);
    const [registrationStatus, setRegistrationStatus] = useState<any>(null);
    const [membershipStatus, setMembershipStatus] = useState<any>(null);
    const [loadingMembership, setLoadingMembership] = useState(true);

    useEffect(() => {
        fetchPaperDetails();
        checkRegistrationStatus();
        checkMembershipStatus();
    }, []);

    const fetchPaperDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/registration/my-paper-details`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setPaperDetails(response.data.paperDetails);
            }
        } catch (error: any) {
            console.error('Error fetching paper details:', error);
            if (error.response?.status === 404) {
                Swal.fire({
                    icon: 'error',
                    title: 'No Accepted Paper',
                    text: 'You need to have an accepted paper to register for the conference.',
                    confirmButtonColor: '#dc2626',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const checkRegistrationStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/registration/my-registration`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setRegistrationStatus(response.data.registration);
            }
        } catch (error: any) {
            // No registration found is okay
            if (error.response?.status !== 404) {
                console.error('Error checking registration status:', error);
            }
        }
    };

    const checkMembershipStatus = async () => {
        try {
            setLoadingMembership(true);
            const token = localStorage.getItem('token');

            if (!token) {
                setLoadingMembership(false);
                return;
            }

            const response = await axios.get(
                `${API_URL}/api/membership/check-membership`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log('Membership status in form:', response.data);
            setMembershipStatus(response.data);
        } catch (error) {
            console.error('Error checking membership status:', error);
            setMembershipStatus({ isMember: false });
        } finally {
            setLoadingMembership(false);
        }
    };

    const handleCategoryChange = (category: string, fee: number) => {
        setSelectedCategory(category);
        setAmount(fee);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedCategory) {
            Swal.fire({
                icon: 'error',
                title: 'Category Required',
                text: 'Please select a registration category',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (!paymentMethod) {
            Swal.fire({
                icon: 'error',
                title: 'Payment Method Required',
                text: 'Please select a payment method',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (paymentMethod === 'bank-transfer' && !paymentSubMethod) {
            Swal.fire({
                icon: 'error',
                title: 'Payment Option Required',
                text: 'Please select UPI or Bank Account',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        if (paymentMethod === 'bank-transfer' && !paymentScreenshot) {
            Swal.fire({
                icon: 'error',
                title: 'Screenshot Required',
                text: 'Please upload your payment screenshot',
                confirmButtonColor: '#dc2626',
            });
            return;
        }

        try {
            Swal.fire({
                title: 'Submitting Registration...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const token = localStorage.getItem('token');

            const response = await axios.post(
                `${API_URL}/api/registration/submit`,
                {
                    paymentMethod,
                    paymentSubMethod,
                    transactionId,
                    amount,
                    paymentScreenshot,
                    registrationCategory: selectedCategory,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            Swal.close();

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Registration Submitted!',
                    html: `
            <p>Your registration has been submitted successfully!</p>
            <p class="mt-2 text-sm text-gray-600">Please wait for admin verification of your payment.</p>
            <p class="mt-2 text-sm text-gray-600">You will be notified once verified.</p>
          `,
                    confirmButtonColor: '#dc2626',
                });

                // Reset form
                setPaymentMethod('');
                setPaymentSubMethod('');
                setTransactionId('');
                setPaymentScreenshot('');
                setSelectedCategory('');
            }
        } catch (error: any) {
            Swal.close();
            console.error('Registration error:', error);

            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: error.response?.data?.message || 'Failed to submit registration',
                confirmButtonColor: '#dc2626',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your details...</p>
                </div>
            </div>
        );
    }

    if (!paperDetails) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
                <p className="text-red-700">
                    <strong>Access Denied:</strong> You need to have an accepted paper to register.
                </p>
            </div>
        );
    }

    // Show registration status if already submitted
    if (registrationStatus) {
        const statusColors = {
            pending: 'bg-yellow-50 border-yellow-500 text-yellow-800',
            verified: 'bg-green-50 border-green-500 text-green-800',
            rejected: 'bg-red-50 border-red-500 text-red-800'
        };

        const statusIcons = {
            pending: '⏳',
            verified: '✅',
            rejected: '❌'
        };

        return (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Registration Status</h2>

                <div className={`border-l-4 p-6 rounded ${statusColors[registrationStatus.paymentStatus as keyof typeof statusColors]}`}>
                    <div className="flex items-center mb-4">
                        <span className="text-4xl mr-4">{statusIcons[registrationStatus.paymentStatus as keyof typeof statusIcons]}</span>
                        <div>
                            <h3 className="text-xl font-bold">
                                {registrationStatus.paymentStatus === 'pending' && 'Waiting for Admin Verification'}
                                {registrationStatus.paymentStatus === 'verified' && 'Registration Verified!'}
                                {registrationStatus.paymentStatus === 'rejected' && 'Registration Rejected'}
                            </h3>
                            <p className="text-sm mt-1">
                                {registrationStatus.paymentStatus === 'pending' && 'Your registration has been submitted successfully. Please wait while our admin team verifies your payment.'}
                                {registrationStatus.paymentStatus === 'verified' && 'Your payment has been verified! You will receive a confirmation email shortly.'}
                                {registrationStatus.paymentStatus === 'rejected' && 'Your payment was rejected. Please contact support for more information.'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white bg-opacity-50 p-4 rounded mt-4 space-y-2">
                        <p><strong>Author:</strong> {registrationStatus.authorName}</p>
                        <p><strong>Paper:</strong> {registrationStatus.paperTitle}</p>
                        <p><strong>Amount:</strong> ₹{registrationStatus.amount}</p>
                        <p><strong>Payment Method:</strong> {registrationStatus.paymentMethod}</p>
                        <p><strong>Submitted:</strong> {new Date(registrationStatus.registrationDate).toLocaleDateString()}</p>
                        {registrationStatus.verifiedAt && (
                            <p><strong>Verified:</strong> {new Date(registrationStatus.verifiedAt).toLocaleDateString()}</p>
                        )}
                        {registrationStatus.rejectionReason && (
                            <p className="text-red-700"><strong>Reason:</strong> {registrationStatus.rejectionReason}</p>
                        )}
                    </div>

                    {registrationStatus.paymentStatus === 'pending' && (
                        <div className="mt-6 p-4 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>📧 Email Notification:</strong> Once your payment is verified, we will send you a confirmation email with your registration details.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Conference Registration</h2>

            {/* Display Paper Details */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
                <h3 className="font-bold text-lg mb-4 text-blue-900">Your Paper Details</h3>
                <div className="space-y-2 text-sm">
                    <p><strong>Submission ID:</strong> {paperDetails.submissionId}</p>
                    <p><strong>Author Name:</strong> {paperDetails.authorName}</p>
                    <p><strong>Email:</strong> {paperDetails.authorEmail}</p>
                    <p><strong>Paper Title:</strong> {paperDetails.paperTitle}</p>
                    <p><strong>Category:</strong> {paperDetails.category}</p>
                </div>
            </div>

            {/* SCIS Membership Status */}
            {!loadingMembership && membershipStatus && (
                <div className={`border-l-4 p-4 rounded mb-6 ${membershipStatus.isMember
                    ? 'bg-green-50 border-green-500'
                    : 'bg-yellow-50 border-yellow-500'
                    }`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {membershipStatus.isMember ? (
                                <Check className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            )}
                        </div>
                        <div className="ml-3">
                            {membershipStatus.isMember ? (
                                <>
                                    <p className="text-sm font-bold text-green-800">
                                        ✅ SCIS Member - Discount Applied!
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Membership ID: <span className="font-mono font-semibold">{membershipStatus.membershipId}</span>
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                        You will see discounted member rates below.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-yellow-800">
                                        Non-SCIS Member
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Standard registration fees apply. Become a SCIS member to save on registration!
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Registration Category */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-4">
                        Select Registration Category <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Indian Student */}
                        <button
                            type="button"
                            onClick={() => handleCategoryChange('indian-student', membershipStatus?.isMember ? 4500 : 5850)}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedCategory === 'indian-student'
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            <h3 className="font-bold text-lg mb-1">Indian Student</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                ₹{membershipStatus?.isMember ? '4,500' : '5,850'}
                            </p>
                            {membershipStatus?.isMember && (
                                <p className="text-xs text-green-600 mt-2">
                                    <span className="line-through text-gray-400">₹5,850</span> Save ₹1,350!
                                </p>
                            )}
                        </button>

                        {/* Indian Faculty */}
                        <button
                            type="button"
                            onClick={() => handleCategoryChange('indian-faculty', membershipStatus?.isMember ? 6750 : 7500)}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedCategory === 'indian-faculty'
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            <h3 className="font-bold text-lg mb-1">Indian Faculty</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                ₹{membershipStatus?.isMember ? '6,750' : '7,500'}
                            </p>
                            {membershipStatus?.isMember && (
                                <p className="text-xs text-green-600 mt-2">
                                    <span className="line-through text-gray-400">₹7,500</span> Save ₹750!
                                </p>
                            )}
                        </button>

                        {/* Indian Scholar */}
                        <button
                            type="button"
                            onClick={() => handleCategoryChange('indian-scholar', membershipStatus?.isMember ? 6750 : 7500)}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedCategory === 'indian-scholar'
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            <h3 className="font-bold text-lg mb-1">Research Scholar</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                ₹{membershipStatus?.isMember ? '6,750' : '7,500'}
                            </p>
                            {membershipStatus?.isMember && (
                                <p className="text-xs text-green-600 mt-2">
                                    <span className="line-through text-gray-400">₹7,500</span> Save ₹750!
                                </p>
                            )}
                        </button>

                        {/* Foreign Author */}
                        <button
                            type="button"
                            onClick={() => handleCategoryChange('foreign-author', membershipStatus?.isMember ? 300 : 350)}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedCategory === 'foreign-author'
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            <h3 className="font-bold text-lg mb-1">Foreign Author</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                ${membershipStatus?.isMember ? '300' : '350'}
                            </p>
                            {membershipStatus?.isMember && (
                                <p className="text-xs text-green-600 mt-2">
                                    <span className="line-through text-gray-400">$350</span> Save $50!
                                </p>
                            )}
                        </button>

                        {/* Indonesian Author */}
                        <button
                            type="button"
                            onClick={() => handleCategoryChange('indonesian-author', membershipStatus?.isMember ? 1700000 : 2600000)}
                            className={`p-6 rounded-xl border-2 transition-all ${selectedCategory === 'indonesian-author'
                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                : 'border-gray-200 hover:border-blue-300'
                                }`}
                        >
                            <h3 className="font-bold text-lg mb-1">Indonesian Author</h3>
                            <p className="text-xl font-bold text-blue-600">
                                {membershipStatus?.isMember ? '17L' : '26L'} IDR
                            </p>
                            {membershipStatus?.isMember && (
                                <p className="text-xs text-green-600 mt-2">
                                    <span className="line-through text-gray-400">26L IDR</span> Save 9L!
                                </p>
                            )}
                        </button>
                    </div>
                </div>

                {/* Payment Method Selection */}
                {selectedCategory && (
                    <div className="space-y-6">
                        <label className="block text-sm font-semibold text-gray-800">
                            <CreditCard className="inline h-4 w-4 mr-2 text-red-500" />
                            Select Payment Method <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('bank-transfer')}
                                className={`p-6 rounded-xl border-2 transition-all ${paymentMethod === 'bank-transfer'
                                    ? 'border-red-500 bg-red-50 shadow-lg'
                                    : 'border-gray-200 hover:border-red-300'
                                    }`}
                            >
                                <div className="flex items-center justify-center mb-3">
                                    <div className={`p-3 rounded-lg ${paymentMethod === 'bank-transfer' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                        <Building className="h-8 w-8 text-red-500" />
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-1">Bank Transfer</h3>
                                <p className="text-sm text-gray-600">UPI or Bank Account</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    Swal.fire({
                                        icon: 'info',
                                        title: 'Coming Soon',
                                        text: 'PayPal payment option will be available soon!',
                                        confirmButtonColor: '#dc2626',
                                    });
                                }}
                                className="p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 opacity-60 cursor-not-allowed"
                            >
                                <div className="flex items-center justify-center mb-3">
                                    <div className="p-3 rounded-lg bg-gray-100">
                                        <CreditCard className="h-8 w-8 text-gray-400" />
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-1">PayPal</h3>
                                <p className="text-sm text-gray-600">Coming Soon</p>
                            </button>
                        </div>

                        {/* Bank Transfer Sub-options */}
                        {paymentMethod === 'bank-transfer' && (
                            <div className="space-y-6">
                                <label className="block text-sm font-semibold text-gray-800">
                                    Choose Payment Option <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentSubMethod('upi')}
                                        className={`p-6 rounded-xl border-2 transition-all ${paymentSubMethod === 'upi'
                                            ? 'border-green-500 bg-green-50 shadow-lg'
                                            : 'border-gray-200 hover:border-green-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center mb-3">
                                            <div className={`p-3 rounded-lg ${paymentSubMethod === 'upi' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <Globe className="h-8 w-8 text-green-500" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">UPI Payment</h3>
                                        <p className="text-sm text-gray-600">Scan QR Code</p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentSubMethod('bank-account')}
                                        className={`p-6 rounded-xl border-2 transition-all ${paymentSubMethod === 'bank-account'
                                            ? 'border-green-500 bg-green-50 shadow-lg'
                                            : 'border-gray-200 hover:border-green-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center mb-3">
                                            <div className={`p-3 rounded-lg ${paymentSubMethod === 'bank-account' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <Building className="h-8 w-8 text-green-500" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">Bank Account</h3>
                                        <p className="text-sm text-gray-600">Direct Transfer</p>
                                    </button>
                                </div>

                                {/* UPI QR Code */}
                                {paymentSubMethod === 'upi' && (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border-2 border-blue-200">
                                        <h3 className="text-xl font-bold text-center mb-4">Scan QR Code to Pay</h3>
                                        <div className="flex justify-center mb-4">
                                            <div className="bg-white p-4 rounded-xl shadow-lg">
                                                <img
                                                    src={upiqr}
                                                    alt="UPI Payment QR Code"
                                                    className="w-64 h-64 object-contain"
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="font-semibold text-gray-800">UPI ID: societyforcyber@indianbk</p>
                                            <p className="text-sm text-gray-600">Use any UPI app (PhonePe, Google Pay, Paytm, etc.)</p>
                                        </div>
                                    </div>
                                )}

                                {/* Bank Account Details */}
                                {paymentSubMethod === 'bank-account' && (
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border-2 border-green-200">
                                        <h3 className="text-xl font-bold text-center mb-6">Bank Account Details</h3>
                                        <div className="space-y-4 max-w-md mx-auto">
                                            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                <span className="font-semibold text-gray-600">Account Name:</span>
                                                <span className="font-bold">Melange Publications</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                <span className="font-semibold text-gray-600">Account Number:</span>
                                                <span className="font-bold">736805000791</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                <span className="font-semibold text-gray-600">Account Type:</span>
                                                <span className="font-bold">Current Account</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                <span className="font-semibold text-gray-600">Bank Name:</span>
                                                <span className="font-bold">ICICI Bank</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                <span className="font-semibold text-gray-600">IFSC Code:</span>
                                                <span className="font-bold">ICIC0007368</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                <span className="font-semibold text-gray-600">SWIFT Code:</span>
                                                <span className="font-bold">ICICINBBCTS</span>
                                            </div>
                                            <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                                                <span className="font-semibold text-gray-600">Branch:</span>
                                                <span className="font-bold">Villianur, Puducherry</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Transaction ID */}
                                {paymentSubMethod && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-800">
                                                Transaction ID / Reference Number
                                            </label>
                                            <input
                                                type="text"
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="Enter your transaction ID"
                                            />
                                        </div>

                                        {/* Payment Screenshot Upload */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-800">
                                                Upload Payment Screenshot <span className="text-red-500">*</span>
                                            </label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-all">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        try {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const compressed = await compressImage(file);
                                                                setPaymentScreenshot(compressed);
                                                            }
                                                        } catch (error) {
                                                            Swal.fire({
                                                                icon: 'error',
                                                                title: 'Upload Failed',
                                                                text: 'Failed to upload screenshot',
                                                                confirmButtonColor: '#dc2626',
                                                            });
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="payment-screenshot"
                                                />
                                                <label htmlFor="payment-screenshot" className="cursor-pointer">
                                                    {paymentScreenshot ? (
                                                        <div className="space-y-3">
                                                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                                                            <p className="text-sm font-semibold text-green-600">Screenshot uploaded!</p>
                                                            <div className="mt-4 border-2 border-green-200 rounded-lg p-2 bg-green-50">
                                                                <img
                                                                    src={paymentScreenshot}
                                                                    alt="Payment Screenshot"
                                                                    className="max-h-40 mx-auto rounded"
                                                                />
                                                            </div>
                                                            <p className="text-xs text-gray-500">Click to change</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <CreditCard className="h-12 w-12 text-gray-400 mx-auto" />
                                                            <p className="text-sm font-semibold text-gray-700">Click to upload payment screenshot</p>
                                                            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                {selectedCategory && paymentMethod && (paymentMethod === 'paypal' || (paymentMethod === 'bank-transfer' && paymentSubMethod && paymentScreenshot)) && (
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300"
                    >
                        Submit Registration
                    </button>
                )}
            </form>
        </div>
    );
};

export default SimplifiedRegistrationForm;
