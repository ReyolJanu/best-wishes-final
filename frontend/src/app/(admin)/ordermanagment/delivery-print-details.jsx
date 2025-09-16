"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Separator } from "../../../components/ui/separator"
import { Printer, Package, MapPin, Phone, Mail, User, Truck, Clock, CreditCard, FileText } from "lucide-react"

export function DeliveryPrintDetails({ order, onPrint }) {
  const handlePrint = () => {
    // Create a new window for printing
       const printWindow = window.open("", "_blank");
    const printContent = generatePrintContent(order);

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    if (onPrint) onPrint();
  };


  const generatePrintContent = (order) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Invoice - Order #${order.id}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.4;
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb;
              margin-bottom: 5px;
            }
            .invoice-title { 
              font-size: 18px; 
              color: #666; 
            }
            .order-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 30px;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
            }
            .section { 
              margin-bottom: 25px; 
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #2563eb;
              border-bottom: 1px solid #ddd; 
              padding-bottom: 5px; 
              margin-bottom: 15px;
            }
            .two-column { 
              display: flex; 
              gap: 30px; 
            }
            .column { 
              flex: 1; 
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px;
              padding: 5px 0;
            }
            .info-label { 
              font-weight: bold; 
              color: #555;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            .items-table th, .items-table td { 
              border: 1px solid #ddd; 
              padding: 10px; 
              text-align: left;
            }
            .items-table th { 
              background-color: #f8f9fa; 
              font-weight: bold;
            }
            .total-section { 
              text-align: right; 
              margin-top: 20px;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px;
              padding: 3px 0;
            }
            .grand-total { 
              font-size: 18px; 
              font-weight: bold; 
              border-top: 2px solid #333; 
              padding-top: 10px; 
              margin-top: 10px;
            }
            .status-badge { 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 12px; 
              font-weight: bold;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-processing { background: #dbeafe; color: #1e40af; }
            .status-completed { background: #d1fae5; color: #065f46; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            .delivery-instructions {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              border-top: 1px solid #333;
              width: 200px;
              text-align: center;
              padding-top: 5px;
            }
            ../../..media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Your Company Name</div>
            <div class="invoice-title">DELIVERY INVOICE</div>
          </div>

          <div class="order-info">
            <div>
              <div class="info-row">
                <span class="info-label">Order ID:</span>
                <span>#${order.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Order Date:</span>
                <span>${order.date} ${order.time}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
              </div>
            </div>
            <div>
              <div class="info-row">
                <span class="info-label">Payment Status:</span>
                <span>${order.paymentStatus}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span>${order.paymentMethod}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Shipping Method:</span>
                <span>${order.shippingMethod}</span>
              </div>
            </div>
          </div>

          <div class="two-column">
            <div class="column">
              <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span>${order.customerName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span>${order.customerEmail}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span>${order.customerPhone}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Billing Address</div>
                <div>${order.customerName}</div>
                <div>${order.billingAddress.street}</div>
                <div>${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.zip}</div>
                <div>${order.billingAddress.country}</div>
              </div>
            </div>

            <div class="column">
              <div class="section">
                <div class="section-title">Delivery Information</div>
                ${
                  order.trackingNumber
                    ? `
                <div class="info-row">
                  <span class="info-label">Tracking Number:</span>
                  <span>${order.trackingNumber}</span>
                </div>
                `
                    : ""
                }
                <div class="info-row">
                  <span class="info-label">Delivery Method:</span>
                  <span>${order.shippingMethod}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Delivery Address</div>
                <div>${order.customerName}</div>
                <div>${order.shippingAddress.street}</div>
                <div>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</div>
                <div>${order.shippingAddress.country}</div>
                <div style="margin-top: 10px;"><strong>Phone:</strong> ${order.customerPhone}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Variant</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.variant}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Shipping:</span>
              <span>$${order.shipping.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span>$${order.tax.toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
          </div>

          ${
            order.internalNotes
              ? `
          <div class="delivery-instructions">
            <div class="section-title">Special Instructions</div>
            <div>${order.internalNotes}</div>
          </div>
          `
              : ""
          }

          <div class="signature-section">
            <div class="signature-box">
              <div>Customer Signature</div>
            </div>
            <div class="signature-box">
              <div>Delivery Person</div>
            </div>
            <div class="signature-box">
              <div>Date & Time</div>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            Thank you for your business! For any queries, contact us at support../../..yourcompany.com
          </div>
        </body>
      </html>
    `
  }

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-amber-100 text-amber-800",
      Processing: "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Delivery & Print Details
          </CardTitle>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary Header */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold">Order #{order.id}</p>
                <p className="text-sm text-muted-foreground">
                  {order.date} at {order.time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </div>
              <div className="text-sm">
                <p className="font-medium">${order.total.toFixed(2)}</p>
                <p className="text-muted-foreground">{order.paymentStatus}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">{order.shippingMethod}</p>
                {order.trackingNumber && (
                  <p className="text-sm text-muted-foreground font-mono">{order.trackingNumber}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer & Contact Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.customerPhone}</p>
                    <p className="text-sm text-muted-foreground">Primary Contact</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.customerEmail}</p>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payment Method:</span>
                  <span className="text-sm">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payment Status:</span>
                  <Badge
                    variant={
                      order.paymentStatus === "Paid"
                        ? "secondary"
                        : order.paymentStatus === "Unpaid"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Information */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm">{order.shippingAddress.street}</p>
                  <p className="text-sm">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                  </p>
                  <p className="text-sm">{order.shippingAddress.country}</p>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{order.customerPhone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Shipping Method:</span>
                  <Badge variant="outline">{order.shippingMethod}</Badge>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tracking Number:</span>
                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{order.trackingNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Delivery Status:</span>
                  <Badge variant={order.status === "Completed" ? "secondary" : "outline"}>
                    {order.status === "Completed" ? "Delivered" : "Pending Delivery"}
                  </Badge>
                </div>
                {order.internalNotes && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 mb-1">Special Instructions:</p>
                    <p className="text-sm text-amber-700">{order.internalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Variant: {item.variant} • Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.price.toFixed(2)} each</p>
                    <p className="text-sm text-muted-foreground">Total: ${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Order Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Order Placed</p>
                  <p className="text-xs text-muted-foreground">
                    {order.date} at {order.time}
                  </p>
                </div>
              </div>

              {order.status !== "Pending" && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Status Updated to {order.status}</p>
                    <p className="text-xs text-muted-foreground">Processing started</p>
                  </div>
                </div>
              )}

              {order.trackingNumber && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Tracking Number Generated</p>
                    <p className="text-xs text-muted-foreground">Package ready for shipment</p>
                  </div>
                </div>
              )}

              {order.status === "Completed" && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Order Delivered</p>
                    <p className="text-xs text-muted-foreground">Successfully completed</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
