import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface CountrySelectorProps {
    onCountryChange?: (country: string) => void;
    showAsModal?: boolean;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ onCountryChange, showAsModal = false }) => {
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);

    useEffect(() => {
        // Check if user has already selected a country
        const storedCountry = localStorage.getItem('userCountry');
        if (storedCountry) {
            setSelectedCountry(storedCountry);
        } else {
            // Show selector if no country is set
            setShowSelector(true);
        }
    }, []);

    const handleCountrySelect = async (country: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                // If not logged in, just store in localStorage
                localStorage.setItem('userCountry', country);
                setSelectedCountry(country);
                setShowSelector(false);
                if (onCountryChange) onCountryChange(country);
                return;
            }

            // Update in backend if logged in
            const response = await axios.put(
                `${API_URL}/api/auth/update-country`,
                { country },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                localStorage.setItem('userCountry', country);
                setSelectedCountry(country);
                setShowSelector(false);

                if (onCountryChange) onCountryChange(country);

                Swal.fire({
                    icon: 'success',
                    title: 'Country Updated!',
                    text: `Your country has been set to ${country}. Registration fees will be displayed accordingly.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error: any) {
            console.error('Error updating country:', error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: error.response?.data?.message || 'Failed to update country',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setLoading(false);
        }
    };

    const countries = [
        { value: 'India', label: 'India 🇮🇳', color: 'from-blue-500 to-blue-600' },
        { value: 'Indonesia', label: 'Indonesia 🇮🇩', color: 'from-green-500 to-green-600' },
        { value: 'Other', label: 'Other Countries 🌍', color: 'from-purple-500 to-purple-600' }
    ];

    if (!showSelector && selectedCountry && !showAsModal) {
        // Show compact selected country display
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                    <Globe className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                        Your Country: <span className="font-bold text-blue-600">{selectedCountry}</span>
                    </span>
                </div>
                <button
                    onClick={() => setShowSelector(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                    Change
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center mb-4">
                <Globe className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-xl font-bold text-gray-800">Select Your Country</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
                Please select your country to view appropriate registration fees
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {countries.map((country) => (
                    <button
                        key={country.value}
                        onClick={() => handleCountrySelect(country.value)}
                        disabled={loading}
                        className={`relative p-6 rounded-xl border-2 transition-all transform hover:scale-105 ${selectedCountry === country.value
                                ? `border-transparent bg-gradient-to-r ${country.color} text-white shadow-lg`
                                : 'border-gray-200 hover:border-blue-300 bg-white'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {selectedCountry === country.value && (
                            <div className="absolute top-2 right-2">
                                <Check className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <div className="text-center">
                            <p className={`text-2xl mb-2 ${selectedCountry === country.value ? 'text-white' : 'text-gray-700'}`}>
                                {country.label.split(' ')[1]}
                            </p>
                            <p className={`font-bold text-lg ${selectedCountry === country.value ? 'text-white' : 'text-gray-800'}`}>
                                {country.label.split(' ')[0]}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {selectedCountry && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 text-center">
                        ✓ Country selected: <span className="font-bold">{selectedCountry}</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default CountrySelector;
