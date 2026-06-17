import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    surname,
    email,
    password,
    role,
    businessName,
    industry,
    businessSize,
    hasEmployees,
    employeeEmails,
  } = body;

  if (!name || !surname || !email || !password || !businessName || !industry) {
    return NextResponse.json(
      { error: "Missing required registration fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data?.user) {
    return NextResponse.json(
      { error: error?.message || "Unable to create user" },
      { status: error?.status ?? 400 }
    );
  }

  const userId = data.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    name,
    surname,
    email,
    role: role === "owner" ? "owner" : "employee",
    password_changed: false,
  });

  if (profileError) {
    console.error("Profile insertion error:", profileError);
    return NextResponse.json(
      { error: profileError.message || "Unable to save user profile" },
      { status: 500 }
    );
  }

  if (businessName && industry) {
    const { error: businessError } = await supabase.from("businesses").insert({
      user_id: userId,
      business_name: businessName,
      industry,
      business_size: businessSize || "Just me (Solo)",
    });

    if (businessError) {
      console.error("Business insertion error:", businessError);
    }
  }

  if (hasEmployees === "yes" && employeeEmails) {
    const emails = employeeEmails
      .split(",")
      .map((email: string) => email.trim())
      .filter((email: string) => email.length > 0);

    if (emails.length > 0) {
      const { error: employeeError } = await supabase.from("employees").insert(
        emails.map((email: string) => ({
          business_owner_id: userId,
          email,
        }))
      );

      if (employeeError) {
        console.error("Employee insertion error:", employeeError);
      }
    }
  }

  return NextResponse.json({
    success: true,
    user: { id: userId, email, name, role: role === "owner" ? "owner" : "employee" },
  });
}
