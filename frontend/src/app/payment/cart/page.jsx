"use client";
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/navBar/page";
import Footer from "../../components/footer/page";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { clearCart } from "../../slices/cartSlice";
import CollaborativePurchaseModal from '../../modal/CollaborativePurchaseModal/CollaborativePurchaseModal';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function PaymentForm({ clientSecret, amount, currency, lineItems, onSuccess }) {
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
                try {
                    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
                        items: lineItems,
                        total: amount,
                        status: 'Processing',
                    }, { withCredentials: true });
                    toast.success("Payment successful");
                    onSuccess?.();
                    router.push("/user/history");
                } catch (e) {
                    toast.error("Payment succeeded but failed to create order");
                }
            }
        } catch (err) {
            toast.error("Payment error");
        } finally {
            setIsLoading(false);
        }
    };
    console.log("Amount:", amount);

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

export default function CartPaymentPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { user } = useSelector((state) => state.userState);
    const cart = useSelector((state) => state.cartState.items);
    const [clientSecret, setClientSecret] = useState("");
    const [isCollaborativeModalOpen, setIsCollaborativeModalOpen] = useState(false);
    useEffect(() => {
        if (!user) {
            toast.error('Please login to continue');
            router.push('/login');
        }
    }, [user, router]);

    const { amount, currency, shipping, lineItems, topItem } = useMemo(() => {
        const currency = 'usd';
        const shippingCost = cart.length > 0 ? 10 : 0;
        const items = cart.map((i) => {
            const p = i.product;
            const price = p.salePrice > 0 ? p.salePrice : p.retailPrice;
            return {
                productId: p._id,
                _id: p._id, // Add _id for compatibility
                name: p.name,
                price,
                quantity: i.quantity,
                image: (p.images && (p.images[0]?.url || p.images[0])) || '/placeholder.svg'
            };
        });
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const topItem = items.length > 0 ? items.reduce((max, i) => (max && (max.price * max.quantity) > (i.price * i.quantity) ? max : i), items[0]) : null;
        return {
            amount: subtotal + shippingCost,
            currency,
            shipping: shippingCost,
            lineItems: items,
            topItem,
        };
    }, [cart]);

    useEffect(() => {
        const createIntent = async () => {
            try {
                const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent`, {
                    amount: Math.round(amount * 100),
                    currency,
                    metadata: {
                        mode: 'cart',
                        items: JSON.stringify(lineItems.map(({ productId, quantity, price }) => ({ productId, quantity, price })))
                    },
                }, { withCredentials: true });
                setClientSecret(res.data.clientSecret);
            } catch (e) {
                console.error(e);
                toast.error("Failed to initialize payment");
            }
        };
        if (amount > 0) createIntent();
    }, [amount, currency, lineItems]);

    const handleSuccess = () => {
        dispatch(clearCart());
    };

    const openCollaborativeModal = () => {
        console.log('Opening collaborative modal with topItem:', topItem);
        console.log('Cart items:', cart);
        console.log('Line items:', lineItems);
        setIsCollaborativeModalOpen(true);
    };
    const closeCollaborativeModal = () => setIsCollaborativeModalOpen(false);

    return (
        <>
            <div className='pl-[80px] pr-[80px]'>
                <Navbar />
                <div className='w-full flex flex-col lg:flex-row gap-6 mt-6'>
                    <div className='w-full lg:w-[60%] space-y-4'>
                        <div className='p-5 border-2 border-[#D9D9D9] rounded-[10px]'>
                            <h2 className='text-xl font-semibold mb-3'>Order Summary</h2>
                            {cart.length === 0 ? (
                                <p className='text-sm text-[#5C5C5C]'>Your cart is empty.</p>
                            ) : (
                                cart.map((item) => {
                                    const p = item.product;
                                    const price = p.salePrice > 0 ? p.salePrice : p.retailPrice;
                                    return (
                                        <div key={item.productId} className='flex gap-4 py-3 border-b'>
                                            <div className='w-[90px] h-[90px] rounded-[8px] overflow-hidden bg-gray-100'>
                                                <Image
                                                    src={(p.images && (p.images[0]?.url || p.images[0])) || '/placeholder.svg'}
                                                    alt={p.name}
                                                    width={90}
                                                    height={90}
                                                    className='w-full h-full object-cover'
                                                />
                                            </div>
                                            <div className='flex-1'>
                                                <h3 className='font-semibold'>{p.name}</h3>
                                                <p className='text-sm text-[#5C5C5C]'>Qty: {item.quantity}</p>
                                                <p className='font-medium'>US ${(price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div className='flex justify-between mt-3'>
                                <span className='text-sm text-[#5C5C5C]'>Shipping</span>
                                <span className='font-medium'>US ${shipping.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between mt-1'>
                                <span className='text-sm text-[#5C5C5C]'>Total</span>
                                <span className='font-semibold'>US ${amount.toFixed(2)}</span>
                            </div>
                            <div className='mt-4 flex flex-col sm:flex-row gap-3'>
                                <button
                                    onClick={() => {
                                        if (!lineItems || lineItems.length === 0) return;
                                        const encoded = encodeURIComponent(JSON.stringify(lineItems));
                                        router.push(`/surprisegift?items=${encoded}`)
                                    }}
                                    disabled={!topItem}
                                    className='px-4 py-2 rounded-[8px] border-2 border-[#822BE2] text-[#822BE2] font-semibold hover:bg-purple-50'
                                >
                                    Surprise Gift Delivery
                                </button>
                                {amount >= 50 && (
                                    <button
                                        onClick={openCollaborativeModal}
                                        className='px-4 py-2 rounded-[8px] bg-[#822BE2] text-white font-semibold hover:bg-purple-600'
                                    >
                                        Gift Collaboration
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='w-full lg:w-[40%]'>
                        <div className='p-5 border-2 border-[#D9D9D9] rounded-[10px]'>
                            <h2 className='text-xl font-semibold mb-3'>Card details</h2>
                            {clientSecret && (
                                <Elements options={{ clientSecret }} stripe={stripePromise}>
                                    <PaymentForm clientSecret={clientSecret} amount={amount} currency={currency} lineItems={lineItems} onSuccess={handleSuccess} />
                                </Elements>
                            )}
                            {!clientSecret && (
                                <p className='text-sm text-red-500'>Initializing payment...</p>
                            )}
                        </div>
                    </div>
                </div>
                <Toaster position="top-center" richColors closeButton />
                <CollaborativePurchaseModal
                    isOpen={isCollaborativeModalOpen}
                    onClose={closeCollaborativeModal}
                    onAccept={(emails) => {
                        setIsCollaborativeModalOpen(false);
                        toast.success("Collaborative purchase created! Invitations sent to participants.");
                    }}
                    // Multi-product support
                    isMultiProduct={lineItems && lineItems.length > 1}
                    products={lineItems}
                    // Single product support (legacy)
                    productName={topItem?.name}
                    productPrice={topItem?.price}
                    productID={topItem?._id}
                    quantity={topItem?.quantity}
                />
            </div>
            <Footer />
        </>
    );
}


