"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define types
interface Task {
  id: number;
  title: string;
  assigned_to: string;
  status: string;
  priority: string;
  due_date: string;
  created_at: string;
  notes?: any[];
}

interface Employee {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
}

interface Business {
  id: string;
  business_name: string;
  industry: string;
  business_size: string;
}

export default function OwnerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    employees: 0,
    revenueAtRisk: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState({ 
    email: "", 
    password: "",
    name: "",
    surname: "",
    loginUrl: "http://localhost:3000/login",
    businessName: ""
  });
  const [newTask, setNewTask] = useState({ title: "", assignedTo: "", dueDate: "", priority: "Medium" });
  const [newEmployee, setNewEmployee] = useState({ email: "", name: "", surname: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchAllData();
    }
  }, [status, router]);

  const fetchAllData = async () => {
    setLoading(true);
    
    try {
      // Fetch business info
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", session?.user?.id)
        .single();
      
      if (!businessError && businessData) {
        setBusiness(businessData);
      }
      
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!tasksError && tasksData) {
        setRecentTasks(tasksData.slice(0, 5));
        setStats(prev => ({
          ...prev,
          totalTasks: tasksData.length,
          completed: tasksData.filter((t: Task) => t.status === "Completed").length,
          inProgress: tasksData.filter((t: Task) => t.status === "In Progress").length,
          pending: tasksData.filter((t: Task) => t.status === "Pending").length,
        }));
      }
      
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee");
      
      if (!employeesError && employeesData) {
        setEmployees(employeesData);
        setStats(prev => ({ ...prev, employees: employeesData.length }));
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessage({ type: "error", text: "Failed to load data" });
    }
    
    setLoading(false);
  };

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
      setMessage({ type: "error", text: "Please fill in all task fields" });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const { error } = await supabase.from("tasks").insert({
        title: newTask.title,
        assigned_to: newTask.assignedTo,
        assigned_by: session?.user?.id,
        status: "Pending",
        priority: newTask.priority,
        due_date: newTask.dueDate,
        created_at: new Date().toISOString(),
      });
      
      if (error) throw error;
      
      setMessage({ type: "success", text: "Task created successfully!" });
      setNewTask({ title: "", assignedTo: "", dueDate: "", priority: "Medium" });
      setShowCreateTask(false);
      fetchAllData();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create task" });
    }
    
    setSubmitting(false);
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.email || !newEmployee.name || !newEmployee.surname) {
      setMessage({ type: "error", text: "Please fill in all employee fields" });
      return;
    }
    
    setSubmitting(true);
    const tempPassword = Math.random().toString(36).slice(-8);
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newEmployee.email)
        .single();
      
      if (existingUser) {
        await supabase
          .from("profiles")
          .update({ role: "employee", name: newEmployee.name, surname: newEmployee.surname })
          .eq("id", existingUser.id);
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email: newEmployee.email,
          password: tempPassword,
          options: { 
            data: { 
              name: newEmployee.name, 
              surname: newEmployee.surname, 
              role: "employee" 
            } 
          },
        });
        
        if (authError) throw authError;
      }
      
      setNewEmployeeCredentials({
        email: newEmployee.email,
        password: tempPassword,
        name: newEmployee.name,
        surname: newEmployee.surname,
        loginUrl: "http://localhost:3000/login",
        businessName: business?.business_name || "GrowthGrid"
      });
      
      setShowEmailPreview(true);
      setNewEmployee({ email: "", name: "", surname: "" });
      setShowAddEmployee(false);
      fetchAllData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
    
    setSubmitting(false);
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
      fetchAllData();
      setMessage({ type: "success", text: "Task updated!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 2000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update task" });
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-emerald-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">{business?.business_name || "GrowthGrid"}</span>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Owner</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/owner-dashboard" className="text-emerald-600 font-medium">Dashboard</Link>
              <Link href="/owner/tasks" className="text-gray-600 hover:text-emerald-600">Tasks</Link>
              <Link href="/owner/team" className="text-gray-600 hover:text-emerald-600">Team</Link>
              <Link href="/owner/reports" className="text-gray-600 hover:text-emerald-600">Reports</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm text-gray-600">{session?.user?.email}</div>
              <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Logout</button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col space-y-3">
                <Link href="/owner-dashboard" className="text-emerald-600 font-medium px-3 py-2">Dashboard</Link>
                <Link href="/owner/tasks" className="text-gray-600 px-3 py-2">Tasks</Link>
                <Link href="/owner/team" className="text-gray-600 px-3 py-2">Team</Link>
                <Link href="/owner/reports" className="text-gray-600 px-3 py-2">Reports</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Owner Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your business, team, and track performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-emerald-100">
            <p className="text-sm text-gray-500">Employees</p>
            <p className="text-2xl font-bold text-gray-800">{stats.employees}</p>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-sm p-5">
            <p className="text-sm text-red-100">Revenue at Risk</p>
            <p className="text-2xl font-bold text-white">R{stats.revenueAtRisk.toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button onClick={() => setShowCreateTask(true)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition">+ Create Task</button>
          <button onClick={() => setShowAddEmployee(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition">+ Add Employee</button>
          <button onClick={() => fetchAllData()} className="px-5 py-2.5 bg-gray-800 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition">⟳ Refresh</button>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">📋 Recent Tasks</h2>
            <Link href="/owner/tasks" className="text-sm text-emerald-600 hover:text-emerald-700">View All →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tasks yet. Click "Create Task" to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{task.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{task.assigned_to}</td>
                      <td className="px-6 py-4">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            task.status === "Completed" ? "bg-green-100 text-green-700" :
                            task.status === "In Progress" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{task.due_date}</td>
                      <td className="px-6 py-4">
                        <button className="text-emerald-600 hover:text-emerald-700 text-sm">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">👥 Team Members</h2>
            <Link href="/owner/team" className="text-sm text-emerald-600 hover:text-emerald-700">Manage Team →</Link>
          </div>
          {employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No employees yet. Click "Add Employee" to build your team.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                    {emp.name?.charAt(0)}{emp.surname?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{emp.name} {emp.surname}</p>
                    <p className="text-sm text-gray-500">{emp.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Task</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Task Title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Assigned To (Email)"
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="flex gap-3 pt-4">
                <button onClick={handleCreateTask} disabled={submitting} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition">
                  {submitting ? "Creating..." : "Create"}
                </button>
                <button onClick={() => setShowCreateTask(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="First Name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newEmployee.surname}
                onChange={(e) => setNewEmployee({ ...newEmployee, surname: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="flex gap-3 pt-4">
                <button onClick={handleAddEmployee} disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                  {submitting ? "Adding..." : "Add Employee"}
                </button>
                <button onClick={() => setShowAddEmployee(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Invitation Modal */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Invitation Email Preview</h2>
              <p className="text-gray-500 text-sm mt-1">This is what the employee will receive</p>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">From:</span> {newEmployeeCredentials.businessName} &lt;noreply@growthgrid.com&gt;
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">To:</span> {newEmployeeCredentials.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">Subject:</span> You've been invited to join {newEmployeeCredentials.businessName} on GrowthGrid
                </div>
              </div>
              <div className="p-6 bg-white">
                <div className="text-center mb-6">
                  <div className="inline-block h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Welcome to {newEmployeeCredentials.businessName}!</h2>
                <p className="text-gray-600 text-center mb-6">You've been invited to join the team and start collaborating.</p>

                <p className="text-gray-700 mb-4">Dear <strong>{newEmployeeCredentials.name} {newEmployeeCredentials.surname}</strong>,</p>

                <p className="text-gray-700 mb-4">
                  <strong>{session?.user?.email}</strong> has invited you to join <strong>{newEmployeeCredentials.businessName}</strong> on <strong>GrowthGrid</strong>, 
                  the all-in-one platform for team collaboration and task management.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">🔐 Your Account Details</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">Email:</span>
                      <code className="bg-white px-2 py-1 rounded border border-gray-200 text-sm">{newEmployeeCredentials.email}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">Password:</span>
                      <code className="bg-white px-2 py-1 rounded border border-gray-200 text-sm font-mono">{newEmployeeCredentials.password}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(newEmployeeCredentials.password);
                          setMessage({ type: "success", text: "Password copied to clipboard!" });
                          setTimeout(() => setMessage({ type: "", text: "" }), 2000);
                        }}
                        className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-3 mb-4 border border-yellow-200">
                  <div className="flex gap-2">
                    <span className="text-yellow-600">🔒</span>
                    <p className="text-sm text-yellow-700">
                      <strong>Security Notice:</strong> For your account security, you will be required to <strong>change your password</strong> upon first login.
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 font-semibold mb-2">What you can do with GrowthGrid:</p>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    <li className="flex items-center gap-2">✅ View and manage tasks assigned to you</li>
                    <li className="flex items-center gap-2">✅ Collaborate with your team members</li>
                    <li className="flex items-center gap-2">✅ Track your progress and performance</li>
                    <li className="flex items-center gap-2">✅ Receive real-time updates and notifications</li>
                  </ul>
                </div>

                <div className="text-center mt-6">
                  <p className="text-gray-600 mb-3">Click the button below to log in and get started:</p>
                  <button
                    onClick={() => {
                      window.open(newEmployeeCredentials.loginUrl, '_blank');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:opacity-90 transition shadow-md"
                  >
                    Go to Login Page
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>

                <div className="border-t border-gray-200 mt-6 pt-4">
                  <p className="text-xs text-gray-400 text-center">
                    This invitation was sent by {session?.user?.email}. If you did not expect this invitation, please ignore this email.<br />
                    © {new Date().getFullYear()} GrowthGrid. All rights reserved.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowEmailPreview(false)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}