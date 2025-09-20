"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ProductShowcase } from "./product-showcase"
import { FilterSidebar } from "./filter-sidebar"
import { CategoryExplorer } from "./category-explorer"
import { SortingOptions } from "./sorting-options"
import { MobileFilterDrawer } from "./mobile-filter-drawer"
import { Providers } from "./providers"
import { Toaster } from 'sonner'
import Navbar from "../../components/navBar/page"

export default function ShowcasePage() {
  const searchParams = useSearchParams()
  const categoryFromUrl = searchParams.get('category')

  return (
    <Providers>
      <Navbar />
      <div className="container mx-auto px-4 py-8">        {/* Header with cart */}
        <h1 className="text-3xl font-bold mb-6">
          {categoryFromUrl ? `${categoryFromUrl} Products` : 'Product Showcase'}
        </h1>

        <div className="flex flex-col md:flex-row gap-6 ">
          {/* Sidebar with filters - hidden on mobile */}
          <div className="w-full md:w-1/4 hidden md:block ">
            <Suspense fallback={<div className="h-screen bg-gray-100 animate-pulse rounded-lg"></div>}>
              <FilterSidebar initialCategory={categoryFromUrl} />
            </Suspense>
          </div>

          {/* Main content */}
          <div className="w-full md:w-3/4">
            {/* Sorting options */}
            <div className="mb-4">
              <SortingOptions />
            </div>

            {/* Main filtered product list */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Products</h2>
              <Suspense
                fallback={
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array(8)
                      .fill(null)
                      .map((_, i) => (
                        <div key={i} className="bg-gray-100 animate-pulse rounded-lg p-4 h-64"></div>
                      ))}
                  </div>
                }
              >
                <ProductShowcase filtered={true} />
              </Suspense>
            </section>

            {/* Browse all products in category */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Browse All Products</h2>
                <a href="#" className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center">
                  View all
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              <Suspense
                fallback={
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array(4)
                      .fill(null)
                      .map((_, i) => (
                        <div key={i} className="bg-gray-100 animate-pulse rounded-lg p-4 h-64"></div>
                      ))}
                  </div>
                }
              >
                <ProductShowcase filtered={false} />
              </Suspense>
            </section>

            {/* Shop more categories */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Looking for More? Explore These Categories</h2>
              </div>
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array(4)
                      .fill(null)
                      .map((_, i) => (
                        <div key={i} className="bg-gray-100 animate-pulse rounded-lg p-4 h-64"></div>
                      ))}
                  </div>
                }
              >
                <CategoryExplorer />
              </Suspense>
            </section>
          </div>
        </div>

        {/* Mobile filter drawer */}
        <MobileFilterDrawer />
      </div>
      <Toaster />
    </Providers>
  )
}
