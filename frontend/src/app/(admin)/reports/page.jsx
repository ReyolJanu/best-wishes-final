"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  Package,
  Download,
  Send,
  RefreshCw,
  PieChart as PieChartIcon,
  ShoppingBag,
  Calendar,
  FileText,
  ArrowLeft,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ReportsAnalytics() {
  const [orders, setOrders] = useState([])
  const [reportDateRange, setReportDateRange] = useState("last30days")
  const [reportFromDate, setReportFromDate] = useState("")
  const [reportToDate, setReportToDate] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)

  // Analytics calculation function
  const getAnalyticsData = () => {
    if (!orders || orders.length === 0) return null;

    const now = new Date();
    let startDate;

    // Calculate date range based on selection
    switch (reportDateRange) {
      case "last7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "last30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "last90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        startDate = reportFromDate ? new Date(reportFromDate) : new Date(0);
        const endDate = reportToDate ? new Date(reportToDate) : now;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= startDate && orderDate <= now;
    });

    // Basic metrics
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status breakdown
    const statusBreakdown = filteredOrders.reduce((acc, order) => {
      const status = order.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Daily sales data for charts
    const dailySales = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.orderDate).toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { date, orders: 0, revenue: 0 };
      }
      dailySales[date].orders += 1;
      dailySales[date].revenue += order.totalAmount;
    });

    const chartData = Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Top products
    const productSales = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusBreakdown,
      chartData,
      topProducts,
      filteredOrders
    };
  };

  // PDF generation function
  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const analyticsData = getAnalyticsData();
      if (!analyticsData) {
        alert("No data available for the selected period");
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(102, 126, 234);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('🎁 GIFT COMMERCE', 20, 25);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Order Analytics & Performance Report', 20, 35);

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Report metadata
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 55);
      doc.text(`Report Period: ${reportDateRange.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`, 20, 65);
      
      // Summary metrics
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('📊 Key Performance Metrics', 20, 85);

      // Create metrics boxes
      const metrics = [
        { label: 'Total Orders', value: analyticsData.totalOrders.toString(), x: 20, y: 95 },
        { label: 'Total Revenue', value: `£${analyticsData.totalRevenue.toFixed(2)}`, x: 110, y: 95 },
        { label: 'Average Order Value', value: `£${analyticsData.averageOrderValue.toFixed(2)}`, x: 20, y: 115 },
        { label: 'Completion Rate', value: `${((analyticsData.statusBreakdown.delivered || 0) / analyticsData.totalOrders * 100).toFixed(1)}%`, x: 110, y: 115 }
      ];

      metrics.forEach(metric => {
        doc.setFillColor(248, 249, 250);
        doc.rect(metric.x, metric.y, 80, 15, 'F');
        doc.setFontSize(10);
        doc.text(metric.label, metric.x + 2, metric.y + 6);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.value, metric.x + 2, metric.y + 12);
        doc.setFont('helvetica', 'normal');
      });

      // Status breakdown
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('📋 Order Status Breakdown', 20, 145);

      let yPos = 155;
      Object.entries(analyticsData.statusBreakdown).forEach(([status, count]) => {
        const percentage = (count / analyticsData.totalOrders * 100).toFixed(1);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${status.toUpperCase()}:`, 25, yPos);
        doc.text(`${count} orders (${percentage}%)`, 80, yPos);
        yPos += 8;
      });

      // Top products table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('🏆 Top Performing Products', 20, yPos + 10);

      const tableData = analyticsData.topProducts.slice(0, 10).map((product, index) => [
        index + 1,
        product.name,
        product.quantity,
        `£${product.revenue.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: yPos + 20,
        head: [['Rank', 'Product Name', 'Qty Sold', 'Revenue']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { cellWidth: 80 },
          2: { halign: 'center', cellWidth: 25 },
          3: { halign: 'right', cellWidth: 30 }
        }
      });

      // Add new page for detailed orders
      doc.addPage();
      
      // Detailed orders table
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('📝 Detailed Order History', 20, 30);

      const orderTableData = analyticsData.filteredOrders.slice(0, 50).map(order => [
        order.referenceCode,
        order.customerName,
        new Date(order.orderDate).toLocaleDateString(),
        order.status.toUpperCase(),
        `£${order.totalAmount.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: 40,
        head: [['Order ID', 'Customer', 'Date', 'Status', 'Amount']],
        body: orderTableData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { halign: 'right', cellWidth: 25 }
        }
      });

      // Footer
      const finalY = doc.lastAutoTable.finalY || 200;
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text('Generated by Gift Commerce Admin System', 20, finalY + 20);
      doc.text(`Page 1-2 | Total Orders Analyzed: ${analyticsData.totalOrders}`, 20, finalY + 30);

      // Save the PDF
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Gift_Commerce_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      alert('PDF report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Email sending function
  const sendReportEmail = async () => {
    if (!adminEmail) {
      alert('Please enter an email address');
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const analyticsData = getAnalyticsData();
      if (!analyticsData) {
        alert("No data available for the selected period");
        return;
      }

      // Generate PDF as base64
      const doc = new jsPDF();
      // Use the same PDF generation logic as above
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Send email with PDF attachment
      const response = await axios.post(`${API_BASE_URL}/send-report-email`, {
        email: adminEmail,
        reportData: analyticsData,
        pdfData: pdfBase64,
        reportPeriod: reportDateRange
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        alert(`Report successfully sent to ${adminEmail}!`);
        setEmailDialogOpen(false);
        setAdminEmail('');
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Fetch orders data
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/orders/all`, {
          withCredentials: true
        })

        if (!response.data.orders || response.data.orders.length === 0) {
          setOrders([]);
          return;
        }

        const ordersData = response.data.orders.map((order) => ({
          id: order._id,
          _id: order._id,
          orderDate: order.orderedAt,
          status: order.status.toLowerCase(),
          totalAmount: order.total,
          user: order.user || {},
          items: order.items?.map((item, index) => ({
            name: item.name || 'Unknown Product',
            price: item.price || 0,
            quantity: item.quantity || 1,
          })) || [],
          referenceCode: `REF-${order._id.slice(-6)}`,
          customerName: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Unknown Customer',
        }))
        
        setOrders(ordersData)
      } catch (error) {
        console.error("Error fetching all orders:", error)
      }
    }

    fetchAllOrders()
  }, [])

  const analyticsData = getAnalyticsData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Reports & Analytics</h1>
              <p className="text-sm text-gray-600">Comprehensive business insights and performance metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Real-time Data
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Report Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="dateRange">Date Range</Label>
                <Select value={reportDateRange} onValueChange={setReportDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="last90days">Last 90 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {reportDateRange === "custom" && (
                <>
                  <div>
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input
                      type="date"
                      value={reportFromDate}
                      onChange={(e) => setReportFromDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="toDate">To Date</Label>
                    <Input
                      type="date"
                      value={reportToDate}
                      onChange={(e) => setReportToDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={generatePDFReport}
                  disabled={isGeneratingPDF}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGeneratingPDF ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate PDF
                    </>
                  )}
                </Button>
                
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Send className="h-4 w-4 mr-2" />
                      Email Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Report via Email</DialogTitle>
                      <DialogDescription>
                        Enter the email address where you want to send the analytics report PDF.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="adminEmail">Email Address</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          placeholder="admin@company.com"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={sendReportEmail}
                        disabled={isSendingEmail || !adminEmail}
                      >
                        {isSendingEmail ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Report
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        {!analyticsData ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No data available for the selected period</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{analyticsData.totalOrders}</p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">£{analyticsData.totalRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                      <p className="text-2xl font-bold">£{analyticsData.averageOrderValue.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                      <p className="text-2xl font-bold">
                        {((analyticsData.statusBreakdown.delivered || 0) / analyticsData.totalOrders * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sales Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
                        formatter={(value, name) => [
                          name === 'revenue' ? `£${value.toFixed(2)}` : value,
                          name === 'revenue' ? 'Revenue' : 'Orders'
                        ]}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.6}
                        name="Orders"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Order Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Order Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(analyticsData.statusBreakdown).map(([status, count]) => ({
                          name: status.charAt(0).toUpperCase() + status.slice(1),
                          value: count,
                          percentage: ((count / analyticsData.totalOrders) * 100).toFixed(1)
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {Object.entries(analyticsData.statusBreakdown).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            '#fbbf24', '#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#ef4444'
                          ][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Top Products Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Top Performing Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-center">Qty Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyticsData.topProducts.slice(0, 10).map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-center">
                            <Badge variant={index < 3 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-center">{product.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            £{product.revenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            £{(product.revenue / product.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}