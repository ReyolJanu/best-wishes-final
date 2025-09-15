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
            <div className="md:hidden flex items-center">
              <div className="cursor-pointer hover:text-[#822BE2] transition-colors mr-4" onClick={() => handleNavigation('/user/checkout')}>
                <div className="relative">
                  <MdOutlineShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full px-1.5 py-0.5">{cartCount}</span>
                  )}
                </div>
              </div>
              <button onClick={toggleMenu} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                {isMenuOpen ? <HiX size={26} className="text-gray-600" /> : <HiMenu size={26} className="text-gray-600" />}
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
          <div className="absolute w-full md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-4 text-sm">
              <div className="space-y-3">
                <div onClick={() => handleNavigation('/services')} className="cursor-pointer hover:text-[#822BE2] transition-colors py-2">Services</div>

                {/* Gift Combo */}
                <div className="cursor-pointer" onClick={() => setGiftDropdownOpen(!giftDropdownOpen)}>
                  <div className="hover:text-[#822BE2] transition-colors py-2 flex justify-between items-center">
                    <span>Gift Combo</span>
                    <svg className={`w-4 h-4 transition-transform ${giftDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {giftDropdownOpen && (
                    <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-100 pl-3">
                      <div className="hover:text-[#822BE2] transition-colors py-1.5" onClick={() => handleNavigation('/surprisegift')}>Surprise Gift Delivery</div>
                      <div className="hover:text-[#822BE2] transition-colors py-1.5" onClick={() => handleNavigation('/user/customizegifts')}>Customizable Gift</div>
                      <div className="hover:text-[#822BE2] transition-colors py-1.5" onClick={openModal}>Reminder Gift</div>
                    </div>
                  )}
                </div>

                <div className="cursor-pointer hover:text-[#822BE2] transition-colors py-2">About Us</div>

                {user ? (
                  <>
                    <div className="hover:text-[#822BE2] transition-colors py-2" onClick={() => handleNavigation('/user/profile')}>Profile</div>
                    <div className="hover:text-[#822BE2] transition-colors py-2" onClick={() => handleNavigation('/user/wishlist')}>Wishlists</div>
                    <div className="hover:text-[#822BE2] transition-colors py-2" onClick={() => handleNavigation('/user/history')}>History</div>
                    <div className="hover:text-[#822BE2] transition-colors py-2" onClick={() => handleNavigation('/dashboard/collaborative-purchases')}>Collaborative Purchases</div>
                    <div className="text-red-500 hover:text-red-600 transition-colors py-2" onClick={logoutHandler}>Logout</div>
                  </>
                ) : (
                  <div className="hover:text-[#822BE2] transition-colors py-2" onClick={() => handleNavigation('/login')}>Login</div>
                )}
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
