'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from 'sonner';
import axios from 'axios';
import Image from 'next/image';
import Navbar from '../../components/navBar/page';
import { ArrowLeft, ShoppingCart, Heart } from 'lucide-react';

const CustomizePage = () => {
  const { productId } = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.userState);
  
  // State management
  const [product, setProduct] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [customMessage, setCustomMessage] = useState('');

  // Popular wishes/quotes (hardcoded for simplicity)
  const popularWishes = [
    "Happy Birthday! May all your wishes come true!",
    "Wishing you a wonderful day filled with joy and happiness!",
    "May this special day bring you endless joy and tons of precious memories!",
    "Here's to another year of wonderful adventures!",
    "Happy Anniversary! Here's to many more years of love and happiness!",
    "Congratulations on your special day!",
    "Thinking of you with love and warm wishes!",
    "May your day be filled with love, laughter and joy!",
    "Best wishes on your special day!",
    "Hope your day is as special as you are!"
  ];

  // Format GBP currency
  const formatGBP = (value) => {
    const num = typeof value === 'number' ? value : Number(value || 0);
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(num);
  };

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`);
        if (response.data.success) {
          setProduct(response.data.data);
        } else {
          toast.error('Product not found');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  // Handle quote selection
  const handleQuoteSelect = (quote) => {
    setSelectedQuote(quote);
    setCustomMessage(''); // Clear custom message when selecting a quote
  };

  // Save customization
  const handleSaveCustomization = async () => {
    if (!user) {
      toast.error('Please login to save customization');
      router.push('/login');
      return;
    }

    const finalMessage = selectedQuote || customMessage.trim();
    if (!finalMessage) {
      toast.error('Please select a wish or add your custom message');
      return;
    }

    try {
      const customizationData = {
        productId: product._id,
        customizationType: product.customizationType,
        selectedQuote: selectedQuote ? {
          id: null, // No ID for hardcoded quotes
          text: selectedQuote,
          category: 'popular'
        } : null,
        customMessage: selectedQuote ? '' : customMessage.trim(),
        fontStyle: 'Arial',
        fontSize: 16,
        fontColor: '#000000',
        backgroundColor: '#FFFFFF'
      };

      console.log('Sending customization data:', customizationData);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/customizations`,
        customizationData,
        {
          withCredentials: true // Use cookie-based authentication like other parts of the app
        }
      );

      if (response.data.success) {
        toast.success('Customization saved successfully!');
        // Redirect to payment with customization
        router.push(`/payment?customizationId=${response.data.data._id}`);
      } else {
        toast.error('Failed to save customization');
      }
    } catch (error) {
      console.error('Error saving customization:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save customization');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!product.isCustomizable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Customizable</h1>
          <p className="text-gray-600 mb-4">This product cannot be customized.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const selectedMessage = selectedQuote || customMessage.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Toaster />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Customize Your {product.customizationType}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Product Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[400px] relative">
                  {/* Product Image */}
                  {product.images?.[0] && (
                    <div className="mb-4">
                      <Image
                        src={product.images[0].url || product.images[0]}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="mx-auto rounded-lg"
                      />
                    </div>
                  )}
                  
                  {/* Message Preview */}
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-medium text-gray-700">
                      {selectedMessage ? (
                        <div className="italic">"{selectedMessage}"</div>
                      ) : (
                        <div className="text-gray-400">
                          Select a wish or add your message to see preview
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.shortDescription}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-bold text-purple-600">
                      {formatGBP(((product.salePrice > 0 ? product.salePrice : product.retailPrice) + (product.customizationPrice || 0)))}
                    </span>
                    <Badge variant="secondary">
                      +{formatGBP(product.customizationPrice || 0)} for customization
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Customization Options */}
          <div className="space-y-6">
            {/* Popular Wishes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Popular Wishes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {popularWishes.map((wish, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedQuote === wish
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleQuoteSelect(wish)}
                    >
                      <p className="text-sm italic">"{wish}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Message */}
            <Card>
              <CardHeader>
                <CardTitle>Your Custom Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customMessage">Write your personal message</Label>
                    <Textarea
                      id="customMessage"
                      placeholder="Write your personal message here..."
                      value={customMessage}
                      onChange={(e) => {
                        setCustomMessage(e.target.value);
                        setSelectedQuote(null); // Clear selected quote when typing
                      }}
                      rows={4}
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {customMessage.length}/200 characters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <Button
              onClick={handleSaveCustomization}
              className="w-full"
              size="lg"
              disabled={!selectedMessage}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Save & Continue to Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizePage;