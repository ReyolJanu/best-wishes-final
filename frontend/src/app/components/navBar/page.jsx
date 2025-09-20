'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import logo from '../../../../public/logo.png';
import { MdOutlineShoppingCart } from 'react-icons/md';
import { CiSearch } from 'react-icons/ci';
import { HiMenu, HiX } from 'react-icons/hi';
import { useDispatch, useSelector } from 'react-redux';
import { userLogout } from '@/app/slices/userSlice';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import ReminderGift from '../../modal/reminder/ReminderModal';
import { Heart } from 'lucide-react';
import { clearCart } from '@/app/slices/cartSlice';
import { clearWishlist } from '@/app/slices/wishlistSlice';
import NotificationDropdown from '../../../components/NotificationDropdown';
import { 
  FaServicestack, 
  FaGift, 
  FaInfoCircle, 
  FaUser, 
  FaHistory, 
  FaUsers, 
  FaSignOutAlt, 
  FaSignInAlt,
  FaBell,
  FaChevronDown,
  FaChevronRight
} from 'react-icons/fa';
import { BiCustomize } from 'react-icons/bi';
import { MdCardGiftcard } from 'react-icons/md';

function Navbar() {
  const { user } = useSelector((state) => state.userState);
  const cartCount = useSelector((state) => state.cartState.items.length);
  const wishlistCount = useSelector((state) => state.wishlistState.items.length);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [giftDropdownOpen, setGiftDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [imageError, setImageError] = useState(false);
  const searchRef = useRef(null);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      setIsSearching(true);
      try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products?search=${encodeURIComponent(query)}`);
        console.log('Search results:', data);
        setSearchResults(data.data || []);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/allProducts?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchFocused(false);
    }
  };

  const handleProductClick = (id) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
    router.push(`/productDetail/${id}`);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeModal = () => setShowModal(false);
  const openModal = () => setShowModal(true);

  const handleNavigation = (path) => {
    setIsMenuOpen(false);
    router.push(path);
  };

  const logoutHandler = async () => {
    try {
      // Call the backend logout endpoint to clear the cookie
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {}, { withCredentials: true });
      dispatch(userLogout());
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
    dispatch(clearCart());
    dispatch(clearWishlist());
    setUserDropdownOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 ">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-[80px] ">
            {/* Logo */}
            <div className="flex items-center hover:cursor-pointer ">
              <Image  onClick={() => handleNavigation('/')}  src={logo} alt="Logo" width={200} className="h-auto" />
            </div>

            {/* Desktop Search + Menu */}
            <div className="hidden md:flex items-center gap-8 flex-1 justify-end">
              {/* Search */}
              <div className="relative" ref={searchRef}>
                <div className="flex items-center border border-gray-200 rounded-md px-4 h-[50px] w-[320px] bg-gray-50">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-transparent outline-none text-base text-gray-600 placeholder-gray-400"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  />
                  <CiSearch size={22} className="text-gray-400 cursor-pointer" onClick={handleSearchSubmit}/>
                </div>
                {isSearchFocused && searchQuery.length > 1 && (
                  <ul className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {isSearching && (
                      <li className="px-4 py-2 text-gray-500 text-center">
                        Searching...
                      </li>
                    )}
                    {!isSearching && searchResults.length === 0 && (
                      <li className="px-4 py-2 text-gray-500 text-center">
                        No products found
                      </li>
                    )}
                    {!isSearching && searchResults.length > 0 && searchResults.map((product) => (
                      <li
                        key={product._id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleProductClick(product._id)}
                      >
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.shortDescription}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Links */}
              <ul className="flex items-center gap-8 text-sm font-medium text-gray-700">
                <li onClick={() => handleNavigation('/services')} className="cursor-pointer hover:text-[#822BE2] transition-colors">Services</li>

                {/* Gift Combo */}
                <li className="relative cursor-pointer" onClick={() => setGiftDropdownOpen(!giftDropdownOpen)}>
                  <div className="flex items-center hover:text-[#822BE2] transition-colors">
                    Gift Combo
                    <svg className={`ml-1 w-4 h-4 transition-transform ${giftDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {giftDropdownOpen && (
                    <ul className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-56 text-sm z-50">
                      <li className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleNavigation('/surprisegift')}>Surprise Gift Delivery</li>
                      <li className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"  onClick={() => handleNavigation('/user/customizegifts')} >Customizable Gift</li>
                      <li className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={openModal}>Reminder Gift</li>
                    </ul>
                  )}
                </li>

                <li onClick={() => handleNavigation('/aboutUs')} className="cursor-pointer hover:text-[#822BE2] transition-colors">About Us</li>
                <li className="cursor-pointer hover:text-[#822BE2] transition-colors" onClick={() => handleNavigation('/user/checkout')}>
                  <div className="relative">
                    <MdOutlineShoppingCart size={24} />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full px-1.5 py-0.5">{cartCount}</span>
                    )}
                  </div>
                </li>
                <li className="cursor-pointer hover:text-[#822BE2] transition-colors" onClick={() => handleNavigation('/user/wishlist')}>
                  <div className="relative">
                    <Heart size={22} className="text-[#822BE2]" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full px-1.5 py-0.5">{wishlistCount}</span>
                    )}
                  </div>
                </li>

                {/* Notifications - Only show for logged in users */}
                {user && (
                  <li>
                    <NotificationDropdown />
                  </li>
                )}

                {/* User */}
                <li className="relative cursor-pointer">
                  {user ? (
                    <div onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center text-[#822BE2] font-medium">
                      {user.firstName}
                      <svg className={`ml-1 w-4 h-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  ) : (
                    <span onClick={() => handleNavigation('/login')} className="hover:text-[#822BE2] transition-colors">Login</span>
                  )}

                  {userDropdownOpen && (
                    <ul className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-40 text-sm z-50">
                      <li className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleNavigation('/user/profile')}>Profile</li>
                      <li className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleNavigation('/user/wishlist')}>Wishlists</li>
                      <li className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleNavigation('/user/history')}>History</li>
                      <li className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleNavigation('/dashboard/collaborative-purchases')}>Collaborative Purchases</li>
                      <li className="px-4 py-3 hover:bg-red-50 cursor-pointer text-red-500 transition-colors" onClick={logoutHandler}>Logout</li>
                    </ul>
                  )}
                </li>
              </ul>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              {/* Wishlist */}
              <div className="cursor-pointer hover:text-[#822BE2] transition-colors" onClick={() => handleNavigation('/user/wishlist')}>
                <div className="relative">
                  <Heart size={22} className="text-[#822BE2]" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full px-1.5 py-0.5">{wishlistCount}</span>
                  )}
                </div>
              </div>
              
              {/* Cart */}
              <div className="cursor-pointer hover:text-[#822BE2] transition-colors" onClick={() => handleNavigation('/user/checkout')}>
                <div className="relative">
                  <MdOutlineShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full px-1.5 py-0.5">{cartCount}</span>
                  )}
                </div>
              </div>
              
              {/* Menu Button */}
              <button 
                onClick={toggleMenu} 
                className={`p-2 rounded-lg transition-all duration-300 ${isMenuOpen ? 'bg-gray-600 text-white' : 'hover:bg-gray-100'}`}
              >
                {isMenuOpen ? <HiX size={20} className="text-white" /> : <HiMenu size={20} className="text-gray-600" />}
              </button>
            </div>
          </div>
          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4 relative" ref={searchRef}>
            <div className="flex items-center border border-gray-200 rounded-md px-4 h-[50px] w-full bg-gray-50">
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent outline-none text-base text-gray-600 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
              />
              <CiSearch size={22} className="text-gray-400 cursor-pointer" onClick={handleSearchSubmit}/>
            </div>
            {isSearchFocused && searchQuery.length > 1 && (
              <ul className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {isSearching && (
                  <li className="px-4 py-2 text-gray-500 text-center">
                    Searching...
                  </li>
                )}
                {!isSearching && searchResults.length === 0 && (
                  <li className="px-4 py-2 text-gray-500 text-center">
                    No products found
                  </li>
                )}
                {!isSearching && searchResults.length > 0 && searchResults.map((product) => (
                  <li
                    key={product._id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleProductClick(product._id)}
                  >
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.shortDescription}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-[80px] md:hidden bg-white/50 backdrop-blur-lg shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-top duration-300">
            <div className="px-6 py-6">
              {/* User Section */}
              {user && (
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/30 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-800/30 rounded-full flex items-center justify-center overflow-hidden">
                      {user.profileImage && !imageError ? (
                        <Image
                          src={user.profileImage}
                          alt={`${user.firstName}'s profile`}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <FaUser className="text-gray-700 text-lg" />
                      )}
                    </div>
                    <div>
                      <p className="text-gray-800 font-semibold text-lg">Welcome back!</p>
                      <p className="text-gray-600 text-sm">{user.firstName} {user.lastName}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {/* Services */}
                <div 
                  onClick={() => handleNavigation('/services')} 
                  className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all duration-300 cursor-pointer border border-white/30 shadow-lg"
                >
                  <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                    <FaServicestack className="text-blue-600 text-lg" />
                  </div>
                  <span className="text-gray-800 font-medium text-lg">Services</span>
                  <FaChevronRight className="text-gray-600 ml-auto" />
                </div>

                {/* Gift Combo */}
                <div className="bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg overflow-hidden">
                  <div 
                    className="flex items-center space-x-4 p-4 hover:bg-white/30 transition-all duration-300 cursor-pointer"
                    onClick={() => setGiftDropdownOpen(!giftDropdownOpen)}
                  >
                    <div className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center">
                      <FaGift className="text-purple-600 text-lg" />
                    </div>
                    <span className="text-gray-800 font-medium text-lg">Gift Combo</span>
                    <FaChevronDown className={`text-gray-600 ml-auto transition-transform duration-300 ${giftDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {giftDropdownOpen && (
                    <div className="bg-white/10 border-t border-white/20 animate-in slide-in-from-top duration-300">
                      <div 
                        className="flex items-center space-x-4 p-4 pl-8 hover:bg-white/20 transition-all duration-300 cursor-pointer"
                        onClick={() => handleNavigation('/surprisegift')}
                      >
                        <MdCardGiftcard className="text-gray-600 text-lg" />
                        <span className="text-gray-700 font-medium">Surprise Gift Delivery</span>
                      </div>
                      <div 
                        className="flex items-center space-x-4 p-4 pl-8 hover:bg-white/20 transition-all duration-300 cursor-pointer"
                        onClick={() => handleNavigation('/user/customizegifts')}
                      >
                        <BiCustomize className="text-gray-600 text-lg" />
                        <span className="text-gray-700 font-medium">Customizable Gift</span>
                      </div>
                      <div 
                        className="flex items-center space-x-4 p-4 pl-8 hover:bg-white/20 transition-all duration-300 cursor-pointer"
                        onClick={openModal}
                      >
                        <FaBell className="text-gray-600 text-lg" />
                        <span className="text-gray-700 font-medium">Reminder Gift</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* About Us */}
                <div 
                  onClick={() => handleNavigation('/aboutUs')} 
                  className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all duration-300 cursor-pointer border border-white/30 shadow-lg"
                >
                  <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                    <FaInfoCircle className="text-green-600 text-lg" />
                  </div>
                  <span className="text-gray-800 font-medium text-lg">About Us</span>
                  <FaChevronRight className="text-gray-600 ml-auto" />
                </div>

                {/* Wishlist with count */}
                <div 
                  onClick={() => handleNavigation('/user/wishlist')} 
                  className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all duration-300 cursor-pointer border border-white/30 shadow-lg"
                >
                  <div className="w-10 h-10 bg-pink-500/30 rounded-lg flex items-center justify-center relative">
                    <Heart className="text-pink-600 text-lg" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-800 font-medium text-lg">Wishlist</span>
                  <FaChevronRight className="text-gray-600 ml-auto" />
                </div>

                {user ? (
                  <>
                    {/* Profile */}
                    <div 
                      onClick={() => handleNavigation('/user/profile')} 
                      className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all duration-300 cursor-pointer border border-white/30 shadow-lg"
                    >
                      <div className="w-10 h-10 bg-indigo-500/30 rounded-lg flex items-center justify-center">
                        <FaUser className="text-indigo-600 text-lg" />
                      </div>
                      <span className="text-gray-800 font-medium text-lg">Profile</span>
                      <FaChevronRight className="text-gray-600 ml-auto" />
                    </div>

                    {/* History */}
                    <div 
                      onClick={() => handleNavigation('/user/history')} 
                      className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all duration-300 cursor-pointer border border-white/30 shadow-lg"
                    >
                      <div className="w-10 h-10 bg-yellow-500/30 rounded-lg flex items-center justify-center">
                        <FaHistory className="text-yellow-600 text-lg" />
                      </div>
                      <span className="text-gray-800 font-medium text-lg">Order History</span>
                      <FaChevronRight className="text-gray-600 ml-auto" />
                    </div>

                    {/* Collaborative Purchases */}
                    <div 
                      onClick={() => handleNavigation('/dashboard/collaborative-purchases')} 
                      className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-all duration-300 cursor-pointer border border-white/30 shadow-lg"
                    >
                      <div className="w-10 h-10 bg-teal-500/30 rounded-lg flex items-center justify-center">
                        <FaUsers className="text-teal-600 text-lg" />
                      </div>
                      <span className="text-gray-800 font-medium text-lg">Collaborative Purchases</span>
                      <FaChevronRight className="text-gray-600 ml-auto" />
                    </div>

                    {/* Logout */}
                    <div 
                      onClick={logoutHandler} 
                      className="flex items-center space-x-4 bg-red-500/20 backdrop-blur-sm rounded-xl p-4 hover:bg-red-500/30 transition-all duration-300 cursor-pointer border border-red-400/40 shadow-lg mt-6"
                    >
                      <div className="w-10 h-10 bg-red-500/30 rounded-lg flex items-center justify-center">
                        <FaSignOutAlt className="text-red-600 text-lg" />
                      </div>
                      <span className="text-red-700 font-medium text-lg">Logout</span>
                      <FaChevronRight className="text-red-500 ml-auto" />
                    </div>
                  </>
                ) : (
                  /* Login */
                  <div 
                    onClick={() => handleNavigation('/login')} 
                    className="flex items-center space-x-4 bg-green-500/20 backdrop-blur-sm rounded-xl p-4 hover:bg-green-500/30 transition-all duration-300 cursor-pointer border border-green-400/40 shadow-lg mt-6"
                  >
                    <div className="w-10 h-10 bg-green-500/30 rounded-lg flex items-center justify-center">
                      <FaSignInAlt className="text-green-600 text-lg" />
                    </div>
                    <span className="text-green-700 font-medium text-lg">Login</span>
                    <FaChevronRight className="text-green-500 ml-auto" />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-400/30">
                <p className="text-gray-600 text-center text-sm">
                  Made with ❤️ for amazing gifts
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Reminder Gift Modal */}
      {showModal && <ReminderGift onClose={closeModal} />}
    </>
  );
}

export default Navbar;
