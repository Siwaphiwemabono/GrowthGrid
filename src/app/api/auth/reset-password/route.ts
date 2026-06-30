import { NextResponse } from "next/server";
import { db } from "@/db/db";

export async function POST(req: Request) {
  try {
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // 1. Find user with valid token
    const { data: user, error } = await db
      .from("profiles")
      .select("id, reset_token, reset_token_expiry")
      .eq("email", email)
      .eq("reset_token", token)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // 2. Check token expiry
    const expiry = new Date(user.reset_token_expiry);
    if (expiry < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 3. Update password
    const { error: updateError } = await db
      .from("profiles")
      .update({
        password: newPassword,
        password_changed: true,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully!",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}