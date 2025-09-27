"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog"


import { Calendar, Package, User, Phone, MapPin, Gift, Eye, CheckCircle, Clock, Truck, XCircle, Loader2, X, AlertCircle, Printer } from "lucide-react"

export default function SurpriseGiftManagement() {
  // Toast Notification Component
  const Toast = ({ message, type, isVisible, onClose }) => {
    useEffect(() => {
      if (isVisible) {
        const timer = setTimeout(() => {
          onClose()
        }, 4000) // Auto close after 4 seconds
        return () => clearTimeout(timer)
      }
    }, [isVisible, onClose])

    if (!isVisible) return null

    const getToastStyle = () => {
      switch (type) {
        case 'success':
          return 'bg-green-50 border-green-200 text-green-800'
        case 'error':
          return 'bg-red-50 border-red-200 text-red-800'
        case 'info':
          return 'bg-blue-50 border-blue-200 text-blue-800'
        default:
          return 'bg-gray-50 border-gray-200 text-gray-800'
      }
    }

    const getIcon = () => {
      switch (type) {
        case 'success':
          return <CheckCircle className="w-5 h-5 text-green-600" />
        case 'error':
          return <XCircle className="w-5 h-5 text-red-600" />
        case 'info':
          return <AlertCircle className="w-5 h-5 text-blue-600" />
        default:
          return <AlertCircle className="w-5 h-5 text-gray-600" />
      }
    }

    return (
      <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
        <div className={`max-w-md p-4 rounded-lg border shadow-lg ${getToastStyle()}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const [surpriseGifts, setSurpriseGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingGifts, setProcessingGifts] = useState(new Set()) // Track which gifts are being processed
  const [selectedGift, setSelectedGift] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("processing")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  
  // Toast notification state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  })

  // Function to show toast notification
  const showToast = (message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    })
  }

  // Function to hide toast notification
  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {}
  })

  // New modal states
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null
  })

  const [notificationModal, setNotificationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  })

  // Fetch surprise gifts
  useEffect(() => {
    fetchSurpriseGifts()
  }, [])

  // Filter gifts based on search and active tab
  const filteredGifts = surpriseGifts.filter((gift) => {
    if (!gift || !gift.user) return false

    const matchesSearch =
      gift.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gift.user?.phone?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab =
      (activeTab === "processing" && gift.status === "Pending") ||
      (activeTab === "packing" && gift.status === "Packing") ||
      (activeTab === "deliveryConfirmed" && gift.status === "OutForDelivery") ||
      (activeTab === "all" && gift.status === "Delivered")

    // Apply date filtering only for "All Orders" tab
    let matchesDateFilter = true
    if (activeTab === "all" && (fromDate || toDate)) {
      const giftDate = new Date(gift.createdAt)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null

      if (from && to) {
        matchesDateFilter = giftDate >= from && giftDate <= to
      } else if (from) {
        matchesDateFilter = giftDate >= from
      } else if (to) {
        matchesDateFilter = giftDate <= to
      }
    } else if (activeTab === "all") {
      // Default: show only orders from last 2 weeks
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const giftDate = new Date(gift.createdAt)
      matchesDateFilter = giftDate >= twoWeeksAgo
    }

    return matchesSearch && matchesTab && matchesDateFilter
  })

  const fetchSurpriseGifts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surprise/all`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Extract product IDs from items for debugging
          const productIds = []
          data.data.forEach(gift => {
            if (gift.items && Array.isArray(gift.items)) {
              gift.items.forEach(item => {
                if (item.product) {
                  productIds.push({
                    giftId: gift._id,
                    productId: item.product,
                    quantity: item.quantity
                  })
                }
              })
            }
          })
          console.log('Product IDs extracted from surprise gifts:', productIds)
          
          setSurpriseGifts(data.data)
        } else {
          console.error('Failed to fetch surprise gifts:', data.message)
        }
      } else {
        console.error('Failed to fetch surprise gifts, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching surprise gifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateGiftStatus = async (giftId, newStatus, scheduledAt = null) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surprise/${giftId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          scheduledAt: scheduledAt 
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update local state
          setSurpriseGifts(prev => 
            prev.map(gift => 
              gift._id === giftId 
                ? { ...gift, status: newStatus, scheduledAt: scheduledAt }
                : gift
            )
          )
          
          // Close dialog if open
          if (selectedGift && selectedGift._id === giftId) {
            setSelectedGift({ ...selectedGift, status: newStatus, scheduledAt: scheduledAt })
          }
          

          showToast(`Surprise gift status updated to ${newStatus}. User will be notified via email and notification.`, 'success')
        } else {
          console.error('Failed to update status:', data.message)
          showToast(`Failed to update status: ${data.message}`, 'error')
        }
      } else {
        console.error('Failed to update status, status:', response.status)
        showToast('Failed to update status', 'error')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Error updating status', 'error')

    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'AwaitingPayment': { variant: 'default', className: 'bg-orange-100 text-orange-800', icon: Calendar },
      'Paid': { variant: 'default', className: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'OutForDelivery': { variant: 'default', className: 'bg-purple-100 text-purple-800', icon: Truck },
      'Delivered': { variant: 'default', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Cancelled': { variant: 'destructive', className: 'bg-red-100 text-red-800', icon: XCircle }
    }
    
    const config = statusConfig[status] || statusConfig['Pending']
    const IconComponent = config.icon
    
    return (
      <Badge className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getStats = () => {
    const stats = {
      total: surpriseGifts.length,
      processing: surpriseGifts.filter(g => g.status === 'Pending').length,
      packing: surpriseGifts.filter(g => g.status === 'Packing').length,
      delivered: surpriseGifts.filter(g => g.status === 'OutForDelivery').length,
      totalValue: surpriseGifts.reduce((sum, gift) => sum + gift.total, 0)
    }
    return stats
  }

  const refreshGifts = async () => {
    setLoading(true);
    await fetchSurpriseGifts();
  };

  // Print surprise gift details
  const printGiftDetails = async (giftId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surprise/${giftId}/print`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600')
        
        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Surprise Gift Order - ${data.data.orderId}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .section { margin-bottom: 20px; }
                .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                .item-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
                .total-row { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                .status { padding: 5px 10px; border-radius: 15px; display: inline-block; color: white; }
                .status-paid { background-color: #28a745; }
                .status-outfordelivery { background-color: #fd7e14; }
                .status-delivered { background-color: #28a745; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>SURPRISE GIFT ORDER</h1>
                <p><strong>Order ID:</strong> ${data.data.orderId}</p>
                <p><strong>Order Date:</strong> ${new Date(data.data.orderDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span class="status status-${data.data.status.toLowerCase()}">${data.data.status}</span></p>
              </div>

              <div class="info-grid">
                <div class="info-box">
                  <h3>👤 SENDER DETAILS</h3>
                  <p><strong>Name:</strong> ${data.data.sender.name}</p>
                  <p><strong>Email:</strong> ${data.data.sender.email}</p>
                  <p><strong>Phone:</strong> ${data.data.sender.phone}</p>
                  <p><strong>Address:</strong> ${data.data.sender.address}</p>
                </div>

                <div class="info-box">
                  <h3>🎁 RECEIVER DETAILS</h3>
                  <p><strong>Name:</strong> ${data.data.receiver.name}</p>
                  <p><strong>Phone:</strong> ${data.data.receiver.phone}</p>
                  <p><strong>Address:</strong> ${data.data.receiver.address}</p>
                </div>
              </div>

              <div class="section">
                <h3>📦 ORDER ITEMS</h3>
                ${data.data.orderDetails.items.map(item => `
                  <div class="item-row">
                    <div>
                      <strong>${item.name}</strong><br>
                      <small>SKU: ${item.sku} | Qty: ${item.quantity}</small>
                    </div>
                    <div>
                      $${item.price.toFixed(2)} × ${item.quantity} = $${item.subtotal.toFixed(2)}
                    </div>
                  </div>
                `).join('')}
                <div class="item-row total-row">
                  <div><strong>TOTAL AMOUNT</strong></div>
                  <div><strong>$${data.data.orderDetails.total.toFixed(2)}</strong></div>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-box">
                  <h3>🎭 SPECIAL INSTRUCTIONS</h3>
                  <p><strong>Costume:</strong> ${data.data.orderDetails.costume}</p>
                  <p><strong>Suggestions:</strong> ${data.data.orderDetails.suggestions}</p>
                  ${data.data.orderDetails.scheduledAt ? `<p><strong>Scheduled For:</strong> ${new Date(data.data.orderDetails.scheduledAt).toLocaleDateString()}</p>` : ''}
                </div>

                <div class="info-box">
                  <h3>🚚 DELIVERY DETAILS</h3>
                  <p><strong>Staff:</strong> ${data.data.delivery.deliveryStaff}</p>
                  <p><strong>Staff Phone:</strong> ${data.data.delivery.deliveryStaffPhone}</p>
                  ${data.data.delivery.packedAt ? `<p><strong>Packed At:</strong> ${new Date(data.data.delivery.packedAt).toLocaleString()}</p>` : ''}
                  ${data.data.delivery.deliveredAt ? `<p><strong>Delivered At:</strong> ${new Date(data.data.delivery.deliveredAt).toLocaleString()}</p>` : ''}
                </div>
              </div>

              <div class="section" style="border-top: 1px solid #ccc; padding-top: 20px; margin-top: 30px; text-align: center; color: #666;">
                <p><strong>Printed on:</strong> ${new Date(data.data.printedAt).toLocaleString()}</p>
                <p><strong>Printed by:</strong> ${data.data.printedBy}</p>
              </div>

              <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Print</button>
                <button onclick="window.close()" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
              </div>
            </body>
          </html>
        `
        
        printWindow.document.write(printContent)
        printWindow.document.close()
        
        // Auto-focus the print window
        printWindow.focus()
        
        showToast('Print window opened successfully', 'success')
      } else {
        showToast(data.message || 'Failed to load print data', 'error')
      }
    } catch (error) {
      console.error('Error loading print data:', error)
      showToast('Error loading print data', 'error')
    }
  }

  // Print all delivered orders
  const printAllDeliveredOrders = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (fromDate) queryParams.append('fromDate', fromDate)
      if (toDate) queryParams.append('toDate', toDate)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surprise/print-all-delivered?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600')
        
        const printContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>All Delivered Orders Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                .report-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .order { border: 2px solid #ccc; margin-bottom: 30px; padding: 20px; page-break-after: always; }
                .order:last-child { page-break-after: auto; }
                .order-header { background: #e9ecef; padding: 15px; margin: -20px -20px 20px -20px; border-bottom: 2px solid #ccc; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; background: #f9f9f9; }
                .item-row { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; }
                .total-row { font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
                .status { padding: 3px 8px; border-radius: 12px; font-size: 12px; }
                .status-delivered { background-color: #28a745; color: white; }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>DELIVERED ORDERS REPORT</h1>
                <div class="report-info">
                  <p><strong>Total Orders:</strong> ${data.data.totalOrders}</p>
                  <p><strong>Date Range:</strong> ${data.data.dateRange.from ? new Date(data.data.dateRange.from).toLocaleDateString() : 'N/A'} - ${data.data.dateRange.to ? new Date(data.data.dateRange.to).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Generated:</strong> ${new Date(data.data.printedAt).toLocaleString()}</p>
                  <p><strong>Generated By:</strong> ${data.data.printedBy}</p>
                </div>
              </div>

              ${data.data.orders.map(order => `
                <div class="order">
                  <div class="order-header">
                    <h2>ORDER #${order.orderId}</h2>
                    <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()} | <strong>Status:</strong> <span class="status status-delivered">${order.status}</span></p>
                  </div>

                  <div class="info-grid">
                    <div class="info-box">
                      <h3>👤 SENDER</h3>
                      <p><strong>Name:</strong> ${order.sender.name}</p>
                      <p><strong>Email:</strong> ${order.sender.email}</p>
                      <p><strong>Phone:</strong> ${order.sender.phone}</p>
                    </div>

                    <div class="info-box">
                      <h3>🎁 RECEIVER</h3>
                      <p><strong>Name:</strong> ${order.receiver.name}</p>
                      <p><strong>Phone:</strong> ${order.receiver.phone}</p>
                      <p><strong>Address:</strong> ${order.receiver.address}</p>
                    </div>
                  </div>

                  <div class="info-box">
                    <h3>📦 ORDER ITEMS</h3>
                    ${order.orderDetails.items.map(item => `
                      <div class="item-row">
                        <div>
                          <strong>${item.name}</strong><br>
                          <small>SKU: ${item.sku} | Qty: ${item.quantity}</small>
                        </div>
                        <div>$${item.price.toFixed(2)} × ${item.quantity} = $${item.subtotal.toFixed(2)}</div>
                      </div>
                    `).join('')}
                    <div class="item-row total-row">
                      <div><strong>TOTAL AMOUNT</strong></div>
                      <div><strong>$${order.orderDetails.total.toFixed(2)}</strong></div>
                    </div>
                  </div>

                  ${order.orderDetails.costume !== 'None' || order.orderDetails.suggestions !== 'None' ? `
                    <div class="info-box">
                      <h3>🎭 SPECIAL INSTRUCTIONS</h3>
                      <p><strong>Costume:</strong> ${order.orderDetails.costume}</p>
                      <p><strong>Suggestions:</strong> ${order.orderDetails.suggestions}</p>
                    </div>
                  ` : ''}
                </div>
              `).join('')}

              <div class="no-print" style="text-align: center; margin-top: 20px; position: fixed; bottom: 20px; right: 20px;">
                <button onclick="window.print()" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
                <button onclick="window.close()" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
              </div>
            </body>
          </html>
        `
        
        printWindow.document.write(printContent)
        printWindow.document.close()
        
        // Auto-focus the print window
        printWindow.focus()
        
        showToast(`Print report opened successfully (${data.data.totalOrders} orders)`, 'success')
      } else {
        showToast(data.message || 'Failed to load print data', 'error')
      }
    } catch (error) {
      console.error('Error loading print data:', error)
      showToast('Error loading print data', 'error')
    }
  }

  // Helper functions for modals
  const showNotification = (title, message, type = "info") => {
    setModalConfig({ title, message, type });
    setShowNotificationModal(true);
  };

  const showConfirmation = (title, message, onConfirm, type = "warning") => {
    setModalConfig({ title, message, type, onConfirm });
    setShowConfirmModal(true);
  };

  const stats = getStats()

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Surprise Gift Management</h1>
          <p className="text-gray-600">Manage surprise gift orders and deliveries</p>
        </div>
        <Button
          size="sm"
          onClick={refreshGifts}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gift className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gifts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Packing</p>
                <p className="text-2xl font-bold">{stats.packing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Delivery Confirmed</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by recipient, customer name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === "all" && (
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="From Date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                <Button
                  onClick={printAllDeliveredOrders}
                  className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print All
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Order Management Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Surprise Gift Orders</CardTitle>
          <p className="text-sm text-gray-600">
            {filteredGifts.length} of {surpriseGifts.length} gifts
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-x-2 w-full px-2 py-1 bg-gray-50 rounded-md border-2 border-gray-400">
              <TabsTrigger value="processing" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Processing ({surpriseGifts.filter(g => g.status === 'Pending').length})
              </TabsTrigger>
              <TabsTrigger value="packing" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Packing ({surpriseGifts.filter(g => g.status === 'Packing').length})
              </TabsTrigger>
              <TabsTrigger value="deliveryConfirmed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Delivery Confirmed ({surpriseGifts.filter(g => g.status === 'OutForDelivery').length})
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">
                All Orders ({surpriseGifts.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGifts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No surprise gifts found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGifts.map((gift) => (
                        <TableRow key={gift._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {gift.user?.firstName} {gift.user?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{gift.user?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{gift.recipientName}</p>
                              <p className="text-sm text-gray-500">{gift.recipientPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="max-w-48 truncate">{gift.shippingAddress}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">${gift.total.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(gift.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{new Date(gift.createdAt).toLocaleDateString()}</p>
                              <p className="text-gray-500">{new Date(gift.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedGift(gift)
                                  setShowDetails(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printGiftDetails(gift._id)}
                                title="Print Order Details"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                              
                              {/* Processing Tab Actions */}
                              {gift.status === 'Pending' && activeTab === 'processing' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      const giftId = gift._id
                                      setProcessingGifts(prev => new Set([...prev, giftId]))
                                      
                                      try {
                                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surprise/${giftId}/start-packing`, {
                                          method: 'POST',
                                          credentials: 'include',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          }
                                        })
                                        
                                        const data = await response.json()
                                        
                                        if (response.ok && data.success) {
                                          // Update local state
                                          setSurpriseGifts(prev => 
                                            prev.map(g => 
                                              g._id === giftId 
                                                ? { ...g, status: 'Packing', packedAt: new Date().toISOString() }
                                                : g
                                            )
                                          )
                                          
                                          showToast(
                                            `Packing started successfully! Total profit: $${data.data.totalProfit?.toFixed(2) || '0.00'}`, 
                                            'success'
                                          )
                                        } else {
                                          const errorMsg = data.message || 'Failed to start packing process'
                                          showToast(errorMsg, 'error')
                                          
                                          if (data.data?.insufficientStockItems) {
                                            const itemsList = data.data.insufficientStockItems.map(item => 
                                              `${item.productName}: requested ${item.requestedQuantity}, available ${item.availableStock}`
                                            ).join(', ')
                                            showToast(`Insufficient stock: ${itemsList}`, 'error')
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Error starting packing:', error)
                                        showToast('Network error while starting packing process', 'error')
                                      } finally {
                                        setProcessingGifts(prev => {
                                          const newSet = new Set(prev)
                                          newSet.delete(giftId)
                                          return newSet
                                        })
                                      }
                                    }}
                                    disabled={processingGifts.has(gift._id)}
                                    className="border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                    variant="outline"
                                  >
                                    {processingGifts.has(gift._id) ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      'Start Packing'
                                    )}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      const giftId = gift._id
                                      
                                      try {
                                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surprise/${giftId}/cancel`, {
                                          method: 'PUT',
                                          credentials: 'include',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          }
                                        })
                                        
                                        if (response.ok) {
                                          const data = await response.json()
                                          if (data.success) {
                                            // Remove the cancelled gift from the list
                                            setSurpriseGifts(prev => 
                                              prev.filter(g => g._id !== giftId)
                                            )
                                            
                                            showToast('Surprise gift order cancelled successfully', 'success')
                                          } else {
                                            showToast(data.message || 'Failed to cancel order', 'error')
                                          }
                                        } else {
                                          showToast('Failed to cancel order', 'error')
                                        }
                                      } catch (error) {
                                        console.error('Error cancelling order:', error)
                                        showToast('Error cancelling order', 'error')
                                      }
                                    }}
                                    className="border-red-600 text-red-600 hover:bg-red-50"
                                    variant="outline"
                                  >
                                    Cancel Order
                                  </Button>
                                </>
                              )}

                              {/* Packing Tab Actions */}
                              {gift.status === 'Packing' && activeTab === 'packing' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateGiftStatus(gift._id, 'OutForDelivery')}
                                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                                  variant="outline"
                                >
                                  Mark for Delivery
                                </Button>
                              )}

                              {/* Delivery Confirmed Tab Actions */}
                              {gift.status === 'OutForDelivery' && activeTab === 'deliveryConfirmed' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateGiftStatus(gift._id, 'Delivered')}
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                  variant="outline"
                                >
                                  Mark as Delivered
                                </Button>
                              )}

                              {/* All Orders Tab - Show completion status */}
                              {gift.status === 'Delivered' && activeTab === 'all' && (
                                <Badge className="bg-green-100 text-green-800">
                                  ✅ Completed
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Gift Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Surprise Gift Details</DialogTitle>
          </DialogHeader>
          
          {selectedGift && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Name:</strong> {selectedGift.user?.firstName} {selectedGift.user?.lastName}</p>
                    <p><strong>Email:</strong> {selectedGift.user?.email}</p>
                    <p><strong>Phone:</strong> {selectedGift.user?.phone || 'N/A'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Recipient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Name:</strong> {selectedGift.recipientName}</p>
                    <p><strong>Phone:</strong> {selectedGift.recipientPhone}</p>
                    <p><strong>Address:</strong> {selectedGift.shippingAddress}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      {getStatusBadge(selectedGift.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-bold text-lg">${selectedGift.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Costume</p>
                      <p className="font-medium">{selectedGift.costume || 'None'}</p>
                    </div>
                  </div>

                  {selectedGift.suggestions && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Special Suggestions</p>
                      <p className="bg-gray-50 p-3 rounded border">{selectedGift.suggestions}</p>
                    </div>
                  )}

                  {selectedGift.scheduledAt && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Scheduled Delivery</p>
                      <p className="font-medium">{new Date(selectedGift.scheduledAt).toLocaleDateString()}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-semibold">Items:</h4>
                    {selectedGift.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${item.price.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">${(item.price * item.quantity).toFixed(2)} total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Update Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedGift.status === 'Pending' && (
                      <Button
                        onClick={async () => {
                          const giftId = selectedGift._id
                          
                          try {
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/surprise/${giftId}/cancel`, {
                              method: 'PUT',
                              credentials: 'include',
                              headers: {
                                'Content-Type': 'application/json',
                              }
                            })
                            
                            if (response.ok) {
                              const data = await response.json()
                              if (data.success) {
                                // Close modal and refresh the list
                                setShowDetails(false)
                                await fetchSurpriseGifts()
                                
                                showToast('Surprise gift order cancelled successfully', 'success')
                              } else {
                                showToast(data.message || 'Failed to cancel order', 'error')
                              }
                            } else {
                              showToast('Failed to cancel order', 'error')
                            }
                          } catch (error) {
                            console.error('Error cancelling order:', error)
                            showToast('Error cancelling order', 'error')
                          }
                        }}
                        variant="destructive"
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}

      />
    </div>
  )
}