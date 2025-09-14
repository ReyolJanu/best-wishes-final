import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Package, ShoppingBag, Gift, DollarSign, TrendingUp } from "lucide-react"

export function DashboardStats({ orders, startDate, endDate, allOrders }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          <CheckCircle className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {orders.filter((d) => d.status === "processing").length}
          </div>
          <p className="text-xs text-muted-foreground">Orders in the Accepted tab</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Packed</CardTitle>
          <Package className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {orders.filter((d) => d.status === "packing").length}
          </div>
          <p className="text-xs text-muted-foreground">Orders being packed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Delivery Orders</CardTitle>
          <Package className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {orders.filter((d) => d.status === "shipped").length}
          </div>
          <p className="text-xs text-muted-foreground">Orders being packed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingBag className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            {orders.filter((d) => d.status === "delivered").length}
          </div>
          <p className="text-xs text-muted-foreground">All delivered orders</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gift Orders</CardTitle>
          <Gift className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-pink-600">{orders.filter((d) => d.isGift).length}</div>
          <p className="text-xs text-muted-foreground">Special handling</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            £{(() => {
              if (startDate && endDate) {
                // When date filter is applied, filter by date range and delivered status
                return (allOrders || orders)
                  .filter((d) => {
                    const orderDate = new Date(d.orderDate);
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    return d.status === "delivered" && orderDate >= start && orderDate <= end;
                  })
                  .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
                  .toFixed(2);
              } else {
                // When no date filter, use all orders to show total revenue
                return (allOrders || orders)
                  .filter((d) => d.status === "delivered")
                  .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
                  .toFixed(2);
              }
            })()}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {startDate && endDate ? "Revenue from filtered period" : "Total revenue from all delivered orders"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
