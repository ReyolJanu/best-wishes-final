// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Real MongoDB Categories data - NO DUMMY DATA
let categoriesData = [];
let attributesData = {};
let productsData = []; // Real products from MongoDB

// Function to fetch categories from MongoDB
export const fetchCategoriesFromDB = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/`);
    const result = await response.json();
    
    if (result.success) {
      categoriesData = result.data;
      
      // Process attributes for easy access
      attributesData = {};
      categoriesData.forEach(category => {
        attributesData[category.key] = {};
        if (category.attributes && Array.isArray(category.attributes)) {
          category.attributes.forEach(attr => {
            attributesData[category.key][attr.name] = attr.items || [];
          });
        }
      });
      
      console.log('Real Categories fetched from MongoDB:', categoriesData);
      console.log('Processed attributes data:', attributesData);
      
      // Trigger update event for UI components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('categoriesUpdated', { 
          detail: { categories: categoriesData, attributes: attributesData }
        }));
      }
      
      return { categories: categoriesData, attributes: attributesData };
    } else {
      console.error('Failed to fetch categories from MongoDB:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching categories from MongoDB:', error);
    return null;
  }
};

// Function to fetch products from MongoDB (if needed)
export const fetchProductsFromDB = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products?limit=1000`);
    const result = await response.json();
    
    if (result.success) {
      productsData = result.data || [];
      console.log('Real Products fetched from MongoDB:', productsData);
      
      // Trigger update event for UI components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('productsUpdated', { 
          detail: { products: productsData }
        }));
      }
      
      return productsData;
    } else {
      console.error('Failed to fetch products from MongoDB:', result.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching products from MongoDB:', error);
    return [];
  }
};

// Function to fetch filtered products from MongoDB based on applied filters
export const fetchFilteredProductsFromDB = async (filters = {}) => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Add category filter
    if (filters.category && filters.category !== '') {
      queryParams.append('category', filters.category);
    }
    
    // Add attribute filters
    if (filters.filters) {
      Object.entries(filters.filters).forEach(([key, values]) => {
        if (values && Array.isArray(values) && values.length > 0) {
          if (key === 'price') {
            queryParams.append('minPrice', String(values[0]));
            queryParams.append('maxPrice', String(values[1]));
          } else if (key === 'rating') {
            queryParams.append('minRating', String(Math.min(...values)));
          } else if (key === 'discount') {
            if (values.includes('yes') || values.includes(true)) {
              queryParams.append('hasDiscount', 'true');
            }
          } else {
            // Attribute filters (color, size, brand, etc.)
            queryParams.append(`attributes.${key}`, values.join(','));
          }
        }
      });
    }
    
    const url = `${API_BASE_URL}/products/filter?${queryParams.toString()}`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      const filteredProducts = result.data || [];
      console.log('Filtered products fetched from MongoDB:', filteredProducts);
      
      // Trigger update event for UI components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('filteredProductsUpdated', { 
          detail: { products: filteredProducts, filters }
        }));
      }
      
      return filteredProducts;
    } else {
      console.warn('API returned success:false, throwing an error:', result.message);
      throw new Error(result.message || 'Failed to fetch filtered products');
    }
  } catch (error) {
    console.error('Error in fetchFilteredProductsFromDB:', error);
    return [];
  }
};

// Function to get all real categories from MongoDB
export const getAllCategories = () => {
  return categoriesData;
};

// Function to get category by key
export const getCategoryByKey = (key) => {
  return categoriesData.find(cat => cat.key === key);
};

// Function to get category by name
export const getCategoryByName = (name) => {
  return categoriesData.find(cat => cat.name === name);
};

// Function to get attributes for a category
export const getCategoryAttributes = (categoryKey) => {
  return attributesData[categoryKey] || {};
};

// Function to get attribute values for a specific attribute
export const getAttributeValues = (categoryKey, attributeName) => {
  return attributesData[categoryKey]?.[attributeName] || [];
};

// Function to get all products from MongoDB
export const getAllProducts = () => {
  return productsData;
};

// Function to refresh categories data (for real-time updates)
export const refreshCategoriesData = async () => {
  console.log('Refreshing categories data from MongoDB...');
  const result = await fetchCategoriesFromDB();
  return result;
};

// Function to refresh products data (for real-time updates)
export const refreshProductsData = async () => {
  console.log('Refreshing products data from MongoDB...');
  const result = await fetchProductsFromDB();
  return result;
};

