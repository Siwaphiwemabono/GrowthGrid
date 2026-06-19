// src/app/api/reports/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    // Get business ID
    const { data: business, error: businessError } = await db
      .from("businesses")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Get all tasks for this business
    const { data: tasks, error: tasksError } = await db
      .from("tasks")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (tasksError) {
      return NextResponse.json(
        { error: tasksError.message },
        { status: 400 }
      );
    }

    const taskList = tasks || [];
    const total = taskList.length;

    // Calculate statistics
    const completed = taskList.filter((t: any) => t.status === "Completed").length;
    const inProgress = taskList.filter((t: any) => t.status === "In Progress").length;
    const pending = taskList.filter((t: any) => t.status === "Pending" || t.status === "Available").length;

    // By priority
    const byPriority = {
      urgent: taskList.filter((t: any) => t.priority === "Urgent").length,
      high: taskList.filter((t: any) => t.priority === "High").length,
      medium: taskList.filter((t: any) => t.priority === "Medium").length,
      low: taskList.filter((t: any) => t.priority === "Low").length,
    };

    // Get employee stats
    const { data: employees } = await db
      .from("employees")
      .select("id, name, surname, email")
      .eq("business_id", business.id);

    const employeeStats = await Promise.all(
      (employees || []).map(async (emp) => {
        const { data: empTasks } = await db
          .from("tasks")
          .select("*")
          .eq("assigned_to", emp.id);

        const empTotal = empTasks?.length || 0;
        const empCompleted = empTasks?.filter((t: any) => t.status === "Completed").length || 0;

        return {
          id: emp.id,
          name: emp.name || "Unknown",
          surname: emp.surname || "",
          email: emp.email || "",
          totalTasks: empTotal,
          completedTasks: empCompleted,
          completionRate: empTotal > 0 ? Math.round((empCompleted / empTotal) * 100) : 0,
        };
      })
    );

    // Recent activity
    const recentActivity = taskList
      .filter((t: any) => t.status === "Completed" || t.status === "In Progress")
      .slice(0, 10)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        updated_at: t.completed_at || t.created_at,
      }));

    return NextResponse.json({
      summary: {
        total,
        completed,
        inProgress,
        pending,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
      byPriority,
      employeeStats: employeeStats.sort((a, b) => b.completionRate - a.completionRate),
      recentActivity,
    });

  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}