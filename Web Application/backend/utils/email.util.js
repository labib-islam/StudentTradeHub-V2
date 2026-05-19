import nodemailer from "nodemailer";

// Create a transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    // service: "gmail", // You can change this to your email service
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request - StudentTradeHub",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) has requested to reset the password for your StudentTradeHub account.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">StudentTradeHub - Student Peer-to-Peer Marketplace</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Send email verification email
export const sendVerificationEmail = async (email, verificationToken) => {
  const transporter = createTransporter();

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email - StudentTradeHub",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">Welcome to StudentTradeHub!</h2>
        <p>Thank you for signing up. Please verify your email address to complete your registration and start trading.</p>
        <p>Click the button below to verify your email:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you did not create an account on StudentTradeHub, please ignore this email.</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">StudentTradeHub - Student Peer-to-Peer Marketplace</p>
      </div>
    `,
  };

  try {
    console.log("Sending verification email to:", email);
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: error.message };
  }
};
