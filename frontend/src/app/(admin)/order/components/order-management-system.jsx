"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { DashboardStats } from "./dashboard-stats"
import { OrderSearchFilters } from "./order-search-filters"
import { ExpandableProductRow } from "./expandable-product-row"
import { OrderActions } from "./order-actions"
import { OrderDetailsDialog } from "./order-details-dialog"

import {
  Phone,
  Package,
  Mail,
  Eye,
  Gift,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
  Download,
  Printer,
  Loader2,
} from "lucide-react"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  packing: "bg-orange-100 text-orange-800",
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

export function OrderManagementSystem() {
  const [orders, setOrders] = useState([])
  const [surpriseGifts, setSurpriseGifts] = useState([])
  const [collaborativeGifts, setCollaborativeGifts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("accepted")
  const [expandedOrders, setExpandedOrders] = useState([])
  const [internalNotes, setInternalNotes] = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const [loadingStates, setLoadingStates] = useState({}) // Track loading state for each button

  // Combine all orders (regular orders, surprise gifts, collaborative gifts)
  const allOrders = [
    ...orders.map(order => ({ ...order, orderType: 'regular' })),
    ...surpriseGifts.map(gift => ({
      ...gift,
      orderType: 'surprise',
      id: gift._id,
      createdAt: gift.createdAt || gift.orderDate,
      orderDate: gift.createdAt || gift.orderDate,
      recipientName: gift.recipientName || `${gift.user?.firstName || ''} ${gift.user?.lastName || ''}`.trim(),
      recipientPhone: gift.recipientPhone || gift.user?.phone || 'N/A',
      shippingAddress: gift.recipientAddress || gift.shippingAddress || 'Address not provided',
      totalAmount: gift.total || 0,
      customerName: gift.recipientName || `${gift.user?.firstName || ''} ${gift.user?.lastName || ''}`.trim(),
      customerPhone: gift.recipientPhone || gift.user?.phone || 'N/A',
      customerEmail: gift.user?.email || 'N/A',
    })),
    ...collaborativeGifts.map(gift => ({
      ...gift,
      orderType: 'collaborative',
      id: gift._id,
      createdAt: gift.createdAt || gift.orderDate,
      orderDate: gift.createdAt || gift.orderDate,
      recipientName: gift.recipientName || `${gift.user?.firstName || ''} ${gift.user?.lastName || ''}`.trim(),
      recipientPhone: gift.recipientPhone || gift.user?.phone || 'N/A',
      shippingAddress: gift.recipientAddress || gift.shippingAddress || 'Collaborative Purchase - Multiple Recipients',
      totalAmount: gift.total || gift.totalAmount || 0,
      customerName: `Collaborative Gift (${gift.participants?.length || 0} participants)`,
      customerPhone: gift.user?.phone || 'N/A',
      customerEmail: gift.user?.email || 'N/A',
    }))
  ];

  const filteredOrders = allOrders.filter((order) => {
    if (!order || !order.user || !order.items) return false

    const matchesSearch =
      (order.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) => item.name?.toLowerCase().includes(searchTerm.toLowerCase()))) ?? false

    const matchesTab =
      (activeTab === "accepted" && order.status === "processing") ||
      (activeTab === "packed" && order.status === "packing") ||
      (activeTab === "delivery" && order.status === "shipped") ||
      (activeTab === "all" && order.status === "delivered") // Show only completed orders in All tab

    // Apply date filtering only for "All" tab
    let matchesDateFilter = true;
    if (activeTab === "all" && (fromDate || toDate)) {
      const orderDate = new Date(order.orderDate);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      if (from && to) {
        matchesDateFilter = orderDate >= from && orderDate <= to;
      } else if (from) {
        matchesDateFilter = orderDate >= from;
      } else if (to) {
        matchesDateFilter = orderDate <= to;
      }
    }

    return matchesSearch && matchesTab && matchesDateFilter
  })

  // Debug logging
  console.log('Active tab:', activeTab);
  console.log('Total regular orders:', orders.length);
  console.log('Total surprise gifts:', surpriseGifts.length);
  console.log('Total collaborative gifts:', collaborativeGifts.length);
  console.log('Total combined orders:', allOrders.length);
  console.log('Filtered orders:', filteredOrders.length);
  console.log('Orders by status:', allOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {}));
  console.log('Orders by type:', allOrders.reduce((acc, order) => {
    acc[order.orderType] = (acc[order.orderType] || 0) + 1;
    return acc;
  }, {}));

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    )
  }

  const setButtonLoading = (orderId, actionType, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${orderId}-${actionType}`]: isLoading
    }))
  }



  const reduceProductStock = async (orderItems) => {
    try {
      // console.log("Order items being processed:", orderItems);
      // console.log("API_BASE_URL value:", API_BASE_URL);
      
      // Filter out items without valid product IDs
      const validItems = orderItems.filter(item => {
        let productId = null;
        
        if (item.product) {
          // If product is an object, extract its _id
          if (typeof item.product === 'object' && item.product._id) {
            productId = item.product._id;
          } else if (typeof item.product === 'string') {
            productId = item.product;
          }
        } else if (item.productId) {
          productId = item.productId;
        } else if (item.id) {
          productId = item.id;
        }
        
        const isValidObjectId = productId && typeof productId === 'string' && productId.match(/^[0-9a-fA-F]{24}$/);
        
        if (!isValidObjectId) {
          // console.warn("Skipping item with invalid product ID:", item, "Extracted ID:", productId);
          return false;
        }
        return true;
      });

      if (validItems.length === 0) {
        // console.warn("No valid product IDs found in order items");
        return;
      }

      const itemsToSend = validItems.map((item) => {
        let productId = null;
        
        if (item.product) {
          if (typeof item.product === 'object' && item.product._id) {
            productId = item.product._id;
          } else if (typeof item.product === 'string') {
            productId = item.product;
          }
        } else if (item.productId) {
          productId = item.productId;
        } else if (item.id) {
          productId = item.id;
        }
        
        // console.log("Valid item:", item, "ProductId extracted:", productId);
        return {
          productId: productId,
          quantity: item.quantity,
        };
      });

      // console.log("Items being sent to API:", itemsToSend);
      // console.log("API URL being used:", `${API_BASE_URL}/products/reduce-stock`);
      // console.log("Request payload:", JSON.stringify({ items: itemsToSend }, null, 2));

      const response = await axios.put(`${API_BASE_URL}/products/reduce-stock`, {
        items: itemsToSend,
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        // console.log("Product stock updated successfully:", response.data);
        // Removed alert for successful stock update
      } else {
        // console.error("Failed to update product stock:", response.data.message);
      }
    } catch (error) {
      // console.error("Error updating product stock:", error);
      // console.error("Error response:", error.response?.data);
      // console.error("Full error details:", {
      //   message: error.message,
      //   status: error.response?.status,
      //   statusText: error.response?.statusText,
      //   data: error.response?.data,
      //   errors: error.response?.data?.errors
      // });
      
      if (error.response?.data?.data?.insufficientStockItems) {
        const insufficientItems = error.response.data.data.insufficientStockItems;
        const itemsList = insufficientItems.map(item => 
          `${item.productName}: requested ${item.requestedQuantity}, available ${item.availableStock}`
        ).join('\n');
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err).join('\n');
      } else if (error.response?.data?.message) {
      } else {
      }
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      console.log("Order ID being sent:", orderId);
      setButtonLoading(orderId, 'accept', true);

      const response = await axios.put(
        `${API_BASE_URL}/orders/accept`,
        { orderId: orderId },
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log(`Order ${orderId} accepted successfully`);
        
        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? { ...order, status: "processing" }
              : order
          )
        );

        // Reduce product stock
        const order = orders.find((o) => o.id === orderId);
        if (order && order.items) {
          await reduceProductStock(order.items);
        }
      } else {
        console.error(`Failed to accept order: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error processing order:", error);
    } finally {
      setButtonLoading(orderId, 'accept', false);
    }
  }

  const updateOrderToPacking = async (orderId) => {
    try {
      console.log("Moving order to packing:", orderId);
      setButtonLoading(orderId, 'packing', true);

      const response = await axios.put(
        `${API_BASE_URL}/orders/update-to-packing`,
        { orderId: orderId },
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log(`Order ${orderId} status updated to Packing`);
        
        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? { ...order, status: "packing" }
              : order
          )
        );
      } else {
        console.error(`Failed to update order to packing: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error updating order to packing:", error);
    } finally {
      setButtonLoading(orderId, 'packing', false);
    }
  }

  const rejectOrder = (orderId) => {
    console.log(`Rejecting order: ${orderId}`)
  }

  const packingComplete = (orderId) => {
    console.log(`Marking packing complete for order: ${orderId}`)
  }

  const updateQuantity = (orderId, itemId, newQuantity) => {
    console.log(`Updating quantity for order ${orderId}, item ${itemId} to ${newQuantity}`)
  }

  const removeItem = (orderId, itemId) => {
    console.log(`Removing item ${itemId} from order ${orderId}`)
  }

  const saveInternalNotes = (orderId) => {
    console.log(`Saving notes for order ${orderId}: ${internalNotes[orderId]}`)
  }

  const printAllOrdersSequentially = async (orders) => {
    if (!orders || orders.length === 0) {
      return;
    }

    // Print orders one by one with delays
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      console.log(`Printing order ${i + 1} of ${orders.length}: ${order.referenceCode}`);
      
      // Print the order
      printOrderDetails(order);
      
      // Wait before printing the next order (except for the last one)
      if (i < orders.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
      }
    }
    
    // Show completion message
    setTimeout(() => {
    }, 2000);
  };

  const printOrderDetails = (order) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalWeight = order.items.reduce((sum, item) => sum + parseFloat(item.weight?.replace(' lbs', '') || '0'), 0);
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Gift Commerce - Order Invoice #${order.referenceCode}</title>
            <style>
              @media print {
                @page { margin: 0.5in; size: A4; }
                body { margin: 0; }
              }
              body { 
                font-family: 'Arial', sans-serif; 
                margin: 0; 
                padding: 20px; 
                line-height: 1.4; 
                color: #333;
                background: white;
              }
              .invoice-container { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white; 
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px; 
                text-align: center; 
                margin-bottom: 0;
              }
              .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
              .header h2 { margin: 0 0 5px 0; font-size: 20px; font-weight: normal; }
              .header p { margin: 0; font-size: 14px; opacity: 0.9; }
              
              .content { padding: 30px; }
              .section { 
                margin-bottom: 30px; 
                min-width: 120px;
              }
              .value { color: #333; }
              
              .items-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 15px 0;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .items-table th { 
                background: #f8f9fa; 
                padding: 15px 12px; 
                text-align: left; 
                font-weight: bold;
                color: #555;
                border-bottom: 2px solid #dee2e6;
              }
              .items-table td { 
                padding: 12px; 
                border-bottom: 1px solid #eee;
                vertical-align: top;
              }
              .items-table tr:hover { background: #f8f9fa; }
              .items-table tr:last-child td { border-bottom: none; }
              
              .payment-summary {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #28a745;
              }
              .payment-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 5px 0;
              }
              .payment-row.total {
                border-top: 2px solid #dee2e6;
                margin-top: 15px;
                padding-top: 15px;
                font-size: 18px;
                font-weight: bold;
                color: #28a745;
              }
              
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
              }
              .status-processing { background: #e3f2fd; color: #1976d2; }
              .status-packing { background: #fff3e0; color: #f57c00; }
              .status-shipped { background: #f3e5f5; color: #7b1fa2; }
              .status-delivered { background: #e8f5e8; color: #2e7d32; }
              
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #eee;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
              
              .company-info {
                background: #667eea;
                color: white;
                padding: 15px;
                margin-top: 20px;
                border-radius: 6px;
                text-align: center;
              }
              
              @media print {
                .invoice-container { border: none; border-radius: 0; }
                .header { break-inside: avoid; }
                .section { break-inside: avoid; }
                .items-table { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="header">
                <h1>🎁 GIFT COMMERCE</h1>
                <h2>INVOICE</h2>
                <p>Order Reference: ${order.referenceCode} | Invoice Date: ${new Date().toLocaleDateString()}</p>
              </div>

              <div class="content">
                <div class="section">
                  <div class="section-title">📋 Order Information</div>
                  <div class="info-grid">
                    <div>
                      <div class="info-item"><span class="label">Order ID:</span> <span class="value">${order.orderId}</span></div>
                      <div class="info-item"><span class="label">Order Date:</span> <span class="value">${new Date(order.orderDate).toLocaleDateString()} ${new Date(order.orderDate).toLocaleTimeString()}</span></div>
                      <div class="info-item"><span class="label">Order Source:</span> <span class="value">${order.orderSource?.replace('_', ' ').toUpperCase() || 'WEB'}</span></div>
                      <div class="info-item"><span class="label">Payment Method:</span> <span class="value">${order.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}</span></div>
                    </div>
                    <div>
                      <div class="info-item"><span class="label">Status:</span> <span class="status-badge status-${order.status}">${order.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}</span></div>
                      <div class="info-item"><span class="label">Priority:</span> <span class="value">${order.priority?.toUpperCase() || 'NORMAL'}</span></div>
                      <div class="info-item"><span class="label">Estimated Delivery:</span> <span class="value">${order.estimatedTime || '2-3 days'}</span></div>
                      <div class="info-item"><span class="label">Shipping Method:</span> <span class="value">${order.shippingMethod?.replace('_', ' ').toUpperCase() || 'STANDARD'}</span></div>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">� Customer Information</div>
                  <div class="info-grid">
                    <div>
                      <div class="info-item"><span class="label">Name:</span> <span class="value">${order.customerName}</span></div>
                      <div class="info-item"><span class="label">Phone:</span> <span class="value">${order.customerPhone}</span></div>
                      <div class="info-item"><span class="label">Email:</span> <span class="value">${order.customerEmail}</span></div>
                    </div>
                    <div>
                      <div class="info-item"><span class="label">Delivery Address:</span><br><span class="value">${order.address}</span></div>
                      <div class="info-item"><span class="label">Billing Address:</span><br><span class="value">${order.billingAddress}</span></div>
                    </div>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">📦 Order Items (${order.items.length} Products, ${totalItems} Total Items)</div>
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th style="width: 40%">Item Name</th>
                        <th style="width: 15%">SKU</th>
                        <th style="width: 15%">Category</th>
                        <th style="width: 10%">Qty</th>
                        <th style="width: 10%">Unit Price</th>
                        <th style="width: 10%">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${order.items.map((item) => `
                        <tr>
                          <td><strong>${item.name}</strong></td>
                          <td>${item.sku}</td>
                          <td>${item.category}</td>
                          <td style="text-align: center">${item.quantity}</td>
                          <td style="text-align: right">$${item.price.toFixed(2)}</td>
                          <td style="text-align: right"><strong>$${(item.price * item.quantity).toFixed(2)}</strong></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>

                <div class="section">
                  <div class="section-title">💰 Payment Summary</div>
                  <div class="payment-summary">
                    <div class="payment-row">
                      <span>Subtotal (${totalItems} items):</span>
                      <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="payment-row">
                      <span>Shipping & Handling:</span>
                      <span>$0.00</span>
                    </div>
                    <div class="payment-row">
                      <span>Tax:</span>
                      <span>$0.00</span>
                    </div>
                    <div class="payment-row total">
                      <span>TOTAL AMOUNT:</span>
                      <span>$${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                      <div class="payment-row">
                        <span>Payment Status:</span>
                        <span style="color: #28a745; font-weight: bold;">✅ PAID ONLINE</span>
                      </div>
                    </div>
                  </div>
                </div>

                ${order.isGift ? `
                  <div class="section">
                    <div class="section-title">🎁 Gift Information</div>
                    <div class="info-item"><span class="label">Gift Order:</span> <span class="value">Yes ✅</span></div>
                    <div class="info-item"><span class="label">Gift Wrap:</span> <span class="value">${order.giftWrap ? 'Yes ✅' : 'No ❌'}</span></div>
                    ${order.giftMessage ? `<div class="info-item"><span class="label">Gift Message:</span><br><span class="value">"${order.giftMessage}"</span></div>` : ''}
                  </div>
                ` : ''}

                <div class="footer">
                  <div class="company-info">
                    <strong>🏢 Gift Commerce Admin System</strong><br>
                    Professional Order Management & Invoice Generation<br>
                    📊 Total Weight: ${totalWeight.toFixed(1)} lbs | 📅 Printed: ${new Date().toLocaleString()}
                  </div>
                  <p style="margin-top: 15px;">
                    This is a computer-generated invoice. No signature required.<br>
                    For any queries, please contact our customer service team.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250); // Small delay to ensure content loads
    }
  };

  const confirmPacked = async (orderId) => {
    try {
      console.log("Marking order as shipped:", orderId);
      setButtonLoading(orderId, 'shipped', true);

      const response = await axios.put(
        `${API_BASE_URL}/orders/update-to-shipped`,
        { orderId },
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log(`Order ${orderId} status updated to Shipped`);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: "shipped" } : order
          )
        );
      } else {
        console.error(`Failed to update order status: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error updating order status. Please try again.");
      }
    } finally {
      setButtonLoading(orderId, 'shipped', false);
    }
  };

  const markAsDelivered = async (orderId) => {
    try {
      console.log("Marking order as delivered:", orderId);
      setButtonLoading(orderId, 'delivered', true);

      const response = await axios.put(
        `${API_BASE_URL}/orders/update-to-delivered`,
        { orderId },
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log(`Order ${orderId} status updated to Delivered`);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: "delivered" } : order
          )
        );
      } else {
        console.error(`Failed to update order status: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setButtonLoading(orderId, 'delivered', false);
    }
  };

  // Updated Export CSV functionality to work only with filtered data on the 'All' tab
  const exportToCSV = () => {
    if (activeTab !== "all") {
      return;
    }

    const headers = [
      "Order ID", "Customer Name", "Status", "Total Amount", "Order Date", "Tax Amount", "VAT (20%)", "Net Amount"
    ];

    const rows = filteredOrders.map((order) => {
      const vatRate = 0.2; // UK VAT rate
      const taxAmount = order.totalAmount * vatRate;
      const netAmount = order.totalAmount - taxAmount;

      return [
        order.orderId,
        order.customerName,
        order.status,
        order.totalAmount.toFixed(2),
        new Date(order.orderDate).toLocaleDateString(),
        taxAmount.toFixed(2),
        (vatRate * 100).toFixed(2) + "%",
        netAmount.toFixed(2),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "filtered_orders_with_tax.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/all`, {
        withCredentials: true
      });
      const ordersData = response.data.orders.map((order) => ({
        id: order._id,
        ...order,
      }));
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching all orders:", error);
    }
  };

  // New optimized print function for shipping labels (supports all order types)
  const printAllVisibleOrdersAsShippingLabels = (ordersToPrint) => {
    if (!ordersToPrint || ordersToPrint.length === 0) {
      alert('No orders to print');
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const getOrderTypeIcon = (orderType) => {
      switch (orderType) {
        case 'surprise': return '🎉 SURPRISE GIFT';
        case 'collaborative': return '🤝 COLLABORATIVE GIFT';
        default: return '📦 REGULAR ORDER';
      }
    };

    const getOrderTypeColor = (orderType) => {
      switch (orderType) {
        case 'surprise': return '#ff6b6b';
        case 'collaborative': return '#4ecdc4';
        default: return '#6b46c1';
      }
    };

    const ordersHtml = ordersToPrint.map((order, index) => `
      <div class="shipping-label" ${index > 0 ? 'style="page-break-before: always;"' : ''}>
        <div class="header">
          <h1>🎁 GIFT COMMERCE</h1>
          <h2>SHIPPING LABEL</h2>
          <div class="order-type" style="background-color: ${getOrderTypeColor(order.orderType)};">
            ${getOrderTypeIcon(order.orderType)}
          </div>
          <p>Order #${order.referenceCode || order._id}</p>
        </div>

        <div class="shipping-info">
          <div class="from-address">
            <h3>📦 FROM:</h3>
            <div class="address-box">
              <strong>Gift Commerce</strong><br>
              123 Business Street<br>
              City, State 12345<br>
              Phone: (555) 123-4567
            </div>
          </div>

          <div class="to-address">
            <h3>📍 TO:</h3>
            <div class="address-box">
              <strong>${order.recipientName || order.customerName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim()}</strong><br>
              ${order.recipientPhone || order.customerPhone || order.user?.phone || 'N/A'}<br>
              ${order.shippingAddress || order.address || 'Address not provided'}
            </div>
          </div>
        </div>

        <div class="order-details">
          <div class="order-info">
            <div class="info-row">
              <span class="label">Order ID:</span>
              <span class="value">${order._id || order.id}</span>
            </div>
            <div class="info-row">
              <span class="label">Order Type:</span>
              <span class="value">${getOrderTypeIcon(order.orderType)}</span>
            </div>
            <div class="info-row">
              <span class="label">Order Date:</span>
              <span class="value">${new Date(order.createdAt || order.orderDate).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value status-badge">${(order.status || 'processing').toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Amount:</span>
              <span class="value total-amount">$${(order.total || order.totalAmount || 0).toFixed(2)}</span>
            </div>
            ${order.orderType === 'collaborative' ? `
              <div class="info-row">
                <span class="label">Participants:</span>
                <span class="value">${order.participants?.length || 0} people</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="items-section">
          <h3>📋 ITEMS (${order.items?.length || 0} products)</h3>
          <div class="items-list">
            ${(order.items || []).map(item => `
              <div class="item-row">
                <div class="item-name">${item.name || item.productName || 'Unknown Product'}</div>
                <div class="item-details">
                  <span>Qty: ${item.quantity || 1}</span>
                  <span>Price: $${(item.price || item.productPrice || 0).toFixed(2)}</span>
                  <span>Total: $${((item.price || item.productPrice || 0) * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="notes-section">
          ${order.notes ? `<div class="notes"><strong>Notes:</strong> ${order.notes}</div>` : ''}
          ${order.orderType === 'surprise' ? '<div class="gift-indicator surprise-gift">🎉 SURPRISE GIFT ORDER</div>' : ''}
          ${order.orderType === 'collaborative' ? '<div class="gift-indicator collaborative-gift">🤝 COLLABORATIVE GIFT ORDER</div>' : ''}
          ${order.orderType === 'regular' && order.isGift ? '<div class="gift-indicator">🎁 GIFT ORDER</div>' : ''}
        </div>

        <div class="barcode-section">
          <div class="barcode-placeholder">|||| |||| |||| ||||</div>
          <p>Tracking: ${order.trackingNumber || 'TRK' + (order._id || order.id).slice(-8).toUpperCase()}</p>
        </div>

        <div class="print-info">
          <p>Printed on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Labels - ${ordersToPrint.length} Orders</title>
          <style>
            @page { 
              margin: 0.3in; 
              size: A4; 
            }
            
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 0; 
              background: white;
              color: #000;
            }
            
            .shipping-label {
              width: 100%;
              min-height: 11in;
              padding: 20px;
              margin-bottom: 20px;
              border: 2px solid #000;
              box-sizing: border-box;
            }
            
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
              position: relative;
            }
            
            .header h1 {
              font-size: 24px;
              margin: 0 0 5px 0;
              font-weight: bold;
            }
            
            .header h2 {
              font-size: 18px;
              margin: 0 0 10px 0;
              color: #666;
            }
            
            .order-type {
              display: inline-block;
              color: white;
              padding: 6px 12px;
              border-radius: 15px;
              font-size: 12px;
              font-weight: bold;
              margin: 5px 0;
            }
            
            .header p {
              font-size: 14px;
              margin: 0;
              font-weight: bold;
            }
            
            .shipping-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
            }
            
            .from-address, .to-address {
              width: 48%;
            }
            
            .from-address h3, .to-address h3 {
              font-size: 14px;
              margin: 0 0 8px 0;
              color: #333;
              border-bottom: 1px solid #ccc;
              padding-bottom: 3px;
            }
            
            .address-box {
              border: 1px solid #000;
              padding: 12px;
              min-height: 80px;
              background: #f9f9f9;
              font-size: 13px;
              line-height: 1.4;
            }
            
            .order-details {
              margin-bottom: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 15px;
              background: #f8f9fa;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 5px 0;
              border-bottom: 1px dotted #ccc;
            }
            
            .info-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            
            .label {
              font-weight: bold;
              color: #333;
            }
            
            .value {
              color: #000;
            }
            
            .status-badge {
              background: #e3f2fd;
              color: #1976d2;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
            }
            
            .total-amount {
              font-weight: bold;
              font-size: 16px;
              color: #d32f2f;
            }
            
            .items-section {
              margin-bottom: 20px;
            }
            
            .items-section h3 {
              font-size: 16px;
              margin: 0 0 10px 0;
              color: #333;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
            }
            
            .items-list {
              border: 1px solid #ddd;
              border-radius: 5px;
              overflow: hidden;
            }
            
            .item-row {
              padding: 10px 12px;
              border-bottom: 1px solid #eee;
              background: white;
            }
            
            .item-row:last-child {
              border-bottom: none;
            }
            
            .item-row:nth-child(even) {
              background: #f8f9fa;
            }
            
            .item-name {
              font-weight: bold;
              margin-bottom: 5px;
              color: #333;
            }
            
            .item-details {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #666;
            }
            
            .notes-section {
              margin-bottom: 20px;
            }
            
            .notes {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 10px;
              font-size: 13px;
            }
            
            .gift-indicator {
              padding: 8px;
              border-radius: 5px;
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 10px;
            }
            
            .gift-indicator {
              background: #d1ecf1;
              border: 1px solid #bee5eb;
              color: #0c5460;
            }
            
            .surprise-gift {
              background: #ffe6e6;
              border: 1px solid #ffcccc;
              color: #cc0000;
            }
            
            .collaborative-gift {
              background: #e6f7f7;
              border: 1px solid #cceeee;
              color: #006666;
            }
            
            .barcode-section {
              text-align: center;
              margin-bottom: 15px;
              padding: 15px;
              border: 1px solid #000;
              background: white;
            }
            
            .barcode-placeholder {
              font-family: 'Courier New', monospace;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 3px;
              margin-bottom: 8px;
            }
            
            .print-info {
              text-align: center;
              font-size: 11px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 8px;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .shipping-label { 
                page-break-after: always; 
                page-break-inside: avoid; 
              }
              .shipping-label:last-child { 
                page-break-after: avoid; 
              }
            }
          </style>
        </head>
        <body>
          ${ordersHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/orders/all`, {
          withCredentials: true
        })
        console.log('API Response:', response.data);
        console.log('Orders from API:', response.data.orders);

        if (!response.data.orders || response.data.orders.length === 0) {
          console.log('No orders found in API response');
          setOrders([]);
          return;
        }

        response.data.orders.forEach((order) => {
          console.log('Order status:', order.status);
          console.log('User Object:', order.user);
        });

        const ordersData = response.data.orders.map((order) => ({
          id: order._id,
          _id: order._id,
          createdAt: order.createdAt,
          orderedAt: order.orderedAt,
          orderDate: order.orderedAt,
          status: order.status.toLowerCase(), // Convert status to lowercase to match the UI expectations
          total: order.total,
          totalAmount: order.total,
          statusHistory: order.statusHistory || [],
          user: order.user || {},
          items: order.items?.map((item, index) => ({
            id: item.product || `item-${index}`,
            product: item.product || '',
            name: item.name || 'Unknown Product',
            price: item.price || 0,
            quantity: item.quantity || 1,
            image: item.image || '/placeholder.svg',
            sku: `SKU-${typeof item.product === 'string' ? item.product.slice(-6) : `ITEM${index + 1}`}`,
            category: 'General',
            weight: '1.0 lbs',
            status: 'in_stock'
          })) || [],
          deliveryNotes: order.deliveryNotes || '',
          trackingNumber: order.trackingNumber || '',
          referenceCode: `REF-${order._id.slice(-6)}`,
          orderId: order._id,
          priority: 'normal',
          orderSource: 'web',
          customerName: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Unknown Customer',
          customerPhone: order.user?.phone || 'N/A',
          customerEmail: order.user?.email || 'N/A',
          customerNotes: '',
          packingStatus: 'not_packed',
          assignedStaff: '',
          codAmount: 0,
          paymentMethod: 'online_payment',
          isGift: false,
          giftWrap: false,
          giftMessage: '',
          address: order.user?.address || 'N/A',
          billingAddress: order.user?.address || 'N/A',
          estimatedTime: '2-3 days',
          shippingMethod: 'standard',
          specialInstructions: '',
          internalNotes: ''
        }))
        
        // Debug: Check what statuses we have
        const statusCounts = ordersData.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {});
        console.log('Order status counts:', statusCounts);
        console.log('Total orders loaded:', ordersData.length);
        console.log('Sample order:', ordersData[0]);
        
        setOrders(ordersData)
      } catch (error) {
        console.error("Error fetching all orders:", error)
      }
    }

    fetchAllOrders()
    fetchSurpriseGifts()
    fetchCollaborativeGifts()
  }, [])

  // Fetch surprise gifts
  const fetchSurpriseGifts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/surprise/all`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('Surprise gifts fetched:', data.data.length)
          setSurpriseGifts(data.data)
        } else {
          console.error('Failed to fetch surprise gifts:', data.message)
        }
      } else {
        console.error('Failed to fetch surprise gifts, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching surprise gifts:', error)
    }
  }

  // Fetch collaborative gifts
  const fetchCollaborativeGifts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/collaborative-purchases/all`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('Collaborative gifts fetched:', data.data.length)
          setCollaborativeGifts(data.data)
        } else {
          console.error('Failed to fetch collaborative gifts:', data.message)
        }
      } else {
        console.error('Failed to fetch collaborative gifts, status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching collaborative gifts:', error)
    }
  }

  // Set default 2-week filter for "All Orders" tab
  useEffect(() => {
    if (activeTab === "all" && !fromDate && !toDate) {
      const today = new Date();
      const twoWeeksAgo = new Date(today.getTime() - (14 * 24 * 60 * 60 * 1000));
      
      // Format dates for input[type="date"]
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      setFromDate(formatDate(twoWeeksAgo));
      setToDate(formatDate(today));
    }
  }, [activeTab, fromDate, toDate]);

  const printAllPackedOrders = () => {
    const packedOrders = orders.filter((order) => order.status === "packing");

    packedOrders.forEach((order) => {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Delivery Information - ${order.referenceCode}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .section { margin-bottom: 25px; }
                .label { font-weight: bold; color: #333; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Delivery Information</h1>
                <h2>Order: ${order.referenceCode}</h2>
              </div>

              <div class="section">
                <h3>Customer Information</h3>
                <p><span class="label">Name:</span> ${order.customerName}</p>
                <p><span class="label">Phone:</span> ${order.customerPhone}</p>
                <p><span class="label">Email:</span> ${order.customerEmail}</p>
              </div>

              <div class="section">
                <h3>Delivery Address</h3>
                <p>${order.address}</p>
              </div>

              <div class="section">
                <h3>Order Details</h3>
                <p><span class="label">Order Date:</span> ${new Date(order.orderDate).toLocaleDateString()}</p>
                <p><span class="label">Total Amount:</span> $${order.totalAmount}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    });
  };

  const handlePrintAll = () => {
    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        printOrderDetails(order);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        {/* Removed header content for brevity */}
      </header>

      <div className="p-6 space-y-6">
        <DashboardStats orders={allOrders} />

        {/* Enhanced Order Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-xl">Advanced Order Management System</CardTitle>
              <div className="flex gap-2">
                {(activeTab === "packed" || activeTab === "processing" || activeTab === "accepted") && (
                  <Button variant="outline" size="sm" onClick={() => printAllVisibleOrdersAsShippingLabels(filteredOrders)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print All ({filteredOrders.length})
                  </Button>
                )}
                {activeTab === "all" && (
                  <Button variant="outline" size="sm" onClick={() => printAllVisibleOrdersAsShippingLabels(filteredOrders)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print All Filtered ({filteredOrders.length})
                  </Button>
                )}
                {activeTab === "all" && (
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {activeTab === "all" && (
              <OrderSearchFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                fromDate={fromDate}
                setFromDate={setFromDate}
                toDate={toDate}
                setToDate={setToDate}
              />
            )}

            {/* Enhanced Order Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-4 gap-x-2 w-full px-2 py-1 bg-gray-50 rounded-md border-2 border-gray-400">
                <TabsTrigger value="accepted" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Processing</TabsTrigger>
                <TabsTrigger value="packed" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Packing</TabsTrigger>
                <TabsTrigger value="delivery" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Ready for Delivery</TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white">All Orders</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab}>
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
                      {filteredOrders.map((order, index) => (
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
                                  <Badge variant="outline" className={priorityColors[order.priority || 'normal']}>
                                    {order.priority || 'normal'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {order.orderSource || 'online'}
                                  </Badge>
                                  {order.orderType === 'surprise' && (
                                    <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                      🎉 Surprise
                                    </Badge>
                                  )}
                                  {order.orderType === 'collaborative' && (
                                    <Badge variant="outline" className="text-xs bg-teal-50 text-teal-600 border-teal-200">
                                      🤝 Collaborative
                                    </Badge>
                                  )}
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
                                <div className="font-medium text-lg">${order.totalAmount}</div>
                                {order.codAmount > 0 && (
                                  <div className="text-xs text-orange-600 font-medium">💵 COD: ${order.codAmount}</div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  {order.paymentMethod?.replace("_", " ") || "N/A"}
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
                              <Dialog>
                                <OrderActions
                                  order={order}
                                  onRejectOrder={null} // Disable reject functionality
                                  onPackingComplete={null} // Disable packing complete functionality
                                  onPrintShippingLabel={printAllVisibleOrdersAsShippingLabels} // Use new shipping label function
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="hover:bg-gray-50"
                                      onClick={() => setSelectedOrder(order)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                </OrderActions>

                                {/* Ensure `selectedOrder` is valid before rendering the dialog */}
                                {selectedOrder ? (
                                  <OrderDetailsDialog
                                    order={selectedOrder}
                                    isOpen={!!selectedOrder}
                                    onClose={() => setSelectedOrder(null)}
                                    onRejectOrder={null} // Disable reject functionality
                                    onPackingComplete={null} // Disable packing complete functionality
                                    onPrintShippingLabel={printAllVisibleOrdersAsShippingLabels} // Use new shipping label function
                                    onUpdateQuantity={null} // Disable update quantity functionality
                                    onRemoveItem={null} // Disable remove item functionality
                                    onSaveInternalNotes={null} // Disable save internal notes functionality
                                    internalNotes={null} // Remove internal notes
                                    setInternalNotes={null} // Remove internal notes setter
                                  />
                                ) : null}
                              </Dialog>

                              {/* Show Accept Order button for pending orders */}
                              {order.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="ml-2 bg-green-600 hover:bg-green-700"
                                  disabled={loadingStates[`${order.id}-accept`]}
                                  onClick={() => acceptOrder(order.id)}
                                >
                                  {loadingStates[`${order.id}-accept`] ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    "Accept Order"
                                  )}
                                </Button>
                              )}

                              {/* Show Start Packing button for processing orders */}
                              {order.status === "processing" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                                  disabled={loadingStates[`${order.id}-packing`]}
                                  onClick={() => updateOrderToPacking(order.id)}
                                >
                                  {loadingStates[`${order.id}-packing`] ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    "Start Packing"
                                  )}
                                </Button>
                              )}

                              {/* Show Mark as Shipped button for packing orders */}
                              {order.status === "packing" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                                  disabled={loadingStates[`${order.id}-shipped`]}
                                  onClick={() => confirmPacked(order.id)}
                                >
                                  {loadingStates[`${order.id}-shipped`] ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    "Mark as Shipped"
                                  )}
                                </Button>
                              )}

                              {/* Show Mark as Delivered button for shipped orders */}
                              {order.status === "shipped" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="ml-2 border-purple-600 text-purple-600 hover:bg-purple-50"
                                  disabled={loadingStates[`${order.id}-delivered`]}
                                  onClick={() => markAsDelivered(order.id)}
                                >
                                  {loadingStates[`${order.id}-delivered`] ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    "Mark as Delivered"
                                  )}
                                </Button>
                              )}

                              {/* Show completion status for delivered orders */}
                              {order.status === "delivered" && (
                                <Badge className="ml-2 bg-green-100 text-green-800">
                                  ✅ Completed
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                          <ExpandableProductRow order={order} isExpanded={expandedOrders.includes(order.id)} />
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
