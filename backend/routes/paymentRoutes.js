const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

// Create payment intent for collaborative purchases (public access) or authenticated users
router.post('/create-intent', async (req, res) => {
	try {
		console.log('💳 Creating payment intent with request:', req.body);
		
		const { amount, currency, metadata } = req.body;
		if (!amount || !currency) {
			console.log('❌ Missing required fields:', { amount, currency });
			return res.status(400).json({ message: 'amount and currency are required' });
		}

		// Validate amount is a positive number
		if (amount <= 0 || isNaN(amount)) {
			console.log('❌ Invalid amount:', amount);
			return res.status(400).json({ message: 'amount must be a positive number' });
		}

		console.log('🔑 Using Stripe secret key:', process.env.STRIPE_SECRET_KEY ? '✅ Present' : '❌ Missing');

		const paymentIntent = await stripe.paymentIntents.create({
			amount,
			currency,
			metadata: metadata || {},
			automatic_payment_methods: { enabled: true },
		});

		console.log('✅ Payment intent created successfully:', paymentIntent.id);
		return res.json({ clientSecret: paymentIntent.client_secret });
	} catch (err) {
		console.error('❌ Stripe error:', err);
		return res.status(500).json({ 
			message: 'Failed to create payment intent',
			error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
		});
	}
});

module.exports = router; 