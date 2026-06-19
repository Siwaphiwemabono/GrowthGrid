// src/app/api/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { id } = params;
    const { name, surname, email, role } = body;

    // Get the employee record to find the profile_id
    const { data: employee, error: employeeError } = await db
      .from("employees")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Update profile
    if (employee.profile_id) {
      const { error: profileError } = await db
        .from("profiles")
        .update({ name, surname, email })
        .eq("id", employee.profile_id);

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        );
      }
    }

    // Update employee record
    const { data, error } = await db
      .from("employees")
      .update({ name, surname, email, role })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully",
      employee: data,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the employee record
    const { data: employee, error: employeeError } = await db
      .from("employees")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Delete profile (which will cascade delete the employee record)
    if (employee.profile_id) {
      const { error: profileError } = await db
        .from("profiles")
        .delete()
        .eq("id", employee.profile_id);

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        );
      }
    } else {
      // If no profile_id, delete employee directly
      const { error } = await db
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Employee deleted successfully",
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    );
  }
}