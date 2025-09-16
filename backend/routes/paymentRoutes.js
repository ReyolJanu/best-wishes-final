const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });

// Create payment intent for collaborative purchases (public access) or authenticated users
router.post('/create-intent', async (req, res) => {
	try {
		const { amount, currency, metadata } = req.body;
		if (!amount || !currency) {
			return res.status(400).json({ message: 'amount and currency are required' });
		}

		const paymentIntent = await stripe.paymentIntents.create({
			amount,
			currency,
			metadata: metadata || {},
			automatic_payment_methods: { enabled: true },
		});

		return res.json({ clientSecret: paymentIntent.client_secret });
	} catch (err) {
		console.error('Stripe error:', err);
		return res.status(500).json({ message: 'Failed to create payment intent' });
	}
});

module.exports = router; 