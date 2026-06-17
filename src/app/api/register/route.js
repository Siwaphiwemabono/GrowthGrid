import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvslygkrqxpaytdkheqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c2x5Z2tycXhwYXl0ZGtoZXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjM5NTIsImV4cCI6MjA5NjgzOTk1Mn0.xpGKqWOIp29S3r27XGu2X4I3KEzDL1Urm72NJE-Vdxg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req) {
  console.log("📝 ===== REGISTRATION START =====");
  
  try {
    const body = await req.json();
    console.log("📧 Email:", body.email);
    console.log("👤 Name:", body.name);
    console.log("🔑 Password provided:", body.password ? "YES (length: " + body.password.length + ")" : "NO");
    
    const {
      name,
      surname,
      email,
      password,
      businessName,
      industry,
      businessSize,
      hasEmployees,
      employeeEmails,
    } = body;

    // Validate required fields
    if (!name || !surname || !email || !password || !businessName || !industry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Generate a unique ID for the user
    const userId = crypto.randomUUID();

    // 1. Create profile with ALL fields
    const insertData = {
      id: userId,
      name: name,
      surname: surname,
      email: email,
      password: password, // This is the password from the register page
      password_changed: false,
      role: "owner",
    };

    console.log("📝 Inserting profile:", { 
      ...insertData, 
      password: "***HIDDEN***" 
    });

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .insert(insertData)
      .select();

    if (profileError) {
      console.error("❌ Profile insert error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    console.log("✅ Profile created successfully!");
    console.log("🔑 Password in DB:", profileData?.[0]?.password ? "✅ YES" : "❌ NO");

    // 2. Insert into businesses table
    if (businessName) {
      const { error: businessError } = await supabase.from("businesses").insert({
        user_id: userId,
        business_name: businessName,
        industry: industry,
        business_size: businessSize || "Just me (Solo)",
      });

      if (businessError) {
        console.error("Business error:", businessError);
      }
    }

    // 3. Insert employees if any
    if (hasEmployees === "yes" && employeeEmails && employeeEmails.trim()) {
      const emails = employeeEmails
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (emails.length > 0) {
        const employeesData = emails.map((email) => ({
          business_owner_id: userId,
          email: email,
        }));

        const { error: empError } = await supabase
          .from("employees")
          .insert(employeesData);

        if (empError) {
          console.error("Employee error:", empError);
        }
      }
    }

    console.log("✅ Registration successful for user:", userId);
    
    return NextResponse.json({
      success: true,
      message: "Registration successful! Please log in.",
      userId: userId,
    });
    
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "API is working! Use POST to register." });
}