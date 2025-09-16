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


import { Calendar, Package, User, Phone, MapPin, Gift, Eye, CheckCircle, Clock, Truck, XCircle, Loader2, X, AlertCircle } from "lucide-react"

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



export default function SurpriseGiftManagement() {
  const [surpriseGifts, setSurpriseGifts] = useState([])
  const [filteredGifts, setFilteredGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingGifts, setProcessingGifts] = useState(new Set()) // Track which gifts are being processed
  const [selectedGift, setSelectedGift] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
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

  // Filter gifts based on search and status
  useEffect(() => {
    let filtered = surpriseGifts

    if (searchTerm) {
      filtered = filtered.filter(gift => 
        gift.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gift.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gift.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gift.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(gift => gift.status === statusFilter)
    }

    setFilteredGifts(filtered)
  }, [surpriseGifts, searchTerm, statusFilter])

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

  const reduceProductQuantity = async (giftId) => {
    try {
      // Find the gift to get its items
      const gift = surpriseGifts.find(g => g._id === giftId)
      if (!gift || !gift.items) {
        console.error('Gift not found or has no items')
        return false
      }

      // Extract product IDs and quantities
      const productUpdates = gift.items.map(item => ({
        productId: item.product._id || item.product,
        quantity: item.quantity
      }))

      console.log('Reducing stock for products:', productUpdates)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/reduce-stock`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: productUpdates
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('Stock reduced successfully:', data.message)
          return true
        } else {
          console.error('Failed to reduce stock:', data.message)

          showToast(`Failed to reduce product stock: ${data.message}`, 'error')

          return false
        }
      } else {
        console.error('Failed to reduce stock, status:', response.status)

        showToast('Failed to reduce product stock', 'error')

        return false
      }
    } catch (error) {
      console.error('Error reducing product stock:', error)

      showToast('Error reducing product stock', 'error')

      return false
    }
  }

  const createOrderSummary = async (giftId) => {
    try {
      // Find the gift to get its items
      const gift = surpriseGifts.find(g => g._id === giftId)
      if (!gift || !gift.items) {
        console.error('Gift not found or has no items')
        return false
      }

      // Create order summary records for each item
      const orderSummaryRecords = gift.items.map(item => {
        const product = item.product
        const salePrice = product.salePrice || product.retailPrice || product.price || 0
        const costPrice = product.costPrice || 0
        const retailPrice = product.retailPrice || product.price || 0
        const profit = salePrice - costPrice

        return {
          giftId: giftId,
          productSKU: product.sku || product._id,
          productId: product._id,
          productName: product.name,
          quantity: item.quantity,
          costPrice: costPrice,
          retailPrice: retailPrice,
          salePrice: salePrice,
          profit: profit,
          totalProfit: profit * item.quantity,
          orderDate: new Date().toISOString()
        }
      })

      console.log('Creating order summary records:', orderSummaryRecords)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order-summary/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          records: orderSummaryRecords
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('Order summary created successfully:', data.message)
          return true
        } else {
          console.error('Failed to create order summary:', data.message)

          showToast(`Failed to create order summary: ${data.message}`, 'error')

          return false
        }
      } else {
        console.error('Failed to create order summary, status:', response.status)

        showToast('Failed to create order summary', 'error')

        return false
      }
    } catch (error) {
      console.error('Error creating order summary:', error)

      showToast('Error creating order summary', 'error')

      return false
    }
  }

  // const reduceProductQuantity = async (giftId) => {
  //   try {
  //     // Find the gift to get its items
  //     const gift = surpriseGifts.find(g => g._id === giftId)
  //     if (!gift || !gift.items) {
  //       console.error('Gift not found or has no items')
  //       return false
  //     }

  //     // Extract product IDs and quantities
  //     const productUpdates = gift.items.map(item => ({
  //       productId: item.product._id || item.product,
  //       quantity: item.quantity
  //     }))

  //     console.log('Reducing stock for products:', productUpdates)

  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/reduce-stock`, {
  //       method: 'PUT',
  //       credentials: 'include',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ 
  //         items: productUpdates
  //       }),
  //     })
      
  //     if (response.ok) {
  //       const data = await response.json()
  //       if (data.success) {
  //         console.log('Stock reduced successfully:', data.message)
  //         return true
  //       } else {
  //         console.error('Failed to reduce stock:', data.message)
  //         alert('Failed to reduce product stock: ' + data.message)
  //         return false
  //       }
  //     } else {
  //       console.error('Failed to reduce stock, status:', response.status)
  //       alert('Failed to reduce product stock')
  //       return false
  //     }
  //   } catch (error) {
  //     console.error('Error reducing product stock:', error)
  //     alert('Error reducing product stock')
  //     return false
  //   }
  // }

  // const createOrderSummary = async (giftId) => {
  //   try {
  //     // Find the gift to get its items
  //     const gift = surpriseGifts.find(g => g._id === giftId)
  //     if (!gift || !gift.items) {
  //       console.error('Gift not found or has no items')
  //       return false
  //     }

  //     // Create order summary records for each item
  //     const orderSummaryRecords = gift.items.map(item => {
  //       const product = item.product
  //       const salePrice = product.salePrice || product.retailPrice || product.price || 0
  //       const costPrice = product.costPrice || 0
  //       const retailPrice = product.retailPrice || product.price || 0
  //       const profit = salePrice - costPrice

  //       return {
  //         giftId: giftId,
  //         productSKU: product.sku || product._id,
  //         productId: product._id,
  //         productName: product.name,
  //         quantity: item.quantity,
  //         costPrice: costPrice,
  //         retailPrice: retailPrice,
  //         salePrice: salePrice,
  //         profit: profit,
  //         totalProfit: profit * item.quantity,
  //         orderDate: new Date().toISOString()
  //       }
  //     })

  //     console.log('Creating order summary records:', orderSummaryRecords)

  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order-summary/create`, {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ 
  //         records: orderSummaryRecords
  //       }),
  //     })
      
  //     if (response.ok) {
  //       const data = await response.json()
  //       if (data.success) {
  //         console.log('Order summary created successfully:', data.message)
  //         return true
  //       } else {
  //         console.error('Failed to create order summary:', data.message)
  //         alert('Failed to create order summary: ' + data.message)
  //         return false
  //       }
  //     } else {
  //       console.error('Failed to create order summary, status:', response.status)
  //       alert('Failed to create order summary')
  //       return false
  //     }
  //   } catch (error) {
  //     console.error('Error creating order summary:', error)
  //     alert('Error creating order summary')
  //     return false
  //   }
  // }

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
      pending: surpriseGifts.filter(g => g.status === 'Pending').length,
      awaitingPayment: surpriseGifts.filter(g => g.status === 'AwaitingPayment').length,
      paid: surpriseGifts.filter(g => g.status === 'Paid').length,
      outForDelivery: surpriseGifts.filter(g => g.status === 'OutForDelivery').length,
      delivered: surpriseGifts.filter(g => g.status === 'Delivered').length,
      cancelled: surpriseGifts.filter(g => g.status === 'Cancelled').length,
      totalValue: surpriseGifts.reduce((sum, gift) => sum + gift.total, 0)
    }
    return stats
  }

  const refreshGifts = async () => {
    setLoading(true);
    await fetchSurpriseGifts();
  };

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
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Awaiting Payment</p>
                <p className="text-2xl font-bold">{stats.awaitingPayment}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Paid & Ready</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Out for Delivery</p>
                <p className="text-2xl font-bold">{stats.outForDelivery}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by recipient or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="AwaitingPayment">Awaiting Payment</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="OutForDelivery">Out for Delivery</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surprise Gifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Surprise Gifts ({filteredGifts.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
              {filteredGifts.map((gift) => (
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
                      {gift.status === 'Pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateGiftStatus(gift._id, 'Confirmed')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Confirm
                        </Button>
                      )}
                      {gift.status === 'AwaitingPayment' && (
                        <Badge className="bg-orange-100 text-orange-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Waiting for Payment
                        </Badge>
                      )}
                      {gift.status === 'Paid' && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            const giftId = gift._id
                            setProcessingGifts(prev => new Set([...prev, giftId]))
                            
                            try {
                              console.log('Step 1: Reducing product stock...')
                              const stockReduced = await reduceProductQuantity(giftId)
                              if (!stockReduced) {
                                return
                              }
                              
                              console.log('Step 2: Creating order summary...')
                              const orderSummaryCreated = await createOrderSummary(giftId)
                              if (!orderSummaryCreated) {
                                return
                              }
                              
                              console.log('Step 3: Updating gift status...')
                              await updateGiftStatus(giftId, 'OutForDelivery')
                              
                              console.log('Ship process completed successfully!')
                            } catch (error) {
                              console.error('Error in ship process:', error)


                              showToast('Error processing ship request', 'error')


                            } finally {
                              setProcessingGifts(prev => {
                                const newSet = new Set(prev)
                                newSet.delete(giftId)
                                return newSet
                              })
                            }
                          }}
                          disabled={processingGifts.has(gift._id)}
                          className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                        >
                          {processingGifts.has(gift._id) ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Ship'
                          )}
                        </Button>
                      )}
                      {gift.status === 'OutForDelivery' && (
                        <Button
                          size="sm"
                          onClick={() => updateGiftStatus(gift._id, 'Delivered')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Deliver
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredGifts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No surprise gifts found matching your criteria.
            </div>
          )}
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
                        onClick={() => updateGiftStatus(selectedGift._id, 'Scheduled')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Confirm & Schedule
                      </Button>
                    )}
                    {selectedGift.status === 'Scheduled' && (
                      <Button
                        onClick={async () => {
                          const giftId = selectedGift._id
                          // Add to processing set to show loading
                          setProcessingGifts(prev => new Set([...prev, giftId]))
                          
                          try {
                            // Step 1: Reduce product stock
                            console.log('Step 1: Reducing product stock...')
                            const stockReduced = await reduceProductQuantity(giftId)
                            if (!stockReduced) {
                              return // Exit if stock reduction failed
                            }
                            
                            // Step 2: Create order summary records
                            console.log('Step 2: Creating order summary...')
                            const orderSummaryCreated = await createOrderSummary(giftId)
                            if (!orderSummaryCreated) {
                              return // Exit if order summary creation failed
                            }
                            
                            // Step 3: Update gift status to OutForDelivery
                            console.log('Step 3: Updating gift status...')
                            await updateGiftStatus(giftId, 'OutForDelivery')
                            
                            console.log('Ship process completed successfully!')
                          } catch (error) {
                            console.error('Error in ship process:', error)


                            showToast('Error processing ship request', 'error')


                          } finally {
                            // Remove from processing set
                            setProcessingGifts(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(giftId)
                              return newSet
                            })
                          }
                        }}
                        disabled={processingGifts.has(selectedGift._id)}
                        className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                      >
                        {processingGifts.has(selectedGift._id) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Mark as Out for Delivery'
                        )}
                      </Button>
                    )}
                    {selectedGift.status === 'OutForDelivery' && (
                      <Button
                        onClick={() => updateGiftStatus(selectedGift._id, 'Delivered')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark as Delivered
                      </Button>
                    )}
                    {selectedGift.status !== 'Delivered' && selectedGift.status !== 'Cancelled' && (
                      <Button
                        onClick={() => updateGiftStatus(selectedGift._id, 'Cancelled')}
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