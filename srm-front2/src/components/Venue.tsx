import PageTransition from './PageTransition';
import { MapPin, Phone, Mail, Link as LinkIcon } from 'lucide-react';
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
              International Conference on Multidisciplinary Breakthroughs and NextGen Technologies - ICMBNT 2026
            </p>
          </div>
        </div>

        {/* Main Venue Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-8 text-[#F5A051]">Conference Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
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

            {/* Venue Details */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-md mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">SRM Hotel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-start mb-4">
                    <MapPin className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">
                      No 1, Bharathi Salai, SRM Nagar, Potheri, Kattankulathur,<br/>
                      Chengalpattu District, Maraimalai Nagar - 603203<br/>
                      Chennai, Tamil Nadu, India
                    </p>
                  </div>
                  
                  <div className="flex items-start mb-4">
                    <Phone className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">+91-44-27453159</p>
                  </div>
                  
                  <div className="flex items-start mb-4">
                    <Mail className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <p className="text-gray-700">info@srmhotel.in</p>
                  </div>
                  
                  <div className="flex items-start">
                    <LinkIcon className="w-5 h-5 text-[#F5A051] mt-1 mr-3 flex-shrink-0" />
                    <a 
                      href="http://www.srmhotel.in" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      www.srmhotel.in
                    </a>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">About the Venue</h4>
                  <p className="text-gray-700 mb-4">
                    SRM Hotel provides a comfortable and professional environment for conferences and academic events. 
                    With modern amenities, spacious conference halls, and excellent hospitality services, it's an ideal 
                    location for ICMBNT 2026.
                  </p>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Facilities Include:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Modern conference halls with AV equipment</li>
                    <li>High-speed internet connectivity</li>
                    <li>Accommodations for international delegates</li>
                    <li>Multiple dining options</li>
                    <li>Business center services</li>
                    <li>Proximity to SRM Institute of Science and Technology</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Location Map</h3>
              <div className="rounded-lg overflow-hidden shadow-md h-96">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3890.7770484215324!2d80.03672731482064!3d12.795633990974073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a52f707c2da76c5%3A0xe9dd5afcafe7e0cf!2sSRM%20Hotel%20Potheri!5e0!3m2!1sen!2sin!4v1620471703936!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                  title="SRM Hotel Map Location"
                ></iframe>
              </div>
            </div>

            {/* Travel Information */}
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Travel Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">From Chennai International Airport:</h4>
                  <p className="text-gray-700 mb-4">
                    The venue is approximately 35 kilometers from Chennai International Airport (MAA). 
                    Travel time is around 45-60 minutes depending on traffic conditions.
                  </p>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Transportation Options:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>Taxi services available at the airport</li>
                    <li>App-based cab services (Uber, Ola)</li>
                    <li>Pre-booked hotel shuttle (contact hotel in advance)</li>
                    <li>Public transportation options available</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">From Chennai Central Railway Station:</h4>
                  <p className="text-gray-700 mb-4">
                    The venue is approximately 45 kilometers from Chennai Central Railway Station.
                    Travel time is around 1 hour 15 minutes depending on traffic conditions.
                  </p>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Nearby Attractions:</h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    <li>SRM Institute of Science and Technology</li>
                    <li>Mamallapuram (UNESCO World Heritage Site) - 40 km</li>
                    <li>Chennai City Center - 40 km</li>
                    <li>Marina Beach - 45 km</li>
                    <li>Local markets and cultural attractions</li>
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
