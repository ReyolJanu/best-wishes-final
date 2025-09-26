const { sendEmail } = require('../config/emailConfig');
const User = require('../models/User');
const { getProductRecommendations } = require('./productRecommendation');

async function sendReminderEmail(user, reminder) {
  if (!user || !user.email) return;
  
  let productRecommendations = [];
  let productRecommendationsHtml = '';
  
  try {
    // Get product recommendations based on occasion
    if (reminder.occasion) {
      productRecommendations = await getProductRecommendations(reminder.occasion, 5);
      
      if (productRecommendations && productRecommendations.length > 0) {
        productRecommendationsHtml = `
          <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #6a1b9a;">
            <h3 style="color: #6a1b9a; margin: 0 0 15px 0; font-size: 18px;">🎁 Recommended Gifts for Your ${reminder.occasion.replace('_', ' ').toUpperCase()}</h3>
            <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">We've selected these perfect gifts just for your special occasion:</p>
            <div style="display: grid; gap: 15px;">
        `;
        
        productRecommendations.forEach(product => {
          productRecommendationsHtml += `
            <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 15px;">
              ${product.image ? `<img src="${product.image}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">` : ''}
              <div style="flex: 1;">
                <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">${product.name}</h4>
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #666; line-height: 1.4;">${product.shortDescription.substring(0, 80)}${product.shortDescription.length > 80 ? '...' : ''}</p>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 16px; font-weight: bold; color: #6a1b9a;">$${product.price}</span>
                  ${product.onSale ? `<span style="font-size: 14px; text-decoration: line-through; color: #999;">$${product.originalPrice}</span>` : ''}
                  <span style="color: #ffa500; font-size: 12px;">${'★'.repeat(Math.floor(product.rating))}${product.rating % 1 !== 0 ? '☆' : ''}</span>
                </div>
                <a href="${product.link}" style="display: inline-block; margin-top: 8px; padding: 8px 16px; background-color: #6a1b9a; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: bold;">View Product</a>
              </div>
            </div>
          `;
        });
        
        productRecommendationsHtml += `
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/allProducts" style="display: inline-block; padding: 12px 24px; background-color: #6a1b9a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Explore More Gifts</a>
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Error getting product recommendations for email:', error);
  }
  
  await sendEmail({
    to: user.email,
    subject: `⏰ Reminder for: ${reminder.event}`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #6a1b9a; padding: 20px; color: white; text-align: center;">
            <h2 style="margin: 0;">Best Wishes - Event Reminder</h2>
          </div>
          <div style="padding: 30px; color: #333;">
            <p style="font-size: 16px;">Hi <strong>${user.firstName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">This is a reminder for your scheduled event:</p>
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 12px; font-weight: bold; background-color: #e9ecef;">📌 Event</td>
                <td style="padding: 12px; background-color: #e9ecef;">${reminder.event}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold;">🎉 Occasion</td>
                <td style="padding: 12px;">${reminder.occasion ? reminder.occasion.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'General'}</td>
              </tr>
              <tr style="background-color: #f3e5f5;">
                <td style="padding: 12px; font-weight: bold;">📅 Date</td>
                <td style="padding: 12px;">${new Date(reminder.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold;">⏰ Time</td>
                <td style="padding: 12px;">${reminder.time}</td>
              </tr>
            </table>
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 15px; color: #856404;">💬 <em>"${reminder.remindermsg}"</em></p>
            </div>
            ${productRecommendationsHtml}
            <p style="margin-top: 30px; font-size: 14px;">Thank you for using <strong>Best Wishes</strong>! We hope these recommendations help make your event even more special.</p>
          </div>
          <div style="background-color: #f3e5f5; text-align: center; padding: 15px; font-size: 13px; color: #666;">
            © ${new Date().getFullYear()} Best Wishes. All rights reserved.
            <br>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #6a1b9a; text-decoration: none;">Visit our website</a>
          </div>
        </div>
      </div>
    `,
  });
}

module.exports = sendReminderEmail;
