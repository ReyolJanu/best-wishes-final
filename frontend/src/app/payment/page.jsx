"use client";
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/navBar/page";
import Footer from "../components/footer/page";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { toast, Toaster } from "sonner";
import CollaborativePurchaseModal from "../modal/CollaborativePurchaseModal/CollaborativePurchaseModal";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
console.log("stripePromise:", stripePromise);
console.log("Stripe Publishable Key:", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✅ Present" : "❌ Missing");
function PaymentForm({ clientSecret, amount, currency, product, qty, shipping, customization }) {
	const stripe = useStripe();
	const elements = useElements();
	const router = useRouter();
	const { user } = useSelector((state) => state.userState);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!stripe || !elements) {
			toast.error("Stripe not initialized properly");
			return;
		}
		
		if (!clientSecret) {
			toast.error("Payment not initialized. Please refresh and try again.");
			return;
		}
		
		setIsLoading(true);
		console.log("🔄 Starting payment confirmation with clientSecret:", clientSecret);
		
		try {
			const cardElement = elements.getElement(CardElement);
			if (!cardElement) {
				throw new Error("Card element not found");
			}

			console.log("💳 Confirming payment with Stripe...");
			const result = await stripe.confirmCardPayment(clientSecret, {
				payment_method: {
					card: cardElement,
					billing_details: {
						name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || undefined,
						email: user?.email || undefined,
					},
				},
			});

			console.log("💰 Payment result:", result);

			if (result.error) {
				console.error("❌ Payment failed:", result.error);
				toast.error(result.error.message || "Payment failed");
			} else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
				console.log("✅ Payment succeeded, creating order...");
				// Create order after successful payment
				try {
					const basePrice = product.salePrice > 0 ? product.salePrice : product.retailPrice;
					const customizationPrice = customization ? (product.customizationPrice || 0) : 0;
					const itemPrice = basePrice + customizationPrice;
					const productTotal = itemPrice * qty;
					const shippingCost = shipping || 10;
					
					const orderData = {
						items: [{
							productId: product._id,
							name: product.name,
							price: itemPrice,
							quantity: qty,
							image: (product.images && product.images[0] && (product.images[0].url || product.images[0])) || "/placeholder.svg",
							...(customization && { customization: {
								id: customization._id,
								selectedQuote: customization.selectedQuote,
								customMessage: customization.customMessage,
								fontStyle: customization.fontStyle,
								fontSize: customization.fontSize,
								fontColor: customization.fontColor
							}})
						}],
						subtotal: productTotal,
						shippingCost: shippingCost,
						total: amount,
						status: "Processing",
						...(customization && { customizationId: customization._id })
					};

					console.log("📝 Creating order with data:", orderData);
					const orderResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/orders/create`, orderData, {
						withCredentials: true
					});

					console.log("📋 Order created:", orderResponse.data);
					toast.success("Payment successful! Order created.");
					
					// Wait a moment before redirecting
					setTimeout(() => {
						router.push("/user/history");
					}, 2000);
				} catch (orderError) {
					console.error("❌ Failed to create order:", orderError);
					console.error("Order error details:", orderError.response?.data);
					toast.error("Payment successful, but failed to create order record. Please contact support.");
				}
			}
		} catch (err) {
			console.error("❌ Payment error:", err);
			toast.error(err.message || "Payment error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="w-full space-y-4">
			<div className="p-4 border rounded-[10px]">
				<CardElement options={{ hidePostalCode: true }} />
			</div>
			<button
				type="submit"
				className="w-full h-[50px] rounded-[8px] bg-[#822BE2] text-white font-bold disabled:opacity-50"
				disabled={!stripe || isLoading}
			>
				{isLoading ? "Processing..." : `Pay ${currency.toUpperCase()} ${(amount || 0).toFixed(2)}`}
			</button>
		</form>
	);
}

export default function PaymentPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const productId = searchParams.get("productId");
	const customizationId = searchParams.get("customizationId");
	const qty = parseInt(searchParams.get("qty") || "1", 10);
	const { user } = useSelector((state) => state.userState);
	const [product, setProduct] = useState(null);
	const [customization, setCustomization] = useState(null);
	const [loading, setLoading] = useState(true);
	const [clientSecret, setClientSecret] = useState("");
	const [showCollaborativeModal, setShowCollaborativeModal] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				
				if (customizationId) {
					// Fetch customization data (includes product data)
					const customizationRes = await axios.get(
						`${process.env.NEXT_PUBLIC_API_URL}/customizations/${customizationId}`,
						{
							withCredentials: true
						}
					);
					if (customizationRes.data?.success) {
						setCustomization(customizationRes.data.data);
						setProduct(customizationRes.data.data.product);
					}
				} else if (productId) {
					// Fetch regular product data
					const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`);
					if (res.data?.success) setProduct(res.data.data);
				}
			} catch (e) {
				console.error(e);
				toast.error("Failed to load product data");
			} finally {
				setLoading(false);
			}
		};
		
		if (productId || customizationId) {
			fetchData();
		}
	}, [productId, customizationId]);

	const { amount, currency, shipping } = useMemo(() => {
		if (!product) return { amount: 0, currency: "usd", shipping: 0 };
		
		const basePrice = Number(product.salePrice > 0 ? product.salePrice : product.retailPrice) || 0;
		const customizationPrice = customization ? Number(product.customizationPrice || 0) : 0;
		const totalPrice = basePrice + customizationPrice;
		const shippingCost = 10;
		const quantity = Number(qty) || 1;
		
		const finalAmount = totalPrice * quantity + shippingCost;
		
		console.log('Price calculation:', {
			basePrice,
			customizationPrice,
			totalPrice,
			quantity,
			shippingCost,
			finalAmount,
			isValid: !isNaN(finalAmount)
		});
		
		return {
			amount: isNaN(finalAmount) ? 0 : finalAmount,
			currency: "usd",
			shipping: shippingCost,
		};
	}, [product, qty, customization]);

	useEffect(() => {
		const createIntent = async () => {
			if (!product || !amount) return;
			try {
				console.log("🚀 Creating payment intent with amount:", Math.round(amount * 100), "cents");
				const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent`, {
					amount: Math.round(amount * 100),
					currency,
					metadata: {
						productId: product._id,
						quantity: qty,
						name: product.name,
					},
				}, { withCredentials: true });
				
				console.log("✅ Payment intent created:", res.data);
				setClientSecret(res.data.clientSecret);
			} catch (e) {
				console.error("❌ Failed to create payment intent:", e);
				console.error("Error details:", e.response?.data);
				toast.error(e.response?.data?.message || "Failed to initialize payment");
			}
		};
		createIntent();
	}, [product, amount, currency, qty]);

	const handleCollaborativePurchase = (emails) => {
		setShowCollaborativeModal(false);
		toast.success("Collaborative purchase created! Invitations sent to participants.");
		// Navigate to dashboard after a short delay
		setTimeout(() => {
			router.push("/dashboard/collaborative-purchases");
		}, 1500);
	};

	// Debug logging
	useEffect(() => {
		console.log('Payment page - productId from URL:', productId);
		console.log('Payment page - product:', product);
		console.log('Payment page - product._id:', product?._id);
		console.log('Payment page - product.id:', product?.id);
		console.log('Payment page - product keys:', product ? Object.keys(product) : 'no product');
		console.log('Payment page - final productId for modal:', product?._id || productId);
	}, [productId, product]);

	if (loading) {
		return (
			<div className='pl-[80px] pr-[80px]'>
				<Navbar />
				<div className="p-6 text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className='pl-[80px] pr-[80px]'>
				<Navbar />
				<div className='w-full flex flex-col lg:flex-row gap-6 mt-6'>
					<div className='w-full lg:w-[60%] space-y-4'>
						<div className='p-5 border-2 border-[#D9D9D9] rounded-[10px]'>
							<h2 className='text-xl font-semibold mb-3'>Payer</h2>
							<p className='text-[#5C5C5C]'>Name</p>
							<p className='font-semibold text-[#822BE2]'>
								{user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Guest"}
							</p>
							{user?.email && (
								<div className='mt-2'>
									<p className='text-[#5C5C5C]'>Email</p>
									<p className='font-medium'>{user.email}</p>
								</div>
							)}
						</div>

						{product && (
							<div className='p-5 border-2 border-[#D9D9D9] rounded-[10px] flex gap-4'>
								<div className='w-[120px] h-[120px] rounded-[8px] overflow-hidden bg-gray-100'>
									<Image
										src={(product.images && product.images[0] && (product.images[0].url || product.images[0])) || "/placeholder.svg"}
										alt={product.name}
										width={120}
										height={120}
										className='w-full h-full object-cover'
									/>
								</div>
								<div className='flex-1'>
									<h3 className='font-semibold'>{product.name}</h3>
									{customization && (
										<div className='text-sm text-[#5C5C5C] mt-1'>
											<p>✨ Customized Product</p>
											{customization.selectedQuote && (
												<p className='italic'>"{customization.selectedQuote}"</p>
											)}
											{customization.customMessage && (
												<p className='italic'>Custom: "{customization.customMessage}"</p>
											)}
										</div>
									)}
									<p className='text-sm text-[#5C5C5C]'>Quantity: {isNaN(qty) ? 1 : qty}</p>
									<p className='text-sm text-[#5C5C5C]'>Shipping: US ${(shipping || 0).toFixed(2)}</p>
									<p className='font-semibold mt-1'>Total: US ${(amount || 0).toFixed(2)}</p>
								</div>
							</div>
						)}
					</div>

					<div className='w-full lg:w-[40%] space-y-4'>
						<div className='p-5 border-2 border-[#D9D9D9] rounded-[10px]'>
						{(amount || 0) >= 50 ? (
							<>
								<h2 className='text-xl font-semibold mb-3'>Payment Options</h2>
								
								{/* Collaborative Purchase Option */}
								<div className='mb-4 p-4 border border-purple-200 rounded-lg bg-purple-50'>
									<h3 className='font-semibold text-purple-700 mb-2'>🛒 Collaborative Purchase</h3>
									<p className='text-sm text-gray-600 mb-3'>
										Split the cost with friends! Invite up to 3 people to share the purchase.
									</p>
									<button
										onClick={() => {
											console.log('Button clicked - product:', product);
											console.log('Button clicked - product._id:', product?._id);
											console.log('Button clicked - productId from URL:', productId);
											
											if (!product) {
												toast.error('Product not loaded yet. Please wait a moment and try again.');
												return;
											}
											
											const finalProductId = product._id || productId;
											console.log('Button clicked - finalProductId:', finalProductId);
											
											if (!finalProductId) {
												toast.error('Product ID is missing. Please refresh the page and try again.');
												console.error('Product ID missing - product._id:', product._id, 'productId from URL:', productId);
												return;
											}
											
											setShowCollaborativeModal(true);
										}}
										className='w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
										disabled={!product || (!product._id && !productId)}
									>
										Create Collaborative Purchase
									</button>
								</div>
								
								{/* Individual Payment Option */}
								<div className='border-t pt-4'>
									<h3 className='font-semibold mb-3'>💳 Individual Payment</h3>
									{clientSecret && (
										<Elements options={{ clientSecret }} stripe={stripePromise}>
											<PaymentForm 
												clientSecret={clientSecret} 
												amount={amount} 
												currency={currency} 
												product={product} 
												qty={qty}
												shipping={shipping}
												customization={customization}
											/>
										</Elements>
									)}
									{!clientSecret && (
										<p className='text-sm text-green-500'>Initializing payment...</p>
									)}
								</div>

								{/* Gift Options */}
								{amount >= 20 && (
									<div className="w-full flex flex-col sm:flex-row gap-[15px] mt-4">
										<button
											className="border text-[#822BE2] rounded-[8px] h-[50px] font-semibold hover:bg-purple-50 transition-colors w-full"
											onClick={() => router.push(`/surprisegift?productId=${product?._id || productId}&qty=${qty}`)}
										>
											Apply Surprise Gift
										</button>
									</div>
								)}
							</>
						) : (
							<div>
								<h2 className='text-xl font-semibold mb-3'>Payment Options</h2>
								<p className='text-sm text-gray-600 mb-4'>
									Minimum order amount is $50 for collaborative purchases. Your current total is ${(amount || 0).toFixed(2)}.
								</p>
								{/* Individual Payment Option */}
								<div className='border-t pt-4'>
									<h3 className='font-semibold mb-3'>💳 Individual Payment</h3>
									{clientSecret && (
										<Elements options={{ clientSecret }} stripe={stripePromise}>
											<PaymentForm 
												clientSecret={clientSecret} 
												amount={amount} 
												currency={currency} 
												product={product} 
												qty={qty}
												shipping={shipping}
												customization={customization}
											/>
										</Elements>
									)}
									{!clientSecret && (
										<p className='text-sm text-green-500'>Initializing payment...</p>
									)}
								</div>

								{/* Gift Options */}
								{amount >= 20 && (
									<div className="w-full flex flex-col sm:flex-row gap-[15px] mt-4">
										<button
											className="border text-[#822BE2] rounded-[8px] h-[50px] font-semibold hover:bg-purple-50 transition-colors w-full"
											onClick={() => router.push(`/surprisegift?productId=${product?._id || productId}&qty=${qty}`)}
										>
											Apply Surprise Gift
										</button>
									</div>
								)}
							</div>
						)}
						</div>
					</div>
				</div>
				<Toaster position="top-center" richColors closeButton />
			</div>
			<Footer />
			
			{/* Collaborative Purchase Modal */}
			{showCollaborativeModal && product && (product._id || productId) && (
				<CollaborativePurchaseModal
					isOpen={showCollaborativeModal}
					onClose={() => setShowCollaborativeModal(false)}
					onAccept={handleCollaborativePurchase}
					// Single product support
					isMultiProduct={false}
					productName={product?.name || ""}
					productPrice={Number(product.salePrice > 0 ? product.salePrice : product.retailPrice) + (customization ? Number(product.customizationPrice || 0) : 0)}
					productID={product._id || productId}
					quantity={qty}
				/>
			)}
		</>
	);
} 