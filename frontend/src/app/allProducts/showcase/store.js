import { createSlice, configureStore } from "@reduxjs/toolkit"

// Initial state
const initialState = {
  products: [],
  filteredProducts: [],
  filters: {
    category: "", // Default to "All Categories" (empty string)
    filters: {},
  },
  loading: false,
  error: null,
}

// Create slice
export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload
      state.filteredProducts = action.payload.filter(
        (product) => {
          if (state.filters.category === "") return true
          return product.category === state.filters.category || product.mainCategory === state.filters.category
        }
      )
    },
    setCategory: (state, action) => {
      state.filters.category = action.payload
      state.filters.filters = {} // Reset all filters when category changes
      
      console.log('Setting category to:', action.payload)
      console.log('Total products:', state.products.length)
      
      // Set loading state - filtered products will be set by database fetch
      state.loading = true
    },
    setFilter: (state, action) => {
      const { key, values } = action.payload
      state.filters.filters[key] = values
      
      // Set loading state while fetching filtered products
      state.loading = true
    },
    setFilteredProducts: (state, action) => {
      state.filteredProducts = action.payload
      state.loading = false
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    sortProducts: (state, action) => {
      const { sortBy, direction } = action.payload
      const multiplier = direction === "asc" ? 1 : -1

      state.filteredProducts = [...state.filteredProducts].sort((a, b) => {
        if (sortBy === "price") {
          const aPrice = a.discount ? a.price * (1 - a.discount / 100) : a.price
          const bPrice = b.discount ? b.price * (1 - b.discount / 100) : b.price
          return (aPrice - bPrice) * multiplier
        } else if (sortBy === "rating") {
          return (a.rating - b.rating) * multiplier
        } else if (sortBy === "name") {
          return a.name.localeCompare(b.name) * multiplier
        } else if (sortBy === "popularity") {
          return (a.ratingCount - b.ratingCount) * multiplier
        }
        return 0
      })
    },
  },
})

// Export actions
export const {
  setProducts,
  setCategory,
  setFilter,
  setFilteredProducts,
  setLoading,
  setError,
  sortProducts,
} = productSlice.actions

// Export store
export const store = configureStore({
  reducer: {
    products: productSlice.reducer,
  },
})
