"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import {
  Calendar,
  Gift,
  Package,
  ShoppingCart,
  MoreHorizontal,
  Sparkles,
  Home,
  TrendingUp,
  Download,
  Filter,
  Bell,
  X,
  Menu,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Progress } from "../../../components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "../../../components/ui/sheet"
import { cn } from "../../../lib/utils"

export default function DashboardInventory () {
  const [selectedPeriod, setSelectedPeriod] = useState("This Month")
  const [reportPeriod, setReportPeriod] = useState("monthly")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [showAlerts, setShowAlerts] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  // Check if mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Sample data for charts
  const salesData = [
    { month: "Jan", gifts: 4000, rentals: 2400, decorations: 2400 },
    { month: "Feb", gifts: 3000, rentals: 1398, decorations: 2210 },
    { month: "Mar", gifts: 2000, rentals: 9800, decorations: 2290 },
    { month: "Apr", gifts: 2780, rentals: 3908, decorations: 2000 },
    { month: "May", gifts: 1890, rentals: 4800, decorations: 2181 },
    { month: "Jun", gifts: 2390, rentals: 3800, decorations: 2500 },
    { month: "Jul", gifts: 3490, rentals: 4300, decorations: 2100 },
    { month: "Aug", gifts: 2000, rentals: 2400, decorations: 2400 },
    { month: "Sep", gifts: 3000, rentals: 1398, decorations: 2210 },
    { month: "Oct", gifts: 2000, rentals: 9800, decorations: 2290 },
    { month: "Nov", gifts: 2780, rentals: 3908, decorations: 2000 },
    { month: "Dec", gifts: 1890, rentals: 4800, decorations: 2181 },
  ]

  // Daily Sales Data
  const dailySalesData = [
    { day: "Mon", revenue: 1200, profit: 480, loss: 120 },
    { day: "Tue", revenue: 1800, profit: 720, loss: 90 },
    { day: "Wed", revenue: 1500, profit: 600, loss: 150 },
    { day: "Thu", revenue: 2200, profit: 880, loss: 110 },
    { day: "Fri", revenue: 2800, profit: 1120, loss: 140 },
    { day: "Sat", revenue: 3200, profit: 1280, loss: 160 },
    { day: "Sun", revenue: 2100, profit: 840, loss: 105 },
  ]

  // Weekly Sales Data
  const weeklySalesData = [
    { week: "Week 1", revenue: 12000, profit: 4800, loss: 600 },
    { week: "Week 2", revenue: 15000, profit: 6000, loss: 750 },
    { week: "Week 3", revenue: 18000, profit: 7200, loss: 900 },
    { week: "Week 4", revenue: 16500, profit: 6600, loss: 825 },
  ]

  // Yearly Sales Data
  const yearlySalesData = [
    { year: "2021", revenue: 180000, profit: 72000, loss: 9000 },
    { year: "2022", revenue: 220000, profit: 88000, loss: 11000 },
    { year: "2023", revenue: 280000, profit: 112000, loss: 14000 },
    { year: "2024", revenue: 320000, profit: 128000, loss: 16000 },
    { year: "2025", revenue: 380000, profit: 152000, loss: 19000 },
  ]

  const popularProducts = [
    {
      name: "Birthday Gift Box",
      category: "Gifts",
      status: "In Stock",
      sales: 120,
      color: "bg-green-500",
    },
    {
      name: "Wedding Decoration Set",
      category: "Decorations",
      status: "Low Stock",
      sales: 75,
      color: "bg-amber-500",
    },
    {
      name: "Party Lights",
      category: "Rentals",
      status: "Available",
      sales: 60,
      color: "bg-purple-500",
    },
  ]

  const recentOrders = [
    {
      customer: "Emma Johnson",
      date: "Jun 9, 2025",
      order: "ORD-1002",
      amount: "£145.00",
      status: "Completed",
      items: "Birthday Gift Box, Greeting Card",
    },
    {
      customer: "Michael Smith",
      date: "Jun 8, 2025",
      order: "ORD-1001",
      amount: "£350.00",
      items: "Wedding Decoration Package",
    },
    {
      customer: "Sophia Williams",
      date: "Jun 7, 2025",
      order: "ORD-1000",
      amount: "£85.00",
      status: "Completed",
      items: "Custom Gift Basket",
    },
    {
      customer: "James Brown",
      date: "Jun 6, 2025",
      order: "ORD-999",
      amount: "£210.00",
      status: "Delivered",
      items: "Party Lights (Rental), Balloons",
    },
  ]

  // Product Stock Status with alerts for low stock
  const productStatus = [
    { product: "Birthday Gift Box", stock: 85, isLow: false },
    { product: "Wedding Decoration Set", stock: 20, isLow: true },
    { product: "Party Lights", stock: 60, isLow: false },
    { product: "Custom Gift Baskets", stock: 75, isLow: false },
    { product: "Greeting Cards", stock: 95, isLow: false },
    { product: "Balloon Arrangements", stock: 15, isLow: true },
    { product: "Gift Wrapping Paper", stock: 10, isLow: true },
    { product: "Event Chairs", stock: 5, isLow: true },
  ]

  // Get low stock products
  const lowStockProducts = productStatus.filter((product) => product.isLow)

  const recentActivities = [
    {
      user: "Emma Johnson",
      action: "placed an order for",
      item: "Birthday Gift Box",
      time: "2 hours ago",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      user: "Staff Member",
      action: "marked as returned",
      item: "Party Lights Rental",
      time: "3 hours ago",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      user: "Michael Smith",
      action: "booked decoration service for",
      item: "Wedding Event",
      time: "4 hours ago",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      user: "Sophia Williams",
      action: "requested custom",
      item: "Gift Basket",
      time: "5 hours ago",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ]

  const upcomingEvents = [
    { event: "Wedding Decoration", client: "Smith Family", date: "Jun 15, 2025", status: "Confirmed" },
    { event: "Corporate Gift Delivery", client: "ABC Corp", date: "Jun 18, 2025", status: "Pending" },
    { event: "Birthday Party Setup", client: "Emma Johnson", date: "Jun 20, 2025", status: "Confirmed" },
    { event: "Holiday Decoration Return", client: "City Mall", date: "Jun 25, 2025", status: "Scheduled" },
  ]

  // System alerts
  const systemAlerts = [
    {
      type: "low-stock",
      message: "4 products are running low on stock",
      severity: "warning",
      time: "Just now",
    },
    {
      type: "order",
      message: "New order #1003 requires attention",
      severity: "info",
      time: "5 minutes ago",
    },
    {
      type: "payment",
      message: "Payment for order #998 failed",
      severity: "error",
      time: "1 hour ago",
    },
  ]

  const getSalesDataByPeriod = () => {
    switch (reportPeriod) {
      case "daily":
        return dailySalesData
      case "weekly":
        return weeklySalesData
      case "monthly":
        return salesData
      case "yearly":
        return yearlySalesData
      default:
        return salesData
    }
  }

  // Mobile navigation items
  const navItems = [
    { name: "Overview", value: "overview", icon: <Home className="h-5 w-5" /> }
  ]

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Mobile Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex justify-around items-center p-2">
            {navItems.map((item) => (
              <button
                key={item.value}
                className={cn(
                  "flex flex-col items-center p-2 rounded-md",
                  activeTab === item.value ? "text-pink-600" : "text-gray-500",
                )}
                onClick={() => setActiveTab(item.value)}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="py-4">
                  <h2 className="text-lg font-bold mb-4 px-4">Gift Shop Dashboard</h2>
                  <nav className="space-y-1">
                    {navItems.map((item) => (
                      <button
                        key={item.value}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2 text-left",
                          activeTab === item.value ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-100",
                        )}
                        onClick={() => {
                          setActiveTab(item.value)
                        }}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}
          <h1 className="text-xl font-bold">Gift Shop</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowAlerts(!showAlerts)}>
              <Bell className="h-5 w-5" />
              {systemAlerts.length > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Button>

            {/* Alerts dropdown */}
            {showAlerts && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="flex justify-between items-center p-3 border-b border-gray-200">
                  <h3 className="font-medium">Notifications</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowAlerts(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {systemAlerts.map((alert, index) => (
                    <div key={index} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                      <div className="flex gap-3 items-start">
                        <div
                          className={cn(
                            "p-1 rounded-full",
                            alert.severity === "warning"
                              ? "bg-amber-100"
                              : alert.severity === "error"
                                ? "bg-red-100"
                                : "bg-blue-100",
                          )}
                        >
                          <AlertTriangle
                            className={cn(
                              "h-4 w-4",
                              alert.severity === "warning"
                                ? "text-amber-500"
                                : alert.severity === "error"
                                  ? "text-red-500"
                                  : "text-blue-500",
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 text-center border-t border-gray-100">
                  <Button variant="ghost" size="sm" className="text-sm text-pink-600 hover:text-pink-700">
                    View all notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="p-4 md:p-6 pb-20 md:pb-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-500">Manage your gifts, and low stocks updates</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <div className="hidden md:block">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="This Year">This Year</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="This Week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="bg-white border-gray-200 hover:bg-gray-50">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Select Date</span>
              <span className="md:hidden">Date</span>
            </Button>
          </div>
        </div>

        {/* Low Stock Alert Banner */}
        {lowStockProducts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="p-1 bg-amber-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-amber-800">Low Stock Alert</h3>
              <p className="text-sm text-amber-700 mt-1">
                {lowStockProducts.length} products are running low on stock and need attention.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowStockProducts.map((product, index) => (
                  <Badge key={index} variant="outline" className="bg-white border-amber-200 text-amber-700">
                    {product.product}: {product.stock} left
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800 hover:bg-amber-100">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className={cn("p-4 md:p-6", isMobile && "flex flex-col items-center text-center")}>
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <ShoppingCart className="h-5 w-5 text-pink-500" />
                <span className="text-sm text-gray-500">Total Sales</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800">£12,345</div>
              <div className="text-xs text-green-600 mt-1">↑ 12% from last month</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className={cn("p-4 md:p-6", isMobile && "flex flex-col items-center text-center")}>
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Gift className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-500">Gift Orders</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800">1,245</div>
              <div className="text-xs text-green-600 mt-1">↑ 8% from last month</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className={cn("p-4 md:p-6", isMobile && "flex flex-col items-center text-center")}>
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Package className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-gray-500">Low stocks</span>
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800">45</div>
              <div className="text-xs text-amber-600 mt-1">↓ 3% from last month</div>
            </CardContent>
          </Card>

        </div>

        {/* Main Dashboard Tabs - Desktop */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

            {/* Tab Content */}
            <TabsContent value="overview" className="space-y-6">

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Popular Products */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-gray-800">Popular Products</CardTitle>
                      <span className="text-sm text-gray-500">This week</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {popularProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${product.color}`}></div>
                            <div>
                              <div className="text-gray-800 font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">Category: {product.category}</div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              product.status === "In Stock"
                                ? "default"
                                : product.status === "Low Stock"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {product.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sales Chart */}
                <Card className="bg-white border-gray-200 shadow-sm lg:col-span-2">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-gray-800">Sales Performance</CardTitle>
                      <span className="text-sm text-gray-500">{selectedPeriod}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="month" stroke="#6B7280" />
                          <YAxis stroke="#6B7280" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E5E7EB",
                              borderRadius: "8px",
                            }}
                          />
                          <Line type="monotone" dataKey="gifts" stroke="#10B981" strokeWidth={3} />
                          <Line type="monotone" dataKey="rentals" stroke="#8B5CF6" strokeWidth={3} />
                          <Line type="monotone" dataKey="decorations" stroke="#F59E0B" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Mobile Tab Content */}
        <div className="md:hidden">
          {activeTab === "overview" && (
            <div className="space-y-6">

              {/* Popular Products */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-gray-800 text-lg">Popular Products</CardTitle>
                    <span className="text-xs text-gray-500">This week</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-4">
                    {popularProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${product.color}`}></div>
                          <div>
                            <div className="text-gray-800 font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500">Category: {product.category}</div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            product.status === "In Stock"
                              ? "default"
                              : product.status === "Low Stock"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs"
                        >
                          {product.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sales Chart - Mobile */}
              <Card className="bg-white border-gray-200 shadow-sm">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-gray-800 text-lg">Sales Performance</CardTitle>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="This Year">This Year</SelectItem>
                        <SelectItem value="This Month">This Month</SelectItem>
                        <SelectItem value="This Week">This Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="gifts" fill="#10B981" />
                        <Bar dataKey="rentals" fill="#8B5CF6" />
                        <Bar dataKey="decorations" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center mt-4 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-600">Gifts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-xs text-gray-600">Rentals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-xs text-gray-600">Decorations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
