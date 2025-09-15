"use client"

import { useState, useEffect } from "react"
import { useLoading } from '../../hooks/useLoading'
import Loader from '../../components/loader/page'
import { DashboardOverview } from "./dashboard-overview"
import { OrdersList } from "./orders-list"
import { OrderDetails } from "./order-details"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"

// Mock data for orders
const mockOrders = [
  {
    id: "12345",
    customerName: "John Doe",
    customerEmail: "john../../..example.com",
    customerPhone: "+1 (555) 123-4567",
    alternatePhone: "+1 (555) 123-4568",
    date: "2025-06-10",
    time: "14:30",
    status: "Pending",
    paymentStatus: "Paid",
    total: 59.99,
    shippingMethod: "Standard",
    trackingNumber: "",
    internalNotes: "Customer requested careful packaging",
    deliveryInstructions: "Ring doorbell twice. Leave at door if no answer.",
    orderNotes: "First time customer - provide excellent service",
    shippingAddress: {
      street: "123 Main St, Apt 4B",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
      landmark: "Near Central Park, Blue building",
    },
    billingAddress: {
      street: "123 Main St, Apt 4B",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
    },
    paymentMethod: "Credit Card (**** 1234)",
    items: [
      { name: "Wireless Headphones", variant: "Black", quantity: 1, price: 49.99, sku: "WH-001" },
      { name: "Phone Case", variant: "Clear", quantity: 1, price: 10.0, sku: "PC-002" },
    ],
    subtotal: 59.99,
    shipping: 0.0,
    tax: 0.0,
  },
  {
    id: "12346",
    customerName: "Jane Smith",
    customerEmail: "jane../../..example.com",
    customerPhone: "+1 (555) 987-6543",
    date: "2025-06-10",
    time: "13:15",
    status: "Processing",
    paymentStatus: "Paid",
    total: 129.99,
    shippingMethod: "Express",
    trackingNumber: "1Z999AA1234567890",
    internalNotes: "Customer requested expedited processing",
    shippingAddress: {
      street: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zip: "90210",
      country: "USA",
    },
    billingAddress: {
      street: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zip: "90210",
      country: "USA",
    },
    paymentMethod: "PayPal",
    items: [{ name: "Bluetooth Speaker", variant: "Blue", quantity: 1, price: 129.99 }],
    subtotal: 129.99,
    shipping: 0.0,
    tax: 0.0,
  },
  {
    id: "12347",
    customerName: "Mike Johnson",
    customerEmail: "mike../../..example.com",
    customerPhone: "+1 (555) 456-7890",
    date: "2025-06-09",
    time: "16:45",
    status: "Completed",
    paymentStatus: "Paid",
    total: 89.99,
    shippingMethod: "Standard",
    trackingNumber: "1Z999AA1234567891",
    internalNotes: "",
    shippingAddress: {
      street: "789 Pine St",
      city: "Chicago",
      state: "IL",
      zip: "60601",
      country: "USA",
    },
    billingAddress: {
      street: "789 Pine St",
      city: "Chicago",
      state: "IL",
      zip: "60601",
      country: "USA",
    },
    paymentMethod: "Credit Card (**** 5678)",
    items: [{ name: "Smart Watch", variant: "Silver", quantity: 1, price: 89.99 }],
    subtotal: 89.99,
    shipping: 0.0,
    tax: 0.0,
  },
  {
    id: "12348",
    customerName: "Sarah Wilson",
    customerEmail: "sarah../../..example.com",
    customerPhone: "+1 (555) 321-0987",
    date: "2025-06-09",
    time: "11:20",
    status: "Cancelled",
    paymentStatus: "Refunded",
    total: 39.99,
    shippingMethod: "Standard",
    trackingNumber: "",
    internalNotes: "Customer requested cancellation due to change of mind",
    shippingAddress: {
      street: "321 Elm St",
      city: "Miami",
      state: "FL",
      zip: "33101",
      country: "USA",
    },
    billingAddress: {
      street: "321 Elm St",
      city: "Miami",
      state: "FL",
      zip: "33101",
      country: "USA",
    },
    paymentMethod: "Credit Card (**** 9012)",
    items: [{ name: "Phone Charger", variant: "White", quantity: 1, price: 39.99 }],
    subtotal: 39.99,
    shipping: 0.0,
    tax: 0.0,
  },
  {
    id: "12349",
    customerName: "David Brown",
    customerEmail: "david../../..example.com",
    customerPhone: "+1 (555) 654-3210",
    date: "2025-06-12",
    time: "09:15",
    status: "Pending",
    paymentStatus: "Unpaid",
    total: 199.99,
    shippingMethod: "Express",
    trackingNumber: "",
    internalNotes: "Payment pending - follow up required",
    shippingAddress: {
      street: "654 Maple Dr",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      country: "USA",
    },
    billingAddress: {
      street: "654 Maple Dr",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      country: "USA",
    },
    paymentMethod: "Bank Transfer",
    items: [{ name: "Laptop Stand", variant: "Aluminum", quantity: 1, price: 199.99 }],
    subtotal: 199.99,
    shipping: 0.0,
    tax: 0.0,
  },
  {
    id: "12350",
    customerName: "Lisa Garcia",
    customerEmail: "lisa../../..example.com",
    customerPhone: "+1 (555) 789-0123",
    date: "2025-06-12",
    time: "15:45",
    status: "Processing",
    paymentStatus: "Paid",
    total: 79.99,
    shippingMethod: "Standard",
    trackingNumber: "1Z999AA1234567892",
    internalNotes: "Rush order - priority processing",
    shippingAddress: {
      street: "789 Cedar Ln",
      city: "Austin",
      state: "TX",
      zip: "73301",
      country: "USA",
    },
    billingAddress: {
      street: "789 Cedar Ln",
      city: "Austin",
      state: "TX",
      zip: "73301",
      country: "USA",
    },
    paymentMethod: "Credit Card (**** 3456)",
    items: [{ name: "Wireless Mouse", variant: "Black", quantity: 2, price: 39.99 }],
    subtotal: 79.98,
    shipping: 0.01,
    tax: 0.0,
  },
]

