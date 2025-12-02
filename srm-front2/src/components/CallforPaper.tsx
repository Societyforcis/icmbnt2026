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
              date="15 February 2026"
              isHighlighted={true}
            />
            <DateCard
              title="Acceptance"
              date="28 February 2026"
            />
            <DateCard
              title="Registration Date"
              date="10 March 2026"
            />
            <DateCard
              title="Date of Conference"
              date="13 March 2026 & 14 March 2026"
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
              <p><strong>Manuscript Submission Deadline:</strong> 15 February 2026</p>
            </div>
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