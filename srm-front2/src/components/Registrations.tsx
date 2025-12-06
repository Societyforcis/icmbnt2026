import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowRight,
  Download,
  Copy,
  Check,
  CreditCard,
  FileText,
  Mail,
  Building,
  GraduationCap,
  Briefcase,
  Globe,
  ExternalLink,
  AlertCircle,
  Lock
} from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import RegistrationCountdown from './RegistrationCountdown';
import SimplifiedRegistrationForm from './SimplifiedRegistrationForm';

const MemoizedRegistrationCountdown = React.memo(RegistrationCountdown);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const AccessDeniedPage: React.FC = () => (
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
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <Lock className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-4">
          Registration is only available for <span className="font-semibold">accepted authors</span>.
        </p>
        <p className="text-gray-600 mb-6">
          Your paper has not been accepted yet. Please wait for the final acceptance decision from the conference organizers.
        </p>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Note:</span> Once your paper is accepted, you will be able to access the registration page to complete your registration for ICMBNT 2026.
          </p>
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
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofName, setPaymentProofName] = useState("No file selected");
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institution: '',
    address: '',
    country: '',
    paperTitle: '',
    transactionId: '',
    date: '',
    amount: '',
  });

  const bankDetailsRef = useRef<HTMLDivElement>(null);

  // Define ALL callback hooks SECOND
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPaymentProof(file);
      setPaymentProofName(file.name);
    }
  }, []);

  const copyAllBankDetails = useCallback(() => {
    if (bankDetailsRef.current) {
      const allDetails = bankDetailsRef.current.innerText;
      navigator.clipboard.writeText(allDetails);
      setCopiedField('all');
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCategory(e.target.value);
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData, 'Category:', selectedCategory);

    Swal.fire({
      icon: 'success',
      title: 'Registration Successful',
      text: 'Your registration has been submitted successfully!',
      confirmButtonColor: '#3085d6'
    });
  }, [formData, selectedCategory]);

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

    checkAcceptanceStatus();
  }, []);

  // NOW render based on state - all hooks have been called
  if (loading) {
    return <LoadingPage />;
  }

  if (!isAccepted) {
    return <AccessDeniedPage />;
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
                      <th scope="col" className="px-6 py-4 text-right text-xs sm:text-sm font-medium uppercase tracking-wider">
                        Fee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <GraduationCap className="mr-2 text-blue-800" size={18} />
                        Research Scholars/Students
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">2750 INR</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Building className="mr-2 text-blue-800" size={18} />
                        Academicians
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">3500 INR</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Briefcase className="mr-2 text-blue-800" size={18} />
                        Industry and Others
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">4000 INR</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800 flex items-center">
                        <Globe className="mr-2 text-blue-800" size={18} />
                        Foreign Authors
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm sm:text-base text-right font-semibold text-gray-800">
                        <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-md">100 USD</span>
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