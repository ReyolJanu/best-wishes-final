"use client"

import React, { useState, useEffect } from "react"
import { useLoading } from '../../hooks/useLoading'
import Loader from '../../components/loader/page'
import { DashboardOverview } from "../../(admin)/ordermanagment/dashboard-overview"
import { OrdersList } from "../../(admin)/ordermanagment/orders-list"
import { OrderDetails } from "../../(admin)/ordermanagment/order-details"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"

export default function InventoryOrderManagement() {
  const { loading, withLoading } = useLoading();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      await withLoading(async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/all`, {
            method: 'GET',
            credentials: 'include', // Include cookies for authentication
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setOrders(data.orders || []);
            } else {
              console.error('Failed to fetch orders:', data.message);
              setOrders([]);
            }
          } else {
            console.error('Failed to fetch orders, status:', response.status);
            setOrders([]);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          setOrders([]);
        }
      });
    };

    fetchOrders();
  }, [withLoading]);

  const handleOrderUpdate = async (orderId, updates) => {
    await withLoading(async () => {
      try {
        let endpoint = '';
        
        // Determine the correct endpoint based on the status update
        if (updates.status === 'Packing') {
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/orders/update-to-packing`;
        } else if (updates.status === 'Shipped') {
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/orders/update-to-shipped`;
        } else if (updates.status === 'Delivered') {
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/orders/update-to-delivered`;
        }

        if (endpoint) {
          const response = await fetch(endpoint, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId }),
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              // Update local state
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order._id === orderId ? { ...order, ...updates } : order
                )
              );
            } else {
              console.error('Failed to update order:', result.message);
            }
          } else {
            console.error('Failed to update order, status:', response.status);
          }
        }
      } catch (error) {
        console.error('Error updating order:', error);
      }
    });
  };

  const handleBulkUpdate = async (orderIds, updates) => {
    // For now, update orders one by one since we don't have a bulk update endpoint
    await withLoading(async () => {
      try {
        for (const orderId of orderIds) {
          await handleOrderUpdate(orderId, updates);
        }
      } catch (error) {
        console.error('Error bulk updating orders:', error);
      }
    });
  };

  const handleOrderDelete = async (orderIds) => {
    await withLoading(async () => {
      try {
        for (const orderId of orderIds) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (response.ok) {
            setOrders(prevOrders => 
              prevOrders.filter(order => order._id !== orderId)
            );
          } else {
            console.error('Failed to delete order:', orderId);
          }
        }
      } catch (error) {
        console.error('Error deleting orders:', error);
      }
    });
  };

  return (
    <>
      {loading && <Loader />}
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-gray-600">Manage orders, update statuses, and track deliveries</p>
          </div>
        </div>

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
            order={orders.find((o) => (o._id || o.id) === selectedOrderId)}
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