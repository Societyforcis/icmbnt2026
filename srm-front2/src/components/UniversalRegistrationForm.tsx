import React, { useState, useEffect } from 'react';
import { CreditCard, Building, CheckCircle, Globe, FileText } from 'lucide-react';
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

interface UserInfo {
    name: string;
    email: string;
    country: string;
    isAuthor: boolean;
}

const UniversalRegistrationForm: React.FC = () => {
    const [registrationType, setRegistrationType] = useState<'author' | 'listener' | ''>('');
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [paperDetails, setPaperDetails] = useState<PaperDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'bank-transfer' | 'paypal' | 'external' | ''>('');
    const [paymentSubMethod, setPaymentSubMethod] = useState<'upi' | 'bank-account' | ''>('');
    const [transactionId, setTransactionId] = useState('');
    const [paymentScreenshot, setPaymentScreenshot] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [amount, setAmount] = useState(0);
    const [registrationStatus, setRegistrationStatus] = useState<any>(null);

    // Registration fee categories
    const authorCategories = [
        { id: 'indian-author', label: 'Indian Author', price: 3500, currency: 'INR' },
        { id: 'foreign-author', label: 'Foreign Author', price: 150, currency: 'USD' },
    ];

    const listenerCategories = [
        { id: 'indian-listener', label: 'Indian Listener', price: 2500, currency: 'INR' },
        { id: 'foreign-listener', label: 'Foreign Listener', price: 100, currency: 'USD' },
    ];

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const email = localStorage.getItem('email');
            const userName = localStorage.getItem('name');

            // First, fetch user profile to get country
            let userCountry = 'India'; // Default value
            try {
                const profileResponse = await axios.get(`${API_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (profileResponse.data.user && profileResponse.data.user.country) {
                    userCountry = profileResponse.data.user.country;
                }
            } catch (error) {
                console.log('Could not fetch user profile, using default country');
            }

            // Check if user has submitted papers
            try {
                const response = await axios.get(`${API_URL}/api/registration/my-paper-details`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    setPaperDetails(response.data.paperDetails);
                    setUserInfo({
                        name: response.data.paperDetails.authorName,
                        email: response.data.paperDetails.authorEmail,
                        country: userCountry,
                        isAuthor: true
                    });
                    setRegistrationType('author');
                }
            } catch (error: any) {
                // User doesn't have a paper, they can only register as listener
                setUserInfo({
                    name: userName || email || 'User',
                    email: email || '',
                    country: userCountry,
                    isAuthor: false
                });
                setRegistrationType('listener');
            }
        } catch (error: any) {
            console.error('Error fetching user info:', error);
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
            if (error.response?.status !== 404) {
                console.error('Error checking registration status:', error);
            }
        }
    };

    useEffect(() => {
        if (userInfo) {
            checkRegistrationStatus();
        }
    }, [userInfo]);

    const handleCategoryChange = (categoryId: string, price: number) => {
        setSelectedCategory(categoryId);
        setAmount(price);
    };

    const handlePayPalPayment = () => {
        window.open('https://www.paypal.com/ncp/payment/3Q9N4H9ZKX24A', '_blank');
    };

    const handleExternalPayment = () => {
        window.open('https://melangepublications.com/payment_details.php', '_blank');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
                    registrationType,
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
                        <p>Your ${registrationType} registration has been submitted successfully!</p>
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
                        <p><strong>Name:</strong> {registrationStatus.authorName}</p>
                        {registrationStatus.paperTitle && <p><strong>Paper:</strong> {registrationStatus.paperTitle}</p>}
                        <p><strong>Amount:</strong> {registrationStatus.amount}</p>
                        <p><strong>Payment Method:</strong> {registrationStatus.paymentMethod}</p>
                        <p><strong>Registration Type:</strong> {registrationStatus.registrationType || 'Author'}</p>
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

            {/* User Info Section */}
            {userInfo && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
                    <h3 className="font-bold text-lg mb-4 text-blue-900">Your Information</h3>
                    <div className="space-y-2 text-sm">
                        <p><strong>Name:</strong> {userInfo.name}</p>
                        <p><strong>Email:</strong> {userInfo.email}</p>
                        <p><strong>Country:</strong> {userInfo.country} {userInfo.country === 'India' ? '🇮🇳' : '🌍'}</p>
                        <p><strong>Registration Type:</strong> <span className="text-blue-600 font-semibold">{registrationType === 'author' ? '👨‍🎓 Author' : '👥 Listener'}</span></p>
                    </div>
                </div>
            )}

            {/* Paper Details for Authors */}
            {registrationType === 'author' && paperDetails && (
                <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded">
                    <h3 className="font-bold text-lg mb-4 text-green-900 flex items-center">
                        <FileText className="mr-2" size={20} />
                        Your Paper Details
                    </h3>
                    <div className="space-y-2 text-sm">
                        <p><strong>Submission ID:</strong> {paperDetails.submissionId}</p>
                        <p><strong>Paper Title:</strong> {paperDetails.paperTitle}</p>
                        <p><strong>Category:</strong> {paperDetails.category}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Registration Category */}
                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-4">
                        Registration Category <span className="text-red-500">*</span>
                    </label>
                    {userInfo && (
                        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>Country:</strong> {userInfo.country} 
                                {userInfo.country === 'India' ? ' 🇮🇳' : ' 🌍'}
                            </p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(registrationType === 'author' ? authorCategories : listenerCategories).map((category) => {
                            // Determine if this category matches the user's country
                            const isIndian = userInfo?.country === 'India';
                            const categoryMatches = 
                                (isIndian && category.id.includes('indian')) || 
                                (!isIndian && category.id.includes('foreign'));
                            
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                        handleCategoryChange(category.id, category.price);
                                    }}
                                    className={`p-6 rounded-xl border-2 transition-all ${
                                        categoryMatches 
                                            ? selectedCategory === category.id
                                                ? 'border-blue-500 bg-blue-50 shadow-lg'
                                                : 'border-blue-300 bg-blue-50 hover:border-blue-500'
                                            : 'border-gray-200 hover:border-blue-300 opacity-70'
                                    }`}
                                >
                                    <h3 className="font-bold text-lg mb-1">{category.label}</h3>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {category.currency === 'INR' ? '₹' : '$'}{category.price}
                                    </p>
                                    {categoryMatches && (
                                        <p className="text-xs text-blue-700 mt-2 font-semibold">✓ Your Category</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Method Selection */}
                {selectedCategory && (
                    <div className="space-y-6">
                        <label className="block text-sm font-semibold text-gray-800">
                            <CreditCard className="inline h-4 w-4 mr-2 text-red-500" />
                            Select Payment Method <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                onClick={() => setPaymentMethod('paypal')}
                                className={`p-6 rounded-xl border-2 transition-all ${paymentMethod === 'paypal'
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex items-center justify-center mb-3">
                                    <div className={`p-3 rounded-lg ${paymentMethod === 'paypal' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                        <CreditCard className="h-8 w-8 text-blue-500" />
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-1">PayPal</h3>
                                <p className="text-sm text-gray-600">Direct Payment</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('external')}
                                className={`p-6 rounded-xl border-2 transition-all ${paymentMethod === 'external'
                                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                                    : 'border-gray-200 hover:border-purple-300'
                                    }`}
                            >
                                <div className="flex items-center justify-center mb-3">
                                    <div className={`p-3 rounded-lg ${paymentMethod === 'external' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                        <Globe className="h-8 w-8 text-purple-500" />
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-1">Melange Portal</h3>
                                <p className="text-sm text-gray-600">External Payment</p>
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

                                {/* Transaction ID and Screenshot */}
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

                        {/* PayPal Payment */}
                        {paymentMethod === 'paypal' && (
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border-2 border-blue-300">
                                <h3 className="text-xl font-bold text-center mb-4">PayPal Payment</h3>
                                <p className="text-center text-gray-700 mb-6">
                                    Click the button below to proceed to PayPal for secure payment
                                </p>
                                <button
                                    type="button"
                                    onClick={handlePayPalPayment}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                                >
                                    Pay with PayPal - ${amount}
                                </button>
                                <p className="text-center text-sm text-gray-600 mt-4">
                                    After successful payment, return to complete your registration
                                </p>
                            </div>
                        )}

                        {/* External Payment Portal */}
                        {paymentMethod === 'external' && (
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border-2 border-purple-300">
                                <h3 className="text-xl font-bold text-center mb-4">Melange Publications Payment Portal</h3>
                                <p className="text-center text-gray-700 mb-6">
                                    Click the button below to visit the Melange Publications payment portal
                                </p>
                                <button
                                    type="button"
                                    onClick={handleExternalPayment}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
                                >
                                    Go to Melange Publications
                                </button>
                                <p className="text-center text-sm text-gray-600 mt-4">
                                    You will be directed to the external payment portal
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                {selectedCategory && paymentMethod && (
                    paymentMethod === 'paypal' ||
                    paymentMethod === 'external' ||
                    (paymentMethod === 'bank-transfer' && paymentSubMethod && paymentScreenshot)
                ) && (
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

export default UniversalRegistrationForm;
