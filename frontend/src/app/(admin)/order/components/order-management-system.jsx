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
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("pending")
  const [expandedOrders, setExpandedOrders] = useState([])
  const [internalNotes, setInternalNotes] = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)

  const filteredOrders = orders.filter((order) => {
    if (!order || !order.user || !order.items) return false

    const matchesSearch =
      (order.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some((item) => item.name?.toLowerCase().includes(searchTerm.toLowerCase()))) ?? false

    const matchesTab =
      (activeTab === "pending" && order.status === "pending") ||
      (activeTab === "accepted" && order.status === "processing") ||
      (activeTab === "packed" && order.status === "packing") ||
      (activeTab === "delivery" && order.status === "shipped") ||
      (activeTab === "all") // Show ALL orders regardless of status in All tab

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
  console.log('Total orders:', orders.length);
  console.log('Filtered orders:', filteredOrders.length);
  console.log('Orders by status:', orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {}));

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    )
  }

  const confirmAction = (message, action) => {
    if (window.confirm(message)) {
      action();
    }
  };

  const testProductsEndpoint = async () => {
    try {
      console.log("Testing products endpoint...");
      const response = await axios.get(`${API_BASE_URL}/products/test`);
      console.log("Products test response:", response.data);
      alert(`Products test: ${response.data.message}\nTotal products: ${response.data.totalProducts}`);
    } catch (error) {
      console.error("Error testing products endpoint:", error);
      alert(`Error testing products: ${error.message}`);
    }
  };

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
        alert("Warning: No valid product IDs found. Stock reduction skipped.");
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
        alert(`Failed to update stock: ${response.data.message}`);
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
        alert(`Insufficient stock for:\n${itemsList}`);
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err).join('\n');
        alert(`Validation errors:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error updating product stock. Please try again.");
      }
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      console.log("Order ID being sent:", orderId); // Debugging log

      const button = document.querySelector(`#accept-order-button-${orderId}`);
      if (button) {
        button.disabled = true;
        button.textContent = "Processing...";
      }

      // Accept the order (Pending -> Processing)
      const acceptResponse = await axios.put(
        `${API_BASE_URL}/orders/accept`,
        {
          orderId: orderId,
        },
        {
          withCredentials: true
        }
      );

      if (acceptResponse.data.success) {
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

        alert(`Order ${orderId} has been accepted and moved to processing!`);
      } else {
        console.error(`Failed to accept order: ${acceptResponse.data.message}`);
        alert(`Failed to accept order: ${acceptResponse.data.message}`);
      }
    } catch (error) {
      console.error("Error processing order:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error processing order. Please try again.");
      }
    } finally {
      const button = document.querySelector(`#accept-order-button-${orderId}`);
      if (button) {
        button.disabled = false;
        button.textContent = "Accept Order";
      }
    }
  }

  const updateOrderToPacking = async (orderId) => {
    try {
      console.log("Moving order to packing:", orderId);

      const button = document.querySelector(`#move-to-packing-button-${orderId}`);
      if (button) {
        button.disabled = true;
        button.textContent = "Processing...";
      }

      const response = await axios.put(
        `${API_BASE_URL}/orders/update-to-packing`,
        {
          orderId: orderId,
        },
        {
          withCredentials: true
        }
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

        alert(`Order ${orderId} has been moved to packing!`);
      } else {
        console.error(`Failed to update order to packing: ${response.data.message}`);
        alert(`Failed to update order to packing: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error updating order to packing:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error updating order to packing. Please try again.");
      }
    } finally {
      const button = document.querySelector(`#move-to-packing-button-${orderId}`);
      if (button) {
        button.disabled = false;
        button.textContent = "Move to Packing";
      }
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

  const printCustomerDetails = (order) => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Customer Details - ${order.referenceCode}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .section { margin-bottom: 25px; }
              .label { font-weight: bold; color: #333; }
              .items { border-collapse: collapse; width: 100%; margin-top: 10px; }
              .items th, .items td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              .items th { background-color: #f8f9fa; font-weight: bold; }
              .priority-high { color: #dc3545; font-weight: bold; }
              .priority-normal { color: #6c757d; }
              .priority-low { color: #28a745; }
              .cod-amount { background: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; border-radius: 5px; margin: 10px 0; }
              .instructions { background: #e7f3ff; padding: 10px; border-left: 4px solid #007bff; margin: 10px 0; }
              .total-summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎁 Gift Commerce - Customer Details</h1>
              <h2>Order: ${order.referenceCode}</h2>
              <p>Order ID: ${order.orderId}</p>
            </div>
            
            <div class="section">
              <h3>📋 Order Information</h3>
              <p><span class="label">Order Date:</span> ${new Date(order.orderDate).toLocaleString()}</p>
              <p><span class="label">Status:</span> ${order.status.replace("_", " ").toUpperCase()}</p>
              <p><span class="label">Priority:</span> <span class="priority-${order.priority}">${order.priority.toUpperCase()}</span></p>
              <p><span class="label">Packing Status:</span> ${order.packingStatus.replace("_", " ").toUpperCase()}</p>
              <p><span class="label">Order Source:</span> ${order.orderSource.replace("_", " ").toUpperCase()}</p>
              <p><span class="label">Payment Method:</span> ${order.paymentMethod.replace("_", " ").toUpperCase()}</p>
              ${order.assignedStaff ? `<p><span class="label">Assigned Staff:</span> ${order.assignedStaff}</p>` : ""}
              ${order.trackingNumber ? `<p><span class="label">Tracking Number:</span> ${order.trackingNumber}</p>` : ""}
            </div>
            
            <div class="section">
              <h3>👤 Customer Information</h3>
              <p><span class="label">Name:</span> ${order.customerName}</p>
              <p><span class="label">Phone:</span> ${order.customerPhone}</p>
              <p><span class="label">Email:</span> ${order.customerEmail}</p>
              ${order.user?.address ? `<p><span class="label">Address:</span> ${order.user.address}</p>` : ""}
              ${order.customerNotes ? `<p><span class="label">Customer Notes:</span> ${order.customerNotes}</p>` : ""}
            </div>
            
            <div class="section">
              <h3>📍 Delivery Information</h3>
              <p><span class="label">Delivery Address:</span><br>${order.address}</p>
              <p><span class="label">Billing Address:</span><br>${order.billingAddress}</p>
              <p><span class="label">Estimated Time:</span> ${order.estimatedTime}</p>
              <p><span class="label">Shipping Method:</span> ${order.shippingMethod.replace("_", " ").toUpperCase()}</p>
              ${order.specialInstructions ? `<div class="instructions"><strong>⚠️ Special Instructions:</strong><br>${order.specialInstructions}</div>` : ""}
            </div>
            
            <div class="section">
              <h3>📦 Order Items (${order.items.length} items)</h3>
              <table class="items">
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.sku}</td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price}</td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </table>
            </div>
            
            <div class="section">
              <h3>💰 Payment Summary</h3>
              <div class="total-summary">
                <p><span class="label">Subtotal:</span> $${order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</p>
                <p><span class="label">Total Amount:</span> <strong>$${order.totalAmount}</strong></p>
                ${order.codAmount > 0 ? `<div class="cod-amount"><strong>💵 COD Amount:</strong> $${order.codAmount}<br><em>Collect cash on delivery</em></div>` : "<p><span class='label'>Payment Status:</span> Paid Online ✅</p>"}
              </div>
            </div>
            
            ${
              order.isGift
                ? `
              <div class="section">
                <h3>🎁 Gift Details</h3>
                <p><span class="label">Gift Order:</span> Yes ✅</p>
                <p><span class="label">Gift Wrap:</span> ${order.giftWrap ? "Yes ✅" : "No ❌"}</p>
                ${order.giftMessage ? `<div class="gift-message"><strong>💌 Gift Message:</strong><br>${order.giftMessage}</div>` : ""}
              </div>
            `
                : `
              <div class="section">
                <h3>📦 Regular Order</h3>
                <p>This is a regular order (not a gift)</p>
              </div>
            `
            }
            
            ${
              order.internalNotes
                ? `
            <div class="section">
              <h3>📝 Internal Notes</h3>
              <div class="instructions">${order.internalNotes}</div>
            </div>
            `
                : ""
            }
            
            <div class="section" style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
              <p><strong>📅 Printed on:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>🏢 Gift Commerce Admin System</strong></p>
              <p><strong>📊 Total Items:</strong> ${order.items.reduce((sum, item) => sum + item.quantity, 0)} pieces</p>
              <p><strong>⚖️ Total Weight:</strong> ${order.items.reduce((sum, item) => sum + Number.parseFloat(item.weight?.replace(' lbs', '') || '0'), 0).toFixed(1)} lbs</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const printAllOrdersSequentially = async (orders) => {
    if (!orders || orders.length === 0) {
      alert("No orders available to print.");
      return;
    }

    // Show confirmation with order count
    const confirmed = window.confirm(
      `Are you sure you want to print ${orders.length} orders? Each order will be printed separately.`
    );
    
    if (!confirmed) return;

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
      alert(`Successfully initiated printing for ${orders.length} orders. Please check your printer queue.`);
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
                      <div class="info-item"><span class="label">Order Source:</span> <span class="value">${order.orderSource.replace('_', ' ').toUpperCase()}</span></div>
                      <div class="info-item"><span class="label">Payment Method:</span> <span class="value">${order.paymentMethod.replace('_', ' ').toUpperCase()}</span></div>
                    </div>
                    <div>
                      <div class="info-item"><span class="label">Status:</span> <span class="status-badge status-${order.status}">${order.status.replace('_', ' ').toUpperCase()}</span></div>
                      <div class="info-item"><span class="label">Priority:</span> <span class="value">${order.priority.toUpperCase()}</span></div>
                      <div class="info-item"><span class="label">Estimated Delivery:</span> <span class="value">${order.estimatedTime}</span></div>
                      <div class="info-item"><span class="label">Shipping Method:</span> <span class="value">${order.shippingMethod.replace('_', ' ').toUpperCase()}</span></div>
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

  const updateButtonState = (buttonId, isProcessing, defaultText) => {
    const button = document.querySelector(buttonId);
    if (button) {
      button.disabled = isProcessing;
      button.textContent = isProcessing ? "Processing..." : defaultText;
    }
  };

  const confirmPacked = async (orderId) => {
    const buttonId = `#confirm-packed-button-${orderId}`;
    updateButtonState(buttonId, true, "Mark as Shipped");

    try {
      console.log("Marking order as shipped:", orderId);

      const response = await axios.put(
        `${API_BASE_URL}/orders/update-to-shipped`,
        {
          orderId,
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        console.log(`Order ${orderId} status updated to Shipped`);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: "shipped" } : order
          )
        );

        alert(`Order ${orderId} has been marked as shipped and is ready for delivery!`);
      } else {
        console.error(`Failed to update order status: ${response.data.message}`);
        alert(`Failed to update order status: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error updating order status. Please try again.");
      }
    } finally {
      updateButtonState(buttonId, false, "Mark as Shipped");
    }
  };

  const markAsDelivered = async (orderId) => {
    const buttonId = `#mark-as-delivered-button-${orderId}`;
    updateButtonState(buttonId, true, "Mark as Delivered");

    try {
      console.log("Marking order as delivered:", orderId);

      const response = await axios.put(
        `${API_BASE_URL}/orders/update-to-delivered`,
        {
          orderId,
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        console.log(`Order ${orderId} status updated to Delivered`);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: "delivered" } : order
          )
        );

        alert(`Order ${orderId} has been marked as delivered!`);
      } else {
        console.error(`Failed to update order status: ${response.data.message}`);
        alert(`Failed to update order status: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error updating order status. Please try again.");
      }
    } finally {
      updateButtonState(buttonId, false, "Mark as Delivered");
    }
  };

  // Updated Export CSV functionality to work only with filtered data on the 'All' tab
  const exportToCSV = () => {
    if (activeTab !== "all") {
      alert("Export CSV is only available on the 'All' tab.");
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
  }, [])

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
    } else {
      alert("No orders available to print.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        {/* Removed header content for brevity */}
      </header>

      <div className="p-6 space-y-6">
        <DashboardStats orders={orders} />

        {/* Enhanced Order Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-xl">Advanced Order Management System</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={testProductsEndpoint}>
                  Test Products API
                </Button>
                {activeTab === "packed" && (
                  <Button variant="outline" size="sm" onClick={printAllPackedOrders}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print All Packed
                  </Button>
                )}
                {activeTab === "all" && (
                  <Button variant="outline" size="sm" onClick={() => printAllOrdersSequentially(filteredOrders)}>
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
              <TabsList className="grid grid-cols-5 gap-x-2 w-full px-2 py-1 bg-gray-50 rounded-md border-2 border-gray-400">
                <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">Pending Orders</TabsTrigger>
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
                                  <Badge variant="outline" className={priorityColors[order.priority]}>
                                    {order.priority}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {order.orderSource}
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
                              <Dialog>
                                <OrderActions
                                  order={order}
                                  onRejectOrder={null} // Disable reject functionality
                                  onPackingComplete={null} // Disable packing complete functionality
                                  onPrintCustomerDetails={printCustomerDetails} // Keep print functionality
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
                                    onPrintCustomerDetails={printCustomerDetails} // Keep print functionality
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
                                  onClick={() => confirmAction("Accept this order and start processing?", () => acceptOrder(order.id))}
                                  className="ml-2 bg-green-600 hover:bg-green-700"
                                  id={`accept-order-button-${order.id}`}
                                >
                                  Accept Order
                                </Button>
                              )}

                              {/* Show Move to Packing button for processing orders */}
                              {order.status === "processing" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => confirmAction("Move this order to packing?", () => updateOrderToPacking(order.id))}
                                  className="ml-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                                  id={`move-to-packing-button-${order.id}`}
                                >
                                  Start Packing
                                </Button>
                              )}

                              {/* Show Mark as Shipped button for packing orders */}
                              {order.status === "packing" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => confirmAction("Mark this order as shipped?", () => confirmPacked(order.id))}
                                  className="ml-2 border-orange-600 text-orange-600 hover:bg-orange-50"
                                  id={`confirm-packed-button-${order.id}`}
                                >
                                  Mark as Shipped
                                </Button>
                              )}

                              {/* Show Mark as Delivered button for shipped orders */}
                              {order.status === "shipped" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => confirmAction("Mark this order as delivered?", () => markAsDelivered(order.id))}
                                  className="ml-2 border-purple-600 text-purple-600 hover:bg-purple-50"
                                  id={`mark-as-delivered-button-${order.id}`}
                                >
                                  Mark as Delivered
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
