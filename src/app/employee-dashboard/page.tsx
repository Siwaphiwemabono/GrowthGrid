// src/app/employee-dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { db } from "@/db/db";
import type { Task, Employee } from "@/db/schema";

// Extended Task type for dashboard display
interface DashboardTask extends Task {
  assigned_by_name?: string;
  assigned_by_email?: string;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All Tasks");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user?.id) {
      checkAuthAndLoadData();
    }
  }, [status, session, router]);

  const checkAuthAndLoadData = async () => {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }

    try {
      // Check if user is employee
      const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("role, id, email, name, surname")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("❌ Profile fetch error:", profileError);
        router.push("/login");
        return;
      }

      if (profile?.role !== "employee") {
        router.push("/owner-dashboard");
        return;
      }

      setUser(profile);

      // ✅ FIXED: Get employee record using snake_case
      const { data: employeeData, error: employeeError } = await db
        .from("employees")
        .select("*")
        .eq("profile_id", session.user.id)  // ✅ Changed from profileId
        .single();

      if (employeeError) {
        console.error("❌ Employee fetch error:", employeeError);
      } else {
        setEmployee(employeeData);
      }

      // Load tasks assigned to this employee
      await loadTasks(session.user.id);

      setLoading(false);
    } catch (error) {
      console.error("❌ Auth check error:", error);
      router.push("/login");
    }
  };

  const loadTasks = async (userId: string) => {
    try {
      // ✅ FIXED: Get tasks using snake_case
      const { data: tasksData, error: tasksError } = await db
        .from("tasks")
        .select("*")
        .eq("assigned_to", userId)  // ✅ Changed from assignedTo
        .order("created_at", { ascending: false });  // ✅ Changed from createdAt

      if (tasksError) {
        console.error("❌ Tasks fetch error:", tasksError);
        setTasks([]);
        return;
      }

      // Get assigner names for each task
      const tasksWithNames = await Promise.all(
        (tasksData || []).map(async (task: DashboardTask) => {
          if (task.assigned_by) {  // ✅ Changed from assignedBy
            const { data: assigner } = await db
              .from("profiles")
              .select("name, surname")
              .eq("id", task.assigned_by)  // ✅ Changed from assignedBy
              .single();
            
            if (assigner) {
              task.assigned_by_name = `${assigner.name} ${assigner.surname}`;
            }
          }
          return task;
        })
      );

      setTasks(tasksWithNames);
    } catch (error) {
      console.error("❌ Load tasks error:", error);
      setTasks([]);
    }
  };

  const handleLogout = async () => {
    router.push("/login");
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const { error: updateError } = await db
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (updateError) {
        console.error("❌ Task update error:", updateError);
        return;
      }

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error("❌ Update task error:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'Urgent': return '🔴';
      case 'High': return '🟠';
      case 'Medium': return '🟡';
      default: return '⚪';
    }
  };

  // Filter tasks based on selected status
  const filteredTasks = filterStatus === "All Tasks" 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  const stats = {
    totalTasks: tasks.length,
    completed: tasks.filter(t => t.status === "Completed").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    pending: tasks.filter(t => t.status === "Pending").length,
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-emerald-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = user?.name || user?.email?.split('@')[0] || "Employee";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">GrowthGrid</span>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Employee</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-emerald-600 font-medium">Dashboard</a>
              <a href="#" className="text-gray-600 hover:text-emerald-600 transition">My Tasks</a>
              <a href="#" className="text-gray-600 hover:text-emerald-600 transition">Performance</a>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="text-gray-700 font-medium">{userName}</p>
                  <p className="text-gray-400 text-xs">Team Member</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-red-600 transition flex items-center gap-1"
                aria-label="Logout"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-3">
                <a href="#" className="text-emerald-600 font-medium px-3 py-2">Dashboard</a>
                <a href="#" className="text-gray-600 px-3 py-2">My Tasks</a>
                <a href="#" className="text-gray-600 px-3 py-2">Performance</a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Welcome, {userName}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here are your tasks and performance overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">My Tasks</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
              </div>
              <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <div className="h-11 w-11 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
              </div>
              <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Productivity Tip */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 mb-8 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <h3 className="font-semibold">Productivity Tip</h3>
                <p className="text-emerald-100 text-sm">Focus on high-priority tasks first to maximize your impact</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Completion Rate:</span>
              <span className="text-2xl font-bold">{stats.totalTasks > 0 ? Math.round((stats.completed / stats.totalTasks) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* My Tasks Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">📋 My Tasks</h2>
              <p className="text-sm text-gray-500 mt-0.5">Tasks assigned to you</p>
            </div>
            <div className="flex gap-2">
              <label htmlFor="filter-tasks" className="sr-only">Filter tasks by status</label>
              <select
                id="filter-tasks"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Filter tasks by status"
              >
                <option value="All Tasks">All Tasks</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p>No tasks {filterStatus !== "All Tasks" ? `with status "${filterStatus}"` : "assigned to you"}</p>
                <p className="text-sm text-gray-400 mt-1">Check back later for new tasks</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{task.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(task.priority || 'Medium')}`}>
                          {getPriorityIcon(task.priority || 'Medium')} {task.priority || 'Medium'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Assigned by: {task.assigned_by_name || 'Unknown'}</span>
                        </div>
                        {task.due_date && (  // ✅ Changed from dueDate
                          <div className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label htmlFor={`task-status-${task.id}`} className="sr-only">Update task status</label>
                      <select
                        id={`task-status-${task.id}`}
                        value={task.status || 'Pending'}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full border-0 focus:ring-2 focus:ring-emerald-500 ${getStatusColor(task.status || 'Pending')}`}
                        aria-label={`Update status for task: ${task.title}`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button 
                        className="p-2 text-gray-400 hover:text-emerald-600 transition"
                        aria-label={`View details for task: ${task.title}`}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status === "Completed").length > 0 ? (
                tasks.filter(t => t.status === "Completed").slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-600">Completed "{task.title}" task</span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Recently'}  {/* ✅ Changed from completedAt */}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800">Announcements</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">🎉 Q3 performance reviews coming up next week</p>
              <p className="text-sm text-gray-600">📊 New reporting dashboard available for team members</p>
              <p className="text-sm text-gray-600">💡 Training session on Thursday at 2 PM</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}