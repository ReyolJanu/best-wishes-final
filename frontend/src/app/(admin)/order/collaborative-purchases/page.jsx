"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Eye,
  Package,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  ShoppingBag,
  Gift,
  User,
  MapPin,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

// Status colors for consistency
const statusColors = {
  processing: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300", 
  normal: "bg-green-100 text-green-800 border-green-300",
  low: "bg-blue-100 text-blue-800 border-blue-300",
};

const packingStatusColors = {
  not_packed: "bg-gray-100 text-gray-800",
  partially_packed: "bg-yellow-100 text-yellow-800",
  fully_packed: "bg-green-100 text-green-800",
};

export default function CollaborativePurchasesPage() {
  const router = useRouter();
  const [collaborativePurchases, setCollaborativePurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    fetchCollaborativePurchases();
  }, []);

  const fetchCollaborativePurchases = async () => {
    try {
      setLoading(true);
      console.log("🔧 API Configuration Check:");
      console.log("API_BASE_URL:", API_BASE_URL);
      console.log("Expected format: http://localhost:5000/api");
      
      console.log("Fetching all collaborative purchases...");
      const response = await axios.get(`${API_BASE_URL}/collaborative-purchases/all`);
      console.log("API Response:", response.data); // Debugging log

      // Fix: Access the correct nested data structure
      const allPurchases = Array.isArray(response.data.collaborativePurchases) 
        ? response.data.collaborativePurchases 
        : [];

      // Filter purchases with status "Pending" only
      const relevantPurchases = allPurchases.filter(purchase => {
        // Include only Pending status
        return purchase.status === "Pending" || 
               (purchase.status && purchase.status.trim() === "Pending") ||
               (purchase.status && purchase.status.trim().toLowerCase() === "pending");
      });

      console.log(`Found ${relevantPurchases.length} relevant collaborative purchases`);
      
      // Test products endpoint connectivity
      console.log("🧪 Testing products database connectivity...");
      try {
        const testResponse = await axios.get(`${API_BASE_URL}/products/test`);
        console.log("✅ Products endpoint test successful:", testResponse.data);
      } catch (testError) {
        console.error("❌ Products endpoint test failed:", testError.response?.data || testError.message);
      }
      
      // Test specific product fetch with a known ID from collaborative purchase
      if (relevantPurchases.length > 0 && relevantPurchases[0].products && relevantPurchases[0].products[0]) {
        const testProductId = relevantPurchases[0].products[0].product;
        console.log(`🧪 Testing specific product fetch with ID: ${testProductId}`);
        try {
          const testProductResponse = await axios.get(`${API_BASE_URL}/products/${testProductId}`);
          console.log("✅ Specific product fetch test successful:", testProductResponse.data);
        } catch (testProductError) {
          console.error("❌ Specific product fetch test failed:");
          console.error("Error status:", testProductError.response?.status);
          console.error("Error message:", testProductError.message);
          console.error("Error response:", testProductError.response?.data);
        }
      }

      // Map collaborative purchases with fetched user and product details
      const mappedPurchases = await Promise.all(
        relevantPurchases.map(async (purchase) => {
          let userDetails = {
            firstName: 'Collaborative',
            lastName: 'Purchase',
            phone: 'N/A',
            email: 'N/A',
            address: 'N/A'
          };

          // Fetch user details using createdBy field
          if (purchase.createdBy) {
            try {
              console.log(`\n🔍 Fetching user details for createdBy: ${purchase.createdBy}`);
              console.log(`🌐 User API URL: ${API_BASE_URL}/users/${purchase.createdBy}`);
              
              const userResponse = await axios.get(`${API_BASE_URL}/users/${purchase.createdBy}`);
              console.log("📡 User API Response Status:", userResponse.status);
              console.log("📡 User API Response Data:", userResponse.data);
              
              const user = userResponse.data.user || userResponse.data || {};
              
              userDetails = {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                email: user.email || '',
                address: user.address || ''
              };

              console.log(`\n👤 COMPLETE USER DETAILS for Purchase ${purchase._id}:`);
              console.log("════════════════════════════════════════");
              console.log("User ID:", purchase.createdBy);
              console.log("First Name:", userDetails.firstName);
              console.log("Last Name:", userDetails.lastName);
              console.log("Email:", userDetails.email);
              console.log("Phone:", userDetails.phone);
              console.log("Address:", userDetails.address);
              console.log("Full User Object:", user);
              console.log("════════════════════════════════════════");
            } catch (userError) {
              console.error(`❌ Error fetching user details for ${purchase.createdBy}:`);
              console.error("Error details:", userError.response?.data || userError.message);
              console.error("Error status:", userError.response?.status);
            }
          }

          // Fetch and process product details
          let processedItems = [];
          
          console.log(`\n🔍 Processing products for purchase ${purchase._id}:`);
          console.log("Is Multi Product:", purchase.isMultiProduct);
          console.log("Products array:", purchase.products);
          
          if (purchase.isMultiProduct && purchase.products) {
            // Handle multiple products
            console.log(`Processing ${purchase.products.length} multiple products...`);
            processedItems = await Promise.all(
              purchase.products.map(async (product, index) => {
                console.log(`\n--- Processing Product ${index + 1} ---`);
                console.log("Product Object:", product);
                console.log("Product ID to fetch:", product.product);
                
                let productDetails = {
                  name: product.productName || 'Unknown Product',
                  sku: `FALLBACK-SKU-${product.product?.slice(-6) || index}`,
                  categories: ['Collaborative'],
                  price: product.productPrice || 0,
                  quantity: product.quantity || 1,
                  image: product.image || '/placeholder.svg',
                  description: 'No description available',
                  stock: 0,
                  brand: 'Unknown Brand'
                };

                // Fetch detailed product info if product ID exists
                if (product.product) {
                  try {
                    console.log(`🔍 Fetching product details for product ID: ${product.product}`);
                    console.log(`🌐 Product API URL: ${API_BASE_URL}/products/${product.product}`);
                    
                    const productResponse = await axios.get(`${API_BASE_URL}/products/${product.product}`);
                    console.log("📡 Product API Response Status:", productResponse.status);
                    console.log("📡 Product API Response Data:", productResponse.data);
                    
                    const productData = productResponse.data.product || productResponse.data || {};
                    
                    // Prioritize actual product database data over collaborative purchase stored data
                    productDetails = {
                      name: productData.name || product.productName || 'Unknown Product',
                      sku: productData.sku || `FALLBACK-SKU-${product.product?.slice(-6) || index}`,
                      categories: productData.categories || productData.category || ['Collaborative'],
                      price: productData.price || product.productPrice || 0, // Prioritize DB price
                      quantity: product.quantity || 1, // Keep purchase quantity
                      image: productData.image || product.image || '/placeholder.svg',
                      description: productData.description || 'No description available',
                      stock: productData.stock || productData.quantity || 0,
                      brand: productData.brand || 'Unknown Brand'
                    };

                    console.log(`\n🛍️ COMPLETE PRODUCT DATABASE DETAILS for Purchase ${purchase._id}, Product ${index + 1}:`);
                    console.log("════════════════════════════════════════");
                    console.log("✅ FETCHED FROM PRODUCTS DATABASE:");
                    console.log("Product ID:", product.product);
                    console.log("DB Product Name:", productData.name || "NOT FOUND IN DB");
                    console.log("DB SKU:", productData.sku || "NOT FOUND IN DB");
                    console.log("DB Categories:", productData.categories || productData.category || "NOT FOUND IN DB");
                    console.log("DB Price:", productData.price || "NOT FOUND IN DB");
                    console.log("DB Stock:", productData.stock || productData.quantity || "NOT FOUND IN DB");
                    console.log("DB Description:", productData.description || "NOT FOUND IN DB");
                    console.log("DB Brand:", productData.brand || "NOT FOUND IN DB");
                    console.log("DB Image:", productData.image || "NOT FOUND IN DB");
                    console.log("\n📦 STORED IN COLLABORATIVE PURCHASE:");
                    console.log("Stored Name:", product.productName);
                    console.log("Stored Price:", product.productPrice);
                    console.log("Stored Quantity:", product.quantity);
                    console.log("Stored Image:", product.image);
                    console.log("\n🔄 FINAL MERGED DATA:");
                    console.log("Final Name:", productDetails.name);
                    console.log("Final SKU:", productDetails.sku);
                    console.log("Final Categories:", productDetails.categories);
                    console.log("Final Price:", productDetails.price);
                    console.log("Final Quantity:", productDetails.quantity);
                    console.log("Final Image:", productDetails.image);
                    console.log("════════════════════════════════════════");
                  } catch (productError) {
                    console.error(`❌ PRODUCT DATABASE ACCESS FAILED for ${product.product}:`);
                    console.error("=== DETAILED ERROR ANALYSIS ===");
                    console.error("Error message:", productError.message);
                    console.error("Error status:", productError.response?.status);
                    console.error("Error status text:", productError.response?.statusText);
                    console.error("Error response data:", productError.response?.data);
                    console.error("API URL that failed:", `${API_BASE_URL}/products/${product.product}`);
                    console.error("Full error object:", productError);
                    console.error("================================");
                    
                    // Use fallback data from collaborative purchase if DB fetch fails
                    productDetails = {
                      name: product.productName || 'Unknown Product',
                      sku: `FALLBACK-SKU-${product.product?.slice(-6) || index}`,
                      categories: ['Collaborative'],
                      price: product.productPrice || 0,
                      quantity: product.quantity || 1,
                      image: product.image || '/placeholder.svg',
                      description: 'Product details could not be fetched from database',
                      stock: 0,
                      brand: 'Unknown Brand'
                    };
                    
                    console.log("⚠️ USING FALLBACK DATA FROM COLLABORATIVE PURCHASE STORAGE");
                    console.log("Fallback product details:", productDetails);
                  }
                }

                return {
                  id: product._id || `collab-product-${index}`,
                  product: product.product || '',
                  name: productDetails.name,
                  price: productDetails.price,
                  quantity: productDetails.quantity,
                  image: productDetails.image,
                  sku: productDetails.sku,
                  category: productDetails.categories,
                  weight: '1.0 lbs',
                  status: 'in_stock'
                };
              })
            );
          } else {
            // Handle single product
            let productDetails = {
              name: purchase.productName || 'Unknown Product',
              sku: `COLLAB-${purchase._id.slice(-6)}`,
              categories: 'Collaborative',
              price: purchase.productPrice || 0,
              quantity: purchase.quantity || 1,
              image: '/placeholder.svg'
            };

            // Fetch detailed product info if product ID exists
            if (purchase.product) {
              try {
                console.log(`Fetching single product details for product ID: ${purchase.product}`);
                const productResponse = await axios.get(`${API_BASE_URL}/products/${purchase.product}`);
                const productData = productResponse.data.product || {};
                
                productDetails = {
                  name: productData.name || purchase.productName || 'Unknown Product',
                  sku: productData.sku || `COLLAB-${purchase._id.slice(-6)}`,
                  categories: productData.categories || productData.category || 'Collaborative',
                  price: purchase.productPrice || productData.price || 0,
                  quantity: purchase.quantity || 1,
                  image: productData.image || '/placeholder.svg'
                };

                console.log(`Single Product Details for Purchase ${purchase._id}:`, {
                  name: productDetails.name,
                  sku: productDetails.sku,
                  categories: productDetails.categories,
                  price: productDetails.price,
                  quantity: productDetails.quantity,
                  image: productDetails.image
                });
              } catch (productError) {
                console.error(`Error fetching single product details for ${purchase.product}:`, productError);
              }
            }

            processedItems = [{
              id: purchase.product || `collab-item-${purchase._id}`,
              product: purchase.product || '',
              name: productDetails.name,
              price: productDetails.price,
              quantity: productDetails.quantity,
              image: productDetails.image,
              sku: productDetails.sku,
              category: productDetails.categories,
              weight: '1.0 lbs',
              status: 'in_stock'
            }];
          }

          // Log combined data for this purchase
          console.log(`\n🎯 ===== COMPLETE COLLABORATIVE PURCHASE ANALYSIS =====`);
          console.log(`Purchase ID: ${purchase._id}`);
          console.log(`Status: ${purchase.status}`);
          console.log(`Total Amount: £${purchase.totalAmount}`);
          console.log(`Share Amount: £${purchase.shareAmount}`);
          console.log(`Is Multi Product: ${purchase.isMultiProduct}`);
          console.log(`Created At: ${new Date(purchase.createdAt).toLocaleString()}`);
          console.log(`Deadline: ${new Date(purchase.deadline).toLocaleString()}`);
          
          console.log("\n👤 USER SUMMARY:");
          console.log("User ID:", purchase.createdBy);
          console.log("Full Name:", `${userDetails.firstName} ${userDetails.lastName}`.trim());
          console.log("Email:", userDetails.email);
          console.log("Phone:", userDetails.phone);
          console.log("Address:", userDetails.address);
          
          console.log("\n🛍️ PRODUCTS SUMMARY:");
          processedItems.forEach((item, idx) => {
            console.log(`Product ${idx + 1}:`);
            console.log(`  - Name: ${item.name}`);
            console.log(`  - SKU: ${item.sku}`);
            console.log(`  - Category: ${item.category}`);
            console.log(`  - Price: £${item.price}`);
            console.log(`  - Quantity: ${item.quantity}`);
            console.log(`  - Image: ${item.image}`);
          });
          
          console.log("\n👥 PARTICIPANTS SUMMARY:");
          purchase.participants?.forEach((participant, idx) => {
            console.log(`Participant ${idx + 1}:`);
            console.log(`  - Email: ${participant.email}`);
            console.log(`  - Payment Status: ${participant.paymentStatus}`);
            console.log(`  - Payment Link: ${participant.paymentLink}`);
          });
          
          console.log("🎯 ===================================================\n");

          return {
            id: purchase._id,
            _id: purchase._id,
            createdAt: purchase.createdAt,
            orderedAt: purchase.createdAt,
            orderDate: purchase.createdAt,
            status: purchase.status.toLowerCase(),
            total: purchase.totalAmount || 0,
            totalAmount: purchase.totalAmount || 0,
            statusHistory: [],
            user: userDetails,
            items: processedItems,
            deliveryNotes: '',
            trackingNumber: '',
            referenceCode: `COLLAB-${purchase._id.slice(-6)}`,
            orderId: purchase._id,
            priority: 'normal',
            orderSource: 'Collaborative Purchase',
            customerName: `${userDetails.firstName} ${userDetails.lastName}`.trim() || 'Collaborative Purchase',
            customerPhone: userDetails.phone || 'N/A',
            customerEmail: userDetails.email || 'N/A',
            customerNotes: '',
            packingStatus: 'not_packed',
            assignedStaff: '',
            codAmount: 0,
            paymentMethod: 'collaborative_payment',
            isGift: false,
            giftWrap: false,
            giftMessage: '',
            address: userDetails.address || 'N/A',
            billingAddress: userDetails.address || 'N/A',
            estimatedTime: '2-3 days',
            shippingMethod: 'standard',
            specialInstructions: '',
            internalNotes: ''
          };
        })
      );

      console.log("=== FINAL SUMMARY ===");
      console.log("Number of relevant purchases found:", mappedPurchases.length);
      console.log("Mapped Collaborative Purchases with complete data:", mappedPurchases);
      console.log("=====================");
      
      setCollaborativePurchases(mappedPurchases);
    } catch (error) {
      console.error("Error fetching collaborative purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    );
  };

  const handleViewParticipants = async (purchase) => {
    try {
      console.log("🔍 Attempting to fetch participants for purchase:", purchase._id);
      console.log("� Complete Purchase Object:", purchase);
      console.log("�📡 API Base URL:", API_BASE_URL);
      
      // Try different possible endpoint formats
      const possibleEndpoints = [
        `${API_BASE_URL}/collaborative-purchases/${purchase._id}/participants`,
        `${API_BASE_URL}/collaborative-purchases/participants/${purchase._id}`,
        `${API_BASE_URL}/collaborative-purchase/${purchase._id}/participants`,
        `${API_BASE_URL}/collaborative-purchases/${purchase._id}`,
      ];

      let participantsData = [];
      let successfulEndpoint = null;

      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🧪 Testing endpoint: ${endpoint}`);
          const response = await axios.get(endpoint);
          console.log("✅ Successful response from:", endpoint);
          console.log("📄 Response data:", response.data);
          
          // Extract participants from different possible response structures
          participantsData = response.data.participants || 
                           response.data.data?.participants || 
                           response.data.collaborativePurchase?.participants ||
                           [];
          
          successfulEndpoint = endpoint;
          break;
        } catch (endpointError) {
          console.log(`❌ Failed endpoint ${endpoint}:`, endpointError.response?.status);
          continue;
        }
      }

      if (!successfulEndpoint) {
        console.error("❌ All participant endpoints failed");
        // Fallback: Try to find participants in different parts of the purchase object
        let fallbackParticipants = [];
        
        // Check various possible locations for participant data
        const possibleParticipantLocations = [
          purchase.participants,
          purchase.collaborators,
          purchase.users,
          purchase.members,
          purchase.joinedUsers,
          purchase.sharedWith,
          // If it's stored as an array of user IDs, we might need to fetch user details
          purchase.participantIds,
          purchase.userIds
        ];
        
        for (const location of possibleParticipantLocations) {
          if (Array.isArray(location) && location.length > 0) {
            fallbackParticipants = location;
            console.log("🔄 Found participants in:", location);
            break;
          }
        }
        
        // If still no participants found, create mock data for demonstration
        if (fallbackParticipants.length === 0) {
          console.log("⚠️ No participants found anywhere. Creating mock participant for demonstration.");
          fallbackParticipants = [{
            _id: 'mock-participant-1',
            email: 'No participants found',
            phone: 'N/A',
            fullName: 'No Data Available',
            firstName: 'No',
            lastName: 'Data',
            paymentStatus: 'unknown'
          }];
        }
        
        participantsData = fallbackParticipants;
        console.log("🔄 Using participants from purchase object:", participantsData);
      }

      const participantData = {
        purchaseId: purchase._id,
        productName: purchase.items[0]?.name || 'Unknown Product',
        participants: participantsData,
      };

      console.log("🎯 Final Participant Data:", participantData);
      setSelectedParticipant(participantData);
      setShowParticipantModal(true);
    } catch (error) {
      console.error("❌ Error in handleViewParticipants:", error);
      
      // Fallback: Show modal with participants from purchase object if available
      const fallbackParticipants = purchase.participants || [];
      console.log("🔄 Using fallback participants:", fallbackParticipants);
      
      const participantData = {
        purchaseId: purchase._id,
        productName: purchase.items[0]?.name || 'Unknown Product',
        participants: fallbackParticipants,
      };
      
      setSelectedParticipant(participantData);
      setShowParticipantModal(true);
    }
  };

  const handleRemoveCollaborativePurchase = async (purchaseId) => {
    if (window.confirm("Are you sure you want to remove this collaborative purchase?")) {
      try {
        // Remove from local state immediately for better UX
        setCollaborativePurchases(prev => prev.filter(purchase => purchase._id !== purchaseId));
        
        // Here you would typically make an API call to remove from database
        // await axios.delete(`${API_BASE_URL}/collaborative-purchases/${purchaseId}`);
        
      } catch (error) {
        // Error handling for collaborative purchase removal
        // Refresh the list if there was an error
        fetchCollaborativePurchases();
      }
    }
  };

  // Comprehensive Participant Modal Component
  const ParticipantModal = () => {
    if (!showParticipantModal || !selectedParticipant) return null;

    return (
      <Dialog open={showParticipantModal} onOpenChange={setShowParticipantModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Collaborative Purchase Participants
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            View and manage participants for this collaborative purchase
          </DialogDescription>
          <div className="space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <p className="text-sm text-gray-600 mt-1">
                Product: <span className="font-medium">{selectedParticipant.productName}</span>
              </p>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {selectedParticipant.participants.length} Participant{selectedParticipant.participants.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            {/* Participants Grid */}
            <div className="grid gap-4">
              {selectedParticipant.participants.map((participant, index) => {
                console.log(`Participant ${index}:`, participant);
                return (
                <div key={index} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                        {participant.profileImage ? (
                          <img 
                            src={participant.profileImage} 
                            alt={participant.fullName || `${participant.firstName} ${participant.lastName}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/placeholder.svg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Participant Details */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name and Contact Information */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {participant.fullName || `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || 'Anonymous Participant'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                className={
                                  participant.paymentStatus === 'paid' 
                                    ? 'bg-green-100 text-green-800 border-green-300' 
                                    : participant.paymentStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                    : 'bg-red-100 text-red-800 border-red-300'
                                }
                              >
                                {participant.paymentStatus?.charAt(0).toUpperCase() + participant.paymentStatus?.slice(1) || 'Unknown'}
                              </Badge>
                            </div>
                          </div>

                          {/* Contact Information - Enhanced */}
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Contact Details</h5>
                              <div className="space-y-2">
                                {/* Email */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-4 h-4 text-blue-500" />
                                  <span className="font-medium text-gray-700">Email:</span>
                                  <span>{participant.email || 'Not provided'}</span>
                                </div>
                                
                                {/* Mobile/Phone */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4 text-green-500" />
                                  <span className="font-medium text-gray-700">Mobile:</span>
                                  <span>{participant.phone || participant.mobile || 'Not provided'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Address Information */}
                        <div className="space-y-3">
                          {participant.address && participant.address !== 'N/A' && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-1">Address</h5>
                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span className="break-words">{participant.address}</span>
                              </div>
                            </div>
                          )}

                          {/* Additional Info */}
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Participant ID: {participant._id}</div>
                            {participant.paymentLink && (
                              <div className="break-all">
                                Payment Link: {participant.paymentLink.substring(0, 20)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t pt-4 flex justify-end">
              <Button 
                onClick={() => setShowParticipantModal(false)}
                className="px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const ExpandableProductRow = ({ order, isExpanded }) => {
    if (!isExpanded) return null;

    return (
      <TableRow>
        <TableCell colSpan={8} className="bg-gray-50 p-0">
          <div className="p-4 space-y-3">
            <h4 className="font-medium text-sm text-gray-700">📦 Product Details</h4>
            <div className="grid gap-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white rounded border">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    <img 
                      src={item.image || '/placeholder.svg'} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <div className="text-gray-500">SKU: {item.sku}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span> {item.category}
                    </div>
                    <div>
                      <span className="text-gray-500">Qty:</span> {item.quantity}
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span> £{item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading collaborative purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">🤝 Collaborative Purchases</h1>
                <p className="text-sm text-gray-500">Manage pending collaborative purchases only</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCollaborativePurchases}
            >
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">{collaborativePurchases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    £{collaborativePurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Gift className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Processing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {collaborativePurchases.filter(p => p.status === 'processing').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Collaborative Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Order Details</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Gift</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborativePurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No collaborative purchases found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    collaborativePurchases.map((order, index) => (
                      <React.Fragment key={order.id || index}>
                        <TableRow className="hover:bg-gray-50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="p-1"
                            >
                              {expandedOrders.includes(order.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-blue-600">{order.referenceCode}</div>
                              <div className="text-sm text-muted-foreground">{order.orderId}</div>
                              <div className="flex gap-1">
                                <Badge variant="outline" className={priorityColors[order.priority]}>
                                  {order.priority}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-orange-100 text-orange-800 border-orange-300"
                                >
                                  🤝 {order.orderSource}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(order.orderDate).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{order.customerName}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {order.customerPhone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {order.customerEmail}
                              </div>
                              {order.user?.address && (
                                <div className="text-xs text-muted-foreground">
                                  <strong>Address:</strong> {order.user.address}
                                </div>
                              )}
                              {order.customerNotes && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                                  💡 {order.customerNotes}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{order.items.length} products</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.items.reduce((sum, item) => sum + item.quantity, 0)} total items
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleOrderExpansion(order.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 p-0 h-auto"
                              >
                                {expandedOrders.includes(order.id) ? "Hide Products" : "View Products"}
                              </Button>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              <Badge className={statusColors[order.status]}>
                                {order.status?.replace("_", " ") || "Unknown"}
                              </Badge>
                              {order.packingStatus !== "not_packed" && (
                                <Badge className={packingStatusColors[order.packingStatus]}>
                                  {order.packingStatus?.replace("_", " ") || "Unknown"}
                                </Badge>
                              )}
                              {order.assignedStaff && (
                                <div className="text-xs text-muted-foreground">👤 {order.assignedStaff}</div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-lg">£{order.totalAmount}</div>
                              {order.codAmount > 0 && (
                                <div className="text-xs text-orange-600 font-medium">💵 COD: £{order.codAmount}</div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {order.paymentMethod.replace("_", " ")}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              {order.isGift && <Gift className="h-4 w-4 text-pink-500" />}
                              {order.giftWrap && (
                                <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-800">
                                  🎁 Wrapped
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewParticipants(order)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveCollaborativePurchase(order._id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Package className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        <ExpandableProductRow order={order} isExpanded={expandedOrders.includes(order.id)} />
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Participant Details Modal */}
        <ParticipantModal />
      </div>
    </div>
  );
}