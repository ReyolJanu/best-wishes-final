'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Clock, Users, DollarSign, X, CheckCircle, AlertCircle, Filter, Search, ChevronDown } from 'lucide-react';
import Navbar from '../../components/navBar/page';
import Footer from '../../components/footer/page';



export default function CollaborativePurchasesDashboard() {
  const { user } = useSelector(state => state.userState);
  const router = useRouter();
  const [collaborativePurchases, setCollaborativePurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    searchTerm: '',
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchCollaborativePurchases = async () => {
      try {
        setLoading(true);
        console.log('Fetching collaborative purchases for user:', user?.email);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/collaborative-purchases`, {
          withCredentials: true
        });
        setCollaborativePurchases(res.data.collaborativePurchases || []);
      } catch (err) {
        console.error('Error fetching collaborative purchases:', err);
        if (err.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          router.push('/login');
        } else {
          toast.error('Failed to load collaborative purchases');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.email) {
      fetchCollaborativePurchases();
    }
  }, [user, router]);

  const handleCancel = async (purchaseId) => {
    if (!window.confirm('Are you sure you want to cancel this collaborative purchase? This will refund any paid participants.')) {
      return;
    }

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/collaborative-purchases/${purchaseId}/cancel`, {}, {
        withCredentials: true
      });

      toast.success('Collaborative purchase cancelled successfully');

      // Refresh the list
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/collaborative-purchases`, {
        withCredentials: true
      });
      setCollaborativePurchases(res.data.collaborativePurchases || []);
    } catch (err) {
      console.error('Error cancelling collaborative purchase:', err);
      if (err.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
      } else {
        toast.error('Failed to cancel collaborative purchase');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      case 'refunded': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      case 'expired': return <AlertCircle className="w-4 h-4" />;
      case 'refunded': return <DollarSign className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTimeRemaining = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getParticipantStatus = (participants, userEmail) => {
    const userParticipant = participants.find(p => p.email === userEmail);
    if (userParticipant) {
      return userParticipant.paymentStatus;
    }
    return 'creator';
  };

  // Filter and sort purchases
  const filteredPurchases = useMemo(() => {
    let filtered = [...collaborativePurchases];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(purchase => purchase.status === filters.status);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(purchase => new Date(purchase.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(purchase => new Date(purchase.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(purchase => new Date(purchase.createdAt) >= filterDate);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          filtered = filtered.filter(purchase => new Date(purchase.createdAt) >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(purchase => new Date(purchase.createdAt) >= filterDate);
          break;
      }
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.productName?.toLowerCase().includes(searchLower) ||
        purchase.createdBy?.firstName?.toLowerCase().includes(searchLower) ||
        purchase.createdBy?.email?.toLowerCase().includes(searchLower) ||
        purchase.participants?.some(p => p.email?.toLowerCase().includes(searchLower))
      );
    }

    // Sort purchases
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount_high':
          return b.totalAmount - a.totalAmount;
        case 'amount_low':
          return a.totalAmount - b.totalAmount;
        case 'deadline':
          return new Date(a.deadline) - new Date(b.deadline);
        default:
          return 0;
      }
    });

    return filtered;
  }, [collaborativePurchases, filters]);

  // Get filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      all: collaborativePurchases.length,
      pending: 0,
      completed: 0,
      cancelled: 0,
      expired: 0
    };

    collaborativePurchases.forEach(purchase => {
      if (counts[purchase.status] !== undefined) {
        counts[purchase.status]++;
      }
    });

    return counts;
  }, [collaborativePurchases]);

  // Check if user is authenticated after all hooks are declared
  if (!user) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collaborative purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Collaborative Purchases</h1>
                <p className="mt-2 text-gray-600">Track and manage your collaborative purchases</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                <div className="text-sm text-gray-500">
                  {filteredPurchases.length} of {collaborativePurchases.length} purchases
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search purchases..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Status ({filterCounts.all})</option>
                      <option value="pending">Pending ({filterCounts.pending})</option>
                      <option value="completed">Completed ({filterCounts.completed})</option>
                      <option value="cancelled">Cancelled ({filterCounts.cancelled})</option>
                      <option value="expired">Expired ({filterCounts.expired})</option>
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last Month</option>
                      <option value="3months">Last 3 Months</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="amount_high">Amount (High to Low)</option>
                      <option value="amount_low">Amount (Low to High)</option>
                      <option value="deadline">Deadline (Soonest)</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setFilters({
                      status: 'all',
                      dateRange: 'all',
                      searchTerm: '',
                      sortBy: 'newest'
                    })}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(filters.status !== 'all' || filters.dateRange !== 'all' || filters.searchTerm || filters.sortBy !== 'newest') && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.status !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Status: {filters.status}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.dateRange !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {filters.dateRange === 'today' ? 'Today' :
                        filters.dateRange === 'week' ? 'Last 7 Days' :
                          filters.dateRange === 'month' ? 'Last Month' :
                            filters.dateRange === '3months' ? 'Last 3 Months' :
                              filters.dateRange === 'year' ? 'Last Year' : filters.dateRange}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.searchTerm && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Search: "{filters.searchTerm}"
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.sortBy !== 'newest' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Sort: {filters.sortBy === 'oldest' ? 'Oldest First' :
                        filters.sortBy === 'amount_high' ? 'Amount (High to Low)' :
                          filters.sortBy === 'amount_low' ? 'Amount (Low to High)' :
                            filters.sortBy === 'deadline' ? 'Deadline (Soonest)' : filters.sortBy}
                      <button
                        onClick={() => setFilters(prev => ({ ...prev, sortBy: 'newest' }))}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quick Filter Tabs */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: filterCounts.all },
                { key: 'pending', label: 'Pending', count: filterCounts.pending },
                { key: 'completed', label: 'Completed', count: filterCounts.completed },
                { key: 'cancelled', label: 'Cancelled', count: filterCounts.cancelled },
                { key: 'expired', label: 'Expired', count: filterCounts.expired }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilters(prev => ({ ...prev, status: key }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filters.status === key
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {collaborativePurchases.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No collaborative purchases</h3>
              <p className="mt-1 text-sm text-gray-500">You haven't created or participated in any collaborative purchases yet.</p>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchases match your filters</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or clear the filters.</p>
              <button
                onClick={() => setFilters({
                  status: 'all',
                  dateRange: 'all',
                  searchTerm: '',
                  sortBy: 'newest'
                })}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredPurchases.map((purchase) => {
                const userStatus = getParticipantStatus(purchase.participants, user?.email);
                const isCreator = purchase.createdBy._id === user?._id;
                const timeRemaining = formatTimeRemaining(purchase.deadline);
                const isExpired = new Date(purchase.deadline) < new Date();

                return (
                  <div key={purchase._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{purchase.productName}</h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                            {getStatusIcon(purchase.status)}
                            {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>Total: ${purchase.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>Your Share: ${purchase.shareAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{purchase.participants.length + 1} participants</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Created: {new Date(purchase.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className={isExpired ? 'text-red-600' : 'text-gray-600'}>
                              {isExpired ? 'Expired' : `Expires in ${timeRemaining}`}
                            </span>
                          </div>
                        </div>

                        {/* Participants Status */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Participants Status</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">{purchase.createdBy.firstName || purchase.createdBy.email}</span>
                              <span className="text-green-600 font-semibold">Creator</span>
                            </div>
                            {purchase.participants.map((participant, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span>{participant.email}</span>
                                <span className={`font-semibold ${participant.paymentStatus === 'paid' ? 'text-green-600' :
                                    participant.paymentStatus === 'declined' ? 'text-red-600' :
                                      'text-yellow-600'
                                  }`}>
                                  {participant.paymentStatus === 'paid' ? 'Paid' :
                                    participant.paymentStatus === 'declined' ? 'Declined' :
                                      'Pending'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Your Status */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Your Status</h4>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${userStatus === 'creator' ? 'text-blue-600 bg-blue-100' :
                              userStatus === 'paid' ? 'text-green-600 bg-green-100' :
                                userStatus === 'declined' ? 'text-red-600 bg-red-100' :
                                  'text-yellow-600 bg-yellow-100'
                            }`}>
                            {userStatus === 'creator' ? 'Creator' :
                              userStatus === 'paid' ? 'Paid' :
                                userStatus === 'declined' ? 'Declined' :
                                  'Pending Payment'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 ml-4">
                        {isCreator && purchase.status === 'pending' && !isExpired && (
                          <button
                            onClick={() => handleCancel(purchase._id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Cancel Purchase
                          </button>
                        )}

                        {purchase.status === 'completed' && purchase.orderId && (
                          <button
                            onClick={() => window.open(`/user/history`, '_self')}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            View Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
