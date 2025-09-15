"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Eye,
  Package,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  ShoppingBag,
  Gift,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// Status colors for consistency
const statusColors: Record<string, string> = {
  processing: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300", 
  normal: "bg-green-100 text-green-800 border-green-300",
  low: "bg-blue-100 text-blue-800 border-blue-300",
};

const packingStatusColors: Record<string, string> = {
  not_packed: "bg-gray-100 text-gray-800",
  partially_packed: "bg-yellow-100 text-yellow-800",
  fully_packed: "bg-green-100 text-green-800",
};

interface CollaborativePurchase {
  id: string;
  _id: string;
  createdAt: string;
  orderedAt: string;
  orderDate: string;
  status: string;
  total: number;
  totalAmount: number;
  statusHistory: any[];
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
  };
  items: {
    id: string;
    product: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    sku: string;
    category: string;
    weight: string;
    status: string;
  }[];
  deliveryNotes: string;
  trackingNumber: string;
  referenceCode: string;
  orderId: string;
  priority: string;
  orderSource: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNotes: string;
  packingStatus: string;
  assignedStaff: string;
  codAmount: number;
  paymentMethod: string;
  isGift: boolean;
  giftWrap: boolean;
  giftMessage: string;
  address: string;
  billingAddress: string;
  estimatedTime: string;
  shippingMethod: string;
  specialInstructions: string;
  internalNotes: string;
}

export default function CollaborativePurchasesPage() {
  const router = useRouter();
  const [collaborativePurchases, setCollaborativePurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    fetchCollaborativePurchases();
  }, []);

  const fetchCollaborativePurchases = async () => {
    try {
      setLoading(true);
      console.log("Fetching collaborative purchases...");
      const response = await axios.get(`${API_BASE_URL}/collaborative-purchases/all`);
      console.log("Collaborative Purchases API Response:", response.data);

      const allPurchases = Array.isArray(response.data.collaborativePurchases) 
        ? response.data.collaborativePurchases 
        : [];

      // Filter for Processing status only
      const processingPurchases = allPurchases.filter(purchase => {
        return purchase.status === "Processing" || 
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
      setCollaborativePurchases(mappedPurchases);
    } catch (error) {
      console.error("Error fetching collaborative purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const handleViewParticipants = (purchase) => {
    // Create mock participant data based on the requirements
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
        // Remove from local state immediately for better UX
        setCollaborativePurchases(prev => prev.filter(purchase => purchase._id !== purchaseId));
        
        // Here you would typically make an API call to remove from database
        // await axios.delete(`${API_BASE_URL}/collaborative-purchases/${purchaseId}`);
        
        console.log("Removed collaborative purchase:", purchaseId);
      } catch (error) {
        console.error("Error removing collaborative purchase:", error);
        alert("Error removing collaborative purchase. Please try again.");
        // Refresh the list if there was an error
        fetchCollaborativePurchases();
      }
    }
  };

  const ExpandableProductRow = ({ order, isExpanded }) => {
    if (!isExpanded) return null;

    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-gray-50 p-0">
          <div className="p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">📦 Product Details</h4>
            <div className="grid gap-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white rounded border">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    <img 
                      src={item.image || '/placeholder.svg'} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <div className="text-gray-500">SKU: {item.sku}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span> {item.category}
                    </div>
                    <div>
                      <span className="text-gray-500">Qty:</span> {item.quantity}
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span> £{item.price}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collaborative purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">🤝 Collaborative Purchases</h1>
                <p className="text-sm text-gray-500">Manage pending collaborative purchases</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCollaborativePurchases}
            >
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">{collaborativePurchases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    £{collaborativePurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Gift className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {collaborativePurchases.filter(p => p.status === 'processing').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Collaborative Purchases</CardTitle>
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
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No collaborative purchases found.
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
                              {order.user?.address && (
                                <div className="text-xs text-muted-foreground">
                                  <strong>Address:</strong> {order.user.address}
                                </div>
                              )}
                              {order.customerNotes && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                                  💡 {order.customerNotes}
                                </div>
                              )}
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
                              <Badge className={statusColors[order.status]}>
                                {order.status?.replace("_", " ") || "Unknown"}
                              </Badge>
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
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveCollaborativePurchase(order._id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Package className="h-4 w-4 mr-1" />
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
  );
}