"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { setProducts, setLoading } from "./store"
import { 
  getAllProducts, 
  fetchProductsFromDB, 
  refreshProductsData 
} from "./sample-data"
import { addToCart } from "../../slices/cartSlice"
import { toast } from 'sonner'

// NO STATIC DATA - All products fetched from MongoDB in real-time

export function ProductShowcase({ filtered }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const { products, filteredProducts, loading, error } = useSelector((state) => state.showcaseProducts)
  const { isAuthenticated } = useSelector((state) => state.userState)
  const [realProducts, setRealProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load real products from MongoDB on component mount (client-side only)
  useEffect(() => {
    if (!isMounted) return

    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true)
        
        // First try to get existing products
        let products = await getAllProducts()
        
        // If no products exist (like on refresh), fetch from DB
        if (!products || products.length === 0) {
          console.log('No products in memory, fetching from DB...')
          products = await fetchProductsFromDB()
        }
        
        dispatch(setProducts(products || []))
        setRealProducts(products || [])
        setIsLoadingProducts(false)
      } catch (error) {
        console.error('Error loading products:', error)
        setRealProducts([])
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [dispatch, isMounted])

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(8)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
      </div>
    )
  }

  // Display products based on filtered prop
  const displayProducts = filtered ? (filteredProducts || []) : (products || [])

  // Function to handle add to cart
  const handleAddToCart = (product) => {
    // Check authentication from Redux store or localStorage as fallback
    let isLoggedIn = isAuthenticated;
    
    // If Redux state doesn't have auth info, check localStorage (from main store persistence)
    if (!isLoggedIn && typeof window !== 'undefined') {
      try {
        const persistedState = localStorage.getItem('persist:root');
        if (persistedState) {
          const parsed = JSON.parse(persistedState);
          const userState = JSON.parse(parsed.userState || '{}');
          isLoggedIn = userState.isAuthenticated === true;
        }
      } catch (error) {
        console.log('Could not parse persisted state:', error);
      }
    }
    
    if (!isLoggedIn) {
      toast.error('Please login to add to cart');
      return;
    }
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.name} added to cart!`);
  }

  // Function to handle buy now
  const handleBuyNow = (product) => {
    console.log("Buy now:", product)
    // Navigate to product detail page with product ID
    router.push(`/productDetail/${product._id}`)
  }

  if (loading || isLoadingProducts) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(8)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!displayProducts || displayProducts.length === 0) {
    return (
      <div className="text-gray-500 p-8 bg-gray-50 rounded-lg text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium mb-1">No products found</h3>
        <p>Try adjusting your filters to find what you're looking for.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {displayProducts.map((product) => (
        <div
          key={product._id || product.id}
          className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="relative h-48">
            <Image 
              src={
                product.images && product.images.length > 0
                  ? (typeof product.images[0] === 'object' && product.images[0].url 
                      ? product.images[0].url 
                      : product.images[0])
                  : "/placeholder.svg"
              } 
              alt={product.name} 
              fill 
              className="object-contain p-4" 
            />

            {/* Improved discount tag design */}
            {product.discount > 0 && (
              <div className="absolute top-0 left-0">
                <div className="bg-red-600 text-white font-bold py-1 px-3 rounded-br-lg shadow-md flex items-center">
                  <span className="text-lg">{product.discount}%</span>
                  <span className="ml-1 text-xs">OFF</span>
                </div>
              </div>
            )}

            {/* Size badge */}
            {product.attributes?.size && (
              <div className="absolute bottom-2 right-2">
                <div className="bg-gray-800 bg-opacity-70 text-white text-xs py-1 px-2 rounded">
                  {product.attributes.size}
                </div>
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-medium text-gray-800 line-clamp-2 h-12">{product.name}</h3>

            <div className="flex items-center mt-1">
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              {product.rating % 1 >= 0.5 && (
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              <span className="text-xs text-gray-500 ml-1">({product.ratingCount})</span>
            </div>

            <div className="mt-3">
              {product.discount > 0 ? (
                <div className="flex items-center">
                  <span className="font-bold text-lg text-red-600">
                    £{(product.price * (1 - product.discount / 100)).toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 line-through">£{product.price.toFixed(2)}</span>
                </div>
              ) : (
                <div className="font-bold text-lg">£{product.price.toFixed(2)}</div>
              )}
            </div>

            {/* Stock indicator */}
            <div className="mt-1 mb-3">
              {product.stock <= 5 ? (
                <span className="text-xs text-red-600">Only {product.stock} left in stock!</span>
              ) : product.stock <= 10 ? (
                <span className="text-xs text-orange-500">Low stock: {product.stock} remaining</span>
              ) : (
                <span className="text-xs text-green-600">In stock ({product.stock})</span>
              )}
            </div>

            {/* Add to Cart and Buy Now buttons */}
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleAddToCart(product)}
                className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Add to Cart
              </button>
              <button
                onClick={() => handleBuyNow(product)}
                className="w-full py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 transition-colors"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
