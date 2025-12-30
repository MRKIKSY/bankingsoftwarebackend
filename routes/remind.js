const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { adminOnly } = require("../middleware/auth");

router.post("/", adminOnly, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.email) {
      return res.status(400).json({ message: "User email missing" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("EMAIL ENV VARIABLES MISSING");
      return res.status(500).json({ message: "Email configuration missing" });
    }

    // ================= MAIL TRANSPORT =================
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // ================= EMAIL TEMPLATE =================
    const htmlContent = `
      <div style="max-width:600px;margin:0 auto;
                  font-family:Arial,Helvetica,sans-serif;
                  color:#333;line-height:1.7;">

        <!-- HEADER -->
        <div style="background:#0f172a;padding:20px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:22px;">Local Naira Invest</h1>
          <p style="margin-top:6px;font-size:14px;">
            Smart Investments • Trusted Returns
          </p>
        </div>

        <!-- BODY -->
        <div style="padding:25px;">
          <p style="font-size:16px;">
            Dear <strong>${user.username}</strong>,
          </p>

          <p>
            We hope this message finds you well.
            This is a gentle reminder that you currently have
            <strong>pending investment(s)</strong> on your
            <strong>Local Naira Invest</strong> account.
          </p>

          <p>
            To proceed, simply log in to your account and click the
            <strong>“Invest”</strong> button to activate your investment
            and begin earning returns.
          </p>

          <!-- CTA BUTTON -->
          <div style="text-align:center;margin:25px 0;">
            <a href="https://www.localnairainvest.com/"
               style="background:#1a73e8;color:#ffffff;
                      padding:12px 24px;text-decoration:none;
                      border-radius:6px;font-weight:bold;">
              Login & Invest Now
            </a>
          </div>

          <p>
            Our investment plans offer attractive returns of up to:
          </p>

          <ul style="margin-left:20px;">
            <li><strong>7%</strong> after 7 days</li>
            <li><strong>14%</strong> after 14 days</li>
            <li><strong>21%</strong> after 21 days</li>
          </ul>

          <p>
            If you have already completed your payment,
            please feel free to disregard this message.
          </p>

          <!-- WHATSAPP SUPPORT -->
          <p>
            Should you have any questions or require assistance,
            our support team is readily available on WhatsApp:
          </p>

          <div style="margin:15px 0;text-align:center;">
            <a href="https://wa.me/447591683924?text=Hello%20Local%20Naira%20Invest%20Support,%20this%20is%20${encodeURIComponent(
              user.username
            )}.%20I%20need%20assistance%20with%20my%20investment."
               style="display:inline-block;
                      background:#25D366;color:#ffffff;
                      padding:10px 20px;
                      text-decoration:none;
                      border-radius:6px;
                      font-weight:bold;">
              💬 Chat with Support on WhatsApp
            </a>
          </div>

          <p style="margin-top:30px;">
            Kind regards,<br>
            <strong>Local Naira Invest Support Team</strong>
          </p>
        </div>

        <!-- FOOTER -->
        <div style="background:#f1f5f9;padding:15px;
                    text-align:center;font-size:12px;color:#555;">
          © ${new Date().getFullYear()} Local Naira Invest.
          All rights reserved.
        </div>

      </div>
    `;

    // ================= SEND MAIL =================
    await transporter.sendMail({
      from: `"Local Naira Invest NG" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reminder: Pending Investment on Your Account",
      html: htmlContent
    });

    res.json({ message: `Reminder sent to ${user.email}` });

  } catch (err) {
    console.error("REMINDER ERROR:", err);
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

module.exports = router;
