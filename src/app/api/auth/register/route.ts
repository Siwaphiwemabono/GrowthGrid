import { NextResponse } from "next/server";
import { findUserByEmail, addUser } from "@/lib/userStore";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, surname, email, password, role } = body;

  if (!name || !surname || !email || !password) {
    return NextResponse.json(
      { error: "Missing required registration fields" },
      { status: 400 }
    );
  }

  const existingUser = findUserByEmail(email);
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with that email already exists" },
      { status: 409 }
    );
  }

  const user = addUser({
    name,
    email,
    password,
    role: role === "owner" ? "owner" : "employee",
  });

  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
