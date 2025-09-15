"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"

import {
  Phone,
  Package,
  Mail,
  Eye,
  Gift,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  Printer,
} from "lucide-react"

const statusColors = {
  processing: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  packing: "bg-yellow-100 text-yellow-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const packingStatusColors = {
  not_packed: "bg-gray-100 text-gray-800",
  packing_in_progress: "bg-yellow-100 text-yellow-800",
  packed: "bg-green-100 text-green-800",
}

const priorityColors = {
  high: "bg-red-100 text-red-800",
  normal: "bg-gray-100 text-gray-800",
  low: "bg-green-100 text-green-800",
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function CollaborativePurchasesManagement() {
  const router = useRouter()
  const [collaborativePurchases, setCollaborativePurchases] = useState([])
  const [expandedOrders, setExpandedOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  const [loading, setLoading] = useState(true)

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    )
  }

  const fetchCollaborativePurchases = async () => {
    try {
      setLoading(true)
      console.log("Fetching all collaborative purchases...");
      const response = await axios.get(`${API_BASE_URL}/collaborative-purchases/all`);
      console.log("API Response:", response.data);

      const allPurchases = Array.isArray(response.data.collaborativePurchases) 
        ? response.data.collaborativePurchases 
        : [];

      // Filter purchases with status "Processing" only
      const processingPurchases = allPurchases.filter(purchase => {
        console.log(`Checking purchase ${purchase._id || purchase.id}:`, {
          status: purchase.status,
          statusType: typeof purchase.status,
        });
        
        return purchase.status === "Processing" ||
               (purchase.status && purchase.status.trim() === "Processing") ||
               (purchase.status && purchase.status.trim().toLowerCase() === "processing");
      });

      // Map collaborative purchases to the same structure as orders
      const mappedPurchases = processingPurchases.map((purchase) => ({
        id: purchase._id,
        _id: purchase._id,
        createdAt: purchase.createdAt,
        orderedAt: purchase.createdAt,
        orderDate: purchase.createdAt,
        status: purchase.status.toLowerCase(),
        total: purchase.totalAmount || 0,
        totalAmount: purchase.totalAmount || 0,
        statusHistory: [],
        user: {
          firstName: 'Collaborative',
          lastName: 'Purchase',
          phone: 'N/A',
          email: 'N/A',
          address: 'N/A'
        },
        items: purchase.isMultiProduct 
          ? (purchase.products || []).map((product, index) => ({
              id: product._id || `collab-product-${index}`,
              product: product._id || '',
              name: product.name || 'Unknown Product',
              price: product.price || 0,
              quantity: product.quantity || 1,
              image: product.image || '/placeholder.svg',
              sku: `COLLAB-${purchase._id.slice(-6)}-${index + 1}`,
              category: 'Collaborative',
              weight: '1.0 lbs',
              status: 'in_stock'
            }))
          : [{
              id: purchase.product || `collab-item-${purchase._id}`,
              product: purchase.product || '',
              name: purchase.productName || 'Unknown Product',
              price: purchase.productPrice || 0,
              quantity: purchase.quantity || 1,
              image: '/placeholder.svg',
              sku: `COLLAB-${purchase._id.slice(-6)}`,
              category: 'Collaborative',
              weight: '1.0 lbs',
              status: 'in_stock'
            }],
        deliveryNotes: '',
        trackingNumber: '',
        referenceCode: `COLLAB-${purchase._id.slice(-6)}`,
        orderId: purchase._id,
        priority: 'normal',
        orderSource: 'Collaborative Purchase',
        customerName: 'Collaborative Purchase',
        customerPhone: 'N/A',
        customerEmail: 'N/A',
        customerNotes: '',
        packingStatus: 'not_packed',
        assignedStaff: '',
        codAmount: 0,
        paymentMethod: 'collaborative_payment',
        isGift: false,
        giftWrap: false,
        giftMessage: '',
        address: 'N/A',
        billingAddress: 'N/A',
        estimatedTime: '2-3 days',
        shippingMethod: 'standard',
        specialInstructions: '',
        internalNotes: ''
      }));

      console.log("Mapped Collaborative Purchases:", mappedPurchases);
      console.log("Number of processing purchases found:", mappedPurchases.length);
      
      setCollaborativePurchases(mappedPurchases)
    } catch (error) {
      console.error("Error fetching collaborative purchases:", error);
    } finally {
      setLoading(false)
    }
  };

  const handleViewParticipants = (purchase) => {
    const participantData = {
      purchaseId: purchase._id,
      productName: purchase.items[0]?.name || 'Unknown Product',
      participants: purchase.participants || [
        {
          email: "cst21055@std.uwu.ac.lk",
          paymentStatus: "pending",
          paymentLink: "ce3c19a363bf67c46bf9d880d75dc859b8e56c72b4041ee805115405aece6d01",
          profilePicture: "/placeholder.svg"
        }
      ]
    };
    setSelectedParticipant(participantData);
    setShowParticipantModal(true);
  };

  const handleRemoveCollaborativePurchase = async (purchaseId) => {
    if (window.confirm("Are you sure you want to remove this collaborative purchase?")) {
      try {
        setCollaborativePurchases(prev => prev.filter(purchase => purchase._id !== purchaseId));
        console.log("Removed collaborative purchase:", purchaseId);
      } catch (error) {
        console.error("Error removing collaborative purchase:", error);
        alert("Error removing collaborative purchase. Please try again.");
        fetchCollaborativePurchases();
      }
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      console.log("Accepting collaborative purchase:", orderId);
      // Here you would typically make an API call to accept the order
      // For now, we'll just update the local state
      setCollaborativePurchases(prev => 
        prev.map(purchase => 
          purchase.id === orderId 
            ? { ...purchase, status: 'accepted' }
            : purchase
        )
      );
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };

  const confirmPacked = async (orderId) => {
    try {
      console.log("Confirming packed:", orderId);
      setCollaborativePurchases(prev => 
        prev.map(purchase => 
          purchase.id === orderId 
            ? { ...purchase, status: 'packed', packingStatus: 'packed' }
            : purchase
        )
      );
    } catch (error) {
      console.error("Error confirming packed:", error);
    }
  };

  const markAsDelivered = async (orderId) => {
    try {
      console.log("Marking as delivered:", orderId);
      setCollaborativePurchases(prev => 
        prev.map(purchase => 
          purchase.id === orderId 
            ? { ...purchase, status: 'delivered' }
            : purchase
        )
      );
    } catch (error) {
      console.error("Error marking as delivered:", error);
    }
  };

  const printCustomerDetails = (order) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Collaborative Purchase - ${order.referenceCode}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .section { margin-bottom: 25px; }
              .label { font-weight: bold; color: #333; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🤝 Collaborative Purchase Details</h1>
              <h2>Reference: ${order.referenceCode}</h2>
            </div>
            <div class="section">
              <h3>Purchase Information</h3>
              <p><span class="label">Status:</span> ${order.status}</p>
              <p><span class="label">Total Amount:</span> £${order.totalAmount}</p>
              <p><span class="label">Items:</span> ${order.items.length} products</p>
            </div>
            <div class="section">
              <h3>Product Details</h3>
              ${order.items.map(item => `
                <p><span class="label">${item.name}:</span> ${item.quantity} x £${item.price}</p>
              `).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Create ExpandableProductRow component for collaborative purchases
  const ExpandableProductRow = ({ order, isExpanded }) => {
    if (!isExpanded) return null;

    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-gray-50 p-0">
          <div className="p-4 space-y-4">
            <h4 className="font-medium text-sm text-gray-700">Product Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {order.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 bg-white">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                      <div className="text-xs text-muted-foreground">Category: {item.category}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium">£{item.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  useEffect(() => {
    fetchCollaborativePurchases();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collaborative purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Orders
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🤝 Collaborative Purchases</h1>
                <p className="text-gray-600">Manage processing collaborative purchases</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchCollaborativePurchases}
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processing</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collaborativePurchases.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{collaborativePurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total processing value</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{collaborativePurchases.length > 0 
                  ? (collaborativePurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0) / collaborativePurchases.length).toFixed(2)
                  : '0.00'
                }
              </div>
              <p className="text-xs text-muted-foreground">Average value</p>
            </CardContent>
          </Card>
        </div>

        {/* Collaborative Purchases Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-xl">Processing Collaborative Purchases</CardTitle>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {collaborativePurchases.length} items
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Order Details</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Gift</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborativePurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-12 w-12 text-gray-300" />
                          <h3 className="text-lg font-medium">No Processing Collaborative Purchases</h3>
                          <p>There are currently no collaborative purchases with "Processing" status.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    collaborativePurchases.map((order, index) => (
                      <React.Fragment key={order.id || index}>
                        <TableRow className="hover:bg-gray-50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="p-1"
                            >
                              {expandedOrders.includes(order.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-blue-600">{order.referenceCode}</div>
                              <div className="text-sm text-muted-foreground">{order.orderId}</div>
                              <div className="flex gap-1">
                                <Badge variant="outline" className={priorityColors[order.priority]}>
                                  {order.priority}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-orange-100 text-orange-800 border-orange-300"
                                >
                                  🤝 {order.orderSource}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(order.orderDate).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{order.customerName}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {order.customerPhone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {order.customerEmail}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Address:</strong> {order.user.address}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{order.items.length} products</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.items.reduce((sum, item) => sum + item.quantity, 0)} total items
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleOrderExpansion(order.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto"
                              >
                                {expandedOrders.includes(order.id) ? "Hide Products" : "View Products"}
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              <Badge className={statusColors[order.status]}>{order.status?.replace("_", " ") || "Unknown"}</Badge>
                              {order.packingStatus !== "not_packed" && (
                                <Badge className={packingStatusColors[order.packingStatus]}>
                                  {order.packingStatus?.replace("_", " ") || "Unknown"}
                                </Badge>
                              )}
                              {order.assignedStaff && (
                                <div className="text-xs text-muted-foreground">👤 {order.assignedStaff}</div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-lg">£{order.totalAmount}</div>
                              {order.codAmount > 0 && (
                                <div className="text-xs text-orange-600 font-medium">💵 COD: £{order.codAmount}</div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {order.paymentMethod.replace("_", " ")}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {order.isGift && <Gift className="h-4 w-4 text-pink-500" />}
                              {order.giftWrap && (
                                <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-800">
                                  🎁 Wrapped
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewParticipants(order)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => printCustomerDetails(order)}
                                className="hover:bg-gray-50"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>

                              {order.status === "processing" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => acceptOrder(order.id)}
                                  className="bg-green-50 text-green-700 hover:bg-green-100"
                                >
                                  Accept
                                </Button>
                              )}

                              {order.status === "accepted" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => confirmPacked(order.id)}
                                  className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                >
                                  Pack
                                </Button>
                              )}

                              {order.status === "packed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsDelivered(order.id)}
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                >
                                  Deliver
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveCollaborativePurchase(order._id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <ExpandableProductRow order={order} isExpanded={expandedOrders.includes(order.id)} />
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Participant Details Modal */}
        {showParticipantModal && selectedParticipant && (
          <Dialog open={showParticipantModal} onOpenChange={setShowParticipantModal}>
            <DialogContent className="max-w-2xl">
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-2xl font-bold">Participant Details</h2>
                  <p className="text-muted-foreground">
                    Product: {selectedParticipant.productName}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {selectedParticipant.participants.map((participant, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 border-2 border-gray-200 rounded-full overflow-hidden flex items-center justify-center">
                          <img 
                            src={participant.profilePicture || '/placeholder.svg'} 
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <span className="font-medium text-sm text-muted-foreground">Email:</span>
                            <p className="font-medium">{participant.email}</p>
                          </div>
                          <div>
                            <span className="font-medium text-sm text-muted-foreground">Payment Status:</span>
                            <Badge 
                              className={participant.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                            >
                              {participant.paymentStatus}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium text-sm text-muted-foreground">Payment Link:</span>
                            <div className="bg-gray-50 p-2 rounded border font-mono text-xs break-all">
                              {participant.paymentLink}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowParticipantModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}