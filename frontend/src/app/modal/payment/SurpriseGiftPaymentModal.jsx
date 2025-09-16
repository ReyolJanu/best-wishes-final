"use client";
import React, { useState } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaCreditCard, FaPaypal } from "react-icons/fa";
import { SiStripe } from "react-icons/si";

const SurpriseGiftPaymentModal = ({ 
  isOpen, 
  onClose, 
  surpriseGift, 
  onPaymentSuccess,
  isProcessing = false 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('stripe');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [processing, setProcessing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails(prev => ({
      ...prev,
      cardNumber: formatted
    }));
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setCardDetails(prev => ({
      ...prev,
      expiryDate: formatted
    }));
  };

  const validateForm = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 13) {
      return 'Please enter a valid card number';
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
      return 'Please enter a valid expiry date';
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      return 'Please enter a valid CVV';
    }
    if (!cardDetails.cardholderName.trim()) {
      return 'Please enter the cardholder name';
    }
    return null;
  };

  const handlePayment = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock payment ID
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await onPaymentSuccess(paymentId, selectedMethod);
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={processing || isProcessing}
          className="absolute top-3 right-3 text-gray-400 hover:text-black disabled:opacity-50"
          aria-label="Close"
        >
          <IoIosCloseCircleOutline size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Payment</h2>
          <p className="text-gray-600 text-sm">
            Pay for surprise gift delivery to {surpriseGift?.recipientName}
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Recipient:</span>
              <span className="font-medium">{surpriseGift?.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span>Items:</span>
              <span>{surpriseGift?.items?.length || 0} item(s)</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>${surpriseGift?.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                checked={selectedMethod === 'stripe'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="text-purple-600"
              />
              <SiStripe className="text-blue-600 text-xl" />
              <span>Credit/Debit Card (Stripe)</span>
            </label>
            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={selectedMethod === 'paypal'}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="text-purple-600"
              />
              <FaPaypal className="text-blue-500 text-xl" />
              <span>PayPal</span>
            </label>
          </div>
        </div>

        {/* Card Details Form */}
        {selectedMethod === 'stripe' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={cardDetails.cardholderName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={processing || isProcessing}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={cardDetails.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={processing || isProcessing}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiryDate"
                  value={cardDetails.expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={processing || isProcessing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  name="cvv"
                  value={cardDetails.cvv}
                  onChange={handleInputChange}
                  placeholder="123"
                  maxLength="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={processing || isProcessing}
                />
              </div>
            </div>
          </div>
        )}

        {/* PayPal Notice */}
        {selectedMethod === 'paypal' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              You will be redirected to PayPal to complete your payment securely.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing || isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={processing || isProcessing}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {processing || isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              `Pay $${surpriseGift?.total?.toFixed(2) || '0.00'}`
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔒 Your payment information is secure and encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default SurpriseGiftPaymentModal;