"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, Package } from "lucide-react"

export default function DeliveryAnalytics({ stats, orders = [] }) {
  const [timeRange, setTimeRange] = useState("week")
  const [analytics, setAnalytics] = useState({
    deliveryRate: 0,
    avgDeliveryTime: 0,
    customerSatisfaction: 0,
    onTimeDeliveries: 0
  })

  // Mock analytics calculation
  useEffect(() => {
    const calculateAnalytics = () => {
      const totalDeliveries = orders.filter(o => o.status === 'Delivered').length
      const totalOrders = orders.length
      const deliveryRate = totalOrders > 0 ? (totalDeliveries / totalOrders) * 100 : 0
      
      // Mock calculations for demo
      setAnalytics({
        deliveryRate: Math.round(deliveryRate),
        avgDeliveryTime: 45, // minutes
        customerSatisfaction: 4.8, // out of 5
        onTimeDeliveries: Math.round(totalDeliveries * 0.85)
      })
    }

    calculateAnalytics()
  }, [orders, timeRange])

  const performanceMetrics = [
    {
      title: "Delivery Rate",
      value: `${analytics.deliveryRate}%`,
      change: "+5.2%",
      trend: "up",
      icon: Package,
      color: "text-green-600"
    },
    {
      title: "Avg Delivery Time",
      value: `${analytics.avgDeliveryTime} min`,
      change: "-8 min",
      trend: "down",
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "Customer Rating",
      value: `${analytics.customerSatisfaction}/5`,
      change: "+0.3",
      trend: "up",
      icon: CheckCircle,
      color: "text-purple-600"
    },
    {
      title: "On-Time Deliveries",
      value: `${analytics.onTimeDeliveries}`,
      change: "+12",
      trend: "up",
      icon: AlertCircle,
      color: "text-orange-600"
    }
  ]

  return (
    <div className="space-y-6 px-2 md:px-0">
      {/* Time Range Selector */}
  <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Metrics */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => {
          const Icon = metric.icon
          const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <TrendIcon className={`w-3 h-3 ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`} />
                      <span className={`text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg bg-gray-100`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Performance */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Delivery Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: "Delivered", count: stats.deliveredOrders, color: "bg-green-500" },
                { status: "In Transit", count: stats.inTransitOrders, color: "bg-blue-500" },
                { status: "Pending", count: stats.pendingOrders, color: "bg-yellow-500" },
                { status: "Cancelled", count: stats.cancelledOrders, color: "bg-red-500" }
              ].map((item, index) => {
                const percentage = stats.totalOrders > 0 ? (item.count / stats.totalOrders) * 100 : 0
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.status}</span>
                      <span className="text-gray-600">{item.count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Generate Delivery Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                View Delivery History
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Export Performance Data
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <AlertCircle className="w-4 h-4 mr-2" />
                View Customer Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
