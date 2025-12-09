import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowRight,
  Download,
  Copy,
  Check,
  CreditCard,
  FileText,
  Building,
  GraduationCap,
  Briefcase,
  Globe,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import RegistrationCountdown from './RegistrationCountdown';
import SimplifiedRegistrationForm from './SimplifiedRegistrationForm';

const MemoizedRegistrationCountdown = React.memo(RegistrationCountdown);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';



const RegistrationInfoPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
    <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-[#F5A051] text-white py-12 sm:py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-30"></div>
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-block mb-6">
          <div className="w-16 h-1 bg-[#F5A051] mx-auto mb-2"></div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Registration</h1>
          <div className="w-16 h-1 bg-[#F5A051] mx-auto mt-2"></div>
        </div>
        <p className="text-lg md:text-xl max-w-3xl mx-auto font-light">
          International Conference on Multidisciplinary Breakthroughs and NextGen Technologies
        </p>
      </div>
    </div>

    <div className="container mx-auto px-4 py-16">
      {/* Information Banner */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 border-l-4 border-[#F5A051] p-6 rounded-lg shadow-md">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">How to Register for ICMBNT 2026</h3>
              <p className="text-gray-700 mb-3">
                Registration for the conference is available to all participants. To complete your registration:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li><span className="font-semibold">Submit your research paper</span> through our submission portal</li>
                <li><span className="font-semibold">Wait for acceptance notification</span> from our review committee</li>
                <li><span className="font-semibold">Once accepted</span>, you can access the registration form and complete payment</li>
              </ol>
              <p className="text-sm text-gray-600 mt-4 italic">
                💡 Below you'll find all the registration fees and payment details to help you prepare for your registration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Fee Table */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center mb-6">
          <CreditCard className="text-[#F5A051] text-2xl mr-4" />
          <h2 className="text-3xl font-bold text-[#F5A051]">REGISTRATION FEE DETAILS</h2>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">
                    SCIS Members
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider">
                    Non-SCIS Members
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td rowSpan={3} className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-800 bg-gray-100">
                    Indian Participant
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800 flex items-center">
                    <GraduationCap className="mr-2 text-blue-800" size={20} />
                    Students
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-md">4500 INR (50 USD)</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">5850 INR (65 USD)</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800 flex items-center">
                    <Building className="mr-2 text-blue-800" size={20} />
                    Faculty/Research Scholars
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-md">6750 INR (75 USD)</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">7500 INR (85 USD)</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800 flex items-center">
                    <Briefcase className="mr-2 text-blue-800" size={20} />
                    Listeners
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-md">2500 INR</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">3500 INR</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td rowSpan={2} className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-800 bg-gray-100">
                    Foreign Participant
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800 flex items-center">
                    <Globe className="mr-2 text-blue-800" size={20} />
                    Authors
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-md">300 USD</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">350 USD</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800 flex items-center">
                    <Briefcase className="mr-2 text-blue-800" size={20} />
                    Listeners
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-md">100 USD</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">150 USD</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td rowSpan={2} className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-800 bg-gray-100">
                    Indonesian Participant
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800 flex items-center">
                    <Globe className="mr-2 text-blue-800" size={20} />
                    Authors
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-md">17,00,000 IDR</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">26,00,000 IDR</span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800 flex items-center">
                    <Briefcase className="mr-2 text-blue-800" size={20} />
                    Listeners
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-md">12,00,000 IDR</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-800">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-md">15,00,000 IDR</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fee Includes Section */}
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Conference fee includes:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                Conference kit
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                Certificate
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                Proceedings
              </li>
              {/* <li className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                Non-Scopus Journal
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 text-green-600 mr-2" />
                Lunch with refreshments
              </li> */}
            </ul>
            <p className="mt-4 text-sm text-gray-600 italic">
              * These fees do not include accommodation or Scopus/WOS publication fees.
            </p>
          </div>
        </div>

        {/* Note about Scopus */}
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-400 mt-1 mr-3" size={20} />
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Note:</span> Authors interested in publishing their articles in Scopus/WOS indexed journals will be charged additional fees based on the journal.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <FileText className="mx-auto h-16 w-16 text-[#F5A051] mb-4" />
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Submit Your Paper?</h3>
          <p className="text-gray-600 mb-6">
            Submit your research paper to participate in ICMBNT 2026. Once your paper is accepted, you'll be able to complete your registration.
          </p>
          <a
            href="/call-for-papers"
            className="inline-flex items-center bg-gradient-to-r from-blue-800 to-[#F5A051] text-white px-8 py-3 rounded-lg font-medium transition-all hover:shadow-lg"
          >
            View Call for Papers
            <ArrowRight size={20} className="ml-2" />
          </a>
        </div>
      </div>
    </div>
  </div>
);

// Loading Component
const LoadingPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      <p className="mt-4 text-gray-600">Verifying acceptance status...</p>
    </div>
  </div>
);

const Registrations: React.FC = () => {
  // Define ALL state hooks FIRST
  const [activeTab, setActiveTab] = useState<'fee' | 'form'>('fee');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<any>(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

  const bankDetailsRef = useRef<HTMLDivElement>(null);

  // Define ALL callback hooks SECOND
  const copyAllBankDetails = useCallback(() => {
    if (bankDetailsRef.current) {
      const allDetails = bankDetailsRef.current.innerText;
      navigator.clipboard.writeText(allDetails);
      setCopiedField('all');
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleDownload = useCallback((url: string, filename: string) => {
    Swal.fire({
      title: 'Downloading...',
      text: `Preparing ${filename} for download`,
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      showConfirmButton: false
    });

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download file (Status: ${response.status})`);
        }
        return response.blob();
      })
      .then(blob => {
        Swal.close();

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        Swal.fire({
          icon: 'success',
          title: 'Download Started',
          text: `${filename} is being downloaded`,
          timer: 2000,
          showConfirmButton: false
        });
      })
      .catch(error => {
        console.error('Download error:', error);
        Swal.close();

        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: `${error.message}. Please try again later or contact support.`,
          confirmButtonColor: '#3085d6'
        });
      });
  }, []);



  // Define effect hook THIRD
  useEffect(() => {
    const checkAcceptanceStatus = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem('email');
        const token = localStorage.getItem('token');

        console.log('Registration check - Email from storage:', email);
        console.log('Registration check - Token from storage:', token ? 'Present' : 'Missing');

        if (!email || !token) {
          console.log('Missing email or token for acceptance check');
          setIsAccepted(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/api/auth/check-acceptance-status`,
          {
            params: { email },
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        console.log('Acceptance check response:', response.data);
        setIsAccepted(response.data.isAccepted || false);
      } catch (error) {
        console.error('Error checking acceptance status:', error);
        setIsAccepted(false);
      } finally {
        setLoading(false);
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

        console.log('Membership check response:', response.data);
        setMembershipStatus(response.data);
      } catch (error) {
        console.error('Error checking membership status:', error);
        setMembershipStatus({ isMember: false });
      } finally {
        setLoadingMembership(false);
      }
    };

    checkAcceptanceStatus();
    checkMembershipStatus();
  }, []);

  // NOW render based on state - all hooks have been called
  if (loading) {
    return <LoadingPage />;
  }

  if (!isAccepted) {
    return <RegistrationInfoPage />;
  }

  // Main component JSX
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Rest of your component remains the same */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-[#F5A051] text-white py-12 sm:py-16 md:py-24 overflow-hidden">
        {/* Header content */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 md:w-32 md:h-32 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 md:w-40 md:h-40 border-4 border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 border-4 border-white transform -translate-y-1/2"></div>
        </div>

        <div className="absolute inset-0 bg-black opacity-30"></div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-block mb-6">
            <div className="w-16 h-1 bg-[#F5A051] mx-auto mb-2"></div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Registration</h1>
            <div className="w-16 h-1 bg-[#F5A051] mx-auto mt-2"></div>
          </div>
          <p className="text-lg md:text-xl max-w-3xl mx-auto font-light">
            International Conference on Multidisciplinary Breakthroughs and NextGen Technologies
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="mb-12">
          <MemoizedRegistrationCountdown />
        </div>

        {/* SCIS Membership Status Banner */}
        {!loadingMembership && membershipStatus && (
          <div className={`mb-6 border-l-4 p-4 rounded ${membershipStatus.isMember
              ? 'bg-green-50 border-green-500'
              : 'bg-yellow-50 border-yellow-500'
            }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {membershipStatus.isMember ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
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
                      You are eligible for SCIS member discounted registration fees. Your discount will be automatically applied during registration.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-yellow-800">
                      Not a SCIS Member
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      You will be charged non-member registration fees. Consider becoming a SCIS member to enjoy discounted rates!
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Important:</span> Registration deadline is <span className="font-bold">5 February 2026</span>. Complete your registration before the deadline!
              </p>
            </div>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('fee')}
            className={`pb-4 px-4 text-base sm:text-lg font-medium ${activeTab === 'fee'
              ? 'text-blue-800 border-b-2 border-blue-800'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            type="button"
          >
            Conference Fee & Payment Details
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-4 px-4 text-base sm:text-lg font-medium ${activeTab === 'form'
              ? 'text-blue-800 border-b-2 border-blue-800'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            type="button"
          >
            Registration Form
          </button>
        </div>

        {/* Fee Information Tab - renders conditionally */}
        {activeTab === 'fee' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Fee section content */}
            <div className="p-6 sm:p-8 md:p-10 border-b border-gray-100">
              {/* ... fee section content ... */}
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 flex items-start">
                <CreditCard className="text-blue-800 mr-3 mt-1" size={28} />
                Conference Fee
                <span className="text-sm text-gray-500 font-normal ml-3 mt-3">(Excluding Publication Fee)</span>
              </h2>

              <p className="text-gray-600 mb-8">
                Participants are requested to register the Conference. The Conference fee must be paid either through Demand Draft (DD) or online payment with the following bank A/c details.
              </p>

              {/* Fee Table */}
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Category
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs sm:text-sm font-medium uppercase tracking-wider">
                        SCIS Members
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Non-SCIS Members
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Indian Participant Section */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td rowSpan={3} className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-bold text-gray-800 bg-gray-100">
                        Indian Participant
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <GraduationCap className="mr-2 text-blue-800" size={18} />
                        Students
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-md">4500 INR (50 USD)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">5850 INR (65 USD)</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Building className="mr-2 text-blue-800" size={18} />
                        Faculty/Research Scholars
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-md">6750 INR (75 USD)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">7500 INR (85 USD)</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Briefcase className="mr-2 text-blue-800" size={18} />
                        Listeners
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-md">2500 INR</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">3500 INR</span>
                      </td>
                    </tr>

                    {/* Foreign Participant Section */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td rowSpan={2} className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-bold text-gray-800 bg-gray-100">
                        Foreign Participant
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Globe className="mr-2 text-blue-800" size={18} />
                        Authors
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-md">300 USD</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">350 USD</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Briefcase className="mr-2 text-blue-800" size={18} />
                        Listeners
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-md">100 USD</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">150 USD</span>
                      </td>
                    </tr>

                    {/* Indonesian Participant Section */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td rowSpan={2} className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-bold text-gray-800 bg-gray-100">
                        Indonesian Participant
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Globe className="mr-2 text-blue-800" size={18} />
                        Authors
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-md">17,00,000 IDR</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">26,00,000 IDR</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Briefcase className="mr-2 text-blue-800" size={18} />
                        Listeners
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-green-100 text-green-800 py-1 px-2 rounded-md">12,00,000 IDR</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">15,00,000 IDR</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Note */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                <div className="flex items-start">
                  <AlertCircle className="text-yellow-400 mt-1" size={20} />
                  <p className="ml-3 text-sm text-yellow-700">
                    <span className="font-medium">Note:</span> The authors who are interested to publish their articles in
                    Scopus / WOS extra payment will be charged based on the journal.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-8 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Conference fee includes:</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Conference kit</li>
                  <li>Certificate</li>
                  <li>Proceedings</li>
                  <li>Non-Scopus Journal</li>
                  <li>Lunch with refreshments</li>
                </ul>
                <p className="mt-3 text-sm text-gray-500 italic">These fees do not include accommodation.</p>
              </div>

              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FileText className="mr-2 text-blue-800" />
                  Required Forms
                </h3>
                <p className="text-gray-600 mb-4">
                  After making your payment, download the Registration form and Copyright form, fill it out and
                  email it to <span className="font-medium text-blue-800">icmbnt2026@gmail.com</span> along with your payment information.
                  The payee is accountable for all bank charges.
                </p>

                {/* Updated download buttons */}
                <div className="flex flex-wrap gap-4 mt-6">
                  <button
                    onClick={() => handleDownload('/documents/e.pdf', 'ICMBNT_Copyright_Form.pdf')}
                    className="flex items-center text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-lg"
                    type="button"
                  >
                    <Download size={18} className="mr-2" />
                    <span>Download Copyright Form</span>
                  </button>

                  <button
                    onClick={() => handleDownload('/documents/r.pdf', 'ICMBNT_Registration_Form.pdf')}
                    className="flex items-center text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-lg"
                    type="button"
                  >
                    <Download size={18} className="mr-2" />
                    <span>Download Registration Form</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="p-6 sm:p-8 md:p-10 bg-gray-50">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 flex items-center">
                <Building className="text-blue-800 mr-3" size={28} />
                Bank Details
              </h2>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" ref={bankDetailsRef}>
                <div className="space-y-4">
                  {/* Bank details content */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">Bank A/C Name:</p>
                    <p className="font-medium text-gray-900">MELANGE PUBLICATIONS</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">Bank A/C No:</p>
                    <p className="font-medium text-gray-900">736805000791</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">Bank Name:</p>
                    <p className="font-medium text-gray-900">ICICI BANK</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">Branch:</p>
                    <p className="font-medium text-gray-900">VILLIANUR, PUDUCHERRY</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 border-b border-gray-100">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">IFSC Code:</p>
                    <p className="font-medium text-gray-900">ICIC0007368</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2">
                    <p className="text-gray-600 font-medium mb-1 sm:mb-0 w-36">SWIFT Code:</p>
                    <p className="font-medium text-gray-900">ICICINBBCTS</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={copyAllBankDetails}
                  className="flex items-center bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                  type="button"
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check size={20} className="mr-2" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={20} className="mr-2" />
                      Copy Bank Details
                    </>
                  )}
                </button>
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setActiveTab('form')}
                  className="flex items-center bg-gradient-to-r from-blue-800 to-[#F5A051] text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                  type="button"
                >
                  <span>Proceed to Registration Form</span>
                  <ArrowRight size={20} className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form Tab - renders conditionally */}
        {activeTab === 'form' && (
          <SimplifiedRegistrationForm />
        )}

        {/* More Information */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-3">Need Help?</h3>
          <p className="text-gray-600">
            For any queries regarding registration or payment, please contact us at
            <a
              href="mailto:icmbnt2026@gmail.com"
              className="text-blue-800 hover:underline ml-1"
            >
              icmbnt2026@gmail.com
            </a>
          </p>

          <div className="flex justify-center mt-6 space-x-4">
            <a
              href="#"
              className="text-gray-600 hover:text-blue-800 flex items-center"
            >
              <FileText size={16} className="mr-1" />
              Conference Brochure
              <ExternalLink size={14} className="ml-1" />
            </a>

            <a
              href="#"
              className="text-gray-600 hover:text-blue-800 flex items-center"
            >
              <Globe size={16} className="mr-1" />
              Conference Website
              <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        </div>
      </div >
    </div >
  );
};

// Export with React.memo to prevent unnecessary re-renders
export default Registrations;