// Function to refresh all data
export const refreshAllData = async () => {
  const [categoriesResult, productsResult] = await Promise.all([
    refreshCategoriesData(),
    refreshProductsData()
  ]);
  
  return {
    categories: categoriesResult,
    products: productsResult
  };
};

// Auto-fetch real data on module load (client-side only)
let isInitialized = false;

const initializeData = () => {
  if (typeof window !== 'undefined' && !isInitialized) {
    isInitialized = true;
    
    // Fetch categories immediately
    fetchCategoriesFromDB();
    
    // Fetch products if needed
    fetchProductsFromDB();
    
    // Set up periodic refresh (every 2 minutes for real-time updates)
    setInterval(refreshAllData, 2 * 60 * 1000);
  }
};

// Initialize data when module loads
initializeData();

// NO DUMMY DATA - All data comes from MongoDB in real-time

// Enhanced product functions with real-time MongoDB data
export const getProductsByCategory = (categoryKey) => {
  return productsData.filter(product => {
    const category = getCategoryByKey(categoryKey);
    return category && (product.category === category.name || product.mainCategory === category.key);
  });
};

// Function to get products by category name
export const getProductsByCategoryName = (categoryName) => {
  return productsData.filter(product => {
    return product.category === categoryName || product.mainCategory === categoryName;
  });
};

// Function to validate product attributes against real category schema from MongoDB
export const validateProductAttributes = (product) => {
  const category = categoriesData.find(cat => 
    cat.name === product.category || cat.key === product.mainCategory
  );
  if (!category) return false;
  
  const categoryAttrs = attributesData[category.key] || {};
  const productAttrs = product.attributes || {};
  
  // Check if all product attributes are valid for the category
  for (const [attrName, attrValue] of Object.entries(productAttrs)) {
    if (categoryAttrs[attrName]) {
      if (Array.isArray(attrValue)) {
        // Check if all values in array are valid
        const validValues = categoryAttrs[attrName];
        if (!attrValue.every(val => validValues.includes(val))) {
          return false;
        }
      } else {
        // Check if single value is valid
        if (!categoryAttrs[attrName].includes(attrValue)) {
          return false;
        }
      }
    }
  }
  
  return true;
};

// Function to get filtered products based on real MongoDB data
export const getFilteredProducts = (filters = {}) => {
  return productsData.filter(product => {
    // Filter by category
    if (filters.category && 
        product.category !== filters.category && 
        product.mainCategory !== filters.category) {
      return false;
    }
    
    // Filter by attributes
    if (filters.attributes) {
      for (const [attrName, attrValues] of Object.entries(filters.attributes)) {
        const productAttrValue = product.attributes?.[attrName];
        if (!productAttrValue) return false;
        
        if (Array.isArray(productAttrValue)) {
          // Check if any product attribute value matches filter
          if (!productAttrValue.some(val => attrValues.includes(val))) {
            return false;
          }
        } else {
          // Check if single value matches filter
          if (!attrValues.includes(productAttrValue)) {
            return false;
          }
        }
      }
    }
    
    // Filter by price range
    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      const finalPrice = product.price * (1 - (product.discount || 0) / 100);
      if (min !== undefined && finalPrice < min) return false;
      if (max !== undefined && finalPrice > max) return false;
    }
    
    return true;
  });
};

// Function to get unique attribute values from real products
export const getUniqueAttributeValues = (categoryKey, attributeName) => {
  const categoryProducts = getProductsByCategory(categoryKey);
  const values = new Set();
  
  categoryProducts.forEach(product => {
    const attrValue = product.attributes?.[attributeName];
    if (attrValue) {
      if (Array.isArray(attrValue)) {
        attrValue.forEach(val => values.add(val));
      } else {
        values.add(attrValue);
      }
    }
  });
  
  return Array.from(values);
};

// Real-time update listeners setup (client-side only)
const setupEventListeners = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('categoriesUpdated', (event) => {
      console.log('Real Categories data updated from MongoDB:', (event).detail);
      // Trigger UI updates here
    });
    
    window.addEventListener('productsUpdated', (event) => {
      console.log('Real Products data updated from MongoDB:', (event).detail);
      // Trigger UI updates here
    });
  }
};

// Setup event listeners when module loads
setupEventListeners();