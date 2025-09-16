"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Search, Package, Truck, CheckCircle, AlertCircle, Clock, Eye, MapPin, Phone, Mail, Calendar, BarChart3, Route, RefreshCw, Sun, Moon } from "lucide-react"
import NavigationBar from "./components/navigation-bar"
import ProductImage from "./components/product-image"
import DeliveryRoute from "./components/delivery-route"
import DeliveryAnalytics from "./components/delivery-analytics"
import { authenticatedFetch, checkAuthentication } from "./utils/auth"
import { toast, Toaster } from "sonner"

export default function DeliveryDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState("delivery")
  const [orders, setOrders] = useState([])
  const [surpriseGifts, setSurpriseGifts] = useState([])
  const [complaints, setComplaints] = useState([])
  const [deliveryHistory, setDeliveryHistory] = useState([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [orderType, setOrderType] = useState("orders") // "orders" or "surpriseGifts"
  const [userProfile, setUserProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inTransitOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalSurpriseGifts: 0,
    pendingSurpriseGifts: 0
  })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState(null) // Track which specific order is being updated
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Simulated data - replace with actual API calls
  const mockOrders = [
    {
      id: "1",
      productName: "Matte Liquid Lipstick Set",
      productImage: "/images/lipstick.png",
      amount: 24.99,
      address: "No 28 2nd Street Main road State City",
      phone: "+44 6475 8890",
      status: "Pending",
    },
    {
      id: "2",
      productName: "Anti-Aging Serum with Vitamin C",
      productImage: "/images/serum.png",
      amount: 45.99,
      address: "No 15 Oak Avenue Downtown",
      phone: "+44 7123 4567",
      status: "In Transit",
    },
    {
      id: "3",
      productName: "Eyeshadow Palette - Neutral Tones",
      productImage: "/images/eyeshadow.png",
      amount: 32.5,
      address: "No 42 Pine Street Uptown",
      phone: "+44 8901 2345",
      status: "Completed",
    },
    {
      id: "4",
      productName: "Hydrating Face Moisturizer",
      productImage: "/images/moisturizer.png",
      amount: 28.75,
      address: "No 156 Elm Street Central District",
      phone: "+44 9012 3456",
      status: "Pending",
    },
    {
      id: "5",
      productName: "Foundation Makeup Base",
      productImage: "/images/foundation.png",
      amount: 38.99,
      address: "No 89 Maple Avenue Westside",
      phone: "+44 3456 7890",
      status: "In Transit",
    },
  ]

  const mockComplaints = [
    {
      id: "1",
      productName: "Matte Liquid Lipstick Set",
      issue: "Wrong shade delivered - ordered Ruby Red, received Pink Rose",
      submittedDate: "2024-01-15",
      status: "Open",
    },
    {
      id: "2",
      productName: "Anti-Aging Serum with Vitamin C",
      issue: "Product leaked during delivery - bottle was damaged",
      submittedDate: "2024-01-14",
      status: "In Progress",
    },
    {
      id: "3",
      productName: "Eyeshadow Palette - Neutral Tones",
      issue: "Missing mirror and applicator brush from the palette",
      submittedDate: "2024-01-13",
      status: "Resolved",
    },
  ]

  const mockDeliveryHistory = [
    {
      id: "1",
      productName: "Cleansing Face Mask",
      deliveryDate: "2024-01-10",
      status: "Completed",
    },
    {
      id: "2",
      productName: "Waterproof Mascara",
      deliveryDate: "2024-01-09",
      status: "Completed",
    },
    {
      id: "3",
      productName: "Night Repair Cream",
      deliveryDate: "2024-01-08",
      status: "Failed",
    },
    {
      id: "4",
      productName: "Contouring Kit",
      deliveryDate: "2024-01-07",
      status: "Completed",
    },
    {
      id: "5",
      productName: "Sunscreen SPF 50",
      deliveryDate: "2024-01-06",
      status: "Completed",
    },
  ]

  // API functions
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await authenticatedFetch('/delivery/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUserProfile(data.user)
          return data.user // Return the user data
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
    return null
  }

  // Fetch notifications for the logged-in staff
  const fetchNotifications = async () => {
    try {
      // Mock notifications for now - implement real API when ready
      const mockNotifications = [
        {
          id: "1",
          message: "New order assigned to you",
          orderId: "ORD001",
          time: "2 minutes ago",
          type: "order",
          read: false,
        },
        {
          id: "2", 
          message: "Surprise gift delivery ready",
          orderId: "SG001",
          time: "15 minutes ago",
          type: "surprise-gift",
          read: false,
        }
      ]
      setNotifications(mockNotifications)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const fetchOrders = async (page = 1, status = filterStatus, search = searchQuery) => {
    setLoading(true)
    try {
      // Fetch regular orders with status "Shipping"
      const ordersParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: 'shipping',
        ...(search && { query: search })
      })

      const ordersResponse = await authenticatedFetch(`/delivery/orders?${ordersParams}`)
      
      // Fetch surprise gifts with status "OutForDelivery"
      const surpriseGiftsParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: 'OutForDelivery',
        ...(search && { query: search })
      })

      const surpriseGiftsResponse = await authenticatedFetch(`/delivery/surprise-gifts?${surpriseGiftsParams}`)

      let ordersData = { orders: [], pagination: {} }
      let surpriseGiftsData = { surpriseGifts: [], pagination: {} }

      if (ordersResponse.ok) {
        ordersData = await ordersResponse.json()
      }

      if (surpriseGiftsResponse.ok) {
        surpriseGiftsData = await surpriseGiftsResponse.json()
      }

      // Set data for both collections
      const orders = Array.isArray(ordersData.orders) ? ordersData.orders : []
      const surpriseGifts = Array.isArray(surpriseGiftsData.surpriseGifts) ? surpriseGiftsData.surpriseGifts : []
      
      setOrders(orders)
      setSurpriseGifts(surpriseGifts)
      setCurrentPage(ordersData.pagination?.currentPage || 1)
      setTotalPages(Math.max(ordersData.pagination?.totalPages || 1, surpriseGiftsData.pagination?.totalPages || 1))

    } catch (error) {
      console.error("Error fetching data:", error)
      // Set empty arrays on error
      setOrders([])
      setSurpriseGifts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch stats for both orders and surprise gifts
      const [ordersStatsResponse, surpriseGiftsStatsResponse] = await Promise.all([
        authenticatedFetch('/delivery/stats'),
        authenticatedFetch('/delivery/surprise-gifts/stats')
      ])

      let combinedStats = {
        totalOrders: 0,
        pendingOrders: 0,
        inTransitOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalSurpriseGifts: 0,
        pendingSurpriseGifts: 0
      }

      if (ordersStatsResponse.ok) {
        const ordersData = await ordersStatsResponse.json()
        if (ordersData.success && ordersData.stats) {
          combinedStats = { ...combinedStats, ...ordersData.stats }
        }
      }

      if (surpriseGiftsStatsResponse.ok) {
        const surpriseGiftsData = await surpriseGiftsStatsResponse.json()
        if (surpriseGiftsData.success && surpriseGiftsData.stats) {
          combinedStats.totalSurpriseGifts = surpriseGiftsData.stats.total || 0
          combinedStats.pendingSurpriseGifts = surpriseGiftsData.stats.pending || 0
        }
      }

      setStats(combinedStats)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      // For now, use mock data - implement when complaint system is ready
      await new Promise((resolve) => setTimeout(resolve, 500))
      setComplaints(mockComplaints)
    } catch (error) {
      console.error("Error fetching complaints:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryHistory = async (providedStaffId = null) => {
    setLoading(true)
    try {
      // Use provided staffId or get from userProfile
      const staffId = providedStaffId || userProfile?._id
      
      if (!staffId) {
        console.warn("User profile not loaded, cannot fetch delivery history")
        setDeliveryHistory([])
        return
      }

      const [ordersResponse, surpriseGiftsResponse] = await Promise.all([
        authenticatedFetch(`/delivery/orders?status=delivered&deliveryStaff=${staffId}`),
        authenticatedFetch(`/delivery/surprise-gifts?status=delivered&deliveryStaff=${staffId}`)
      ])

      let deliveredOrders = []
      let deliveredSurpriseGifts = []

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        if (ordersData.success) {
          deliveredOrders = ordersData.orders || []
        }
      }

      if (surpriseGiftsResponse.ok) {
        const surpriseGiftsData = await surpriseGiftsResponse.json()
        if (surpriseGiftsData.success) {
          deliveredSurpriseGifts = surpriseGiftsData.surpriseGifts || []
        }
      }

      // Combine and format history data
      const combinedHistory = [
        ...deliveredOrders.map(order => ({
          ...order,
          type: 'order',
          productName: order.items?.[0]?.product?.name || order.items?.[0]?.name || 'Unknown Product',
          deliveryDate: order.updatedAt || order.deliveredAt,
          status: 'Completed'
        })),
        ...deliveredSurpriseGifts.map(gift => ({
          ...gift,
          type: 'surprise-gift',
          productName: gift.items?.[0]?.product?.name || gift.items?.[0]?.name || 'Surprise Gift',
          deliveryDate: gift.updatedAt || gift.deliveredAt,
          status: 'Completed'
        }))
      ]

      setDeliveryHistory(combinedHistory.sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate)))
    } catch (error) {
      console.error("Error fetching delivery history:", error)
      // Fallback to empty array instead of mock data for production
      setDeliveryHistory([])
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus, notes = '', endpoint = null, itemType = 'orders', currentStatus = 'Shipping') => {
    setUpdatingOrderId(orderId)
    setUpdatingOrderId(orderId) // Track which specific order is being updated
    try {
      // Use provided endpoint or default to orders endpoint
      const apiEndpoint = endpoint || `/delivery/orders/${orderId}/status`
      
      // Include delivery staff ID in the request
      const requestBody = {
        status: newStatus,
        notes,
        currentStatus,
        deliveryStaffId: userProfile?._id // Add delivery staff ID to link the delivery
      }
      
      const response = await authenticatedFetch(apiEndpoint, {
        method: 'PUT',
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Failed to update ${itemType} status`)
      }

      const data = await response.json()
      if (data.success) {
        // Remove the updated item from the appropriate list
        if (itemType === 'orders') {
          setOrders(prev => prev.filter(order => order._id !== orderId && order.id !== orderId))
        } else if (itemType === 'surpriseGifts') {
          setSurpriseGifts(prev => prev.filter(gift => gift._id !== orderId && gift.id !== orderId))
        }
        
        // Refresh data and stats
        await fetchOrders(currentPage, filterStatus, searchQuery)
        await fetchStats()
        
        // Show success notification
        toast.success(`✅ ${itemType === 'orders' ? 'Order' : 'Surprise Gift'} marked as Delivered successfully!`, {
          description: `${itemType === 'orders' ? 'Order' : 'Surprise Gift'} #${orderId} has been delivered and recorded under your name.`,
          duration: 5000,
        })
        
        // Refresh delivery history to include the newly delivered item
        await fetchDeliveryHistory()
      }
    } catch (error) {
      console.error(`Error updating ${itemType} status:`, error)
      toast.error(`Failed to update ${itemType} status`, {
        description: 'Please try again or contact support if the issue persists.',
        duration: 5000,
      })
    } finally {
      setUpdatingOrderId(null)
      setUpdatingOrderId(null) // Clear the updating state
    }
  }

  const handleSubmit = async (orderId, itemType = orderType) => {
    try {
      let endpoint
      let currentStatus
      let newStatus = 'Delivered'

      if (itemType === 'orders') {
        endpoint = `/delivery/orders/${orderId}/status`
        currentStatus = 'Shipping'
      } else if (itemType === 'surpriseGifts') {
        endpoint = `/delivery/surprise-gifts/${orderId}/status`
        currentStatus = 'OutForDelivery'
      }

      await updateOrderStatus(orderId, newStatus, '', endpoint, itemType, currentStatus)
    } catch (error) {
      console.error("Error in handleSubmit:", error)
    }
  }

  const resolveComplaint = async (complaintId) => {
    try {
      console.log("Resolving complaint:", complaintId)
      setComplaints((prev) =>
        prev.map((complaint) => (complaint.id === complaintId ? { ...complaint, status: "Resolved" } : complaint)),
      )
    } catch (error) {
      console.error("Error resolving complaint:", error)
    }
  }

  const handleFilterChange = (value) => {
    setFilterStatus(value)
    setCurrentPage(1)
    fetchOrders(1, value, searchQuery)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = () => {
    setCurrentPage(1)
    // For real API data, we don't need to filter locally since the API handles search
    // But we can still call fetchOrders to refresh the data
    fetchOrders(1, filterStatus, searchQuery)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    fetchOrders(page, filterStatus, searchQuery)
  }

  // Note: Filtering and searching is handled by the API, so we use orders directly

  // Load initial data
  useEffect(() => {
    // Check if user is authenticated before making API calls
    const checkAuthAndFetch = async () => {
      try {
        const isAuthenticated = await checkAuthentication()
        
        if (isAuthenticated) {
          // First, fetch user profile as other functions depend on it
          const userProfileData = await fetchUserProfile()
          
          // Then fetch the rest of the data in parallel, passing staffId to history fetch
          await Promise.all([
            fetchOrders(),
            fetchStats(),
            fetchComplaints(),
            fetchDeliveryHistory(userProfileData?._id), // Pass staffId directly
            fetchNotifications()
          ])
        } else {
          console.log('User not authenticated, redirecting to login...')
          // Redirect to login if not authenticated
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Authentication check failed:', error)
        // Fallback to mock data for development
        fetchComplaints()
        fetchDeliveryHistory()
      }
    }
    
    checkAuthAndFetch()
  }, [])

  // Fetch delivery history when user profile becomes available
  useEffect(() => {
    if (userProfile?._id && deliveryHistory.length === 0) {
      fetchDeliveryHistory(userProfile._id)
    }
  }, [userProfile])

  // Order Details Modal Component

  // Order Details Modal Component
  const OrderDetailsModal = ({ order, isOpen, onClose }) => {
    const [statusNotes, setStatusNotes] = useState('')
    const [selectedStatus, setSelectedStatus] = useState(order?.status || '')

    if (!order) return null

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-3 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Order Details - #{order._id || order.id}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Order Status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Current Status</h3>
                <Badge className={getStatusBadgeColor(order.status)}>{order.status}</Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => updateOrderStatus(order._id || order.id, selectedStatus, statusNotes)}
                  disabled={updatingOrderId === (order._id || order.id) || selectedStatus === order.status}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Update
                </Button>
              </div>
            </div>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Customer Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm sm:text-base text-gray-900">{order.user?.firstName} {order.user?.lastName}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm sm:text-base text-gray-900 break-all">{order.user?.email}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm sm:text-base text-gray-900">{order.user?.phone}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm sm:text-base text-gray-900">{order.user?.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Order Items</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {order.items?.map((item, index) => {
                    const productImage = item.image || item.product?.images?.[0] || "/images/placeholder.png";
                    
                    return (
                      <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 border rounded-lg">
                        <ProductImage
                          src={productImage}
                          alt={item.product?.name || item.name}
                          productName={item.product?.name || item.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 sm:w-16 sm:h-16"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base truncate">{item.product?.name || item.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Price: ${item.price || item.product?.salePrice}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-semibold">Total Amount:</span>
                    <span className="text-base sm:text-lg font-bold text-purple-600">${order.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Notes */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Status Update Notes
              </label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about the status update..."
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Order Timeline */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Status History</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                            <Badge className={getStatusBadgeColor(history.status)}>{history.status}</Badge>
                            <span className="text-xs sm:text-sm text-gray-500">
                              {new Date(history.updatedAt).toLocaleString()}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in transit":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "open":
        return "bg-red-100 text-red-800 border-red-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
    switch (activeTab) {
      case "delivery":
        return (
          <div className="space-y-6">
            {/* Dashboard Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left">
                    <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-1 sm:mb-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mb-1 sm:mb-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left">
                    <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-1 sm:mb-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">In Transit</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.inTransitOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-1 sm:mb-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Delivered</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.deliveredOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left">
                    <Package className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-1 sm:mb-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Surprise Gifts</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalSurpriseGifts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-2 text-center sm:text-left">
                    <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mb-1 sm:mb-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Cancelled</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.cancelledOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Management */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6">
              {/* Filters and Search */}
              <div className="flex flex-col space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Order Management</h2>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setOrderType("orders")}
                      variant={orderType === "orders" ? "default" : "outline"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Package className="w-4 h-4" />
                      <span>Regular Orders ({orders.length})</span>
                    </Button>
                    <Button 
                      onClick={() => setOrderType("surpriseGifts")}
                      variant={orderType === "surpriseGifts" ? "default" : "outline"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Package className="w-4 h-4" />
                      <span>Surprise Gifts ({surpriseGifts.length})</span>
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                  <Select value={filterStatus} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-full sm:w-48 md:w-52">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#822BE2]" />
                      <Input
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pl-10 w-full sm:w-64 md:w-72 border focus-visible:ring-0 focus-visible:border-[#822BE2] focus:outline-none"
                      />
                    </div>
                    <Button onClick={handleSearchSubmit} variant="outline" className="w-full sm:w-auto">
                      Search
                    </Button>
                    <Button 
                      onClick={() => {
                        fetchOrders(currentPage)
                        toast.success('Data refreshed successfully!', {
                          description: 'Latest orders and surprise gifts have been fetched.',
                          duration: 3000,
                        })
                      }} 
                      variant="outline" 
                      className="w-full sm:w-auto flex items-center space-x-1"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Orders Table - Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : (orderType === "orders" ? orders : surpriseGifts).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No {orderType === "orders" ? "regular orders" : "surprise gifts"} found
                        </td>
                      </tr>
                    ) : (
                      (orderType === "orders" ? orders : surpriseGifts).map((order) => (
                        <tr key={order._id || order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order._id?.slice(-8) || order.id || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.user?.firstName || order.recipient?.name || 'N/A'} {order.user?.lastName || ''}
                              </div>
                              <div className="text-sm text-gray-500">{order.user?.email || order.recipient?.email || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{order.user?.phone || order.recipient?.phone || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {order.items && order.items.length > 0 ? (
                                <>
                                  <ProductImage
                                    src={order.items[0].product?.images?.[0] || order.items[0].image || "/images/placeholder.png"}
                                    alt={order.items[0].product?.name || order.items[0].name}
                                    productName={order.items[0].product?.name || order.items[0].name}
                                    width={40}
                                    height={40}
                                  />
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {order.items[0].product?.name || order.items[0].name || 'Unknown Product'}
                                    </div>
                                    {order.items.length > 1 && (
                                      <div className="text-sm text-gray-500">
                                        +{order.items.length - 1} more items
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500">No items</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${order.total?.toFixed(2) || order.amount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusBadgeColor(order.status)}>{order.status || 'Unknown'}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.orderedAt || order.createdAt ? 
                              new Date(order.orderedAt || order.createdAt).toLocaleDateString() : 
                              'N/A'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              <Button
                                onClick={() => {
                                  setSelectedOrder(order)
                                  setShowOrderDetails(true)
                                }}
                                size="sm"
                                variant="outline"
                                className="flex items-center space-x-1 w-full sm:w-auto"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </Button>
                              {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                <Button
                                  onClick={() => handleSubmit(order._id || order.id, orderType)}
                                  disabled={updatingOrderId === (order._id || order.id)}
                                  size="sm"
                                  className="rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white font-medium w-full sm:w-auto"
                                >
                                  {updatingOrderId === (order._id || order.id) ? 'Updating...' : 'Mark Delivered'}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Orders Cards - Mobile */}
              <div className="md:hidden space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (orderType === "orders" ? orders : surpriseGifts).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No {orderType === "orders" ? "regular orders" : "surprise gifts"} found
                  </div>
                ) : (
                  (orderType === "orders" ? orders : surpriseGifts).map((order) => (
                    <Card key={order._id || order.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Order Header */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                #{order._id?.slice(-8) || order.id || 'N/A'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {order.orderedAt || order.createdAt ? 
                                  new Date(order.orderedAt || order.createdAt).toLocaleDateString() : 
                                  'N/A'
                                }
                              </p>
                            </div>
                            <Badge className={getStatusBadgeColor(order.status)}>{order.status || 'Unknown'}</Badge>
                          </div>

                          {/* Customer Info */}
                          <div className="border-t pt-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Customer</h4>
                            <p className="text-sm text-gray-900">
                              {order.user?.firstName || order.recipient?.name || 'N/A'} {order.user?.lastName || ''}
                            </p>
                            <p className="text-sm text-gray-500">{order.user?.email || order.recipient?.email || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{order.user?.phone || order.recipient?.phone || 'N/A'}</p>
                          </div>

                          {/* Product Info */}
                          <div className="border-t pt-3">
                            <div className="flex items-center space-x-3">
                              {order.items && order.items.length > 0 ? (
                                <>
                                  <ProductImage
                                    src={order.items[0].product?.images?.[0] || order.items[0].image || "/images/placeholder.png"}
                                    alt={order.items[0].product?.name || order.items[0].name}
                                    productName={order.items[0].product?.name || order.items[0].name}
                                    width={48}
                                    height={48}
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {order.items[0].product?.name || order.items[0].name || 'Unknown Product'}
                                    </div>
                                    {order.items.length > 1 && (
                                      <div className="text-sm text-gray-500">
                                        +{order.items.length - 1} more items
                                      </div>
                                    )}
                                    <div className="text-sm font-medium text-purple-600">
                                      ${order.total?.toFixed(2) || order.amount?.toFixed(2) || '0.00'}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500">No items</div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="border-t pt-3 flex space-x-2">
                            <Button
                              onClick={() => {
                                setSelectedOrder(order)
                                setShowOrderDetails(true)
                              }}
                              size="sm"
                              variant="outline"
                              className="flex items-center space-x-1 flex-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Details</span>
                            </Button>
                            {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                              <Button
                                onClick={() => handleSubmit(order._id || order.id, orderType)}
                                disabled={updatingOrderId === (order._id || order.id)}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white font-medium flex-1"
                              >
                                {updatingOrderId === (order._id || order.id) ? 'Updating...' : 'Mark Delivered'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 space-y-3 sm:space-y-0">
                  <div className="text-sm text-gray-700 order-2 sm:order-1">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2 order-1 sm:order-2">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="px-3 py-1"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="px-3 py-1"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case "complains":
        return (
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Complaints Management</h2>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {complaint.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">{complaint.issue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{complaint.submittedDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusBadgeColor(complaint.status)}>{complaint.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          onClick={() => resolveComplaint(complaint.id)}
                          disabled={complaint.status === "Resolved"}
                          size="sm"
                          variant="outline"
                        >
                          Resolve
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900">{complaint.productName}</h3>
                        <Badge className={getStatusBadgeColor(complaint.status)}>{complaint.status}</Badge>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Issue</h4>
                        <p className="text-sm text-gray-600">{complaint.issue}</p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-xs text-gray-500">{complaint.submittedDate}</span>
                        <Button
                          onClick={() => resolveComplaint(complaint.id)}
                          disabled={complaint.status === "Resolved"}
                          size="sm"
                          variant="outline"
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      case "history":
        return (
          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Delivery History</h2>
            
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Delivered</p>
                      <p className="text-xl font-bold text-gray-900">{deliveryHistory.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Regular Orders</p>
                      <p className="text-xl font-bold text-gray-900">
                        {deliveryHistory.filter(item => item.type === 'order').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Surprise Gifts</p>
                      <p className="text-xl font-bold text-gray-900">
                        {deliveryHistory.filter(item => item.type === 'surprise-gift').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : deliveryHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No delivery history found
                      </td>
                    </tr>
                  ) : (
                    deliveryHistory.map((item) => (
                      <tr key={`${item.type}-${item._id || item.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{item._id?.slice(-8) || item.id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={item.type === 'order' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                            {item.type === 'order' ? 'Regular Order' : 'Surprise Gift'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.items && item.items.length > 0 && (
                              <>
                                <ProductImage
                                  src={item.items[0].product?.images?.[0] || item.items[0].image || "/images/placeholder.png"}
                                  alt={item.productName}
                                  productName={item.productName}
                                  width={40}
                                  height={40}
                                />
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                  {item.items.length > 1 && (
                                    <div className="text-sm text-gray-500">+{item.items.length - 1} more items</div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.user?.firstName || item.recipientName || 'N/A'} {item.user?.lastName || ''}
                            </div>
                            <div className="text-sm text-gray-500">{item.user?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.total?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : deliveryHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No delivery history found
                </div>
              ) : (
                deliveryHistory.map((item) => (
                  <Card key={`${item.type}-${item._id || item.id}`} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900">#{item._id?.slice(-8) || item.id || 'N/A'}</h3>
                          <div className="flex flex-col space-y-1">
                            <Badge className={item.type === 'order' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                              {item.type === 'order' ? 'Regular Order' : 'Surprise Gift'}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="flex items-center space-x-3">
                            {item.items && item.items.length > 0 && (
                              <>
                                <ProductImage
                                  src={item.items[0].product?.images?.[0] || item.items[0].image || "/images/placeholder.png"}
                                  alt={item.productName}
                                  productName={item.productName}
                                  width={48}
                                  height={48}
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                  {item.items.length > 1 && (
                                    <div className="text-sm text-gray-500">+{item.items.length - 1} more items</div>
                                  )}
                                  <div className="text-sm font-medium text-purple-600">
                                    ${item.total?.toFixed(2) || '0.00'}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {item.user?.firstName || item.recipientName || 'N/A'} {item.user?.lastName || ''}
                            </div>
                            <div className="text-gray-500">{item.user?.email || 'N/A'}</div>
                            <div className="text-gray-500 mt-1">
                              Delivered: {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )
      case "route":
        return (
          <div className="space-y-6">
            <DeliveryRoute orders={orders} />
          </div>
        )
      case "analytics":
        return (
          <div className="space-y-6">
            <DeliveryAnalytics stats={stats} orders={orders} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        userProfile={userProfile}
        notifications={notifications}
      />

      {/* Main Content with proper spacing */}
      <main className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">{renderContent()}</main>

      {/* Order Details Modal */}
      <OrderDetailsModal 
        order={selectedOrder} 
        isOpen={showOrderDetails} 
        onClose={() => {
          setShowOrderDetails(false)
          setSelectedOrder(null)
        }} 
      />
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        theme={"light"}
        richColors 
      />
    </div>
  )
}
