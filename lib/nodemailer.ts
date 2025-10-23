import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_EMAIL, // Must match FROM
    pass: process.env.NODEMAILER_PASS,  // App Password (not your Gmail password)
  },
});

export async function sendEmailOTP(email: string, otp: string, attempt = 1) {
  const mailOptions = {
    from: `"360 Electronics" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: "Verify your email - 360 Electronics",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Use the following OTP to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn’t request this, please ignore it.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    console.error("Error sending email:", error);

    // Retry once if Gmail temporarily rejects (450 error)
    if (error.responseCode === 450 && attempt < 3) {
      console.warn(`Retrying email send (attempt ${attempt + 1})...`);
      await new Promise((r) => setTimeout(r, 3000 * attempt)); // 3s → 6s → 9s
      return sendEmailOTP(email, otp, attempt + 1);
    }

    return false;
  }
}
