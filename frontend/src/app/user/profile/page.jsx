"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { FiMail, FiPhone, FiMapPin, FiShoppingBag, FiLogOut, FiEdit2, FiUser, FiEye, FiEyeOff, FiClock, FiGift } from "react-icons/fi";
import Navbar from "@/app/components/navBar/page";
import axios from "axios";
import { toast, Toaster } from 'sonner';
import { FaUser } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { updateUserProfile } from "../../slices/userSlice";
import { IoCloseCircleOutline } from "react-icons/io5";
import { useRef } from "react";
import { userLogout } from '@/app/slices/userSlice';
import { clearCart } from '@/app/slices/cartSlice';
import { clearWishlist } from '@/app/slices/wishlistSlice';
import { fetchUserProfile } from '../../actions/userActions'; // import at the top
import Footer from "../../components/footer/page";
import SurpriseGiftPaymentModal from "../../modal/payment/SurpriseGiftPaymentModal";

export default function ProfilePage() {
  const { user } = useSelector(state => state.userState);
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reminder state
  const [reminders, setReminders] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [editReminder, setEditReminder] = useState(null);
  const [editFields, setEditFields] = useState({ remindermsg: '', date: '', time: '', event: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);

  const [profileImage, setProfileImage] = useState(""); // Only used for upload, not for display
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  // Add at the top, after other state declarations
  const [contributions, setContributions] = useState([]);
  const [contributionsLoading, setContributionsLoading] = useState(false);

  // Add modal state
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Orders summary state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  // Surprise gifts state
  const [surpriseGifts, setSurpriseGifts] = useState([]);
  const [surpriseLoading, setSurpriseLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState('personal');
  const [activeBottomTab, setActiveBottomTab] = useState('orders');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSurpriseGift, setSelectedSurpriseGift] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      setPhone(user.phone || '');
      setAddress(user.address || '');
      // No need to setProfileImage for display; always use user.profileImage
      setSelectedFile(null);
      setPreviewUrl("");
      setTimeout(() => setIsLoading(false), 800);
      fetchReminders();
    }
  }, [user, router]);

  // Fetch user contributions
  useEffect(() => {
    if (!user) return;
    const fetchContributions = async () => {
      setContributionsLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/gift`, { withCredentials: true });
        setContributions(res.data || []);
      } catch (err) {
        setContributions([]);
      } finally {
        setContributionsLoading(false);
      }
    };
    fetchContributions();
  }, [user]);

  
  const logoutHandler = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {}, { withCredentials: true });
      dispatch(userLogout());
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
    }
    dispatch(clearCart());
    dispatch(clearWishlist());
  };

  // Fetch user orders for summary
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/orders/history`, { withCredentials: true });
        setOrders(res.data?.orders || []);
      } catch (err) {
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Fetch surprise gifts
  useEffect(() => {
    if (!user) return;
    const fetchSurprises = async () => {
      setSurpriseLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/surprise/my`, { withCredentials: true });
        setSurpriseGifts(res.data?.data || []);
      } catch (err) {
        setSurpriseGifts([]);
      } finally {
        setSurpriseLoading(false);
      }
    };
    fetchSurprises();
  }, [user]);

  const fetchReminders = async () => {
    setReminderLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reminder`, { withCredentials: true });
      setReminders(res.data.reminders || []);
    } catch (err) {
      toast.error('Failed to fetch reminders');
    } finally {
      setReminderLoading(false);
    }
  };

  const openEditModal = (reminder) => {
    setEditReminder(reminder);
    setEditFields({
      remindermsg: reminder.remindermsg,
      date: reminder.date ? reminder.date.slice(0, 10) : '',
      time: reminder.time || '',
      event: reminder.event || '',
    });
  };

  const handlePayment = (surpriseGiftId, amount) => {
    // Find the surprise gift to pass to modal
    const gift = surpriseGifts.find(g => g._id === surpriseGiftId);
    if (gift) {
      setSelectedSurpriseGift(gift);
      setShowPaymentModal(true);
    }
  };

  const processPayment = async (paymentId, paymentMethod) => {
    try {
      setPaymentProcessing(true);
      
      // Call the payment endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/surprise/${selectedSurpriseGift._id}/payment`,
        { 
          paymentId: paymentId,
          paymentMethod: paymentMethod 
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success('Payment completed successfully!');
        // Refresh surprise gifts to update status
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/surprise/my`, { withCredentials: true });
        setSurpriseGifts(res.data?.data || []);
        setShowPaymentModal(false);
        setSelectedSurpriseGift(null);
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };
  const closeEditModal = () => {
    setEditReminder(null);
    setEditFields({ remindermsg: '', date: '', time: '', event: '' });
    setIsAddMode(false);
  };
  const handleEditChange = (e) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };
  const handleEditSave = async () => {
    if (!editFields.remindermsg || !editFields.date || !editFields.time || !editFields.event) {
      toast.error('Please fill all fields');
      return;
    }
    setEditSaving(true);
    try {
      if (isAddMode) {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/reminder`, editFields, { withCredentials: true });
        toast.success('Reminder created!');
      } else {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reminder/${editReminder._id}`, editFields, { withCredentials: true });
        toast.success('Reminder updated!');
      }
      closeEditModal();
      fetchReminders();
    } catch (err) {
      toast.error('Failed to update reminder');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    setDeleteLoadingId(reminderId);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/reminder/${reminderId}`, { withCredentials: true });
      toast.success('Reminder deleted!');
      fetchReminders();
    } catch (err) {
      toast.error('Failed to delete reminder');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadProfileImage = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload/single`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Store the uploaded image URL
      const uploadedImageUrl = res.data.data.url;
      setProfileImage(uploadedImageUrl);
      
      
      // Immediately save the profile with the new image
      await handleSaveChanges(uploadedImageUrl);
      
      setSelectedFile(null);
      setPreviewUrl("");
      toast.success('Profile image uploaded and saved successfully!');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleEditPhotoClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleCancelImage = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleSaveChanges = async (newProfileImage = null) => {
    setIsSaving(true);
    try {
      // Use the new profile image if provided, otherwise use the current profileImage state or user's existing image
      const imageToSave = newProfileImage || profileImage || user.profileImage || "";
      
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/updateprofile`,
        { phone, address, profileImage: imageToSave },
        { withCredentials: true }
      );
      
      // Update the Redux state with the new user data
      if (res.data && res.data.user) {
        dispatch(updateUserProfile(res.data.user));
      }
      
      // Reset the profile image state after successful save
      setProfileImage("");
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error('Profile update error:', err);
      const msg = err.response?.data?.message || "Failed to update profile.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setIsAddMode(true);
    setEditReminder({});
    setEditFields({ remindermsg: '', date: '', time: '', event: '' });
  };

  const openContributionModal = (contribution) => {
    setSelectedContribution(contribution);
    setShowModal(true);
  };
  const closeContributionModal = () => {
    setShowModal(false);
    setSelectedContribution(null);
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[calc(100vh-80px)] bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <Navbar />
      <div className="min-h-[calc(100vh-80px)] bg-gray-50">
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Profile Card */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center sticky top-24 shadow-sm">
                <div className="relative mb-4">
                  <span className="block w-32 h-32 rounded-full bg-gradient-to-tr from-purple-100 to-blue-100 p-1">
                    <img
                      src={previewUrl || user?.profileImage || '/placeholder.svg'}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border-2 border-white"
                      onError={(e) => {
                        e.target.src = '/placeholder.svg';
                      }}
                    />
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleProfileImageChange}
                  />
                  <button
                    className="absolute bottom-1 right-1 bg-white p-2 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
                    title="Change photo"
                    onClick={handleEditPhotoClick}
                    disabled={uploading}
                  >
                    <FiEdit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  {selectedFile && (
                    <div className="absolute left-1/2 -bottom-16 transform -translate-x-1/2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col items-center z-10">
                      <div className="mb-2 text-gray-700 font-medium">Preview</div>
                      <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border mb-2" />
                      <div className="flex gap-2">
                        <button
                          className="px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                          onClick={handleUploadProfileImage}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                        <button
                          className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
                          onClick={handleCancelImage}
                          disabled={uploading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <h2 className="mt-3 text-xl font-semibold text-gray-900 text-center">{user.firstName} {user.lastName}</h2>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <FiMail className="w-4 h-4 mr-2" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.role && (
                  <span className="mt-3 inline-block px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 capitalize">
                    {user.role}
                  </span>
                )}
                <div className="w-full mt-6 pt-4 border-t border-gray-100 space-y-2">
                  <button
                    onClick={() => router.push("/orders")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <FiShoppingBag className="w-4 h-4" />
                    <span>View Orders</span>
                  </button>
                  <button
                    onClick={logoutHandler}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium hover:cursor-pointer"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Right Column - Two Section Layout */}
            <section className="lg:col-span-3">
              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto space-y-6 pr-2">
                {/* Top Section - Personal Info & Settings */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  {/* Top Tab Navigation */}
                  <div className="border-b border-gray-200 bg-white">
                    <nav className="flex px-4 md:px-6" aria-label="Top Tabs">
                      <div className="flex space-x-6 md:space-x-8">
                        {[
                          { id: 'personal', name: 'Personal Info', fullName: 'Personal Information', icon: FaUser },
                          { id: 'settings', name: 'Settings', fullName: 'Settings', icon: RiLockPasswordFill },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`${
                                activeTab === tab.id
                                  ? 'border-purple-500 text-purple-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="hidden sm:inline">{tab.fullName}</span>
                              <span className="sm:hidden">{tab.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </nav>
                  </div>

                  {/* Top Tab Content */}
                  <div className="p-6">
                    {/* Personal Information Tab */}
                    {activeTab === 'personal' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FaUser className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                            <p className="text-sm text-gray-500">Update your personal details and contact information</p>
                          </div>
                        </div>
                        
                        <form className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                              <input
                                type="text"
                                value={user.firstName || ''}
                                disabled
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                              <input
                                type="text"
                                value={user.lastName || ''}
                                disabled
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                              <input
                                type="email"
                                value={user.email || ''}
                                disabled
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiPhone className="w-4 h-4 text-gray-400" />
                                </span>
                                <input
                                  type="text"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="Add phone number"
                                  className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900"
                                />
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiMapPin className="w-4 h-4 text-gray-400" />
                                </span>
                                <input
                                  type="text"
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  placeholder="Add your address"
                                  className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end pt-4">
                            <button
                              type="button"
                              onClick={() => handleSaveChanges()}
                              disabled={isSaving}
                              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
                            >
                              {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <RiLockPasswordFill className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">Account Settings</h3>
                            <p className="text-sm text-gray-500">Manage your account security and preferences</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Change Password</h4>
                          <PasswordChangeForm />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section - Other Tabs */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  {/* Bottom Tab Navigation */}
                  <div className="border-b border-gray-200 bg-white">
                    <nav className="flex overflow-x-auto scrollbar-hide px-4 md:px-6" aria-label="Bottom Tabs">
                      <div className="flex space-x-6 md:space-x-8 min-w-max">
                        {[
                          { id: 'orders', name: 'Orders', fullName: 'Order Summary', icon: FiShoppingBag },
                          { id: 'reminders', name: 'Reminders', fullName: 'Reminder History', icon: FiClock },
                          { id: 'contributions', name: 'Gifts', fullName: 'Gift Contribution', icon: FiGift },
                          { id: 'surprise', name: 'Surprises', fullName: 'Surprise Orders', icon: FiGift },
                        ].map((tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveBottomTab(tab.id)}
                              className={`${
                                activeBottomTab === tab.id
                                  ? 'border-purple-500 text-purple-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="hidden sm:inline">{tab.fullName}</span>
                              <span className="sm:hidden">{tab.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </nav>
                  </div>

                  {/* Bottom Tab Content */}
                  <div className="p-6">
                  {/* Order Summary Tab */}
                  {activeBottomTab === 'orders' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <FiShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Order Summary</h3>
                          <p className="text-sm text-gray-500">Overview of your recent orders and purchase history</p>
                        </div>
                      </div>

                      {ordersLoading ? (
                        <div className="flex items-center gap-3 text-gray-500 text-sm">
                          <span className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"/>
                          Loading order summary...
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Stats Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                              <div className="text-sm text-gray-500">Total Orders</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="text-lg font-semibold text-gray-900">
                                {orders.length > 0 ? new Date(orders[0].orderedAt).toLocaleDateString() : "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">Last Order</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="text-lg font-semibold text-gray-900">
                                ${orders.reduce((total, order) => total + (order.total || 0), 0).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">Total Spent</div>
                            </div>
                          </div>

                          {/* Recent Orders */}
                          {orders.length > 0 && (
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h4>
                              <div className="space-y-3">
                                {orders.slice(0, 3).map((order) => (
                                  <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                      {order.items && order.items[0] && order.items[0].product && (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                                          <img
                                            src={
                                              order.items[0].product.images && order.items[0].product.images.length > 0
                                                ? (order.items[0].product.images[0].url || order.items[0].product.images[0])
                                                : '/placeholder.svg'
                                            }
                                            alt={order.items[0].product.name || 'Product'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.src = '/placeholder.svg';
                                            }}
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <div className="font-medium text-gray-900">Order #{order._id.slice(-6)}</div>
                                        <div className="text-sm text-gray-500">{new Date(order.orderedAt).toLocaleDateString()}</div>
                                        {order.items && order.items.length > 1 && (
                                          <div className="text-xs text-gray-400">+{order.items.length - 1} more items</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium text-gray-900">${order.total?.toFixed(2) || '0.00'}</div>
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                        order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'Packing' ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {order.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-center">
                            <button
                              onClick={() => router.push("/user/history")}
                              className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              View All Orders
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reminder History Tab */}
                  {activeBottomTab === 'reminders' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">Reminder History</h3>
                            <p className="text-sm text-gray-500">Manage your event reminders and notifications</p>
                          </div>
                        </div>
                        <button
                          onClick={openAddModal}
                          className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Add Reminder
                        </button>
                      </div>

                      {reminderLoading ? (
                        <div className="flex items-center gap-3 text-gray-500 text-sm">
                          <span className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"/>
                          Loading reminders...
                        </div>
                      ) : reminders.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiClock className="w-8 h-8 text-purple-500" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No Reminders Yet</h4>
                          <p className="text-gray-500 mb-4">You haven't set any reminders. Start by adding a new one!</p>
                          <button
                            onClick={openAddModal}
                            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Set Your First Reminder
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reminders.map(reminder => (
                            <div key={reminder._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{reminder.event}</div>
                                <div className="text-sm text-gray-600 mt-1">{reminder.remindermsg}</div>
                                <div className="text-xs text-gray-500 mt-2">
                                  {reminder.date ? reminder.date.slice(0,10) : ''} {reminder.time}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => openEditModal(reminder)}
                                  className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteReminder(reminder._id)}
                                  disabled={deleteLoadingId === reminder._id}
                                  className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                  {deleteLoadingId === reminder._id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gift Contributions Tab */}
                  {activeBottomTab === 'contributions' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <FiGift className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Gift Contributions</h3>
                          <p className="text-sm text-gray-500">Your collaborative gift purchases and contributions</p>
                        </div>
                      </div>

                      {contributionsLoading ? (
                        <div className="flex items-center gap-3 text-gray-500 text-sm">
                          <span className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"/>
                          Loading contributions...
                        </div>
                      ) : contributions.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiGift className="w-8 h-8 text-purple-500" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No Contributions Yet</h4>
                          <p className="text-gray-500 mb-4">You haven't participated in any collaborative gifts yet.</p>
                          <a
                            href="/dashboard/collaborative-purchases"
                            className="inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Explore Collaborative Gifts
                          </a>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {contributions.map((c) => {
                            const product = c.product || {};
                            const productImage = product.images && product.images.length > 0 ? (product.images[0].url || product.images[0]) : null;
                            return (
                              <div key={c._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start gap-4">
                                  {productImage ? (
                                    <img src={productImage} alt={product.name || c.productName} className="w-16 h-16 object-cover rounded-lg border" />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-lg border text-gray-400">
                                      <FiGift className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 mb-1">{product.name || c.productName}</h4>
                                    <p className="text-sm text-gray-600 mb-2">Rs. {c.productPrice || product.salePrice || product.retailPrice}</p>
                                    <p className="text-xs text-gray-500">Deadline: {new Date(c.deadline).toLocaleDateString()}</p>
                                    <button
                                      onClick={() => openContributionModal(c)}
                                      className="mt-3 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Surprise Orders Tab */}
                  {activeBottomTab === 'surprise' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                          <FiGift className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Surprise Orders</h3>
                          <p className="text-sm text-gray-500">Track your surprise gift deliveries and recipients</p>
                        </div>
                      </div>

                      {surpriseLoading ? (
                        <div className="flex items-center gap-3 text-gray-500 text-sm">
                          <span className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"/>
                          Loading surprise orders...
                        </div>
                      ) : surpriseGifts.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiGift className="w-8 h-8 text-pink-500" />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No Surprise Orders Yet</h4>
                          <p className="text-gray-500 mb-4">Start by choosing a product to surprise someone special</p>
                          <button 
                            onClick={() => window.location.assign('/allProducts')} 
                            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Explore Products
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {surpriseGifts.map((g) => (
                            <div key={g._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <div className="font-medium text-gray-900">{g.recipientName}</div>
                                  <div className="text-sm text-gray-500">{new Date(g.createdAt).toLocaleDateString()}</div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  g.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                  g.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                  g.status === 'OutForDelivery' ? 'bg-blue-100 text-blue-800' :
                                  g.status === 'Paid' ? 'bg-blue-100 text-blue-800' :
                                  g.status === 'AwaitingPayment' ? 'bg-orange-100 text-orange-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {g.status}
                                </span>
                              </div>

                              {/* Items */}
                              <div className="space-y-3">
                                {g.items?.map((it, idx) => {
                                  const image = typeof it.image === 'string' ? it.image : (it.product?.images && it.product.images[0] && (it.product.images[0].url || it.product.images[0])) || '/placeholder.svg';
                                  const name = it.name || it.product?.name || 'Item';
                                  const price = typeof it.price === 'number' ? it.price : (it.product?.salePrice || it.product?.retailPrice || 0);
                                  return (
                                    <div key={idx} className="flex items-center gap-3">
                                      <img src={image} alt={name} className="w-12 h-12 object-cover rounded-lg border" />
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{name}</div>
                                        <div className="text-sm text-gray-500">Qty: {it.quantity || 1} • US ${Number(price).toFixed(2)}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200">
                                <div className="text-sm text-gray-600">Total Amount</div>
                                <div className="font-semibold text-gray-900">US ${Number(g.total || 0).toFixed(2)}</div>
                              </div>
                              
                              {/* Payment Status & Action */}
                              {g.status === 'AwaitingPayment' && (
                                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-orange-800">Payment Required</p>
                                      <p className="text-xs text-orange-600">Complete payment to proceed with delivery</p>
                                    </div>
                                    <button
                                      onClick={() => handlePayment(g._id, g.total)}
                                      className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                                    >
                                      Pay Now
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {g.paymentStatus === 'paid' && g.paymentId && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-green-800">Payment Completed</p>
                                      <p className="text-xs text-green-600">Payment ID: {g.paymentId}</p>
                                    </div>
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Paid</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </section>
          </div>
        </main>
        <Toaster position="top-center" richColors closeButton />
      </div>

      {/* Edit/Add Reminder Modal */}
      {(editReminder !== null || isAddMode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeEditModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-black"
              aria-label="Close"
            >
              <IoCloseCircleOutline size={24} />
            </button>
            <h3 className="text-lg font-semibold mb-4">{isAddMode ? 'Add Reminder' : 'Edit Reminder'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Event</label>
                <input
                  name="event"
                  value={editFields.event}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Birthday"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Message</label>
                <input
                  name="remindermsg"
                  value={editFields.remindermsg}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Reminder message"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={editFields.date}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Time</label>
                  <input
                    type="time"
                    name="time"
                    value={editFields.time}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={closeEditModal} className="px-4 py-2 rounded border">Cancel</button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
                >
                  {editSaving ? 'Saving...' : (isAddMode ? 'Create' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Details Modal */}
      {showModal && selectedContribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 relative">
            <button
              onClick={closeContributionModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-purple-700 mb-4 text-center">🎁 Gift Contribution Details</h2>
            <div className="flex flex-col items-center mb-4">
              {selectedContribution.product && selectedContribution.product.images && selectedContribution.product.images.length > 0 ? (
                <img src={selectedContribution.product.images[0].url || selectedContribution.product.images[0]} alt={selectedContribution.product.name || selectedContribution.productName} className="w-28 h-28 object-cover rounded-lg border mb-2" />
              ) : (
                <div className="w-28 h-28 bg-gray-100 flex items-center justify-center rounded-lg border text-gray-400 mb-2">No Image</div>
              )}
              <h3 className="text-lg font-semibold text-purple-800 mb-1 text-center">{selectedContribution.product?.name || selectedContribution.productName}</h3>
              <p className="text-gray-700 text-sm mb-1">Price: <span className="font-medium">Rs. {selectedContribution.productPrice || selectedContribution.product?.salePrice || selectedContribution.product?.retailPrice}</span></p>
              <p className="text-gray-500 text-xs mb-2">Deadline: {new Date(selectedContribution.deadline).toLocaleDateString()}</p>
            </div>
            <div className="mb-3">
              <h4 className="font-semibold text-gray-800 mb-1">Participants</h4>
              <ul className="list-disc pl-6 text-sm">
                {selectedContribution.participants.map((p, idx) => (
                  <li key={idx} className="mb-1">
                    {p.email} {p.hasPaid ? <span className="text-green-600">(Paid)</span> : p.declined ? <span className="text-red-500">(Declined)</span> : <span className="text-yellow-600">(Pending)</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mb-3">
              <h4 className="font-semibold text-gray-800 mb-1">Status</h4>
              <p className="capitalize text-sm">{selectedContribution.status}</p>
            </div>
            <div className="flex mt-4 justify-center">
              {selectedContribution.product?._id && (
                <a
                  href={`/productDetail/${selectedContribution.product._id}`}
                  target="_self"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center px-4 py-2 border border-purple-600 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                >
                  View Product
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Surprise Gift Payment Modal */}
      <SurpriseGiftPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedSurpriseGift(null);
        }}
        surpriseGift={selectedSurpriseGift}
        onPaymentSuccess={processPayment}
        isProcessing={paymentProcessing}
      />

    <Footer />
    </>
  );
}

// Password Change Form Component
function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password strength meter
  function getStrength(password) {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }
  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/changepassword`,
        { oldPassword: currentPassword, password: newPassword },
        { withCredentials: true }
      );
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition text-gray-900 bg-gray-50 pr-12"
            placeholder="Enter current password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
            tabIndex={-1}
            onClick={() => setShowCurrent(v => !v)}
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition text-gray-900 bg-gray-50 pr-12"
            placeholder="Enter new password"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
            tabIndex={-1}
            onClick={() => setShowNew(v => !v)}
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {/* Password strength meter */}
        <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              strength === 0 ? "w-0" :
              strength === 1 ? "w-1/4 bg-red-400" :
              strength === 2 ? "w-2/4 bg-yellow-400" :
              strength === 3 ? "w-3/4 bg-blue-400" :
              "w-full bg-green-500"
            }`}
          ></div>
        </div>
        {newPassword && (
          <div className="mt-1 text-xs text-gray-500">
            {strength === 0 ? "Enter a password" :
             strength === 1 ? "Weak password" :
             strength === 2 ? "Fair password" :
             strength === 3 ? "Good password" :
             "Strong password"}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition text-gray-900 bg-gray-50 pr-12"
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500"
            tabIndex={-1}
            onClick={() => setShowConfirm(v => !v)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>
        {confirmPassword && newPassword !== confirmPassword && (
          <div className="mt-1 text-xs text-red-500">Passwords do not match</div>
        )}
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          onClick={() => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setError("");
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </form>
  );
}
