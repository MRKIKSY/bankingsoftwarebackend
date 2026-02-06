const nodemailer = require("nodemailer");

// ======================
// Create transporter
// ======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================
// Send reminder function
// ======================
async function sendReminder(user) {
  if (!user.email) throw new Error("User has no email");

  const username = user.username.trim();

  const mailOptions = {
    from: `"Local Naira Invest" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Pending Investment Reminder • Local Naira Invest",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #1a1a1a;">Local Naira Invest</h2>
        <p><em>Smart Investments • Trusted Returns</em></p>

        <p>Dear <strong>${username}</strong>,</p>

        <p>We hope this message finds you well. This is a gentle reminder that you currently have pending investment(s) on your Local Naira Invest account.</p>

        <p style="text-align: center; margin: 20px 0;">
          <a href="https://www.localnairainvest.com" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
             Login & Invest Now
          </a>
        </p>

        <p>Our investment plans offer attractive returns of up to:</p>
        <ul>
          <li>7% after 7 days</li>
          <li>14% after 14 days</li>
          <li>21% after 21 days</li>
        </ul>

        <p>If you have already completed your payment, please feel free to disregard this message.</p>

        <p>Should you have any questions or require assistance, our support team is readily available on WhatsApp:</p>
        <p>💬 <a href="https://wa.me/447591683924" style="color: #25D366;">Chat with Support on WhatsApp</a></p>

        <p>Kind regards,<br/>
        Local Naira Invest Support Team</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999;">© 2026 Local Naira Invest. All rights reserved.</p>
      </div>
    `,
  };

  // Send the email
  return transporter.sendMail(mailOptions);
}

module.exports = sendReminder;
