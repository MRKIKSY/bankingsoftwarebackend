const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendReminder(user) {
  if (!user.email) {
    throw new Error("User has no email address");
  }

  const mailOptions = {
    from: `"LOCAL INVEST NG" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Investment Reminder",
    html: `
      <h3>Hello ${user.username},</h3>
      <p>This is a reminder from <b>Local Invest NG</b>.</p>
      <p>Please login to your dashboard to review your account.</p>
      <br/>
      <p>Regards,<br/>Local Invest NG Team</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Reminder sent:", info.response);

  return info;
}

module.exports = sendReminder;
