"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setFilter, setCategory, setFilteredProducts } from "./store"
import { 
  getAllCategories, 
  getCategoryByName, 
  getCategoryAttributes, 
  getAttributeValues,
  getUniqueAttributeValues,
  refreshAllData,
  fetchFilteredProductsFromDB,
  getAllProducts
} from "./sample-data"
import React from "react"
import { useSearchParams } from "next/navigation"

// NO STATIC DATA - All filter options fetched from MongoDB in real-time

/**
 * @typedef {import('./store').productSlice.reducer} ProductsReducer
 * @typedef {ReturnType<ProductsReducer>} ProductsState
 * @typedef {{products: ProductsState}} RootState
 */

/**
 * @typedef {object} Category
 * @property {string} key
 * @property {string} name
 * @property {any[]} [attributes]
 */

export function FilterSidebar() {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category')
  
  const { category, filters } = useSelector(/** @param {RootState} state */(state) => {
    // Handle both custom store and main store structures
    if (state.showcaseProducts && state.showcaseProducts.filters) {
      return state.showcaseProducts.filters;
    }
    // Fallback for main store structure
    return {
      category: "",
      filters: {}
    };
  })
  const [selectedFilters, setSelectedFilters] = useState({})
  const [priceRange, setPriceRange] = useState([0, 200])
  /** @type {[number[], React.Dispatch<React.SetStateAction<number[]>>]} */
  const [ratingFilter, setRatingFilter] = useState([])
  /** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} */
  const [discountFilter, setDiscountFilter] = useState([])
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    rating: true,
    discount: true,
  })
  
  // State for real-time MongoDB data
  /** @type {[Category[], React.Dispatch<React.SetStateAction<Category[]>>]} */
  const [categoriesData, setCategoriesData] = useState([])
  const [availableFilters, setAvailableFilters] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  // Fetch categories and filter options from MongoDB
  useEffect(() => {
    const loadCategoriesData = async () => {
      try {
        setIsLoading(true)
        const categories = getAllCategories()
        setCategoriesData(categories)
        // console.log("DEBUG: categoriesData structure", JSON.stringify(categories, null, 2));
        
        // Get current category data
        if (category) {
          const currentCategory = getCategoryByName(category)
          if (currentCategory) {
            const categoryAttrs = getCategoryAttributes(currentCategory.key)
            setAvailableFilters(categoryAttrs)
          }
        }
      } catch (error) {
        console.error('Error loading categories data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCategoriesData()
  }, [])

  // Update available filters when category changes
  useEffect(() => {
    if (category && categoriesData.length > 0) {
      const currentCategory = getCategoryByName(category)
      if (currentCategory) {
        const categoryAttrs = getCategoryAttributes(currentCategory.key)
        setAvailableFilters(categoryAttrs)
      } else {
        setAvailableFilters({})
      }
    }
  }, [category, categoriesData])

  // Listen for real-time updates from MongoDB
  useEffect(() => {
    const handleCategoriesUpdate = (event) => {
      const { categories } = event.detail
      setCategoriesData(categories)
      
      // Update current category filters if needed
      if (category) {
        const currentCategory = categories.find(cat => cat.name === category)
        if (currentCategory) {
          const categoryAttrs = getCategoryAttributes(currentCategory.key)
          setAvailableFilters(categoryAttrs)
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('categoriesUpdated', handleCategoriesUpdate)
      return () => {
        window.removeEventListener('categoriesUpdated', handleCategoriesUpdate)
      }
    }
  }, [category])

  // Reset filters when category changes
  useEffect(() => {
    setSelectedFilters({})
    setPriceRange([0, 200])
    setRatingFilter([])
    setDiscountFilter([])

    // Set all filter sections to expanded for the new category
    const newExpandedSections = { price: true, rating: true, discount: true }
    Object.keys(availableFilters).forEach((key) => {
      newExpandedSections[key] = true
    })
    setExpandedSections(newExpandedSections)
  }, [category, availableFilters, dispatch])

  // Set initial category from URL parameter
  useEffect(() => {
    if (initialCategory && initialCategory !== category && categoriesData.length > 0) {
      handleCategoryChange(initialCategory)
    }
  }, [initialCategory, categoriesData])

  // Function to fetch filtered products from database
  const fetchFilteredProducts = async (filterParams) => {
    try {
      console.log('Fetching filtered products with params:', filterParams)
      const filteredProducts = await fetchFilteredProductsFromDB(filterParams)
      dispatch(setFilteredProducts(filteredProducts))
    } catch (error) {
      console.error('Error fetching filtered products:', error)
    }
  }

  // Find the parent category of a given subcategory key
  const findParentCategory = (subcategoryKey) => {
    for (const category of categoriesData) {
      if (category.attributes) {
        for (const attribute of category.attributes) {
          if (attribute.items.includes(subcategoryKey)) {
            return { parent: category, attribute: attribute.name, value: subcategoryKey };
          }
        }
      }
    }
    return { parent: null, attribute: null, value: null };
  };

  // Handle category change with real-time database filtering
  const handleCategoryChange = async (newCategoryName) => {
    // Note: The logic expects a category NAME, not a key.
    console.log('Category name changed to:', newCategoryName)
    
    // Ensure categoriesData is loaded before processing
    if (categoriesData.length === 0) {
      console.log('Categories data not loaded yet, skipping category change')
      return;
    }
    
    let mainCategoryKey = categoriesData.find(c => c.name === newCategoryName)?.key || ""
    let initialFilters = {};
    
    if (!mainCategoryKey) {
      // It might be a subcategory, so find its parent
      const { parent, attribute, value } = findParentCategory(newCategoryName);
      if (parent) {
        mainCategoryKey = parent.key;
        initialFilters = { [attribute]: [value] };
        setSelectedFilters(initialFilters);
        dispatch(setFilter({ key: attribute, values: [value] }));
        // console.log(`It's a subcategory. Parent: ${mainCategoryKey}, Filter: ${attribute}=${value}`);
      } else {
        // If no category key found and it's not a subcategory, use the fallback pattern
        mainCategoryKey = newCategoryName;
      }
    }
    
    dispatch(setCategory(newCategoryName)) // Keep sending name to store for display
    
    // Only fetch if we have a valid category
    if (mainCategoryKey) {
      console.log('Fetching products for category key:', mainCategoryKey);
      await fetchFilteredProducts({
        category: mainCategoryKey, // Use the key for filtering
        filters: initialFilters // Reset filters or apply subcategory filter
      })
    }
  }

  // Handle filter change with real-time database filtering
  const handleFilterChange = async (filterKey, value) => {
    const currentValues = selectedFilters[filterKey] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]

    const updatedFilters = {
      ...selectedFilters,
      [filterKey]: newValues,
    }

    setSelectedFilters(updatedFilters)
    dispatch(setFilter({ key: filterKey, values: newValues }))
    
    // Fetch filtered products from database
    const currentCategoryKey = categoriesData.find(c => c.name === category)?.key || category
    await fetchFilteredProducts({
      category: currentCategoryKey,
      filters: updatedFilters
    })
  }

  // Handle price range change
  const handlePriceChange = (e) => {
    const value = Number.parseInt(e.target.value)
    const [min, max] = priceRange

    if (e.target.id === "price-min") {
      setPriceRange([value, max])
    } else {
      setPriceRange([min, value])
    }
  }

  // Apply price range when slider interaction ends with database filtering
  const handlePriceChangeEnd = async () => {
    dispatch(setFilter({ key: "price", values: priceRange }))
    
    // Fetch filtered products from database
    const currentCategoryKey = categoriesData.find(c => c.name === category)?.key || category
    await fetchFilteredProducts({
      category: currentCategoryKey,
      filters: {
        ...selectedFilters,
        price: priceRange
      }
    })
  }

  // Handle rating filter with database filtering
  const handleRatingChange = async (rating) => {
    const newRatings = ratingFilter.includes(rating)
      ? ratingFilter.filter((r) => r !== rating)
      : [...ratingFilter, rating]

    setRatingFilter(newRatings)
    dispatch(setFilter({ key: "rating", values: newRatings }))
    
    // Fetch filtered products from database
    const currentCategoryKey = categoriesData.find(c => c.name === category)?.key || category
    await fetchFilteredProducts({
      category: currentCategoryKey,
      filters: {
        ...selectedFilters,
        rating: newRatings
      }
    })
  }

  // Handle discount filter with database filtering
  const handleDiscountChange = async (hasDiscount) => {
    const newValue = discountFilter.includes(hasDiscount) ? [] : [hasDiscount]
    setDiscountFilter(newValue)
    dispatch(setFilter({ key: "discount", values: newValue }))
    
    // Fetch filtered products from database
    const currentCategoryKey = categoriesData.find(c => c.name === category)?.key || category
    await fetchFilteredProducts({
      category: currentCategoryKey,
      filters: {
        ...selectedFilters,
        discount: newValue
      }
    })
  }

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    })
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>

      {/* Category selector */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Category</h3>
        <select
          className="w-full p-2 border rounded"
          value={category || ""}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          {isLoading ? (
            <option value="">Loading categories...</option>
          ) : (
            <>
              <option value="">All Categories</option>
              {categoriesData.map((cat) => (
                <option key={cat.key} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Price range filter with slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Price Range</h3>
          <button onClick={() => toggleSection("price")} className="text-gray-500 hover:text-gray-700">
            {expandedSections.price ? "−" : "+"}
          </button>
        </div>

        {expandedSections.price && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-gray-100 px-3 py-1 rounded">
                <span className="text-sm font-medium">£{priceRange[0]}</span>
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded">
                <span className="text-sm font-medium">£{priceRange[1]}</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="h-1 w-full bg-gray-200 rounded-full"></div>
              </div>
              <div
                className="absolute inset-0 flex items-center"
                style={{
                  left: `${(priceRange[0] / 200) * 100}%`,
                  right: `${100 - (priceRange[1] / 200) * 100}%`,
                }}
              >
                <div className="h-1 w-full bg-purple-600 rounded-full"></div>
              </div>
              <input
                id="price-min"
                type="range"
                min="0"
                max="200"
                value={priceRange[0]}
                onChange={handlePriceChange}
                onMouseUp={handlePriceChangeEnd}
                onTouchEnd={handlePriceChangeEnd}
                className="absolute w-full h-1 appearance-none bg-transparent pointer-events-auto"
                style={{ zIndex: 20 }}
              />
              <input
                id="price-max"
                type="range"
                min="0"
                max="200"
                value={priceRange[1]}
                onChange={handlePriceChange}
                onMouseUp={handlePriceChangeEnd}
                onTouchEnd={handlePriceChangeEnd}
                className="absolute w-full h-1 appearance-none bg-transparent pointer-events-auto"
                style={{ zIndex: 20 }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Min</label>
                <input
                  type="number"
                  min="0"
                  max={priceRange[1]}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const value = Math.min(Number.parseInt(e.target.value) || 0, priceRange[1])
                    setPriceRange([value, priceRange[1]])
                  }}
                  onBlur={handlePriceChangeEnd}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Max</label>
                <input
                  type="number"
                  min={priceRange[0]}
                  max="200"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const value = Math.max(Number.parseInt(e.target.value) || 0, priceRange[0])
                    setPriceRange([priceRange[0], value])
                  }}
                  onBlur={handlePriceChangeEnd}
                  className="w-full p-1 border rounded text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating filter */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Rating</h3>
          <button onClick={() => toggleSection("rating")} className="text-gray-500 hover:text-gray-700">
            {expandedSections.rating ? "−" : "+"}
          </button>
        </div>

        {expandedSections.rating && (
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  checked={ratingFilter.includes(rating)}
                  onChange={() => handleRatingChange(rating)}
                />
                <div className="flex items-center">
                  {Array(5)
                    .fill(null)
                    .map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  <span className="ml-1 text-sm">& Up</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Discount filter */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Discount</h3>
          <button onClick={() => toggleSection("discount")} className="text-gray-500 hover:text-gray-700">
            {expandedSections.discount ? "−" : "+"}
          </button>
        </div>

        {expandedSections.discount && (
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                checked={discountFilter.includes("yes")}
                onChange={() => handleDiscountChange("yes")}
              />
              <div className="flex items-center">
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">On Sale</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Dynamic filters based on category */}
      {Object.entries(availableFilters).map(([filterKey, values]) => (
        <div key={filterKey} className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium capitalize">{filterKey}</h3>
            <button onClick={() => toggleSection(filterKey)} className="text-gray-500 hover:text-gray-700">
              {expandedSections[filterKey] ? "−" : "+"}
            </button>
          </div>

          {expandedSections[filterKey] && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {values.map((value) => (
                <label key={value} className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    checked={(selectedFilters[filterKey] || []).includes(value)}
                    onChange={() => handleFilterChange(filterKey, value)}
                  />
                  <span className="text-sm">{value}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Applied filters */}
      <div className="mb-6">
        <h3 className="font-medium mb-2">Applied Filters</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([key, values]) =>
            values.map((value) => (
              <div
                key={`${key}-${value}`}
                className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center"
              >
                <span className="capitalize">
                  {key}: {value}
                </span>
                <button
                  onClick={() => handleFilterChange(key, value)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </div>
            )),
          )}
          {priceRange[0] > 0 || priceRange[1] < 200 ? (
            <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center">
              <span>
                Price: £{priceRange[0]} - £{priceRange[1]}
              </span>
              <button
                onClick={() => {
                  setPriceRange([0, 200])
                  dispatch(setFilter({ key: "price", values: [0, 200] }))
                }}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </div>
          ) : null}
          {discountFilter.length > 0 && (
            <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center">
              <span>On Sale</span>
              <button
                onClick={() => {
                  setDiscountFilter([])
                  dispatch(setFilter({ key: "discount", values: [] }))
                }}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clear all filters button */}
      <button
        className="w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        onClick={() => {
          setSelectedFilters({})
          setPriceRange([0, 200])
          setRatingFilter([])
          setDiscountFilter([])
          dispatch(setCategory(category)) // This resets all filters
        }}
      >
        Clear All Filters
      </button>
    </div>
  )
}
