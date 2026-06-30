"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/db/db";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    ownerSurname: "",
    email: "",
    industry: "other",
  });

  const industries = [
    { value: "retail", label: "🛍️ Retail", icon: "🏪" },
    { value: "restaurant", label: "🍽️ Restaurant", icon: "🍽️" },
    { value: "salon", label: "💇 Salon & Beauty", icon: "💇" },
    { value: "consulting", label: "💼 Consulting", icon: "💼" },
    { value: "construction", label: "🏗️ Construction", icon: "🏗️" },
    { value: "other", label: "📌 Other", icon: "📌" },
  ];

  useEffect(() => {
    const password = generatePassword();
    setGeneratedPassword(password);
    console.log("🔑 Generated password:", password);
  }, []);

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const password = generatedPassword || generatePassword();
    console.log("📝 Submitting signup with password:", password);

    try {
      console.log("📝 Starting signup process...");
      console.log("Email:", formData.email);

      // Generate a UUID for the user
      const userId = crypto.randomUUID();

      // Check if user already exists
      const { data: existingUser, error: checkError } = await db
        .from("profiles")
        .select("email")
        .eq("email", formData.email)
        .maybeSingle();

      if (checkError) {
        console.error("❌ Check error:", checkError);
      }

      if (existingUser) {
        setError(`User with email "${formData.email}" already exists. Please sign in.`);
        setLoading(false);
        return;
      }

      // Calculate password expiry date (14 days from now)
      const passwordExpiry = new Date();
      passwordExpiry.setDate(passwordExpiry.getDate() + 14);

      console.log("🔑 Storing password:", password);
      console.log("📅 Password expiry:", passwordExpiry.toISOString());

      // 1. Create Profile with password
      const { data: newProfile, error: profileError } = await db
        .from("profiles")
        .insert({
          id: userId,
          name: formData.ownerName,
          surname: formData.ownerSurname,
          email: formData.email,
          password: password,
          role: "owner",
          password_changed: false,
          password_expiry: passwordExpiry.toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        console.error("❌ Profile error:", profileError);
        if (profileError.code === "23505") {
          setError(`User with email "${formData.email}" already exists. Please sign in.`);
          setLoading(false);
          return;
        }
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log("✅ Profile created successfully:", newProfile);
      console.log("✅ Password stored:", newProfile.password);

      // 2. Create Business
      const { data: businessData, error: businessError } = await db
        .from("businesses")
        .insert({
          user_id: userId,
          business_name: formData.businessName,
          industry: formData.industry,
        })
        .select()
        .single();

      if (businessError) {
        console.error("❌ Business error:", businessError);
        throw new Error(`Business creation failed: ${businessError.message}`);
      }

      console.log("✅ Business created:", businessData.id);

      // 3. Update Profile with Business ID
      const { error: updateError } = await db
        .from("profiles")
        .update({ business_id: businessData.id })
        .eq("id", userId);

      if (updateError) {
        console.error("❌ Profile update error:", updateError);
      }

      // 4. Generate industry tasks
      const industryTasks = getIndustryTasks(formData.industry);
      const taskPool = industryTasks.map((title: string, index: number) => ({
        title: title,
        business_id: businessData.id,
        assigned_by: userId,
        status: "Available",
        priority: ["High", "Medium", "Low"][index % 3],
        created_at: new Date().toISOString(),
      }));

      const { error: taskError } = await db
        .from("tasks")
        .insert(taskPool);

      if (taskError) {
        console.error("❌ Task generation error:", taskError);
      } else {
        console.log(`✅ ${taskPool.length} tasks generated`);
      }

      // 5. Auto-login using NextAuth
      console.log("🔐 Attempting auto-login with email:", formData.email, "password:", password);
      const result = await signIn("credentials", {
        email: formData.email,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        console.error("❌ Auto-login error:", result.error);
        setError("Account created but auto-login failed. Please log in manually.");
        setLoading(false);
        return;
      }

      console.log("✅ Auto-login successful");

      // Store credentials in session storage
      sessionStorage.setItem('tempPassword', password);
      sessionStorage.setItem('tempEmail', formData.email);
      sessionStorage.setItem('tempPasswordExpiry', passwordExpiry.toISOString());

      setSuccess(true);
      setLoading(false);

    } catch (err: any) {
      console.error("❌ Sign up error:", err);
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  const getIndustryTasks = (industry: string): string[] => {
    const taskMap: Record<string, string[]> = {
      retail: [
        "Check stock levels for top selling items",
        "Clean and organize store displays",
        "Update product prices",
        "Restock shelves",
        "Process returns and exchanges",
        "Count cash register",
        "Review daily sales report",
        "Order new inventory",
        "Check for expired products",
        "Arrange window display",
      ],
      restaurant: [
        "Check food inventory levels",
        "Clean kitchen equipment",
        "Update menu prices",
        "Prepare daily specials",
        "Check supplier deliveries",
        "Review customer reviews",
        "Clean dining area",
        "Check health and safety compliance",
        "Order fresh ingredients",
        "Review staff schedule",
      ],
      salon: [
        "Check appointment schedule",
        "Clean and sanitize stations",
        "Check product inventory",
        "Update service menu",
        "Review client feedback",
        "Call pending clients",
        "Order new products",
        "Clean equipment",
        "Check social media bookings",
        "Review daily revenue",
      ],
      consulting: [
        "Review client proposals",
        "Check project deadlines",
        "Follow up with leads",
        "Send client invoices",
        "Review contract agreements",
        "Prepare presentation materials",
        "Update project timelines",
        "Check billable hours",
        "Send meeting reminders",
        "Review client satisfaction",
      ],
      construction: [
        "Check project timelines",
        "Review material orders",
        "Inspect safety equipment",
        "Check site progress",
        "Review worker schedules",
        "Order building materials",
        "Check permits and compliance",
        "Inspect completed work",
        "Review project budget",
        "Check equipment maintenance",
      ],
      other: [
        "Review daily business metrics",
        "Check pending tasks",
        "Review customer feedback",
        "Plan weekly priorities",
        "Update business goals",
        "Check financial reports",
        "Review team performance",
        "Plan improvement initiatives",
        "Check business compliance",
        "Update business strategy",
      ],
    };
    return taskMap[industry] || taskMap.other;
  };

  const handleGoToDashboard = () => {
    router.push("/owner-dashboard");
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/owner-dashboard");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (success) {
    const tempPassword = sessionStorage.getItem('tempPassword') || generatedPassword;
    const tempEmail = sessionStorage.getItem('tempEmail') || formData.email;
    const passwordExpiry = sessionStorage.getItem('tempPasswordExpiry') || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const expiryDate = new Date(passwordExpiry);

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">🎉 Welcome to GrowthGrid!</h2>
            <p className="text-gray-600 mt-2">Your free trial has started successfully.</p>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-800">
                <span className="font-semibold">📧 Email:</span> {formData.email}
              </p>
              <p className="text-sm text-emerald-800 mt-1">
                <span className="font-semibold">🏢 Business:</span> {formData.businessName}
              </p>
              <p className="text-sm text-emerald-800 mt-1">
                <span className="font-semibold">👤 Owner:</span> {formData.ownerName} {formData.ownerSurname}
              </p>
              <p className="text-sm text-emerald-800 mt-1">
                <span className="font-semibold">📅 Password Expires:</span> {expiryDate.toLocaleDateString()}
              </p>
            </div>

            {/* Password Display */}
            <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
              <p className="text-sm font-semibold text-yellow-800 text-center">🔑 Your Temporary Password</p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <div className="relative flex-1">
                  <input
                    id="tempPassword"
                    type={showPassword ? "text" : "password"}
                    value={tempPassword}
                    readOnly
                    className="w-full px-4 py-3 bg-white border border-yellow-300 rounded-lg text-center font-mono text-lg font-bold text-yellow-900"
                    aria-label="Temporary password"
                    placeholder="Your temporary password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "👁️" : "🔒"}
                  </button>
                </div>
              </div>
              
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    setPasswordCopied(true);
                    setTimeout(() => setPasswordCopied(false), 3000);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-lg transition font-medium"
                  aria-label="Copy password to clipboard"
                >
                  {passwordCopied ? "✅ Copied!" : "📋 Copy Password"}
                </button>
                
                <div className="text-xs text-yellow-700 text-center">
                  ⚠️ Please copy this password now. You won't be able to see it again!
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 text-lg">ℹ️</span>
                <div className="text-xs text-blue-700">
                  <p className="font-semibold">Important:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>This password will expire in <strong>14 days</strong></li>
                    <li>You are now signed in automatically</li>
                    <li>You can use this password to log in later</li>
                    <li>We recommend saving this password securely</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Manual Redirect Button */}
            <button
              type="button"
              onClick={handleGoToDashboard}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
            >
              Go to Dashboard →
            </button>
            
            <p className="text-xs text-gray-400 text-center">
              You will be redirected automatically in 10 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Start Your Free Trial</h1>
          <p className="text-gray-500 text-sm mt-1">Set up your business in minutes</p>
          <p className="text-xs text-gray-400 mt-1">A secure temporary password will be generated for you</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign up form">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              required
              placeholder="e.g., My Business"
              aria-label="Business name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                id="ownerName"
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                required
                placeholder="John"
                aria-label="First name"
              />
            </div>
            <div>
              <label htmlFor="ownerSurname" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                id="ownerSurname"
                type="text"
                value={formData.ownerSurname}
                onChange={(e) => setFormData({ ...formData, ownerSurname: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                required
                placeholder="Doe"
                aria-label="Last name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              required
              placeholder="you@example.com"
              aria-label="Email address"
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Industry *
            </label>
            <select
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              required
              aria-label="Select your industry"
            >
              <option value="">Select an industry...</option>
              {industries.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.icon} {ind.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creating Account...
              </>
            ) : (
              "Start Free Trial →"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Sign In
          </Link>
        </p>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ✅ No credit card required
            <br />
            ✅ 14-day free trial
            <br />
            ✅ Temporary password with 14-day expiry
          </p>
        </div>
      </div>
    </div>
  );
}