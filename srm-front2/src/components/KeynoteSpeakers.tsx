import { useState } from 'react';
import { Scroll, Globe, Mail, BookOpen, Award, GraduationCap, Briefcase, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import PageTransition from './PageTransition';
import Speaker1 from "./images/speaker/s1.png"
import Speaker2 from "./images/g.jpg"
import Speaker3 from "./images/speaker/s3.png"

interface Speaker {
  id: number;
  name: string;
  title: string;
  institution: string;
  image: string;
  education: string[];
  experience: string[];
  research: string[];
  awards: string[];
  contact?: {
    email?: string;
    website?: string;
    scholar?: string;
  };
}

const speakers: Speaker[] = [
  {
    id: 1,
    name: "Associate Professor Ts Dr Tan Kian Lam (Andrew)",
    title: "Dean, School of Digital Technology",
    institution: "Universiti Sains Malaysia",
    image: Speaker1,
    education: [
      "PhD (Computer Science), Universite Grenoble Alpes, France",
      "PhD (Computer Science), Universiti Sains Malaysia, Malaysia",
      "Master of Computer Science (Information and Knowledge Engineering), Universiti Sains Malaysia",
      "Bachelor of Computer Science (Computing and Software Engineering), Universiti Sains Malaysia",
      "Google Data Analytics Professional Certificate",
      "Google Advanced Data Analytics Professional Certificate"
    ],
    experience: [
      "Successfully launched DiGiT Learning Model, ensuring 100% job placement for 1st cohort students after one year of study",
      "Visiting Scientist at Universite Grenoble Alpes (2016), focusing on lifelogging and tourism using machine learning",
      "Adjunct Researcher at International e-Tourism Research Center at Chengdu University, China",
      "Advisor at National Child Data Centre (NCDC) for comprehensive child data management",
      "Ambassador of Laboratoire d'Informatique de Grenoble, France",
      "Software Engineer at Intel, contributing to automation software solutions in the United States, India, and China"
    ],
    research: [
      "Data Science",
      "Digital Heritage",
      "E-Tourism",
      "Extended-Reality",
      "Gamification",
      "Information Retrieval",
      "Mobile Computing",
      "Education"
    ],
    awards: [
      "Innovation Award for Most Impactful Academia-Industry Collaboration (Commercial) from MOSTI (2023)",
      "Best result in International Evaluation Challenge in Information Retrieval, CLEF 2013",
      "EC Innovation Award for Intel's 'Netbatch Utilization and Machine Allocation Center (NutMac)' project (2009)",
      "Gold Winner of National Research Innovation Competition (NRIC)",
      "Bronze Winner of International Exposition of Research and Inventions (PECIPTA)",
      "Recognized as one of the Young Rising Stars from Universiti Pendidikan Sultan Idris",
      "Over 80 proceedings and journal articles in high impact journals"
    ]
  },
  {
    id: 2,
    name: "Dr. Sam Goundar",
    title: "Academic Programme Director, Associate Professor",
    institution: "University of Central Asia • Canada",
    image: Speaker2,
    education: [
      "PhD in Computer Science",
      "Extensive academic qualifications across multiple disciplines"
    ],
    experience: [
      "International academic with over 35+ years of teaching experience across 13 universities in 11 countries",
      "Visiting Professor of Data Science at SRM University, Chennai, India",
      "Adjunct Research Professor of Computer Science at Fiji National University",
      "Adjunct Professor of Artificial Intelligence at Mohan Babu University, Tirupati, India",
      "Former Adjunct Professor of Information Technology at The University of Fiji (2021-2023)",
      "Former Affiliate Professor of Information Technology at Pontificia Universidad Católica del Perú, Lima, Peru (2016-2020)",
      "Senior Lecturer in IT at RMIT University",
      "Senior Lecturer in ICT at British University Vietnam",
      "Senior Lecturer in IS at The University of the South Pacific, Suva, Fiji",
      "Research Fellow at United Nations University",
      "Visiting Professor at Hassan 1st University, Morocco (June-July 2019)",
      "Visiting Professor at Bahir Dar University, Ethiopia (June-July 2018)"
    ],
    research: [
      "Blockchains and Cryptocurrencies",
      "Fog Computing",
      "Cloud Computing",
      "Creative Computing",
      "Advanced Intelligent Systems",
      "Data Science",
      "Artificial Intelligence"
    ],
    awards: [
      "Editor-in-Chief of International Journal of Blockchains and Cryptocurrencies (IJBC)",
      "Editor-in-Chief of International Journal of Fog Computing (IJFC)",
      "Editor-in-Chief of International Journal of Creative Computing (IJCrC)",
      "Editor-in-Chief of International Journal of Advanced Intelligent Systems and Engineering Science (IJAIASES)",
      "Editor-in-Chief (Emeritus) of International Journal of Cloud Applications and Computing (IJCAC)"
    ],
    contact: {
      scholar: "https://scholar.google.com"
    }
  },
  {
    id: 3,
    name: "Dr. R. Annie Uthra",
    title: "Professor and Head (Computational Intelligence)",
    institution: "SRM Institute of Science and Technology • Chennai",
    image: Speaker3,
    education: [
      "PhD in Computer Science",
      "Specialized training in Computational Intelligence and Machine Learning"
    ],
    experience: [
      "Professor and Head, Department of Computational Intelligence",
      "Faculty of Engineering & Technology, SRM Institute of Science and Technology",
      "Extensive teaching experience in advanced computer science subjects",
      "Research leadership in Machine Learning and IoT applications"
    ],
    research: [
      "Machine Learning",
      "Data Analytics",
      "Internet of Things (IoT)",
      "Energy Efficient Routing",
      "Wireless Sensor Networks",
      "Database Management Systems",
      "Cloud Computing",
      "Computer Networks"
    ],
    awards: [
      "Published extensively in Machine Learning and Data Mining",
      "Expert in Compiler Design and Operating Systems",
      "Recognized for contributions to Wireless Sensor Networks research",
      "Teaching excellence in Data Structures and Algorithm Design"
    ],
    contact: {
      email: "annieu@srmist.edu.in"
    }
  }
];

const KeynoteSpeakers = () => {
  const [expandedSpeaker, setExpandedSpeaker] = useState<number | null>(null);

  const toggleSpeaker = (id: number) => {
    if (expandedSpeaker === id) {
      setExpandedSpeaker(null);
    } else {
      setExpandedSpeaker(id);
      // Smooth scroll to the card
      setTimeout(() => {
        const element = document.getElementById(`speaker-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-orange-50">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-[#F5A051] text-white py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="flex items-center justify-center mb-6">
              <Scroll className="w-12 h-12 mr-4 animate-pulse" />
              <h1 className="text-5xl md:text-6xl font-bold">Keynote Speakers</h1>
            </div>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto text-center">
              Distinguished experts sharing insights at ICMBNT 2026
            </p>
          </div>
        </header>

        <main className="container mx-auto py-16 px-4">
          {/* Introduction */}
          <div className="max-w-5xl mx-auto mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Meet Our Featured Speakers</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We are honored to present our distinguished keynote speakers for ICMBNT 2026. These renowned experts
              will share their valuable insights and cutting-edge research across multidisciplinary domains.
            </p>
          </div>

          {/* Speakers Row */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  id={`speaker-${speaker.id}`}
                  className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                >
                  {/* Image Container */}
                  <div className="relative h-96 overflow-hidden">
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/400x500?text=Speaker";
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                    {/* Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-xl font-bold mb-1 line-clamp-2">{speaker.name}</h3>
                      <p className="text-sm opacity-90 mb-1">{speaker.title}</p>
                      <p className="text-xs opacity-75">{speaker.institution}</p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="p-6 bg-gradient-to-br from-blue-900 to-[#F5A051]">
                    <button
                      onClick={() => toggleSpeaker(speaker.id)}
                      className="w-full bg-white text-blue-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                    >
                      {expandedSpeaker === speaker.id ? (
                        <>
                          Hide Profile
                          <ChevronUp className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          View Profile
                          <ChevronDown className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expanded Details Section (Full Width Below) */}
          {expandedSpeaker !== null && (
            <div className="max-w-7xl mx-auto animate-slideDown">
              {speakers
                .filter((speaker) => speaker.id === expandedSpeaker)
                .map((speaker) => (
                  <div
                    key={speaker.id}
                    className="bg-white rounded-2xl shadow-2xl overflow-hidden border-t-4 border-[#F5A051]"
                  >
                    {/* Speaker Header in Expanded View */}
                    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-[#F5A051] text-white p-8">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <img
                          src={speaker.image}
                          alt={speaker.name}
                          className="w-32 h-32 object-cover rounded-2xl shadow-2xl border-4 border-white"
                        />
                        <div className="flex-1 text-center md:text-left">
                          <h2 className="text-3xl md:text-4xl font-bold mb-2">{speaker.name}</h2>
                          <p className="text-xl mb-1 opacity-95">{speaker.title}</p>
                          <p className="text-lg opacity-90">{speaker.institution}</p>

                          {/* Contact Icons */}
                          {speaker.contact && (
                            <div className="flex gap-3 mt-4 justify-center md:justify-start">
                              {speaker.contact.email && (
                                <a
                                  href={`mailto:${speaker.contact.email}`}
                                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all duration-300"
                                  aria-label="Email"
                                >
                                  <Mail className="w-5 h-5" />
                                </a>
                              )}
                              {speaker.contact.website && (
                                <a
                                  href={speaker.contact.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all duration-300"
                                  aria-label="Website"
                                >
                                  <Globe className="w-5 h-5" />
                                </a>
                              )}
                              {speaker.contact.scholar && (
                                <a
                                  href={speaker.contact.scholar}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all duration-300"
                                  aria-label="Google Scholar"
                                >
                                  <GraduationCap className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Content */}
                    <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50">
                      {/* Education */}
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-3 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">Education & Qualifications</h3>
                        </div>
                        <ul className="space-y-3">
                          {speaker.education.map((edu, index) => (
                            <li key={index} className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700">{edu}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      {/* Experience */}
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-r from-[#F5A051] to-orange-600 p-3 rounded-lg">
                            <Briefcase className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">Professional Experience</h3>
                        </div>
                        <ul className="space-y-3">
                          {speaker.experience.map((exp, index) => (
                            <li key={index} className="flex items-start gap-3 bg-orange-50 p-4 rounded-lg hover:bg-orange-100 transition-colors duration-300">
                              <div className="w-2 h-2 bg-[#F5A051] rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-700">{exp}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      {/* Research Interests */}
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-3 rounded-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">Research Interests</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {speaker.research.map((area, index) => (
                            <span
                              key={index}
                              className="bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 px-4 py-2 rounded-full text-sm font-medium hover:from-purple-200 hover:to-purple-300 transition-all duration-300 cursor-default"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </section>

                      {/* Awards & Recognition */}
                      <section>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-3 rounded-lg">
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800">Awards & Recognition</h3>
                        </div>
                        <ul className="space-y-3">
                          {speaker.awards.map((award, index) => (
                            <li key={index} className="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 transition-colors duration-300">
                              <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{award}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </main>

        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              max-height: 0;
            }
            to {
              opacity: 1;
              max-height: 5000px;
            }
          }

          .animate-slideDown {
            animation: slideDown 0.5s ease-out;
          }
        `}</style>
      </div>
    </PageTransition>
  );
};

export default KeynoteSpeakers;
