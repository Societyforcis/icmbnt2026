import PageTransition from './PageTransition';
import { MapPin, Mail, Calendar } from 'lucide-react';
import VenuePic from './images/bali/u.png';
import MadrasHighCourt from './images/bali/c3.png';

const Venue = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">

        <div className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Conference Venue</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
              International Conference on Multidisciplinary Breakthroughs and NextGen Technologies - ICMBNT 2026<br />
              <span className="text-lg">12-13 March 2026 | Bali, Indonesia</span>
            </p>
          </div>
        </div>

        {/* Main Venue Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-[#F5A051]">Conference Location</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Bali Venue Image */}
              <div className="relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <img
                  src={VenuePic}
                  alt="Udayana University - Conference Venue"
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">UDAYANA UNIVERSITY</h3>
                  <p>Jimbaran, Bali, Indonesia</p>
                </div>
              </div>

              {/* Conference Dates Image */}
              <div className="relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <img
                  src={MadrasHighCourt}
                  alt="Conference Dates - 12-13 March 2026"
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">Conference Dates</h3>
                  <p>12-13 March 2026</p>
                </div>
              </div>
            </div>

            {/* Venue Details */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-md mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">UDAYANA UNIVERSITY, BALI, INDONESIA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-start mb-4">
                    <MapPin className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">
                      <strong>Udayana University</strong><br />
                      Jimbaran, Bali, Indonesia<br />
                      A premier university and world-class conference venue
                    </p>
                  </div>

                  <div className="flex items-start mb-4">
                    <Calendar className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700"><strong>12-13 March 2026</strong></p>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">About the Venue</h4>
                  <p className="text-gray-700 mb-4">
                    Udayana University, located in the beautiful Jimbaran area of Bali, provides an exceptional
                    setting for ICMBNT 2026. As one of Indonesia's leading universities, it offers state-of-the-art
                    conference facilities combined with Bali's renowned hospitality and inspiring tropical environment,
                    creating the perfect atmosphere for academic excellence and international networking.
                  </p>

                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Facilities Include:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Modern conference halls with advanced AV equipment</li>
                    <li>High-speed internet connectivity throughout campus</li>
                    <li>Nearby accommodations for international delegates</li>
                    <li>Multiple dining options and cafeterias</li>
                    <li>Business center and academic support services</li>
                    <li>Beautiful campus in tropical Bali setting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Conference Information</h3>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Event Details</h4>
                    <ul className="space-y-3 text-gray-700">
                      <li><strong>Venue:</strong> Udayana University</li>
                      <li><strong>Location:</strong> Jimbaran, Bali, Indonesia</li>
                      <li><strong>Dates:</strong> 12-13 March 2026</li>
                      <li><strong>Conference Type:</strong> International Multi-disciplinary Conference</li>
                      <li><strong>Format:</strong> In-person + Virtual Hybrid</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Important Dates</h4>
                    <ul className="space-y-3 text-gray-700">
                      <li><strong>Paper Submission:</strong> <span className="line-through text-red-500 mr-2">10 Feb 2026</span> <span className="text-green-700 font-semibold">28 Feb 2026</span></li>
                      <li><strong>Acceptance Notification:</strong> <span className="line-through text-red-500 mr-2">12 Feb 2026</span> <span className="text-green-700 font-semibold">2 March 2026</span></li>
                      <li><strong>Registration Deadline:</strong> <span className="line-through text-red-500 mr-2">15 Feb 2026</span> <span className="text-green-700 font-semibold">5 March 2026</span></li>
                      <li><strong>Conference Days:</strong> 12-13 March 2026</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Information */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Getting to Udayana University</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">By Air:</h4>
                  <p className="text-gray-700 mb-4">
                    Fly to Ngurah Rai International Airport (DPS) in Bali, which receives flights from
                    major cities worldwide. The airport is approximately 15-20 minutes drive from Udayana University's
                    Jimbaran campus, making it convenient for international delegates.
                  </p>

                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Transportation from Airport:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Taxi services available at the airport (15-20 min to venue)</li>
                    <li>Car rental services</li>
                    <li>Pre-booked hotel shuttle (contact organizers)</li>
                    <li>Ride-sharing apps (Gojek, Grab)</li>
                    <li>Airport shuttle to Jimbaran area</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Visa & Travel Information:</h4>
                  <p className="text-gray-700 mb-4">
                    Many countries enjoy visa-free or visa-on-arrival privileges to Indonesia.
                    Check the Indonesian embassy website for your country's requirements.
                  </p>

                  <h4 className="text-lg font-semibold text-gray-800 mb-3">About Udayana University:</h4>
                  <p className="text-gray-700 mb-3">
                    Udayana University (Universitas Udayana) is one of Indonesia's most prestigious universities,
                    founded in 1962. The Jimbaran campus features modern facilities and a beautiful setting,
                    perfect for hosting international conferences.
                  </p>

                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Local Attractions:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Jimbaran Beach (famous for sunset seafood dining)</li>
                    <li>Uluwatu Temple and Kecak Dance performances</li>
                    <li>Traditional Balinese culture and arts</li>
                    <li>Water sports and beach activities</li>
                    <li>Local markets and shopping areas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-[#F5A051]">Venue-Related Inquiries</h2>

            <div className="text-center bg-white p-8 rounded-lg shadow-md">
              <p className="text-lg text-gray-700 mb-4">
                For any questions related to the venue, accommodations, or travel assistance, please contact:
              </p>

              <div className="inline-flex items-center justify-center bg-[#F5A051]/10 px-6 py-3 rounded-lg">
                <Mail className="w-5 h-5 text-[#F5A051] mr-2" />
                <a href="mailto:admin@icmbnt2026.societycis.org" className="text-lg font-medium text-[#F5A051]">
                  admin@icmbnt2026.societycis.org
                </a>
              </div>

              <p className="mt-4 text-gray-600">
                The conference organizing committee will be happy to assist you with venue-related arrangements.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Venue;