export default function OrderManagement() {
  const { loading, withLoading } = useLoading();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      await withLoading(async () => {
        try {
          // Replace with actual API call
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`);
          const data = await response.json();
          setOrders(data);
        } catch (error) {
          console.error('Error fetching orders:', error);
          // Fallback to mock data if API fails
          setOrders(mockOrders);
        }
      });
    };

    fetchOrders();
  }, [withLoading]);

  const handleOrderUpdate = async (orderId, updates) => {
    await withLoading(async () => {
      try {
        // Replace with actual API call
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, ...updates } : order
          )
        );
      } catch (error) {
        console.error('Error updating order:', error);
      }
    });
  };

  const handleBulkUpdate = async (orderIds, updates) => {
    await withLoading(async () => {
      try {
        // Replace with actual API call
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/bulk-update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIds, updates }),
        });
        
        setOrders(prevOrders => 
          prevOrders.map(order => 
            orderIds.includes(order.id) ? { ...order, ...updates } : order
          )
        );
      } catch (error) {
        console.error('Error bulk updating orders:', error);
      }
    });
  };

  const handleOrderDelete = async (orderIds) => {
    await withLoading(async () => {
      try {
        // Replace with actual API call
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/bulk-delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIds }),
        });
        
        setOrders(prevOrders => 
          prevOrders.filter(order => !orderIds.includes(order.id))
        );
      } catch (error) {
        console.error('Error deleting orders:', error);
      }
    });
  };

  return (
    <>
      {loading && <Loader />}
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DashboardOverview orders={orders} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersList
              orders={orders}
              onOrderSelect={setSelectedOrderId}
              onOrderUpdate={handleOrderUpdate}
              onBulkUpdate={handleBulkUpdate}
              onOrderDelete={handleOrderDelete}
            />
          </TabsContent>
        </Tabs>

        {selectedOrderId && (
          <OrderDetails
            order={orders.find((o) => o.id === selectedOrderId)}
            onClose={() => setSelectedOrderId(null)}
            onUpdate={(updates) => handleOrderUpdate(selectedOrderId, updates)}
            onDelete={() => {
              handleOrderDelete([selectedOrderId])
              setSelectedOrderId(null)
            }}
          />
        )}
      </div>
    </>
  );
}
