"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 font-sans dark:from-gray-950 dark:via-emerald-950/30 dark:to-gray-950">
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-30 dark:bg-[radial-gradient(#34d399_1px,transparent_1px)] dark:opacity-20"></div>
      
      {/* Floating orbs for depth */}
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-500/10"></div>
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-500/10"></div>
      
      {/* NAVIGATION BAR */}
      <nav className="relative z-10 border-b border-emerald-100 bg-white/50 backdrop-blur-md dark:border-emerald-900/30 dark:bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-white">GrowthGrid</span>
              </Link>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:flex md:items-center md:gap-8">
              <Link href="#features" className="text-sm text-gray-600 transition hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400">Features</Link>
              <Link href="#how-it-works" className="text-sm text-gray-600 transition hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400">How It Works</Link>
              <Link href="#pricing" className="text-sm text-gray-600 transition hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400">Pricing</Link>
              <Link href="#contact" className="text-sm text-gray-600 transition hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400">Contact</Link>
            </div>
            
            <div className="hidden md:flex md:items-center md:gap-4">
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                Log in
              </Link>
              <Link href="/register" className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:scale-105 hover:shadow-lg">
                Start Free Trial
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 md:hidden">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="border-t border-emerald-100 py-4 dark:border-emerald-900/30 md:hidden">
              <div className="flex flex-col space-y-3">
                <Link href="#features" className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Features</Link>
                <Link href="#how-it-works" className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">How It Works</Link>
                <Link href="#pricing" className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Pricing</Link>
                <Link href="#contact" className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Contact</Link>
                <div className="flex gap-3 pt-2">
                  <Link href="/login" className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300">Log in</Link>
                  <Link href="/register" className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-center text-sm font-medium text-white">Sign Up</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      <div className="relative flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <main className="flex w-full max-w-6xl flex-col items-center">
          
          {/* HERO SECTION - More outcome-focused */}
          <div className="flex w-full flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Stop Guessing. Start Acting.
            </div>
            
            <h1 className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-700 bg-clip-text text-5xl font-bold tracking-tight text-transparent dark:from-emerald-400 dark:via-teal-400 dark:to-green-400 sm:text-6xl md:text-7xl">
              Your Business Doesn't Need More Data.
              <br />
              <span className="text-gray-800 dark:text-white">It Needs The Next Best Action.</span>
            </h1>
            
            <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <p className="max-w-3xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl md:text-2xl">
              GrowthGrid turns your business data into a daily action plan that helps you recover revenue, keep customers, and close more sales.
            </p>
          </div>

          {/* TODAY'S ACTIONS MOCKUP - Moved higher (right after hero) */}
          <div className="mt-16 w-full max-w-2xl">
            <div className="rounded-2xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden border border-emerald-100 dark:border-emerald-900 transform transition-all duration-300 hover:scale-105">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">📋 TODAY'S ACTIONS</h3>
                <p className="text-sm text-emerald-100">Your prioritized action plan</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">🔥 HIGH PRIORITY</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Potential Revenue</span>
                  </div>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-white">📞 Call John Smith</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Potential sale: <span className="font-bold text-emerald-600">R3,500</span></p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">⚠️ URGENT</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Overdue</span>
                  </div>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-white">💰 Invoice Reminder</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sarah Jones owes <span className="font-bold text-emerald-600">R500</span> (5 days overdue)</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">📌 FOLLOW UP</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2 days ago</span>
                  </div>
                  <p className="mt-1 font-semibold text-gray-800 dark:text-white">✉️ Follow Up Lead</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Requested quote - ready to buy</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Potential Revenue:</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">R4,000</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
              This is what you see every morning. No dashboards. No confusion. Just action.
            </p>
          </div>

          {/* REAL BUSINESS SCENARIO - New section showing transformation */}
          <div className="mt-16 w-full max-w-4xl">
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-8 dark:from-emerald-950/30 dark:to-teal-950/30">
              <h3 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-white">See the Difference in 24 Hours</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl bg-white/80 p-6 dark:bg-gray-800/80">
                  <h4 className="mb-4 text-lg font-semibold text-red-600">Yesterday ❌</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>❌</span> 3 leads weren't contacted
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>❌</span> R2,000 invoice overdue
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>❌</span> 2 customers inactive for 30 days
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl">
                  <h4 className="mb-4 text-lg font-semibold">Today ✅</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span>✅</span> Follow up the leads
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>✅</span> Send payment reminder
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>✅</span> Re-engage customers
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-400">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Potential revenue saved:</span>
                      <span className="text-xl font-bold">R4,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PROBLEM SECTION - Moved after actions card */}
          <div className="mt-16 w-full" id="features">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                Most Business Owners Open 5 Different Tools
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                CRM. WhatsApp. Email. Invoices. Spreadsheets.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-center sm:gap-6">
              {["CRM", "WhatsApp", "Email", "Invoices", "Spreadsheets"].map((tool, idx) => (
                <div key={idx} className="rounded-xl bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:px-6 sm:py-3">
                  {tool}
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
              Then they spend hours figuring out what actually matters.
              <br />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">GrowthGrid does that thinking for you.</span>
            </p>
          </div>

          {/* Feature highlights */}
          <div className="mt-12 grid w-full grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-7" id="how-it-works">
            {[
              { 
                icon: "🎯", 
                title: "Never Lose a Lead", 
                desc: "Automatically identify customers who are likely to disappear before you lose the sale",
              },
              { 
                icon: "📋", 
                title: "Know What To Do Next", 
                desc: "Get a prioritized action list every morning based on your actual business data",
              },
              { 
                icon: "💵", 
                title: "Recover Lost Revenue", 
                desc: "Track unpaid invoices and forgotten opportunities automatically",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-emerald-50/50 p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-gray-800 dark:to-emerald-900/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
                <div className="relative">
                  <div className="mb-3 text-4xl">{feature.icon}</div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Value propositions - What you get daily */}
          <div className="mt-16 grid w-full grid-cols-1 gap-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/30 dark:to-teal-950/30 sm:grid-cols-4 sm:gap-6">
            {[
              { icon: "⚡", label: "Prioritized Daily Actions", desc: "Know exactly what to do" },
              { icon: "💰", label: "Revenue Recovery Alerts", desc: "Stop losing money" },
              { icon: "📞", label: "Lead Follow-Up Reminders", desc: "Never miss a sale" },
              { icon: "⚠️", label: "Customer Churn Warnings", desc: "Keep your customers" },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{item.label}</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Data → Decisions → Actions Flow */}
          <div className="mt-16 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-center text-white">
            <h3 className="text-2xl font-bold">From Data to Decisions to Actions</h3>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <span className="text-3xl">📊</span>
                <span>Data</span>
                <span className="text-xl">→</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">💡</span>
                <span>Decisions</span>
                <span className="text-xl">→</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl">✅</span>
                <span>Actions</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-emerald-100">
              GrowthGrid connects the dots so you don't have to
            </p>
          </div>

          {/* Judge/Investor Sentence */}
          <div className="mt-16 w-full rounded-2xl border border-emerald-200 bg-white/50 p-6 text-center dark:border-emerald-800/50 dark:bg-gray-800/50">
            <p className="text-base text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">GrowthGrid</span> is a decision-support platform that helps small businesses prioritize the actions most likely to increase revenue and reduce customer loss.
            </p>
          </div>

          {/* ACTION BUTTONS - Updated CTA wording */}
          <div className="mt-12 flex w-full flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
            <Link
              href="/login"
              className="group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-8 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:from-emerald-700 hover:to-teal-700 md:w-auto"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Get My Action Plan
              </span>
            </Link>
            
            <Link
              href="/register"
              className="group relative inline-flex h-12 w-full items-center justify-center rounded-full border-2 border-emerald-500 bg-white/80 px-8 text-sm font-semibold text-emerald-700 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-105 hover:bg-emerald-50 dark:border-emerald-400 dark:bg-gray-900/80 dark:text-emerald-400 dark:hover:bg-emerald-950/50 md:w-auto"
            >
              ✨ Start Free Trial
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Free 14-day trial
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              No credit card required
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Cancel anytime
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-16 w-full pt-8 text-center border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2026 GrowthGrid. Helping businesses take the right action every day.
            </p>
          </div>
          
        </main>
      </div>
    </div>
  );
}