"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock, Package, Truck, CheckCircle } from "lucide-react"

export default function DeliveryRoute({ orders = [] }) {
  const [route, setRoute] = useState([])
  const [optimized, setOptimized] = useState(false)
  const [totalDistance, setTotalDistance] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)

  // Mock route optimization - in real app, this would call a routing API
  const optimizeRoute = () => {
    const pendingOrders = orders.filter(order => 
      order.status === 'Pending' || order.status === 'Shipped'
    )
    
    // Simple optimization: sort by distance from warehouse (mock)
    const optimizedRoute = pendingOrders.sort((a, b) => {
      // Mock distance calculation
      const distanceA = Math.random() * 10
      const distanceB = Math.random() * 10
      return distanceA - distanceB
    })
    
    setRoute(optimizedRoute)
    setOptimized(true)
    setTotalDistance(optimizedRoute.length * 2.5) // Mock calculation
    setEstimatedTime(optimizedRoute.length * 15) // 15 minutes per delivery
  }

  const startRoute = () => {
    alert('Route started! Navigate to first delivery location.')
  }

  const completeDelivery = (orderId) => {
    setRoute(prev => prev.filter(order => order._id !== orderId))
    alert(`Delivery completed for order ${orderId}`)
  }

  useEffect(() => {
    if (orders.length > 0) {
      optimizeRoute()
    }
  }, [orders])

  return (
    <div className="space-y-6 px-2 md:px-0">
      {/* Route Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Navigation className="w-5 h-5" />
            <span>Delivery Route</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg flex flex-col items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{route.length}</div>
              <div className="text-sm text-gray-600">Deliveries</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg flex flex-col items-center justify-center">
              <Navigation className="w-6 h-6 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{totalDistance.toFixed(1)} km</div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg flex flex-col items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">{estimatedTime} min</div>
              <div className="text-sm text-gray-600">Est. Time</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={optimizeRoute} variant="outline" className="flex items-center space-x-2 w-full sm:w-auto">
              <Navigation className="w-4 h-4" />
              <span>Re-optimize Route</span>
            </Button>
            <Button onClick={startRoute} className="flex items-center space-x-2 w-full sm:w-auto">
              <Truck className="w-4 h-4" />
              <span>Start Route</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Route Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Route Steps</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {route.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No pending deliveries for route optimization</p>
            </div>
          ) : (
            <div className="space-y-3">
              {route.map((order, index) => (
                <div key={order._id || order.id} className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 mb-2 sm:mb-0">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Order #{order._id?.slice(-8) || order.id}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.user?.firstName} {order.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{order.user?.address}</p>
                      </div>
                      <div className="text-right mt-2 sm:mt-0">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          {order.status}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          ${order.total?.toFixed(2) || order.amount?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-2 sm:mt-0">
                    <Button
                      onClick={() => completeDelivery(order._id || order.id)}
                      size="sm"
                      className="flex items-center space-x-1 w-full sm:w-auto"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
