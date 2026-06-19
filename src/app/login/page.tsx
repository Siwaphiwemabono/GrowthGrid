// src/app/login/page.tsx
"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/db/db";
import { type Profile } from "@/db/schema";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First, check if user exists and get their role
      const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("id, email, password, role, password_changed, business_id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Check password (in production, use bcrypt to compare hashed passwords)
      if (profile.password !== password) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Attempt sign in with NextAuth
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Get session to check role
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        
        if (!session?.user) {
          setError("Session not found");
          setLoading(false);
          return;
        }

        // Check if user needs to change password
        const needsPasswordChange = (profile.password_changed === false || profile.password_changed === null);
        const isEmployee = profile.role === "employee";

        if (needsPasswordChange && isEmployee) {
          // First login with temporary password - show change password
          router.push("/change-password");
        } else if (profile.role === "owner") {
          // Owner goes to owner dashboard
          router.push("/owner-dashboard");
        } else {
          // Employee with password already changed - goes directly to dashboard
          router.push("/employee-dashboard");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-30"></div>
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl"></div>
      
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <Link 
            href="/" 
            className="group mb-6 inline-flex items-center gap-2 text-sm text-emerald-600 transition hover:text-emerald-700"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="relative overflow-hidden rounded-3xl bg-white/90 shadow-2xl backdrop-blur-sm">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="p-8 sm:p-10">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                <p className="mt-2 text-sm text-gray-600">Sign in to continue your growth journey</p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 pr-12 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "👁️" : "🔒"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Signing In...
                    </div>
                  ) : (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Sign In
                      <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="font-semibold text-emerald-600 hover:underline">
                  Create free account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}