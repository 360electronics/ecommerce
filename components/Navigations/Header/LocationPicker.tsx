'use client'
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

interface LocationPickerProps {
    isMobile?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ isMobile = false }) => {
    const [location, setLocation] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [pincode, setPincode] = useState('');
    const [district, setDistrict] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedLocation = localStorage.getItem('userLocation');
        const savedDistrict = localStorage.getItem('userDistrict');
        const savedPincode = localStorage.getItem('userPincode');
        
        if (savedLocation && savedDistrict) {
            setLocation(savedLocation);
            setDistrict(savedDistrict);
            setPincode(savedPincode || '');
        } else if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchLocationFromCoordinates(position.coords.latitude, position.coords.longitude);
                },
                (err) => {
                    console.error("Error getting location:", err);
                    setLocation('Select Location');
                    setLoading(false);
                }
            );
        } else {
            setLocation('Select Location');
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modalRef.current && 
                !modalRef.current.contains(event.target as Node) &&
                !isMobile
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const fetchLocationFromCoordinates = async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            if (data && data.address && data.address.postcode) {
                fetchPincodeDetails(data.address.postcode);
            } else {
                setLocation('Select Location');
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching location:", error);
            setLocation('Select Location');
            setLoading(false);
        }
    };

    const fetchPincodeDetails = async (pincode: string) => {
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();
            
            if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
                const postOfficeData = data[0].PostOffice[0];
                const districtName = postOfficeData.District;
                const locationText = `${districtName}`;
                
                setLocation(locationText);
                setDistrict(districtName);
                setPincode(pincode);
                
                localStorage.setItem('userLocation', locationText);
                localStorage.setItem('userDistrict', districtName);
                localStorage.setItem('userPincode', pincode);
            } else {
                setError('Invalid pincode or location not found');
            }
        } catch (error) {
            console.error("Error fetching pincode details:", error);
            setError('Failed to fetch location details');
        } finally {
            setLoading(false);
        }
    };

    const handlePincodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pincode && pincode.length === 6 && /^\d+$/.test(pincode)) {
            fetchPincodeDetails(pincode);
            setIsOpen(false);
        } else {
            setError('Please enter a valid 6-digit pincode');
        }
    };

    const toggleLocationModal = () => {
        setIsOpen(!isOpen);
        setError('');
    };

    const handleDetectLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchLocationFromCoordinates(position.coords.latitude, position.coords.longitude);
                    setIsOpen(false);
                },
                (err) => {
                    console.error("Error getting location:", err);
                    setError('Failed to get your current location');
                    setLoading(false);
                }
            );
        } else {
            setError('Geolocation is not supported by your browser');
        }
    };

    if (isMobile && isOpen) {
        return (
            <div className="fixed inset-0 bg-white z-50" style={{ height: '100dvh' }}>
                <div className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold">Set delivery location</h2>
                        <button 
                            className="p-2 focus:outline-none" 
                            onClick={() => setIsOpen(false)}
                            aria-label="Close location picker"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {district && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">Current location:</p>
                            <div className="flex items-center mt-1">
                                <MapPin size={18} className="text-blue-500 mr-2" />
                                <p className="font-medium">{district} {pincode && `- ${pincode}`}</p>
                            </div>
                        </div>
                    )}
                    
                    <form onSubmit={handlePincodeSubmit} className="mb-6">
                        <div className="mb-4">
                            <label htmlFor="mobile-pincode" className="block text-sm font-medium text-gray-700 mb-1">Enter Pincode</label>
                            <input 
                                ref={inputRef}
                                type="text" 
                                id="mobile-pincode"
                                placeholder="Enter 6-digit pincode" 
                                inputMode="numeric"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                            />
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>
                        
                        <button 
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-base"
                            disabled={loading}
                        >
                            {loading ? 'Applying...' : 'Apply'}
                        </button>
                    </form>
                    
                    <div className="border-t border-gray-200 pt-4 mt-auto">
                        <button 
                            className="flex items-center justify-center w-full py-3 border border-blue-600 text-blue-600 rounded-lg font-medium"
                            onClick={handleDetectLocation}
                            disabled={loading}
                        >
                            <MapPin size={18} className="mr-2" />
                            Use my current location
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <button 
                className={`flex items-center text-gray-700 ${isMobile ? 'text-base w-full justify-start' : 'text-sm'}`}
                onClick={toggleLocationModal}
            >
                <MapPin size={isMobile ? 18 : 20} className="text-blue-500 mr-2" />
                <div className="flex flex-col items-start">
                    {loading ? (
                        <span className="text-xs">Loading location...</span>
                    ) : (
                        <div className=' flex gap-1 md:flex-col text-start'>
                            <span className="text-[10px] md:text-xs font-medium max-w-[150px] truncate">{location || 'Select Location'} {pincode && `- ${pincode}`}</span>
                            <span className="text-[10px] text-blue-500 underline">
                                {location ? 'Change Location' : 'Set Location'}
                            </span>
                        </div>
                    )}
                </div>
            </button>
            
            {isOpen && !isMobile && (
                <div ref={modalRef} className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-50 p-4">
                    <h3 className="font-medium mb-2">Set your delivery location</h3>
                    {district && (
                        <div className="mb-3 text-sm">
                            <p>Current location: <span className="font-medium">{district}</span></p>
                            {pincode && <p className="text-xs text-gray-500">Pincode: {pincode}</p>}
                        </div>
                    )}
                    
                    <form onSubmit={handlePincodeSubmit}>
                        <div className="mb-3">
                            <label htmlFor="pincode" className="block text-xs text-gray-600 mb-1">Enter Pincode</label>
                            <input 
                                ref={inputRef}
                                type="text" 
                                id="pincode"
                                placeholder="Enter 6-digit pincode" 
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                inputMode="numeric"
                            />
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                        
                        <div className="flex justify-between">
                            <button 
                                type="button"
                                className="text-gray-600 px-3 py-1 rounded text-sm border border-gray-300"
                                onClick={toggleLocationModal}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                disabled={loading}
                            >
                                {loading ? 'Applying...' : 'Apply'}
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-4 border-t pt-3">
                        <button 
                            className="text-blue-500 text-sm flex items-center"
                            onClick={handleDetectLocation}
                            disabled={loading}
                        >
                            <MapPin size={16} className="mr-1" />
                            Use my current location
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;