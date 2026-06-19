// src/app/employee-dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { db } from "@/db/db";
import type { Task, Employee, Business } from "@/db/schema";
import NotificationBell from "@/app/components/notifications/NotificationBell";

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
  const [business, setBusiness] = useState<Business | null>(null);
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
      const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("role, id, email, name, surname, business_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("❌ Profile fetch error:", profileError);
        router.push("/login");
        return;
      }

      if (!profile) {
        console.error("❌ Profile not found for user:", session.user.id);
        router.push("/login");
        return;
      }

      if (profile?.role !== "employee") {
        router.push("/owner-dashboard");
        return;
      }

      setUser(profile);

      const { data: employeeData, error: employeeError } = await db
        .from("employees")
        .select("*")
        .eq("profile_id", session.user.id)
        .maybeSingle();

      if (employeeError) {
        console.error("❌ Employee fetch error:", employeeError);
      } else {
        setEmployee(employeeData);
      }

      if (profile?.business_id) {
        const { data: businessData, error: businessError } = await db
          .from("businesses")
          .select("*")
          .eq("id", profile.business_id)
          .maybeSingle();

        if (businessError) {
          console.error("❌ Business fetch error:", businessError);
        } else {
          setBusiness(businessData);
        }
      }

      await loadTasks(profile);
      setLoading(false);
    } catch (error) {
      console.error("❌ Auth check error:", error);
      router.push("/login");
    }
  };

  const loadTasks = async (profile: any) => {
    try {
      const { data: tasksData, error: tasksError } = await db
        .from("tasks")
        .select("*")
        .eq("assigned_to", profile.id)
        .order("created_at", { ascending: false });

      if (tasksError) {
        console.error("❌ Tasks fetch error:", tasksError);
        setTasks([]);
        return;
      }

      let finalTasks = tasksData || [];

      if (finalTasks.length === 0 && profile.email) {
        console.log("🔍 No tasks found by profile ID, trying by email...");
        const { data: emailTasks, error: emailError } = await db
          .from("tasks")
          .select("*")
          .eq("assigned_to_email", profile.email)
          .order("created_at", { ascending: false });

        if (!emailError && emailTasks) {
          finalTasks = emailTasks;
        }
      }

      const tasksWithNames = await Promise.all(
        finalTasks.map(async (task: DashboardTask) => {
          if (task.assigned_by) {
            const { data: assigner } = await db
              .from("profiles")
              .select("name, surname")
              .eq("id", task.assigned_by)
              .maybeSingle();
            
            if (assigner) {
              task.assigned_by_name = `${assigner.name} ${assigner.surname}`;
            }
          }
          return task;
        })
      );

      setTasks(tasksWithNames);
      console.log(`✅ Loaded ${tasksWithNames.length} tasks for employee`);
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

  // Get priority tasks for the "Today's Focus" section
  const priorityTasks = tasks
    .filter(t => t.status !== "Completed" && (t.priority === "Urgent" || t.priority === "High"))
    .slice(0, 3);

  const filteredTasks = filterStatus === "All Tasks" 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  const stats = {
    totalTasks: tasks.length,
    completed: tasks.filter(t => t.status === "Completed").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    pending: tasks.filter(t => t.status === "Pending").length,
  };

  const progress = stats.totalTasks > 0 ? Math.round((stats.completed / stats.totalTasks) * 100) : 0;

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
  const businessName = business?.business_name || "GrowthGrid";

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
          background: white;
          border-radius: 0.75rem;
          padding: 1rem;
          border: 1px solid rgba(5, 150, 105, 0.15);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .task-item {
          transition: all 0.2s;
        }
        .task-item:hover {
          background-color: #F9FAFB;
        }
        .progress-bar {
          transition: width 0.8s ease-in-out;
        }
        .focus-item {
          transition: all 0.2s;
        }
        .focus-item:hover {
          transform: translateX(4px);
        }
      `}</style>

      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">{businessName}</span>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Employee</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/employee-dashboard" className="nav-link active">Dashboard</Link>
              <a 
                href="#my-tasks" 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('my-tasks')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                My Tasks
              </a>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-700 font-medium">{userName}</span>
              </div>

              <NotificationBell />

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                Logout
              </button>

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

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-3">
                <Link href="/employee-dashboard" className="text-emerald-600 font-medium px-3 py-2">Dashboard</Link>
                <a 
                  href="#my-tasks" 
                  className="text-gray-600 px-3 py-2"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('my-tasks')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                >
                  My Tasks
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Welcome Section */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {userName} 👋
          </h1>
          <p className="text-gray-500 text-sm">Here's what you need to focus on today</p>
        </div>

        {/* 🎯 TODAY'S FOCUS - New Section */}
        {priorityTasks.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🎯</span>
              <h3 className="font-semibold text-gray-800 text-sm">Today's Focus</h3>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-auto">
                {priorityTasks.length} priority
              </span>
            </div>
            <div className="space-y-1.5">
              {priorityTasks.map((task, index) => (
                <div key={task.id} className="focus-item flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-xs">{index === 0 ? '🔴' : index === 1 ? '🟠' : '🟡'}</span>
                  <span className="font-medium">{task.title}</span>
                  {task.due_date && new Date(task.due_date).toDateString() === new Date().toDateString() && (
                    <span className="text-xs text-red-500 font-medium">Due today!</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{task.priority}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">My Tasks</p>
                <p className="text-xl font-bold text-gray-800">{stats.totalTasks}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Completed</p>
                <p className="text-xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">In Progress</p>
                <p className="text-xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                <p className="text-xl font-bold text-red-600">{stats.pending}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar - New Section */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">My Progress</span>
            <span className="text-sm font-bold text-emerald-600">{stats.completed}/{stats.totalTasks} done</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full progress-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Productivity Tip - Cleaner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">💡</span>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Productivity Tip</h4>
                <p className="text-emerald-100 text-xs">Focus on high-priority tasks first</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Completion:</span>
              <span className="text-xl font-bold">{progress}%</span>
            </div>
          </div>
        </div>

        {/* My Tasks Section - with ID for scrolling */}
        <div id="my-tasks" className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">📋 My Tasks</h2>
              <p className="text-xs text-gray-500">Tasks assigned to you</p>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              aria-label="Filter tasks by status"
            >
              <option value="All Tasks">All Tasks</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredTasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">No tasks {filterStatus !== "All Tasks" ? `with status "${filterStatus}"` : "assigned to you"}</p>
                <p className="text-xs text-gray-400 mt-1">Check back later for new tasks</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className="task-item p-3 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-semibold ${task.status === 'Completed' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {task.title}
                        </h3>
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(task.priority || 'Medium')}`}>
                          {getPriorityIcon(task.priority || 'Medium')} {task.priority || 'Medium'}
                        </span>
                        {task.status === 'Completed' && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✅ Done</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-0.5">
                        <span>Assigned by: {task.assigned_by_name || 'Unknown'}</span>
                        {task.due_date && (
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      {task.status !== 'Completed' ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={task.status || 'Pending'}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            className={`px-2 py-0.5 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-emerald-500 ${getStatusColor(task.status || 'Pending')}`}
                            aria-label={`Update status for task: ${task.title}`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Done ✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity - Cleaner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.status === "Completed").length > 0 ? (
                tasks.filter(t => t.status === "Completed").slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                    <span className="text-gray-600 text-xs">Completed "{task.title}"</span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No recent activity</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Announcements</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-600">🎉 Q3 performance reviews coming up next week</p>
              <p className="text-xs text-gray-600">📊 New reporting dashboard available</p>
              <p className="text-xs text-gray-600">💡 Training session on Thursday at 2 PM</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}