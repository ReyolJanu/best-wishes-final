"use client"

import { useState, useEffect } from "react"
import { FilterSidebar } from "./filter-sidebar"
import { useSelector } from "react-redux"

export function MobileFilterDrawer({ initialCategory }) {
  const [isOpen, setIsOpen] = useState(false)
  const { filters } = useSelector((state) => state.products)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Calculate active filters count
  useEffect(() => {
    let count = 0

    // Count each filter type
    if (filters && filters.filters) {
      Object.entries(filters.filters).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          count += values.length
        } else if (key === "price") {
          // Price range counts as 1 filter if it's not the default
          const [min, max] = values
          if (min > 0 || max < 200) {
            count += 1
          }
        }
      })
    }

    setActiveFiltersCount(count)
  }, [filters])

  // Close drawer when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  return (
    <>
      {/* Filter button for mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-30 bg-purple-600 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span className="ml-2">Filters</span>
        {activeFiltersCount > 0 && (
          <span className="ml-1 bg-white text-purple-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-xs bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto">
          <div className="p-4 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <FilterSidebar initialCategory={initialCategory} />
          </div>
          <div className="p-4 border-t sticky bottom-0 bg-white">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
