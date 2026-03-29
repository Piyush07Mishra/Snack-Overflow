import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || "").replace(/\s/g, ""), // strip spaces from app password
  },
});

export const sendPasswordEmail = async ({
  toEmail,
  toName,
  password,
  isReset = false,
}) => {
  const subject = isReset
    ? "ReimburX — Your Password Has Been Reset"
    : "ReimburX — Your Account Password";

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">ReimburX</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
        ${isReset ? "Your password reset request was received." : "Your account has been created."}
      </p>
      <p style="color:#374151;font-size:14px;">Hi <strong>${toName}</strong>,</p>
      <p style="color:#374151;font-size:14px;">
        ${isReset ? "Here is your new temporary password:" : "Here is your temporary password to log in:"}
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
        <span style="font-size:22px;font-weight:700;letter-spacing:4px;color:#111827;">${password}</span>
      </div>
      <p style="color:#6b7280;font-size:13px;">
        Please log in and change your password immediately. This password was auto-generated.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;margin:0;">ReimburX — Reimbursement Management</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"ReimburX" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
  });
};
