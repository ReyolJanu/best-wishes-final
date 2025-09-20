"use client"

import { useEffect, Suspense } from "react"
import { useDispatch, useSelector } from "react-redux"
import { FilterSidebar } from "./filter-sidebar"
import { ProductGrid } from "./product-grid"
import { CategorySelector } from "./category-selector"
import { MobileFilterDrawer } from "./mobile-filter-drawer"
import { setProducts, setLoading } from "./store"
import { getAllProducts, fetchProductsFromDB } from "./sample-data"

export function CategoryShowcase({ categoryName }) {
  const dispatch = useDispatch()
  const { products, loading } = useSelector((state) => state.products)

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        dispatch(setLoading(true))
        
        // First try to get existing products
        let allProducts = await getAllProducts()
        
        // If no products exist (like on refresh), fetch from DB
        if (!allProducts || allProducts.length === 0) {
          console.log('No products in memory, fetching from DB...')
          allProducts = await fetchProductsFromDB()
        }
        
        dispatch(setProducts(allProducts || []))
        dispatch(setLoading(false))
      } catch (error) {
        console.error('Error loading products:', error)
        dispatch(setProducts([]))
        dispatch(setLoading(false))
      }
    }

    loadProducts()
  }, [dispatch])

  // Filter products by category
  const filteredProducts = products?.filter(product => 
    product.category === categoryName || product.mainCategory === categoryName
  ) || []

  // Get products from other categories for the "Shop Other Categories" section
  const otherCategoriesProducts = {}
  if (products) {
    const categories = [...new Set(products.map((p) => p.category))].filter(
      (cat) => cat !== categoryName,
    )

    categories.forEach((cat) => {
      const catProducts = products.filter((p) => p.category === cat)
      // Get up to 3 random products from this category
      otherCategoriesProducts[cat] = catProducts.sort(() => 0.5 - Math.random()).slice(0, 3)
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with breadcrumb and cart */}
      <div className="flex justify-between items-center mb-6">
        <nav className="flex text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/" className="text-gray-500 hover:text-purple-600">
                Home
              </a>
            </li>
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">{categoryName}</span>
            </li>
          </ol>
        </nav>

        <div className="relative">
          <a href="#" className="flex items-center text-gray-700 hover:text-purple-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              0
            </span>
          </a>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>

      {/* Category selector */}
      <div className="mb-6">
        <CategorySelector />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar with filters - hidden on mobile */}
        <div className="w-full md:w-1/4 hidden md:block">
          <Suspense fallback={<div className="h-screen bg-gray-100 animate-pulse rounded-lg"></div>}>
            <FilterSidebar />
          </Suspense>
        </div>

        {/* Main content */}
        <div className="w-full md:w-3/4">
          {/* Section 1: Selected Category Products + Filters */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">All {categoryName}</h2>
            <Suspense
              fallback={
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array(6)
                    .fill(null)
                    .map((_, i) => (
                      <div key={i} className="bg-gray-100 animate-pulse rounded-lg p-4 h-64"></div>
                    ))}
                </div>
              }
            >
              <ProductGrid products={filteredProducts} />
            </Suspense>
          </section>

          {/* Section 2: "Browse All [Category]" (Unfiltered View) */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Browse All {categoryName}</h2>
              <a href="#" className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
                View all
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            <Suspense
              fallback={
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array(3)
                    .fill(null)
                    .map((_, i) => (
                      <div key={i} className="bg-gray-100 animate-pulse rounded-lg p-4 h-64"></div>
                    ))}
                </div>
              }
            >
              <ProductGrid products={products.filter((p) => p.category === categoryName)} limit={6} />
            </Suspense>
          </section>

          {/* Section 3: "Shop Other Categories" (Random Suggestions) */}
          <section>
            <h2 className="text-2xl font-semibold mb-6">Explore More Categories</h2>

            {Object.entries(otherCategoriesProducts).map(([category, products]) => (
              <div key={category} className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">{category}</h3>
                  <a
                    href={`/allProducts/showcase/${category.toLowerCase()}`}
                    className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center"
                  >
                    View all
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                <ProductGrid products={products} />
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer />
    </div>
  )
}
