"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "../../../../../../components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import ProductForm from "../../../../(admin)/prodectmanage/components/ProductForm"

export default function InventoryEditProduct() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch product data from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`)
      }
      
      const responseData = await response.json()
      console.log("📦 Raw response data:", responseData)
      
      // Extract the actual product data from the response
      const data = responseData.data || responseData
      console.log("📦 Fetched product for editing:", data)
      
      // Transform the data to match the ProductForm structure
      const transformedProduct = {
        id: data._id || data.id,
        name: data.name || "",
        sku: data.sku || "",
        shortDescription: data.shortDescription || "",
        detailedDescription: data.detailedDescription || "",
        mainCategory: data.mainCategory || "",
        filters: data.filters || {},
        tags: data.tags || [],
        images: data.images || [],
        videos: data.videos || [],
        costPrice: Number(data.costPrice) || 0,
        retailPrice: Number(data.retailPrice) || 0,
        salePrice: Number(data.salePrice) || 0,
        taxClass: data.taxClass || "standard",
        stock: Number(data.stock) || 0,
        stockStatus: data.stockStatus || "in-stock",
        weight: Number(data.weight) || 0,
        dimensions: data.dimensions || { length: 0, width: 0, height: 0 },
        shippingClass: data.shippingClass || "standard",
        variants: data.variants || [],
        status: data.status || "draft",
      }
      
      console.log("🔄 Transformed product data:", transformedProduct)
      
      setProduct(transformedProduct)
    } catch (error) {
      console.error("❌ Error fetching product:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Loading product details...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Product</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => fetchProduct()}>
              Try Again
            </Button>
            <Link href="/productsInventory">
              <Button variant="outline">Back to Products</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
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
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-gray-600">Modify product details and save changes</p>
          </div>
        </div>
      </div>

      {/* Product Form with pre-filled data */}
      <ProductForm product={product} />
    </div>
  )
}