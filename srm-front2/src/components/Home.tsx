// import React from 'react';
import { Calendar, MapPin, Users, Target, Compass, Globe } from 'lucide-react';
import Timeline from './Timeline';
import { Link } from 'react-router-dom';
import PageTransition from './PageTransition';
import SimpleCountdownTimer from "./CountdownTimer"
// Import images
// import Logo from './images/logo.jpeg';
import VenuePic from './images/srm_venue.jpeg'; // Changed to srm_venue.jpeg
import SmallLogo from './images/final.png';
import MadrasHighCourt from './images/Madras_High_Court.jpg';

const Home = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-900 to-[#F5A051] text-white">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10 container mx-auto px-4 py-16 text-center">



            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              International Conference on Multidisciplinary Breakthroughs and NextGen Technologies
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">
              (ICMBNT–2026)
            </h2>

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                <span>April 26 & 27, 2026</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                <span>SRM HOTEL - Maraimalai Nagar - CHENNAI - India</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Hybrid Conference (In-person + Virtual)</span>
              </div>
            </div>

            <p className="text-xl mb-8">
              Organized by<br />
              <span className="font-bold">Society for Cyber Intelligent Systems</span><br />
              Puducherry – India
            </p>

            <Link
              to="/signin"
              className="bg-[#F5A051] hover:bg-[#e08c3e] text-white font-bold py-3 px-8 rounded-md transition-colors duration-300 text-lg inline-block"
            >
              REGISTER NOW
            </Link>

            <div className="mt-8">
              <SimpleCountdownTimer />
            </div>
          </div>
        </div>

        {/* Venue Images Section - Now with Grid of Two Images */}
        <section id="conference-venue" className="py-12 bg-white scroll-mt-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-[#F5A051]">Conference Venue</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SRM Hotel Image */}
              <div className="relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <img
                  src={VenuePic}
                  alt="SRM Hotel - Conference Venue"
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">SRM HOTEL</h3>
                  <p>Maraimalai Nagar, Chennai</p>
                </div>
              </div>

              {/* Madras High Court Image */}
              <div className="relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <img
                  src={MadrasHighCourt}
                  alt="Madras High Court"
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">Conference Held at</h3>
                  <p>Chennai, Tamil Nadu</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Society Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center mb-8">
              <img src={SmallLogo} alt="Society Logo" className="h-16 mr-4" />
              <h2 className="text-3xl font-bold text-[#F5A051]">
                Society for Cyber Intelligent Systems
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-[#F5A051] mr-3" />
                  <h3 className="text-2xl font-bold text-[#F5A051]">Vision</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  The Vision of the society is to be a global leader in advancing cybersecurity and intelligent
                  systems by fostering innovation, research, and collaboration, ensuring a secure and resilient
                  digital future for all.
                </p>
              </div>

              <div className="p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Compass className="w-8 h-8 text-[#F5A051] mr-3" />
                  <h3 className="text-2xl font-bold text-[#F5A051]">Mission</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  The primary mission is to advance cybersecurity and intelligent systems by promoting cutting-edge
                  technologies like AI and machine learning, fostering research in cyber intelligence, and
                  enhancing threat detection and mitigation strategies. We are committed to organizing
                  training programs, workshops, and awareness campaigns to educate professionals and the
                  public on best practices. Through the publication of research journals, international
                  collaborations, and strategic partnerships with academic institutions, industries, and
                  government agencies, we aim to strengthen the global cybersecurity ecosystem. Upholding
                  ethical AI practices, disseminating practical knowledge, and hosting national and international
                  conferences, we strive to create a secure, innovative, and resilient digital future.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conference Scope Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center mb-8">
              <Globe className="w-10 h-10 text-[#F5A051] mr-4" />
              <h2 className="text-3xl font-bold text-[#F5A051]">SCOPE OF THE CONFERENCE</h2>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-700 leading-relaxed mb-4">
                International Conference on Multidisciplinary Breakthroughs and NextGen Technologies
                (ICMBNT 2026) is designed to integrate perspectives from Science, Technology, Medical and
                Healthcare, Management, social sciences, Education, sports and environmental studies to
                develop holistic solutions for global issues.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Also in a rapidly evolving digital-first business world, global organizations are highly influenced
                by next generation technologies. Future technological advancements, developments, and
                innovations enabled by the internet, software, and services are known as next generation
                technologies. These include advanced robotics, AI, IoT, RPA, quantum computing, 3-D
                printing, 5G wireless networks, virtual reality and augmented reality, and blockchain.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                Next generation technologies are paving a way for network-enabled, miniature, and fully
                automated machines. Although enterprise applications based on such technologies are still
                in the nascent stages of development, they are gradually beginning to drive innovation
                strategies of the business and the overall impact of these technologies is expected to
                multifold over the coming years.
              </p>

              <p className="text-gray-700 leading-relaxed">
                ICMBNT 2026 will be a central hub for esteemed Research experts worldwide and can
                anticipate unparalleled opportunities to network, gain invaluable insights, showcase their
                hidden potential, present significant research findings, receive due credit and recognition for
                their contributions.
              </p>
            </div>
          </div>
        </section>

        {/* Important Dates Section using Timeline Design */}
        <Timeline />


      </div>
    </PageTransition>
  );
};

export default Home;