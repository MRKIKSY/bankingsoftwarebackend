require("dotenv").config(); // Make sure you have a .env file with EMAIL_USER and EMAIL_PASS
const nodemailer = require("nodemailer");

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send test email to yourself
      subject: "Test Email",
      text: "Testing email setup"
    });
    console.log("Email sent:", info.response);
  } catch (err) {
    console.error("Email error:", err);
  }
}

testEmail();