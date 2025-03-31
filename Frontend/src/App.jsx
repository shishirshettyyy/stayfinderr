import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {  NavLink } from 'react-router-dom';

// Auth Context
const AuthContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    amenities: []
  });
  const [amenities, setAmenities] = useState([]);
  const navigate = useNavigate();

  // Initialize axios
  axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Set auth token if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    fetchAmenities();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/user');
      setUser(response.data.user);
    } catch (err) {
      console.error('Failed to fetch user', err);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const response = await axios.get('/api/amenities');
      setAmenities(response.data.amenities);
    } catch (err) {
      console.error('Failed to fetch amenities', err);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const formData = new FormData();
      formData.append('firstName', userData.firstName);
      formData.append('lastName', userData.lastName);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('isOwner', userData.isOwner);
      formData.append('phoneNumber', userData.phoneNumber);
      if (userData.profileImage) {
        formData.append('profileImage', userData.profileImage);
      }

      const response = await axios.post('/api/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      localStorage.setItem('token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/');
  };

  const updateUser = async (userData) => {
    try {
      const formData = new FormData();
      formData.append('firstName', userData.firstName);
      formData.append('lastName', userData.lastName);
      formData.append('phoneNumber', userData.phoneNumber);
      formData.append('about', userData.about);
      if (userData.profileImage) {
        formData.append('profileImage', userData.profileImage);
      }

      const response = await axios.put('/api/user', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateUser,
      loading,
      amenities
    }}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <Home 
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              amenities={amenities}
            />
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          {/* // Add this with your other routes */}
          {/* <Route path="/admin" element={<AdminPanel />} /> */}
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/account" element={<Account />} />
          <Route path="/host/listings" element={<HostListings />} />
          <Route path="/host/listings/new" element={<CreateListing />} />
          <Route path="/host/listings/:id" element={<EditListing />} />
          <Route path="/host/bookings" element={<HostBookings />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Routes>
        <Footer />
      </div>
    </AuthContext.Provider>
  );
}

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Add scroll effect to navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`bg-white sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl font-semibold text-indigo-700 flex items-center transition-colors hover:text-indigo-800"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 mr-2 text-indigo-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              StayEase
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink 
              to="/" 
              className="px-4 py-2 text-gray-600 hover:text-indigo-700 font-medium text-sm uppercase tracking-wider transition-colors"
              activeClassName="text-indigo-700 border-b-2 border-indigo-700"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 inline mr-1 -mt-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              Explore
            </NavLink>
            
            {user ? (
              <>
                <NavLink 
                  to="/bookings" 
                  className="px-4 py-2 text-gray-600 hover:text-indigo-700 font-medium text-sm uppercase tracking-wider transition-colors"
                  activeClassName="text-indigo-700 border-b-2 border-indigo-700"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 inline mr-1 -mt-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                  Bookings
                </NavLink>
                
                <NavLink 
                  to="/wishlist" 
                  className="px-4 py-2 text-gray-600 hover:text-indigo-700 font-medium text-sm uppercase tracking-wider transition-colors"
                  activeClassName="text-indigo-700 border-b-2 border-indigo-700"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 inline mr-1 -mt-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                    />
                  </svg>
                  Wishlist
                </NavLink>
                
                {user.isOwner && (
                  <div className="relative group">
                    <button className="flex items-center px-4 py-2 text-gray-600 hover:text-indigo-700 font-medium text-sm uppercase tracking-wider transition-colors group-hover:text-indigo-700">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 inline mr-1 -mt-1" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                        />
                      </svg>
                      Host
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-1 transition-transform group-hover:rotate-180" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M19 9l-7 7-7-7" 
                        />
                      </svg>
                    </button>
                    
                    <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-xl py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                      <Link 
                        to="/host/listings" 
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        My Listings
                      </Link>
                      <Link 
                        to="/host/bookings" 
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        Bookings
                      </Link>
                      <Link 
                        to="/host/listings/new" 
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        Add Listing
                      </Link>
                    </div>
                  </div>
                )}
                
                <div className="relative group ml-2">
                  <button className="flex items-center space-x-2 focus:outline-none">
                    <div className="relative">
                      <img 
                        className="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-indigo-300 transition-all" 
                        src={user.profileImagePath || 'https://randomuser.me/api/portraits/men/1.jpg'} 
                        alt="User" 
                      />
                      <div className="absolute -bottom-1 -right-1 bg-green-400 rounded-full w-3 h-3 border-2 border-white"></div>
                    </div>
                    <span className="text-gray-700 font-medium hidden lg:inline">{user.firstName}</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 text-gray-500 transition-transform group-hover:rotate-180" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 9l-7 7-7-7" 
                      />
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-xl py-1 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                    <Link 
                      to="/account" 
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2 text-gray-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                        />
                      </svg>
                      Account Settings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 mr-2 text-gray-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-gray-600 hover:text-indigo-700 font-medium text-sm uppercase tracking-wider transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm uppercase tracking-wider transition-colors shadow-sm hover:shadow-md"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden bg-white overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 pt-2 pb-4 space-y-1">
          <Link 
            to="/" 
            className="block px-3 py-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 inline mr-2 -mt-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            Explore
          </Link>
          
          {user ? (
            <>
              <Link 
                to="/bookings" 
                className="block px-3 py-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 inline mr-2 -mt-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                Bookings
              </Link>
              
              <Link 
                to="/wishlist" 
                className="block px-3 py-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 inline mr-2 -mt-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
                Wishlist
              </Link>
              
              {user.isOwner && (
                <>
                  <div className="ml-5 border-l-2 border-gray-100 pl-2">
                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Host Dashboard</p>
                    <Link 
                      to="/host/listings" 
                      className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Listings
                    </Link>
                    <Link 
                      to="/host/bookings" 
                      className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Bookings
                    </Link>
                    <Link 
                      to="/host/listings/new" 
                      className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Add New Listing
                    </Link>
                  </div>
                </>
              )}
              
              <Link 
                to="/account" 
                className="block px-3 py-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 inline mr-2 -mt-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
                Account
              </Link>
              
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 inline mr-2 -mt-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="block px-3 py-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="block px-3 py-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium text-center shadow-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// Home Component
function Home({ searchParams, setSearchParams, amenities }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {
        location: searchParams.location,
        propertyType: searchParams.propertyType,
        minPrice: searchParams.minPrice,
        maxPrice: searchParams.maxPrice,
        guests: searchParams.guests,
        bedrooms: searchParams.bedrooms,
        amenities: searchParams.amenities.join(',')
      };
      
      const response = await axios.get('/api/listings', { params });
      setListings(response.data.listings);
    } catch (err) {
      console.error('Failed to fetch listings', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenityId) => {
    setSearchParams(prev => {
      const newAmenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: newAmenities };
    });
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-indigo-700 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Perfect Stay</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto">
              Discover and book unique accommodations around the world
            </p>
          </div>
          {/* // Search Box Section */}
<div className="bg-white rounded-xl shadow-lg p-4 max-w-5xl mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
    {/* Location */}
    <div className="md:col-span-4">
      <label className="block text-gray-700 text-sm font-medium mb-1">Location</label>
      <div className="relative">
        <input
          type="text"
          placeholder="Where are you going?"
          value={searchParams.location || ''} // Ensure value is always defined
          onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
        />
        <i className="fas fa-map-marker-alt absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      </div>
    </div>

    {/* Check-in */}
    <div className="md:col-span-2">
      <label className="block text-gray-700 text-sm font-medium mb-1">Check-in</label>
      <div className="relative">
        <input
          type="date"
          value={searchParams.checkIn || ''} // Ensure value is always defined
          onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
        />
        <i className="fas fa-calendar-day absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      </div>
    </div>

    {/* Check-out */}
    <div className="md:col-span-2">
      <label className="block text-gray-700 text-sm font-medium mb-1">Check-out</label>
      <div className="relative">
        <input
          type="date"
          value={searchParams.checkOut || ''} // Ensure value is always defined
          onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
        />
        <i className="fas fa-calendar-day absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      </div>
    </div>

    {/* Guests */}
    <div className="md:col-span-2">
      <label className="block text-gray-700 text-sm font-medium mb-1">Guests</label>
      <div className="relative">
        <select
          value={searchParams.guests || ''} // Ensure value is always defined
          onChange={(e) => setSearchParams({ ...searchParams, guests: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 appearance-none"
        >
          <option value="">Select guests</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'guest' : 'guests'}
            </option>
          ))}
        </select>
        <i className="fas fa-user-friends absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      </div>
    </div>

    {/* Search Button */}
    <div className="md:col-span-2 flex items-end">
      <button
        onClick={handleSearch}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center"
      >
        <i className="fas fa-search mr-2"></i> Search
      </button>
    </div>
  </div>
  
          

            
            {/* Advanced Filters */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <i className={`fas fa-chevron-${showFilters ? 'up' : 'down'} mr-1`}></i>
                {showFilters ? 'Hide filters' : 'Show filters'}
              </button>
              
              {showFilters && (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Property Type</label>
                    <select
                      value={searchParams.propertyType}
                      onChange={(e) => setSearchParams({...searchParams, propertyType: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Any type</option>
                      <option value="Entire Home">Entire Home</option>
                      <option value="Private Room">Private Room</option>
                      <option value="Shared Room">Shared Room</option>
                      <option value="PG">PG</option>
                      <option value="Co-Living">Co-Living</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Price Range</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={searchParams.minPrice}
                        onChange={(e) => setSearchParams({...searchParams, minPrice: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={searchParams.maxPrice}
                        onChange={(e) => setSearchParams({...searchParams, maxPrice: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Bedrooms</label>
                    <select
                      value={searchParams.bedrooms}
                      onChange={(e) => setSearchParams({...searchParams, bedrooms: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                      <option value="5">5+</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-3">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Amenities</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {amenities.map(amenity => (
                        <div key={amenity._id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`amenity-${amenity._id}`}
                            checked={searchParams.amenities.includes(amenity._id)}
                            onChange={() => toggleAmenity(amenity._id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`amenity-${amenity._id}`} className="ml-2 text-sm text-gray-700">
                            {amenity.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Featured Properties</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-100"
              >
                <i className="fas fa-sliders-h mr-1"></i> Filters
              </button>
              <button className="px-3 py-1 border rounded-lg text-sm hover:bg-gray-100">
                <i className="fas fa-map-marker-alt mr-1"></i> Map
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-medium text-gray-600">No properties found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search filters</p>
              <button 
                onClick={() => {
                  setSearchParams({
                    location: '',
                    checkIn: '',
                    checkOut: '',
                    guests: 1,
                    propertyType: '',
                    minPrice: '',
                    maxPrice: '',
                    bedrooms: '',
                    amenities: []
                  });
                  handleSearch();
                }}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ListingCard({ listing }) {
  const discountedPrice = listing.price * (1 - (listing.discount / 100));
  
  return (
    <Link 
      to={`/listing/${listing._id}`}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="relative">
        <img 
          src={listing.images[0] || 'https://via.placeholder.com/300x200'} 
          alt={listing.title} 
          className="w-full h-64 object-cover"
        />
        {listing.discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            {listing.discount}% OFF
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-md flex items-center">
          <i className="fas fa-star text-yellow-500 mr-1"></i>
          <span className="font-medium">{listing.rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{listing.title}</h3>
          <div className="text-right">
            {listing.discount > 0 && (
              <span className="text-gray-500 line-through text-sm block">${listing.price}</span>
            )}
            <span className="text-indigo-600 font-bold">₹{discountedPrice.toFixed(2)}<span className="text-gray-500 font-normal">/night</span></span>
          </div>
        </div>
        <p className="text-gray-600 mt-1 text-sm">
          <i className="fas fa-map-marker-alt mr-1 text-indigo-500"></i> {listing.address.city}, {listing.address.country}
        </p>
        <div className="flex mt-4 text-sm text-gray-500 space-x-4">
          <span>
            <i className="fas fa-bed mr-1 text-indigo-500"></i> {listing.bedrooms} {listing.bedrooms === 1 ? 'bed' : 'beds'}
          </span>
          <span>
            <i className="fas fa-bath mr-1 text-indigo-500"></i> {listing.bathrooms} {listing.bathrooms === 1 ? 'bath' : 'baths'}
          </span>
          <span>
            <i className="fas fa-user-friends mr-1 text-indigo-500"></i> {listing.guests} {listing.guests === 1 ? 'guest' : 'guests'}
          </span>
        </div>
        <div className="mt-2">
          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {listing.propertyType}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ListingDetail Component
function ListingDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDates, setBookingDates] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [review, setReview] = useState({
    rating: 5,
    comment: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await axios.get(`/api/listings/${id}`);
        setListing(response.data.listing);
      } catch (err) {
        setError('Failed to fetch listing details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const calculateNights = () => {
    if (!bookingDates.checkIn || !bookingDates.checkOut) return 0;
    const diffTime = new Date(bookingDates.checkOut) - new Date(bookingDates.checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalPrice = listing ? calculateNights() * listing.price * (1 - (listing.discount / 100)) : 0;

  const handleBookNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async () => {
    try {
      const response = await axios.post('/api/bookings', {
        listingId: listing._id,
        startDate: bookingDates.checkIn,
        endDate: bookingDates.checkOut,
        guests: bookingDates.guests,
        paymentMethod
      });
      
      alert('Booking confirmed!');
      setShowBookingModal(false);
      navigate('/bookings');
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await axios.post('/api/wishlist', { listingId: listing._id });
      alert('Added to wishlist!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to wishlist');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reviews', {
        listingId: listing._id,
        rating: review.rating,
        comment: review.comment
      });
      alert('Review submitted!');
      setReview({ rating: 5, comment: '' });
      // Refresh listing to show new review
      const response = await axios.get(`/api/listings/${id}`);
      setListing(response.data.listing);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">{error}</h2>
        <Link 
          to="/" 
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Listing not found</h2>
        <Link 
          to="/" 
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
        >
          Browse Listings
        </Link>
      </div>
    );
  }

  const discountedPrice = listing.price * (1 - (listing.discount / 100));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Image Gallery */}
        <div className="relative">
          <img 
            src={listing.images[0] || 'https://via.placeholder.com/800x500'} 
            alt={listing.title} 
            className="w-full h-96 object-cover"
          />
          {listing.discount > 0 && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold">
              {listing.discount}% OFF
            </div>
          )}
        </div>
        
        <div className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:space-x-8">
            {/* Left Column */}
            <div className="lg:w-2/3">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{listing.title}</h1>
                  <p className="text-gray-600 mt-2">
                    <i className="fas fa-map-marker-alt mr-1 text-indigo-500"></i> 
                    {listing.address.street}, {listing.address.city}, {listing.address.country}
                  </p>
                </div>
                <div className="flex items-center bg-white px-3 py-1 rounded-md">
                  <i className="fas fa-star text-yellow-500 mr-1"></i>
                  <span className="font-medium">{listing.rating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">About this property</h2>
                <p className="text-gray-700">{listing.description}</p>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Property Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-gray-500">Property Type</p>
                    <p className="font-medium">{listing.propertyType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium">{listing.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bedrooms</p>
                    <p className="font-medium">{listing.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bathrooms</p>
                    <p className="font-medium">{listing.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Beds</p>
                    <p className="font-medium">{listing.beds}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Guests</p>
                    <p className="font-medium">{listing.guests}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <i className={`fas ${amenity.icon} text-indigo-500 mr-2`}></i>
                      <span>{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {listing.rules && listing.rules.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">House Rules</h2>
                  <ul className="list-disc pl-5 space-y-2">
                    {listing.rules.map((rule, index) => (
                      <li key={index} className="text-gray-700">{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Reviews</h2>
                {listing.reviews.length === 0 ? (
                  <p className="text-gray-500">No reviews yet</p>
                ) : (
                  <div className="space-y-6">
                    {listing.reviews.map((review) => (
                      <div key={review._id} className="border-b border-gray-200 pb-6">
                        <div className="flex items-center mb-2">
                          <img 
                            src={review.user.profileImagePath || 'https://randomuser.me/api/portraits/men/1.jpg'} 
                            alt={review.user.firstName} 
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                          <div>
                            <p className="font-medium">{review.user.firstName}</p>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <i 
                                  key={i} 
                                  className={`fas fa-star ${i < review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                ></i>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                        {review.response && (
                          <div className="mt-3 pl-4 border-l-4 border-indigo-200">
                            <p className="text-sm font-medium text-gray-600">Owner's response:</p>
                            <p className="text-gray-600">{review.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Review Form (only for users who have stayed here) */}
                {user && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Leave a Review</h3>
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-1">Rating</label>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReview({...review, rating: star})}
                              className="text-2xl focus:outline-none"
                            >
                              <i 
                                className={`fas fa-star ${star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                              ></i>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-1">Comment</label>
                        <textarea
                          value={review.comment}
                          onChange={(e) => setReview({...review, comment: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          rows="4"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                      >
                        Submit Review
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Booking Card */}
            <div className="lg:w-1/3 mt-8 lg:mt-0">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sticky top-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-2xl font-bold text-indigo-600">
                  ₹{discountedPrice.toFixed(2)} <span className="text-base font-normal text-gray-600">per night</span>
                  </div>
                  {listing.discount > 0 && (
                    <span className="text-sm text-gray-500 line-through">${listing.price}</span>
                  )}
                </div>
                
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                      <input 
                        type="date" 
                        value={bookingDates.checkIn}
                        onChange={(e) => setBookingDates({...bookingDates, checkIn: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                      <input 
                        type="date" 
                        value={bookingDates.checkOut}
                        onChange={(e) => setBookingDates({...bookingDates, checkOut: e.target.value})}
                        min={bookingDates.checkIn || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                    <select
                      value={bookingDates.guests}
                      onChange={(e) => setBookingDates({...bookingDates, guests: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {[...Array(listing.guests).keys()].map(num => (
                        <option key={num + 1} value={num + 1}>{num + 1} {num === 0 ? 'guest' : 'guests'}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button 
                    onClick={handleBookNow}
                    disabled={!bookingDates.checkIn || !bookingDates.checkOut}
                    className={`w-full py-3 rounded-lg font-medium ${(!bookingDates.checkIn || !bookingDates.checkOut) ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                  >
                    Book Now
                  </button>
                  
                  {user && (
                    <button 
                      onClick={handleAddToWishlist}
                      className="w-full py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50"
                    >
                      <i className="fas fa-heart mr-2"></i> Add to Wishlist
                    </button>
                  )}
                </div>
                
                {(bookingDates.checkIn && bookingDates.checkOut) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between mb-2">
                      <span>₹{discountedPrice.toFixed(2)} x {calculateNights()} nights</span>
                      <span>₹{(discountedPrice * calculateNights()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Service fee</span>
                      <span>₹25</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>₹{(discountedPrice * calculateNights() + 25).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Confirm Your Booking</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <img 
                    src={listing.images[0] || 'https://via.placeholder.com/300x200'} 
                    alt={listing.title} 
                    className="w-20 h-20 object-cover rounded-lg mr-4"
                  />
                  <div>
                    <h3 className="font-bold">{listing.title}</h3>
                    <p className="text-gray-600 text-sm">{listing.address.city}, {listing.address.country}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{new Date(bookingDates.checkIn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{new Date(bookingDates.checkOut).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-medium">{bookingDates.guests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nights</p>
                    <p className="font-medium">{calculateNights()}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span>₹{discountedPrice.toFixed(2)} x {calculateNights()} nights</span>
                    <span>₹{(discountedPrice * calculateNights()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Service fee</span>
                    <span>₹25</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>₹{(discountedPrice * calculateNights() + 25).toFixed(2)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBookingSubmit}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// HostListings Component
function HostListings() {
  const { user } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isOwner) {
      navigate('/');
      return;
    }
  
    const fetchListings = async () => {
      try {
        const response = await axios.get(`/api/listings/user/${user._id}`);
        setListings(response.data.listings);
      } catch (err) {
        console.error('Failed to fetch listings', err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchListings();
  }, [user, navigate]);

  if (!user || !user.isOwner) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <button 
          onClick={() => navigate('/host/listings/new')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <i className="fas fa-plus mr-2"></i> Add Listing
        </button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse"></div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <i className="fas fa-home text-5xl text-gray-200 mb-4"></i>
          <h3 className="text-xl font-medium text-gray-600">No listings yet</h3>
          <p className="text-gray-500 mt-2 mb-6">Create your first listing to start hosting guests</p>
          <button
            onClick={() => navigate('/host/listings/new')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Add Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative">
                <img 
                  src={listing.images[0] || 'https://via.placeholder.com/300x200'} 
                  alt={listing.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-md flex items-center">
                  <i className="fas fa-star text-yellow-500 mr-1"></i>
                  <span className="font-medium">{listing.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{listing.title}</h3>
                <p className="text-gray-600 mt-1 text-sm">
                  <i className="fas fa-map-marker-alt mr-1 text-indigo-500"></i> {listing.address.city}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-indigo-600 font-bold">₹{listing.price}<span className="text-gray-500 font-normal">/night</span></span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    listing.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {listing.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button 
                    onClick={() => navigate(`/host/listings/${listing._id}`)}
                    className="flex-1 px-3 py-1 border rounded-lg text-sm hover:bg-gray-100"
                  >
                    <i className="fas fa-edit mr-1"></i> Edit
                  </button>
                  <button className="flex-1 px-3 py-1 border rounded-lg text-sm hover:bg-gray-100">
                    <i className="fas fa-chart-bar mr-1"></i> Stats
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// CreateListing Component
function CreateListing() {
  const { user, amenities } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'Entire Home',
    category: 'House',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    lat: '',
    lng: '',
    price: '',
    discount: '',
    bedrooms: '1',
    bathrooms: '1',
    guests: '1',
    beds: '1',
    amenities: [],
    rules: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isOwner) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAmenityChange = (amenityId) => {
    setFormData(prev => {
      const newAmenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('propertyType', formData.propertyType);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('street', formData.street);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('zipCode', formData.zipCode);
      formDataToSend.append('lat', formData.lat);
      formDataToSend.append('lng', formData.lng);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('discount', formData.discount);
      formDataToSend.append('bedrooms', formData.bedrooms);
      formDataToSend.append('bathrooms', formData.bathrooms);
      formDataToSend.append('guests', formData.guests);
      formDataToSend.append('beds', formData.beds);
      formDataToSend.append('amenities', formData.amenities.join(','));
      formDataToSend.append('rules', formData.rules);
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      const response = await axios.post('/api/listings', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/host/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Listing</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Property Type</label>
                <select
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="Entire Home">Entire Home</option>
                  <option value="Private Room">Private Room</option>
                  <option value="Shared Room">Shared Room</option>
                  <option value="PG">PG</option>
                  <option value="Co-Living">Co-Living</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Villa">Villa</option>
                  <option value="Cabin">Cabin</option>
                  <option value="Beach House">Beach House</option>
                  <option value="Countryside">Countryside</option>
                  <option value="Unique stays">Unique stays</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Nightly Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Discount (%)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="4"
                required
              ></textarea>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">State/Province</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">ZIP/Postal Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Latitude (optional)</label>
                <input
                  type="text"
                  name="lat"
                  value={formData.lat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Longitude (optional)</label>
                <input
                  type="text"
                  name="lng"
                  value={formData.lng}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 mb-1">Bedrooms</label>
                <select
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'bedroom' : 'bedrooms'}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Bathrooms</label>
                <select
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'bathroom' : 'bathrooms'}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Max Guests</label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'guest' : 'guests'}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Beds</label>
                <select
                  name="beds"
                  value={formData.beds}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'bed' : 'beds'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {amenities.map(amenity => (
                <div key={amenity._id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`amenity-${amenity._id}`}
                    checked={formData.amenities.includes(amenity._id)}
                    onChange={() => handleAmenityChange(amenity._id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`amenity-${amenity._id}`} className="ml-2 text-gray-700">
                    <i className={`fas ${amenity.icon} mr-1 text-indigo-500`}></i> {amenity.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">House Rules</h2>
            <div>
              <label className="block text-gray-700 mb-1">Rules (comma separated)</label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="3"
                placeholder="No smoking, No pets, No parties..."
              ></textarea>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Photos</h2>
            <div>
              <label className="block text-gray-700 mb-1">Upload Images (max 10)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">First image will be used as the cover photo</p>
              
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Preview ${index}`} 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = [...images];
                          const newPreviews = [...imagePreviews];
                          newImages.splice(index, 1);
                          newPreviews.splice(index, 1);
                          setImages(newImages);
                          setImagePreviews(newPreviews);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/host/listings')}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Saving...
                </>
              ) : (
                'Create Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// EditListing Component (similar to CreateListing but with existing data)
function EditListing() {
  const { id } = useParams();
  const { user, amenities } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'Entire Home',
    category: 'House',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    lat: '',
    lng: '',
    price: '',
    discount: '',
    bedrooms: '1',
    bathrooms: '1',
    guests: '1',
    beds: '1',
    amenities: [],
    rules: ''
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isOwner) {
      navigate('/');
      return;
    }

    const fetchListing = async () => {
      try {
        const response = await axios.get(`/api/listings/${id}`);
        const listing = response.data.listing;
        
        // Check if current user is the owner of the listing
        if (listing.creator._id !== user._id) {
          navigate('/host/listings');
          return;
        }

        setFormData({
          title: listing.title,
          description: listing.description,
          propertyType: listing.propertyType,
          category: listing.category,
          street: listing.address.street,
          city: listing.address.city,
          state: listing.address.state,
          country: listing.address.country,
          zipCode: listing.address.zipCode,
          lat: listing.address.coordinates?.lat || '',
          lng: listing.address.coordinates?.lng || '',
          price: listing.price,
          discount: listing.discount,
          bedrooms: listing.bedrooms.toString(),
          bathrooms: listing.bathrooms.toString(),
          guests: listing.guests.toString(),
          beds: listing.beds.toString(),
          amenities: listing.amenities.map(a => a._id),
          rules: listing.rules.join(', ')
        });

        setExistingImages(listing.images);
      } catch (err) {
        console.error('Failed to fetch listing', err);
        setError('Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAmenityChange = (amenityId) => {
    setFormData(prev => {
      const newAmenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleRemoveExistingImage = (imagePath) => {
    setExistingImages(existingImages.filter(img => img !== imagePath));
  };

  const handleRemoveNewImage = (index) => {
    const newImagesCopy = [...newImages];
    const newPreviewsCopy = [...imagePreviews];
    newImagesCopy.splice(index, 1);
    newPreviewsCopy.splice(index, 1);
    setNewImages(newImagesCopy);
    setImagePreviews(newPreviewsCopy);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('propertyType', formData.propertyType);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('street', formData.street);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('zipCode', formData.zipCode);
      formDataToSend.append('lat', formData.lat);
      formDataToSend.append('lng', formData.lng);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('discount', formData.discount);
      formDataToSend.append('bedrooms', formData.bedrooms);
      formDataToSend.append('bathrooms', formData.bathrooms);
      formDataToSend.append('guests', formData.guests);
      formDataToSend.append('beds', formData.beds);
      formDataToSend.append('amenities', formData.amenities.join(','));
      formDataToSend.append('rules', formData.rules);
      formDataToSend.append('existingImages', existingImages.join(','));
      newImages.forEach(image => {
        formDataToSend.append('images', image);
      });

      await axios.put(`/api/listings/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/host/listings');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-xl font-bold mb-4">{error}</h2>
          <button
            onClick={() => navigate('/host/listings')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form fields same as CreateListing */}
          {/* ... */}
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Photos</h2>
            <div>
              <label className="block text-gray-700 mb-1">Existing Images</label>
              {existingImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Listing ${index}`} 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(image)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-4">No existing images</p>
              )}
              
              <label className="block text-gray-700 mb-1">Add New Images (max 10)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              
              {imagePreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={preview} 
                        alt={`Preview ${index}`} 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/host/listings')}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Saving...
                </>
              ) : (
                'Update Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// HostBookings Component
function HostBookings() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isOwner) {
      navigate('/');
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await axios.get('/api/bookings/host');
        setBookings(response.data.bookings);
      } catch (err) {
        console.error('Failed to fetch bookings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status });
      setBookings(bookings.map(booking => 
        booking._id === bookingId ? { ...booking, status } : booking
      ));
    } catch (err) {
      console.error('Failed to update booking status', err);
      alert(err.response?.data?.message || 'Failed to update booking');
    }
  };

  if (!user || !user.isOwner) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <button 
          onClick={() => navigate('/host/listings')}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
        >
          <i className="fas fa-home mr-2"></i> My Listings
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <i className="fas fa-calendar-alt text-5xl text-gray-200 mb-4"></i>
          <h3 className="text-xl font-medium text-gray-600">No bookings yet</h3>
          <p className="text-gray-500 mt-2 mb-6">When guests book your listings, they'll appear here</p>
          <button
            onClick={() => navigate('/host/listings/new')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Add Listing
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row">
                <img 
                  src={booking.listing.images[0] || 'https://via.placeholder.com/300x200'} 
                  alt={booking.listing.title} 
                  className="w-full md:w-48 h-48 object-cover rounded-lg mb-4 md:mb-0 md:mr-6"
                />
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{booking.listing.title}</h3>
                      <p className="text-gray-600 mt-1">
                        <i className="fas fa-map-marker-alt mr-1 text-indigo-500"></i> {booking.listing.address.city}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Guest</p>
                      <div className="flex items-center mt-1">
                        <img 
                          src={booking.customer.profileImagePath || 'https://randomuser.me/api/portraits/men/1.jpg'} 
                          alt={booking.customer.firstName} 
                          className="w-8 h-8 rounded-full object-cover mr-2"
                        />
                        <p className="font-medium">{booking.customer.firstName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-medium">
                        {new Date(booking.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-medium">
                        {new Date(booking.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-medium">${booking.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="mt-6 flex space-x-3">
                      <button 
                        onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Confirm Booking
                      </button>
                      <button 
                        onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Reject Booking
                      </button>
                    </div>
                  )}
                  
                  {booking.status === 'confirmed' && new Date(booking.endDate) < new Date() && (
                    <div className="mt-6">
                      <button 
                        onClick={() => updateBookingStatus(booking._id, 'completed')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Wishlist Component
function Wishlist() {
  const { user } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchWishlist = async () => {
      try {
        const response = await axios.get('/api/wishlist');
        setWishlist(response.data.wishList);
      } catch (err) {
        console.error('Failed to fetch wishlist', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user, navigate]);

  const removeFromWishlist = async (listingId) => {
    try {
      await axios.delete(`/api/wishlist/${listingId}`);
      setWishlist(wishlist.filter(item => item._id !== listingId));
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Wishlist</h1>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
        >
          <i className="fas fa-search mr-2"></i> Find a stay
        </button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-96 animate-pulse"></div>
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <i className="fas fa-heart text-5xl text-gray-200 mb-4"></i>
          <h3 className="text-xl font-medium text-gray-600">Your wishlist is empty</h3>
          <p className="text-gray-500 mt-2 mb-6">Save listings you love to your wishlist</p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Browse Listings
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((listing) => (
            <div key={listing._id} className="bg-white rounded-xl shadow-md overflow-hidden relative">
              <button
                onClick={() => removeFromWishlist(listing._id)}
                className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 z-10"
              >
                <i className="fas fa-heart text-red-500"></i>
              </button>
              <Link to={`/listing/${listing._id}`}>
                <div className="relative">
                  <img 
                    src={listing.images[0] || 'https://via.placeholder.com/300x200'} 
                    alt={listing.title} 
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white bg-opacity-90 px-2 py-1 rounded-md flex items-center">
                    <i className="fas fa-star text-yellow-500 mr-1"></i>
                    <span className="font-medium">{listing.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{listing.title}</h3>
                  <p className="text-gray-600 mt-1 text-sm">
                    <i className="fas fa-map-marker-alt mr-1 text-indigo-500"></i> {listing.address.city}, {listing.address.country}
                  </p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-indigo-600 font-bold">₹{listing.price}<span className="text-gray-500 font-normal">/night</span></span>
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {listing.propertyType}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Bookings Component (similar to your existing one, but connected to backend)
function Bookings() {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchBookings = async () => {
      try {
        const response = await axios.get('/api/bookings/user');
        setBookings(response.data.bookings);
      } catch (err) {
        console.error('Failed to fetch bookings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md mx-auto">
          <i className="fas fa-calendar-alt text-5xl text-indigo-100 mb-4"></i>
          <h2 className="text-2xl font-bold mb-4">Please login to view your bookings</h2>
          <p className="text-gray-600 mb-6">Sign in to see your upcoming trips and booking history</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 border rounded-lg hover:bg-gray-100"
        >
          <i className="fas fa-search mr-2"></i> Find a stay
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <i className="fas fa-calendar-alt text-5xl text-gray-200 mb-4"></i>
          <h3 className="text-xl font-medium text-gray-600">No bookings yet</h3>
          <p className="text-gray-500 mt-2 mb-6">Start exploring properties to make your first booking</p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
          >
            Browse Listings
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row">
                <img 
                  src={booking.listing.images[0] || 'https://via.placeholder.com/300x200'} 
                  alt={booking.listing.title} 
                  className="w-full md:w-48 h-48 object-cover rounded-lg mb-4 md:mb-0 md:mr-6"
                />
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{booking.listing.title}</h3>
                      <p className="text-gray-600 mt-1">
                        <i className="fas fa-map-marker-alt mr-1 text-indigo-500"></i> {booking.listing.address.city}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Check-in</p>
                      <p className="font-medium">
                        {new Date(booking.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Check-out</p>
                      <p className="font-medium">
                        {new Date(booking.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Guests</p>
                      <p className="font-medium">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-medium">${booking.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <button className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                      <i className="fas fa-envelope mr-2"></i> Message host
                    </button>
                    <button className="px-4 py-2 border rounded-lg hover:bg-gray-100">
                      <i className="fas fa-receipt mr-2"></i> View receipt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Account Component (similar to your existing one, but connected to backend)
function Account() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    about: '',
    profileImage: null
  });
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFormData({
      firstName: user.firstName,
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      about: user.about || ''
    });
    if (user.profileImagePath) {
      setProfileImagePreview(user.profileImagePath);
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        profileImage: file
      });
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateUser(formData);
      if (result.success) {
        setSuccess('Profile updated successfully');
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <img 
                  src={profileImagePreview || 'https://randomuser.me/api/portraits/men/1.jpg'} 
                  alt={user.firstName} 
                  className="w-24 h-24 rounded-full object-cover"
                />
                <label htmlFor="profileImage" className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 cursor-pointer">
                  <i className="fas fa-camera text-indigo-600"></i>
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-600">{user.email}</p>
              {user.isOwner && (
                <span className="mt-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                  Property Owner
                </span>
              )}
            </div>
            
            <nav className="space-y-2">
              <button className="w-full text-left px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                <i className="fas fa-user-circle mr-2"></i> Account
              </button>
              <button 
                onClick={() => navigate('/bookings')}
                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <i className="fas fa-calendar-alt mr-2"></i> Bookings
              </button>
              <button 
                onClick={() => navigate('/wishlist')}
                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <i className="fas fa-heart mr-2"></i> Wishlist
              </button>
              {user.isOwner && (
                <>
                  <button 
                    onClick={() => navigate('/host/listings')}
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <i className="fas fa-home mr-2"></i> My Listings
                  </button>
                  <button 
                    onClick={() => navigate('/host/bookings')}
                    className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <i className="fas fa-calendar mr-2"></i> Host Bookings
                  </button>
                </>
              )}
              <button 
                onClick={logout}
                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <i className="fas fa-sign-out-alt mr-2"></i> Logout
              </button>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="md:w-2/3">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg">
              {success}
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-6">Account Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">About</label>
                <textarea
                  name="about"
                  value={formData.about}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 px-6 py-2 rounded-lg font-medium ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Security</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Password</label>
                <div className="flex items-center">
                  <input
                    type="password"
                    value="••••••••"
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50"
                  />
                  <button className="ml-2 text-indigo-600 hover:text-indigo-700">
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <i className="fas fa-shield-alt text-gray-400 mr-2"></i>
                <span className="text-gray-600">Two-factor authentication: <span className="text-gray-400">Not enabled</span></span>
                <button className="ml-auto text-indigo-600 hover:text-indigo-700 text-sm">
                  Enable
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Login and Register Components (similar to your existing ones, but connected to backend)
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-gray-600 mt-2">Login to your account</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isOwner: false,
    phoneNumber: '',
    profileImage: null
  });
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        profileImage: file
      });
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await register(formData);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Create your account</h2>
          <p className="text-gray-600 mt-2">Join us today</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src={profileImagePreview || 'https://randomuser.me/api/portraits/men/1.jpg'} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover"
              />
              <label htmlFor="profileImage" className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 cursor-pointer">
                <i className="fas fa-camera text-indigo-600"></i>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
              minLength="6"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOwner"
              name="isOwner"
              checked={formData.isOwner}
              onChange={(e) => setFormData({...formData, isOwner: e.target.checked})}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isOwner" className="ml-2 text-gray-700">
              I want to list my property
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i> Registering...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Footer Component (similar to your existing one)
function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">StayEase</h3>
            <p className="text-gray-400">
              Find your perfect stay anywhere in the world. Book unique homes and experiences.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white">Popular locations</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white">New listings</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white">Experiences</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Hosting</h4>
            <ul className="space-y-2">
              <li><Link to="/register" className="text-gray-400 hover:text-white">Become a host</Link></li>
              <li><Link to="/host/listings" className="text-gray-400 hover:text-white">Host resources</Link></li>
              <li><Link to="/" className="text-gray-400 hover:text-white">Safety information</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white">About us</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-white">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} StayEase, Inc. All rights reserved.
          </div>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default App;