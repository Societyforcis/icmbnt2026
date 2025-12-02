import PageTransition from './PageTransition';
import { MapPin, Mail, Calendar } from 'lucide-react';
import VenuePic from './images/srm_venue.jpeg';
import MadrasHighCourt from './images/Madras_High_Court.jpg';

const Venue = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-900 to-[#F5A051] text-white py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Conference Venue</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
              International Conference on Multidisciplinary Breakthroughs and NextGen Technologies - ICMBNT 2026<br/>
              <span className="text-lg">27-28 March 2026 | Bali, Indonesia</span>
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
                  alt="Bali - Conference Venue" 
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">BALI</h3>
                  <p>Bali, Indonesia</p>
                </div>
              </div>

              {/* Conference Dates Image */}
              <div className="relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <img 
                  src={MadrasHighCourt} 
                  alt="Conference Dates - 27-28 March 2026" 
                  className="w-full object-cover h-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:-translate-y-2 transition-transform duration-300">
                  <h3 className="text-2xl font-bold mb-1">Conference Dates</h3>
                  <p>27-28 March 2026</p>
                </div>
              </div>
            </div>

            {/* Venue Details */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-md mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">BALI, INDONESIA</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-start mb-4">
                    <MapPin className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">
                      Bali, Indonesia<br/>
                      A tropical paradise destination perfect for an international conference
                    </p>
                  </div>
                  
                  <div className="flex items-start mb-4">
                    <Calendar className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700"><strong>27-28 March 2026</strong></p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">About the Venue</h4>
                  <p className="text-gray-700 mb-4">
                    Bali provides a unique and inspiring setting for ICMBNT 2026. The island's world-class 
                    hospitality, modern conference facilities, and vibrant atmosphere create an ideal environment 
                    for academic excellence and networking opportunities.
                  </p>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Facilities Include:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Modern conference halls with AV equipment</li>
                    <li>High-speed internet connectivity</li>
                    <li>Accommodations for international delegates</li>
                    <li>Multiple dining options</li>
                    <li>Business center services</li>
                    <li>Beautiful tropical setting</li>
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
                      <li><strong>Location:</strong> Bali, Indonesia</li>
                      <li><strong>Dates:</strong> 27-28 March 2026</li>
                      <li><strong>Conference Type:</strong> International Multi-disciplinary Conference</li>
                      <li><strong>Format:</strong> In-person + Virtual Hybrid</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Important Dates</h4>
                    <ul className="space-y-3 text-gray-700">
                      <li><strong>Paper Submission:</strong> 15 February 2026</li>
                      <li><strong>Acceptance Notification:</strong> 28 February 2026</li>
                      <li><strong>Registration Deadline:</strong> 10 March 2026</li>
                      <li><strong>Conference Days:</strong> 27-28 March 2026</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Information */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Getting to Bali</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">By Air:</h4>
                  <p className="text-gray-700 mb-4">
                    Bali is served by Ngurah Rai International Airport (DPS), which receives flights from 
                    major cities worldwide. It's one of Southeast Asia's busiest airports with excellent 
                    connectivity and modern facilities.
                  </p>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Transportation from Airport:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Taxi services available at the airport</li>
                    <li>Car rental services</li>
                    <li>Pre-booked hotel shuttle (contact organizers)</li>
                    <li>Ride-sharing apps (Gojek, Grab)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Visa & Travel Information:</h4>
                  <p className="text-gray-700 mb-4">
                    Many countries enjoy visa-free or visa-on-arrival privileges to Indonesia. 
                    Check the Indonesian embassy website for your country's requirements.
                  </p>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Local Attractions & Activities:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Beautiful beaches and water sports</li>
                    <li>Ancient temples and cultural sites</li>
                    <li>Rice terraces and natural landscapes</li>
                    <li>Local cuisine and dining experiences</li>
                    <li>Spa and wellness facilities</li>
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
                <a href="mailto:icmbnt2026@gmail.com" className="text-lg font-medium text-[#F5A051]">
                  icmbnt2026@gmail.com
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
