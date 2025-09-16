"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Checkbox } from "../../../components/ui/checkbox"
import { Badge } from "../../../components/ui/badge"
import { Calendar } from "../../../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { CalendarIcon, Download, Eye, Edit, X, Truck, Package, Trash2, Filter, Search } from "lucide-react"
import { format } from "date-fns"

export function OrdersList({ orders, onOrderSelect, onOrderUpdate, onBulkUpdate, onOrderDelete }) {
      const [selectedOrders, setSelectedOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [shippingFilter, setShippingFilter] = useState("all")
  const [dateRange, setDateRange] = useState({})
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [bulkAction, setBulkAction] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter
    const matchesShipping = shippingFilter === "all" || order.shippingMethod === shippingFilter

    const orderDate = new Date(order.date)
    const matchesDateRange =
      (!dateRange.from || orderDate >= dateRange.from) && (!dateRange.to || orderDate <= dateRange.to)

    return matchesSearch && matchesStatus && matchesPayment && matchesShipping && matchesDateRange
  })

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(filteredOrders.map((order) => order.id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (orderId, checked) => {
    if (checked) {
      setSelectedOrders((prev) => [...prev, orderId])
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId))
    }
  }

  const handleBulkAction = (action) => {
    setBulkAction(action)
    setShowBulkConfirm(true)
  }

  const confirmBulkAction = () => {
    switch (bulkAction) {
      case "processing":
        onBulkUpdate(selectedOrders, { status: "Processing" })
        break
      case "shipped":
        onBulkUpdate(selectedOrders, { status: "Completed" })
        break
      case "export":
        // Export functionality
        const csvContent =
          "data:text/csv;charset=utf-8," +
          "Order ID,Customer,Date,Status,Payment,Total\n" +
          selectedOrders
            .map((id) => {
              const order = orders.find((o) => o.id === id)
              return `${order.id},${order.customerName},${order.date},${order.status},${order.paymentStatus},${order.total}`
            })
            .join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "orders_export.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        break
      case "delete":
        onOrderDelete(selectedOrders)
        break
    }
    setSelectedOrders([])
    setShowBulkConfirm(false)
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

  const getPaymentBadge = (status) => {
    const variants = {
      Paid: "secondary",
      Unpaid: "destructive",
      Refunded: "outline",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPaymentFilter("all")
    setShippingFilter("all")
    setDateRange({})
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredOrders.length} of {orders.length} orders
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID, Customer Name, Email, or Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={shippingFilter} onValueChange={setShippingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Shipping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shipping</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Express">Express</SelectItem>
                  <SelectItem value="Overnight">Overnight</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-800">
                {selectedOrders.length} order{selectedOrders.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("processing")}>
                  <Package className="w-4 h-4 mr-2" />
                  Mark Processing
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("shipped")}>
                  <Truck className="w-4 h-4 mr-2" />
                  Mark Shipped
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("export")}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Orders Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Date & Time</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">Shipping</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No orders found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                          onClick={() => onOrderSelect(order.id)}
                        >
                          #{order.id}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{order.date}</div>
                          <div className="text-muted-foreground">{order.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                      <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.shippingMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOrderSelect(order.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOrderSelect(order.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedOrders([order.id])
                              handleBulkAction("delete")
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {bulkAction === "processing"
                ? "mark as processing"
                : bulkAction === "shipped"
                  ? "mark as shipped"
                  : bulkAction === "export"
                    ? "export"
                    : "delete"}{" "}
              {selectedOrders.length} selected order{selectedOrders.length > 1 ? "s" : ""}?
              {bulkAction === "delete" && " This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkConfirm(false)}>
              Cancel
            </Button>
            <Button variant={bulkAction === "delete" ? "destructive" : "default"} onClick={confirmBulkAction}>
              {bulkAction === "delete" ? "Delete Orders" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
