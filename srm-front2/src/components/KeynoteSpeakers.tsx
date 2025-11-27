import { Scroll, Globe, Mail, BookOpen, Award, Linkedin } from 'lucide-react';
import PageTransition from './PageTransition';
import { Link } from 'react-router-dom';
import G from "./images/g.jpg"
const KeynoteSpeakers = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header Section */}
        <header className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Keynote Speakers</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
              Distinguished experts sharing insights at ICMBNT 2026
            </p>
          </div>
        </header>

        <main className="container mx-auto py-12 px-4">
          {/* Introduction */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center mb-6">
              <Scroll className="w-8 h-8 text-[#F5A051] mr-3" />
              <h2 className="text-3xl font-bold text-gray-800">Featured Speakers</h2>
            </div>
            <p className="text-lg text-gray-600">
              We are honored to present our distinguished keynote speakers for ICMBNT 2026. These renowned experts 
              will share their valuable insights and cutting-edge research across multidisciplinary domains.
            </p>
          </div>

          {/* Speakers Section */}
          <div className="max-w-4xl mx-auto grid gap-10">
            {/* Sam Goundar Speaker Card */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-8 bg-[#fcf8e3]">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 flex justify-center mb-6 md:mb-0">
                    <img
                      src={G}
                      alt="Sam Goundar"
                      className="w-48 h-48 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/300?text=Sam+Goundar";
                      }}
                    />
                  </div>
                  <div className="md:w-2/3 md:pl-8">
                    <h3 className="text-2xl font-bold text-gray-900">Prof. Dr. Sam Goundar</h3>
                    <p className="text-xl text-[#F5A051] font-medium">Senior Lecturer in Information Technology</p>
                    <p className="text-lg text-gray-700 mt-1">RMIT University • Vietnam</p>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <Award className="w-5 h-5 text-[#F5A051] mt-1 mr-2 flex-shrink-0" />
                        <p className="text-gray-800">
                          International academic and researcher with over 35 years of teaching experience across 
                          13 universities in 11 different countries
                        </p>
                      </div>
                      
                      <div className="flex items-start">
                        <BookOpen className="w-5 h-5 text-[#F5A051] mt-1 mr-2 flex-shrink-0" />
                        <p className="text-gray-800">
                          Editor-in-Chief of multiple international journals; author of 20 books and over 140 research articles
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-3">
                      <a
                        href="mailto:sam.goundar@rmit.edu.vn"
                        className="text-[#F5A051] hover:text-[#e08c3e]"
                        aria-label="Email Sam Goundar"
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                      <a
                        href="https://www.rmit.edu.vn/faculty/goundar-sam"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#F5A051] hover:text-[#e08c3e]"
                        aria-label="Sam Goundar's website"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                      <a
                        href="https://www.linkedin.com/in/sam-goundar-1928223a/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#F5A051] hover:text-[#e08c3e]"
                        aria-label="Sam Goundar's LinkedIn profile"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    </div>
                    
                    <div className="mt-6">
                      <Link
                        to="/keynote-speakers/sam-goundar"
                        className="inline-flex items-center px-4 py-2 bg-[#F5A051] text-white rounded-md hover:bg-[#e08c3e] transition-colors text-sm font-medium"
                      >
                        View Full Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* More speakers can be added here */}
         
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default KeynoteSpeakers;
