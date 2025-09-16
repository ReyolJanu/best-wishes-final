"use client"

import React, { useState, useEffect } from "react"
import { useLoading } from '../../hooks/useLoading'
import Loader from '../../components/loader/page'
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
  Edit,
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
import Link from "next/link"

export default function Dashboard() {
  const { loading, withLoading } = useLoading();
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("This Month")
  const [reportPeriod, setReportPeriod] = useState("monthly")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [showAlerts, setShowAlerts] = useState(true)
  const [showLowStockModal, setShowLowStockModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [realLowStockProducts, setRealLowStockProducts] = useState([])
  const [realLowStockCount, setRealLowStockCount] = useState(0)
  const [systemAlerts, setSystemAlerts] = useState([])

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

  // State for real data
  const [realSalesData, setRealSalesData] = useState([]);
  const [realOrdersData, setRealOrdersData] = useState([]);
  const [realProductsData, setRealProductsData] = useState([]);
  const [realUsersData, setRealUsersData] = useState([]);
  const [salesMetrics, setSalesMetrics] = useState({
    totalSales: 0,
    giftOrders: 0,
    activeRentals: 0,
    decorationJobs: 0,
    totalProducts: 0,
    totalUsers: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      await withLoading(async () => {
        try {
          // Fetch real data from multiple endpoints
          const [usersResponse, ordersResponse, productsResponse] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, { credentials: 'include' }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/all`, { credentials: 'include' }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { credentials: 'include' })
          ]);

          const [usersData, ordersData, productsData] = await Promise.all([
            usersResponse.json(),
            ordersResponse.json(),
            productsResponse.json()
          ]);

          // Set real data
          setRealUsersData(usersData.users || []);
          setRealOrdersData(ordersData.orders || []);
          setRealProductsData(productsData.data || []);

          // Calculate real metrics
          const orders = ordersData.orders || [];
          const products = productsData.data || [];
          const users = usersData.users || [];

          // Calculate total sales from orders
          const totalSales = orders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
          }, 0);

          // Count orders by status/type
          const completedOrders = orders.filter(order => order.status === 'Delivered').length;
          const processingOrders = orders.filter(order => ['Processing', 'Packing', 'Shipped'].includes(order.status)).length;
          const pendingOrders = orders.filter(order => order.status === 'Pending').length;

          // Calculate category-based metrics from products and orders
          const giftOrders = orders.filter(order => 
            order.items?.some(item => 
              item.product?.mainCategory === 'gifts' || 
              item.product?.category?.includes('gift') ||
              item.product?.name?.toLowerCase().includes('gift')
            )
          ).length;

          const activeRentals = orders.filter(order => 
            order.status === 'Processing' && 
            order.items?.some(item => 
              item.product?.mainCategory === 'rentals' || 
              item.product?.category?.includes('rental') ||
              item.product?.name?.toLowerCase().includes('rental')
            )
          ).length;

          const decorationJobs = orders.filter(order => 
            order.items?.some(item => 
              item.product?.mainCategory === 'decorations' || 
              item.product?.category?.includes('decoration') ||
              item.product?.name?.toLowerCase().includes('decoration')
            )
          ).length;

          setSalesMetrics({
            totalSales: totalSales,
            giftOrders: completedOrders,
            activeRentals: processingOrders,
            decorationJobs: decorationJobs,
            totalProducts: products.length,
            totalUsers: users.length
          });

          // Process sales data for charts
          const salesByMonth = processOrdersForChart(orders);
          setRealSalesData(salesByMonth);

          setDashboardData({ 
            users: users,
            orders: orders,
            products: products
          });
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          // Set empty data to prevent further errors
          setDashboardData({ users: [], orders: [], products: [] });
          setSalesMetrics({
            totalSales: 0,
            giftOrders: 0,
            activeRentals: 0,
            decorationJobs: 0,
            totalProducts: 0,
            totalUsers: 0
          });
        }
      });
    };

    fetchDashboardData();
  }, [withLoading]);

  // Function to process orders for chart data
  const processOrdersForChart = (orders) => {
    const monthlyData = {};
    const currentYear = new Date().getFullYear();
    
    // Initialize months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      monthlyData[month] = { month, gifts: 0, rentals: 0, decorations: 0 };
    });

    orders.forEach(order => {
      const orderDate = new Date(order.orderedAt || order.createdAt);
      if (orderDate.getFullYear() === currentYear) {
        const month = months[orderDate.getMonth()];
        const orderAmount = order.totalAmount || 0;
        
        // Categorize based on order items
        if (order.items) {
          order.items.forEach(item => {
            const productName = item.product?.name?.toLowerCase() || '';
            const productCategory = item.product?.mainCategory?.toLowerCase() || '';
            
            if (productCategory.includes('gift') || productName.includes('gift')) {
              monthlyData[month].gifts += orderAmount / order.items.length;
            } else if (productCategory.includes('rental') || productName.includes('rental')) {
              monthlyData[month].rentals += orderAmount / order.items.length;
            } else if (productCategory.includes('decoration') || productName.includes('decoration')) {
              monthlyData[month].decorations += orderAmount / order.items.length;
            } else {
              // Default to gifts if category is unclear
              monthlyData[month].gifts += orderAmount / order.items.length;
            }
          });
        } else {
          monthlyData[month].gifts += orderAmount;
        }
      }
    });

    return Object.values(monthlyData);
  };

  // Fetch real product data and count low stock products
  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        const result = await response.json();
        
        if (result.data && Array.isArray(result.data)) {
          const products = result.data;
          
          // Filter low stock products (stock < 10 or stock === 0)
          const lowStockProducts = products.filter(product => 
            product.stock < 10 || product.stock === 0
          );
          
          // Separate out of stock and low stock
          const outOfStock = lowStockProducts.filter(product => product.stock === 0);
          const lowStock = lowStockProducts.filter(product => product.stock > 0 && product.stock < 10);
          
          setRealLowStockProducts(lowStockProducts);
          setRealLowStockCount(lowStockProducts.length);
          
          // Update system alerts with detailed counts
          const lowStockAlert = {
            type: "low-stock",
            message: `${outOfStock.length} out of stock, ${lowStock.length} low stock products need attention`,
            severity: "warning",
            time: "Just now",
            clickable: true,
            action: () => {
              window.location.href = '/prodectmanage?filter=low-stock'
            }
          };
          
          // Update system alerts state with the new low stock alert
          setSystemAlerts(prevAlerts => {
            const existingAlerts = prevAlerts.filter(alert => alert.type !== "low-stock");
            return [lowStockAlert, ...existingAlerts];
          });
        }
      } catch (error) {
        console.error('Error fetching low stock products:', error);
        // Fallback to sample data if API fails
        setRealLowStockCount(lowStockProducts.length);
      }
    };

    fetchLowStockProducts();
  }, []);

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

  // Category Revenue Data
  const categoryRevenueData = [
    { category: "Birthday Gifts", revenue: 45000, percentage: 35, color: "#10B981" },
    { category: "Wedding Gifts", revenue: 32000, percentage: 25, color: "#8B5CF6" },
    { category: "Party Rentals", revenue: 28000, percentage: 22, color: "#F59E0B" },
    { category: "Decorations", revenue: 23000, percentage: 18, color: "#EF4444" },
  ]

  // Product-wise Revenue Data
  const productRevenueData = [
    { product: "Custom Gift Baskets", revenue: 18500, units: 245, avgPrice: 75.51 },
    { product: "Wedding Decoration Package", revenue: 15200, units: 38, avgPrice: 400.0 },
    { product: "Party Light Rentals", revenue: 12800, units: 128, avgPrice: 100.0 },
    { product: "Birthday Gift Boxes", revenue: 11200, units: 186, avgPrice: 60.22 },
    { product: "Balloon Arrangements", revenue: 8900, units: 178, avgPrice: 50.0 },
    { product: "Event Furniture Rental", revenue: 7600, units: 19, avgPrice: 400.0 },
  ]

  // Regional Revenue Data
  const regionalRevenueData = [
    { region: "Downtown", revenue: 45000, orders: 450, growth: 12 },
    { region: "Suburbs", revenue: 38000, orders: 380, growth: 8 },
    { region: "Mall District", revenue: 32000, orders: 320, growth: 15 },
    { region: "Business District", revenue: 28000, orders: 280, growth: -3 },
    { region: "Residential Area", revenue: 25000, orders: 250, growth: 6 },
  ]

  const categoryData = [
    { name: "Gifts", value: 45, color: "#10B981" },
    { name: "Rentals", value: 30, color: "#8B5CF6" },
    { name: "Decorations", value: 25, color: "#F59E0B" },
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
      amount: "$145.00",
      status: "Completed",
      items: "Birthday Gift Box, Greeting Card",
    },
    {
      customer: "Michael Smith",
      date: "Jun 8, 2025",
      order: "ORD-1001",
      amount: "$350.00",
      items: "Wedding Decoration Package",
    },
    {
      customer: "Sophia Williams",
      date: "Jun 7, 2025",
      order: "ORD-1000",
      amount: "$85.00",
      status: "Completed",
      items: "Custom Gift Basket",
    },
    {
      customer: "James Brown",
      date: "Jun 6, 2025",
      order: "ORD-999",
      amount: "$210.00",
      status: "Delivered",
      items: "Party Lights (Rental), Balloons",
    },
  ]

  // Product Stock Status with alerts for low stock
  const productStatus = [
    { product: "Birthday Gift Box", stock: 85, isLow: false, category: "Gifts", sku: "BG001" },
    { product: "Wedding Decoration Set", stock: 20, isLow: true, category: "Decorations", sku: "WD001" },
    { product: "Party Lights", stock: 60, isLow: false, category: "Rentals", sku: "PL001" },
    { product: "Custom Gift Baskets", stock: 75, isLow: false, category: "Gifts", sku: "CGB001" },
    { product: "Greeting Cards", stock: 95, isLow: false, category: "Gifts", sku: "GC001" },
    { product: "Balloon Arrangements", stock: 15, isLow: true, category: "Decorations", sku: "BA001" },
    { product: "Gift Wrapping Paper", stock: 10, isLow: true, category: "Supplies", sku: "GWP001" },
    { product: "Event Chairs", stock: 5, isLow: true, category: "Rentals", sku: "EC001" },
    { product: "Table Cloths", stock: 0, isLow: true, category: "Rentals", sku: "TC001" },
    { product: "Cake Stands", stock: 8, isLow: true, category: "Rentals", sku: "CS001" },
    { product: "Photo Frames", stock: 12, isLow: true, category: "Gifts", sku: "PF001" },
    { product: "Candles", stock: 0, isLow: true, category: "Decorations", sku: "C001" },
    { product: "Ribbons", stock: 25, isLow: true, category: "Supplies", sku: "R001" },
    { product: "Party Hats", stock: 3, isLow: true, category: "Supplies", sku: "PH001" },
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
    { name: "Overview", value: "overview", icon: <Home className="h-5 w-5" /> },
    { name: "Reports", value: "reports", icon: <TrendingUp className="h-5 w-5" /> },
    { name: "Products", value: "products", icon: <Package className="h-5 w-5" /> },
    { name: "Activities", value: "activities", icon: <Calendar className="h-5 w-5" /> },
  ]

  return (
    <>
      {loading && <Loader />}
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
              {showAlerts && systemAlerts.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="flex justify-between items-center p-3 border-b border-gray-200">
                    <h3 className="font-medium">Notifications ({systemAlerts.length})</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowAlerts(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {systemAlerts.map((alert, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "p-3 border-b border-gray-100",
                          alert.clickable 
                            ? "hover:bg-gray-50 cursor-pointer" 
                            : "hover:bg-gray-50"
                        )}
                        onClick={alert.clickable ? alert.action : undefined}
                      >
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
                            {alert.clickable && (
                              <p className="text-xs text-blue-600 mt-1">Click to view details</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 text-center border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-sm text-pink-600 hover:text-pink-700"
                      onClick={() => setShowAlerts(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Show message when no notifications */}
              {showAlerts && systemAlerts.length === 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="flex justify-between items-center p-3 border-b border-gray-200">
                    <h3 className="font-medium">Notifications</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowAlerts(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No notifications at the moment</p>
                    <p className="text-sm text-gray-400 mt-1">All systems are running smoothly</p>
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
              <p className="text-gray-500">Manage your gifts, rentals, and decoration services</p>
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
          {realLowStockCount > 0 && (
            <div 
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3 hover:bg-amber-100 transition-colors cursor-pointer"
              onClick={() => {
                // Navigate to ProductDashboard with low stock filter
                window.location.href = '/prodectmanage?filter=low-stock'
              }}
            >
            <div className="p-1 bg-amber-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-amber-800">Low Stock Alert</h3>
              <p className="text-sm text-amber-700 mt-1">
                {realLowStockCount} products are running low on stock and need attention.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {realLowStockProducts.slice(0, 3).map((product, index) => (
                  <Badge key={index} variant="outline" className="bg-white border-amber-200 text-amber-700">
                    {product.name}: {product.stock} left
                  </Badge>
                ))}
                {realLowStockCount > 3 && (
                  <Badge variant="outline" className="bg-white border-amber-200 text-amber-700">
                    +{realLowStockCount - 3} more
                  </Badge>
                )}
              </div>
            </div>
                          <div className="flex items-center gap-2">
                <span className="text-sm text-amber-700">Click to View All Low Stock Products</span>
                <ChevronRight className="h-4 w-4 text-amber-700" />
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className={cn("p-4 md:p-6", isMobile && "flex flex-col items-center text-center")}>
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <ShoppingCart className="h-5 w-5 text-pink-500" />
                  <span className="text-sm text-gray-500">Total Sales</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800">
                  ${salesMetrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-green-600 mt-1">From {realOrdersData.length} orders</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className={cn("p-4 md:p-6", isMobile && "flex flex-col items-center text-center")}>
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <Gift className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">Completed Orders</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800">{salesMetrics.giftOrders}</div>
                <div className="text-xs text-green-600 mt-1">Successfully delivered</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className={cn("p-4 md:p-6", isMobile && "flex flex-col items-center text-center")}>
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <Package className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-gray-500">Active Orders</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800">{salesMetrics.activeRentals}</div>
                <div className="text-xs text-amber-600 mt-1">In processing</div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardContent className={cn("p-4 md:p-6", isMobile && "flex flex-col items-center text-center")}>
                <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-gray-500">Decoration Orders</span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800">{salesMetrics.decorationJobs}</div>
                <div className="text-xs text-green-600 mt-1">All time</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs - Desktop */}
          <div className="hidden md:block">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="overview" className="space-y-6">
                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Total Products</div>
                      <div className="text-2xl font-bold text-gray-800">{salesMetrics.totalProducts}</div>
                      <div className="text-xs text-green-600 mt-1">In database</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Total Users</div>
                      <div className="text-2xl font-bold text-gray-800">{salesMetrics.totalUsers}</div>
                      <div className="text-xs text-green-600 mt-1">Registered users</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-500 mb-1">Low Stock Items</div>
                      <div className="text-2xl font-bold text-gray-800">{realLowStockCount}</div>
                      <div className="text-xs text-amber-600 mt-1">Need attention</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Popular Products */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-gray-800">Popular Products</CardTitle>
                        <span className="text-sm text-gray-500">Current stock</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {realProductsData.slice(0, 3).map((product, index) => (
                          <div key={product._id || index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                index === 0 ? 'bg-green-500' : 
                                index === 1 ? 'bg-purple-500' : 'bg-amber-500'
                              }`}></div>
                              <div>
                                <div className="text-gray-800 font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">
                                  Price: ${product.salePrice || product.retailPrice || 0}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={
                                product.stock > 20 ? "default" :
                                product.stock > 0 ? "secondary" : "destructive"
                              }
                              className="text-xs"
                            >
                              {product.stock > 20 ? "In Stock" : 
                               product.stock > 0 ? "Low Stock" : "Out of Stock"}
                            </Badge>
                          </div>
                        ))}
                        {realProductsData.length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            No products found
                          </div>
                        )}
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
                          <LineChart data={realSalesData.length > 0 ? realSalesData : salesData}>
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

              {/* Reports & Analytics Tab */}
              <TabsContent value="reports" className="space-y-6">
                {/* Report Controls */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-800">Report Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Period:</label>
                        <Select value={reportPeriod} onValueChange={setReportPeriod}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Region:</label>
                        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Regions</SelectItem>
                            <SelectItem value="downtown">Downtown</SelectItem>
                            <SelectItem value="suburbs">Suburbs</SelectItem>
                            <SelectItem value="mall">Mall District</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Custom Date Range
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Sales Reports */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-800">Sales Reports - Profit/Loss Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getSalesDataByPeriod()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis
                            dataKey={
                              reportPeriod === "daily"
                                ? "day"
                                : reportPeriod === "weekly"
                                  ? "week"
                                  : reportPeriod === "yearly"
                                    ? "year"
                                    : "month"
                            }
                            stroke="#6B7280"
                          />
                          <YAxis stroke="#6B7280" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E5E7EB",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stackId="1"
                            stroke="#10B981"
                            fill="#10B981"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="profit"
                            stackId="2"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="loss"
                            stackId="3"
                            stroke="#EF4444"
                            fill="#EF4444"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category-wise Revenue */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Category-wise Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoryRevenueData.map((category, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">{category.category}</span>
                              <span className="text-sm text-gray-800">${category.revenue.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={category.percentage} className="flex-1 h-2" />
                              <span className="text-xs text-gray-500 w-10">{category.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Regional Revenue */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Regional Revenue Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {regionalRevenueData.map((region, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-800">{region.region}</div>
                              <div className="text-sm text-gray-500">{region.orders} orders</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-800">${region.revenue.toLocaleString()}</div>
                              <div className={`text-sm ${region.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {region.growth >= 0 ? "↑" : "↓"} {Math.abs(region.growth)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Product-wise Revenue */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-800">Product-wise Revenue Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left text-sm text-gray-500 pb-2">PRODUCT</th>
                            <th className="text-left text-sm text-gray-500 pb-2">REVENUE</th>
                            <th className="text-left text-sm text-gray-500 pb-2">UNITS SOLD</th>
                            <th className="text-left text-sm text-gray-500 pb-2">AVG PRICE</th>
                            <th className="text-left text-sm text-gray-500 pb-2">PERFORMANCE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productRevenueData.map((product, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-3 text-gray-800 font-medium">{product.product}</td>
                              <td className="py-3 text-gray-800">${product.revenue.toLocaleString()}</td>
                              <td className="py-3 text-gray-600">{product.units}</td>
                              <td className="py-3 text-gray-600">${product.avgPrice.toFixed(2)}</td>
                              <td className="py-3">
                                <div className="w-20">
                                  <Progress value={(product.revenue / 20000) * 100} className="h-2" />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-6">
                {/* Product Categories Tabs */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-800">Product Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="gifts">
                      <TabsList className="mb-4">
                        <TabsTrigger value="gifts">Gifts</TabsTrigger>
                        <TabsTrigger value="rentals">Rentals</TabsTrigger>
                        <TabsTrigger value="decorations">Decorations</TabsTrigger>
                      </TabsList>
                      <TabsContent value="gifts">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Gift className="h-10 w-10 text-pink-500" />
                              <div>
                                <div className="font-medium">Birthday Gifts</div>
                                <div className="text-sm text-gray-500">42 products</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Gift className="h-10 w-10 text-blue-500" />
                              <div>
                                <div className="font-medium">Wedding Gifts</div>
                                <div className="text-sm text-gray-500">28 products</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Gift className="h-10 w-10 text-green-500" />
                              <div>
                                <div className="font-medium">Custom Gift Baskets</div>
                                <div className="text-sm text-gray-500">15 products</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      <TabsContent value="rentals">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Package className="h-10 w-10 text-purple-500" />
                              <div>
                                <div className="font-medium">Party Equipment</div>
                                <div className="text-sm text-gray-500">18 products</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Package className="h-10 w-10 text-indigo-500" />
                              <div>
                                <div className="font-medium">Event Furniture</div>
                                <div className="text-sm text-gray-500">24 products</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Package className="h-10 w-10 text-violet-500" />
                              <div>
                                <div className="font-medium">Lighting Equipment</div>
                                <div className="text-sm text-gray-500">11 products</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                      <TabsContent value="decorations">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Sparkles className="h-10 w-10 text-amber-500" />
                              <div>
                                <div className="font-medium">Wedding Decorations</div>
                                <div className="text-sm text-gray-500">32 services</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Sparkles className="h-10 w-10 text-red-500" />
                              <div>
                                <div className="font-medium">Party Decorations</div>
                                <div className="text-sm text-gray-500">28 services</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Home className="h-10 w-10 text-teal-500" />
                              <div>
                                <div className="font-medium">Home Decorations</div>
                                <div className="text-sm text-gray-500">15 services</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Product Stock Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Product Stock Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {realProductsData.slice(0, 6).map((product, index) => (
                          <div key={product._id || index}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-700">{product.name}</span>
                              <span className={`text-sm ${
                                product.stock < 10 ? "text-red-600 font-medium" : "text-gray-800"
                              }`}>
                                {product.stock || 0}{product.stock < 10 && " (Low)"}
                              </span>
                            </div>
                            <Progress
                              value={Math.min((product.stock || 0), 100)}
                              className="h-2"
                            />
                          </div>
                        ))}
                        {realProductsData.length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            No products found
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {categoryData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-sm text-gray-700">{item.name}</span>
                            </div>
                            <span className="text-sm text-gray-800">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-gray-800">Recent Orders</CardTitle>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {realOrdersData.slice(0, 4).map((order, index) => (
                          <div key={order._id || index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-800">
                                {order.user?.firstName || 'Unknown'} {order.user?.lastName || 'User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order._id?.slice(-6) || 'N/A'} • {new Date(order.orderedAt || order.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                {order.items?.length || 0} item(s)
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-800">
                                ${order.totalAmount?.toFixed(2) || '0.00'}
                              </div>
                              <Badge
                                variant={
                                  order.status === "Delivered" ? "default" :
                                  order.status === "Processing" ? "secondary" :
                                  order.status === "Pending" ? "outline" : "secondary"
                                }
                                className="text-xs"
                              >
                                {order.status || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {realOrdersData.length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            No orders found
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activities */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Recent Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {realOrdersData.slice(0, 4).map((order, index) => (
                          <div key={order._id || index} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {(order.user?.firstName?.charAt(0) || 'U') + (order.user?.lastName?.charAt(0) || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="text-sm text-gray-800">
                                <span className="font-medium">
                                  {order.user?.firstName || 'Unknown'} {order.user?.lastName || 'User'}
                                </span> placed an order for{" "}
                                <span className="text-pink-600">
                                  {order.items?.length || 0} item(s)
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {order.orderedAt ? 
                                  (() => {
                                    const orderDate = new Date(order.orderedAt);
                                    const now = new Date();
                                    const diffHours = Math.floor((now - orderDate) / (1000 * 60 * 60));
                                    if (diffHours < 24) return `${diffHours} hours ago`;
                                    const diffDays = Math.floor(diffHours / 24);
                                    return `${diffDays} days ago`;
                                  })() : 'Recently'
                                }
                              </div>
                            </div>
                          </div>
                        ))}
                        {realOrdersData.length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            No recent activities
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Events */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-800">Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {upcomingEvents.map((event, index) => (
                        <Card key={index} className="bg-gray-50 border-gray-200">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="font-medium text-gray-800">{event.event}</div>
                              <div className="text-sm text-gray-500">Client: {event.client}</div>
                              <div className="text-sm text-gray-500">Date: {event.date}</div>
                              <Badge
                                variant={
                                  event.status === "Confirmed"
                                    ? "default"
                                    : event.status === "Pending"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {event.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Mobile Tab Content */}
          <div className="md:hidden">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Secondary Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="text-sm text-gray-500 mb-1">Total Products</div>
                      <div className="text-xl font-bold text-gray-800">{salesMetrics.totalProducts}</div>
                      <div className="text-xs text-green-600 mt-1">In database</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="text-sm text-gray-500 mb-1">Total Users</div>
                      <div className="text-xl font-bold text-gray-800">{salesMetrics.totalUsers}</div>
                      <div className="text-xs text-green-600 mt-1">Registered</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Popular Products */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-gray-800 text-lg">Popular Products</CardTitle>
                      <span className="text-xs text-gray-500">Current stock</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                      {realProductsData.slice(0, 3).map((product, index) => (
                        <div key={product._id || index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-green-500' : 
                              index === 1 ? 'bg-purple-500' : 'bg-amber-500'
                            }`}></div>
                            <div>
                              <div className="text-gray-800 font-medium">{product.name}</div>
                              <div className="text-xs text-gray-500">
                                Price: ${product.salePrice || product.retailPrice || 0}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              product.stock > 20 ? "default" :
                              product.stock > 0 ? "secondary" : "destructive"
                            }
                            className="text-xs"
                          >
                            {product.stock > 20 ? "In Stock" : 
                             product.stock > 0 ? "Low Stock" : "Out of Stock"}
                          </Badge>
                        </div>
                      ))}
                      {realProductsData.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          No products found
                        </div>
                      )}
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
                        <BarChart data={realSalesData.length > 0 ? realSalesData.slice(0, 6) : salesData.slice(0, 6)}>
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

            {activeTab === "reports" && (
              <div className="space-y-6">
                {/* Report Controls - Mobile */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-gray-800 text-lg">Report Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-wrap gap-3">
                      <Select value={reportPeriod} onValueChange={setReportPeriod}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Regions</SelectItem>
                          <SelectItem value="downtown">Downtown</SelectItem>
                          <SelectItem value="suburbs">Suburbs</SelectItem>
                          <SelectItem value="mall">Mall District</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sales Reports - Mobile */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-gray-800 text-lg">Sales Reports</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getSalesDataByPeriod().slice(0, 6)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis
                            dataKey={
                              reportPeriod === "daily"
                                ? "day"
                                : reportPeriod === "weekly"
                                  ? "week"
                                  : reportPeriod === "yearly"
                                    ? "year"
                                    : "month"
                            }
                            stroke="#6B7280"
                          />
                          <YAxis stroke="#6B7280" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E5E7EB",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stackId="1"
                            stroke="#10B981"
                            fill="#10B981"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Category-wise Revenue - Mobile */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-gray-800 text-lg">Category Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                      {categoryRevenueData.map((category, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">{category.category}</span>
                            <span className="text-sm text-gray-800">${category.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={category.percentage} className="flex-1 h-2" />
                            <span className="text-xs text-gray-500 w-10">{category.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-6">
                {/* Product Categories - Mobile */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-gray-800 text-lg">Product Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-1 gap-3">
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-3 flex items-center gap-3">
                          <Gift className="h-8 w-8 text-pink-500" />
                          <div>
                            <div className="font-medium">Birthday Gifts</div>
                            <div className="text-sm text-gray-500">42 products</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-3 flex items-center gap-3">
                          <Package className="h-8 w-8 text-purple-500" />
                          <div>
                            <div className="font-medium">Party Equipment</div>
                            <div className="text-sm text-gray-500">18 products</div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-3 flex items-center gap-3">
                          <Sparkles className="h-8 w-8 text-amber-500" />
                          <div>
                            <div className="font-medium">Wedding Decorations</div>
                            <div className="text-sm text-gray-500">32 services</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Stock Status - Mobile */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-gray-800 text-lg">Stock Status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                      {realProductsData.slice(0, 6).map((product, index) => (
                        <div key={product._id || index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-700">{product.name}</span>
                            <span className={`text-sm ${
                              product.stock < 10 ? "text-red-600 font-medium" : "text-gray-800"
                            }`}>
                              {product.stock || 0}{product.stock < 10 && " (Low)"}
                            </span>
                          </div>
                          <Progress
                            value={Math.min((product.stock || 0), 100)}
                            className="h-2"
                          />
                        </div>
                      ))}
                      {realProductsData.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          No products found
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "activities" && (
              <div className="space-y-6">
                {/* Recent Orders - Mobile */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-gray-800 text-lg">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                      {realOrdersData.slice(0, 4).map((order, index) => (
                        <div key={order._id || index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-gray-800">
                              {order.user?.firstName || 'Unknown'} {order.user?.lastName || 'User'}
                            </div>
                            <div className="font-medium text-gray-800">
                              ${order.totalAmount?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {order._id?.slice(-6) || 'N/A'} • {new Date(order.orderedAt || order.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">{order.items?.length || 0} item(s)</div>
                            <Badge
                              variant={
                                order.status === "Delivered" ? "default" :
                                order.status === "Processing" ? "secondary" : "outline"
                              }
                              className="text-xs"
                            >
                              {order.status || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {realOrdersData.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          No orders found
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activities - Mobile */}
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-gray-800 text-lg">Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                      {realOrdersData.slice(0, 4).map((order, index) => (
                        <div key={order._id || index} className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {(order.user?.firstName?.charAt(0) || 'U') + (order.user?.lastName?.charAt(0) || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm text-gray-800">
                              <span className="font-medium">
                                {order.user?.firstName || 'Unknown'} {order.user?.lastName || 'User'}
                              </span> placed an order for{" "}
                              <span className="text-pink-600">
                                {order.items?.length || 0} item(s)
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {order.orderedAt ? 
                                (() => {
                                  const orderDate = new Date(order.orderedAt);
                                  const now = new Date();
                                  const diffHours = Math.floor((now - orderDate) / (1000 * 60 * 60));
                                  if (diffHours < 24) return `${diffHours} hours ago`;
                                  const diffDays = Math.floor(diffHours / 24);
                                  return `${diffDays} days ago`;
                                })() : 'Recently'
                              }
                            </div>
                          </div>
                        </div>
                      ))}
                      {realOrdersData.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          No recent activities
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Low Stock & Out of Stock Products</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {lowStockProducts.length} products need attention
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowLowStockModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Stock Status:</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Low Stock</SelectItem>
                      <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      <SelectItem value="critical">Critical (≤5)</SelectItem>
                      <SelectItem value="low">Low (6-20)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Category:</label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Gifts">Gifts</SelectItem>
                      <SelectItem value="Rentals">Rentals</SelectItem>
                      <SelectItem value="Decorations">Decorations</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Export List
                </Button>
              </div>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-sm font-medium text-gray-700 pb-3">Product</th>
                      <th className="text-left text-sm font-medium text-gray-700 pb-3">SKU</th>
                      <th className="text-left text-sm font-medium text-gray-700 pb-3">Category</th>
                      <th className="text-left text-sm font-medium text-gray-700 pb-3">Stock</th>
                      <th className="text-left text-sm font-medium text-gray-700 pb-3">Status</th>
                      <th className="text-left text-sm font-medium text-gray-700 pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 text-gray-800 font-medium">{product.product}</td>
                        <td className="py-4 text-gray-600">{product.sku}</td>
                        <td className="py-4 text-gray-600">{product.category}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              product.stock === 0 ? 'text-red-600' : 
                              product.stock <= 5 ? 'text-orange-600' : 'text-amber-600'
                            }`}>
                              {product.stock}
                            </span>
                            <div className="w-20">
                              <Progress 
                                value={Math.min((product.stock / 100) * 100, 100)} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge 
                            variant={
                              product.stock === 0 ? "destructive" : 
                              product.stock <= 5 ? "secondary" : "outline"
                            }
                            className={
                              product.stock === 0 ? "bg-red-100 text-red-700 border-red-200" :
                              product.stock <= 5 ? "bg-orange-100 text-orange-700 border-orange-200" :
                              "bg-amber-100 text-amber-700 border-amber-200"
                            }
                          >
                            {product.stock === 0 ? "Out of Stock" : 
                             product.stock <= 5 ? "Critical" : "Low Stock"}
                          </Badge>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Package className="h-3 w-3 mr-1" />
                              Restock
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {lowStockProducts.filter(p => p.stock === 0).length}
                    </div>
                    <div className="text-sm text-gray-600">Out of Stock</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {lowStockProducts.filter(p => p.stock > 0 && p.stock <= 5).length}
                    </div>
                    <div className="text-sm text-gray-600">Critical</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      {lowStockProducts.filter(p => p.stock > 5 && p.stock <= 20).length}
                    </div>
                    <div className="text-sm text-gray-600">Low Stock</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {lowStockProducts.length}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

