"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
// Import types from your schema
import { type RegisterRequest } from "@/db/schema";

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    // Step 1: Account
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Step 2: Business Setup
    businessName: "",
    industry: "",
    businessSize: "",
  });

  const industries = [
    { value: "retail", label: "Retail Store", description: "Inventory and sales monitoring" },
    { value: "restaurant", label: "Restaurant", description: "Orders, suppliers and customer activity" },
    { value: "salon", label: "Salon", description: "Bookings and customer retention" },
    { value: "consulting", label: "Consulting", description: "Client follow-ups and proposals" },
    { value: "construction", label: "Construction", description: "Project deadlines and materials" },
    { value: "other", label: "Other", description: "General business actions" },
  ];

  const businessSizes = [
    "Just me (Solo)",
    "2-5 employees",
    "6-20 employees",
    "21-50 employees",
    "50+ employees",
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-emerald-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name || !formData.surname || !formData.email || !formData.password) {
      setError("Please fill in all account fields");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // Prepare the request data with proper types
      const requestData: RegisterRequest = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        industry: formData.industry,
        businessSize: formData.businessSize || "Just me (Solo)",
        // These are optional fields that can be added later
        // hasEmployees: "no",
        // employeeEmails: "",
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create account. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess("Account created successfully! Redirecting to login...");
      setLoading(false);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError("");
    
    if (step === 1) {
      if (!formData.name || !formData.surname || !formData.email || !formData.password) {
        setError("Please fill in all account fields");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 font-sans">
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-30"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl"></div>
      
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          
          {/* Back to home link */}
          <Link 
            href="/" 
            className="group mb-6 inline-flex items-center gap-2 text-sm text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          {/* Main Card */}
          <div className="relative overflow-hidden rounded-3xl bg-white/90 shadow-2xl backdrop-blur-sm transition-all duration-500 dark:bg-gray-900/80">
            
            {/* Progress Steps */}
            <div className="px-8 pt-8">
              <div className="flex items-center justify-between">
                {[1, 2].map((stepNum) => (
                  <div key={stepNum} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        step >= stepNum 
                          ? "border-emerald-500 bg-emerald-500 text-white" 
                          : "border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800"
                      }`}>
                        {step > stepNum ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          stepNum
                        )}
                      </div>
                      <div className={`mt-2 text-xs font-medium ${
                        step >= stepNum ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                      }`}>
                        {stepNum === 1 && "Account"}
                        {stepNum === 2 && "Business"}
                      </div>
                    </div>
                    {stepNum < 2 && (
                      <div className={`h-0.5 flex-1 mx-4 transition-all duration-300 ${
                        step > stepNum ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 sm:p-10">
              
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {step === 1 && "Create Your Account"}
                  {step === 2 && "Tell Us About Your Business"}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {step === 1 && "Start your growth journey with GrowthGrid"}
                  {step === 2 && "This helps us personalize your action plan"}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-400">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {success}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* STEP 1: ACCOUNT INFO */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name *
                        </label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John"
                          className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                          required
                          aria-label="First Name"
                        />
                      </div>
                      <div>
                        <label htmlFor="surname" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Surname *
                        </label>
                        <input
                          id="surname"
                          type="text"
                          name="surname"
                          value={formData.surname}
                          onChange={handleChange}
                          placeholder="Doe"
                          className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                          required
                          aria-label="Last Name"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Create a strong password"
                          className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 pr-12 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
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
                      <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 pr-12 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? "👁️" : "🔒"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: BUSINESS SETUP */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="businessName" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Business Name *
                      </label>
                      <input
                        id="businessName"
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Your Business Name"
                        className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="industry" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Industry *
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                        required
                      >
                        <option value="">Select your industry</option>
                        {industries.map((ind) => (
                          <option key={ind.value} value={ind.value}>
                            {ind.label} - {ind.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="businessSize" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Business Size
                      </label>
                      <select
                        id="businessSize"
                        name="businessSize"
                        value={formData.businessSize}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-300 bg-white/50 px-4 py-3 text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white"
                      >
                        <option value="">Select business size</option>
                        {businessSizes.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                      <p className="text-sm text-emerald-800 dark:text-emerald-300">
                        💡 <span className="font-semibold">How this helps:</span> Based on your industry, we'll automatically generate relevant daily actions
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex gap-4">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      Back
                    </button>
                  )}
                  
                  {step < 2 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50"
                    >
                      {loading ? "Creating Account..." : "Complete Registration"}
                    </button>
                  )}
                </div>
              </form>

              {/* Footer */}
              <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline dark:text-emerald-400">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}