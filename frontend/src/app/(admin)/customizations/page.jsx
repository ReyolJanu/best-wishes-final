"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Image from 'next/image';

export default function CustomizationsPage() {
  const [customizations, setCustomizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchCustomizations = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (status !== 'all') {
        params.append('status', status);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customizations/admin/all?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setCustomizations(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching customizations:', error);
      toast.error('Failed to load customizations');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (customizationId, newStatus) => {
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customizations/admin/${customizationId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Status updated successfully');
        fetchCustomizations(pagination.page, filter);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  useEffect(() => {
    fetchCustomizations(1, filter);
  }, [filter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-production': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Customization Management</h1>
        
        {/* Filter tabs */}
        <div className="flex space-x-1 mb-4">
          {['all', 'draft', 'confirmed', 'in-production', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : customizations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No customizations found</p>
        </div>
      ) : (
        <>
          {/* Customizations grid */}
          <div className="grid gap-6">
            {customizations.map((customization) => (
              <div key={customization._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    {customization.product?.images?.[0] && (
                      <Image
                        src={customization.product.images[0].url || customization.product.images[0]}
                        alt={customization.product.name}
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{customization.product?.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{customization.customizationType?.replace('-', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        Customer: {customization.user?.firstName} {customization.user?.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(customization.status)}`}>
                      {customization.status.replace('-', ' ')}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(customization.createdAt)}</p>
                  </div>
                </div>

                {/* Customization details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  {customization.selectedQuote && (
                    <div className="mb-3">
                      <p className="font-medium text-sm text-gray-700 mb-1">Selected Quote:</p>
                      <p className="text-sm bg-white p-2 rounded border italic">
                        "{customization.selectedQuote.text}"
                      </p>
                    </div>
                  )}
                  
                  {customization.customMessage && (
                    <div className="mb-3">
                      <p className="font-medium text-sm text-gray-700 mb-1">Custom Message:</p>
                      <p className="text-sm bg-white p-2 rounded border">
                        {customization.customMessage}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Font:</span>
                      <p>{customization.fontStyle || 'Arial'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Size:</span>
                      <p>{customization.fontSize || 14}px</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Color:</span>
                      <div className="flex items-center space-x-1">
                        <div 
                          className="w-4 h-4 rounded border" 
                          style={{ backgroundColor: customization.fontColor || '#000000' }}
                        ></div>
                        <span>{customization.fontColor || '#000000'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Price:</span>
                      <p className="font-semibold">£{customization.price?.toFixed(2)}</p>
                    </div>
                  </div>

                  {customization.specialInstructions && (
                    <div className="mt-3">
                      <p className="font-medium text-sm text-gray-700 mb-1">Special Instructions:</p>
                      <p className="text-sm bg-white p-2 rounded border">
                        {customization.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview image */}
                {customization.previewImage && (
                  <div className="mb-4">
                    <p className="font-medium text-sm text-gray-700 mb-2">Preview:</p>
                    <Image
                      src={customization.previewImage}
                      alt="Customization Preview"
                      width={200}
                      height={200}
                      className="border rounded-lg"
                    />
                  </div>
                )}

                {/* Order info */}
                {customization.order && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Order: #{customization.order.orderNumber || customization.order._id?.slice(-8)}
                    </p>
                    <p className="text-sm text-blue-600">
                      Status: {customization.order.status}
                    </p>
                  </div>
                )}

                {/* Status update buttons */}
                <div className="flex space-x-2">
                  {customization.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(customization._id, 'in-production')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      Start Production
                    </button>
                  )}
                  {customization.status === 'in-production' && (
                    <button
                      onClick={() => updateStatus(customization._id, 'completed')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Mark Completed
                    </button>
                  )}
                  {['confirmed', 'in-production'].includes(customization.status) && (
                    <button
                      onClick={() => updateStatus(customization._id, 'cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center space-x-2">
              <button
                onClick={() => fetchCustomizations(Math.max(1, pagination.page - 1), filter)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchCustomizations(Math.min(pagination.pages, pagination.page + 1), filter)}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}