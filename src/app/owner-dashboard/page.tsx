// src/app/owner-dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { db } from "@/db/db";
import NotificationBell from "@/app/components/notifications/NotificationBell";

// Types
interface Business {
  id: string;
  user_id: string;
  business_name: string;
  industry: string;
  business_size: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  business_owner_id: string;
  business_id: string;
  profile_id: string | null;
  email: string;
  name: string;
  surname: string;
  role: string;
  created_at: string;
}

interface Task {
  id: number;
  business_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  source: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  industry: string | null;
  assigned_to_email: string | null;
}

interface OwnerProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
}

interface DashboardTask extends Task {}

interface PriorityAction {
  id: string;
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'task' | 'employee' | 'business';
  action: string;
  due_date?: string;
  task_id?: number;
  employee_id?: string;
}

interface RevenueOpportunity {
  id: string;
  title: string;
  description: string;
  potentialRevenue: number;
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  action: string;
}

interface RiskAlert {
  id: string;
  title: string;
  description: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  potentialLoss: number;
  source: string;
  action: string;
  customer?: string;
}

const INDUSTRY_TASKS: Record<string, string[]> = {
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
    "Review customer feedback",
    "Update price tags",
    "Clean fitting rooms",
    "Check security cameras",
    "Prepare daily deposit"
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
    "Check food storage temperature",
    "Update reservation system",
    "Check POS system",
    "Clean and sanitize tables",
    "Review daily sales"
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
    "Restock supplies",
    "Check client preferences",
    "Update price list",
    "Clean waiting area",
    "Review monthly bookings"
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
    "Update portfolio",
    "Check industry news",
    "Network with potential clients",
    "Review case studies",
    "Plan project milestones"
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
    "Update project plans",
    "Meet with site supervisor",
    "Check supplier deliveries",
    "Review safety protocols",
    "Update client on progress"
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
    "Review customer satisfaction",
    "Plan marketing activities",
    "Check business expenses",
    "Review team communication",
    "Plan weekly objectives"
  ]
};

