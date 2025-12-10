import { FaCalendarAlt, FaFileAlt, FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const CallForPapers = () => {
  const navigate = useNavigate();

  const handleSubmissionClick = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      Swal.fire({
        title: 'Login Required',
        text: 'You need to login before submitting a paper',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#F5A051',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Login Now',
        cancelButtonText: 'Sign Up'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          navigate('/signin');
        }
      });
    } else {
      navigate('/paper-submission');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-20">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">CALL FOR PAPERS</h1>
          <div className="w-24 h-1 bg-white mx-auto mb-6"></div>
          <p className="text-lg md:text-xl max-w-3xl mx-auto">
            International Conference on Multidisciplinary Breakthroughs and NextGen Technologies (ICMBNT 2026)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Invitation Section */}
        <section className="mb-16">
          <p className="text-lg leading-relaxed mb-8 text-gray-700">
            We invite researchers, scholars, and practitioners to contribute to the ICMBNT conference
            through paper submissions. Share your innovative research, insights, and perspectives across
            diverse disciplines. Propose engaging sessions and tracks that align with the conference
            themes, fostering a collaborative environment.
          </p>

          <div className="mt-8 space-y-2">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Subject Domains:</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>STEM (Science, Technology, Engineering & Mathematics)</li>
              <li>Education, Teaching, Learning & Assessment</li>
              <li>Arts, Humanities & Social Sciences</li>
              <li>Finance, Business, Management, Economics & Accounting</li>
              <li>Health and Life Sciences</li>
              <li>Sports and Physiotherapy</li>
            </ul>
          </div>
        </section>

        {/* Important Dates Section */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaCalendarAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-3xl font-bold text-[#F5A051]">IMPORTANT DATES</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DateCard
              title="Manuscript Submission Deadline"
              date="5 January 2026"
              isHighlighted={true}
            />
            <DateCard
              title="Acceptance"
              date="25 January 2026"
            />
            <DateCard
              title="Registration Date"
              date="5 February 2026"
            />
            <DateCard
              title="Date of Conference"
              date="12 March 2026 & 13 March 2026"
            />
          </div>
        </section>


        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaFileAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-3xl font-bold text-[#F5A051]">PAPER SUBMISSION</h2>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
            <p className="text-lg leading-relaxed mb-4 text-gray-700">
              We invite scholars, researchers, and professionals to contribute to the multidisciplinary
              discourse by submitting their insightful papers and abstracts. Join us in building a platform
              that celebrates diverse perspectives and fosters collaboration across a spectrum of research
              domains. Submit your work and be a part of the transformative dialogue at ICMBNT 2026.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleSubmissionClick}
                className="inline-flex items-center bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800 transition-colors duration-300"
              >
                <Link to="/paper-submission" className="flex items-center">
                  <FaFileAlt className="mr-2" />
                  Paper  Submission
                </Link>
              </button>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaExclamationTriangle className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-3xl font-bold text-[#F5A051]">INSTRUCTION TO AUTHORS</h2>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <ol className="list-decimal pl-5 space-y-5">
              <li className="text-gray-700">
                The length of the manuscript is restricted to 12 pages. The text should be in double
                column format. The first page of your submission should include the paper title,
                author name(s), affiliations, e-mail address and Keywords.
              </li>
              <li className="text-gray-700">
                ICMBNT 2026 organizers regard plagiarism as a serious professional misconduct. All
                submissions will be screened for plagiarism and when identified, the submission by
                the same author will be rejected.
              </li>
              <li className="text-gray-700">
                All manuscript that confirm to submission will be peer reviewed and evaluated based
                on originality, technical and / or research content/ depth, correctness, relevance to
                conference, contributions and readability.
              </li>
              <li className="text-gray-700">
                Acceptance of manuscript will be communicated to authors by e-mail.
              </li>
              <li className="text-gray-700">
                The authors of the accepted manuscripts will be allowed to make corrections in
                accordance with the suggestions of the reviewers and submit camera-ready paper
                within the stipulated deadline.
              </li>
              <li className="text-gray-700">
                Accepted and registered manuscript will be included in the conference proceedings.
              </li>
              <li className="text-gray-700">
                Authors must submit their manuscript to the Email- ID: <a href="mailto:icmbnt2026@gmail.com" className="text-[#F5A051] hover:underline">icmbnt2026@gmail.com</a>
              </li>
            </ol>
            <div className="mt-6 py-2 px-4 bg-blue-50 border-l-4 border-[#F5A051] text-gray-700">
              <p><strong>Manuscript Submission Deadline:</strong> 5 January 2026</p>
            </div>
          </div>
        </section>

        {/* Registration Fee Details Section */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaCalendarAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-3xl font-bold text-[#F5A051]">REGISTRATION FEE DETAILS</h2>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full border-collapse">
              {/* Table Header */}
              <thead>
                <tr className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">Category</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-bold">Type</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold">SCIS Members</th>
                  <th className="border border-gray-300 px-4 py-3 text-right font-bold">Non-SCIS Members</th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {/* Indian Participant Section */}
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td rowSpan={3} className="border border-gray-300 px-4 py-3 font-bold text-gray-800 bg-gray-100">
                    Indian Participant
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Students</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded font-medium">4,500 INR (50 USD)</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded font-medium">5,850 INR (65 USD)</span>
                  </td>
                </tr>
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Faculty/Research Scholars</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded font-medium">6,750 INR (75 USD)</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded font-medium">7,500 INR (85 USD)</span>
                  </td>
                </tr>
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Listeners</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded font-medium">2,500 INR</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded font-medium">3,500 INR</span>
                  </td>
                </tr>

                {/* Foreign Participant Section */}
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td rowSpan={2} className="border border-gray-300 px-4 py-3 font-bold text-gray-800 bg-gray-100">
                    Foreign Participant
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Authors</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded font-medium">300 USD</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded font-medium">350 USD</span>
                  </td>
                </tr>
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Listeners</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded font-medium">100 USD</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded font-medium">150 USD</span>
                  </td>
                </tr>

                {/* Indonesian Participant Section */}
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td rowSpan={2} className="border border-gray-300 px-4 py-3 font-bold text-gray-800 bg-gray-100">
                    Indonesian Participant
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Authors</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded font-medium">17,00,000 IDR</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded font-medium">26,00,000 IDR</span>
                  </td>
                </tr>
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 text-gray-700">Listeners</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded font-medium">12,00,000 IDR</span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded font-medium">15,00,000 IDR</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-[#F5A051] text-gray-700 rounded">
            <p className="text-sm"><strong>Note:</strong> Registration fees include conference kit, certificate, proceedings, and refreshments (excluding accommodation and publication fees).</p>
            <p className="text-sm mt-2"><strong>SCIS Members:</strong> Must have an active SCIS membership with admin approval to qualify for member rates.</p>
          </div>
        </section>

        {/* Listener Registration Section */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaFileAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-3xl font-bold text-[#F5A051]">LISTENER REGISTRATION</h2>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-[#F5A051] p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">👥 Not an Author? Register as a Listener!</h3>
            <p className="text-gray-700 mb-4">
              If you're interested in attending ICMBNT 2026 as a listener without submitting a research paper, you can still register for the conference. Listeners get access to all conference sessions, materials, and networking opportunities.
            </p>
            <div className="bg-white p-4 rounded mb-4 border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-800 mb-2">✓ What's Included for Listeners:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Access to all conference sessions and presentations</li>
                <li>• Conference kit and materials</li>
                <li>• Certificate of participation</li>
                <li>• Networking opportunities with researchers and industry professionals</li>
                <li>• Refreshments during the conference</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/registrations')}
                className="px-6 py-3 bg-gradient-to-r from-blue-900 to-[#F5A051] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Register as Listener
              </button>
              <button
                onClick={handleSubmissionClick}
                className="px-6 py-3 bg-white text-[#F5A051] font-semibold rounded-lg border-2 border-[#F5A051] hover:bg-orange-50 transition-all"
              >
                Submit Paper as Author
              </button>
            </div>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="mb-16">
          <div className="flex items-center mb-6">
            <FaCalendarAlt className="text-[#F5A051] text-2xl mr-4" />
            <h2 className="text-3xl font-bold text-[#F5A051]">PAYMENT METHODS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Melange Publications */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500 hover:shadow-xl transition-all">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  �
                </div>
                <h3 className="text-xl font-bold text-gray-800">Melange Publications</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Visit Melange Publications official payment portal for comprehensive payment and banking details.
              </p>
              <div className="bg-purple-50 p-3 rounded mb-4 text-sm">
                <p className="font-semibold text-purple-900">All Payment Options Available</p>
                <p className="text-purple-800">Complete banking information</p>
              </div>
              <a
                href="https://melangepublications.com/payment_details.php"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all w-full justify-center"
              >
                Visit Portal
                <span className="ml-2">→</span>
              </a>
            </div>

            {/* PayPal */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500 hover:shadow-xl transition-all">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  🔵
                </div>
                <h3 className="text-xl font-bold text-gray-800">PayPal</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Secure international payment option. Click below to proceed to our PayPal payment portal.
              </p>
              <div className="bg-blue-50 p-3 rounded mb-4 text-sm">
                <p className="font-semibold text-blue-900">Fast & Secure</p>
                <p className="text-blue-800">Accepted worldwide</p>
              </div>
              <a
                href="https://www.paypal.com/ncp/payment/3Q9N4H9ZKX24A"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all w-full justify-center"
              >
                Pay with PayPal
                <span className="ml-2">→</span>
              </a>
            </div>

            {/* Bank Transfer / UPI */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-500 hover:shadow-xl transition-all">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  �
                </div>
                <h3 className="text-xl font-bold text-gray-800">Bank Transfer / UPI</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Pay directly through bank transfer or UPI using Melange Publications account details or scan the QR code below.
              </p>
              <div className="bg-red-50 p-3 rounded mb-4 text-sm">
                <p className="font-semibold text-red-900">Account: Melange Publications</p>
                <p className="text-red-800">Account No: 736805000791</p>
                <p className="text-red-800">IFSC: ICIC0007368</p>
              </div>
              <a
                href="https://melangepublications.com/payment_details.php"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all w-full justify-center"
              >
                View Full Details
                <span className="ml-2">→</span>
              </a>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="mt-8 flex justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-orange-300">
              <h3 className="text-center font-bold text-gray-800 mb-4">💳 Scan & Pay with UPI</h3>
              <img 
                src="/image/bali/qr2.png" 
                alt="UPI QR Code for Payment" 
                className="w-48 h-48 object-contain mx-auto rounded-lg border-2 border-orange-300"
              />
              <p className="text-center text-sm text-gray-600 mt-4">
                Scan this QR code with any UPI app to make payment instantly
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <p className="text-sm text-yellow-900"><strong>⚠️ Important:</strong> After making your payment through any method, please complete your registration on our platform to confirm your participation.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

// DateCard Component
interface DateCardProps {
  title: string;
  date: React.ReactNode;
  isHighlighted?: boolean;
}

const DateCard: React.FC<DateCardProps> = ({ title, date, isHighlighted = false }) => {
  return (
    <div className={`rounded-lg overflow-hidden shadow-md transition-transform hover:-translate-y-1 duration-300 ${isHighlighted ? 'border-2 border-[#F5A051]' : 'border border-gray-200'}`}>
      <div className="bg-[#F5A051] text-white p-4">
        <h3 className="font-bold text-xl">{title}</h3>
      </div>
      <div className="bg-white p-4">
        <p className="text-gray-800 font-medium">{date}</p>
      </div>
    </div>
  );
};

export default CallForPapers;