"use client";
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../../components/navBar/page';
import Footer from '../../components/footer/page';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RiDeleteBin6Line, 
  RiHeartFill, 
  RiShoppingCartLine, 
  RiEyeLine,
  RiFilterLine,
  RiSortAsc,
  RiSearchLine
} from 'react-icons/ri';
import { removeFromWishlist, clearWishlist } from '../../slices/wishlistSlice';
import { addToCart } from '../../slices/cartSlice';
import { toast, Toaster } from 'sonner';
import { AiFillStar, AiOutlineStar, AiTwotoneStar } from 'react-icons/ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function WishlistPage() {
  const wishlist = useSelector((state) => state.wishlistState.items);
  const dispatch = useDispatch();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const handleRemove = (id) => {
    dispatch(removeFromWishlist(id));
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Added to cart');
  };

  const handleClearWishlist = () => {
    dispatch(clearWishlist());
    toast.success('Wishlist cleared');
  };

  const handleViewProduct = (productId) => {
    router.push(`/productDetail/${productId}`);
  };

  // Filter and sort products
  const filteredProducts = wishlist
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return (a.salePrice || a.price || a.retailPrice) - (b.salePrice || b.price || b.retailPrice);
        case 'price-high':
          return (b.salePrice || b.price || b.retailPrice) - (a.salePrice || a.price || a.retailPrice);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      if (typeof product.images[0] === 'object' && product.images[0].url) {
        return product.images[0].url;
      }
      return product.images[0];
    }
    return product.image || '/placeholder.svg';
  };

  const getProductPrice = (product) => {
    return product.salePrice || product.price || product.retailPrice || 0;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                <p className="mt-2 text-gray-600">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                </p>
              </div>
              {wishlist.length > 0 && (
                <Button
                  onClick={handleClearWishlist}
                  variant="outline"
                  className="mt-4 sm:mt-0 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <RiDeleteBin6Line className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {wishlist.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <RiHeartFill className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-8">Start adding items you love to your wishlist</p>
              <Button onClick={() => router.push('/allProducts')} className="bg-purple-600 hover:bg-purple-700">
                <RiSearchLine className="w-4 h-4 mr-2" />
                Browse Products
              </Button>
            </div>
          ) : (
            <>
              {/* Search and Filter Section */}
              <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search your wishlist..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Rating</option>
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                      <RiFilterLine className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                      <RiSortAsc className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Grid/List */}
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {filteredProducts.map((product) => (
                  <Card key={product._id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        width={400}
                        height={300}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button
                          onClick={() => handleRemove(product._id)}
                          className="p-2 bg-white/90 hover:bg-red-50 rounded-full shadow-sm transition-colors"
                        >
                          <RiDeleteBin6Line className="w-4 h-4 text-red-500" />
                        </button>
                        <button
                          onClick={() => handleViewProduct(product._id)}
                          className="p-2 bg-white/90 hover:bg-blue-50 rounded-full shadow-sm transition-colors"
                        >
                          <RiEyeLine className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400 text-sm">
                          {Array.from({ length: 5 }, (_, i) => {
                            const fullStars = Math.floor(product.rating || 0);
                            const hasHalfStar = (product.rating || 0) - fullStars >= 0.5;
                            if (i < fullStars) {
                              return <AiFillStar key={i} className="w-4 h-4" />;
                            } else if (i === fullStars && hasHalfStar) {
                              return <AiTwotoneStar key={i} className="w-4 h-4" />;
                            } else {
                              return <AiOutlineStar key={i} className="w-4 h-4" />;
                            }
                          })}
                        </div>
                        <span className="ml-2 text-sm text-gray-500">
                          ({product.rating || 0})
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-xl font-bold text-purple-600">
                            UK £{getProductPrice(product).toFixed(2)}
                          </span>
                          {product.retailPrice && product.retailPrice > getProductPrice(product) && (
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              UK £{product.retailPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <RiShoppingCartLine className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          onClick={() => handleViewProduct(product._id)}
                          variant="outline"
                          className="px-3"
                        >
                          <RiEyeLine className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* No results for search */}
              {filteredProducts.length === 0 && searchTerm && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No items found matching "{searchTerm}"</p>
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
