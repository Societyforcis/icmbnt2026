import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Swal from 'sweetalert2';
// Remove unused imports
// import { auth } from "../config/firebase";
// import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
// import axios from 'axios';
import { Mail, Lock, Globe } from 'react-feather';
import PageTransition from '../PageTransition';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [userType, setUserType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!email || !password || !country || !userType) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Please fill in all fields including country and professional category selection',
          timer: 2000,
        });
        setIsSubmitting(false);
        return;
      }


      if (password.length < 6) {
        Swal.fire({
          icon: 'error',
          title: 'Password Too Short',
          text: 'Password must be at least 6 characters long',
          confirmButtonColor: '#F5A051',
        });
        setIsSubmitting(false);
        return;
      }


      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, country, userType })
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Account Created Successfully!',
          text: 'A verification email has been sent to your email address. Please check your inbox and follow the verification link to complete the registration process.',
          confirmButtonColor: '#F5A051',
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login');
          }
        });
      } else {
        // Check if error is due to existing user
        if (data.message && data.message.includes("User already exists")) {
          Swal.fire({
            icon: 'info',
            title: 'Account Already Exists',
            text: 'An account with this email already exists. Redirecting you to login.',
            timer: 3000,
            showConfirmButton: false
          });

          // Redirect to login page after a short delay
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Signup Failed',
            text: data.message || 'Unable to create account',
            timer: 2000,
          });
        }
      }
    } catch (error) {
      console.error("Error in connecting:", error);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Unable to connect to the server. Please try again.',
        timer: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete the unused Google sign-in functions
  // handleGoogleSignIn and getErrorMessage functions removed

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-150 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto" data-aos="fade-up">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h2>
              <p className="text-gray-600">Join our community today</p>
            </div>

            {/* Add verification info banner */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After signing up, you'll need to verify your email address before logging in.
                Please check your inbox for a verification link.
              </p>
            </div>

            {/* Commented out Google sign-in functionality
            <div className="mb-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
                Sign up with Google
              </button>
            </div>
            */}

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                    required
                  >
                    <option value="">Select your country</option>
                    <option value="Afghanistan">🇦🇫 Afghanistan</option>
                    <option value="Albania">🇦🇱 Albania</option>
                    <option value="Algeria">🇩🇿 Algeria</option>
                    <option value="Andorra">🇦🇩 Andorra</option>
                    <option value="Angola">🇦🇴 Angola</option>
                    <option value="Argentina">🇦🇷 Argentina</option>
                    <option value="Armenia">🇦🇲 Armenia</option>
                    <option value="Australia">🇦🇺 Australia</option>
                    <option value="Austria">🇦🇹 Austria</option>
                    <option value="Azerbaijan">🇦🇿 Azerbaijan</option>
                    <option value="Bahamas">🇧🇸 Bahamas</option>
                    <option value="Bahrain">🇧🇭 Bahrain</option>
                    <option value="Bangladesh">🇧🇩 Bangladesh</option>
                    <option value="Barbados">🇧🇧 Barbados</option>
                    <option value="Belarus">🇧🇾 Belarus</option>
                    <option value="Belgium">🇧🇪 Belgium</option>
                    <option value="Belize">🇧🇿 Belize</option>
                    <option value="Benin">🇧🇯 Benin</option>
                    <option value="Bhutan">🇧🇹 Bhutan</option>
                    <option value="Bolivia">🇧🇴 Bolivia</option>
                    <option value="Bosnia and Herzegovina">🇧🇦 Bosnia and Herzegovina</option>
                    <option value="Botswana">🇧🇼 Botswana</option>
                    <option value="Brazil">🇧🇷 Brazil</option>
                    <option value="Brunei">🇧🇳 Brunei</option>
                    <option value="Bulgaria">🇧🇬 Bulgaria</option>
                    <option value="Burkina Faso">🇧🇫 Burkina Faso</option>
                    <option value="Burundi">🇧🇮 Burundi</option>
                    <option value="Cambodia">🇰🇭 Cambodia</option>
                    <option value="Cameroon">🇨🇲 Cameroon</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="Cape Verde">🇨🇻 Cape Verde</option>
                    <option value="Central African Republic">🇨🇫 Central African Republic</option>
                    <option value="Chad">🇹🇩 Chad</option>
                    <option value="Chile">🇨🇱 Chile</option>
                    <option value="China">🇨🇳 China</option>
                    <option value="Colombia">🇨🇴 Colombia</option>
                    <option value="Comoros">🇰🇲 Comoros</option>
                    <option value="Congo">🇨🇬 Congo</option>
                    <option value="Costa Rica">🇨🇷 Costa Rica</option>
                    <option value="Croatia">🇭🇷 Croatia</option>
                    <option value="Cuba">🇨🇺 Cuba</option>
                    <option value="Cyprus">🇨🇾 Cyprus</option>
                    <option value="Czech Republic">🇨🇿 Czech Republic</option>
                    <option value="Denmark">🇩🇰 Denmark</option>
                    <option value="Djibouti">🇩🇯 Djibouti</option>
                    <option value="Dominica">🇩🇲 Dominica</option>
                    <option value="Dominican Republic">🇩🇴 Dominican Republic</option>
                    <option value="Ecuador">🇪🇨 Ecuador</option>
                    <option value="Egypt">🇪🇬 Egypt</option>
                    <option value="El Salvador">🇸🇻 El Salvador</option>
                    <option value="Equatorial Guinea">🇬🇶 Equatorial Guinea</option>
                    <option value="Eritrea">🇪🇷 Eritrea</option>
                    <option value="Estonia">🇪🇪 Estonia</option>
                    <option value="Ethiopia">🇪🇹 Ethiopia</option>
                    <option value="Fiji">🇫🇯 Fiji</option>
                    <option value="Finland">🇫🇮 Finland</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="Gabon">🇬🇦 Gabon</option>
                    <option value="Gambia">🇬🇲 Gambia</option>
                    <option value="Georgia">🇬🇪 Georgia</option>
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="Ghana">🇬🇭 Ghana</option>
                    <option value="Greece">🇬🇷 Greece</option>
                    <option value="Grenada">🇬🇩 Grenada</option>
                    <option value="Guatemala">🇬🇹 Guatemala</option>
                    <option value="Guinea">🇬🇳 Guinea</option>
                    <option value="Guinea-Bissau">🇬🇼 Guinea-Bissau</option>
                    <option value="Guyana">🇬🇾 Guyana</option>
                    <option value="Haiti">🇭🇹 Haiti</option>
                    <option value="Honduras">🇭🇳 Honduras</option>
                    <option value="Hungary">🇭🇺 Hungary</option>
                    <option value="Iceland">🇮🇸 Iceland</option>
                    <option value="India">🇮🇳 India</option>
                    <option value="Indonesia">🇮🇩 Indonesia</option>
                    <option value="Iran">🇮🇷 Iran</option>
                    <option value="Iraq">🇮🇶 Iraq</option>
                    <option value="Ireland">🇮🇪 Ireland</option>
                    <option value="Israel">🇮🇱 Israel</option>
                    <option value="Italy">🇮🇹 Italy</option>
                    <option value="Jamaica">🇯🇲 Jamaica</option>
                    <option value="Japan">🇯🇵 Japan</option>
                    <option value="Jordan">🇯🇴 Jordan</option>
                    <option value="Kazakhstan">🇰🇿 Kazakhstan</option>
                    <option value="Kenya">🇰🇪 Kenya</option>
                    <option value="Kiribati">🇰🇮 Kiribati</option>
                    <option value="Korea, North">🇰🇵 Korea, North</option>
                    <option value="Korea, South">🇰🇷 Korea, South</option>
                    <option value="Kuwait">🇰🇼 Kuwait</option>
                    <option value="Kyrgyzstan">🇰🇬 Kyrgyzstan</option>
                    <option value="Laos">🇱🇦 Laos</option>
                    <option value="Latvia">🇱🇻 Latvia</option>
                    <option value="Lebanon">🇱🇧 Lebanon</option>
                    <option value="Lesotho">🇱🇸 Lesotho</option>
                    <option value="Liberia">🇱🇷 Liberia</option>
                    <option value="Libya">🇱🇾 Libya</option>
                    <option value="Liechtenstein">🇱🇮 Liechtenstein</option>
                    <option value="Lithuania">🇱🇹 Lithuania</option>
                    <option value="Luxembourg">🇱🇺 Luxembourg</option>
                    <option value="Madagascar">🇲🇬 Madagascar</option>
                    <option value="Malawi">🇲🇼 Malawi</option>
                    <option value="Malaysia">🇲🇾 Malaysia</option>
                    <option value="Maldives">🇲🇻 Maldives</option>
                    <option value="Mali">🇲🇱 Mali</option>
                    <option value="Malta">🇲🇹 Malta</option>
                    <option value="Marshall Islands">🇲🇭 Marshall Islands</option>
                    <option value="Mauritania">🇲🇷 Mauritania</option>
                    <option value="Mauritius">🇲🇺 Mauritius</option>
                    <option value="Mexico">🇲🇽 Mexico</option>
                    <option value="Micronesia">🇫🇲 Micronesia</option>
                    <option value="Moldova">🇲🇩 Moldova</option>
                    <option value="Monaco">🇲🇨 Monaco</option>
                    <option value="Mongolia">🇲🇳 Mongolia</option>
                    <option value="Montenegro">🇲🇪 Montenegro</option>
                    <option value="Morocco">🇲🇦 Morocco</option>
                    <option value="Mozambique">🇲🇿 Mozambique</option>
                    <option value="Myanmar">🇲🇲 Myanmar</option>
                    <option value="Namibia">🇳🇦 Namibia</option>
                    <option value="Nauru">🇳🇷 Nauru</option>
                    <option value="Nepal">🇳🇵 Nepal</option>
                    <option value="Netherlands">🇳🇱 Netherlands</option>
                    <option value="New Zealand">🇳🇿 New Zealand</option>
                    <option value="Nicaragua">🇳🇮 Nicaragua</option>
                    <option value="Niger">🇳🇪 Niger</option>
                    <option value="Nigeria">🇳🇬 Nigeria</option>
                    <option value="Norway">🇳🇴 Norway</option>
                    <option value="Oman">🇴🇲 Oman</option>
                    <option value="Pakistan">🇵🇰 Pakistan</option>
                    <option value="Palau">🇵🇼 Palau</option>
                    <option value="Palestine">🇵🇸 Palestine</option>
                    <option value="Panama">🇵🇦 Panama</option>
                    <option value="Papua New Guinea">🇵🇬 Papua New Guinea</option>
                    <option value="Paraguay">🇵🇾 Paraguay</option>
                    <option value="Peru">🇵🇪 Peru</option>
                    <option value="Philippines">🇵🇭 Philippines</option>
                    <option value="Poland">🇵🇱 Poland</option>
                    <option value="Portugal">🇵🇹 Portugal</option>
                    <option value="Qatar">🇶🇦 Qatar</option>
                    <option value="Romania">🇷🇴 Romania</option>
                    <option value="Russia">🇷🇺 Russia</option>
                    <option value="Rwanda">🇷🇼 Rwanda</option>
                    <option value="Saint Kitts and Nevis">🇰🇳 Saint Kitts and Nevis</option>
                    <option value="Saint Lucia">🇱🇨 Saint Lucia</option>
                    <option value="Saint Vincent and the Grenadines">🇻🇨 Saint Vincent and the Grenadines</option>
                    <option value="Samoa">🇼🇸 Samoa</option>
                    <option value="San Marino">🇸🇲 San Marino</option>
                    <option value="Sao Tome and Principe">🇸🇹 Sao Tome and Principe</option>
                    <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                    <option value="Senegal">🇸🇳 Senegal</option>
                    <option value="Serbia">🇷🇸 Serbia</option>
                    <option value="Seychelles">🇸🇨 Seychelles</option>
                    <option value="Sierra Leone">🇸🇱 Sierra Leone</option>
                    <option value="Singapore">🇸🇬 Singapore</option>
                    <option value="Slovakia">🇸🇰 Slovakia</option>
                    <option value="Slovenia">🇸🇮 Slovenia</option>
                    <option value="Solomon Islands">🇸🇧 Solomon Islands</option>
                    <option value="Somalia">🇸🇴 Somalia</option>
                    <option value="South Africa">🇿🇦 South Africa</option>
                    <option value="South Sudan">🇸🇸 South Sudan</option>
                    <option value="Spain">🇪🇸 Spain</option>
                    <option value="Sri Lanka">🇱🇰 Sri Lanka</option>
                    <option value="Sudan">🇸🇩 Sudan</option>
                    <option value="Suriname">🇸🇷 Suriname</option>
                    <option value="Sweden">🇸🇪 Sweden</option>
                    <option value="Switzerland">🇨🇭 Switzerland</option>
                    <option value="Syria">🇸🇾 Syria</option>
                    <option value="Taiwan">🇹🇼 Taiwan</option>
                    <option value="Tajikistan">🇹🇯 Tajikistan</option>
                    <option value="Tanzania">🇹� Tanzania</option>
                    <option value="Thailand">🇹🇭 Thailand</option>
                    <option value="Timor-Leste">🇹🇱 Timor-Leste</option>
                    <option value="Togo">🇹🇬 Togo</option>
                    <option value="Tonga">🇹🇴 Tonga</option>
                    <option value="Trinidad and Tobago">🇹🇹 Trinidad and Tobago</option>
                    <option value="Tunisia">🇹🇳 Tunisia</option>
                    <option value="Turkey">🇹🇷 Turkey</option>
                    <option value="Turkmenistan">🇹🇲 Turkmenistan</option>
                    <option value="Tuvalu">🇹🇻 Tuvalu</option>
                    <option value="Uganda">🇺🇬 Uganda</option>
                    <option value="Ukraine">🇺🇦 Ukraine</option>
                    <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="United States">🇺🇸 United States</option>
                    <option value="Uruguay">🇺🇾 Uruguay</option>
                    <option value="Uzbekistan">🇺🇿 Uzbekistan</option>
                    <option value="Vanuatu">🇻🇺 Vanuatu</option>
                    <option value="Vatican City">🇻🇦 Vatican City</option>
                    <option value="Venezuela">🇻🇪 Venezuela</option>
                    <option value="Vietnam">🇻🇳 Vietnam</option>
                    <option value="Yemen">🇾🇪 Yemen</option>
                    <option value="Zambia">🇿🇲 Zambia</option>
                    <option value="Zimbabwe">🇿🇼 Zimbabwe</option>
                  </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This helps us show you the correct registration fees
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Category</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  required
                >
                  <option value="">Select your professional category</option>
                  <option value="student">Student - Pursuing Bachelor's or Master's degree</option>
                  <option value="faculty">Faculty - Academic faculty member or professor</option>
                  <option value="scholar">Research Scholar - PhD candidate or postdoctoral researcher</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This helps us apply the correct registration fee for your category
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#F5A051] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#e08c3e]'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#F5A051] hover:text-[#e08c3e]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}