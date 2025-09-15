// backend/controllers/giftContributionController.js

const GiftContribution = require('../models/GiftContribution');
const mongoose = require('mongoose');
const { sendEmail } = require('../config/emailConfig');
require('dotenv').config();



const createContribution = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: User not found in request' });
    }

    const { productId, productName, productPrice, participants, share } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }

    if (!participants || !Array.isArray(participants) || participants.length === 0 || participants.length > 3) {
      return res.status(400).json({ message: 'Participants must be an array with 1-3 emails.' });
    }

    for (const email of participants) {
      if (typeof email !== 'string' || !email.includes('@') || email.trim() === '') {
        return res.status(400).json({ message: `Invalid participant email: ${email}` });
      }
    }

    const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const contribution = await GiftContribution.create({
      product: productId,
      productName,
      productPrice,
      share,
      createdBy: req.user._id,
      participants: participants.map(email => ({ email: email.trim().toLowerCase() })),
      deadline,
    });

    // Send Email Invitations
    for (const email of participants) {
      await sendEmail({
        to: email,
        subject: `🎁 You're Invited to Contribute a Gift!`,
        html: `
   <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Gift Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f9f9f9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 30px;">
              <tr>
                <td align="center">
                  <h2 style="color: #6B46C1; margin: 0 0 20px;">🎁 Collaborative Gift Invitation</h2>
                </td>
              </tr>
              <tr>
                <td style="font-size: 16px; color: #333;">
                  <p style="margin: 0 0 10px;">Hi there 👋,</p>
                  <p style="margin: 0 0 10px;">You’ve been invited to contribute towards a special gift:</p>
                  <p style="margin: 0 0 10px;"><strong>${productName}</strong></p>
                  <p style="margin: 0 0 10px;">Amount: <strong>Rs. ${share}</strong></p>
                  <p style="margin: 0 0 20px;">Deadline: <strong>${deadline.toDateString()}</strong></p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <a href="http://localhost:3000/contribution/${contribution._id}"
                     style="background-color: #6B46C1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; display: inline-block;">
                    🎁 Contribute Now
                  </a>
                </td>
              </tr>
              <tr>
                <td style="font-size: 14px; color: #555; padding-top: 10px;">
                  <p style="margin: 0;">If you're unable to contribute at this time, you can still view the invitation and decline gracefully. We appreciate your time!</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 30px 0 0;">
                  <hr style="border: none; border-top: 1px solid #eee; width: 100%;" />
                  <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    💜 Best Wishes Team<br/>
                    <a href="http://localhost:3000" style="color: #6B46C1; text-decoration: none;">Visit Our Platform</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `,
      });

    }

    res.status(201).json({ success: true, contribution });

  } catch (err) {
    console.error('Error in createContribution:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};


const getContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const contribution = await GiftContribution.findById(id)
      .populate('product')
      .populate('createdBy', 'name email');

    if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

    res.json(contribution);
  } catch (err) {
    console.error('Error in getContribution:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const contribution = await GiftContribution.findById(id);
    if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

    const participant = contribution.participants.find(p => p.email === email);
    if (!participant) return res.status(404).json({ message: 'Participant not found' });

    participant.hasPaid = true;
    participant.paidAt = new Date();

    if (contribution.participants.every(p => p.hasPaid)) {
      contribution.status = 'completed';
    }

    await contribution.save();
    res.json(contribution);
  } catch (err) {
    console.error('Error in markPaid:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const declineContribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const contribution = await GiftContribution.findById(id);
    if (!contribution) return res.status(404).json({ message: 'Contribution not found' });

    const participant = contribution.participants.find(p => p.email === email);
    if (!participant) return res.status(404).json({ message: 'Participant not found' });

    participant.declined = true;
    contribution.status = 'cancelled';

    await contribution.save();
    res.json(contribution);
  } catch (err) {
    console.error('Error in declineContribution:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const listUserContributions = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = req.user._id;

    const contributions = await GiftContribution.find({
      $or: [
        { createdBy: userId },
        { 'participants.email': userEmail }
      ]
    }).populate('product');

    res.json(contributions);
  } catch (err) {
    console.error('Error in listUserContributions:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = {
  createContribution,
  getContribution,
  markPaid,
  declineContribution,
  listUserContributions,
};
