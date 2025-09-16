"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { Modal, useConfirmModal } from "../../../components/ui/modal"

/**
 * Inventory Manager Product Dashboard Component
 * Uses the same logic as admin dashboard but with different navigation paths
 */
export default function InventoryProductDashboard() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterStock, setFilterStock] = useState("")
  const [loading, setLoading] = useState(true)
  const { isOpen, config, showDelete, showSuccess, showError, closeModal } = useConfirmModal()

  // Check URL parameters for automatic filtering
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const filterParam = urlParams.get('filter')
      
      if (filterParam === 'low-stock') {
        setFilterStock('low-stock')
      }
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [filterCategory, filterStatus, filterStock, searchTerm])

  useEffect(() => {
    if (typeof window !== "undefined") {
      fetchCategories()
    }
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
        stock: filterStock,
        limit: "1000",
      })
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${queryParams.toString()}`)
      const result = await response.json()
      console.log("Fetched data:", result)
      setProducts(Array.isArray(result.data) ? result.data : [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
      const result = await response.json()
      if (result.success) {
        setCategories(Array.isArray(result.data) ? result.data : [])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: "Out of Stock", color: "destructive" }
    if (stock < 10) return { label: "Low Stock", color: "secondary" }
    return { label: "In Stock", color: "default" }
  }

  const deleteProduct = async (id) => {
    showDelete(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, { 
            method: "DELETE",
            credentials: 'include'
          })
          if (response.ok) {
            showSuccess("Success", "Product deleted successfully!", () => {
              fetchProducts()
            })
          } else {
            showError("Error", "Failed to delete product. Please try again.")
          }
        } catch (error) {
          console.error("Error deleting product:", error)
          showError("Error", "An error occurred while deleting the product.")
        }
      }
    )
  }

  // Helper function to get product image
  const getProductImage = (product) => {
    if (product?.images && product.images.length > 0) {
      if (typeof product.images[0] === 'object' && product.images[0].url) {
        return product.images[0].url;
      }
      return product.images[0];
    }
    return '/placeholder.svg';
  };
  
  const handleImageError = (e) => {
    e.currentTarget.src = '/placeholder.svg';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Inventory Management</h1>
          {filterStock === 'low-stock' && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                🔔 Low Stock Filter Active
              </Badge>
              <span className="text-sm text-gray-600">
                Showing {products.length} low stock products
              </span>
            </div>
          )}
        </div>
        <Link href="/productsInventory/add">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.key} value={cat.key}>{cat.name}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setFilterCategory("")
                setFilterStatus("")
                setFilterStock("")
                // Clear URL parameter
                if (typeof window !== "undefined") {
                  const url = new URL(window.location.href)
                  url.searchParams.delete('filter')
                  window.history.replaceState({}, '', url.toString())
                }
              }}
              className="px-4 py-2"
            >
              {filterStock === 'low-stock' ? 'Clear Low Stock Filter' : 'Clear All Filters'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Summary */}
      {(searchTerm || filterCategory || filterStatus || filterStock) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-800">Active Filters:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchTerm}"
              </Badge>
            )}
            {filterCategory && (
              <Badge variant="secondary" className="text-xs">
                Category: {filterCategory}
              </Badge>
            )}
            {filterStatus && (
              <Badge variant="secondary" className="text-xs">
                Status: {filterStatus}
              </Badge>
            )}
            {filterStock && (
              <Badge variant="secondary" className="text-xs">
                Stock: {filterStock.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock)
          return (
            <Card key={product._id || product.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <Badge variant={stockStatus.color} className="absolute top-2 right-2">
                  {stockStatus.label}
                </Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 truncate">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold">${product.price}</span>
                  <Badge variant="outline">{product.mainCategory || product.category}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                  <div className="flex gap-2">
                    <Link href={`/productsInventory/${product._id || product.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => console.log("View product:", product._id || product.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/productsInventory/edit/${product._id || product.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteProduct(product._id || product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or add new products to get started</p>
        </div>
      )}

      {/* Custom Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        onCancel={closeModal}
        title={config.title}
        message={config.message}
        type={config.type}
        onConfirm={config.onConfirm}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        showCancel={config.showCancel}
      >
        {config.children}
      </Modal>
    </div>
  )
}