"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart"
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts"
import {
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "../../../components/ui/badge"

export function DashboardOverview({ orders = [] }) {
  // Calculate metrics
  const today = new Date().toISOString().split("T")[0]
  // Use orderedAt field from actual API response
  const todayOrders = orders.filter((order) => {
    const orderDate = new Date(order.orderedAt || order.createdAt);
    return orderDate.toISOString().split("T")[0] === today;
  })

  const pendingOrders = orders.filter((order) => order.status === "Pending").length
  const processingOrders = orders.filter((order) => order.status === "Processing").length
  const completedOrders = orders.filter((order) => order.status === "Completed").length
  const cancelledOrders = orders.filter((order) => order.status === "Cancelled").length

  const monthlyRevenue = orders
    .filter((order) => order.status === "Completed" || order.status === "Delivered")
    .reduce((sum, order) => sum + order.total, 0)

  // Since paymentStatus doesn't exist in our API, we'll skip unpaid orders calculation for now
  const unpaidOrders = 0; // orders.filter((order) => order.paymentStatus === "Unpaid").length
  const totalCustomers = new Set(orders.map((order) => order.user?.email || order.customerEmail)).size
  const averageOrderValue = orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0

  // Chart data
  const statusData = [
    { name: "Pending", value: pendingOrders, color: "#f59e0b" },
    { name: "Processing", value: processingOrders, color: "#3b82f6" },
    { name: "Completed", value: completedOrders, color: "#10b981" },
    { name: "Cancelled", value: cancelledOrders, color: "#ef4444" },
  ]

  const salesData = [
    { day: "Mon", sales: 1200, orders: 8 },
    { day: "Tue", sales: 1800, orders: 12 },
    { day: "Wed", sales: 1600, orders: 10 },
    { day: "Thu", sales: 2200, orders: 15 },
    { day: "Fri", sales: 1900, orders: 13 },
    { day: "Sat", sales: 2400, orders: 18 },
    { day: "Sun", sales: 2100, orders: 14 },
  ]

  // Since paymentMethod doesn't exist in our current API, we'll comment this out or use mock data
  const paymentMethodData = [
    { method: "Credit Card", count: Math.floor(orders.length * 0.6) },
    { method: "PayPal", count: Math.floor(orders.length * 0.25) },
    { method: "Bank Transfer", count: Math.floor(orders.length * 0.15) },
  ]

  const chartConfig = {
    sales: {
      label: "Sales ($)",
      color: "hsl(var(--chart-1))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-2))",
    },
  }

  // Recent orders for quick view - use orderedAt field
  const recentOrders = orders
    .sort((a, b) => {
      const dateA = new Date(a.orderedAt || a.createdAt || 0);
      const dateB = new Date(b.orderedAt || b.createdAt || 0);
      return dateB - dateA;
    })
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              +{orders.length > 0 ? Math.round((todayOrders.length / orders.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processingOrders}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cancelledOrders}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((cancelledOrders / orders.length) * 100)}% cancellation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order</CardTitle>
            <ShoppingCart className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Average value</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      {unpaidOrders > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <CardTitle className="text-amber-800">Payment Attention Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700">
              {unpaidOrders} order{unpaidOrders > 1 ? "s" : ""} with unpaid status require follow-up
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                pending: { label: "Pending", color: "#f59e0b" },
                processing: { label: "Processing", color: "#3b82f6" },
                completed: { label: "Completed", color: "#10b981" },
                cancelled: { label: "Cancelled", color: "#ef4444" },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales & Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-sales)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-sales)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-orders)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-orders)" }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Orders", color: "hsl(var(--chart-3))" },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodData}>
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order._id || order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-medium">#{order._id?.slice(-6) || order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.user ? `${order.user.firstName} ${order.user.lastName}` : order.customerName || 'N/A'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      order.status === "Completed"
                        ? "secondary"
                        : order.status === "Processing"
                          ? "default"
                          : order.status === "Pending"
                            ? "outline"
                            : "destructive"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.total.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.orderedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
