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
function PaymentForm({ clientSecret, amount, currency, product, qty }) {
	const stripe = useStripe();
	const elements = useElements();
	const router = useRouter();
	const { user } = useSelector((state) => state.userState);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!stripe || !elements) return;
		setIsLoading(true);
		try {
			const result = await stripe.confirmCardPayment(clientSecret, {
				payment_method: {
					card: elements.getElement(CardElement),
					billing_details: {
						name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || undefined,
						email: user?.email || undefined,
					},
				},
			});

			if (result.error) {
				toast.error(result.error.message || "Payment failed");
			} else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
				// Create order after successful payment
				try {
					const orderData = {
						items: [{
							productId: product._id,
							name: product.name,
							price: (product.salePrice > 0 ? product.salePrice : product.retailPrice),
							quantity: qty,
							image: (product.images && product.images[0] && (product.images[0].url || product.images[0])) || "/placeholder.svg"
						}],
						total: amount,
						status: "Processing"
					};

					await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/orders/create`, orderData, {
						withCredentials: true
					});

					toast.success("Payment successful! Order created.");
				} catch (orderError) {
					console.error("Failed to create order:", orderError);
					toast.error("Payment successful, but failed to create order record. Please contact support.");
				}
				
				router.push("/user/history");
			}
		} catch (err) {
			toast.error("Payment error");
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
				{isLoading ? "Processing..." : `Pay ${currency.toUpperCase()} ${amount.toFixed(2)}`}
			</button>
		</form>
	);
}

export default function PaymentPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const productId = searchParams.get("productId");
	const qty = parseInt(searchParams.get("qty") || "1", 10);
	const { user } = useSelector((state) => state.userState);
	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);
	const [clientSecret, setClientSecret] = useState("");
	const [showCollaborativeModal, setShowCollaborativeModal] = useState(false);

	useEffect(() => {
		const fetchProduct = async () => {
			if (!productId) return;
			try {
				setLoading(true);
				const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`);
				if (res.data?.success) setProduct(res.data.data);
			} catch (e) {
				console.error(e);
				toast.error("Failed to load product");
			} finally {
				setLoading(false);
			}
		};
		fetchProduct();
	}, [productId]);

	const { amount, currency, shipping } = useMemo(() => {
		const price = product ? (product.salePrice > 0 ? product.salePrice : product.retailPrice) : 0;
		const shippingCost = product ? 10 : 0;
		return {
			amount: price * (isNaN(qty) ? 1 : qty) + shippingCost,
			currency: "usd",
			shipping: shippingCost,
		};
	}, [product, qty]);

	useEffect(() => {
		const createIntent = async () => {
			if (!product || !amount) return;
			try {
				const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent`, {
					amount: Math.round(amount * 100),
					currency,
					metadata: {
						productId: product._id,
						quantity: qty,
						name: product.name,
					},
				}, { withCredentials: true });
				setClientSecret(res.data.clientSecret);
			} catch (e) {
				console.error(e);
				toast.error("Failed to initialize payment");
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
									<p className='text-sm text-[#5C5C5C]'>Quantity: {isNaN(qty) ? 1 : qty}</p>
									<p className='text-sm text-[#5C5C5C]'>Shipping: US ${shipping.toFixed(2)}</p>
									<p className='font-semibold mt-1'>Total: US ${amount.toFixed(2)}</p>
								</div>
							</div>
						)}
					</div>

					<div className='w-full lg:w-[40%] space-y-4'>
						<div className='p-5 border-2 border-[#D9D9D9] rounded-[10px]'>
						{amount.toFixed(2) >= 50 ? (
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
											<PaymentForm clientSecret={clientSecret} amount={amount} currency={currency} product={product} qty={qty} />
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
									Minimum order amount is $50 for collaborative purchases. Your current total is ${amount.toFixed(2)}.
								</p>
								{/* Individual Payment Option */}
								<div className='border-t pt-4'>
									<h3 className='font-semibold mb-3'>💳 Individual Payment</h3>
									{clientSecret && (
										<Elements options={{ clientSecret }} stripe={stripePromise}>
											<PaymentForm clientSecret={clientSecret} amount={amount} currency={currency} product={product} qty={qty} />
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
					productPrice={amount}
					productID={product._id || productId}
					quantity={qty}
				/>
			)}
		</>
	);
} 