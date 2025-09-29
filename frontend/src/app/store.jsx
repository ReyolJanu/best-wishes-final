import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import userReducer from './slices/userSlice';
import productReducer from './slices/productSlice';
import cartReducer from './slices/cartSlice';
import wishlistReducer from './slices/wishlistSlice';
import categoryReducer from './slices/categorySlice';
import { productSlice } from './allProducts/showcase/store';
import { combineReducers } from 'redux';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['userState', 'cartState', 'wishlistState'], // persist user, cart, and wishlist
};

const rootReducer = combineReducers({
  userState: userReducer,
  productsState: productReducer,
  cartState: cartReducer,
  wishlistState: wishlistReducer,
  categoriesState: categoryReducer,
  showcaseProducts: productSlice.reducer, // Add showcase filtering functionality
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
