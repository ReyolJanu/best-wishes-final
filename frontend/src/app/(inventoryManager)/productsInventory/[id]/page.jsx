"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "../../../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card"
import { Badge } from "../../../../../components/ui/badge"
import { ArrowLeft, Edit, Trash2, Package, DollarSign, Tag, Eye } from "lucide-react"
import Link from "next/link"

export default function InventoryProductDetail() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`)
      const result = await response.json()
      if (result.success) {
        setProduct(result.data)
      } else {
        console.error("Failed to fetch product:", result.message)
      }
    } catch (error) {
      console.error("Error fetching product:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`, { 
          method: "DELETE",
          credentials: 'include'
        })
        if (response.ok) {
          router.push("/productsInventory")
        } else {
          alert("Failed to delete product")
        }
      } catch (error) {
        console.error("Error deleting product:", error)
        alert("Error deleting product")
      }
    }
  }

  // Helper function to get product image
  const getProductImage = (product, index = 0) => {
    if (product?.images && product.images.length > 0) {
      if (typeof product.images[index] === 'object' && product.images[index].url) {
        return product.images[index].url;
      }
      return product.images[index];
    }
    return '/placeholder.svg';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/productsInventory">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/productsInventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600">Product Details & Inventory Information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/productsInventory/edit/${product._id || product.id}`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </Button>
          </Link>
          <Button variant="destructive" onClick={deleteProduct}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Images */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square mb-4">
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = '/placeholder.svg';
                  }}
                />
              </div>
              {product.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((image, index) => (
                    <img
                      key={index}
                      src={getProductImage(product, index + 1)}
                      alt={`${product.name} ${index + 2}`}
                      className="aspect-square object-cover rounded"
                      onError={(e) => {
                        e.target.src = '/placeholder.svg';
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">SKU</p>
                <p className="font-medium">{product.sku}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <Badge variant="outline">{product.mainCategory || product.category}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge variant={product.status === "active" ? "default" : "secondary"}>
                  {product.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Short Description</p>
                <p>{product.shortDescription}</p>
              </div>
              {product.detailedDescription && (
                <div>
                  <p className="text-sm text-gray-600">Detailed Description</p>
                  <div dangerouslySetInnerHTML={{ __html: product.detailedDescription }} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Attributes */}
          {product.filters && Object.keys(product.filters).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Category Attributes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(product.filters).map(([attributeName, values]) => (
                  <div key={attributeName}>
                    <p className="text-sm text-gray-600 capitalize mb-2">
                      {attributeName.replace(/([A-Z])/g, ' $1').trim()}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(values) ? (
                        values.map((value, index) => (
                          <Badge key={index} variant="secondary">
                            {value}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">{values}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Cost Price:</span>
                <span>£{product.costPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Retail Price:</span>
                <span>£{product.retailPrice}</span>
              </div>
              {product.salePrice > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Sale Price:</span>
                  <span>£{product.salePrice}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Current Price:</span>
                <span>£{product.salePrice > 0 ? product.salePrice : product.retailPrice}</span>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inventory Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Stock:</span>
                <span className={product.stock < 10 ? "text-red-600 font-semibold" : ""}>{product.stock} units</span>
              </div>
              <div className="flex justify-between">
                <span>Stock Status:</span>
                <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>
                  {product.stock === 0 ? "Out of Stock" : product.stock < 10 ? "Low Stock" : "In Stock"}
                </Badge>
              </div>
              {product.weight && (
                <div className="flex justify-between">
                  <span>Weight:</span>
                  <span>{product.weight} kg</span>
                </div>
              )}
              {product.dimensions && (
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span>
                    {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} cm
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          {product.tags && product.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}