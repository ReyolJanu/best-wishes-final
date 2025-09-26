"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs"
import { Badge } from "../../../../components/ui/badge"
import { Eye, ArrowLeft, Check, AlertCircle } from "lucide-react"
import MediaUpload from "./MediaUpload";
import PricingSection from "./PricingSection"
import InventorySection from "./InventorySection"
import CategoryFilters from "./CategoryFilters"
import { Modal, useConfirmModal } from "../../../../components/ui/modal"

// Dynamically import components that use browser-only APIs
const RichTextEditor = dynamic(
  () => import("./RichTextEditor"),
  { ssr: false, loading: () => <Textarea disabled placeholder="Loading editor..." /> }
)
// const API_BASE = "http://localhost:5000/api/products";
const defaultProduct = {
  name: "",
  sku: "",
  shortDescription: "",
  detailedDescription: "",
  mainCategory: "",
  filters: {},
  tags: [],
  images: [],
  videos: [],
  costPrice: 0,
  retailPrice: 0,
  salePrice: 0,
  taxClass: "standard",
  stock: 0,
  stockStatus: "in-stock",
  weight: 0,
  dimensions: { length: 0, width: 0, height: 0 },
  shippingClass: "standard",
  variants: [],
  status: "draft",
}

export default function ProductForm({ product = null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState("form") // "form" | "preview" | "confirm"
  const [categorySystem, setCategorySystem] = useState({})
  const [formData, setFormData] = useState(defaultProduct)
  const [isClient, setIsClient] = useState(false)
  const [previewErrors, setPreviewErrors] = useState([])
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState("")
  const [currentTab, setCurrentTab] = useState("basic") // Track current tab
  const tabRef = useRef("basic") // Persist tab state across re-renders
  const { isOpen, config, showError, showSuccess, closeModal } = useConfirmModal()

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

  useEffect(() => {
    setIsClient(true)
    loadCategories()
    
    // Initialize form data safely
    if (product) {
      console.log("🔄 Initializing ProductForm with product data:", product)
      const initialFormData = {
        ...defaultProduct,
        ...product,
        dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
        filters: product.filters || {},
        tags: product.tags || [],
        images: product.images || [],
        variants: product.variants || [],
      }
      console.log("📝 Setting initial form data:", initialFormData)
      setFormData(initialFormData)
    } else {
      console.log("🆕 Initializing ProductForm for new product")
    }
  }, [product])

  // Debug tab changes
  useEffect(() => {
    console.log("🔍 Current tab changed to:", currentTab)
    tabRef.current = currentTab // Update ref when tab changes
  }, [currentTab])

  // Initialize tab from ref on component mount/re-render
  useEffect(() => {
    if (tabRef.current && tabRef.current !== currentTab) {
      console.log("🔍 Restoring tab from ref:", tabRef.current)
      setCurrentTab(tabRef.current)
    }
  }, [])

  const loadCategories = async () => {
    try {
      console.log("🔄 Loading categories...")
      const response = await fetch("/prodectmanage/api/categories", {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      const data = await response.json()
      console.log("📂 Categories loaded:", data)
      setCategorySystem(data)
    } catch (error) {
      console.error("❌ Error loading categories:", error)
      // Set empty object to prevent infinite loading
      setCategorySystem({})
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCategoryChange = (mainCategory) => {
    setFormData((prev) => ({
      ...prev,
      mainCategory,
      filters: {},
    }))
  }

  const handleFiltersChange = (filters) => {
    // Only update if filters have actually changed
    const currentFiltersString = JSON.stringify(formData.filters);
    const newFiltersString = JSON.stringify(filters);
    
    if (currentFiltersString !== newFiltersString) {
      console.log("🔍 Filters Changed:", {
        receivedFilters: filters,
        filtersType: typeof filters,
        filtersKeys: Object.keys(filters || {}),
        filtersValues: Object.values(filters || {}),
        previousFilters: formData.filters
      });
      
      setFormData((prev) => ({
        ...prev,
        filters: filters || {},
      }));
    }
  }

  const validateForm = () => {
    const errors = []

    if (!formData.name?.trim()) errors.push("Product name is required")
    if (!formData.sku?.trim()) errors.push("SKU is required")
    if (!formData.mainCategory) errors.push("Main category is required")
    if (!formData.shortDescription?.trim()) errors.push("Short description is required")
    if (!formData.retailPrice || formData.retailPrice <= 0) errors.push("Retail price must be greater than 0")
    if (formData.costPrice < 0) errors.push("Cost price cannot be negative")
    if (formData.stock < 0) errors.push("Stock cannot be negative")

    // Only validate filters if the category has filter options
    if (formData.mainCategory) {
      const categoryData = categorySystem[formData.mainCategory]
      console.log("🔍 Filter Validation Debug:", {
        mainCategory: formData.mainCategory,
        categoryData: categoryData,
        categoryFilters: categoryData?.filters,
        selectedFilters: formData.filters,
        hasCategoryFilters: categoryData && categoryData.filters && Object.keys(categoryData.filters).length > 0
      })
      
      // OPTIONAL: Uncomment the line below to make filters completely optional
      // if (false) { // Skip filter validation entirely
      
      if (categoryData && categoryData.filters && Object.keys(categoryData.filters).length > 0) {
        // Check if at least one filter has been selected
        const hasSelectedFilters = Object.values(formData.filters || {}).some(arr => arr && arr.length > 0)
        console.log("🔍 Filter Selection Check:", {
          hasSelectedFilters,
          filterValues: Object.values(formData.filters || {}),
          filterKeys: Object.keys(formData.filters || {})
        })
        
        if (!hasSelectedFilters) {
          errors.push("Please select at least one filter for the chosen category")
        }
      } else {
        console.log("✅ No filters required for this category")
      }
    }

    return errors
  }

  const handlePreview = () => {
    const errors = validateForm()
    if (errors.length > 0) {
      showError("Validation Errors", "Please fix the following errors:\n" + errors.join("\n"))
      return
    }
    
    // Log all collected data for MongoDB storage
    console.log("📋 Complete Product Data for MongoDB Storage:", {
      // Basic Information
      name: formData.name,
      sku: formData.sku,
      shortDescription: formData.shortDescription,
      detailedDescription: formData.detailedDescription,
      status: formData.status,
      
      // Categories & Filters
      mainCategory: formData.mainCategory,
      categoryName: categorySystem[formData.mainCategory]?.name,
      filters: formData.filters,
      filtersSummary: Object.entries(formData.filters || {}).map(([key, values]) => ({
        filterType: key,
        displayName: getFilterDisplayName(key),
        values: Array.isArray(values) ? values : [values],
        count: Array.isArray(values) ? values.length : 1
      })),
      totalFilters: Object.values(formData.filters || {}).flat().length,
      tags: formData.tags,
      
      // Media
      images: formData.images,
      videos: formData.videos,
      
      // Pricing
      costPrice: formData.costPrice,
      retailPrice: formData.retailPrice,
      salePrice: formData.salePrice,
      taxClass: formData.taxClass,
      
      // Inventory
      stock: formData.stock,
      stockStatus: formData.stockStatus,
      weight: formData.weight,
      dimensions: formData.dimensions,
      shippingClass: formData.shippingClass,
      
      // Variants
      variants: formData.variants,
      
      // Calculated Fields
      profitMargin: calculateProfitMargin(),
      imageCount: formData.images?.length || 0,
      videoCount: formData.videos?.length || 0,
    });
    
    setPreviewErrors(errors)
    setCurrentStep("preview")
  }

const handleSubmit = async () => {
  setLoading(true);

  try {
    // Prepare the complete product data for MongoDB
    const productData = {
      ...formData,
      // Ensure all required fields are present
      name: formData.name?.trim(),
      sku: formData.sku?.trim().toUpperCase(),
      shortDescription: formData.shortDescription?.trim(),
      detailedDescription: formData.detailedDescription?.trim(),
      mainCategory: formData.mainCategory,
      filters: formData.filters || {},
      tags: formData.tags || [],
      images: formData.images || [],
      videos: formData.videos || [],
      costPrice: Number(formData.costPrice) || 0,
      retailPrice: Number(formData.retailPrice) || 0,
      salePrice: Number(formData.salePrice) || 0,
      taxClass: formData.taxClass || "standard",
      stock: Number(formData.stock) || 0,
      stockStatus: formData.stockStatus || "in-stock",
      weight: Number(formData.weight) || 0,
      dimensions: {
        length: Number(formData.dimensions?.length) || 0,
        width: Number(formData.dimensions?.width) || 0,
        height: Number(formData.dimensions?.height) || 0,
      },
      shippingClass: formData.shippingClass || "standard",
      variants: formData.variants || [],
      status: formData.status || "draft",
      // Add timestamps

      updatedAt: new Date(),
    };

    // Only add createdAt for new products
    if (!product) {
      productData.createdAt = new Date();
    }

    console.log("📦 Sending product data to MongoDB:", productData);
    console.log("🔍 Category and Filters Debug:", {
      mainCategory: formData.mainCategory,
      categoryName: categorySystem[formData.mainCategory]?.name,
      filters: formData.filters,
      filtersKeys: Object.keys(formData.filters || {}),
      filtersValues: Object.values(formData.filters || {}),
      totalFilters: Object.values(formData.filters || {}).flat().length
    });

    // Use hardcoded URL for now to avoid double /api issue
    const baseURL = process.env.NEXT_PUBLIC_API_URL_2;
    const url = product ? `${baseURL}/api/products/${product.id}` : `${baseURL}/api/products`;

    const method = product ? "PUT" : "POST";

    console.log(`🔄 ${method} request to:`, url);

    const response = await fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // This sends cookies/authentication tokens
      body: JSON.stringify(productData),
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log("✅ Product saved successfully:", responseData);
      setCurrentStep("confirm");
    } else {
      console.error("❌ Backend error response:", responseData);
      throw new Error(responseData.message || responseData.error || "Failed to save product");
    }
  } catch (error) {
    console.error("❌ Error saving product:", error);
    alert(`Error saving product: ${error.message}`);
    setCurrentStep("preview");
  } finally {
    setLoading(false);
  }
};

  const getFilterDisplayName = (filterType) => {
    return filterType.charAt(0).toUpperCase() + filterType.slice(1).replace(/([A-Z])/g, " $1")
  }

  const calculateProfitMargin = () => {
    const sellingPrice = formData.salePrice > 0 ? formData.salePrice : formData.retailPrice
    if (formData.costPrice > 0) {
      return (((sellingPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(2)
    }
    return "0.00"
  }

  const getStockStatus = () => {
    if (formData.stock === 0) return { label: "Out of Stock", color: "destructive" }
    if (formData.stock < 10) return { label: "Low Stock", color: "secondary" }
    return { label: "In Stock", color: "default" }
  }

  const handleEditStart = (field, value) => {
    setEditingField(field)
    setEditValue(value?.toString() || "")
  }

  const handleEditSave = (field) => {
    if (field === "stock") {
      handleInputChange(field, Number(editValue) || 0)
    } else if (field === "retailPrice" || field === "costPrice" || field === "salePrice") {
      handleInputChange(field, Number(editValue) || 0)
    } else if (field === "weight") {
      handleInputChange(field, Number(editValue) || 0)
    } else {
      handleInputChange(field, editValue)
    }
    setEditingField(null)
    setEditValue("")
  }

  const handleEditCancel = () => {
    setEditingField(null)
    setEditValue("")
  }

  // Confirmation Step
  if (currentStep === "confirm") {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-2">
              {product ? "Product Updated Successfully!" : "Product Created Successfully!"}
            </h1>
            <p className="text-gray-600 mb-4">
              Your product "{formData.name}" has been {product ? "updated" : "created"} and is now stored in MongoDB.

            </p>
            <p className="text-sm text-gray-500 mb-4">
              {product ? "All changes have been saved to the database." : "The new product has been added to your inventory."}

            </p>
            
            {/* Show stored data summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">📦 Data Stored in MongoDB:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p><strong>SKU:</strong> {formData.sku}</p>
                  <p><strong>Category:</strong> {categorySystem[formData.mainCategory]?.name}</p>
                  <p><strong>Status:</strong> {formData.status}</p>
                  <p><strong>Stock:</strong> {formData.stock} units</p>
                  <p><strong>Retail Price:</strong> £{formData.retailPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p><strong>Cost Price:</strong> £{formData.costPrice?.toFixed(2)}</p>
                  <p><strong>Sale Price:</strong> £{formData.salePrice?.toFixed(2) || "N/A"}</p>
                  <p><strong>Weight:</strong> {formData.weight} kg</p>
                  <p><strong>Images:</strong> {formData.images?.length || 0} uploaded</p>
                  <p><strong>Filters:</strong> {Object.keys(formData.filters || {}).length} selected</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  ✅ All product details, pricing, inventory, and media files have been saved to the database.
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <Button onClick={() => router.push("/prodectmanage")}>Return to Products</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Preview Step
  if (currentStep === "preview") {
    const stockStatus = getStockStatus()
    const profitMargin = calculateProfitMargin()

    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6 flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setCurrentStep("form")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Edit
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Product Preview</h1>
          </div>
          <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
            <Button variant="outline" onClick={() => setCurrentStep("form")} className="w-full sm:w-auto">
              Edit Product
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto">
              {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
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
                    src={getProductImage(formData)}
                    alt={formData.name || "Product image"}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = '/placeholder.svg';
                    }}
                  />
                </div>
                {formData.images?.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {formData.images.slice(1).map((image, index) => (
                      <img
                        key={index}
                        src={getProductImage(formData, index + 1)}
                        alt={`${formData.name || "Product"} ${index + 2}`}
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

            {/* Detailed Description */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Product Description</CardTitle>
              </CardHeader>
              <CardContent>
                {isClient && formData.detailedDescription ? (
                  <div 
                    className="prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: formData.detailedDescription }} 
                  />
                ) : (
                  <p>{formData.shortDescription}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Info Sidebar */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">{formData.name}</h2>
                  <p className="text-sm sm:text-base text-gray-600">{formData.shortDescription}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">SKU</p>
                  <p className="text-sm sm:text-base font-medium">{formData.sku}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Main Category</p>
                  <Badge variant="outline" className="text-xs">
                    {categorySystem[formData.mainCategory]?.name || formData.mainCategory}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Status</p>
                  <Badge variant={formData.status === "active" ? "default" : "secondary"} className="text-xs">{formData.status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Category Filters */}
            {Object.keys(formData.filters).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Category Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(formData.filters).map(([filterType, values]) => {
                    if (!values || values.length === 0) return null;
                    return (
                      <div key={filterType}>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {getFilterDisplayName(filterType)}:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(values) ? values.map((value, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {value}
                            </Badge>
                          )) : (
                            <Badge variant="secondary" className="text-xs">
                              {values}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Total filters selected: {Object.values(formData.filters).flat().length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Profit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Cost Price:</span>
                  <div className="flex items-center gap-2">
                    {editingField === "costPrice" ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs">£</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 h-8 text-sm"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleEditSave("costPrice")} className="h-8 px-2">
                          ✓
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleEditCancel} className="h-8 px-2">
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>£{formData.costPrice.toFixed(2)}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditStart("costPrice", formData.costPrice)}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          ✏️
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Retail Price:</span>
                  <div className="flex items-center gap-2">
                    {editingField === "retailPrice" ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs">£</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 h-8 text-sm"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleEditSave("retailPrice")} className="h-8 px-2">
                          ✓
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleEditCancel} className="h-8 px-2">
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>£{formData.retailPrice.toFixed(2)}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditStart("retailPrice", formData.retailPrice)}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          ✏️
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {formData.salePrice > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Sale Price:</span>
                    <div className="flex items-center gap-2">
                      {editingField === "salePrice" ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">£</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 h-8 text-sm"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleEditSave("salePrice")} className="h-8 px-2">
                            ✓
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleEditCancel} className="h-8 px-2">
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>£{formData.salePrice.toFixed(2)}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleEditStart("salePrice", formData.salePrice)}
                            className="h-6 w-6 p-0 text-xs"
                          >
                            ✏️
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Selling Price:</span>
                  <span>£{(formData.salePrice > 0 ? formData.salePrice : formData.retailPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Margin:</span>
                  <Badge variant={Number(profitMargin) < 10 ? "destructive" : Number(profitMargin) < 25 ? "secondary" : "default"}>
                    {profitMargin}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory & Shipping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Stock:</span>
                  <div className="flex items-center gap-2">
                    {editingField === "stock" ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 h-8 text-sm"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleEditSave("stock")} className="h-8 px-2">
                          ✓
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleEditCancel} className="h-8 px-2">
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{formData.stock} units</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditStart("stock", formData.stock)}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          ✏️
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Weight:</span>
                  <div className="flex items-center gap-2">
                    {editingField === "weight" ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 h-8 text-sm"
                          autoFocus
                        />
                        <span className="text-xs">kg</span>
                        <Button size="sm" onClick={() => handleEditSave("weight")} className="h-8 px-2">
                          ✓
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleEditCancel} className="h-8 px-2">
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{formData.weight} kg</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditStart("weight", formData.weight)}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          ✏️
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span>
                    {formData.dimensions.length} × {formData.dimensions.width} × {formData.dimensions.height} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="capitalize">{formData.shippingClass}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {formData.tags?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Variants */}
            {formData.variants?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Variants ({formData.variants.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {formData.variants.slice(0, 3).map((variant) => (
                      <div key={variant.id} className="text-sm border rounded p-2">
                        <div className="font-medium">
                          {Object.entries(variant.attributes)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}
                        </div>
                        <div className="text-gray-500">
                          ${variant.price} • Stock: {variant.stock}
                        </div>
                      </div>
                    ))}
                    {formData.variants.length > 3 && (
                      <p className="text-sm text-gray-500">+{formData.variants.length - 3} more variants</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Validation Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {previewErrors.length === 0 ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-600">Ready to Submit</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-600">Validation Issues</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewErrors.length === 0 ? (
              <div className="text-green-600">
                <p>✅ All required fields are completed</p>
                <p>✅ Product is ready for submission</p>
              </div>
            ) : (
              <div className="space-y-2">
                {previewErrors.map((error, index) => (
                  <p key={index} className="text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Form Step
  return (
    <form className="space-y-6">

      {/* Debug info for editing */}
      {product && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-semibold">✏️ Editing Product</span>
            <span className="text-sm text-blue-600">ID: {product.id}</span>
          </div>
          <p className="text-sm text-blue-700">
            All fields are pre-filled with existing data. Make your changes and click "Preview Changes" to continue.
          </p>
        </div>
      )}
      
      <Tabs 
        value={currentTab} 
        onValueChange={(value) => {
          console.log("🔍 Tab changed from", currentTab, "to", value)
          setCurrentTab(value)
          tabRef.current = value
        }} 
        className="w-full"
      >

     
        <TabsList className="flex w-full overflow-x-auto gap-1 p-1">
          <TabsTrigger value="basic" className="text-xs px-2 py-2 whitespace-nowrap">Basic Info</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs px-2 py-2 whitespace-nowrap">Categories</TabsTrigger>
          <TabsTrigger value="media" className="text-xs px-2 py-2 whitespace-nowrap">Media</TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs px-2 py-2 whitespace-nowrap">Pricing</TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs px-2 py-2 whitespace-nowrap">Inventory</TabsTrigger>
          {/* <TabsTrigger value="variants" className="text-xs px-2 py-2 whitespace-nowrap">Variants</TabsTrigger> */}
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">
                    Product Name * 
                    {product && <span className="text-blue-600 text-xs ml-2">(Pre-filled)</span>}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className={product ? "border-blue-200 bg-blue-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">
                    SKU * 
                    {product && <span className="text-blue-600 text-xs ml-2">(Pre-filled)</span>}
                  </Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    required
                    className={product ? "border-blue-200 bg-blue-50" : ""}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description (160 chars max)</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  maxLength={160}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">{formData.shortDescription.length}/160 characters</p>
              </div>

              <div>
                <Label>Detailed Description</Label>
                <RichTextEditor
                  value={formData.detailedDescription}
                  onChange={(value) => handleInputChange("detailedDescription", value)}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          {Object.keys(categorySystem).length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
                  <span>Loading categories...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CategoryFilters
              category={formData.mainCategory}
              tags={formData.tags}
              onCategoryChange={handleCategoryChange}
              onTagsChange={(tags) => handleInputChange("tags", tags)}
              onFiltersChange={handleFiltersChange}
              selectedFilters={formData.filters}
              isProductForm={true}
            />
          )}
        </TabsContent>

        <TabsContent value="media">
          <MediaUpload
          
            images={formData.images}
            videos={formData.videos}
            onImagesChange={(images) => handleInputChange("images", images)}
            onVideosChange={(videos) => handleInputChange("videos", videos)}
          />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingSection
            pricing={{
              costPrice: formData.costPrice,
              retailPrice: formData.retailPrice,
              salePrice: formData.salePrice,
              taxClass: formData.taxClass,
            }}
            onChange={(pricing) => {
              Object.keys(pricing).forEach((key) => {
                handleInputChange(key, pricing[key])
              })
            }}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <InventorySection
            inventory={{
              stock: formData.stock,
              stockStatus: formData.stockStatus,
              weight: formData.weight,
              dimensions: formData.dimensions,
              shippingClass: formData.shippingClass,
            }}
            onChange={(inventory) => {
              Object.keys(inventory).forEach((key) => {
                handleInputChange(key, inventory[key])
              })
            }}
          />
        </TabsContent>


      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.push("/prodectmanage")}>
          Cancel
        </Button>
        <Button type="button" onClick={handlePreview}>
          <Eye className="w-4 h-4 mr-2" />
          {product ? "Preview Changes" : "Preview Product"}
        </Button>
      </div>

      {/* Custom Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
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
    </form>
  )
}