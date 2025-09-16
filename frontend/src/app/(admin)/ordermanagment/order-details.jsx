"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Separator } from "../../../components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog"
import { Printer, Save, X, Package, User, CreditCard, MapPin, Phone, Mail, Calendar } from "lucide-react"
import { DeliveryPrintDetails } from "./delivery-print-details"

export function OrderDetails({ order, onClose, onUpdate, onDelete }) {
  const [status, setStatus] = useState(order.status)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber)
  const [internalNotes, setInternalNotes] = useState(order.internalNotes)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const handleSave = () => {
    onUpdate({
      status,
      trackingNumber,
      internalNotes,
    })
    onClose()
  }

  const handleCancel = () => {
    onUpdate({ status: "Cancelled" })
    onClose()
  }

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (status) => {
    const variants = {
      Pending: "outline",
      Processing: "default",
      Completed: "secondary",
      Cancelled: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getStatusColor = (status) => {
    const colors = {
      Pending: "text-amber-600",
      Processing: "text-blue-600",
      Completed: "text-green-600",
      Cancelled: "text-red-600",
    }
    return colors[status] || "text-gray-600"
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-8xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6" />
                <span>Order #{order.id || order._id}</span>
                {getStatusBadge(order.status)}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setShowCancelConfirm(true)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Order Management */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Status & Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Order ID</label>
                      <p className="text-sm text-muted-foreground font-mono">#{order.id || order._id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date & Time</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.orderedAt).toLocaleDateString()} at {new Date(order.orderedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Order Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tracking Number</label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Internal Notes</label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Add internal notes (not visible to customer)"
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Payment Method:</span>
                    <span className="text-sm">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
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
                      {order.paymentStatus || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Shipping Method:</span>
                    <Badge variant="outline">{order.shippingMethod || 'N/A'}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Customer & Addresses */}
            <div className="lg:col-span-1 space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order.user ? `${order.user.firstName} ${order.user.lastName}` : 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">Customer</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{order.user?.email || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">Email</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{order.customerPhone}</p>
                      <p className="text-xs text-muted-foreground">Phone</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{order.user ? `${order.user.firstName} ${order.user.lastName}` : 'N/A'}</p>
                    <p>{order.shippingAddress?.street || 'N/A'}</p>
                    <p>
                      {order.shippingAddress?.city || 'N/A'}, {order.shippingAddress?.state || 'N/A'} {order.shippingAddress?.zip || 'N/A'}
                    </p>
                    <p>{order.shippingAddress?.country || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{order.user ? `${order.user.firstName} ${order.user.lastName}` : 'N/A'}</p>
                    <p>{order.billingAddress?.street || 'N/A'}</p>
                    <p>
                      {order.billingAddress?.city || 'N/A'}, {order.billingAddress?.state || 'N/A'} {order.billingAddress?.zip || 'N/A'}
                    </p>
                    <p>{order.billingAddress?.country || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Items & Summary */}
            <div className="lg:col-span-1">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div className="space-y-3">
                      {(order.items || []).map((item, index) => (
                        <div key={index} className="flex justify-between items-start p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name || 'Unknown Item'}</p>
                            <p className="text-xs text-muted-foreground">
                              Variant: {item.variant || 'N/A'} • Qty: {item.quantity || 0}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">${(item.price || 0).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              ${((item.price || 0) * (item.quantity || 0)).toFixed(2)} total
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${(order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span>${(order.shipping || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>${(order.tax || 0).toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="mt-6">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Order Timeline
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>
                            Order placed on {new Date(order.orderedAt).toLocaleDateString()} at {new Date(order.orderedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        {order.status !== "Pending" && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Status updated to {order.status}</span>
                          </div>
                        )}
                        {order.trackingNumber && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Tracking number added: {order.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6">
            <DeliveryPrintDetails order={order} onPrint={() => console.log("Printing order:", order.id || order._id)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order #{order.id || order._id}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone and the customer will be
              notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
