"use client"

import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { productSlice } from "./store"
import cartSlice from "../../slices/cartSlice"
import userSlice from "../../slices/userSlice"
import wishlistSlice from "../../slices/wishlistSlice"

export function Providers({ children, initialCategory }) {
  // Create store with initial category if provided and include necessary slices for cart functionality
  const store = configureStore({
    reducer: {
      products: productSlice.reducer,
      cartState: cartSlice,
      userState: userSlice,
      wishlistState: wishlistSlice,
    },
    preloadedState: initialCategory
      ? {
          products: {
            ...productSlice.getInitialState(),
            filters: {
              category: initialCategory,
              filters: {},
            },
          },
        }
      : undefined,
  })

  return <Provider store={store}>{children}</Provider>
}