export default function OwnerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [displayedTasks, setDisplayedTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([]);
  const [revenueOpportunities, setRevenueOpportunities] = useState<RevenueOpportunity[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  
  const [newEmployee, setNewEmployee] = useState({ email: "", name: "", surname: "" });
  const [newEmployeeCredentials, setNewEmployeeCredentials] = useState({ 
    email: "", 
    password: "",
    name: "",
    surname: "",
    loginUrl: "http://localhost:3000/login",
    businessName: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const refreshDisplayedTasks = () => {
    if (availableTasks.length === 0) {
      setDisplayedTasks([]);
      return;
    }
    const shuffled = [...availableTasks].sort(() => Math.random() - 0.5);
    setDisplayedTasks(shuffled.slice(0, Math.min(5, availableTasks.length)));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.id) {
      fetchAllData();
    }
  }, [status, session, router]);

  useEffect(() => {
    refreshDisplayedTasks();
  }, [availableTasks]);

  const generatePriorityActions = (tasks: Task[], employees: Employee[]) => {
    const actions: PriorityAction[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    tasks
      .filter(t => t.status !== "Completed" && t.due_date && new Date(t.due_date) < today)
      .forEach(task => {
        const daysOverdue = Math.floor((today.getTime() - new Date(task.due_date!).getTime()) / (1000 * 60 * 60 * 24));
        actions.push({
          id: `urgent-overdue-${task.id}`,
          title: `⚠️ Task Overdue: ${task.title}`,
          description: `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
          priority: 'URGENT',
          type: 'task',
          action: `Review and complete "${task.title}"`,
          due_date: task.due_date || undefined,
          task_id: task.id,
        });
      });

    tasks
      .filter(t => t.priority === "High" && t.status === "Available")
      .forEach(task => {
        actions.push({
          id: `urgent-high-${task.id}`,
          title: `🔴 High Priority Task: ${task.title}`,
          description: 'This task needs immediate attention',
          priority: 'URGENT',
          type: 'task',
          action: `Assign and start "${task.title}"`,
          task_id: task.id,
        });
      });

    tasks
      .filter(t => t.status !== "Completed" && t.due_date)
      .forEach(task => {
        if (!task.due_date) return;
        const dueDate = new Date(task.due_date);
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= 2) {
          actions.push({
            id: `high-approaching-${task.id}`,
            title: `📅 Due Soon: ${task.title}`,
            description: `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
            priority: 'HIGH',
            type: 'task',
            action: `Complete "${task.title}" by ${new Date(task.due_date).toLocaleDateString()}`,
            due_date: task.due_date,
            task_id: task.id,
          });
        }
      });

    tasks
      .filter(t => t.status === "In Progress" && t.created_at)
      .forEach(task => {
        const daysInProgress = Math.floor((now.getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysInProgress > 3) {
          actions.push({
            id: `high-stuck-${task.id}`,
            title: `⏳ Task Stalled: ${task.title}`,
            description: `In progress for ${daysInProgress} days`,
            priority: 'HIGH',
            type: 'task',
            action: `Check progress on "${task.title}"`,
            task_id: task.id,
          });
        }
      });

    tasks
      .filter(t => !t.assigned_to && t.status === "Available")
      .slice(0, 3)
      .forEach(task => {
        actions.push({
          id: `medium-unassigned-${task.id}`,
          title: `📋 Unassigned Task: ${task.title}`,
          description: 'Ready to be assigned',
          priority: 'MEDIUM',
          type: 'task',
          action: `Assign "${task.title}" to a team member`,
          task_id: task.id,
        });
      });

    if (employees.length > 0) {
      actions.push({
        id: 'medium-team-review',
        title: '👥 Review Team Performance',
        description: `${employees.length} team members active`,
        priority: 'MEDIUM',
        type: 'employee',
        action: 'Check employee performance in Reports',
      });
    }

    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return actions.slice(0, 6);
  };

  const generateRevenueOpportunities = (tasks: Task[]) => {
    const opportunities: RevenueOpportunity[] = [];
    
    tasks
      .filter(t => t.priority === "High" && t.status === "Available")
      .forEach((task, index) => {
        const potentialRevenue = (index + 1) * 2500;
        opportunities.push({
          id: `revenue-high-${task.id}`,
          title: `💰 High Value Task: ${task.title}`,
          description: `Completing this task could generate revenue`,
          potentialRevenue: potentialRevenue,
          probability: 'HIGH',
          source: 'High Priority Task',
          action: `Assign and complete "${task.title}" today`,
        });
      });

    tasks
      .filter(t => t.status !== "Completed" && t.due_date && new Date(t.due_date) < new Date())
      .forEach((task, index) => {
        const potentialRevenue = (index + 1) * 1500;
        opportunities.push({
          id: `revenue-overdue-${task.id}`,
          title: `⏰ Recovery Opportunity: ${task.title}`,
          description: `Resolving this overdue task could recover revenue`,
          potentialRevenue: potentialRevenue,
          probability: 'MEDIUM',
          source: 'Overdue Task',
          action: `Complete "${task.title}" to recover potential revenue`,
        });
      });

    tasks
      .filter(t => t.status === "In Progress")
      .slice(0, 2)
      .forEach((task, index) => {
        const potentialRevenue = (index + 1) * 3000;
        opportunities.push({
          id: `revenue-progress-${task.id}`,
          title: `📈 Revenue in Progress: ${task.title}`,
          description: `This task is moving forward and generating value`,
          potentialRevenue: potentialRevenue,
          probability: 'MEDIUM',
          source: 'In Progress',
          action: `Follow up on "${task.title}" to ensure completion`,
        });
      });

    opportunities.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
    return opportunities.slice(0, 3);
  };

  const generateRiskAlerts = (tasks: Task[], employees: Employee[]) => {
    const alerts: RiskAlert[] = [];

    tasks
      .filter(t => t.status !== "Completed" && t.due_date && new Date(t.due_date) < new Date())
      .forEach(task => {
        const daysOverdue = Math.floor((new Date().getTime() - new Date(task.due_date!).getTime()) / (1000 * 60 * 60 * 24));
        const potentialLoss = daysOverdue * 1000;
        alerts.push({
          id: `risk-overdue-${task.id}`,
          title: `⚠️ Task Overdue: ${task.title}`,
          description: `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} - Action required immediately`,
          riskLevel: 'CRITICAL',
          potentialLoss: potentialLoss,
          source: 'Overdue Task',
          action: `Complete "${task.title}" immediately`,
        });
      });

    tasks
      .filter(t => !t.assigned_to && t.status === "Available")
      .slice(0, 2)
      .forEach(task => {
        alerts.push({
          id: `risk-unassigned-${task.id}`,
          title: `📋 Unassigned Task: ${task.title}`,
          description: 'No one is working on this - potential missed opportunity',
          riskLevel: 'HIGH',
          potentialLoss: 2000,
          source: 'Unassigned Task',
          action: `Assign "${task.title}" to a team member`,
        });
      });

    tasks
      .filter(t => t.status === "In Progress" && t.created_at)
      .forEach(task => {
        const daysInProgress = Math.floor((new Date().getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysInProgress > 5) {
          alerts.push({
            id: `risk-stalled-${task.id}`,
            title: `⏳ Task Stalled: ${task.title}`,
            description: `In progress for ${daysInProgress} days - resources being wasted`,
            riskLevel: 'MEDIUM',
            potentialLoss: 1500,
            source: 'Stalled Task',
            action: `Review "${task.title}" progress today`,
          });
        }
      });

    if (employees.length > 0 && tasks.length === 0) {
      alerts.push({
        id: 'risk-idle-team',
        title: '👥 Team Idle',
        description: `Your team of ${employees.length} has no active tasks`,
        riskLevel: 'MEDIUM',
        potentialLoss: 5000,
        source: 'Team Idle',
        action: 'Create and assign new tasks today',
      });
    }

    const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
    alerts.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    return alerts.slice(0, 3);
  };

  const fetchAllData = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    setLoading(true);

    try {
      const { data: ownerData, error: ownerError } = await db
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (ownerError) {
        console.error("❌ Owner fetch error:", ownerError);
      } else if (ownerData) {
        setOwner(ownerData);
      }

      const { data: businessData, error: businessError } = await db
        .from("businesses")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (businessError) {
        console.error("❌ Business fetch error:", businessError);
      } else if (businessData) {
        setBusiness(businessData);
        await ensureTaskPool(businessData.industry, userId);
      }

      let tasksData: Task[] = [];
      if (businessData?.id) {
        const { data, error: tasksError } = await db
          .from("tasks")
          .select("*")
          .eq("business_id", businessData.id)
          .order("created_at", { ascending: false });

        if (tasksError) {
          console.error("❌ Tasks fetch error:", tasksError);
        } else if (data) {
          tasksData = data;
          setAvailableTasks(data.filter((t: Task) => t.status === "Available"));
          setActiveTasks(data.filter((t: Task) => t.status === "In Progress"));
          setCompletedTasks(data.filter((t: Task) => t.status === "Completed").slice(0, 10));
        }
      }

      let employeesData: Employee[] = [];
      if (businessData?.id) {
        const { data, error: employeesError } = await db
          .from("employees")
          .select("*")
          .eq("business_id", businessData.id);

        if (employeesError) {
          console.error("❌ Employees fetch error:", employeesError);
        } else if (data) {
          employeesData = data;
          setEmployees(employeesData);
        }
      }

      const actions = generatePriorityActions(tasksData, employeesData);
      setPriorityActions(actions);

      const opportunities = generateRevenueOpportunities(tasksData);
      setRevenueOpportunities(opportunities);

      const risks = generateRiskAlerts(tasksData, employeesData);
      setRiskAlerts(risks);

    } catch (err) {
      console.error("❌ Fetch error:", err);
    }

    setLoading(false);
  };

  const ensureTaskPool = async (industry: string, userId: string) => {
    try {
      const { data: businessData } = await db
        .from("businesses")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!businessData) return;

      const businessId = businessData.id;

      const { data: existing } = await db
        .from("tasks")
        .select("id")
        .eq("business_id", businessId)
        .limit(1);

      if (existing && existing.length > 0) return;

      const tasks = INDUSTRY_TASKS[industry] || INDUSTRY_TASKS.other;
      
      const taskPool = tasks.map((title, index) => ({
        title: title,
        business_id: businessId,
        assigned_by: userId,
        status: "Available",
        priority: ["High", "Medium", "Low"][index % 3],
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await db.from("tasks").insert(taskPool);
      
      if (insertError) {
        console.error("❌ Task pool insert error:", insertError);
      }
    } catch (err) {
      console.error("❌ Ensure task pool error:", err);
    }
  };

  const assignTask = async () => {
    if (!selectedTask || !selectedEmployee) {
      setMessage({ type: "error", text: "Please select an employee" });
      return;
    }

    setSubmitting(true);
    const employee = employees.find(e => e.id === selectedEmployee);

    if (!employee) {
      setMessage({ type: "error", text: "Selected employee not found" });
      setSubmitting(false);
      return;
    }

    try {
      const assignToId = employee.profile_id || employee.id;

      const { error: updateError } = await db
        .from("tasks")
        .update({
          assigned_to: assignToId,
          assigned_to_email: employee.email,
          status: "In Progress",
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", selectedTask.id);

      if (updateError) {
        console.error("❌ Task update error:", updateError);
        setMessage({ type: "error", text: updateError.message });
      } else {
        await db
          .from("notifications")
          .insert({
            user_id: assignToId,
            title: "New Task Assigned 📋",
            message: `You have been assigned: "${selectedTask.title}"`,
            type: "task_assigned",
            link: `/tasks/${selectedTask.id}`,
            read: false,
          });

        setMessage({ type: "success", text: `✅ Task assigned to ${employee.name}` });
        setShowAssignModal(false);
        setSelectedTask(null);
        setSelectedEmployee("");
        fetchAllData();
      }
    } catch (err: any) {
      console.error("❌ Assign task error:", err);
      setMessage({ type: "error", text: err.message || "Failed to assign task" });
    }
    setSubmitting(false);
  };

  const completeTask = async (taskId: number) => {
    try {
      const { error: updateError } = await db
        .from("tasks")
        .update({ 
          status: "Completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", taskId);
      
      if (updateError) {
        setMessage({ type: "error", text: updateError.message });
      } else {
        setMessage({ type: "success", text: "✅ Task completed!" });
        fetchAllData();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to complete task" });
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.email || !newEmployee.name || !newEmployee.surname) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    setSubmitting(true);
    const tempPassword = Math.random().toString(36).slice(-8);

    try {
      const userId = crypto.randomUUID();

      const { data: businessData, error: businessError } = await db
        .from("businesses")
        .select("id")
        .eq("user_id", session?.user?.id)
        .single();

      if (businessError || !businessData) {
        console.error("❌ Business fetch error:", businessError);
        setMessage({ 
          type: "error", 
          text: businessError?.message || "Unable to find business. Please refresh." 
        });
        setSubmitting(false);
        return;
      }

      const { data: existingProfile, error: checkError } = await db
        .from("profiles")
        .select("email")
        .eq("email", newEmployee.email)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("❌ Check error:", checkError);
      }

      if (existingProfile) {
        setMessage({ 
          type: "error", 
          text: `❌ Email "${newEmployee.email}" is already registered. Please use a different email.` 
        });
        setSubmitting(false);
        return;
      }

      const { data: insertedData, error: insertError } = await db
        .from("profiles")
        .insert({
          id: userId,
          name: newEmployee.name,
          surname: newEmployee.surname,
          email: newEmployee.email,
          password: tempPassword,
          role: "employee",
          password_changed: false,
          business_id: businessData.id,
        })
        .select();

      if (insertError) {
        console.error("❌ Insert error:", insertError);
        
        let errorMessage = "Failed to create employee. Please try again.";
        if (insertError.code === "23505") {
          errorMessage = `❌ Email "${newEmployee.email}" is already registered. Please use a different email.`;
        } else if (insertError.message) {
          errorMessage = insertError.message;
        }
        
        setMessage({ type: "error", text: errorMessage });
        setSubmitting(false);
        return;
      }

      const { error: empError } = await db
        .from("employees")
        .insert({
          id: crypto.randomUUID(),
          business_owner_id: session?.user?.id,
          business_id: businessData.id,
          profile_id: userId,
          email: newEmployee.email,
          name: newEmployee.name,
          surname: newEmployee.surname,
          role: "employee",
        });

      if (empError) {
        console.error("❌ Employee record error:", empError);
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
      
      setMessage({ 
        type: "success", 
        text: `✅ Employee ${newEmployee.name} added! Temporary password: ${tempPassword}` 
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
      
    } catch (err: any) {
      console.error("❌ Error:", err);
      setMessage({ 
        type: "error", 
        text: err.message || "Something went wrong. Please try again." 
      });
    }
    setSubmitting(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const totalTasks = availableTasks.length + activeTasks.length + completedTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const productivityScore = completionRate > 50 ? "✅ Good" : "📈 Needs improvement";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-emerald-600">Loading your business dashboard...</p>
        </div>
      </div>
    );
  }

  const ownerFirstName = owner?.name || session?.user?.email?.split('@')[0] || 'Owner';
  const ownerFullName = owner ? `${owner.name} ${owner.surname}` : session?.user?.email || 'Owner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      
      <style>{`
        .progress-bar { transition: width 0.5s ease-in-out; }
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
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .btn-primary {
          background: linear-gradient(135deg, #059669, #0D9488);
          transition: all 0.3s;
        }
        .btn-primary:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.3);
        }
        .action-urgent { 
          background: #FEF2F2;
          border-left: 4px solid #EF4444;
        }
        .action-urgent:hover { background: #FEE2E2; }
        .action-high { 
          background: #FFF7ED;
          border-left: 4px solid #F97316;
        }
        .action-high:hover { background: #FFEDD5; }
        .action-medium { 
          background: #FEFCE8;
          border-left: 4px solid #EAB308;
        }
        .action-medium:hover { background: #FEF9C3; }
        .action-low { 
          background: #F9FAFB;
          border-left: 4px solid #9CA3AF;
        }
        .action-low:hover { background: #F3F4F6; }
      `}</style>

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
                <span className="text-xl font-bold text-gray-800">{business?.business_name || "GrowthGrid"}</span>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Owner</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/owner-dashboard" className="nav-link active">Dashboard</Link>
              <Link href="/owner/team" className="nav-link">Team</Link>
              <Link href="/reports" className="nav-link">Reports</Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{ownerFirstName?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-700 font-medium">{ownerFullName}</span>
              </div>
              
              <NotificationBell />
              
              <button 
                type="button"
                onClick={handleLogout} 
                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                Logout
              </button>
              
              <button 
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
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
                <Link href="/owner/team" className="text-gray-600 px-3 py-2">Team</Link>
                <Link href="/reports" className="text-gray-600 px-3 py-2">Reports</Link>
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
          <h1 className="text-3xl font-bold text-gray-800">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {ownerFirstName} 👋
          </h1>
          <p className="text-gray-500 mt-1">Welcome back to {business?.business_name || 'GrowthGrid'} dashboard</p>
        </div>

        {/* 🔴 TODAY'S PRIORITY ACTIONS */}
        {priorityActions.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-red-50 via-yellow-50 to-emerald-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🎯</span> Today's Priority Actions
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Your most important tasks for today</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                {priorityActions.filter(a => a.priority === 'URGENT').length} urgent
              </span>
            </div>
            
            <div className="space-y-2">
              {priorityActions.map((action) => {
                const priorityClass = {
                  URGENT: 'action-urgent',
                  HIGH: 'action-high',
                  MEDIUM: 'action-medium',
                  LOW: 'action-low',
                };
                const priorityLabels = {
                  URGENT: '🔴 URGENT',
                  HIGH: '🟠 HIGH',
                  MEDIUM: '🟡 MEDIUM',
                  LOW: '⚪ LOW',
                };
                
                return (
                  <div 
                    key={action.id} 
                    className={`p-3 rounded-r-lg transition-all cursor-pointer ${priorityClass[action.priority]}`}
                    onClick={() => {
                      if (action.task_id) {
                        const task = availableTasks.find(t => t.id === action.task_id) || 
                                     activeTasks.find(t => t.id === action.task_id);
                        if (task) {
                          setSelectedTask(task);
                          setShowAssignModal(true);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-600">{priorityLabels[action.priority]}</span>
                          <h3 className="text-sm font-medium text-gray-800">{action.title}</h3>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{action.description}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <span>💡</span> {action.action}
                        </p>
                      </div>
                      {action.task_id && (
                        <button 
                          className="text-xs bg-white/80 hover:bg-white text-emerald-700 px-3 py-1 rounded-lg shadow-sm transition whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            const task = availableTasks.find(t => t.id === action.task_id) || 
                                         activeTasks.find(t => t.id === action.task_id);
                            if (task) {
                              setSelectedTask(task);
                              setShowAssignModal(true);
                            }
                          }}
                        >
                          Take Action →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 💰 REVENUE OPPORTUNITIES - ADDED */}
        {revenueOpportunities.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">💰</span> Revenue Opportunities
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Actions that could generate revenue today</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                Total: R{revenueOpportunities.reduce((sum, opp) => sum + opp.potentialRevenue, 0).toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-2">
              {revenueOpportunities.map((opp) => (
                <div key={opp.id} className="bg-white/80 border border-emerald-100 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-emerald-700">
                          R{opp.potentialRevenue.toLocaleString()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          opp.probability === 'HIGH' ? 'bg-green-100 text-green-700' :
                          opp.probability === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {opp.probability} probability
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 mt-1">{opp.title}</p>
                      <p className="text-sm text-gray-500">{opp.description}</p>
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <span>💡</span> {opp.action}
                      </p>
                    </div>
                    <button 
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
                      onClick={() => {
                        const task = availableTasks.find(t => opp.id.includes(String(t.id)));
                        if (task) {
                          setSelectedTask(task);
                          setShowAssignModal(true);
                        }
                      }}
                    >
                      Capture Revenue →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⚠️ RISK ALERTS - ADDED */}
        {riskAlerts.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span> Risk Alerts
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Issues that could cost you money</p>
              </div>
              <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                Risk: R{riskAlerts.reduce((sum, alert) => sum + alert.potentialLoss, 0).toLocaleString()}
              </span>
            </div>
            
            <div className="space-y-2">
              {riskAlerts.map((alert) => (
                <div key={alert.id} className={`bg-white/80 border rounded-lg p-4 hover:shadow-md transition ${
                  alert.riskLevel === 'CRITICAL' ? 'border-red-300' :
                  alert.riskLevel === 'HIGH' ? 'border-orange-300' :
                  'border-yellow-300'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          alert.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          alert.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.riskLevel}
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          -R{alert.potentialLoss.toLocaleString()}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 mt-1">{alert.title}</p>
                      <p className="text-sm text-gray-500">{alert.description}</p>
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <span>⚡</span> {alert.action}
                      </p>
                    </div>
                    <button 
                      className={`text-xs px-4 py-2 rounded-lg transition whitespace-nowrap ${
                        alert.riskLevel === 'CRITICAL' 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                      onClick={() => {
                        const task = availableTasks.find(t => alert.id.includes(String(t.id))) || 
                                     activeTasks.find(t => alert.id.includes(String(t.id)));
                        if (task) {
                          setSelectedTask(task);
                          setShowAssignModal(true);
                        }
                      }}
                    >
                      Fix Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-emerald-100 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalTasks}</p>
                <p className="text-xs text-gray-400 mt-1">{activeTasks.length} in progress</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full progress-bar" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-emerald-100 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Team Members</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{employees.length}</p>
                <p className="text-xs text-gray-400 mt-1">Active team</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex -space-x-2">
              {employees.slice(0, 4).map((emp, i) => (
                <div key={i} className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  {emp.name?.charAt(0)}{emp.surname?.charAt(0)}
                </div>
              ))}
              {employees.length > 4 && (
                <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                  +{employees.length - 4}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-emerald-100 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{completionRate}%</p>
                <p className="text-xs text-gray-400 mt-1">{productivityScore}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-lg p-6 text-white card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-100 font-medium">Available Tasks</p>
                <p className="text-3xl font-bold mt-1">{availableTasks.length}</p>
                <p className="text-xs text-emerald-200 mt-1">Ready to assign</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button 
            type="button"
            onClick={() => setShowAddEmployee(true)} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition flex items-center gap-2 btn-primary"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Employee
          </button>
          <Link 
            href="/owner/team"
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Manage Team
          </Link>
          <Link 
            href="/reports"
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Reports
          </Link>
          <button 
            type="button"
            onClick={() => fetchAllData()} 
            className="px-5 py-2.5 bg-gray-700 text-white rounded-xl font-medium shadow-sm hover:shadow-md transition flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Task Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-b border-yellow-200 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <span className="text-2xl">🟡</span> Available
                </h2>
                <p className="text-sm text-gray-500">{availableTasks.length} tasks in pool</p>
              </div>
              {availableTasks.length > 5 && (
                <button
                  type="button"
                  onClick={() => refreshDisplayedTasks()}
                  className="text-xs bg-white/80 px-3 py-1.5 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-white transition shadow-sm"
                >
                  🔄 Shuffle
                </button>
              )}
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {displayedTasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-gray-500 font-medium">No tasks available</p>
                  <p className="text-sm text-gray-400 mt-1">Tasks will auto-generate</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedTasks.map((task) => (
                    <div key={task.id} className="p-4 bg-white rounded-xl hover:shadow-md transition-all border border-gray-200 hover:border-yellow-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => { setSelectedTask(task); setShowAssignModal(true); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTask(task); setShowAssignModal(true); } }}>
                          <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.priority === "High" ? "bg-red-100 text-red-700" : task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-gray-400">ID: #{task.id}</span>
                          </div>
                        </div>
                        <button type="button" className="ml-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-medium transition" onClick={() => { setSelectedTask(task); setShowAssignModal(true); }}>
                          Assign →
                        </button>
                      </div>
                    </div>
                  ))}
                  {availableTasks.length > 5 && (
                    <div className="text-center pt-3">
                      <button type="button" onClick={() => refreshDisplayedTasks()} className="text-xs text-gray-400 hover:text-emerald-600 transition">
                        Show {Math.min(5, availableTasks.length)} of {availableTasks.length} tasks
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                    <span className="text-2xl">🔵</span> Active
                  </h2>
                  <p className="text-sm text-gray-500">{activeTasks.length} in progress</p>
                </div>
                <div className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                  {activeTasks.length > 0 ? `${Math.round((activeTasks.filter(t => t.status === "In Progress").length / Math.max(1, totalTasks)) * 100)}% of tasks` : '0%'}
                </div>
              </div>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {activeTasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">⏳</div>
                  <p className="text-gray-500 font-medium">No active tasks</p>
                  <p className="text-sm text-gray-400 mt-1">Assign tasks to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition">
                      <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-medium">
                            {task.assigned_to?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs text-gray-600">{task.assigned_to}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.priority === "High" ? "bg-red-100 text-red-700" : task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                            {task.priority}
                          </span>
                        </div>
                        <button type="button" onClick={() => completeTask(task.id)} className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg text-sm font-medium transition">
                          ✓ Done
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100/50 border-b border-green-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                    <span className="text-2xl">🟢</span> Completed
                  </h2>
                  <p className="text-sm text-gray-500">{completedTasks.length} tasks done</p>
                </div>
                <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">✅ Done</div>
              </div>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {completedTasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-gray-500 font-medium">No completed tasks</p>
                  <p className="text-sm text-gray-400 mt-1">Complete tasks to see them here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completedTasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="p-3 bg-white rounded-xl border border-green-100 hover:shadow-sm transition flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">👤 {task.assigned_to}</span>
                          <span className="text-xs text-green-600">Completed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-800">👥 Team Members</h2>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{employees.length}</span>
            </div>
            <Link href="/owner/team" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View All →</Link>
          </div>
          {employees.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">👤</div>
              <p>No employees yet</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Employee" to build your team</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
              {employees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition group">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0">
                    {emp.name?.charAt(0)}{emp.surname?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">{emp.name} {emp.surname}</p>
                    <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                      <button type="button" onClick={() => { navigator.clipboard.writeText(newEmployeeCredentials.password); setMessage({ type: "success", text: "Password copied to clipboard!" }); setTimeout(() => setMessage({ type: "", text: "" }), 2000); }} className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition" aria-label="Copy password to clipboard">Copy</button>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                  <div className="flex gap-2">
                    <span className="text-blue-600">🔗</span>
                    <p className="text-sm text-blue-700"><strong>Login URL:</strong> <span className="font-mono">http://localhost:3000/login</span></p>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 mb-4 border border-yellow-200">
                  <div className="flex gap-2">
                    <span className="text-yellow-600">🔒</span>
                    <p className="text-sm text-yellow-700"><strong>Security Notice:</strong> For your account security, you will be required to <strong>change your password</strong> upon first login.</p>
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
                  <button type="button" onClick={() => { window.open(newEmployeeCredentials.loginUrl, "_blank"); }} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:opacity-90 transition shadow-md">
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
            <button type="button" onClick={() => setShowEmailPreview(false)} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition">Done</button>
          </div>
        </div>
      )}

      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Assign Task</h2>
            <p className="text-gray-600 mb-4"><strong>{selectedTask.title}</strong></p>
            <div className="mb-4">
              <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
              <select id="employee-select" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" aria-required="true">
                <option value="">Choose an employee...</option>
                {employees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.name} {emp.surname} ({emp.email})</option>))}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={assignTask} disabled={submitting} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">{submitting ? "Assigning..." : "Assign Task"}</button>
              <button type="button" onClick={() => { setShowAssignModal(false); setSelectedTask(null); setSelectedEmployee(""); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            <div className="space-y-4">
              <input type="text" placeholder="First Name" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" aria-label="First Name" />
              <input type="text" placeholder="Last Name" value={newEmployee.surname} onChange={(e) => setNewEmployee({ ...newEmployee, surname: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" aria-label="Last Name" />
              <input type="email" placeholder="Email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" aria-label="Email Address" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleAddEmployee} disabled={submitting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">{submitting ? "Adding..." : "Add Employee"}</button>
                <button type="button" onClick={() => setShowAddEmployee(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}