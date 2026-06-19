// src/app/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/app/components/notifications/NotificationBell";

type ReportData = {
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionRate: number;
  };
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  employeeStats: Array<{
    id: string;
    name: string;
    surname: string;
    email: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }>;
  recentActivity: Array<{
    id: number;
    title: string;
    status: string;
    updated_at: string;
  }>;
};

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.id) {
      fetchReport();
    }
  }, [status, session, router]);

  const fetchReport = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append("userId", session.user.id);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const response = await fetch(`/api/reports?${params.toString()}`);
      
      // Check if response is OK
      if (!response.ok) {
        const text = await response.text();
        console.error("API Response:", text);
        throw new Error(`API returned ${response.status}: ${text.substring(0, 100)}`);
      }
      
      const data = await response.json();

      if (response.ok) {
        setReport(data);
      } else {
        setError(data.error || "Failed to fetch report");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setError(error instanceof Error ? error.message : "Failed to load reports");
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-emerald-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Reports</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Try Again
          </button>
          <Link href="/owner-dashboard" className="block mt-3 text-emerald-600 hover:text-emerald-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center">
          <p className="text-gray-500">No report data available. Start creating tasks!</p>
          <Link href="/owner-dashboard" className="mt-4 inline-block text-emerald-600 hover:text-emerald-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { summary, byPriority, employeeStats, recentActivity } = report;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      
      <style>{`
        .nav-link { 
          position: relative;
          font-weight: 500;
          color: #4B5563;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #059669; }
        .nav-link.active { color: #059669; }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 2px;
          background: #059669;
          border-radius: 2px;
        }
        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .progress-bar {
          transition: width 0.8s ease-in-out;
        }
        .employee-row {
          transition: all 0.2s;
        }
        .employee-row:hover {
          background-color: #F9FAFB;
        }
        .activity-row {
          transition: all 0.2s;
        }
        .activity-row:hover {
          background-color: #F9FAFB;
        }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">Reports</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/owner-dashboard" className="nav-link">Dashboard</Link>
              <Link href="/owner/team" className="nav-link">Team</Link>
              <Link href="/reports" className="nav-link active">Reports</Link>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href="/owner-dashboard"
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">📊 Task Reports</h1>
          <p className="text-gray-500 mt-1">View analytics and insights about your team's performance</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-emerald-100">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Select start date"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Select end date"
              />
            </div>
            <button
              onClick={fetchReport}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setDateRange({ start: "", end: "" });
                setTimeout(fetchReport, 100);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card bg-white rounded-2xl shadow-sm p-6 border border-emerald-100">
            <p className="text-sm text-gray-500 font-medium">Total Tasks</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{summary.total}</p>
          </div>
          <div className="stat-card bg-white rounded-2xl shadow-sm p-6 border border-emerald-100">
            <p className="text-sm text-gray-500 font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{summary.completed}</p>
          </div>
          <div className="stat-card bg-white rounded-2xl shadow-sm p-6 border border-emerald-100">
            <p className="text-sm text-gray-500 font-medium">In Progress</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{summary.inProgress}</p>
          </div>
          <div className="stat-card bg-white rounded-2xl shadow-sm p-6 border border-emerald-100">
            <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{summary.completionRate}%</p>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-emerald-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tasks by Priority</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-50 rounded-lg text-center border border-red-100">
              <p className="text-sm text-gray-500">🔴 Urgent</p>
              <p className="text-2xl font-bold text-red-600">{byPriority.urgent}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center border border-orange-100">
              <p className="text-sm text-gray-500">🟠 High</p>
              <p className="text-2xl font-bold text-orange-600">{byPriority.high}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center border border-yellow-100">
              <p className="text-sm text-gray-500">🟡 Medium</p>
              <p className="text-2xl font-bold text-yellow-600">{byPriority.medium}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
              <p className="text-sm text-gray-500">⚪ Low</p>
              <p className="text-2xl font-bold text-gray-600">{byPriority.low}</p>
            </div>
          </div>
        </div>

        {/* Employee Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">👥 Employee Performance</h2>
            <span className="text-sm text-gray-500">{employeeStats.length} employees</span>
          </div>
          <div className="divide-y divide-gray-100">
            {employeeStats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">👤</div>
                <p>No employees yet</p>
                <p className="text-sm text-gray-400 mt-1">Add employees to see performance metrics</p>
              </div>
            ) : (
              employeeStats.map((emp) => (
                <div key={emp.id} className="employee-row p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-800">{emp.name} {emp.surname}</p>
                    <p className="text-sm text-gray-500">{emp.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-gray-500">Tasks</p>
                      <p className="font-medium text-gray-800">{emp.totalTasks}</p>
                    </div>
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-gray-500">Done</p>
                      <p className="font-medium text-green-600">{emp.completedTasks}</p>
                    </div>
                    <div className="w-24">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full progress-bar"
                          style={{ width: `${emp.completionRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-1">{emp.completionRate}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">🔄 Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>No recent activity</p>
                <p className="text-sm text-gray-400 mt-1">Tasks will appear here as they are updated</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-row p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(activity.status)}`}>
                      {activity.status}
                    </span>
                    <span className="text-gray-800 font-medium">{activity.title}</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(activity.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}