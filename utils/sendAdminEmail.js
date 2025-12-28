const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

transporter.sendMail({
  from: `"LOCAL INVEST NG" <${process.env.EMAIL_USER}>`,
  to: "samuel.akinola@rocketmail.com",
  subject: "Test Email",
  html: "<p>This is a test</p>",
}, (err, info) => {
  if (err) console.error("Error sending test email:", err);
  else console.log("Test email sent:", info.response);
});
