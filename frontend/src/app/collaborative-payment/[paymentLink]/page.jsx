'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js'


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

function PaymentForm({ clientSecret, amount, currency, collaborativePurchase, participant, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: participant.email.split('@')[0],
            email: participant.email,
          },
        },
      });

      if (result.error) {
        console.error('Stripe payment error:', result.error);
        toast.error(result.error.message || "Payment failed");
      } else if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
        console.log('Stripe payment succeeded:', result.paymentIntent.id);
        await onPaymentSuccess(result.paymentIntent.id);
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      toast.error("Payment processing failed");
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

export default function CollaborativePaymentPage() {
  const { paymentLink } = useParams();
  const router = useRouter();
  const [collaborativePurchase, setCollaborativePurchase] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [declineLoading, setDeclineLoading] = useState(false);

  useEffect(() => {
    const fetchCollaborativePurchase = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/collaborative-purchases/payment/${paymentLink}`);
        setCollaborativePurchase(res.data.collaborativePurchase);
        setParticipant(res.data.participant);
        setTimeRemaining(res.data.timeRemaining);
      } catch (err) {
        setError('Failed to load collaborative purchase details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (paymentLink) fetchCollaborativePurchase();
  }, [paymentLink]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!collaborativePurchase || !participant || clientSecret) return; // Don't recreate if already exists
      try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-intent`, {
          amount: Math.round(collaborativePurchase.shareAmount * 100),
          currency: 'usd',
          metadata: {
            collaborativePurchaseId: collaborativePurchase._id,
            participantEmail: participant.email,
            paymentLink: paymentLink,
          },
        });
        setClientSecret(res.data.clientSecret);
      } catch (e) {
        console.error(e);
        toast.error("Failed to initialize payment");
      }
    };
    createPaymentIntent();
  }, [collaborativePurchase, participant, paymentLink, clientSecret]);

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      console.log('Processing payment success with ID:', paymentIntentId);
      console.log('Participant email:', participant.email);
      console.log('Payment link:', paymentLink);
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/collaborative-purchases/payment/${paymentLink}`, {
        paymentIntentId,
        email: participant.email
      });
      
      console.log('Payment success response:', response.data);
      
      // Refresh the collaborative purchase data
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/collaborative-purchases/payment/${paymentLink}`);
      setCollaborativePurchase(res.data.collaborativePurchase);
      setParticipant(res.data.participant);
      
      toast.success("Payment completed successfully!");
    } catch (err) {
      console.error('Payment completion error:', err);
      console.error('Error response:', err.response?.data);
      toast.error(err.response?.data?.message || "Failed to process payment");
    }
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this collaborative purchase? This will cancel the entire purchase for all participants.')) {
      return;
    }

    setDeclineLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/collaborative-purchases/decline/${paymentLink}`, {
        email: participant.email
      });
      toast.success("Participation declined. The collaborative purchase has been cancelled.");
      router.push('/');
    } catch (err) {
      console.error(err);
      toast.error("Failed to decline participation");
    } finally {
      setDeclineLoading(false);
    }
  };

  const formatTimeRemaining = (ms) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !collaborativePurchase || !participant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Collaborative purchase not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isExpired = timeRemaining <= 0;
  const isPaid = participant.paymentStatus === 'paid';
  const isDeclined = participant.paymentStatus === 'declined';
  const isCancelled = collaborativePurchase.status === 'cancelled';
  const isCompleted = collaborativePurchase.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white shadow-sm py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Best Wishes Logo" className="h-8 w-auto rounded-full" />
        </div>
        <span className="text-gray-500 text-sm">Collaborative Purchase</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h1 className="text-2xl font-bold text-purple-700 mb-2 text-center">🛒 Collaborative Purchase</h1>
          <hr className="mb-6" />
          
          <p className="text-center text-gray-600 mb-6">
            You've been invited by <span className="font-semibold text-purple-700">
              {collaborativePurchase.createdBy?.firstName || collaborativePurchase.createdBy?.email}
            </span> to participate in a collaborative purchase!
          </p>

          {/* Time Remaining */}
          {!isExpired && !isCompleted && !isCancelled && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-blue-600 mb-1">Time Remaining</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isExpired && !isPaid && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-center text-red-600 font-semibold">
                ⏰ Payment deadline has passed. This collaborative purchase is no longer active.
              </p>
            </div>
          )}

          {isCancelled && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-center text-gray-600 font-semibold">
                ❌ This collaborative purchase has been cancelled.
              </p>
            </div>
          )}

          {isCompleted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-center text-green-600 font-semibold">
                ✅ All payments completed! The order has been placed successfully.
              </p>
            </div>
          )}

          {/* Product Details */}
          <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
            {collaborativePurchase.product?.images && collaborativePurchase.product.images.length > 0 ? (
              <Image
                src={collaborativePurchase.product.images[0].url || collaborativePurchase.product.images[0]}
                alt={collaborativePurchase.productName}
                width={120}
                height={120}
                className="w-32 h-32 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded-lg border text-gray-400">
                No Image
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">{collaborativePurchase.productName}</h2>
              <p className="mb-1 text-gray-700">Quantity: {collaborativePurchase.quantity}</p>
              <p className="mb-1">Total Price: <span className="font-medium">£{collaborativePurchase.totalAmount.toFixed(2)}</span></p>
              <p className="mb-1">Your Share: <span className="font-medium">${collaborativePurchase.shareAmount.toFixed(2)}</span></p>
              <p className="mb-1">Deadline: <span className="font-medium">{new Date(collaborativePurchase.deadline).toLocaleDateString()}</span></p>
            </div>
          </div>

          {/* Participants Status */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Participants Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{collaborativePurchase.createdBy?.firstName || collaborativePurchase.createdBy?.email}</span>
                <span className="text-green-600 font-semibold">Creator</span>
              </div>
              {collaborativePurchase.participants.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{p.email}</span>
                  <span className={`font-semibold ${
                    p.paymentStatus === 'paid' ? 'text-green-600' :
                    p.paymentStatus === 'declined' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {p.paymentStatus === 'paid' ? 'Paid' :
                     p.paymentStatus === 'declined' ? 'Declined' :
                     'Processing'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          {!isPaid && !isDeclined && !isExpired && !isCancelled && !isCompleted && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Payment Details</h3>
              {clientSecret && (
                <Elements key={clientSecret} options={{ clientSecret }} stripe={stripePromise}>
                  <PaymentForm 
                    clientSecret={clientSecret} 
                    amount={collaborativePurchase.shareAmount} 
                    currency="usd" 
                    collaborativePurchase={collaborativePurchase}
                    participant={participant}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                </Elements>
              )}
              {!clientSecret && (
                <p className="text-sm text-red-500">Initializing payment...</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isPaid && !isDeclined && !isExpired && !isCancelled && !isCompleted && (
              <button
                onClick={handleDecline}
                disabled={declineLoading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {declineLoading ? 'Declining...' : 'Decline Participation'}
              </button>
            )}
            
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go Home
            </button>
          </div>

          {isPaid && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-center text-green-600 font-semibold">
                ✅ Thank you for your payment! You will be notified when the order is completed.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-gray-400 text-sm py-6 mt-8">
        &copy; {new Date().getFullYear()} Best Wishes. All rights reserved.
      </footer>
    </div>
  );
}
