"use client"

import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { setCategory } from "./store"

export function CategorySelector() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { category } = useSelector((state) => state.showcaseProducts.filters)

  // Get unique categories from products
  const categories = useSelector((state) => {
    return [...new Set(state.showcaseProducts.products.map((p) => p.category))]
  })

  const handleCategoryChange = (newCategory) => {
    dispatch(setCategory(newCategory))
    // Update URL to match selected category
    router.push(`/allProducts/showcase/${newCategory.toLowerCase()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => handleCategoryChange(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            category === cat ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
