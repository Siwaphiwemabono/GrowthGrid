import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Find user in profiles
    const { data: user, error } = await db
      .from("profiles")
      .select("id, email, name")
      .eq("email", email)
      .maybeSingle();

    if (error || !user) {
      // Don't reveal if user exists or not (security)
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent.",
      });
    }

    // 2. Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1 hour expiry

    // 3. Store token in profiles
    const { error: updateError } = await db
      .from("profiles")
      .update({
        reset_token: resetToken,
        reset_token_expiry: tokenExpiry.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Token update error:", updateError);
      return NextResponse.json(
        { error: "Failed to process request" },
        { status: 500 }
      );
    }

    // 4. Build reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${email}`;

    // 5. Send email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #059669, #0D9488); border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px; color: white; font-weight: bold;">📈</span>
          </div>
          <h1 style="color: #1F2937; font-size: 24px; margin: 0;">GrowthGrid</h1>
        </div>
        
        <h2 style="color: #10b981; font-size: 20px; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">Hi ${user.name || "there"},</p>
        <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #F3F4F6; padding: 12px; border-radius: 6px; font-size: 12px; color: #4B5563; font-family: monospace;">${resetUrl}</p>
        
        <p style="color: #6B7280; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
        <p style="color: #9CA3AF; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        
        <hr style="border: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} GrowthGrid. All rights reserved.</p>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: "Reset Your Password - GrowthGrid",
      html,
    });

    if (!result.success) {
      console.error("Email send failed:", result.error);
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}